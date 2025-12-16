// src/components/builder/renders/ControlRenders.jsx
// Các Control components: ViewSwitcher, FilterBar, SearchBox, SortDropdown, AddTaskButton, DatabaseTitle

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiTable, FiList, FiColumns, FiCalendar, FiFilter, FiSearch, FiPlus, FiChevronDown, FiX, FiArrowDown, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import apiService from '../../../services/apiService';
import eventBus, { EVENTS } from '../../../utils/eventBus';

const VIEW_ICONS = {
    table: FiTable,
    list: FiList,
    board: FiColumns,
    calendar: FiCalendar,
};

const VIEW_LABELS = {
    table: 'Table',
    list: 'List',
    board: 'Kanban',
    calendar: 'Calendar',
};

// ========== VIEW SIDEBAR ==========
export function ViewSidebarRender({ props = {}, style }) {
    const { 
        views = ['table', 'list', 'board', 'calendar'], 
        defaultView = 'table',
        position = 'left',
        collapsed = false
    } = props || {};
    const [activeView, setActiveView] = useState(defaultView);
    const [isCollapsed, setIsCollapsed] = useState(collapsed);

    // Dispatch event ngay khi mount để các component khác biết view mặc định
    useEffect(() => {
        // Set active view ngay lập tức
        setActiveView(defaultView);
        
        // Dispatch event ngay lập tức và sau một chút để đảm bảo các component khác đã mount
        window.dispatchEvent(new CustomEvent('view-change', { detail: { view: defaultView } }));
        
        // Dispatch lại sau một chút để đảm bảo các component khác đã mount và có thể listen
        const timer = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('view-change', { detail: { view: defaultView } }));
        }, 100);
        
        return () => clearTimeout(timer);
    }, [defaultView]);

    const handleViewChange = (view) => {
        setActiveView(view);
        // Dispatch event cả khi preview và không preview để các component khác có thể listen
        window.dispatchEvent(new CustomEvent('view-change', { detail: { view } }));
    };

    const sidebarStyle = {
        ...style,
        position: 'fixed',
        left: position === 'left' ? 0 : 'auto',
        right: position === 'right' ? 0 : 'auto',
        top: 0,
        height: '100vh',
        zIndex: 1000,
        backgroundColor: '#ffffff',
        borderRight: position === 'left' ? '1px solid #e2e8f0' : 'none',
        borderLeft: position === 'right' ? '1px solid #e2e8f0' : 'none',
        boxShadow: position === 'left' ? '2px 0 8px rgba(0, 0, 0, 0.1)' : '-2px 0 8px rgba(0, 0, 0, 0.1)',
        transition: 'width 0.3s ease, transform 0.3s ease',
        width: isCollapsed ? '60px' : '240px',
        padding: isCollapsed ? '16px 8px' : '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
    };

    return (
        <div style={sidebarStyle} className="view-sidebar">
            {/* Header */}
            {!isCollapsed && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Views
                    </h3>
                </div>
            )}

            {/* View Tabs */}
            <div className="flex flex-col gap-2">
                {views.map(view => {
                    const Icon = VIEW_ICONS[view] || FiTable;
                    const label = VIEW_LABELS[view] || view;
                    const isActive = activeView === view;
                    
                    return (
                        <button
                            key={view}
                            onClick={() => handleViewChange(view)}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                                ${isActive 
                                    ? 'bg-sage-50 text-sage-600 border border-sage-100 shadow-sm' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                                }
                            `}
                            title={isCollapsed ? label : undefined}
                        >
                            <Icon size={20} className="shrink-0" />
                            {!isCollapsed && (
                                <span className="text-sm font-medium">{label}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Collapse Toggle */}
            <div className="mt-auto pt-4 border-t border-gray-200">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? (
                        <FiChevronDown size={18} className="transform -rotate-90" />
                    ) : (
                        <>
                            <FiChevronDown size={18} className="transform rotate-90" />
                            <span className="text-xs">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// ========== VIEW SWITCHER (DEPRECATED - Giữ lại để tương thích) ==========
export function ViewSwitcherRender({ props = {}, style, isPreview = false }) {
    const { views = ['table', 'list', 'board', 'calendar'], defaultView = 'table' } = props || {};
    const [activeView, setActiveView] = useState(defaultView);

    // Dispatch event ngay khi mount để các component khác biết view mặc định
    useEffect(() => {
        if (isPreview) {
            window.dispatchEvent(new CustomEvent('view-change', { detail: { view: defaultView } }));
        }
    }, [defaultView, isPreview]);

    // Dispatch event ngay khi mount để các component khác biết view mặc định
    useEffect(() => {
        // Dispatch event ngay khi mount (cả preview và builder mode)
        // Sử dụng setTimeout để đảm bảo các component khác đã mount và có thể listen
        const timer = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('view-change', { detail: { view: defaultView } }));
        }, 100);
        
        return () => clearTimeout(timer);
    }, [defaultView]);

    const handleViewChange = (view) => {
        setActiveView(view);
        // Dispatch event cả khi preview và không preview để các component khác có thể listen
        window.dispatchEvent(new CustomEvent('view-change', { detail: { view } }));
    };

    const viewSwitcherStyle = {
        ...style,
        overflow: 'hidden',
        width: style.width || 'auto', // ViewSwitcher không nên có width: 100%
        minWidth: style.minWidth || 'fit-content',
    };

    return (
        <div style={viewSwitcherStyle} className="flex items-center overflow-hidden">
            {views.map(view => {
                const Icon = VIEW_ICONS[view] || FiTable;
                const isActive = activeView === view;
                return (
                    <button
                        key={view}
                        onClick={() => handleViewChange(view)}
                        className={`p-2 rounded-md transition-colors flex-shrink-0 ${
                            isActive 
                                ? 'bg-sage-100 text-sage-600' 
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                        title={view.charAt(0).toUpperCase() + view.slice(1)}
                    >
                        <Icon size={18} />
                    </button>
                );
            })}
        </div>
    );
}

