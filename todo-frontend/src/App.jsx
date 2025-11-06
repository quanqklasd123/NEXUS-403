// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 

// --- 1. IMPORT CÁC TRANG VÀ COMPONENT ---
import LoginPage from './pages/LoginPage';
import TodoList from './pages/TodoList'; 
import ListDetailPage from './pages/ListDetailPage'; 
import RegisterPage from './pages/RegisterPage'; 
import Sidebar from './components/Sidebar'; // <-- IMPORT SIDEBAR MỚI

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
        // Nền "wood" (nâu) đã được áp dụng cho <body> trong index.css
        <div className="flex min-h-screen">
            
            {/* Logic: Nếu đã đăng nhập, hiển thị Sidebar */}
            {isAuthenticated && <Sidebar />}

            {/* Nội dung chính, chiếm phần còn lại */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                {/* Chúng ta đã XÓA <div className="app-container">
                  Giờ đây, "Routes" sẽ render trực tiếp 
                */}
                <Routes>
                    { !isAuthenticated ? (
                        // --- Tuyến đường CÔNG KHAI (Chưa đăng nhập) ---
                        <>
                            {/* Nếu chưa đăng nhập, các trang này sẽ
                              chiếm toàn bộ "main" (vì Sidebar bị ẩn)
                            */}
                            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="*" element={<Navigate to="/login" />} />
                        </>
                    ) : (
                        // --- Tuyến đường BẢO VỆ (Đã đăng nhập) ---
                        <>
                            <Route path="/" element={<TodoList />} />
                            <Route path="/list/:id" element={<ListDetailPage />} />
                            
                            {/* Các link "giả" từ Sidebar (chưa hoạt động) */}
                            {/* <Route path="/personal" element={...} /> */}
                            {/* <Route path="/work" element={...} /> */}
                            {/* <Route path="/urgent" element={...} /> */}

                            <Route path="/login" element={<Navigate to="/" />} />
                            <Route path="/register" element={<Navigate to="/" />} />
                        </>
                    )}
                </Routes>
            </main>
        </div>
    );
}

export default App;