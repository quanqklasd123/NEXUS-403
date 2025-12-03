// src/components/builder/renders/ControlRenders.jsx
// Các Control components: ViewSwitcher, FilterBar, SearchBox, SortDropdown, AddTaskButton, DatabaseTitle

import { useState } from 'react';
import { FiTable, FiList, FiColumns, FiCalendar, FiFilter, FiSearch, FiPlus, FiChevronDown, FiX, FiArrowDown } from 'react-icons/fi';
import apiService from '../../../services/apiService';
import eventBus, { EVENTS } from '../../../utils/eventBus';

const VIEW_ICONS = {
    table: FiTable,
    list: FiList,
    board: FiColumns,
    calendar: FiCalendar,
};

// ========== VIEW SWITCHER ==========
export function ViewSwitcherRender({ props = {}, style, isPreview = false }) {
    const { views = ['table', 'list', 'board', 'calendar'], defaultView = 'table' } = props || {};
    const [activeView, setActiveView] = useState(defaultView);

    const handleViewChange = (view) => {
        setActiveView(view);
        if (!isPreview) {
            window.dispatchEvent(new CustomEvent('view-change', { detail: { view } }));
        }
    };

    return (
        <div style={style} className="flex items-center">
            {views.map(view => {
                const Icon = VIEW_ICONS[view] || FiTable;
                const isActive = activeView === view;
                return (
                    <button
                        key={view}
                        onClick={() => handleViewChange(view)}
                        className={`p-2 rounded-md transition-colors ${
                            isActive 
                                ? 'bg-indigo-100 text-indigo-700' 
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

    return (
        <div style={style} className="relative">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Filter Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                        activeFilters.length > 0 
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700' 
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <FiFilter size={14} />
                    Filter
                    {activeFilters.length > 0 && (
                        <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {activeFilters.length}
                        </span>
                    )}
                    <FiChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Active Filter Tags */}
                {activeFilters.map(({ field, value }) => (
                    <span 
                        key={field}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700"
                    >
                        {field}: {value}
                        <button onClick={() => clearFilter(field)} className="hover:text-red-500">
                            <FiX size={12} />
                        </button>
                    </span>
                ))}

                {activeFilters.length > 0 && (
                    <button onClick={clearAll} className="text-xs text-gray-500 hover:text-red-500">
                        Clear all
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[280px]">
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
                                                    ? 'bg-indigo-600 text-white'
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
                </div>
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

    return (
        <div style={style} className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {query && (
                <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

    return (
        <div style={style} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
                <FiArrowDown size={14} />
                {label}: {SORT_FIELD_LABELS[currentSort.field] || currentSort.field}
                <span className="text-xs text-gray-500">
                    ({currentSort.order === 'asc' ? '↑' : '↓'})
                </span>
                <FiChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
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
                                            ? 'bg-indigo-100 text-indigo-700 font-medium'
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
                                            ? 'bg-indigo-100 text-indigo-700 font-medium'
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
                </div>
            )}

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
    );
}

// ========== ADD TASK BUTTON ==========
export function AddTaskButtonRender({ props = {}, style, isPreview = false }) {
    const { label = '+ New Task', defaultStatus = 'Todo', defaultPriority = 'Medium', todoListId } = props || {};
    const [isAdding, setIsAdding] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', status: defaultStatus, priority: defaultPriority });

    const handleAdd = async () => {
        if (!newTask.title.trim()) return;
        
        if (isPreview) {
            setNewTask({ title: '', status: defaultStatus, priority: defaultPriority });
            setIsAdding(false);
            return;
        }

        try {
            await apiService.createTodoItem({
                title: newTask.title,
                status: newTask.status,
                priority: newTask.priority,
                todoListId: todoListId || 1, // Default to first list if not specified
            });
            setNewTask({ title: '', status: defaultStatus, priority: defaultPriority });
            setIsAdding(false);
            window.dispatchEvent(new CustomEvent('tasks-updated'));
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    };

    if (isAdding) {
        return (
            <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title..."
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button
                    onClick={handleAdd}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                >
                    Add
                </button>
                <button
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            style={style}
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
            <FiPlus size={16} />
            {label}
        </button>
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

    if (isEditing && editable) {
        return (
            <div style={style} className="flex items-center gap-2">
                <span className="text-2xl">{icon}</span>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="flex-1 bg-transparent border-b-2 border-indigo-500 focus:outline-none text-2xl font-bold text-gray-800"
                    autoFocus
                />
            </div>
        );
    }

    return (
        <div 
            style={style} 
            onClick={() => editable && setIsEditing(true)}
            className={editable ? 'cursor-pointer hover:opacity-80' : ''}
        >
            <span className="text-2xl mr-2">{icon}</span>
            {title}
        </div>
    );
}