// ========== FILTER BAR ==========
export function FilterBarRender({ props = {}, style, isPreview = false }) {
    const { filterFields = ['status', 'priority', 'dueDate'] } = props || {};
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [activeFilters, setActiveFilters] = useState([]);
    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    const FILTER_OPTIONS = {
        status: ['Todo', 'InProgress', 'Done'],
        priority: ['Low', 'Medium', 'High'],
        dueDate: ['Today', 'This Week', 'This Month', 'Overdue'],
    };

    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        if (!value) delete newFilters[field];
        setFilters(newFilters);
        
        const newActive = Object.entries(newFilters).map(([k, v]) => ({ field: k, value: v }));
        setActiveFilters(newActive);

        if (!isPreview) {
            window.dispatchEvent(new CustomEvent('filter-change', { detail: { filters: newFilters } }));
        }
    };

    const clearFilter = (field) => {
        handleFilterChange(field, null);
    };

    const clearAll = () => {
        setFilters({});
        setActiveFilters([]);
        if (!isPreview) {
            window.dispatchEvent(new CustomEvent('filter-change', { detail: { filters: {} } }));
        }
    };

    // Calculate dropdown position
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left
            });
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;
        
        const handleClickOutside = (e) => {
            const dropdown = document.querySelector('[data-filter-dropdown]');
            if (
                buttonRef.current && 
                !buttonRef.current.contains(e.target) &&
                (!dropdown || !dropdown.contains(e.target))
            ) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const filterBarStyle = {
        ...style,
        overflow: 'hidden',
        position: 'relative',
        width: style.width || 'auto', // FilterBar không nên có width: 100% mặc định
        minWidth: style.minWidth || 'fit-content',
    };

    return (
        <div style={filterBarStyle} className="relative">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Filter Button */}
                <button
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors flex-shrink-0 ${
                        activeFilters.length > 0 
                            ? 'border-sage-200 bg-sage-50 text-sage-600' 
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <FiFilter size={14} className="flex-shrink-0" />
                    <span className="whitespace-nowrap">Filter</span>
                    {activeFilters.length > 0 && (
                        <span className="bg-sage-600 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {activeFilters.length}
                        </span>
                    )}
                    <FiChevronDown size={14} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Active Filter Tags */}
                {activeFilters.map(({ field, value }) => (
                    <span 
                        key={field}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700 flex-shrink-0 overflow-hidden"
                    >
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">{field}: {value}</span>
                        <button onClick={() => clearFilter(field)} className="hover:text-red-500 flex-shrink-0">
                            <FiX size={12} />
                        </button>
                    </span>
                ))}

                {activeFilters.length > 0 && (
                    <button onClick={clearAll} className="text-xs text-gray-500 hover:text-red-500 whitespace-nowrap flex-shrink-0">
                        Clear all
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && createPortal(
                <div 
                    data-filter-dropdown
                    className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]"
                    style={{ 
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        zIndex: 99999
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="space-y-4">
                        {filterFields.map(field => (
                            <div key={field}>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                    {field}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {FILTER_OPTIONS[field]?.map(option => (
                                        <button
                                            key={option}
                                            onClick={() => handleFilterChange(field, filters[field] === option ? null : option)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                filters[field] === option
                                                    ? 'bg-sage-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// ========== SEARCH BOX ==========
export function SearchBoxRender({ props = {}, style, isPreview = false }) {
    const { placeholder = 'Search tasks...' } = props || {};
    const [query, setQuery] = useState('');

    const handleSearch = (value) => {
        setQuery(value);
        if (!isPreview) {
            window.dispatchEvent(new CustomEvent('search-change', { detail: { query: value } }));
        }
    };

    // Đảm bảo wrapper có overflow handling
    const wrapperStyle = {
        ...style,
        position: 'relative',
        overflow: 'hidden', // Ngăn text overflow
        minWidth: style.minWidth || '200px', // Đảm bảo có min width
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '100%',
    };

    return (
        <div style={wrapperStyle} className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
            <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    height: style.height || '100%',
                    boxSizing: 'border-box',
                    paddingLeft: '36px', // Space for icon
                    paddingRight: query ? '36px' : '16px', // Space for clear button if needed
                }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent overflow-hidden text-ellipsis"
            />
            {query && (
                <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                    <FiX size={14} />
                </button>
            )}
        </div>
    );
}

// ========== SORT DROPDOWN ==========
export function SortDropdownRender({ props = {}, style, isPreview = false }) {
    const { 
        label = 'Sort by',
        sortFields = ['title', 'status', 'priority', 'dueDate'],
        defaultSort = { field: 'title', order: 'asc' },
        targetComponentId = null
    } = props || {};
    
    const [currentSort, setCurrentSort] = useState(defaultSort);
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    const SORT_FIELD_LABELS = {
        title: 'Title',
        status: 'Status',
        priority: 'Priority',
        dueDate: 'Due Date',
    };

    const handleSortChange = (field, order) => {
        const newSort = { field, order };
        setCurrentSort(newSort);
        setIsOpen(false);
        
        if (!isPreview) {
            // Emit both window event and eventBus for compatibility
            window.dispatchEvent(new CustomEvent('sort-change', { 
                detail: { 
                    sort: newSort,
                    targetComponentId 
                } 
            }));
            eventBus.emit(EVENTS.SORT_CHANGE, { sort: newSort, targetComponentId });
        }
    };

    const toggleOrder = () => {
        const newOrder = currentSort.order === 'asc' ? 'desc' : 'asc';
        handleSortChange(currentSort.field, newOrder);
    };

    // Calculate dropdown position
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left
            });
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;
        
        const handleClickOutside = (e) => {
            const dropdown = document.querySelector('[data-sort-dropdown]');
            if (
                buttonRef.current && 
                !buttonRef.current.contains(e.target) &&
                (!dropdown || !dropdown.contains(e.target))
            ) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const sortDropdownStyle = {
        ...style,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: style.width || 'fit-content', // Đảm bảo width là fit-content
        height: style.height || 'fit-content',
        overflow: 'hidden',
    };

    return (
        <>
            <div 
                style={sortDropdownStyle} 
                className="sort-dropdown-container"
            >
                <button
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors overflow-hidden"
                >
                    <FiArrowDown size={14} className="flex-shrink-0" />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {label}: {SORT_FIELD_LABELS[currentSort.field] || currentSort.field}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                        ({currentSort.order === 'asc' ? '↑' : '↓'})
                    </span>
                    <FiChevronDown size={14} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Quick toggle order button */}
                {currentSort.field && (
                    <button
                        onClick={toggleOrder}
                        className="ml-2 p-1.5 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                        title={`Toggle ${currentSort.order === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                        {currentSort.order === 'asc' ? '↓' : '↑'}
                    </button>
                )}
            </div>

            {isOpen && createPortal(
                <div 
                    data-sort-dropdown
                    className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]"
                    style={{ 
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        zIndex: 99999
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="space-y-1">
                        {sortFields.map(field => (
                            <div key={field} className="space-y-1">
                                <div className="px-2 py-1 text-xs font-semibold text-gray-600 uppercase">
                                    {SORT_FIELD_LABELS[field] || field}
                                </div>
                                <button
                                    onClick={() => handleSortChange(field, 'asc')}
                                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                                        currentSort.field === field && currentSort.order === 'asc'
                                            ? 'bg-sage-100 text-sage-600 font-medium'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span>↑</span>
                                        Ascending
                                    </span>
                                </button>
                                <button
                                    onClick={() => handleSortChange(field, 'desc')}
                                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                                        currentSort.field === field && currentSort.order === 'desc'
                                            ? 'bg-sage-100 text-sage-600 font-medium'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span>↓</span>
                                        Descending
                                    </span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// ========== ADD TASK BUTTON ==========
export function AddTaskButtonRender({ props = {}, style, isPreview = false }) {
    const { label = 'New Task', defaultStatus = 'Todo', defaultPriority = 'Medium' } = props || {};
    const [isAdding, setIsAdding] = useState(false);
    const [newTask, setNewTask] = useState({ 
        title: '', 
        status: defaultStatus, 
        priority: defaultPriority,
        dueDate: null,
        categoryId: null // User sẽ chọn Category khi add task
    });
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const categorySelectRef = useRef(null);
    const [categoryDropdownPosition, setCategoryDropdownPosition] = useState({ top: 0, left: 0 });

    // Load categories (TodoLists)
    const loadCategories = useCallback(async () => {
        try {
            setLoadingCategories(true);
            const response = await apiService.getTodoLists();
            const lists = response.data || [];
            setCategories(lists);
            // Set default category if not set
            setNewTask(prev => {
                if (!prev.categoryId && lists.length > 0) {
                    return { ...prev, categoryId: lists[0].id };
                }
                return prev;
            });
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    }, []);

    // Load categories when adding form opens
    useEffect(() => {
        if (isAdding) {
            // Reset categories khi mở form để đảm bảo load lại dữ liệu mới nhất
            if (categories.length === 0) {
                loadCategories();
            }
        } else if (!isAdding) {
            // Reset state khi đóng form (chỉ reset input, giữ categories để lần sau nhanh hơn)
            setShowNewCategoryInput(false);
            setNewCategoryName('');
            setShowCategoryDropdown(false);
            setEditingCategoryId(null);
            setEditCategoryName('');
        }
    }, [isAdding, loadCategories, categories.length]);

    // Calculate dropdown position
    useEffect(() => {
        if (showCategoryDropdown && categorySelectRef.current) {
            const rect = categorySelectRef.current.getBoundingClientRect();
            setCategoryDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width
            });
        }
    }, [showCategoryDropdown]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!showCategoryDropdown) return;
        
        const handleClickOutside = (e) => {
            const dropdown = document.querySelector('[data-category-dropdown]');
            if (
                categorySelectRef.current && 
                !categorySelectRef.current.contains(e.target) &&
                (!dropdown || !dropdown.contains(e.target))
            ) {
                setShowCategoryDropdown(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCategoryDropdown]);


    // Helper functions to convert string status/priority to API format
    const convertStatusToInt = (statusStr) => {
        const statusMap = {
            'Todo': 0,
            'InProgress': 1,
            'Done': 2
        };
        return statusMap[statusStr] !== undefined ? statusMap[statusStr] : 0;
    };

    const convertPriorityToInt = (priorityStr) => {
        const priorityMap = {
            'Low': 0,
            'Medium': 1,
            'High': 2
        };
        return priorityMap[priorityStr] !== undefined ? priorityMap[priorityStr] : 1;
    };

    // Create new category
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            alert('Vui lòng nhập tên danh mục!');
            return;
        }
        try {
            setLoadingCategories(true);
            const response = await apiService.createTodoList(newCategoryName.trim());
            const newCategory = response.data;
            setCategories(prev => [...prev, newCategory]);
            setNewTask(prev => ({ ...prev, categoryId: newCategory.id }));
            setNewCategoryName('');
            setShowNewCategoryInput(false);
        } catch (error) {
            console.error('Failed to create category:', error);
            alert(`Không thể tạo danh mục: ${error.response?.data?.message || error.message || 'Lỗi không xác định'}`);
        } finally {
            setLoadingCategories(false);
        }
    };

    // Edit category
    const handleEditCategory = (category) => {
        setEditingCategoryId(category.id);
        setEditCategoryName(category.name);
        setShowNewCategoryInput(false);
        setNewCategoryName('');
    };

    // Save edited category
    const handleSaveEditCategory = async () => {
        if (!editCategoryName.trim()) {
            alert('Vui lòng nhập tên danh mục!');
            return;
        }
        try {
            setLoadingCategories(true);
            await apiService.updateTodoList(editingCategoryId, editCategoryName.trim());
            setCategories(prev => prev.map(cat => 
                cat.id === editingCategoryId ? { ...cat, name: editCategoryName.trim() } : cat
            ));
            setEditingCategoryId(null);
            setEditCategoryName('');
        } catch (error) {
            console.error('Failed to update category:', error);
            alert(`Không thể cập nhật danh mục: ${error.response?.data?.message || error.message || 'Lỗi không xác định'}`);
        } finally {
            setLoadingCategories(false);
        }
    };

    // Delete category
    const handleDeleteCategory = async (categoryId, categoryName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${categoryName}"? Tất cả các task trong danh mục này sẽ bị xóa.`)) {
            return;
        }
        try {
            setLoadingCategories(true);
            await apiService.deleteTodoList(categoryId);
            setCategories(prev => prev.filter(cat => cat.id !== categoryId));
            // Nếu category đang được chọn, reset selection
            if (newTask.categoryId === categoryId) {
                const remainingCategories = categories.filter(cat => cat.id !== categoryId);
                setNewTask(prev => ({ 
                    ...prev, 
                    categoryId: remainingCategories.length > 0 ? remainingCategories[0].id : null 
                }));
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
            alert(`Không thể xóa danh mục: ${error.response?.data?.message || error.message || 'Lỗi không xác định'}`);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleAdd = async () => {
        if (!newTask.title.trim()) {
            alert('Vui lòng nhập tiêu đề task!');
            return;
        }
        
        if (!newTask.categoryId) {
            alert('Vui lòng chọn danh mục!');
            return;
        }

        try {
            await apiService.createTodoItem({
                title: newTask.title,
                status: convertStatusToInt(newTask.status),
                priority: convertPriorityToInt(newTask.priority),
                dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
                todoListId: newTask.categoryId // MongoDB dùng string, không parse int
            });
            setNewTask({ title: '', status: defaultStatus, priority: defaultPriority, dueDate: null, categoryId: null });
            setIsAdding(false);
            window.dispatchEvent(new CustomEvent('tasks-updated'));
        } catch (error) {
            console.error('Failed to create task:', error);
            alert(`Không thể tạo task: ${error.response?.data?.message || error.message || 'Lỗi không xác định'}`);
        }
    };

    // Helper function để format datetime-local value
    const formatDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    
    // Render add-task modal when isAdding is true (use portal) instead of replacing the button inline
    const addTaskModal = isAdding ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.stopPropagation()}>
            <div className="w-full max-w-lg bg-white border border-gray-200 rounded-lg shadow-xl p-6" onMouseDown={(e) => e.stopPropagation()}>
                {/* Title Input */}
                <div className="flex items-center gap-2 mb-4">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tiêu đề:</label>
                    <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Tiêu đề task..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                </div>

                {/* Status, Priority, DueDate Selection */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Status */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Status</label>
                        <select
                            value={newTask.status}
                            onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        >
                            <option value="Todo">Todo</option>
                            <option value="InProgress">In Progress</option>
                            <option value="Done">Done</option>
                        </select>
                    </div>

                    {/* Priority */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Priority</label>
                        <select
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    {/* DueDate với datetime-local */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Due Date & Time</label>
                        <input
                            type="datetime-local"
                            value={newTask.dueDate ? formatDateTimeLocal(newTask.dueDate) : ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setNewTask({ 
                                    ...newTask, 
                                    dueDate: value ? new Date(value).toISOString() : null 
                                });
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        />
                    </div>
                </div>

                {/* Category Selection */}
                <div className="flex items-center gap-2 mb-4">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Danh mục:</label>
                    {loadingCategories ? (
                        <span className="text-sm text-gray-500">Đang tải...</span>
                    ) : (
                        <div className="flex-1 flex items-center gap-2 relative">
                            <div className="flex-1 relative">
                                <button
                                    ref={categorySelectRef}
                                    type="button"
                                    onClick={() => {
                                        if (categories.length === 0 && !loadingCategories) {
                                            loadCategories();
                                        }
                                        setShowCategoryDropdown(!showCategoryDropdown);
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white text-left flex items-center justify-between cursor-pointer"
                                >
                                    <span className="truncate">
                                        {newTask.categoryId 
                                            ? categories.find(cat => cat.id === newTask.categoryId)?.name || '-- Chọn danh mục --'
                                            : '-- Chọn danh mục --'
                                        }
                                    </span>
                                    <FiChevronDown size={14} className={`transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                            
                            {/* Custom Dropdown with Portal */}
                            {showCategoryDropdown && createPortal(
                                <div 
                                    data-category-dropdown
                                    className="fixed bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                    style={{ 
                                        top: `${categoryDropdownPosition.top}px`,
                                        left: `${categoryDropdownPosition.left}px`,
                                        width: `${categoryDropdownPosition.width || 200}px`,
                                        zIndex: 99999
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {categories.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">Không có danh mục</div>
                                    ) : (
                                        categories.map(cat => (
                                            editingCategoryId === cat.id ? (
                                                <div key={cat.id} className="p-2 border-b border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={editCategoryName}
                                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sage-500"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleSaveEditCategory();
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingCategoryId(null);
                                                                    setEditCategoryName('');
                                                                }
                                                            }}
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={handleSaveEditCategory}
                                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                            title="Lưu"
                                                        >
                                                            <FiCheck size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingCategoryId(null);
                                                                setEditCategoryName('');
                                                            }}
                                                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                                            title="Hủy"
                                                        >
                                                            <FiX size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div 
                                                    key={cat.id}
                                                    className={`px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center justify-between ${
                                                        newTask.categoryId === cat.id ? 'bg-sage-50 text-sage-600' : ''
                                                    }`}
                                                    onClick={() => {
                                                        setNewTask(prev => ({ ...prev, categoryId: cat.id }));
                                                        setShowCategoryDropdown(false);
                                                    }}
                                                >
                                                    <span className="flex-1 truncate">{cat.name}</span>
                                                    <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleEditCategory(cat)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Sửa"
                                                        >
                                                            <FiEdit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            title="Xóa"
                                                        >
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        ))
                                    )}
                                </div>,
                                document.body
                            )}
                            
                            <button
                                onClick={() => {
                                    setShowNewCategoryInput(!showNewCategoryInput);
                                    if (!showNewCategoryInput) {
                                        setNewCategoryName('');
                                    }
                                    setShowCategoryDropdown(false);
                                }}
                                className="px-3 py-2 text-sm text-sage-600 border border-sage-200 rounded-md hover:bg-sage-50 transition-colors"
                                title="Tạo danh mục mới"
                            >
                                <FiPlus size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* New Category Input */}
                {showNewCategoryInput && (
                    <div className="flex items-center gap-2 p-2 bg-sage-50 rounded-md mb-4">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Tên danh mục mới..."
                            className="flex-1 px-3 py-1.5 text-sm border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleCreateCategory();
                                } else if (e.key === 'Escape') {
                                    setShowNewCategoryInput(false);
                                    setNewCategoryName('');
                                }
                            }}
                            autoFocus
                        />
                        <button
                            onClick={handleCreateCategory}
                            className="px-3 py-1.5 bg-sage-600 text-white text-xs font-medium rounded-md hover:bg-sage-700"
                        >
                            Tạo
                        </button>
                        <button
                            onClick={() => {
                                setShowNewCategoryInput(false);
                                setNewCategoryName('');
                            }}
                            className="px-3 py-1.5 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-100"
                        >
                            Hủy
                        </button>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={() => {
                            setIsAdding(false);
                            setShowNewCategoryInput(false);
                            setNewCategoryName('');
                        }}
                        className="px-3 py-1.5 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-1.5 bg-sage-600 text-white text-sm font-medium rounded-md hover:bg-sage-700"
                    >
                        Thêm Task
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    const buttonStyle = {
        ...style,
        overflow: 'hidden',
        width: style.width || 'auto', // Đảm bảo width là auto nếu không được set
        minWidth: style.minWidth || 'fit-content', // Đảm bảo có min width phù hợp
    };

    const pointerStartRef = useRef({ x: 0, y: 0, moved: false });

    const handlePointerDown = (e) => {
        pointerStartRef.current = { x: e.clientX, y: e.clientY, moved: false };
    };

    const handlePointerMove = (e) => {
        const s = pointerStartRef.current;
        if (!s) return;
        const dx = Math.abs(e.clientX - s.x);
        const dy = Math.abs(e.clientY - s.y);
        if (dx > 5 || dy > 5) {
            s.moved = true;
        }
    };

    const handlePointerUp = (e) => {
        const s = pointerStartRef.current;
        if (!s) return;
        // If pointer didn't move significantly, treat as click
        if (!s.moved) {
            setIsAdding(true);
        }
        pointerStartRef.current = { x: 0, y: 0, moved: false };
    };

    return (
        <>
            <button
                style={buttonStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="drag-handle flex items-center gap-2 hover:opacity-90 transition-opacity overflow-hidden whitespace-nowrap"
            >
                <FiPlus size={16} className="flex-shrink-0" />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
            </button>
            {addTaskModal}
        </>
    );
}

// ========== DATABASE TITLE ==========
export function DatabaseTitleRender({ props = {}, style, isPreview = false }) {
    const { label = 'My Tasks', icon = '📋', editable = true } = props || {};
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(label);

    const handleSave = () => {
        setIsEditing(false);
        if (!isPreview) {
            window.dispatchEvent(new CustomEvent('title-change', { detail: { title } }));
        }
    };

    const titleStyle = {
        ...style,
        overflow: 'hidden',
    };

    if (isEditing && editable) {
        return (
            <div style={titleStyle} className="flex items-center gap-2 overflow-hidden">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                    className="flex-1 bg-transparent border-b-2 border-indigo-500 focus:outline-none text-2xl font-bold text-gray-800 min-w-0"
                    autoFocus
                />
            </div>
        );
    }

    return (
        <div
            style={titleStyle} 
            onClick={() => editable && setIsEditing(true)}
            className={`flex items-center gap-2 overflow-hidden ${editable ? 'cursor-pointer hover:opacity-80' : ''}`}
        >
            <span className="text-2xl flex-shrink-0">{icon}</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-bold">{title}</span>
        </div>
    );
}
