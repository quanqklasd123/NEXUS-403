// src/components/builder/renders/TaskBoardRender.jsx
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FiFlag, FiCalendar } from 'react-icons/fi';
import apiService from '../../../services/apiService';

const COLUMN_COLORS = {
    Todo: { bg: 'bg-gray-100', header: 'bg-gray-200', dot: 'bg-gray-400' },
    InProgress: { bg: 'bg-blue-50', header: 'bg-blue-100', dot: 'bg-blue-500' },
    Done: { bg: 'bg-green-50', header: 'bg-green-100', dot: 'bg-green-500' },
};

const PRIORITY_COLORS = {
    Low: 'text-slate-400',
    Medium: 'text-yellow-500',
    High: 'text-red-500',
};

export default function TaskBoardRender({ props = {}, style, isPreview = false }) {
    const { 
        columns = ['Todo', 'InProgress', 'Done'], 
        allowDrag = true,
        showPriority = true,
        showDueDate = true,
        todoListId 
    } = props || {};

    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [currentView, setCurrentView] = useState('board'); // Track current view from view switcher (mặc định là 'board' để tránh trắng màn hình)

    // Apply filters and search
    useEffect(() => {
        let result = [...allTasks];
        if (filters.status) result = result.filter(t => t.status === filters.status);
        if (filters.priority) result = result.filter(t => t.priority === filters.priority);
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t => t.title?.toLowerCase().includes(query));
        }
        setTasks(result);
    }, [allTasks, filters, searchQuery]);

    useEffect(() => {
        fetchTasks();

        const handleTaskUpdate = () => fetchTasks();
        const handleFilterChange = (e) => setFilters(e.detail?.filters || {});
        const handleSearchChange = (e) => setSearchQuery(e.detail?.query || '');
        
        // Listen for view change event
        const handleViewChange = (e) => {
            const view = e.detail?.view || 'table';
            setCurrentView(view);
        };
        
        window.addEventListener('tasks-updated', handleTaskUpdate);
        window.addEventListener('filter-change', handleFilterChange);
        window.addEventListener('search-change', handleSearchChange);
        window.addEventListener('view-change', handleViewChange);
        
        return () => {
            window.removeEventListener('tasks-updated', handleTaskUpdate);
            window.removeEventListener('filter-change', handleFilterChange);
            window.removeEventListener('search-change', handleSearchChange);
            window.removeEventListener('view-change', handleViewChange);
        };
    }, [todoListId]);

    const handleDragEnd = async (result) => {
        if (!result.destination || !isPreview || !allowDrag) return;

        const { draggableId, destination } = result;
        const taskId = parseInt(draggableId);
        const columnName = destination.droppableId;
        
        // Map column names to status values
        const statusMap = {
            'Todo': 0,
            'InProgress': 1,
            'Done': 2,
        };
        const newStatus = statusMap[columnName] !== undefined ? statusMap[columnName] : parseInt(columnName);

        // Optimistic update
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        setTasks(updatedTasks);

        try {
            await apiService.updateItemStatus(taskId, newStatus);
            window.dispatchEvent(new CustomEvent('tasks-updated'));
        } catch (error) {
            console.error('Failed to update task status:', error);
            // Revert on error
            fetchTasks();
        }
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllMyItems();
            const items = Array.isArray(response.data) ? response.data : [];
            const filtered = todoListId ? items.filter(t => t.todoListId === todoListId) : items;
            setAllTasks(filtered);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            setAllTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const getTasksByColumn = (columnName) => {
        // Map column names to status values
        const statusMap = {
            'Todo': 0,
            'InProgress': 1,
            'Done': 2,
        };
        const statusValue = statusMap[columnName] !== undefined ? statusMap[columnName] : columnName;
        return tasks.filter(task => task.status === statusValue);
    };

    if (loading) {
        return (
            <div style={style} className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Chỉ hiển thị khi view được chọn là 'board'
    const shouldShow = currentView === 'board';
    
    return (
        <div style={{ ...style, display: shouldShow ? 'block' : 'none' }}>
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 h-full overflow-x-auto pb-4">
                    {columns.map(column => {
                        const colors = COLUMN_COLORS[column] || COLUMN_COLORS.Todo;
                        const columnTasks = getTasksByColumn(column);

                        return (
                            <div 
                                key={column} 
                                className={`flex-1 min-w-[320px] ${colors.bg} rounded-lg flex flex-col`}
                            >
                                {/* Column Header */}
                                <div className={`${colors.header} px-4 py-3 rounded-t-lg flex items-center gap-2`}>
                                    <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                                    <h3 className="font-semibold text-gray-700 text-sm">{column}</h3>
                                    <span className="ml-auto bg-white/60 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">
                                        {columnTasks.length}
                                    </span>
                                </div>

                                {/* Tasks */}
                                <Droppable droppableId={column} isDropDisabled={!allowDrag}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 p-3 space-y-3 overflow-y-auto min-h-[450px] transition-colors ${
                                                snapshot.isDraggingOver ? 'bg-gray-200/50' : ''
                                            }`}
                                        >
                                            {columnTasks.map((task, index) => (
                                                <Draggable 
                                                    key={task.id} 
                                                    draggableId={String(task.id)} 
                                                    index={index}
                                                    isDragDisabled={!allowDrag}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing transition-shadow ${
                                                                snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500/30' : 'hover:shadow-md'
                                                            }`}
                                                        >
                                                            <p className="text-sm font-medium text-gray-800 mb-2">
                                                                {task.title}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                {showPriority && (
                                                                    <span className={`flex items-center gap-1 ${PRIORITY_COLORS[task.priority]}`}>
                                                                        <FiFlag size={12} />
                                                                        {task.priority}
                                                                    </span>
                                                                )}
                                                                {showDueDate && task.dueDate && (
                                                                    <span className="flex items-center gap-1">
                                                                        <FiCalendar size={12} />
                                                                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
