// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/apiService';
// Import các icon ở 1 chỗ, không import trùng
import { FiCheckSquare, FiTrello, FiCalendar, FiGrid, FiSettings } from 'react-icons/fi';

// --- Component "Card Ứng dụng" (App Mini Card) ---
// Chúng ta tạo component nhỏ này ngay tại đây cho gọn
// (Lấy style từ file 'index.html' của bạn)
const AppMiniCard = ({ to, icon, title, subtitle, color }) => {
    const Icon = icon; // Gán component icon
    // Tạo màu sắc (ví dụ: bg-sage-400, bg-peach-400)
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

// --- Component "Thống kê Nhanh" (Quick Stat Card) ---
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


// --- Trang DASHBOARD Chính ---
function DashboardPage() {
    // --- THÊM LOGIC TẢI DATA ---
    const [stats, setStats] = useState({
        totalLists: 0,
        totalTasks: 0,
        completedTasks: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await apiService.getDashboardStats();
                setStats(response.data); // Lưu data "thật" vào state
            } catch (error) {
                console.error("Lỗi khi tải thống kê:", error);
                // (Bạn có thể thêm xử lý lỗi 401 ở đây nếu cần)
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []); // [] = Chạy 1 lần khi trang tải
    // --- KẾT THÚC LOGIC ---
    return (
        <div className="flex flex-col gap-10">
            {/* 1. Hero Section (từ index.html) */}
            <section className="text-center py-10">
                <h1 className="text-5xl font-medium mb-6 text-neutral-800">
                    Chào mừng trở lại!
                </h1>
                <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
                    Đây là "trung tâm điều khiển" của bạn. Mọi thứ bạn cần để làm việc hiệu quả.
                </p>
            </section>

            {/* 2. App Mini Grid (từ index.html) */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-medium text-neutral-800">Ứng dụng của bạn</h3>
                    {/* (Nút "Customize" - chúng ta sẽ làm sau) */}
                    {/* <button className="btn-secondary">Customize Dashboard</button> */}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Đây là các component AppMiniCard */}
                    <AppMiniCard 
                        to="/tasks" // <-- Link TỚI trang TodoList
                        icon={FiCheckSquare} 
                        title="My Tasks" 
                        subtitle="8 tasks due" 
                        color="sage" 
                    />
                    <AppMiniCard 
                        to="/kanban" // (Chưa hoạt động)
                        icon={FiTrello} 
                        title="Kanban Board" 
                        subtitle="3 projects" 
                        color="peach" 
                    />
                    <AppMiniCard 
                        to="/calendar" // (Chưa hoạt động)
                        icon={FiCalendar} 
                        title="Calendar" 
                        subtitle="2 events today" 
                        color="butter" 
                    />
                    <AppMiniCard 
                        to="/settings" // (Chưa hoạt động)
                        icon={FiSettings} 
                        title="Settings" 
                        subtitle="Customize NEXUS" 
                        color="neutral" 
                    />
                </div>
            </section>

            {/* 3. Quick Stats (ĐÃ CẬP NHẬT) */}
            <section>
                <h3 className="text-2xl font-medium mb-8 text-neutral-800">Tổng quan</h3>
                {loading ? (
                    <p>Đang tải thống kê...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Truyền data "thật" (stats.xxx) vào */}
                        <StatCard title="Công việc Hoàn thành" value={stats.completedTasks} color="sage" />
                        <StatCard title="Dự án (Lists)" value={stats.totalLists} color="peach" />
                        <StatCard title="Tổng Công việc" value={stats.totalTasks} color="butter" />
                    </div>
                )}
            </section>

            {/* (Phần Recent Activity... chúng ta sẽ làm sau) */}
        </div>
    );
}

export default DashboardPage;