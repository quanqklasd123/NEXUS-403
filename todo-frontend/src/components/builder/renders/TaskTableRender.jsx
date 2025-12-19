// src/components/builder/renders/TaskTableRender.jsx
import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import apiService from '../../../services/apiService';

const STATUS_OPTIONS = ['Todo', 'InProgress', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

// Convert số sang string
const convertStatusToString = (statusNum) => {
    const statusMap = { 0: 'Todo', 1: 'InProgress', 2: 'Done' };
    return statusMap[statusNum] || 'Todo';
};

const convertPriorityToString = (priorityNum) => {
    const priorityMap = { 0: 'Low', 1: 'Medium', 2: 'High' };
    return priorityMap[priorityNum] || 'Medium';
};

const COLUMN_LABELS = {
    title: 'Title',
    status: 'Status',
    priority: 'Priority',
    dueDate: 'Due Date',
    category: 'Category', // Thêm Category
};

const StatusBadge = ({ status }) => {
    const colors = {
        Todo: 'bg-gray-100 text-gray-700',
        InProgress: 'bg-blue-100 text-blue-700',
        Done: 'bg-green-100 text-green-700',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.Todo}`}>
            {status}
        </span>
    );
};

const PriorityBadge = ({ priority }) => {
    const colors = {
        Low: 'bg-slate-100 text-slate-600',
        Medium: 'bg-yellow-100 text-yellow-700',
        High: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || colors.Medium}`}>
            {priority}
        </span>
    );
};

