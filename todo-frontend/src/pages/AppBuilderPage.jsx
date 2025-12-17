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
    const [searchQuery] = useState('');
    const [filterTag] = useState('all');
    
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
    const [publishData, setPublishData] = useState({ name: '', description: '', category: '', price: '' });
    const [categories, setCategories] = useState([]);

    // Get appId or projectId from params (for editing existing app)
    const { appId, projectId } = useParams();
    const id = appId || projectId; // Support both route patterns

    // Load categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiService.getCategories();
                const loadedCategories = response.data || [];
                setCategories(loadedCategories);
                
                // Set default category to first available category
                if (loadedCategories.length > 0) {
                    setPublishData(prev => ({ 
                        ...prev, 
                        category: prev.category || loadedCategories[0].name 
                    }));
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                // Fallback to default categories if API fails
                setCategories([]);
            }
        };
        fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // Handle position change (from DraggableResizable)
    const handlePositionChange = useCallback((itemId, x, y) => {
        setCanvasItems((prev) => {
            const item = prev.find(i => i.id === itemId);
            // Chỉ update position cho root components (không có parentId)
            // Components trong layout không nên có position (dùng flow layout)
            if (!item || item.parentId) {
                return prev; // Không update nếu là component trong layout
            }
            
            const newItems = prev.map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        position: { x, y },
                        style: {
                            ...item.style,
                            left: `${x}px`,
                            top: `${y}px`
                        }
                    };
                }
                return item;
            });
            saveToHistory(newItems);
            return newItems;
        });
    }, [saveToHistory]);

    // Handle size change (from DraggableResizable)
    const handleSizeChange = useCallback((itemId, width, height, x, y) => {
        setCanvasItems((prev) => {
            const item = prev.find(i => i.id === itemId);
            // Chỉ update position cho root components (không có parentId)
            // Components trong layout không nên có position (dùng flow layout)
            if (!item || item.parentId) {
                // Nếu là component trong layout, chỉ update size, không update position
                const newItems = prev.map(item => {
                    if (item.id === itemId) {
                        return {
                            ...item,
                            style: {
                                ...item.style,
                                width: `${width}px`,
                                height: `${height}px`
                                // Không set left/top cho layout children
                            }
                        };
                    }
                    return item;
                });
                saveToHistory(newItems);
                return newItems;
            }
            
            // Root component: update cả position và size
            const newItems = prev.map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        position: { x, y },
                        style: {
                            ...item.style,
                            width: `${width}px`,
                            height: `${height}px`,
                            left: `${x}px`,
                            top: `${y}px`
                        }
                    };
                }
                return item;
            });
            saveToHistory(newItems);
            return newItems;
        });
    }, [saveToHistory]);

    // Handle drag and drop
    // Helper: Tính toán kích thước component từ defaultStyle
    const calculateComponentSize = (type, defaultStyle) => {
        // Control components có kích thước cố định
        const controlSizes = {
            'button': { width: 120, height: 40 },
            'checkbox': { width: 150, height: 30 },
            'addTaskButton': { width: 140, height: 40 },
            'databaseTitle': { width: 300, height: 50 },
            'input': { width: 250, height: 40 }
        };

        if (controlSizes[type]) {
            return controlSizes[type];
        }

        const defaultWidth = defaultStyle?.width || 400;
        const defaultHeight = defaultStyle?.height || 200;

        let width = 400;
        let height = 200;

        // Parse width
        if (typeof defaultWidth === 'string') {
            if (defaultWidth.includes('px')) {
                width = parseInt(defaultWidth) || 400;
            } else if (defaultWidth === '100%') {
                width = 400; // Default for 100% width
            } else if (defaultWidth === 'auto') {
                width = 150;
            }
        } else {
            width = defaultWidth;
        }

        // Parse height
        if (typeof defaultHeight === 'string') {
            if (defaultHeight.includes('px')) {
                height = parseInt(defaultHeight) || 200;
            } else if (defaultHeight === 'auto') {
                height = 40;
            }
        } else {
            height = defaultHeight;
        }

        return { width, height };
    };

    // Helper: Tạo component mới từ toolbox
    const createComponentFromTool = (toolData, parentId, order, position) => {
        // Lấy toolType từ toolData.toolType (component type thực sự)
        // toolData.type sẽ là 'tool' để identify từ toolbox
        const toolType = toolData.toolType;
        if (!toolType) {
            console.error('Missing toolType in toolData:', toolData);
            return null;
        }
        const size = calculateComponentSize(toolType, toolData.defaultStyle);

        // Base style từ defaultStyle
        const baseStyle = {
            ...(toolData.defaultStyle || {}),
            width: `${size.width}px`,
            height: `${size.height}px`
        };

        // Nếu có position (root component), thêm left và top
        // Nếu không có position (layout child), không thêm left/top (dùng flow layout)
        if (position) {
            baseStyle.left = `${position.x}px`;
            baseStyle.top = `${position.y}px`;
        } else {
            // Layout child: đảm bảo không có left, top, position trong style
            delete baseStyle.left;
            delete baseStyle.top;
            delete baseStyle.position;
        }

        // Auto-assign visibleInViews for data components based on their type
        let defaultVisibleInViews = ['table', 'list', 'board', 'calendar']; // Default for non-data components
        if (toolType === 'taskTable') {
            defaultVisibleInViews = ['table'];
        } else if (toolType === 'taskList') {
            defaultVisibleInViews = ['list'];
        } else if (toolType === 'taskBoard') {
            defaultVisibleInViews = ['board'];
        } else if (toolType === 'taskCalendar') {
            defaultVisibleInViews = ['calendar'];
        }

        return {
            id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: toolData.label || toolType,
            type: toolType,
            metadata: {
                category: getCategoryByType(toolType),
                tags: [],
                notes: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: 1
            },
            parentId: parentId,
            children: [],
            order: order,
            position: position, // null nếu trong layout, object nếu root
            props: {
                ...(toolData.defaultProps || {}),
                visibleInViews: defaultVisibleInViews, // Auto-assign based on component type
                events: (toolData.defaultProps?.events || {})
            },
            style: baseStyle
        };
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) {
            return; // Thả ra ngoài, không làm gì
        }
        
        const toolData = active.data.current;
        const activeId = active.id;
        
        // === CASE 1: Kéo component từ Toolbox ===
        if (toolData && toolData.type === 'tool' && activeId.startsWith('tool-')) {
            // Xác định parent và position
            let parentId = null;
            let order = 0;
            let position = { x: 20, y: 20 };

            if (over.id === 'canvas-area') {
                // Thêm vào root level (canvas)
                parentId = null;
                order = canvasItems.filter(item => !item.parentId).length;
                // Tính position dựa trên drop location với snap to grid
                if (event.activatorEvent) {
                    const GRID_SIZE = 20;
                    // Get canvas inner element (actual container for components)
                    const canvasElement = document.getElementById('canvas-area');
                    if (canvasElement) {
                        const canvasRect = canvasElement.getBoundingClientRect();
                        const clientX = event.activatorEvent.clientX || 0;
                        const clientY = event.activatorEvent.clientY || 0;
                        
                        // Calculate position relative to canvas top-left
                        const relativeX = clientX - canvasRect.left;
                        const relativeY = clientY - canvasRect.top;
                        
                        position = {
                            x: Math.max(20, Math.round(relativeX / GRID_SIZE) * GRID_SIZE),
                            y: Math.max(20, Math.round(relativeY / GRID_SIZE) * GRID_SIZE)
                        };
                    }
                }
            } else if (over.id.startsWith('comp-')) {
                // Kiểm tra xem có phải layout component không (container, row, grid, viewArea)
                const parentItem = canvasItems.find(i => i.id === over.id);
                const isLayout = parentItem && ['container', 'row', 'grid', 'viewArea'].includes(parentItem.type);
                
                if (isLayout) {
                    // Thêm vào layout component
                    parentId = parentItem.id;
                    order = (parentItem.children || []).length;
                    // Không cần position khi ở trong layout (dùng flow layout)
                    position = null;
                } else {
                    // Không phải layout, thêm vào root
                    parentId = null;
                    order = canvasItems.filter(item => !item.parentId).length;
                    // Tính position với snap to grid
                    if (event.activatorEvent) {
                        const GRID_SIZE = 20;
                        // Get canvas element to calculate relative position
                        const canvasElement = document.getElementById('canvas-area');
                        if (canvasElement) {
                            const canvasRect = canvasElement.getBoundingClientRect();
                            const clientX = event.activatorEvent.clientX || 0;
                            const clientY = event.activatorEvent.clientY || 0;
                            
                            // Calculate position relative to canvas top-left
                            const relativeX = clientX - canvasRect.left;
                            const relativeY = clientY - canvasRect.top;
                            
                            position = {
                                x: Math.max(20, Math.round(relativeX / GRID_SIZE) * GRID_SIZE),
                                y: Math.max(20, Math.round(relativeY / GRID_SIZE) * GRID_SIZE)
                            };
                        }
                    }
                }
            }

            // Tạo component mới từ tool data
            const newItem = createComponentFromTool(toolData, parentId, order, position);
            
            // Kiểm tra nếu newItem null (có lỗi)
            if (!newItem) {
                console.error('Failed to create component from tool:', toolData);
                return;
            }

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
                // Chỉ xóa position cho layout children, giữ position cho root items
                const newItems = prev.map(item => {
                    const baseItem = {
                        ...item,
                        metadata: item.metadata ? { ...item.metadata } : undefined,
                        props: item.props ? { ...item.props } : undefined,
                        style: item.style ? { ...item.style } : undefined,
                        children: item.children ? [...item.children] : []
                    };
                    
                    // Layout children: đảm bảo position = null và xóa left/top từ style
                    if (item.parentId) {
                        const cleanStyle = { ...baseItem.style };
                        delete cleanStyle.left;
                        delete cleanStyle.top;
                        delete cleanStyle.position;
                        return {
                            ...baseItem,
                            position: null,
                            style: cleanStyle
                        };
                    }
                    
                    // Root items: giữ nguyên position
                    return baseItem;
                });

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

                    // Tính position mới dựa trên drop location
                    let newPosition = { x: 20, y: 20 };
                    if (event.over?.rect && event.activatorEvent) {
                        const rect = event.over.rect;
                        const clientX = event.activatorEvent.clientX || 0;
                        const clientY = event.activatorEvent.clientY || 0;
                        const GRID_SIZE = 20;
                        newPosition = {
                            x: Math.max(20, Math.round((clientX - rect.left) / GRID_SIZE) * GRID_SIZE),
                            y: Math.max(20, Math.round((clientY - rect.top) / GRID_SIZE) * GRID_SIZE)
                        };
                    }

                    // Cập nhật activeItem - thêm position cho root component
                    const activeIndex = newItems.findIndex(i => i.id === active.id);
                    if (activeIndex !== -1) {
                        const cleanStyle = { ...newItems[activeIndex].style };
                        // Xóa left/top cũ nếu có (từ layout)
                        delete cleanStyle.left;
                        delete cleanStyle.top;
                        delete cleanStyle.position;
                        
                        newItems[activeIndex] = {
                            ...newItems[activeIndex],
                            parentId: null,
                            order: newOrder,
                            position: newPosition,
                            style: {
                                ...cleanStyle,
                                left: `${newPosition.x}px`,
                                top: `${newPosition.y}px`
                            }
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

                        // Nếu component đã ở trong row/container này rồi, thì reorder thay vì thêm lại
                        if (activeItem.parentId === overItem.id) {
                            // Reorder trong cùng parent
                            const parentId = activeItem.parentId;
                            const parent = newItems.find(i => i.id === parentId);
                            if (!parent || !parent.children) {
                                console.warn('Parent not found or has no children:', { parentId });
                                return prev;
                            }

                            const children = parent.children.map(id => newItems.find(i => i.id === id)).filter(Boolean);
                            const activeIndex = children.findIndex(c => c.id === active.id);
                            const overIndex = children.findIndex(c => c.id === over.id);
                            
                            // Nếu drop vào component khác trong cùng layout, reorder theo vị trí của over component
                            // Nếu drop vào chính layout (over.id === parentId), giữ nguyên vị trí
                            let newOrder = activeIndex;
                            if (overIndex !== -1 && overIndex !== activeIndex) {
                                newOrder = overIndex;
                            }

                            // Reorder
                            const newChildren = [...children];
                            const [removed] = newChildren.splice(activeIndex, 1);
                            newChildren.splice(newOrder, 0, removed);

                            // Cập nhật order và đảm bảo position = null cho layout children
                            newChildren.forEach((child, index) => {
                                const childIndex = newItems.findIndex(i => i.id === child.id);
                                if (childIndex !== -1) {
                                    newItems[childIndex] = {
                                        ...newItems[childIndex],
                                        order: index,
                                        position: null, // Layout children không có position
                                        style: {
                                            ...newItems[childIndex].style,
                                            // Xóa left và top nếu có (layout children dùng flow layout)
                                            left: undefined,
                                            top: undefined,
                                            position: undefined
                                        }
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

                        // Nếu component chưa ở trong row/container này, thêm vào
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

                        // Cập nhật activeItem - đảm bảo position = null cho layout children
                        const activeIndex = newItems.findIndex(i => i.id === active.id);
                        if (activeIndex !== -1) {
                            newItems[activeIndex] = {
                                ...newItems[activeIndex],
                                parentId: newParentId,
                                order: newOrder,
                                position: null, // Layout children không có position
                                style: {
                                    ...newItems[activeIndex].style,
                                    // Xóa left và top nếu có (layout children dùng flow layout)
                                    left: undefined,
                                    top: undefined,
                                    position: undefined
                                }
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

                            // Cập nhật order và đảm bảo position = null cho layout children
                            newChildren.forEach((child, index) => {
                                const childIndex = newItems.findIndex(i => i.id === child.id);
                                if (childIndex !== -1) {
                                    newItems[childIndex] = {
                                        ...newItems[childIndex],
                                        order: index,
                                        position: null, // Layout children không có position
                                        style: {
                                            ...newItems[childIndex].style,
                                            // Xóa left và top nếu có (layout children dùng flow layout)
                                            left: undefined,
                                            top: undefined,
                                            position: undefined
                                        }
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

                            // Cập nhật activeItem - đảm bảo position = null cho layout children
                            const activeIndex = newItems.findIndex(i => i.id === active.id);
                            if (activeIndex !== -1) {
                                newItems[activeIndex] = {
                                    ...newItems[activeIndex],
                                    parentId: newParentId,
                                    order: newOrder,
                                    position: null, // Layout children không có position
                                    style: {
                                        ...newItems[activeIndex].style,
                                        // Xóa left và top nếu có (layout children dùng flow layout)
                                        left: undefined,
                                        top: undefined,
                                        position: undefined
                                    }
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

        console.log('📤 Publishing with data:', publishData);
        
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
    // Drag preview state used to show temporary reorder while dragging
    const [draggingInfo, setDraggingInfo] = useState(null);
    const [previewItems, setPreviewItems] = useState(null);

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
                onDragStart={(event) => {
                    if (isPreviewMode) return;
                    const active = event.active;
                    setDraggingInfo({ id: active.id, data: active.data?.current || null });
                    setPreviewItems(null);
                }}
                onDragOver={(event) => {
                    if (isPreviewMode) return;
                    const active = event.active;
                    const over = event.over;
                    if (!active || !over) return;

                    // Only preview reorder for components (comp-*) or root level
                    const activeId = active.id;
                    const overId = over.id;

                    // Work on a copy of canvasItems
                    const itemsCopy = JSON.parse(JSON.stringify(canvasItems));

                    const findIndexInSiblings = (arr, id) => arr.findIndex(i => i.id === id);

                    // Helper: move active to position of over among siblings
                    const moveWithinSiblings = (allItems, activeIdLocal, overIdLocal) => {
                        const activeItem = allItems.find(i => i.id === activeIdLocal);
                        const overItem = allItems.find(i => i.id === overIdLocal);
                        if (!activeItem || !overItem) return null;

                        const activeParent = activeItem.parentId || null;
                        const overParent = overItem.parentId || null;

                        // Only reorder if parents are same
                        if (activeParent !== overParent) return null;

                        const siblings = allItems.filter(i => (i.parentId || null) === activeParent).sort((a,b)=> (a.order||0)-(b.order||0));
                        const activeIndex = siblings.findIndex(s => s.id === activeIdLocal);
                        const overIndex = siblings.findIndex(s => s.id === overIdLocal);
                        if (activeIndex === -1 || overIndex === -1) return null;

                        const newSiblings = [...siblings];
                        const [moved] = newSiblings.splice(activeIndex,1);
                        newSiblings.splice(overIndex,0,moved);

                        // Apply new order to a copy of allItems
                        const newAll = allItems.map(item => ({ ...item }));
                        newSiblings.forEach((s, idx) => {
                            const idxAll = newAll.findIndex(i => i.id === s.id);
                            if (idxAll !== -1) newAll[idxAll].order = idx;
                        });
                        return newAll;
                    };

                    // If dragging a component and over another component, try to preview reorder
                    if (String(activeId).startsWith('comp-') && String(overId).startsWith('comp-')) {
                        const preview = moveWithinSiblings(itemsCopy, activeId, overId);
                        if (preview) {
                            setPreviewItems(preview);
                            return;
                        }
                    }

                    // If dragging a root component over canvas-area, do nothing special
                    // Clear preview if nothing to do
                    setPreviewItems(null);
                }}
                onDragEnd={isPreviewMode ? undefined : (event) => {
                    // Clear preview state and then call existing handler to commit
                    setPreviewItems(null);
                    setDraggingInfo(null);
                    handleDragEnd(event);
                }}
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
                                items={previewItems || canvasItems} 
                                selectedId={selectedId} 
                                onSelectItem={setSelectedId} 
                                isPreview={isPreviewMode} 
                                navigate={navigate}
                                onPositionChange={handlePositionChange}
                                onSizeChange={handleSizeChange}
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
                    <Toolbox />
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
                                        onChange={e => {
                                            console.log('📁 Category changed to:', e.target.value);
                                            setPublishData({...publishData, category: e.target.value});
                                        }}
                                    >
                                        {categories.length > 0 ? (
                                            categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option>Template</option>
                                                <option>Module</option>
                                                <option>Component</option>
                                                <option>Automation</option>
                                            </>
                                        )}
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
