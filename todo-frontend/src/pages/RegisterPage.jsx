// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import apiService from '../services/apiService';
import { Link, useNavigate } from 'react-router-dom'; 

function RegisterPage() {
    // (TOÀN BỘ LOGIC STATE VÀ HÀM CỦA BẠN GIỮ NGUYÊN)
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    
    const navigate = useNavigate(); 

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('Đang xử lý...');
        try {
            await apiService.register(username, email, password);
            setMessage('Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập.');
            setTimeout(() => {
                navigate('/login'); 
            }, 2000);
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            if (error.response && error.response.data) {
                setMessage(`Lỗi: ${error.response.data.message || 'Email/Username đã tồn tại.'}`);
            } else {
                setMessage('Lỗi kết nối. Vui lòng thử lại.');
            }
        }
    };
    // (Kết thúc Logic)

    // --- TÁI CẤU TRÚC TOÀN BỘ JSX BẰNG THEME MỚI (SAGE) ---
    return (
        // 1. "Card" (thẻ) chính, style lấy từ .card trong Figma
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-neutral-200">

            <h2 className="text-3xl font-medium text-neutral-800 border-b border-neutral-200 pb-4 mb-6">
                Đăng Ký Tài Khoản Mới
            </h2>
            
            {/* 2. Form (dùng font-sans, màu sage) */}
            <form onSubmit={handleRegister} className="flex flex-col gap-4" autoComplete="off">
                
                <div className="flex flex-col gap-1">
                    <label className="font-sans text-sm font-medium text-neutral-700">Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username" 
                        // Style input mới (từ design-system.html)
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:border-sage-400 focus:ring-3 focus:ring-sage-400/10 outline-none transition-colors"
                    />
                </div>
                
                <div className="flex flex-col gap-1">
                    <label className="font-sans text-sm font-medium text-neutral-700">Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email" 
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:border-sage-400 focus:ring-3 focus:ring-sage-400/10 outline-none transition-colors"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="font-sans text-sm font-medium text-neutral-700">Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        // Quan trọng: "new-password" để trình duyệt không tự điền
                        autoComplete="new-password" 
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:border-sage-400 focus:ring-3 focus:ring-sage-400/10 outline-none transition-colors"
                    />
                </div>

                {/* 3. Nút bấm (style .btn-primary từ Figma) */}
                <button 
                    type="submit"
                    className="w-full p-3 bg-sage-400 text-white rounded-xl font-medium hover:bg-sage-500 transition-colors shadow-lg shadow-sage-400/30 hover:shadow-xl hover:-translate-y-0.5"
                >
                    Đăng Ký
                </button>
            </form>

            {message && <p className="text-error mt-4">{message}</p>}

            <p className="mt-6 text-center text-sm">
                Đã có tài khoản? 
                <Link to="/login" className="text-sage-700 hover:text-sage-500 font-medium ml-1">
                    Đăng nhập tại đây
                </Link>
            </p>
        </div>
    );
}

export default RegisterPage;