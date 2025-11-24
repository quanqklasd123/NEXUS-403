import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader'; // Header chung của chúng ta
import apiService from '../services/apiService';
import { FiSearch, FiFilter, FiDownload, FiStar, FiSettings, FiCheck } from 'react-icons/fi';

// Helper Icons (Giữ nguyên)
const FiUsersIcon = () => <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>;

// --- COMPONENT APP CARD (Đã nâng cấp logic) ---
const AppCard = ({ app, onInstall }) => {
    const colorClasses = {
        'sage': 'from-sage-400 to-sage-600 bg-gradient-to-br',
        'peach': 'from-peach-400 to-peach-600 bg-gradient-to-br',
        'butter': 'from-butter-400 to-butter-600 bg-gradient-to-br',
        'neutral': 'bg-neutral-400',
    };
    
    return (
        <div className={`bg-white border border-neutral-200 rounded-2xl p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer ${app.isInstalled ? 'border-success/50 bg-success/5' : ''}`}>
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
                    {app.category}
                </span>
            </div>

            {/* Footer: Price & Action */}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                <span className={`text-xs font-medium px-2 py-1 rounded ${app.price ? 'bg-warning/10 text-warning' : 'bg-sage-100 text-sage-700'}`}>
                    {app.price || 'Free'}
                </span>
                
                {app.isInstalled ? (
                    <button disabled className="flex items-center gap-1 text-xs font-bold text-success">
                        <FiCheck /> Installed
                    </button>
                ) : (
                    <button 
                        onClick={() => onInstall(app.id)}
                        className="text-xs font-bold text-sage-600 hover:text-sage-800 hover:underline"
                    >
                        Install
                    </button>
                )}
            </div>
        </div>
    );
};

// --- TRANG CHÍNH ---
function MarketplacePage() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    
    // 1. Tải dữ liệu từ API khi vào trang
    useEffect(() => {
        const fetchApps = async () => {
            try {
                setLoading(true);
                const response = await apiService.getMarketplaceApps();
                setApps(response.data);
            } catch (error) {
                console.error("Lỗi tải Marketplace:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, []);

    // 2. Xử lý cài đặt App
    const handleInstall = async (appId) => {
        try {
            // Gọi API
            await apiService.installApp(appId);
            // Cập nhật UI ngay lập tức (Optimistic update)
            setApps(prevApps => prevApps.map(app => 
                app.id === appId ? { ...app, isInstalled: true } : app
            ));
            alert("Cài đặt thành công!");
        } catch (error) {
            alert("Lỗi khi cài đặt app.");
        }
    };

    // 3. Logic Lọc & Tìm kiếm (Client-side)
    const filteredApps = apps.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              app.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    const categories = ["All", "Template", "Module", "Component", "Automation"];

    if (loading) return <div className="p-10 text-center text-neutral-500">Đang tải chợ ứng dụng...</div>;

    return (
        <div className="flex flex-col gap-8">
            {/* Dùng PageHeader chung để đồng bộ giao diện */}
            <PageHeader 
                title="Marketplace" 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm} // Kích hoạt ô tìm kiếm trên Header
            />

            {/* Featured Banner (Giữ nguyên tĩnh cho đẹp) */}
            <section className="bg-gradient-to-r from-sage-50 to-peach-50 rounded-2xl p-8 border border-sage-100 relative overflow-hidden">
                <div className="relative z-10">
                    <span className="px-3 py-1 bg-white text-sage-700 text-xs font-bold rounded-full mb-4 inline-block shadow-sm">NEW ARRIVAL</span>
                    <h2 className="text-3xl font-bold text-neutral-800 mb-2">AI Agent Builder</h2>
                    <p className="text-neutral-600 max-w-lg mb-6">Create custom AI assistants to automate your workflow without writing a single line of code.</p>
                    <button className="px-6 py-2.5 bg-neutral-800 text-white rounded-xl font-medium hover:bg-black transition-all shadow-lg hover:shadow-xl">
                        Try Beta Access
                    </button>
                </div>
                {/* Decorative circle */}
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-sage-200 rounded-full opacity-20 blur-3xl"></div>
            </section>

            {/* Main Content Area */}
            <section>
                {/* Toolbar: Category Filter */}
                <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
                    <div className="flex gap-2">
                        {categories.map(cat => (
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
                    <div className="text-sm text-neutral-400 font-medium hidden md:block">
                        {filteredApps.length} apps found
                    </div>
                </div>

                {/* Apps Grid */}
                {filteredApps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredApps.map(app => (
                            <AppCard key={app.id} app={app} onInstall={handleInstall} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-300">
                        <p className="text-neutral-500">Không tìm thấy ứng dụng nào khớp với bộ lọc.</p>
                    </div>
                )}
            </section>
        </div>
    );
}

export default MarketplacePage;