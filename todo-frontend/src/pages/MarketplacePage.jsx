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
    return (
        <div 
            onClick={() => onView(app)} 
            className={`group bg-white border-2 transition-all duration-300 cursor-pointer ${
                app.isInstalled 
                    ? 'border-neutral-900 bg-neutral-50' 
                    : 'border-neutral-200 hover:border-neutral-900 hover:shadow-2xl'
            } rounded-lg p-6 flex flex-col h-full`}
        >
            {/* Icon */}
            <div className="w-14 h-14 bg-neutral-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiSettings className="w-7 h-7 text-white" />
            </div>
            
            {/* Content */}
            <div className="flex-1">
                <h4 className="font-bold text-base mb-2 text-neutral-900 group-hover:text-black">{app.name}</h4>
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">{app.description}</p>
                
                {/* Category Tag */}
                <div className="mb-4">
                    <span className="text-xs uppercase tracking-widest font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
                        {app.category || 'UNCATEGORIZED'}
                    </span>
                </div>
            </div>

            {/* Footer: Price & Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-neutral-100">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-md ${
                    app.price 
                        ? 'bg-neutral-900 text-white' 
                        : 'bg-neutral-100 text-neutral-700'
                }`}>
                    {app.price || 'FREE'}
                </span>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(app); }}
                        className="p-2 text-neutral-600 hover:bg-neutral-900 hover:text-white rounded-md transition-all"
                        title="View details"
                    >
                        <FiEye className="w-4 h-4" />
                    </button>
                    {app.isInstalled ? (
                        <button disabled className="flex items-center gap-1 text-xs font-bold text-neutral-900 bg-neutral-200 px-3 py-1.5 rounded-md">
                            <FiCheck /> INSTALLED
                        </button>
                    ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onInstall(app.id); }}
                            className="text-xs font-bold text-white bg-neutral-900 hover:bg-black px-4 py-1.5 rounded-md transition-all"
                        >
                            INSTALL
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
                console.log('🔍 Fetching apps for category:', selectedCategory);
                const [categoriesRes, appsRes] = await Promise.all([
                    apiService.getCategories(),
                    apiService.getMarketplaceApps(selectedCategory)
                ]);
                setCategories(categoriesRes.data || []);
                setApps(appsRes.data || []);
                console.log('✅ Apps loaded:', appsRes.data?.length || 0, 'apps');
                console.log('📦 Apps data:', appsRes.data);
                console.log('📂 Categories loaded:', categoriesRes.data?.length || 0);
            } catch (error) {
                console.error("❌ Lỗi tải Marketplace:", error);
                // Set empty arrays on error to prevent UI issues
                setApps([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory]); // Simplified dependencies - only track selectedCategory

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
    console.log('📋 Category list:', categoryList);
    console.log('🎯 Selected category:', selectedCategory);

    if (loading) return <div className="p-10 text-center text-neutral-500">Đang tải chợ ứng dụng...</div>;

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-semibold text-neutral-800">Marketplace</h1>
                <p className="text-neutral-500 text-sm mt-1">
                    Khám phá và cài đặt các ứng dụng được chia sẻ từ cộng đồng
                </p>
            </div>

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
                        {admin && (
                            <button
                                onClick={() => setIsCreateCategoryModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all whitespace-nowrap"
                            >
                                <FiPlus className="w-4 h-4" />
                                <span className="text-sm font-medium">New Category</span>
                            </button>
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
