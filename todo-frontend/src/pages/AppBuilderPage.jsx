// src/pages/AppBuilderPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { DndContext } from '@dnd-kit/core';
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
    
    const { projectId } = useParams();
    const [projectInfo, setProjectInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    
    const navigate = useNavigate();
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [publishData, setPublishData] = useState({ name: '', description: '', category: 'Template', price: '' });

    // Load project data
    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) return;
            try {
                setLoading(true);
                const response = await apiService.getProject(projectId);
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
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId, navigate, initializeHistory]);

    // Handle drag and drop
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;
        
        const toolData = active.data.current;
        if (!toolData) return;

        // Xác định parentId và order
        let parentId = null;
        let order = 0;

        if (over.id === 'canvas-area') {
            // Thêm vào root level
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
            props: { 
                ...toolData.defaultProps,
                events: toolData.defaultProps.events || {}
            },
            style: { ...toolData.defaultStyle }
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
        setSelectedId(newItem.id);
    };

    // Handle item updates
    const handleUpdateItem = (id, updatedItem) => {
        setCanvasItems(prev => prev.map(item => item.id === id ? updatedItem : item));
        // History sẽ được lưu tự động qua useAppBuilderHistory hook
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
        if (!projectId) return;
        setSaving(true);
        try {
            const updateDto = {
                name: projectInfo.name,
                description: projectInfo.description,
                jsonData: JSON.stringify(canvasItems)
            };
            await apiService.updateProject(projectId, updateDto);
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
        if (!projectId) return;

        setPublishing(true);
        try {
            await apiService.publishProject(projectId, { ...publishData });
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
        <DndContext onDragEnd={isPreviewMode ? undefined : handleDragEnd}>
            <div className="flex h-[calc(100vh-6rem)] bg-neutral-100 overflow-hidden border border-neutral-200 rounded-xl shadow-sm m-[-24px]">
                
                {/* LEFT: Toolbox - Ẩn trong preview mode */}
                {!isPreviewMode && (
                    <Toolbox 
                        canvasItems={canvasItems}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        filterTag={filterTag}
                        setFilterTag={setFilterTag}
                    />
                )}

                {/* CENTER: Canvas */}
                <div className={`flex-1 bg-neutral-100 flex flex-col relative overflow-hidden ${isPreviewMode ? 'w-full' : ''}`}>
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
                    <div className="flex-1 p-10 overflow-auto flex justify-center items-start">
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

                {/* RIGHT: Properties Panel - Ẩn trong preview mode */}
                {!isPreviewMode && (
                    <div className="w-80 bg-white border-l border-neutral-200 flex flex-col z-10">
                        <PropertiesPanel 
                            selectedItem={selectedItem} 
                            onUpdateItem={handleUpdateItem} 
                            onDeleteItem={handleDeleteItem}
                            allItems={canvasItems}
                        />
                    </div>
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
    );
}

export default AppBuilderPage;