export default function TaskTableRender({ 
    props = {}, 
    style, 
    isPreview = false,
    // Props from parent
    tasks: externalTasks = null,
    allTasks: externalAllTasks = null,
    onTaskUpdate: externalOnTaskUpdate = null,
    onTaskDelete: externalOnTaskDelete = null
}) {
    const { columns = ['title', 'status', 'priority', 'dueDate', 'category'], showHeader = true, allowEdit = true, allowDelete = true, todoListId } = props || {};
    
    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]); // Store all tasks before filtering
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [filters, setFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    // Apply filters and search
    useEffect(() => {
        let result = [...allTasks];

        // Apply filters
        if (filters.status) {
            result = result.filter(t => t.status === filters.status);
        }
        if (filters.priority) {
            result = result.filter(t => t.priority === filters.priority);
        }
        if (filters.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            result = result.filter(t => {
                if (!t.dueDate) return false;
                const taskDate = new Date(t.dueDate);
                taskDate.setHours(0, 0, 0, 0);
                switch (filters.dueDate) {
                    case 'Today': return taskDate.getTime() === today.getTime();
                    case 'This Week': {
                        const weekEnd = new Date(today);
                        weekEnd.setDate(weekEnd.getDate() + 7);
                        return taskDate >= today && taskDate <= weekEnd;
                    }
                    case 'This Month': {
                        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                        return taskDate >= today && taskDate <= monthEnd;
                    }
                    case 'Overdue': return taskDate < today && t.status !== 'Done';
                    default: return true;
                }
            });
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t => 
                t.title?.toLowerCase().includes(query) ||
                t.status?.toLowerCase().includes(query) ||
                t.priority?.toLowerCase().includes(query) ||
                t.todoListName?.toLowerCase().includes(query)
            );
        }

        setTasks(result);
    }, [allTasks, filters, searchQuery]);

    // Fetch tasks từ API hoặc sử dụng props từ parent
    useEffect(() => {
        // Nếu có external tasks từ parent (AppRuntimePage), sử dụng chúng
        if (externalAllTasks !== null) {
            const filtered = todoListId ? externalAllTasks.filter(t => t.todoListId === todoListId) : externalAllTasks;
            const convertedItems = filtered.map(item => ({
                ...item,
                status: typeof item.status === 'number' ? convertStatusToString(item.status) : item.status,
                priority: typeof item.priority === 'number' ? convertPriorityToString(item.priority) : item.priority
            }));
            setAllTasks(convertedItems);
            setLoading(false);
            return;
        }

        // Fallback: fetch từ API nếu không có external tasks
        const fetchTasks = async () => {
            try {
                setLoading(true);
                const response = await apiService.getAllMyItems();
                const items = Array.isArray(response.data) ? response.data : [];
                const filtered = todoListId ? items.filter(t => t.todoListId === todoListId) : items;
                // Convert status và priority từ số sang string
                const convertedItems = filtered.map(item => ({
                    ...item,
                    status: convertStatusToString(item.status),
                    priority: convertPriorityToString(item.priority)
                }));
                setAllTasks(convertedItems);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
                setAllTasks([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();

        // Listen for events
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
    }, [todoListId, externalAllTasks]);

    const handleEdit = (task) => {
        setEditingId(task.id);
        setEditForm({ ...task });
    };

    const handleSave = async () => {
        if (isPreview) {
            setEditingId(null);
            return;
        }
        try {
            // Tìm task gốc để lấy todoListId
            const originalTask = allTasks.find(t => t.id === editingId);
            if (!originalTask) {
                console.error('Original task not found');
                return;
            }

            // Nếu có external callback từ parent, sử dụng nó
            if (externalOnTaskUpdate) {
                await externalOnTaskUpdate(editingId, editForm);
                setAllTasks(prev => prev.map(t => t.id === editingId ? { 
                    ...t, 
                    ...editForm
                } : t));
                setEditingId(null);
                return;
            }

            // Fallback: gọi API trực tiếp
            // Convert status và priority string sang số trước khi gửi
            const statusMap = { 'Todo': 0, 'InProgress': 1, 'Done': 2 };
            const priorityMap = { 'Low': 0, 'Medium': 1, 'High': 2 };

            // Chuẩn bị data để gửi lên backend (phải có đầy đủ các trường)
            const updateData = {
                title: editForm.title || originalTask.title,
                status: statusMap[editForm.status] ?? statusMap[originalTask.status] ?? 0,
                priority: priorityMap[editForm.priority] ?? priorityMap[originalTask.priority] ?? 1,
                dueDate: editForm.dueDate || originalTask.dueDate || null,
                todoListId: originalTask.todoListId,
                appId: originalTask.appId || null
            };

            await apiService.updateTodoItem(editingId, updateData);
            
            // Update local state với data đã convert
            setAllTasks(prev => prev.map(t => t.id === editingId ? { 
                ...t, 
                title: editForm.title || t.title,
                status: editForm.status || t.status,
                priority: editForm.priority || t.priority,
                dueDate: editForm.dueDate || t.dueDate
            } : t));
            
            setEditingId(null);
            window.dispatchEvent(new CustomEvent('tasks-updated'));
        } catch (error) {
            console.error('Failed to update task:', error);
            alert('Failed to update task. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        if (isPreview) return;
        if (!confirm('Bạn có chắc chắn muốn xóa task này không?')) return;
        try {
            // Nếu có external callback từ parent, sử dụng nó
            if (externalOnTaskDelete) {
                await externalOnTaskDelete(id);
                setAllTasks(prev => prev.filter(t => t.id !== id));
                return;
            }

            // Fallback: gọi API trực tiếp
            await apiService.deleteTodoItem(id);
            setAllTasks(prev => prev.filter(t => t.id !== id));
            window.dispatchEvent(new CustomEvent('tasks-updated'));
        } catch (error) {
            console.error('Failed to delete task:', error);
            alert('Không thể xóa task. Vui lòng thử lại.');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const renderCell = (task, column) => {
        const isEditing = editingId === task.id;

        if (isEditing && allowEdit) {
            switch (column) {
                case 'title':
                    return (
                        <input
                            type="text"
                            value={editForm.title || ''}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                        />
                    );
                case 'status':
                    return (
                        <select
                            value={editForm.status || 'Todo'}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="px-2 py-1 border rounded text-sm"
                        >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    );
                case 'priority':
                    return (
                        <select
                            value={editForm.priority || 'Medium'}
                            onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                            className="px-2 py-1 border rounded text-sm"
                        >
                            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    );
                case 'dueDate':
                    return (
                        <input
                            type="date"
                            value={editForm.dueDate?.split('T')[0] || ''}
                            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                            className="px-2 py-1 border rounded text-sm"
                        />
                    );
                default:
                    return task[column];
            }
        }

        switch (column) {
            case 'status':
                return <StatusBadge status={task.status} />;
            case 'priority':
                return <PriorityBadge priority={task.priority} />;
            case 'dueDate':
                return task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-';
            case 'category':
                return task.todoListName ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {task.todoListName}
                    </span>
                ) : '-';
            default:
                return task[column] || '-';
        }
    };

    if (loading) {
        return (
            <div style={style} className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }
    
    return (
        <div style={style} className="overflow-auto">
            <table className="w-full border-collapse">
                {showHeader && (
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            {columns.map(col => (
                                <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    {COLUMN_LABELS[col] || col}
                                </th>
                            ))}
                            {(allowEdit || allowDelete) && (
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                )}
                <tbody className="divide-y divide-gray-200">
                    {tasks.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                                No tasks found
                            </td>
                        </tr>
                    ) : (
                        tasks.map(task => (
                            <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                                {columns.map(col => (
                                    <td key={col} className="px-4 py-3 text-sm text-gray-700">
                                        {renderCell(task, col)}
                                    </td>
                                ))}
                                {(allowEdit || allowDelete) && (
                                    <td className="px-4 py-3 text-right">
                                        {editingId === task.id ? (
                                            <div className="flex justify-end gap-1">
                                                <button onClick={handleSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                                                    <FiCheck size={16} />
                                                </button>
                                                <button onClick={handleCancel} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
                                                    <FiX size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-1">
                                                {allowEdit && (
                                                    <button onClick={() => handleEdit(task)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                                        <FiEdit2 size={16} />
                                                    </button>
                                                )}
                                                {allowDelete && (
                                                    <button onClick={() => handleDelete(task.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
