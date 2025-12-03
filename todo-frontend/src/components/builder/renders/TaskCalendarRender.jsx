// src/components/builder/renders/TaskCalendarRender.jsx
import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import apiService from '../../../services/apiService';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

const PRIORITY_COLORS = {
    Low: { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' },
    Medium: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    High: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
};

const STATUS_COLORS = {
    Todo: { bg: '#f3f4f6', border: '#9ca3af' },
    InProgress: { bg: '#dbeafe', border: '#3b82f6' },
    Done: { bg: '#dcfce7', border: '#22c55e' },
};

export default function TaskCalendarRender({ props = {}, style, isPreview = false }) {
    const { viewMode = 'month', showPriority = true, todoListId } = props || {};
    
    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState(viewMode);
    const [currentDate, setCurrentDate] = useState(new Date());
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
            const today = new Date();
            const mockData = [
                { id: 1, title: 'Team meeting', status: 'Todo', priority: 'High', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2).toISOString() },
                { id: 2, title: 'Project deadline', status: 'InProgress', priority: 'High', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString() },
                { id: 3, title: 'Code review', status: 'Todo', priority: 'Medium', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString() },
                { id: 4, title: 'Documentation', status: 'Done', priority: 'Low', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString() },
                { id: 5, title: 'Sprint planning', status: 'Todo', priority: 'Medium', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString() },
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

    // Convert tasks to calendar events
    const events = useMemo(() => {
        return tasks
            .filter(task => task.dueDate)
            .map(task => ({
                id: task.id,
                title: task.title,
                start: new Date(task.dueDate),
                end: new Date(task.dueDate),
                allDay: true,
                resource: {
                    status: task.status,
                    priority: task.priority,
                },
            }));
    }, [tasks]);

    // Custom event styling
    const eventStyleGetter = (event) => {
        const priority = event.resource?.priority || 'Medium';
        const status = event.resource?.status || 'Todo';
        const colors = showPriority ? PRIORITY_COLORS[priority] : STATUS_COLORS[status];

        return {
            style: {
                backgroundColor: colors.bg,
                borderLeft: `3px solid ${colors.border}`,
                color: colors.text || '#374151',
                borderRadius: '4px',
                fontSize: '12px',
                padding: '2px 6px',
            },
        };
    };

    // Custom components
    const components = {
        event: ({ event }) => (
            <div className="truncate text-xs font-medium">
                {event.title}
            </div>
        ),
    };

    if (loading) {
        return (
            <div style={style} className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div style={style} className="task-calendar">
            <style>{`
                .task-calendar .rbc-calendar {
                    font-family: inherit;
                }
                .task-calendar .rbc-header {
                    padding: 8px 4px;
                    font-weight: 600;
                    font-size: 12px;
                    color: #6b7280;
                    text-transform: uppercase;
                    border-bottom: 1px solid #e5e7eb;
                }
                .task-calendar .rbc-today {
                    background-color: #eef2ff;
                }
                .task-calendar .rbc-off-range-bg {
                    background-color: #f9fafb;
                }
                .task-calendar .rbc-date-cell {
                    padding: 4px 8px;
                    font-size: 13px;
                }
                .task-calendar .rbc-toolbar {
                    margin-bottom: 16px;
                    gap: 8px;
                }
                .task-calendar .rbc-toolbar button {
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 500;
                    border: 1px solid #e5e7eb;
                    background: white;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .task-calendar .rbc-toolbar button:hover {
                    background: #f3f4f6;
                }
                .task-calendar .rbc-toolbar button.rbc-active {
                    background: #6366f1;
                    color: white;
                    border-color: #6366f1;
                }
                .task-calendar .rbc-event {
                    padding: 2px 4px;
                }
                .task-calendar .rbc-show-more {
                    color: #6366f1;
                    font-size: 11px;
                    font-weight: 500;
                }
            `}</style>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', minHeight: '400px' }}
                view={currentView}
                onView={setCurrentView}
                date={currentDate}
                onNavigate={setCurrentDate}
                eventPropGetter={eventStyleGetter}
                components={components}
                views={['month', 'week', 'day']}
                popup
                selectable={false}
            />
        </div>
    );
}
