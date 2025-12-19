// src/pages/AppBuilderListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FiPlus, FiLayout, FiEdit3, FiTrash2, FiEye, 
    FiClock, FiCheck, FiSearch, FiGrid, FiList 
} from 'react-icons/fi';
import apiService from '../services/apiService';

/**
 * Project Card Component
 */
const ProjectCard = ({ project, onDelete, onEdit }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    const handleEdit = () => {
        navigate(`/app-builder/${project.id}`);
    };

    const handleDelete = () => {
        if (window.confirm(`Bạn có chắc muốn xóa "${project.name}"?`)) {
            onDelete(project.id);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div 
            className="bg-white border border-neutral-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Preview Area */}
            <div 
                className="h-40 bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center cursor-pointer relative"
                onClick={handleEdit}
            >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                    <FiLayout className="w-8 h-8 text-neutral-400" />
                </div>
                
                {/* Hover Overlay */}
                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                        className="p-3 bg-white rounded-xl hover:bg-neutral-100 transition-colors"
                        title="Edit"
                    >
                        <FiEdit3 className="w-5 h-5 text-neutral-700" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        className="p-3 bg-white rounded-xl hover:bg-red-50 transition-colors"
                        title="Delete"
                    >
                        <FiTrash2 className="w-5 h-5 text-red-500" />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-neutral-800 line-clamp-1">
                        {project.name || 'Untitled Project'}
                    </h3>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-md ${
                        project.isPublished 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-neutral-100 text-neutral-600'
                    }`}>
                        {project.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                </div>
                
                <p className="text-xs text-neutral-500 line-clamp-2 h-8 mb-3">
                    {project.description || 'No description'}
                </p>

                <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {formatDate(project.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );
};

/**
 * App Builder List Page - Shows all projects
 */
const AppBuilderListPage = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    // Modal state for creating new project
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectData, setNewProjectData] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    // Fetch projects
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.getProjects();
            setProjects(response.data || []);
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError('Không thể tải danh sách projects');
        } finally {
            setLoading(false);
        }
    };

    // Create new project
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectData.name.trim()) {
            alert('Vui lòng nhập tên project');
            return;
        }

        try {
            setCreating(true);
            const response = await apiService.createProject(newProjectData);
            const newProject = response.data;
            
            // Navigate to builder with new project
            navigate(`/app-builder/${newProject.id}`);
        } catch (err) {
            console.error('Error creating project:', err);
            alert('Không thể tạo project mới');
        } finally {
            setCreating(false);
        }
    };

    // Delete project
    const handleDeleteProject = async (id) => {
        try {
            await apiService.deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Error deleting project:', err);
            alert('Không thể xóa project');
        }
    };

    // Filter projects by search
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
                    <h1 className="text-2xl font-semibold text-neutral-800">App Builder List</h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Tạo và quản lý các app của bạn
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800 text-white rounded-xl hover:bg-black transition-colors text-sm font-medium shadow-lg shadow-neutral-800/20"
                >
                    <FiPlus className="w-4 h-4" />
                    <span>Create New App</span>
                </button>
            </div>

            {/* Search & View Options */}
            <div className="flex items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
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
                        <p className="text-neutral-500">Đang tải projects...</p>
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
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiLayout className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">
                        {searchQuery ? 'Không tìm thấy project' : 'Chưa có project nào'}
                    </h3>
                    <p className="text-neutral-500 mb-6">
                        {searchQuery
                            ? 'Thử tìm kiếm với từ khóa khác'
                            : 'Tạo project mới để bắt đầu xây dựng app'
                        }
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-5 py-2.5 bg-neutral-800 text-white rounded-xl hover:bg-black"
                        >
                            <FiPlus className="w-4 h-4 inline mr-2" />
                            Create New App
                        </button>
                    )}
                </div>
            ) : (
                /* Projects Grid */
                <div className={`grid gap-6 ${
                    viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'grid-cols-1'
                }`}>
                    {/* Create New Card */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="border-2 border-dashed border-neutral-300 rounded-2xl p-6 flex flex-col items-center justify-center text-neutral-400 hover:border-sage-400 hover:text-sage-600 hover:bg-sage-50 transition-all group min-h-[280px]"
                    >
                        <div className="w-14 h-14 rounded-full bg-neutral-100 group-hover:bg-sage-200 flex items-center justify-center mb-4 transition-colors">
                            <FiPlus className="w-6 h-6" />
                        </div>
                        <span className="font-medium">Create New App</span>
                        <span className="text-xs mt-1">Start from scratch</span>
                    </button>

                    {/* Project Cards */}
                    {filteredProjects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onDelete={handleDeleteProject}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                            Create New App
                        </h2>
                        
                        <form onSubmit={handleCreateProject}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    App Name *
                                </label>
                                <input
                                    type="text"
                                    value={newProjectData.name}
                                    onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="My Awesome App"
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500"
                                    autoFocus
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newProjectData.description}
                                    onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe your app..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setNewProjectData({ name: '', description: '' });
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newProjectData.name.trim()}
                                    className="flex-1 px-4 py-2.5 bg-neutral-800 text-white rounded-xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? 'Creating...' : 'Create App'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppBuilderListPage;
