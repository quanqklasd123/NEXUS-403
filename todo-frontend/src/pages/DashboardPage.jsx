import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { 
    FiCheckSquare, FiTrello, FiCalendar, FiSettings, 
    FiPlus, FiEdit3, FiTrash2, FiLayout, FiPackage
} from 'react-icons/fi';

// ... (Component AppMiniCard giữ nguyên) ...
const AppMiniCard = ({ to, icon, title, subtitle, color }) => {
    const Icon = icon; 
    const colorClasses = {
        'sage': 'bg-sage-400',
        'peach': 'bg-peach-400',
        'butter': 'bg-butter-400',
        'neutral': 'bg-neutral-400',
    };
    
    return (
        <Link 
            to={to} 
            className="block bg-white border border-neutral-200 rounded-2xl p-5 text-center 
                       transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
            <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl mx-auto mb-3 
                            flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-neutral-800 mb-1">{title}</h4>
            <p className="text-xs text-neutral-500">{subtitle}</p>
        </Link>
    );
};

// ... (Component StatCard giữ nguyên) ...
const StatCard = ({ title, value, color }) => {
     const colorClasses = {
        'sage': 'text-sage-600',
        'peach': 'text-peach-600',
        'butter': 'text-butter-700',
    };
    return (
         <div className="card text-center bg-white border border-neutral-200 rounded-2xl p-6">
            <h4 className={`text-3xl font-bold mb-2 ${colorClasses[color]}`}>{value}</h4>
            <p className="text-neutral-600">{title}</p>
        </div>
    );
};

// --- COMPONENT MỚI: PROJECT CARD ---
const ProjectCard = ({ project, onDelete }) => {
    return (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 transition-all hover:shadow-md group relative">
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500">
                    <FiLayout className="w-5 h-5" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button 
                        onClick={(e) => { e.preventDefault(); onDelete(project.id); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Delete Project"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <Link to={`/builder/${project.id}`} className="block">
                <h4 className="font-semibold text-neutral-800 mb-1 hover:text-sage-600 transition-colors">
                    {project.name}
                </h4>
                <p className="text-xs text-neutral-500 line-clamp-2 h-8 mb-3">
                    {project.description || "No description"}
                </p>
                
                <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                    <span className="text-[10px] font-medium px-2 py-1 bg-neutral-100 text-neutral-600 rounded-md">
                        {project.isPublished ? "PUBLISHED" : "DRAFT"}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                        {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </Link>
        </div>
    );
};

// --- TRANG DASHBOARD ---
function DashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalLists: 0, totalTasks: 0, completedTasks: 0 });
    
    // State cho Projects
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectData, setNewProjectData] = useState({ name: '', description: '' });

    // Tải dữ liệu
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Gọi song song 2 API
                const [statsRes, projectsRes] = await Promise.all([
                    apiService.getDashboardStats(),
                    apiService.getProjects()
                ]);
                
                setStats(statsRes.data);
                setProjects(projectsRes.data);
            } catch (error) {
                console.error("Lỗi tải Dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Xử lý Tạo Project Mới
    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const res = await apiService.createProject(newProjectData);
            const newProject = res.data;
            
            // Chuyển hướng ngay sang Builder với ID mới
            navigate(`/builder/${newProject.id}`);
        } catch (error) {
            alert("Lỗi khi tạo project");
        }
    };

    // Xử lý Xóa Project
    const handleDeleteProject = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa dự án này?")) return;
        try {
            await apiService.deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            alert("Không thể xóa project");
        }
    };

    return (
        <div className="flex flex-col gap-10">
            {/* 1. Hero Section */}
            <section className="text-center py-8">
                <h1 className="text-4xl font-medium mb-4 text-neutral-800">
                    Chào mừng trở lại!
                </h1>
                <p className="text-neutral-600 max-w-2xl mx-auto">
                    Quản lý công việc và xây dựng ứng dụng của riêng bạn tại đây.
                </p>
            </section>

            {/* 2. Quick Stats */}
            <section>
                <h3 className="text-xl font-medium mb-6 text-neutral-800">Tổng quan</h3>
                {loading ? <p>Đang tải...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Công việc Hoàn thành" value={stats.completedTasks} color="sage" />
                        <StatCard title="Dự án (Lists)" value={stats.totalLists} color="peach" />
                        <StatCard title="Tổng Công việc" value={stats.totalTasks} color="butter" />
                    </div>
                )}
            </section>

            {/* 3. MY PROJECTS (MỚI) */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-neutral-800">Dự án của tôi (App Builder)</h3>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-xl hover:bg-black transition-colors text-sm font-medium shadow-lg shadow-neutral-800/20"
                    >
                        <FiPlus /> Tạo App Mới
                    </button>
                </div>

                {loading ? <p>Đang tải projects...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Nút tạo nhanh (Card đầu tiên) */}
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="border-2 border-dashed border-neutral-300 rounded-2xl p-5 flex flex-col items-center justify-center text-neutral-400 hover:border-sage-400 hover:text-sage-600 hover:bg-sage-50 transition-all group h-full min-h-[180px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-neutral-100 group-hover:bg-sage-200 flex items-center justify-center mb-3 transition-colors">
                                <FiPlus className="w-6 h-6" />
                            </div>
                            <span className="font-medium">New Project</span>
                        </button>

                        {/* Danh sách Projects */}
                        {projects.map(project => (
                            <ProjectCard 
                                key={project.id} 
                                project={project} 
                                onDelete={handleDeleteProject}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* 4. Quick Links (App Mini Grid cũ - thu gọn lại) */}
            <section>
                <h3 className="text-xl font-medium mb-6 text-neutral-800">Lối tắt</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <AppMiniCard to="/tasks" icon={FiCheckSquare} title="My Tasks" subtitle="Tất cả công việc" color="sage" />
                    <AppMiniCard to="/kanban" icon={FiTrello} title="Kanban" subtitle="Xem dạng bảng" color="peach" />
                    <AppMiniCard to="/calendar" icon={FiCalendar} title="Calendar" subtitle="Xem lịch" color="butter" />
                    <AppMiniCard to="/marketplace" icon={FiPackage} title="Marketplace" subtitle="Cài thêm App" color="neutral" />
                </div>
            </section>

            {/* MODAL TẠO PROJECT */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                        <h3 className="text-xl font-semibold mb-4">Tạo App Mới</h3>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Tên App</label>
                                <input 
                                    type="text" required autoFocus
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-sage-400 outline-none"
                                    value={newProjectData.name}
                                    onChange={e => setNewProjectData({...newProjectData, name: e.target.value})}
                                    placeholder="Ví dụ: CRM Sales v1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Mô tả</label>
                                <textarea 
                                    rows="3"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-sage-400 outline-none"
                                    value={newProjectData.description}
                                    onChange={e => setNewProjectData({...newProjectData, description: e.target.value})}
                                    placeholder="App này dùng để..."
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-2.5 border border-neutral-300 rounded-xl font-medium hover:bg-neutral-50"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-sage-500 text-white rounded-xl font-medium hover:bg-sage-600 shadow-lg shadow-sage-500/20"
                                >
                                    Tạo & Mở Builder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashboardPage;