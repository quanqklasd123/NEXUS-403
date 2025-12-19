// src/pages/AppRuntimePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiMaximize2, FiMinimize2, FiHome, FiStar } from 'react-icons/fi';
import apiService from '../services/apiService';
import RenderComponent from '../components/builder/RenderComponent';
import useTaskData from '../hooks/useTaskData';

/**
 * AppRuntimePage - Full screen app runtime (like App Builder preview)
 * Shows the app in interactive mode
 */
const AppRuntimePage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    
    const [project, setProject] = useState(null);
    const [canvasItems, setCanvasItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [activeView, setActiveView] = useState('table'); // Track active view for view switching
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState('all');

    // Use task data hook for full functionality
    const {
        tasks,
        allTasks,
        loading: tasksLoading,
        error: tasksError,
        filters,
        fetchTasks,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        setFilters,
        setSearchQuery: setTaskSearchQuery,
        setSort
    } = useTaskData({ isPreview: false, appId: projectId });

    // Listen for view-change events from ViewSwitcher
    useEffect(() => {
        const handleViewChange = (e) => {
            setActiveView(e.detail?.view || 'table');
        };
        window.addEventListener('view-change', handleViewChange);
        return () => window.removeEventListener('view-change', handleViewChange);
    }, []);

    // Listen for filter changes
    useEffect(() => {
        const handleFilterChange = (e) => {
            setFilterTag(e.detail?.tag || 'all');
        };
        window.addEventListener('filter-change', handleFilterChange);
        return () => window.removeEventListener('filter-change', handleFilterChange);
    }, []);

    // Listen for search changes
    useEffect(() => {
        const handleSearchChange = (e) => {
            const query = e.detail?.query || '';
            setSearchQuery(query);
            setTaskSearchQuery(query);
        };
        window.addEventListener('search-change', handleSearchChange);
        return () => window.removeEventListener('search-change', handleSearchChange);
    }, [setTaskSearchQuery]);

    // Listen for tasks-updated events to refresh data
    useEffect(() => {
        const handleTasksUpdated = () => {
            fetchTasks();
        };
        window.addEventListener('tasks-updated', handleTasksUpdated);
        return () => window.removeEventListener('tasks-updated', handleTasksUpdated);
    }, [fetchTasks]);

    // App State for interactive components
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

    // Fetch project data
    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) {
                setError('Project ID không hợp lệ');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log('[AppRuntimePage] Loading project with ID:', projectId);
                const response = await apiService.getProject(projectId);
                const projectData = response.data;
                console.log('[AppRuntimePage] Project data:', projectData);
                setProject(projectData);

                if (projectData.jsonData) {
                    try {
                        const items = JSON.parse(projectData.jsonData);
                        setCanvasItems(items);
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                        setCanvasItems([]);
                    }
                }
            } catch (err) {
                console.error('Error fetching project:', err);
                setError('Không thể tải app. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId]);

    // Fetch tasks when component mounts
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Update component props (for interactive components)
    const handleUpdateProps = (id, newProps) => {
        setCanvasItems(prev => prev.map(item => 
            item.id === id 
                ? { ...item, props: { ...item.props, ...newProps } }
                : item
        ));
    };

    // Render components recursively
    const renderItems = (parentId = null) => {
        const childItems = canvasItems.filter(item => item.parentId === parentId);
        
        return childItems.map(item => (
            <RenderComponent
                key={item.id}
                item={item}
                items={canvasItems}
                isPreview={true}
                context={appState}
                onClick={() => {}} // Dummy onClick để tránh lỗi trong runtime mode
                onUpdateProps={(newProps) => handleUpdateProps(item.id, newProps)}
            />
        ));
    };

    // Loading state
    if (loading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-black mx-auto mb-6"></div>
                    <p className="text-black font-medium tracking-wide text-sm">LOADING APP...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="text-center max-w-md px-6">
                    <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <span className="text-3xl">!</span>
                    </div>
                    <h2 className="text-2xl font-bold text-black mb-2">Something went wrong</h2>
                    <p className="text-gray-500 mb-8">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 bg-black text-white rounded-full hover:scale-105 transition-transform font-medium shadow-lg"
                    >
                        Go Back Home
                    </button>
                </div>
            </div>
        );
    }

    // No items
    if (canvasItems.length === 0) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-100">
                        <span className="text-4xl grayscale">📱</span>
                    </div>
                    <h2 className="text-2xl font-bold text-black mb-2">Empty App</h2>
                    <p className="text-gray-500 mb-8">This app has no content yet.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 border-2 border-black text-black rounded-full hover:bg-black hover:text-white transition-all font-medium"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans">
            {/* Header Bar */}
            {showHeader && (
                <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0 z-50 sticky top-0 transition-all duration-300">
                    <div className="flex items-center gap-5">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate('/')}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-black hover:text-white transition-all duration-300 group shadow-sm"
                            title="Back to My Apps"
                        >
                            <FiArrowLeft className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                        </button>

                        {/* App Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black text-white rounded-2xl shadow-lg flex items-center justify-center font-bold text-xl">
                                {project?.name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                                <h1 className="font-bold text-xl text-black tracking-tight">
                                    {project?.name || 'Untitled App'}
                                </h1>
                                <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                                    {project?.description || 'No description'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Home */}
                        <Link
                            to="/"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-black hover:text-white transition-all duration-300 group shadow-sm"
                            title="Home"
                        >
                            <FiHome className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                        </Link>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-black hover:text-white transition-all duration-300 group shadow-sm"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? (
                                <FiMinimize2 className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                            ) : (
                                <FiMaximize2 className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                            )}
                        </button>

                        {/* Hide Header Toggle */}
                        <button
                            onClick={() => setShowHeader(false)}
                            className="px-4 py-2 text-xs font-bold bg-black text-white rounded-full hover:bg-gray-800 transition-all shadow-md"
                        >
                            HIDE HEADER
                        </button>
                    </div>
                </div>
            )}

            {/* Show Header Button (when hidden) */}
            {!showHeader && (
                <button
                    onClick={() => setShowHeader(true)}
                    className="fixed top-6 right-6 z-50 px-5 py-2.5 bg-black text-white shadow-xl rounded-full text-xs font-bold hover:scale-105 transition-transform"
                >
                    SHOW HEADER
                </button>
            )}

            {/* App Content Area - Full canvas like AppBuilder preview */}
            <div className="flex-1 overflow-auto bg-gray-50 flex justify-center relative">
                {/* Modern Background Pattern */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    {/* Dot Pattern - Technical/Modern Look */}
                    <div className="absolute inset-0 opacity-[0.03]" 
                         style={{ 
                             backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', 
                             backgroundSize: '24px 24px' 
                         }}>
                    </div>
                    
                    {/* Subtle Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/50"></div>

                    {/* Decorative Stars - Floating Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <FiStar className="absolute top-[10%] left-[5%] text-black w-8 h-8 opacity-[0.08] rotate-12 animate-pulse" style={{ animationDuration: '4s' }} />
                        <FiStar className="absolute top-[20%] right-[10%] text-black w-12 h-12 opacity-[0.05] -rotate-12" />
                        <FiStar className="absolute bottom-[15%] left-[10%] text-black w-16 h-16 opacity-[0.04] rotate-45" />
                        <FiStar className="absolute bottom-[30%] right-[15%] text-black w-10 h-10 opacity-[0.06] rotate-12 animate-pulse" style={{ animationDuration: '5s' }} />
                        <FiStar className="absolute top-[40%] left-[20%] text-black w-6 h-6 opacity-[0.08]" />
                        
                        {/* Mobile App Abstract Shapes */}
                        <div className="absolute top-[15%] right-[25%] w-20 h-32 border-2 border-black/5 rounded-3xl rotate-12"></div>
                        <div className="absolute bottom-[20%] left-[25%] w-24 h-24 border-2 border-black/5 rounded-full -rotate-12"></div>
                    </div>
                </div>

                <div className="relative min-h-full w-full max-w-7xl z-10 p-8">
                    {canvasItems
                        .filter(item => !item.parentId)
                        .filter(item => {
                            // Only filter data components by view - control components always show
                            const isDataComponent = ['taskBoard', 'taskList', 'taskTable', 'taskCalendar'].includes(item.type);
                            if (!isDataComponent) {
                                return true; // Always show control components (buttons, filters, etc)
                            }
                            // For data components, check visibleInViews
                            const visibleInViews = item.props?.visibleInViews || ['table', 'list', 'board', 'calendar'];
                            return visibleInViews.includes(activeView);
                        })
                        .map(item => {
                            const position = item.position || { x: 20, y: 20 };
                            const itemStyle = item.style || {};
                            
                            return (
                                <div
                                    key={item.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${position.x}px`,
                                        top: `${position.y}px`,
                                        width: itemStyle.width || 'auto',
                                        height: itemStyle.height || 'auto',
                                        zIndex: 1 // Ensure proper z-index stacking
                                    }}
                                >
                                    <RenderComponent
                                        item={item}
                                        items={canvasItems}
                                        isPreview={false}
                                        navigate={navigate}
                                        context={appState}
                                        onClick={() => {}} // Dummy onClick để tránh lỗi
                                        onUpdateProps={(newProps) => handleUpdateProps(item.id, newProps)}
                                        tasks={tasks}
                                        allTasks={allTasks}
                                        searchQuery={searchQuery}
                                        filterTag={filterTag}
                                        filters={filters}
                                        onTaskCreate={createTask}
                                        onTaskUpdate={updateTask}
                                        onTaskStatusUpdate={updateTaskStatus}
                                        onTaskDelete={deleteTask}
                                        appId={projectId}
                                    />
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

export default AppRuntimePage;
