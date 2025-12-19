// src/pages/MyAppPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiPlus, FiLayers, FiShoppingBag, FiSearch, FiGrid, FiList, FiPlay, FiEdit3, FiTrash2, FiClock } from 'react-icons/fi';
import apiService from '../services/apiService';

/**
 * App Card Component - Interactive card with mini preview
 */
const AppCard = ({ project, onDelete, onOpen, onEdit }) => {
    const [isHovered, setIsHovered] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Get first letter for avatar
    const getInitial = () => {
        return project.name?.charAt(0)?.toUpperCase() || 'A';
    };

    // Count components in app
    const getComponentCount = () => {
        try {
            if (project.jsonData) {
                const items = JSON.parse(project.jsonData);
                return items.length;
            }
        } catch (e) {}
        return 0;
    };

    return (
        <div 
            className="bg-white border border-neutral-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onOpen(project)}
        >
            {/* Preview Area */}
            <div className="h-44 bg-gradient-to-br from-neutral-50 to-neutral-100 relative overflow-hidden">
                {/* Mini Preview Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                        <span className="text-3xl">{getInitial()}</span>
                    </div>
                </div>

                {/* Component Count Badge */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-neutral-600">
                    {getComponentCount()} components
                </div>

                {/* Status Badge */}
                <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium ${
                    project.isPublished 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-neutral-100 text-neutral-600'
                }`}>
                    {project.isPublished ? '✓ Published' : 'Draft'}
                </div>
                
                {/* Hover Overlay */}
                <div className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-3 transition-opacity duration-200 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpen(project); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl hover:bg-neutral-100 transition-colors text-sm font-medium"
                        title="Open App"
                    >
                        <FiPlay className="w-4 h-4 text-sage-600" />
                        <span>Open</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                        className="p-2.5 bg-white/90 rounded-xl hover:bg-white transition-colors"
                        title="Edit in App Builder"
                    >
                        <FiEdit3 className="w-4 h-4 text-neutral-700" />
                    </button>
                    <button
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (window.confirm(`Bạn có chắc muốn xóa "${project.name}"?`)) {
                                onDelete(project.id);
                            }
                        }}
                        className="p-2.5 bg-white/90 rounded-xl hover:bg-red-50 transition-colors"
                        title="Delete"
                    >
                        <FiTrash2 className="w-4 h-4 text-red-500" />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="font-semibold text-neutral-800 line-clamp-1 mb-1">
                    {project.name || 'Untitled App'}
                </h3>
                <p className="text-xs text-neutral-500 line-clamp-2 h-8 mb-3">
                    {project.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {formatDate(project.createdAt)}
                    </span>
                    <span className="text-sage-600 font-medium">
                        🛠️ Created
                    </span>
                </div>
            </div>
        </div>
    );
};

/**
 * MyAppPage - Dashboard page showing all user's apps from Projects
 */
const MyAppPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    // Fetch projects - refresh khi location thay đổi (ví dụ quay lại từ Marketplace sau khi install)
    useEffect(() => {
        fetchProjects();
    }, [location.pathname, location.key]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.getProjects();
            setProjects(response.data || []);
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError('Không thể tải danh sách apps. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Handle open app (navigate to runtime)
    const handleOpenApp = (project) => {
        navigate(`/app/${project.id}`);
    };

    // Handle edit app (navigate to App Builder)
    const handleEditApp = (project) => {
        navigate(`/app-builder/${project.id}`);
    };

    // Handle delete app
    const handleDeleteApp = async (projectId) => {
        try {
            await apiService.deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (err) {
            console.error('Error deleting project:', err);
            alert('Không thể xóa app. Vui lòng thử lại.');
        }
    };

    // Filter projects by search query
    const filteredProjects = projects.filter(project => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            project.name?.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-800">My Apps</h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Các ứng dụng bạn đã tạo từ App Builder
                    </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Link 
                        to="/app-builder"
                        className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 text-white rounded-xl hover:bg-black transition-colors text-sm font-medium shadow-lg shadow-neutral-800/20"
                    >
                        <FiLayers className="w-4 h-4" />
                        <span>Create App</span>
                    </Link>
                    <Link 
                        to="/marketplace"
                        className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
                    >
                        <FiShoppingBag className="w-4 h-4" />
                        <span>Marketplace</span>
                    </Link>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-6 py-4 px-6 bg-white rounded-2xl border border-neutral-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center">
                        <FiLayers className="w-5 h-5 text-sage-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-neutral-800">{projects.length}</p>
                        <p className="text-xs text-neutral-500">Total Apps</p>
                    </div>
                </div>
                <div className="w-px h-10 bg-neutral-200"></div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-green-600">✓</span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-neutral-800">
                            {projects.filter(p => p.isPublished).length}
                        </p>
                        <p className="text-xs text-neutral-500">Published</p>
                    </div>
                </div>
                <div className="w-px h-10 bg-neutral-200"></div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <span className="text-amber-600">✎</span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-neutral-800">
                            {projects.filter(p => !p.isPublished).length}
                        </p>
                        <p className="text-xs text-neutral-500">Drafts</p>
                    </div>
                </div>
            </div>

            {/* Search & View Options */}
            <div className="flex items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search apps..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${
                            viewMode === 'grid' 
                                ? 'bg-white shadow-sm text-neutral-800' 
                                : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        <FiGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${
                            viewMode === 'list' 
                                ? 'bg-white shadow-sm text-neutral-800' 
                                : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        <FiList className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sage-600 mx-auto mb-4"></div>
                        <p className="text-neutral-500">Đang tải apps...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button 
                        onClick={fetchProjects}
                        className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-black"
                    >
                        Thử lại
                    </button>
                </div>
            ) : filteredProjects.length === 0 && !searchQuery ? (
                /* Empty State */
                <div className="text-center py-20">
                    <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiLayers className="w-10 h-10 text-neutral-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                        Chưa có app nào
                    </h3>
                    <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                        Bắt đầu tạo app đầu tiên của bạn với App Builder hoặc khám phá Marketplace
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link 
                            to="/app-builder"
                            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800 text-white rounded-xl hover:bg-black transition-colors font-medium"
                        >
                            <FiPlus className="w-4 h-4" />
                            Create App
                        </Link>
                        <Link 
                            to="/marketplace"
                            className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors font-medium"
                        >
                            <FiShoppingBag className="w-4 h-4" />
                            Marketplace
                        </Link>
                    </div>
                </div>
            ) : filteredProjects.length === 0 ? (
                /* No search results */
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiSearch className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">
                        Không tìm thấy app
                    </h3>
                    <p className="text-neutral-500">
                        Thử tìm kiếm với từ khóa khác
                    </p>
                </div>
            ) : (
                /* Apps Grid */
                <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'grid-cols-1'
                }`}>
                    {/* Create New App Card */}
                    <Link 
                        to="/app-builder"
                        className="border-2 border-dashed border-neutral-300 rounded-2xl p-6 flex flex-col items-center justify-center text-neutral-400 hover:border-sage-400 hover:text-sage-600 hover:bg-sage-50 transition-all group min-h-[280px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-neutral-100 group-hover:bg-sage-200 flex items-center justify-center mb-4 transition-colors">
                            <FiPlus className="w-7 h-7" />
                        </div>
                        <span className="font-semibold text-base">Create New App</span>
                        <span className="text-xs mt-1">Start from scratch</span>
                    </Link>

                    {/* App Cards */}
                    {filteredProjects.map(project => (
                        <AppCard
                            key={project.id}
                            project={project}
                            onOpen={handleOpenApp}
                            onEdit={handleEditApp}
                            onDelete={handleDeleteApp}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAppPage;
