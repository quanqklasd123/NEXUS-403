// src/pages/AppBuilderPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, MouseSensor } from '@dnd-kit/core';
import { FiX, FiUploadCloud } from 'react-icons/fi';
import apiService from '../services/apiService';
import { useNavigate, useParams } from 'react-router-dom';
import PropertiesPanel from '../components/builder/PropertiesPanel';
import Toolbox from '../components/builder/Toolbox';
import CanvasArea from '../components/builder/CanvasArea';
import CanvasToolbar from '../components/builder/CanvasToolbar';
import { useAppBuilderHistory } from '../hooks/useAppBuilderHistory';
import { getCategoryByType } from '../utils/getCategoryByType';
import { useSidebar } from '../contexts/SidebarContext';

// --- MAIN PAGE ---
function AppBuilderPage() {
    const { isSidebarOpen } = useSidebar(); // Lấy trạng thái sidebar từ context
    const [canvasItems, setCanvasItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState('all');
    
    // State Management for App Builder (global state for conditions)
    // eslint-disable-next-line no-unused-vars
    const [appState, setAppState] = useState({
        user: {
            role: 'user',
            isLoggedIn: true,
            name: 'User'
        },
        formData: {
            isValid: false,
            submitText: 'Submit'
        }
    });
    
    // History management hook
    const {
        saveToHistory,
        handleUndo,
        handleRedo,
        initializeHistory,
        canUndo,
        canRedo
    } = useAppBuilderHistory(canvasItems);
    
    const [projectInfo, setProjectInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    
    const navigate = useNavigate();
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [publishData, setPublishData] = useState({ name: '', description: '', category: 'Template', price: '' });

    // Get appId or projectId from params (for editing existing app)
    const { appId, projectId } = useParams();
    const id = appId || projectId; // Support both route patterns

    // Load project data
    useEffect(() => {
        const fetchProject = async () => {
            // If no id, start with blank canvas
            if (!id) {
                setLoading(false);
                setProjectInfo({ name: 'Untitled App', description: '' });
                initializeHistory([]);
                return;
            }
            
            try {
                setLoading(true);
                const response = await apiService.getProject(id);
                const project = response.data;
                setProjectInfo(project);
                if (project.jsonData) {
                    try {
                        const items = JSON.parse(project.jsonData);
                        // Migrate old items to new structure (backward compatibility)
                        const migratedItems = items.map(item => ({
                            ...item,
                            name: item.name || item.type,
                            metadata: item.metadata || {
                                category: getCategoryByType(item.type),
                                tags: [],
                                notes: '',
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                version: 1
                            },
                            parentId: item.parentId || null,
                            children: item.children || [],
                            order: item.order || 0
                        }));
                        setCanvasItems(migratedItems);
                        initializeHistory(migratedItems);
                    } catch (e) {
                        console.error("Lỗi parse JSON:", e);
                        setCanvasItems([]);
                    }
                }
                setPublishData(prev => ({
                    ...prev,
                    name: project.name,
                    description: project.description || ''
                }));
            } catch (error) {
                console.error("Lỗi tải Project:", error);
                alert("Không thể tải dự án.");
                navigate('/app-builder');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id, navigate, initializeHistory]);

    // Sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Handle drag and drop
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) {
            // Nếu thả ra ngoài, không làm gì cả
            return;
        }
        
        const toolData = active.data.current;
        const activeId = active.id;
        
        // Nếu đang kéo component từ toolbox (có toolData và không phải là component ID)
        if (toolData && !activeId.startsWith('comp-')) {
            // Xác định parentId và order
            let parentId = null;
            let order = 0;

            if (over.id === 'canvas-area') {
                // Thêm vào root level với vị trí tự do
                parentId = null;
                order = canvasItems.filter(item => !item.parentId).length;
            } else if (over.id.startsWith('comp-')) {
                // Thêm vào container/row/grid
                const parentItem = canvasItems.find(i => i.id === over.id);
                if (parentItem && (parentItem.type === 'container' || parentItem.type === 'row' || parentItem.type === 'grid')) {
                    parentId = parentItem.id;
                    order = (parentItem.children || []).length;
                } else {
                    // Nếu không phải container/row/grid, thêm vào root
                    parentId = null;
                    order = canvasItems.filter(item => !item.parentId).length;
                }
            }

            const newItem = { 
                id: `comp-${Date.now()}`, 
                name: toolData.label || toolData.type,
                type: toolData.type,
                metadata: {
                    category: getCategoryByType(toolData.type),
                    tags: [],
                    notes: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    version: 1
                },
                parentId: parentId,
                children: [],
                order: order,
                position: null, // Không cần position nữa, dùng flow layout
                props: { 
                    ...(toolData.defaultProps || {}),
                    events: (toolData.defaultProps?.events || {})
                },
                style: { 
                    ...(toolData.defaultStyle || {}),
                    width: toolData.defaultStyle?.width || '100%',
                    height: toolData.defaultStyle?.height || 'auto'
                }
            };

            setCanvasItems((prev) => {
                // Đảm bảo không mất component nào
                const newItems = [...prev, newItem];
                
                // Cập nhật children của parent nếu có
                if (parentId) {
                    const parentIndex = newItems.findIndex(i => i.id === parentId);
                    if (parentIndex !== -1) {
                        newItems[parentIndex] = {
                            ...newItems[parentIndex],
                            children: [...(newItems[parentIndex].children || []), newItem.id]
                        };
                    }
                }
                
                // Debug: Kiểm tra số lượng items (có thể comment lại sau)
                // console.log('Added new item:', { newItemId: newItem.id, totalItems: newItems.length, parentId });
                
                // Lưu history sau khi thêm component
                saveToHistory(newItems);
                return newItems;
            });
        } 
        // Nếu đang di chuyển component trong canvas (không có toolData)
        else if (active.id.startsWith('comp-')) {
            setCanvasItems((prev) => {
                const activeItem = prev.find(i => i.id === active.id);
                if (!activeItem) {
                    console.warn('Cannot find activeItem:', { activeId: active.id });
                    return prev;
                }

                // Deep copy để đảm bảo không mất reference
                const newItems = prev.map(item => ({
                    ...item,
                    metadata: item.metadata ? { ...item.metadata } : undefined,
                    props: item.props ? { ...item.props } : undefined,
                    style: item.style ? { ...item.style } : undefined,
                    children: item.children ? [...item.children] : [],
                    position: null // Không dùng position nữa, dùng flow layout
                }));

                // Validation: Đảm bảo số lượng items không thay đổi
                if (newItems.length !== prev.length) {
                    console.error('ERROR: Số lượng items thay đổi!', { 
                        before: prev.length, 
                        after: newItems.length
                    });
                    return prev;
                }

                // Trường hợp 1: Di chuyển component về root (canvas-area)
                if (over.id === 'canvas-area') {
                    // Xóa khỏi parent cũ nếu có
                    if (activeItem.parentId) {
                        const oldParentIndex = newItems.findIndex(i => i.id === activeItem.parentId);
                        if (oldParentIndex !== -1) {
                            newItems[oldParentIndex] = {
                                ...newItems[oldParentIndex],
                                children: (newItems[oldParentIndex].children || []).filter(id => id !== active.id)
                            };
                        }
                    }

                    // Tính order mới (thêm vào cuối root items)
                    const rootItems = newItems.filter(item => !item.parentId);
                    const newOrder = rootItems.length;

                    // Cập nhật activeItem
                    const activeIndex = newItems.findIndex(i => i.id === active.id);
                    if (activeIndex !== -1) {
                        newItems[activeIndex] = {
                            ...newItems[activeIndex],
                            parentId: null,
                            order: newOrder
                        };
                    }

                    saveToHistory(newItems);
                    return newItems;
                }
                // Trường hợp 2: Di chuyển component vào component khác
                else if (over.id.startsWith('comp-')) {
                    const overItem = newItems.find(i => i.id === over.id);
                    if (!overItem) {
                        console.warn('Cannot find overItem:', { overId: over.id });
                        return prev;
                    }

                    // Trường hợp 2a: Kéo vào container/row/grid
                    if (overItem.type === 'container' || overItem.type === 'row' || overItem.type === 'grid') {
                        // Không cho phép kéo component vào chính nó hoặc vào children của nó
                        const isDescendant = (itemId, ancestorId) => {
                            const item = newItems.find(i => i.id === itemId);
                            if (!item || !item.parentId) return false;
                            if (item.parentId === ancestorId) return true;
                            return isDescendant(item.parentId, ancestorId);
                        };

                        if (active.id === over.id || isDescendant(over.id, active.id)) {
                            console.warn('Cannot move component into itself or its descendant');
                            return prev;
                        }

                        const newParentId = overItem.id;
                        const newOrder = (overItem.children || []).length;

                        // Xóa khỏi parent cũ nếu có
                        if (activeItem.parentId) {
                            const oldParentIndex = newItems.findIndex(i => i.id === activeItem.parentId);
                            if (oldParentIndex !== -1) {
                                newItems[oldParentIndex] = {
                                    ...newItems[oldParentIndex],
                                    children: (newItems[oldParentIndex].children || []).filter(id => id !== active.id)
                                };
                            }
                        }

                        // Thêm vào parent mới
                        const newParentIndex = newItems.findIndex(i => i.id === newParentId);
                        if (newParentIndex !== -1) {
                            newItems[newParentIndex] = {
                                ...newItems[newParentIndex],
                                children: [...(newItems[newParentIndex].children || []), active.id]
                            };
                        }

                        // Cập nhật activeItem
                        const activeIndex = newItems.findIndex(i => i.id === active.id);
                        if (activeIndex !== -1) {
                            newItems[activeIndex] = {
                                ...newItems[activeIndex],
                                parentId: newParentId,
                                order: newOrder
                            };
                        }

                        saveToHistory(newItems);
                        return newItems;
                    }
                    // Trường hợp 2b: Reorder trong cùng parent (root hoặc container)
                    else {
                        // Nếu cả hai đều ở root level
                        if (!activeItem.parentId && !overItem.parentId) {
                            const rootItems = newItems.filter(item => !item.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
                            const activeIndex = rootItems.findIndex(c => c.id === active.id);
                            const overIndex = rootItems.findIndex(c => c.id === over.id);

                            if (activeIndex === -1 || overIndex === -1) {
                                console.warn('Cannot find active or over in root items');
                                return prev;
                            }

                            // Reorder root items
                            const newRootItems = [...rootItems];
                            const [removed] = newRootItems.splice(activeIndex, 1);
                            newRootItems.splice(overIndex, 0, removed);

                            // Cập nhật order của tất cả root items
                            newRootItems.forEach((item, index) => {
                                const itemIndex = newItems.findIndex(i => i.id === item.id);
                                if (itemIndex !== -1) {
                                    newItems[itemIndex] = {
                                        ...newItems[itemIndex],
                                        order: index
                                    };
                                }
                            });

                            saveToHistory(newItems);
                            return newItems;
                        }
                        // Nếu cả hai đều có cùng parent (trong container)
                        else if (activeItem.parentId === overItem.parentId && activeItem.parentId) {
                            const parentId = activeItem.parentId;
                            const parent = newItems.find(i => i.id === parentId);
                            if (!parent || !parent.children) {
                                console.warn('Parent not found or has no children:', { parentId });
                                return prev;
                            }

                            const children = parent.children.map(id => newItems.find(i => i.id === id)).filter(Boolean);
                            const activeIndex = children.findIndex(c => c.id === active.id);
                            const overIndex = children.findIndex(c => c.id === over.id);

                            if (activeIndex === -1 || overIndex === -1) {
                                console.warn('Cannot find active or over in children:', { activeIndex, overIndex });
                                return prev;
                            }

                            // Reorder
                            const newChildren = [...children];
                            const [removed] = newChildren.splice(activeIndex, 1);
                            newChildren.splice(overIndex, 0, removed);

                            // Cập nhật order của tất cả children
                            newChildren.forEach((child, index) => {
                                const childIndex = newItems.findIndex(i => i.id === child.id);
                                if (childIndex !== -1) {
                                    newItems[childIndex] = {
                                        ...newItems[childIndex],
                                        order: index
                                    };
                                }
                            });

                            // Cập nhật parent's children array
                            const parentIndex = newItems.findIndex(i => i.id === parentId);
                            if (parentIndex !== -1) {
                                newItems[parentIndex] = {
                                    ...newItems[parentIndex],
                                    children: newChildren.map(c => c.id)
                                };
                            }

                            saveToHistory(newItems);
                            return newItems;
                        }
                        // Trường hợp 2c: Di chuyển từ container này sang container khác (sibling)
                        else if (activeItem.parentId && overItem.parentId && activeItem.parentId !== overItem.parentId) {
                            const newParentId = overItem.parentId;
                            const newParent = newItems.find(i => i.id === newParentId);
                            
                            if (!newParent || (newParent.type !== 'container' && newParent.type !== 'row' && newParent.type !== 'grid')) {
                                console.warn('New parent is not a container/row/grid');
                                return prev;
                            }

                            const newOrder = (newParent.children || []).length;

                            // Xóa khỏi parent cũ
                            const oldParentIndex = newItems.findIndex(i => i.id === activeItem.parentId);
                            if (oldParentIndex !== -1) {
                                newItems[oldParentIndex] = {
                                    ...newItems[oldParentIndex],
                                    children: (newItems[oldParentIndex].children || []).filter(id => id !== active.id)
                                };
                            }

                            // Thêm vào parent mới
                            const newParentIndex = newItems.findIndex(i => i.id === newParentId);
                            if (newParentIndex !== -1) {
                                newItems[newParentIndex] = {
                                    ...newItems[newParentIndex],
                                    children: [...(newItems[newParentIndex].children || []), active.id]
                                };
                            }

                            // Cập nhật activeItem
                            const activeIndex = newItems.findIndex(i => i.id === active.id);
                            if (activeIndex !== -1) {
                                newItems[activeIndex] = {
                                    ...newItems[activeIndex],
                                    parentId: newParentId,
                                    order: newOrder
                                };
                            }

                            saveToHistory(newItems);
                            return newItems;
                        }
                    }
                }

                // Nếu không match bất kỳ điều kiện nào, giữ nguyên
                console.warn('No matching drag condition:', { 
                    activeId: active.id, 
                    overId: over.id,
                    activeParentId: activeItem?.parentId,
                    overType: newItems.find(i => i.id === over.id)?.type
                });
                return prev;
            });
        }
        // Không tự động chọn component khi kéo vào - chỉ chọn khi click vào component
    };

    // Handle item updates
    const handleUpdateItem = (id, updatedItem) => {
        setCanvasItems(prev => {
            const newItems = prev.map(item => item.id === id ? updatedItem : item);
            // Lưu history khi cập nhật
            saveToHistory(newItems);
            return newItems;
        });
    };
    
    // Handle item deletion
    const handleDeleteItem = (id) => {
        setCanvasItems(prev => {
            const itemToDelete = prev.find(item => item.id === id);
            if (!itemToDelete) return prev;
            
            // Xóa tất cả children (recursive)
            const deleteItemAndChildren = (itemId) => {
                const item = prev.find(i => i.id === itemId);
                if (!item) return [];
                
                const idsToDelete = [itemId];
                if (item.children && item.children.length > 0) {
                    item.children.forEach(childId => {
                        idsToDelete.push(...deleteItemAndChildren(childId));
                    });
                }
                return idsToDelete;
            };
            
            const idsToDelete = deleteItemAndChildren(id);
            const newItems = prev.filter(item => !idsToDelete.includes(item.id));
            
            // Cập nhật parent's children nếu có
            if (itemToDelete.parentId) {
                const parentIndex = newItems.findIndex(i => i.id === itemToDelete.parentId);
                if (parentIndex !== -1) {
                    newItems[parentIndex] = {
                        ...newItems[parentIndex],
                        children: (newItems[parentIndex].children || []).filter(childId => childId !== id)
                    };
                }
            }
            
            // Lưu history sau khi xóa component
            saveToHistory(newItems);
            return newItems;
        });
        setSelectedId(null);
    };

    // Handle save
    const handleSave = async () => {
        if (!id) {
            // TODO: Create new app if no id
            alert("Vui lòng tạo app mới trước khi lưu!");
            return;
        }
        setSaving(true);
        try {
            const updateDto = {
                name: projectInfo.name,
                description: projectInfo.description,
                jsonData: JSON.stringify(canvasItems)
            };
            await apiService.updateProject(id, updateDto);
            alert("Đã lưu thành công!");
        } catch (error) {
            console.error("Lỗi lưu:", error);
            alert("Lỗi khi lưu dự án.");
        } finally {
            setSaving(false);
        }
    };

    // Handle publish
    const handlePublish = async (e) => {
        e.preventDefault();
        if (!id) {
            alert("Vui lòng lưu app trước khi xuất bản!");
            return;
        }

        setPublishing(true);
        try {
            await apiService.publishProject(id, { ...publishData });
            alert("Đã xuất bản ứng dụng thành công lên Marketplace!");
            setIsPublishModalOpen(false);
            navigate('/marketplace');
        } catch (error) {
            console.error("Lỗi publish:", error);
            alert("Không thể xuất bản ứng dụng.");
        } finally {
            setPublishing(false);
        }
    };

    // Preview mode handlers
    const handleEnterPreview = () => {
        setIsPreviewMode(true);
        setSelectedId(null);
    };

    const handleExitPreview = () => {
        setIsPreviewMode(false);
    };

    // Undo/Redo handlers với setCanvasItems
    const onUndo = useCallback(() => {
        const snapshot = handleUndo();
        if (snapshot) {
            setCanvasItems(snapshot);
            setSelectedId(null);
        }
    }, [handleUndo]);

    const onRedo = useCallback(() => {
        const snapshot = handleRedo();
        if (snapshot) {
            setCanvasItems(snapshot);
            setSelectedId(null);
        }
    }, [handleRedo]);

    // Keyboard shortcuts cho Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+Z hoặc Cmd+Z (Mac) - Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) {
                    onUndo();
                }
            }
            // Ctrl+Y hoặc Ctrl+Shift+Z - Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (canRedo) {
                    onRedo();
                }
            }
            // ESC - Exit Preview
            if (e.key === 'Escape' && isPreviewMode) {
                handleExitPreview();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, onUndo, onRedo, isPreviewMode]);

    const selectedItem = canvasItems.find(i => i.id === selectedId);

    if (loading) return <div className="p-10 text-center">Đang tải dự án...</div>;

    // Tính toán margin-left dựa trên trạng thái sidebar (w-72 = 288px)
    const sidebarWidth = 288; // 72 * 4px = 288px
    const marginLeft = isSidebarOpen ? sidebarWidth : 0;

    return (
        <div 
            className="fixed inset-0 left-0 right-0 top-0 bottom-0 transition-all duration-300 ease-in-out" 
            style={{ 
                margin: 0, 
                padding: 0, 
                zIndex: 1,
                marginLeft: `${marginLeft}px`
            }}
        >
            <DndContext 
                sensors={sensors}
                onDragEnd={isPreviewMode ? undefined : handleDragEnd}
            >
                <div className="flex flex-col h-screen w-full bg-white overflow-hidden" style={{ margin: 0, padding: 0 }}>
                
                {/* MAIN CONTENT AREA */}
                <div className="flex flex-1 overflow-hidden">
                    {/* CENTER: Canvas */}
                    <div className={`flex-1 bg-white flex flex-col relative overflow-hidden ${isPreviewMode ? 'w-full' : ''}`}>
                        {/* Canvas Toolbar */}
                        <CanvasToolbar
                            projectInfo={projectInfo}
                            isPreviewMode={isPreviewMode}
                            onEnterPreview={handleEnterPreview}
                            onExitPreview={handleExitPreview}
                            onSave={handleSave}
                            saving={saving}
                            onPublish={() => setIsPublishModalOpen(true)}
                            onUndo={onUndo}
                            onRedo={onRedo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                        />
                        
                        {/* Canvas Area */}
                        <div className="flex-1 overflow-auto w-full h-full">
                            <CanvasArea 
                                items={canvasItems} 
                                selectedId={selectedId} 
                                onSelectItem={setSelectedId} 
                                isPreview={isPreviewMode} 
                                navigate={navigate}
                                searchQuery={searchQuery}
                                filterTag={filterTag}
                                context={appState}
                            />
                        </div>
                    </div>

                    {/* RIGHT: Properties Panel - Chỉ hiển thị khi có component được chọn */}
                    {!isPreviewMode && (
                        <div className={`bg-white border-l border-neutral-200 flex flex-col z-10 transition-all duration-300 ease-in-out overflow-hidden ${
                            selectedId && selectedItem ? 'w-80' : 'w-0 border-l-0'
                        }`}>
                            {selectedItem && (
                                <div className="w-80 h-full">
                                    <PropertiesPanel 
                                        selectedItem={selectedItem} 
                                        onUpdateItem={handleUpdateItem} 
                                        onDeleteItem={(id) => {
                                            handleDeleteItem(id);
                                            setSelectedId(null);
                                        }}
                                        allItems={canvasItems}
                                        onClose={() => setSelectedId(null)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* BOTTOM: Toolbox - Ẩn trong preview mode */}
                {!isPreviewMode && (
                    <Toolbox 
                        canvasItems={canvasItems}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        filterTag={filterTag}
                        setFilterTag={setFilterTag}
                    />
                )}
            </div>

            {/* Modal Publish */}
            {isPublishModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-neutral-200 animation-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-neutral-800">Publish to Marketplace</h3>
                            <button onClick={() => setIsPublishModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-full">
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handlePublish} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">App Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none" 
                                    value={publishData.name} 
                                    onChange={e => setPublishData({...publishData, name: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                                <textarea 
                                    required 
                                    rows="3" 
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none" 
                                    value={publishData.description} 
                                    onChange={e => setPublishData({...publishData, description: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                                    <select 
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none" 
                                        value={publishData.category} 
                                        onChange={e => setPublishData({...publishData, category: e.target.value})}
                                    >
                                        <option>Template</option>
                                        <option>Module</option>
                                        <option>Component</option>
                                        <option>Automation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Price (Optional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Free" 
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none" 
                                        value={publishData.price} 
                                        onChange={e => setPublishData({...publishData, price: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsPublishModalOpen(false)} 
                                    className="flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={publishing} 
                                    className="flex-1 py-2.5 bg-sage-500 text-white font-medium rounded-xl hover:bg-sage-600 shadow-lg shadow-sage-500/20"
                                >
                                    {publishing ? 'Publishing...' : 'Publish App'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </DndContext>
        </div>
    );
}

export default AppBuilderPage;
