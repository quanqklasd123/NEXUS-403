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

// --- MAIN PAGE ---
function AppBuilderPage() {
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

    // Get appId from params (for editing existing app)
    const { appId } = useParams();

    // Load project data
    useEffect(() => {
        const fetchProject = async () => {
            // If no appId, start with blank canvas
            if (!appId) {
                setLoading(false);
                setProjectInfo({ name: 'Untitled App', description: '' });
                initializeHistory([]);
                return;
            }
            
            try {
                setLoading(true);
                const response = await apiService.getProject(appId);
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
    }, [appId, navigate, initializeHistory]);

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
        const { active, over, delta } = event;
        if (!over) return;
        
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
                // Thêm vào container
                const parentItem = canvasItems.find(i => i.id === over.id);
                if (parentItem && (parentItem.type === 'container' || parentItem.type === 'row' || parentItem.type === 'grid')) {
                    parentId = parentItem.id;
                    order = (parentItem.children || []).length;
                } else {
                    // Nếu không phải container, thêm vào root
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
                
                // Lưu history sau khi thêm component
                saveToHistory(newItems);
                return newItems;
            });
        } 
        // Nếu đang di chuyển component trên canvas (không có toolData)
        else if (active.id.startsWith('comp-') && over.id === 'canvas-area' && delta) {
            const itemId = active.id;
            const item = canvasItems.find(i => i.id === itemId);
            
            if (item && !item.parentId) {
                // Lấy vị trí ban đầu từ active.rect và cộng với delta
                const canvasElement = document.getElementById('canvas-area');
                if (canvasElement && active.rect) {
                    const canvasRect = canvasElement.getBoundingClientRect();
                    const initialX = active.rect.left - canvasRect.left;
                    const initialY = active.rect.top - canvasRect.top;
                    
                    const newPosition = {
                        x: Math.max(0, initialX + delta.x),
                        y: Math.max(0, initialY + delta.y)
                    };
                    
                    setCanvasItems((prev) => {
                        const newItems = prev.map(i => 
                            i.id === itemId 
                                ? { ...i, position: newPosition }
                                : i
                        );
                        saveToHistory(newItems);
                        return newItems;
                    });
                } else {
                    // Fallback: sử dụng position hiện tại + delta
                    const currentPosition = item.position || { x: 0, y: 0 };
                    const newPosition = {
                        x: Math.max(0, currentPosition.x + delta.x),
                        y: Math.max(0, currentPosition.y + delta.y)
                    };
                    
                    setCanvasItems((prev) => {
                        const newItems = prev.map(i => 
                            i.id === itemId 
                                ? { ...i, position: newPosition }
                                : i
                        );
                        saveToHistory(newItems);
                        return newItems;
                    });
                }
            }
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
        if (!appId) {
            // TODO: Create new app if no appId
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
            await apiService.updateProject(appId, updateDto);
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
        if (!appId) {
            alert("Vui lòng lưu app trước khi xuất bản!");
            return;
        }

        setPublishing(true);
        try {
            await apiService.publishProject(appId, { ...publishData });
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

    return (
        <div className="fixed inset-0 left-0 right-0 top-0 bottom-0" style={{ margin: 0, padding: 0, zIndex: 1 }}>
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
