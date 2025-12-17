// src/pages/AppRuntimePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiMaximize2, FiMinimize2, FiHome } from 'react-icons/fi';
import apiService from '../services/apiService';
import RenderComponent from '../components/builder/RenderComponent';

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

    // Listen for view-change events from ViewSwitcher
    useEffect(() => {
        const handleViewChange = (e) => {
            setActiveView(e.detail?.view || 'table');
        };
        window.addEventListener('view-change', handleViewChange);
        return () => window.removeEventListener('view-change', handleViewChange);
    }, []);

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
                const response = await apiService.getProject(projectId);
                const projectData = response.data;
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
                onUpdateProps={(newProps) => handleUpdateProps(item.id, newProps)}
            />
        ));
    };

    // Loading state
    if (loading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600 mx-auto mb-4"></div>
                    <p className="text-neutral-500">Đang tải app...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">❌</span>
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-800 mb-2">Lỗi</h2>
                    <p className="text-neutral-500 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-black"
                    >
                        Quay lại
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
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📭</span>
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-800 mb-2">App trống</h2>
                    <p className="text-neutral-500 mb-4">App này chưa có nội dung</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-neutral-50 z-50 flex flex-col">
            {/* Header Bar */}
            {showHeader && (
                <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
                    <div className="flex items-center gap-4">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Quay lại My Apps"
                        >
                            <FiArrowLeft className="w-5 h-5 text-neutral-700" />
                        </button>

                        {/* App Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-xl flex items-center justify-center text-neutral-800 font-medium border border-neutral-300">
                                {project?.name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                                <h1 className="font-semibold text-neutral-800">
                                    {project?.name || 'Untitled App'}
                                </h1>
                                <p className="text-xs text-neutral-500">
                                    {project?.description || 'No description'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Home */}
                        <Link
                            to="/"
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="My Apps"
                        >
                            <FiHome className="w-5 h-5 text-neutral-700" />
                        </Link>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? (
                                <FiMinimize2 className="w-5 h-5 text-neutral-700" />
                            ) : (
                                <FiMaximize2 className="w-5 h-5 text-neutral-700" />
                            )}
                        </button>

                        {/* Hide Header Toggle */}
                        <button
                            onClick={() => setShowHeader(false)}
                            className="px-3 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors text-neutral-700"
                        >
                            Hide Header
                        </button>
                    </div>
                </div>
            )}

            {/* Show Header Button (when hidden) */}
            {!showHeader && (
                <button
                    onClick={() => setShowHeader(true)}
                    className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-white shadow-lg rounded-lg text-xs text-neutral-700 hover:bg-neutral-50 border border-neutral-200"
                >
                    Show Header
                </button>
            )}

            {/* App Content Area - Full canvas like AppBuilder preview */}
            <div className="flex-1 overflow-auto bg-neutral-50">
                <div className="relative min-h-full w-full">
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
                                        isPreview={true}
                                        navigate={navigate}
                                        context={appState}
                                        onUpdateProps={(newProps) => handleUpdateProps(item.id, newProps)}
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
