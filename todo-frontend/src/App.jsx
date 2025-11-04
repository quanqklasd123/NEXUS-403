// src/App.jsx
import React, { useState, useEffect } from 'react';
// 1. Import các công cụ "điều hướng"
import { Routes, Route, Navigate } from 'react-router-dom'; 

import LoginPage from './pages/LoginPage';
import TodoList from './pages/TodoList'; 
import ListDetailPage from './pages/ListDetailPage'; // <-- 2. Import trang mới
import RegisterPage from './pages/RegisterPage';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // useEffect kiểm tra token (giữ nguyên)
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);
    

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    // 3. Thay thế return cũ bằng "Routes"
    return (
        // --- THÊM CLASS "app-container" Ở ĐÂY ---
        <div className="app-container"> 
            <h1>NEXUS</h1>
            
            <Routes>
                {/* (Toàn bộ logic Routes giữ nguyên) */}
                { !isAuthenticated ? (
                    <>
                        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="*" element={<Navigate to="/login" />} />
                    </>
                ) : (
                    <>
                        <Route path="/" element={<TodoList />} />
                        <Route path="/list/:id" element={<ListDetailPage />} />
                        <Route path="/login" element={<Navigate to="/" />} />
                    </>
                )}
            </Routes>
        </div> // --- Đóng thẻ div
    );
}

export default App;