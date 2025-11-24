// src/pages/CalendarPage.jsx
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, isFuture, addMonths, subMonths } from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './CalendarStyles.css';

// Priority color mapping
const priorityMap = {
    0: { color: 'bg-green-500', border: 'border-green-500', text: 'Low' },
    1: { color: 'bg-blue-500', border: 'border-blue-500', text: 'Medium' },
    2: { color: 'bg-red-500', border: 'border-red-500', text: 'High' },
    3: { color: 'bg-pink-500', border: 'border-pink-500', text: 'Urgent' }
};

// Format time from date
const formatTime = (date) => {
    if (!date) return '';
    return format(new Date(date), 'h:mm a');
};

// Format relative date
const formatRelativeDate = (date) => {
    if (!date) return '';
    const today = new Date();
    const eventDate = new Date(date);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    return format(eventDate, 'MMM d');
};

// Event Card Component
const EventCard = ({ event, showTime = false, onClick }) => {
    const priority = priorityMap[event.priority] || priorityMap[1];
    
    return (
        <div 
            className={`upcoming-event border-l-4 ${priority.border} cursor-pointer`}
            onClick={() => onClick && onClick(event)}
        >
            <div className="flex items-center justify-between mb-1">
                <h4 className={`font-medium text-sm ${event.status === 2 ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                    {event.title}
                </h4>
                {showTime && event.dueDate && (
                    <span className="text-xs text-neutral-400">
                        {formatTime(event.dueDate)}
                    </span>
                )}
            </div>
            {event.todoListName && (
                <p className="text-xs text-neutral-500">
                    {event.todoListName}
                </p>
            )}
        </div>
    );
};

// Calendar Day Component
const CalendarDay = ({ date, currentMonth, events, onDayClick, onEventClick }) => {
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
            className={`calendar-day ${isTodayDate ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
            onClick={() => onDayClick && onDayClick(date)}
        >
            <span className="text-sm font-medium mb-1">{format(date, 'd')}</span>
            <div className="event-list">
                {dayEvents.slice(0, 3).map(event => {
                    const priority = priorityMap[event.priority] || priorityMap[1];
                    return (
                        <div
                            key={event.id}
                            className={`calendar-event ${priority.color} text-white`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEventClick && onEventClick(event);
                            }}
                            title={event.title}
                        >
                            {event.title}
                        </div>
                    );
                })}
                {dayEvents.length > 3 && (
                    <div className="text-xs text-neutral-500 mt-1">
                        +{dayEvents.length - 3} more
                    </div>
                )}
            </div>
        </div>
    );
};

// Mini Calendar Component
const MiniCalendar = ({ currentMonth, selectedDate, onDateSelect, onMonthChange }) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-800">Mini Calendar</h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onMonthChange(subMonths(currentMonth, 1))}
                        className="p-1 rounded hover:bg-neutral-100 transition-colors"
                    >
                        <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onMonthChange(addMonths(currentMonth, 1))}
                        className="p-1 rounded hover:bg-neutral-100 transition-colors"
                    >
                        <FiChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="mini-calendar">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-neutral-600 py-1">
                        {day}
                    </div>
                ))}
                {days.map(day => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);
                    const isSelected = isSameDay(day, selectedDate);
                    
                    return (
                        <div
                            key={day.toISOString()}
                            className={`mini-day ${isTodayDate ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => onDateSelect(day)}
                        >
                            {format(day, 'd')}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Main Calendar Page
function CalendarPage() {
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Load events from API
    useEffect(() => {
        const fetchAllItems = async () => {
            try {
                setLoading(true);
                const response = await apiService.getAllMyItems();
                
                const itemsWithDate = response.data
                    .filter(item => item.dueDate)
                    .map(item => ({
                        ...item,
                        dueDate: item.dueDate ? new Date(item.dueDate) : null
                    }));
                
                setEvents(itemsWithDate.filter(item => item.dueDate));
            } catch (error) {
                console.error("Lỗi tải Items:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllItems();
    }, []);

    // Calculate events in current month
    const eventsInCurrentMonth = events.filter(event => {
        if (!event.dueDate) return false;
        const eventDate = new Date(event.dueDate);
        return eventDate.getMonth() === currentMonth.getMonth() && 
               eventDate.getFullYear() === currentMonth.getFullYear();
    }).length;

    // Get calendar days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Filter events
    const todayEvents = events
        .filter(event => isToday(event.dueDate) && event.status !== 2)
        .sort((a, b) => {
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            return 0;
        });

    const upcomingEvents = events
        .filter(event => (isFuture(event.dueDate) || isToday(event.dueDate)) && event.status !== 2)
        .sort((a, b) => a.dueDate - b.dueDate)
        .slice(0, 5);

    const selectedDateEvents = events
        .filter(event => isSameDay(event.dueDate, selectedDate))
        .sort((a, b) => {
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            return 0;
        });

    // Handlers
    const handleDayClick = (date) => {
        setSelectedDate(date);
        if (!isSameMonth(date, currentMonth)) {
            setCurrentMonth(date);
        }
    };

    const handleEventClick = (event) => {
        // TODO: Open event details modal
        console.log('Event clicked:', event);
    };

    const handleMonthChange = (direction) => {
        if (direction === 'prev') {
            setCurrentMonth(subMonths(currentMonth, 1));
        } else {
            setCurrentMonth(addMonths(currentMonth, 1));
        }
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-transparent p-0">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-medium text-neutral-800 mb-2">Calendar</h1>
                        <p className="text-neutral-600">
                            {format(currentMonth, 'MMMM yyyy')} • {eventsInCurrentMonth} events scheduled
                        </p>
                    </div>
                </div>
            </div>

            {/* Calendar Navigation */}
            <section className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-semibold text-neutral-800">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleMonthChange('prev')}
                                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                            >
                                <FiChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleMonthChange('next')}
                                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                            >
                                <FiChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Calendar Container */}
            <section className="calendar-container">
                {/* Main Calendar */}
                <div className="calendar-main">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-sm font-medium text-neutral-600 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <p className="text-neutral-500">Đang tải lịch...</p>
                        </div>
                    ) : (
                        <div className="calendar-grid">
                            {calendarDays.map(day => (
                                <CalendarDay
                                    key={day.toISOString()}
                                    date={day}
                                    currentMonth={currentMonth}
                                    events={events}
                                    onDayClick={handleDayClick}
                                    onEventClick={handleEventClick}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Calendar Sidebar */}
                <div className="calendar-sidebar">
                    {/* Mini Calendar */}
                    <MiniCalendar
                        currentMonth={currentMonth}
                        selectedDate={selectedDate}
                        onDateSelect={handleDayClick}
                        onMonthChange={setCurrentMonth}
                    />

                    {/* Selected Date Events */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                            {format(selectedDate, 'EEEE, MMMM d')}
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {selectedDateEvents.length > 0 ? (
                                selectedDateEvents.map(event => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        showTime={true}
                                        onClick={handleEventClick}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-neutral-500 italic">
                                    No events scheduled for this day.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Today's Events */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Today's Events</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {todayEvents.length > 0 ? (
                                todayEvents.map(event => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        showTime={true}
                                        onClick={handleEventClick}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-neutral-500 italic">
                                    No events scheduled for today.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Upcoming Events</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {upcomingEvents.length > 0 ? (
                                upcomingEvents.map(event => (
                                    <div key={event.id} className="upcoming-event border-l-4 border-sage-400">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className={`font-medium text-sm ${event.status === 2 ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                                                {event.title}
                                            </h4>
                                            <span className="text-xs text-neutral-400">
                                                {formatRelativeDate(event.dueDate)}
                                            </span>
                                        </div>
                                        {event.todoListName && (
                                            <p className="text-xs text-neutral-500">
                                                {event.todoListName}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-neutral-500 italic">
                                    No upcoming events.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default CalendarPage;
