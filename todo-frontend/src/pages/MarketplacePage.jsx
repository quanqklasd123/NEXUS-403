import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { isAdmin } from '../utils/jwtUtils';
import { FiSearch, FiFilter, FiDownload, FiStar, FiSettings, FiCheck, FiX, FiPlus, FiEye } from 'react-icons/fi';

// --- MODAL XEM APP DETAIL (READ-ONLY) ---
const AppDetailModal = ({ app, isOpen, onClose }) => {
    if (!isOpen || !app) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-neutral-800">{app.name}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5 text-neutral-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-700 mb-2">Description</h3>
                        <p className="text-neutral-600">{app.description || 'No description available'}</p>
                    </div>

                    {/* Category & Price */}
                    <div className="flex gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Category</h3>
                            <span className="inline-block px-3 py-1 bg-sage-100 text-sage-700 rounded-lg text-sm font-medium">
                                {app.category || 'Uncategorized'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Price</h3>
                            <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                                app.price ? 'bg-warning/10 text-warning' : 'bg-sage-100 text-sage-700'
                            }`}>
                                {app.price || 'Free'}
                            </span>
                        </div>
                    </div>

                    {/* Author */}
                    {app.author && (
                        <div>
                            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Author</h3>
                            <p className="text-neutral-600">{app.author}</p>
                        </div>
                    )}

                    {/* Note: Read-only */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                        <p className="text-sm text-neutral-600">
                            <strong>Note:</strong> This is a read-only preview. Install this app to your workspace to edit and customize it.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                    {!app.isInstalled && (
                        <button
                            onClick={() => {
                                // Handle install from modal
                                onClose();
                            }}
                            className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
                        >
                            Install App
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MODAL TẠO CATEGORY ---
const CreateCategoryModal = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('sage');
    const [loading, setLoading] = useState(false);

    const colors = [
        { value: 'sage', label: 'Sage', class: 'bg-sage-500' },
        { value: 'peach', label: 'Peach', class: 'bg-peach-500' },
        { value: 'butter', label: 'Butter', class: 'bg-butter-500' },
        { value: 'neutral', label: 'Neutral', class: 'bg-neutral-500' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Please enter a category name');
            return;
        }

        try {
            setLoading(true);
            await apiService.createCategory({
                name: name.trim(),
                description: description.trim() || null,
                color: color
            });
            onCreate();
            setName('');
            setDescription('');
            setColor('sage');
            onClose();
        } catch (error) {
            console.error('Error creating category:', error);
            alert(error.response?.data?.message || 'Error creating category');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-neutral-200">
                    <h2 className="text-xl font-bold text-neutral-800">Create New Category</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-sage-400 outline-none"
                            placeholder="e.g., E-commerce, Dashboard"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-sage-400 outline-none"
                            rows="3"
                            placeholder="Optional description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Color
                        </label>
                        <div className="flex gap-2">
                            {colors.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`w-10 h-10 rounded-lg ${c.class} ${
                                        color === c.value ? 'ring-2 ring-offset-2 ring-sage-600' : ''
                                    }`}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="flex-1 px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENT APP CARD ---
const AppCard = ({ app, onInstall, onView }) => {
    const colorClasses = {
        'sage': 'from-sage-400 to-sage-600 bg-gradient-to-br',
        'peach': 'from-peach-400 to-peach-600 bg-gradient-to-br',
        'butter': 'from-butter-400 to-butter-600 bg-gradient-to-br',
        'neutral': 'bg-neutral-400',
    };
    
    return (
        <div onClick={() => onView(app)} className={`bg-white border border-neutral-200 rounded-2xl p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all ${app.isInstalled ? 'border-success/50 bg-success/5' : ''}`}>
            {/* Icon */}
            <div className={`w-12 h-12 ${colorClasses[app.color] || 'bg-neutral-400'} rounded-xl mx-auto mb-3 flex items-center justify-center shadow-sm`}>
                <FiSettings className="w-6 h-6 text-white" />
            </div>
            
            {/* Content */}
            <h4 className="font-semibold text-sm mb-1 text-neutral-800">{app.name}</h4>
            <p className="text-xs text-neutral-500 mb-3 line-clamp-2 h-8">{app.description}</p>
            
            {/* Category Tag */}
            <div className="mb-3">
                <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                    {app.category || 'Uncategorized'}
                </span>
            </div>

            {/* Footer: Price & Actions */}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                <span className={`text-xs font-medium px-2 py-1 rounded ${app.price ? 'bg-warning/10 text-warning' : 'bg-sage-100 text-sage-700'}`}>
                    {app.price || 'Free'}
                </span>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(app); }}
                        className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="View details"
                    >
                        <FiEye className="w-4 h-4" />
                    </button>
                    {app.isInstalled ? (
                        <button disabled className="flex items-center gap-1 text-xs font-bold text-success">
                            <FiCheck /> Installed
                        </button>
                    ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onInstall(app.id); }}
                            className="text-xs font-bold text-sage-600 hover:text-sage-800 hover:underline"
                        >
                            Install
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- TRANG CHÍNH ---
function MarketplacePage() {
    const [apps, setApps] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedApp, setSelectedApp] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Load categories và apps
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [categoriesRes, appsRes] = await Promise.all([
                    apiService.getCategories(),
                    apiService.getMarketplaceApps(selectedCategory)
                ]);
                setCategories(categoriesRes.data || []);
                setApps(appsRes.data || []);
            } catch (error) {
                console.error("Lỗi tải Marketplace:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [location.pathname, location.key, selectedCategory]);

    // Xử lý cài đặt App
    const handleInstall = async (appId) => {
        try {
            await apiService.installApp(appId);
            setApps(prevApps => prevApps.map(app => 
                app.id === appId ? { ...app, isInstalled: true } : app
            ));
            alert("Cài đặt thành công! Bạn có thể chỉnh sửa app trong 'My Apps'.");
        } catch (error) {
            console.error("Lỗi khi cài đặt app:", error);
            alert(error.response?.data?.message || "Lỗi khi cài đặt app.");
        }
    };

    // Xem app preview (read-only)
    const handleViewApp = (app) => {
        if (!app) return;
        navigate(`/marketplace/preview/${app.id}`);
    };

    // Tạo category mới
    const handleCategoryCreated = () => {
        // Reload categories
        apiService.getCategories().then(res => {
            setCategories(res.data || []);
        });
    };

    // Kiểm tra quyền admin (tùy vào JWT trong localStorage)
    const admin = isAdmin();

    // Logic Lọc & Tìm kiếm (Client-side cho search)
    const filteredApps = apps.filter(app => {
        const matchesSearch = app.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              app.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Build category list: "All" + categories from API
    const categoryList = ["All", ...categories.map(c => c.name)];

    if (loading) return <div className="p-10 text-center text-neutral-500">Đang tải chợ ứng dụng...</div>;

    return (
        <div className="flex flex-col gap-8">
            {/* Featured Banner */}
            <section className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl p-8 border border-neutral-100 relative overflow-hidden">
                <div className="relative z-10">
                    <span className="px-3 py-1 bg-white text-sage-700 text-xs font-bold rounded-full mb-4 inline-block shadow-sm">NEW ARRIVAL</span>
                    <h2 className="text-3xl font-bold text-neutral-800 mb-2">AI Agent Builder</h2>
                    <p className="text-neutral-600 max-w-lg mb-6">Create custom AI assistants to automate your workflow without writing a single line of code.</p>
                    <button className="px-6 py-2.5 bg-neutral-800 text-white rounded-xl font-medium hover:bg-black transition-all shadow-lg hover:shadow-xl">
                        Try Beta Access
                    </button>
                </div>
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-sage-200 rounded-full opacity-20 blur-3xl"></div>
            </section>

            {/* Main Content Area */}
            <section>
                {/* Toolbar: Search, Category Filter, Create Category */}
                <div className="flex flex-col gap-4 mb-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search apps..."
                            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:border-sage-400 outline-none"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
                        <div className="flex gap-2 flex-1">
                            {categoryList.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap
                                        ${selectedCategory === cat 
                                            ? 'bg-sage-600 text-white shadow-md' 
                                            : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        {admin ? (
                            <button
                                onClick={() => setIsCreateCategoryModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all whitespace-nowrap"
                            >
                                <FiPlus className="w-4 h-4" />
                                <span className="text-sm font-medium">New Category</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-neutral-400 whitespace-nowrap">
                                <FiPlus className="w-4 h-4" />
                                <span className="text-sm">New Category</span>
                            </div>
                        )}
                        <div className="text-sm text-neutral-400 font-medium hidden md:block whitespace-nowrap">
                            {filteredApps.length} apps found
                        </div>
                    </div>
                </div>

                {/* Apps Grid */}
                {filteredApps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredApps.map(app => (
                            <AppCard 
                                key={app.id} 
                                app={app} 
                                onInstall={handleInstall}
                                onView={handleViewApp}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-300">
                        <p className="text-neutral-500">Không tìm thấy ứng dụng nào khớp với bộ lọc.</p>
                    </div>
                )}
            </section>

            {/* Modals */}
            {/* App detail modal removed; preview handled by dedicated route */}
            {admin && (
                <CreateCategoryModal
                    isOpen={isCreateCategoryModalOpen}
                    onClose={() => setIsCreateCategoryModalOpen(false)}
                    onCreate={handleCategoryCreated}
                />
            )}
        </div>
    );
}

export default MarketplacePage;
