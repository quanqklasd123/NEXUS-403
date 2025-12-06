// src/App.jsx
import KanbanPage from './pages/KanbanPage'
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// --- 1. IMPORT CÁC TRANG VÀ COMPONENT ---
import LoginPage from './pages/LoginPage';
import TodoList from './pages/TodoList'; // (Đây là trang "My Tasks" cũ)
import ListDetailPage from './pages/ListDetailPage';
import RegisterPage from './pages/RegisterPage';
import Sidebar from './components/Sidebar'; // <-- IMPORT SIDEBAR MỚI (Xanh rêu)
import CalendarPage from './pages/CalendarPage';
import MarketplacePage from './pages/MarketplacePage'; // <-- Thêm
import AppBuilderPage from './pages/AppBuilderPage';
import AppBuilderListPage from './pages/AppBuilderListPage'; // <-- App Builder Projects List
import AppRuntimePage from './pages/AppRuntimePage'; // <-- App Runtime Page
import SettingsPage from './pages/SettingsPage';
import MyAppPage from './pages/MyAppPage'; // <-- My App Page
import AdminPage from './pages/AdminPage'; // <-- Admin Page
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';


function AppContent() {

    // (Toàn bộ logic state, useEffect, handlers...

    // ... CỦA BẠN GIỮ NGUYÊN)

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Thêm state để track việc đang kiểm tra auth
    const { isSidebarOpen, toggleSidebar } = useSidebar(); // Sử dụng context thay vì local state

    useEffect(() => {
        // Kiểm tra token ngay khi component mount
        const token = localStorage.getItem('authToken');
        
        if (token) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
        
        // Đánh dấu đã kiểm tra xong
        setIsLoading(false);
    }, []);



    const handleLoginSuccess = () => {

        setIsAuthenticated(true);

    };



    // --- 2. TÁI CẤU TRÚC RETURN (JSX) ---

    return (

        // Bố cục "flex" toàn màn hình

        // Nền "neutral-50" (xám ấm) đã được áp dụng cho <body> trong index.css

        <div className="flex min-h-screen">



            {/* Logic: Nếu đã đăng nhập, hiển thị Sidebar */}

            {isAuthenticated && <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />}



            {/* Nội dung chính, chiếm phần còn lại

                Sử dụng "ml-72" (margin-left: 288px) để chừa chỗ cho Sidebar

                (Giống hệt class "main-content" trong file HTML của bạn)

            */}

            <main className={`flex-1 transition-all duration-300 ${isAuthenticated && isSidebarOpen ? 'ml-72' : 'ml-0'}`}>



                {/* (Chúng ta sẽ thêm <Header /> cố định ở đây sau) */}



                {/* Phần nội dung có "padding" (giống "content-wrapper") */}

                <div className="p-6 md:p-10">

                    {/* Hiển thị loading khi đang kiểm tra authentication */}
                    {isLoading ? (
                        <div className="flex items-center justify-center min-h-screen">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600 mx-auto mb-4"></div>
                                <p className="text-neutral-500">Đang tải...</p>
                            </div>
                        </div>
                    ) : (
                    <Routes>

                        {!isAuthenticated ? (

                            // --- Tuyến đường CÔNG KHAI (Chưa đăng nhập) ---

                            <>

                                {/* Nếu chưa đăng nhập, các trang này sẽ

                                  chiếm toàn bộ "main" (vì Sidebar bị ẩn)

                                */}

                                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />

                                <Route path="/register" element={<RegisterPage />} />

                                <Route path="*" element={<Navigate to="/login" replace />} />

                                <Route path="/" element={<Navigate to="/login" replace />} />

                                <Route path="/kanban" element={<KanbanPage />} />
                                {/* <Route path="/calendar" element={...} /> */}

                            </>

                        ) : (

                            // --- 3. CẬP NHẬT PHẦN "BẢO VỆ" ---
                            <>
                                {/* TRANG CHỦ "/" BÂY GIỜ LÀ MY APPS */}
                                <Route path="/" element={<MyAppPage />} />

                                {/* Trang "/tasks" VẪN LÀ TodoList */}
                                <Route path="/tasks" element={<TodoList />} />

                                {/* Trang chi tiết (đổi 'list' thành 'tasks') */}
                                <Route path="/tasks/:id" element={<ListDetailPage />} />

                                {/* THÊM ROUTE MỚI CHO KANBAN */}
                                <Route path="/kanban" element={<KanbanPage />} />
                                {/* <Route path="/calendar" element={...} /> */}
                                <Route path="/calendar" element={<CalendarPage />} />

                                {/* Tuyến đường cho Marketplace */}
                                <Route path="/marketplace" element={<MarketplacePage />} />

                                {/* Tuyến đường cho App Builder */}
                                <Route path="/app-builder" element={<AppBuilderListPage />} />
                                <Route path="/app-builder/new" element={<AppBuilderPage />} />
                                <Route path="/app-builder/:projectId" element={<AppBuilderPage />} />

                                {/* Tuyến đường cho App Runtime (giống preview) */}
                                <Route path="/app/:projectId" element={<AppRuntimePage />} />

                                {/* Tuyến đường cho Settings */}
                                <Route path="/settings" element={<SettingsPage />} />

                                {/* Tuyến đường cho Admin Area */}
                                <Route path="/admin" element={<AdminPage />} />

                                {/* (Các link "giả" từ Sidebar) */}
                                {/* <Route path="/kanban" element={...} /> */}
                                {/* <Route path="/calendar" element={...} /> */}

                                {/* (Các link "bảo vệ" giữ nguyên) */}
                                <Route path="/login" element={<Navigate to="/" replace />} />
                                <Route path="/register" element={<Navigate to="/" replace />} />
                                <Route path="*" element={<Navigate to="/" replace />} />

                            </>

                        )}

                    </Routes>
                    )}
                </div>

            </main>

        </div>

    );

}

function App() {
    return (
        <SidebarProvider>
            <AppContent />
        </SidebarProvider>
    );
}

export default App;