// src/pages/MarketplacePage.jsx
import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { FiSearch, FiFilter, FiDownload, FiStar, FiTag } from 'react-icons/fi';

// --- MOCK DATA (Dữ liệu giả lập) ---
const MOCK_APPS = [
    {
        id: 1,
        name: "CRM Starter Pack",
        description: "A complete CRM template with contacts, deals, and pipeline view.",
        author: "NEXUS Team",
        category: "Template",
        tags: ["Business", "Sales"],
        downloads: 1250,
        rating: 4.8,
        color: "sage" // Để style icon
    },
    {
        id: 2,
        name: "AI Text Summarizer",
        description: "Automatically summarize long descriptions using OpenAI integration.",
        author: "DevCommunity",
        category: "Module",
        tags: ["AI", "Productivity"],
        downloads: 890,
        rating: 4.5,
        color: "peach"
    },
    {
        id: 3,
        name: "Kanban Board Pro",
        description: "Advanced Kanban board with swimlanes and WIP limits.",
        author: "TaskMaster",
        category: "Component",
        tags: ["Project Management"],
        downloads: 3400,
        rating: 4.9,
        color: "butter"
    },
    {
        id: 4,
        name: "Email Automation",
        description: "Send automated emails when a task status changes.",
        author: "AutoBot",
        category: "Automation",
        tags: ["Workflow", "Email"],
        downloads: 560,
        rating: 4.2,
        color: "info"
    },
    {
        id: 5,
        name: "Finance Tracker",
        description: "Track expenses and income with visual charts.",
        author: "FinTech",
        category: "Template",
        tags: ["Finance", "Dashboard"],
        downloads: 1100,
        rating: 4.7,
        color: "sage"
    },
    {
        id: 6,
        name: "Slack Integration",
        description: "Connect your tasks to Slack channels for real-time updates.",
        author: "Connectify",
        category: "Module",
        tags: ["Communication", "Integration"],
        downloads: 2100,
        rating: 4.6,
        color: "peach"
    }
];

const CATEGORIES = ["All", "Template", "Module", "Component", "Automation"];

// --- COMPONENT: APP CARD ---
const AppCard = ({ app }) => {
    // Map màu sắc cho icon nền
    const colorClasses = {
        'sage': 'bg-sage-100 text-sage-600',
        'peach': 'bg-peach-100 text-peach-600',
        'butter': 'bg-butter-100 text-butter-600',
        'info': 'bg-info/20 text-info',
    };
    const iconColor = colorClasses[app.color] || 'bg-neutral-100 text-neutral-600';

    return (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 transition-all hover:shadow-lg hover:border-sage-300 flex flex-col h-full">
            {/* Card Header: Icon & Meta */}
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}>
                    <span className="text-lg font-bold">{app.name.charAt(0)}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-neutral-500">
                    <FiStar className="text-warning fill-current" />
                    <span>{app.rating}</span>
                </div>
            </div>

            {/* Card Body: Content */}
            <div className="flex-1 mb-4">
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">{app.name}</h3>
                <p className="text-sm text-neutral-600 line-clamp-2">{app.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
                {app.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-md">
                        #{tag}
                    </span>
                ))}
            </div>

            {/* Card Footer: Author & Action */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <div className="text-xs text-neutral-500">
                    by <span className="font-medium text-neutral-700">{app.author}</span>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-sage-50 text-sage-700 text-sm font-medium rounded-lg hover:bg-sage-100 transition-colors">
                    <FiDownload />
                    Install
                </button>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
function MarketplacePage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    // Logic lọc ứng dụng
    const filteredApps = MOCK_APPS.filter(app => {
        const matchCategory = selectedCategory === "All" || app.category === selectedCategory;
        const matchSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="bg-transparent p-0">
            {/* 1. Header: Tiêu đề và Tìm kiếm */}
            {/* Chúng ta tái sử dụng PageHeader nhưng tùy biến một chút */}
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-neutral-800 mb-2">Marketplace</h1>
                <p className="text-neutral-500 mb-6">Explore and install apps to supercharge your workspace.</p>
                
                {/* Search Bar & Filter Toggle (Mobile) */}
                <div className="relative max-w-xl">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiSearch className="text-neutral-400" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search apps, templates, plugins..." 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-sage-400 focus:ring-2 focus:ring-sage-400/20 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* 2. Sidebar: Categories (Bộ lọc) */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-3">Categories</h3>
                        <div className="flex flex-col gap-1">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedCategory === cat 
                                        ? 'bg-sage-100 text-sage-700' 
                                        : 'text-neutral-600 hover:bg-neutral-100'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recommended (Giả lập) */}
                    <div className="bg-peach-50 rounded-xl p-4 border border-peach-100">
                        <h4 className="text-peach-800 font-semibold mb-2 flex items-center gap-2">
                            <FiStar className="fill-current" /> Featured
                        </h4>
                        <p className="text-xs text-peach-700 mb-3">Try the new <strong>AI Agent Builder</strong> to automate your workflow.</p>
                        <button className="w-full py-1.5 bg-white text-peach-700 text-xs font-medium rounded shadow-sm hover:bg-peach-50">View Details</button>
                    </div>
                </div>

                {/* 3. Main Content: App Grid */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-neutral-500">Showing {filteredApps.length} results</span>
                        <select className="text-sm border-none bg-transparent text-neutral-600 font-medium cursor-pointer focus:ring-0">
                            <option>Most Popular</option>
                            <option>Newest</option>
                            <option>Top Rated</option>
                        </select>
                    </div>

                    {filteredApps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredApps.map(app => (
                                <AppCard key={app.id} app={app} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-neutral-300">
                            <p className="text-neutral-500">No apps found matching your criteria.</p>
                            <button 
                                onClick={() => {setSearchTerm(""); setSelectedCategory("All");}}
                                className="mt-2 text-sage-600 font-medium hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MarketplacePage;