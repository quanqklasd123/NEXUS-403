// src/components/builder/renders/TaskListRender.jsx
import { useState, useEffect } from 'react';
import { FiCircle, FiCheckCircle, FiClock, FiFlag } from 'react-icons/fi';
import apiService from '../../../services/apiService';

const PRIORITY_COLORS = {
    Low: 'text-slate-400',
    Medium: 'text-yellow-500',
    High: 'text-red-500',
};

const STATUS_ICONS = {
    Todo: FiCircle,
    InProgress: FiClock,
    Done: FiCheckCircle,
};

export default function TaskListRender({ props = {}, style, isPreview = false }) {
    const { 
        showCheckbox = true, 
        showPriority = true, 
        showDueDate = true, 
        groupByStatus = false,
        todoListId 
    } = props || {};

    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

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
        if (isPreview) {
            const mockData = [
                { id: 1, title: 'Design homepage layout', status: 'Todo', priority: 'High', dueDate: '2025-12-10' },
                { id: 2, title: 'Implement API endpoints', status: 'InProgress', priority: 'Medium', dueDate: '2025-12-15' },
                { id: 3, title: 'Write documentation', status: 'Done', priority: 'Low', dueDate: '2025-12-05' },
                { id: 4, title: 'Code review', status: 'Todo', priority: 'Medium', dueDate: '2025-12-12' },
            ];
            setAllTasks(mockData);
            setTasks(mockData);
            setLoading(false);
            return;
        }

        const fetchTasks = async () => {
            try {
                setLoading(true);
                const data = await apiService.getAllMyItems();
                const items = Array.isArray(data) ? data : [];
                const filtered = todoListId ? items.filter(t => t.todoListId === todoListId) : items;
                setAllTasks(filtered);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
                setAllTasks([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();

        const handleTaskUpdate = () => fetchTasks();
        const handleFilterChange = (e) => setFilters(e.detail?.filters || {});
        const handleSearchChange = (e) => setSearchQuery(e.detail?.query || '');
        
        window.addEventListener('tasks-updated', handleTaskUpdate);
        window.addEventListener('filter-change', handleFilterChange);
        window.addEventListener('search-change', handleSearchChange);
        
        return () => {
            window.removeEventListener('tasks-updated', handleTaskUpdate);
            window.removeEventListener('filter-change', handleFilterChange);
            window.removeEventListener('search-change', handleSearchChange);
        };
    }, [todoListId, isPreview]);

    const toggleStatus = async (task) => {
        if (isPreview) return;
        const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
        try {
            await apiService.updateItemStatus(task.id, newStatus);
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
            window.dispatchEvent(new CustomEvent('tasks-updated'));
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const renderTaskItem = (task) => {
        const StatusIcon = STATUS_ICONS[task.status] || FiCircle;
        const isDone = task.status === 'Done';

        return (
            <div 
                key={task.id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer ${isDone ? 'opacity-60' : ''}`}
            >
                {showCheckbox && (
                    <button 
                        onClick={() => toggleStatus(task)}
                        className={`flex-shrink-0 ${isDone ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <StatusIcon size={20} />
                    </button>
                )}
                
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-gray-900 truncate ${isDone ? 'line-through' : ''}`}>
                        {task.title}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {showPriority && (
                        <FiFlag className={`${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium}`} size={14} />
                    )}
                    
                    {showDueDate && task.dueDate && (
                        <span className="text-xs text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={style} className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (groupByStatus) {
        const grouped = {
            Todo: tasks.filter(t => t.status === 'Todo'),
            InProgress: tasks.filter(t => t.status === 'InProgress'),
            Done: tasks.filter(t => t.status === 'Done'),
        };

        return (
            <div style={style} className="overflow-auto">
                {Object.entries(grouped).map(([status, items]) => (
                    items.length > 0 && (
                        <div key={status} className="mb-4">
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    {status} ({items.length})
                                </h4>
                            </div>
                            {items.map(renderTaskItem)}
                        </div>
                    )
                ))}
                {tasks.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-500">No tasks found</div>
                )}
            </div>
        );
    }

    return (
        <div style={style} className="overflow-auto">
            {tasks.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">No tasks found</div>
            ) : (
                tasks.map(renderTaskItem)
            )}
        </div>
    );
}
