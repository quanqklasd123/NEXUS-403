// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- 1. IMPORT CÁC TRANG VÀ COMPONENT ---
import LoginPage from './pages/LoginPage';
import TodoList from './pages/TodoList';
import ListDetailPage from './pages/ListDetailPage';
import RegisterPage from './pages/RegisterPage';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import KanbanPage from './pages/KanbanPage';




function App() {

    // (Toàn bộ logic state, useEffect, handlers...

    // ... CỦA BẠN GIỮ NGUYÊN)

    const [isAuthenticated, setIsAuthenticated] = useState(false);



    useEffect(() => {

        const token = localStorage.getItem('authToken');

        if (token) {

            setIsAuthenticated(true);

        }

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

            {isAuthenticated && <Sidebar />}



            {/* Nội dung chính, chiếm phần còn lại

                Sử dụng "ml-72" (margin-left: 288px) để chừa chỗ cho Sidebar

                (Giống hệt class "main-content" trong file HTML của bạn)

            */}

            <main className={`flex-1 transition-all duration-300 ${isAuthenticated ? 'ml-72' : 'ml-0'}`}>



                {/* (Chúng ta sẽ thêm <Header /> cố định ở đây sau) */}



                {/* Phần nội dung có "padding" (giống "content-wrapper") */}

                <div className="p-6 md:p-10">

                    <Routes>

                        {!isAuthenticated ? (

                            // --- Tuyến đường CÔNG KHAI (Chưa đăng nhập) ---

                            <>

                                {/* Nếu chưa đăng nhập, các trang này sẽ

                                  chiếm toàn bộ "main" (vì Sidebar bị ẩn)

                                */}

                                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/" element={<Navigate to="/login" replace />} />
                                <Route path="*" element={<Navigate to="/login" replace />} />
                            </>

                        ) : (

                            // --- Tuyến đường BẢO VỆ (Đã đăng nhập) ---
                            <>
                                {/* Trang chủ "/" là Dashboard */}
                                <Route path="/" element={<DashboardPage />} />

                                {/* Trang "/tasks" là TodoList */}
                                <Route path="/tasks" element={<TodoList />} />
                                
                                {/* Trang chi tiết task */}
                                <Route path="/tasks/:id" element={<ListDetailPage />} />

                                {/* Trang Kanban */}
                                <Route path="/kanban" element={<KanbanPage />} />

                                {/* Redirect các trang public về Dashboard */}
                                <Route path="/login" element={<Navigate to="/" replace />} />
                                <Route path="/register" element={<Navigate to="/" replace />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </>

                        )}

                    </Routes>

                </div>

            </main>

        </div>

    );

}



export default App;