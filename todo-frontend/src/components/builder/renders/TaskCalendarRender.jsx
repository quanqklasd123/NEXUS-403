// src/components/builder/renders/TaskCalendarRender.jsx
import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import apiService from '../../../services/apiService';

const PRIORITY_COLORS = {
    0: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
    1: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700' },
    2: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700' },
    3: { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-700' },
};

// Calendar Day Component
const CalendarDay = ({ date, currentMonth, events, onDayClick, isPreview = false }) => {
    const dayEvents = events.filter(event => {
        if (!event.dueDate) return false;
        try {
            return isSameDay(new Date(event.dueDate), date);
        } catch {
            return false;
        }
    });
    
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isTodayDate = isToday(date);
    
    return (
        <div
            className={`p-2 min-h-[80px] border border-neutral-200 bg-white ${
                isTodayDate ? 'bg-blue-50 border-blue-300' : ''
            } ${!isCurrentMonth ? 'bg-neutral-50 text-neutral-400' : ''} ${
                isPreview ? 'cursor-pointer hover:bg-neutral-50' : ''
            }`}
            onClick={() => isPreview && onDayClick && onDayClick(date)}
        >
            <span className={`text-sm font-medium ${isTodayDate ? 'text-blue-600' : ''}`}>
                {format(date, 'd')}
            </span>
            <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map(event => {
                    const priority = PRIORITY_COLORS[event.priority] || PRIORITY_COLORS[1];
                    return (
                        <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${priority.bg} ${priority.text} border-l-2 ${priority.border}`}
                            title={event.title}
                        >
                            {event.title}
                        </div>
                    );
                })}
                {dayEvents.length > 2 && (
                    <div className="text-xs text-neutral-500">
                        +{dayEvents.length - 2} more
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TaskCalendarRender({ 
    props = {}, 
    style, 
    isPreview = false,
    tasks: tasksFromProps = [],
    allTasks: allTasksFromProps = []
}) {
    const { showPriority = true, todoListId } = props || {};
    
    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filters, setFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [currentView, setCurrentView] = useState('calendar'); // Track current view from view switcher (mặc định là 'calendar' để tránh trắng màn hình)

    // Apply filters and search
    useEffect(() => {
        let result = [...allTasks];
        if (filters.status !== undefined) result = result.filter(t => t.status === filters.status);
        if (filters.priority !== undefined) result = result.filter(t => t.priority === filters.priority);
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t => t.title?.toLowerCase().includes(query));
        }
        setTasks(result);
    }, [allTasks, filters, searchQuery]);

    // Sử dụng tasks từ props thay vì fetch riêng
    useEffect(() => {
        if (isPreview) {
            setAllTasks([]);
            setTasks([]);
            setLoading(false);
            return;
        }

        const filtered = todoListId ? allTasksFromProps.filter(t => t.todoListId === todoListId) : allTasksFromProps;
        setAllTasks(filtered);
        setLoading(false);
    }, [allTasksFromProps, todoListId, isPreview]);

    // Listen for events
    useEffect(() => {
        const handleFilterChange = (e) => setFilters(e.detail?.filters || {});
        const handleSearchChange = (e) => setSearchQuery(e.detail?.query || '');
        const handleViewChange = (e) => {
            const view = e.detail?.view || 'table';
            setCurrentView(view);
        };
        
        window.addEventListener('filter-change', handleFilterChange);
        window.addEventListener('search-change', handleSearchChange);
        window.addEventListener('view-change', handleViewChange);
        
        return () => {
            window.removeEventListener('filter-change', handleFilterChange);
            window.removeEventListener('search-change', handleSearchChange);
            window.removeEventListener('view-change', handleViewChange);
        };
    }, []);

    // Chỉ hiển thị khi view là 'calendar'
    if (currentView !== 'calendar') {
        return null;
    }

    // Get calendar days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const handleDayClick = (date) => {
        setSelectedDate(date);
        if (!isSameMonth(date, currentMonth)) {
            setCurrentMonth(date);
        }
    };

    const handleMonthChange = (direction) => {
        if (direction === 'prev') {
            setCurrentMonth(subMonths(currentMonth, 1));
        } else {
            setCurrentMonth(addMonths(currentMonth, 1));
        }
    };

    if (loading) {
        return (
            <div style={style} className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
            </div>
        );
    }

    // Chỉ hiển thị khi view được chọn là 'calendar'
    const shouldShow = currentView === 'calendar';
    
    return (
        <div style={{ ...style, display: shouldShow ? 'block' : 'none' }} className="bg-white rounded-lg border border-neutral-200 p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-800">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleMonthChange('prev')}
                        className="p-1 rounded hover:bg-neutral-100 transition-colors"
                        disabled={!isPreview}
                    >
                        <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleMonthChange('next')}
                        className="p-1 rounded hover:bg-neutral-100 transition-colors"
                        disabled={!isPreview}
                    >
                        <FiChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Week day headers */}
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-neutral-600 py-2">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map(day => (
                    <CalendarDay
                        key={day.toISOString()}
                        date={day}
                        currentMonth={currentMonth}
                        events={tasks}
                        onDayClick={handleDayClick}
                        isPreview={isPreview}
                    />
                ))}
            </div>
        </div>
    );
}
