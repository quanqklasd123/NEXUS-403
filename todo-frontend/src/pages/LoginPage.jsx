// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import apiService from '../services/apiService'; 
import { Link } from 'react-router-dom'; 
import { GoogleLogin } from '@react-oauth/google';

function LoginPage({ onLoginSuccess }) {
    // (TOÀN BỘ LOGIC STATE VÀ HÀM CỦA BẠN GIỮ NGUYÊN)
    // ...
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault(); 
        setMessage('Đang đăng nhập...');
        try {
            const response = await apiService.login(email, password);
            const { token } = response.data;
            localStorage.setItem('authToken', token);
            setMessage('Đăng nhập thành công!');
            onLoginSuccess(); 
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            if (error.response) {
                setMessage(`Lỗi: Sai email hoặc mật khẩu`);
            } else if (error.request) {
                setMessage('Lỗi kết nối: Không thể gọi API. Bạn đã chạy server Backend chưa?');
            } else {
                setMessage('Có lỗi xảy ra.');
            }
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setMessage('Đang xác thực với Google...');
        const googleToken = credentialResponse.credential; 
        try {
            const response = await apiService.googleLogin(googleToken);
            const { token } = response.data;
            localStorage.setItem('authToken', token);
            setMessage('Đăng nhập bằng Google thành công!');
            onLoginSuccess();
        } catch (error) {
            console.error('Lỗi xác thực Google với BE:', error);
            setMessage('Xác thực Google thất bại. Vui lòng thử lại.');
        }
    };

    const handleGoogleError = () => {
        console.error('Đăng nhập Google thất bại');
        setMessage('Không thể đăng nhập với Google.');
    };
    // (Kết thúc Logic)

    // --- TÁI CẤU TRÚC TOÀN BỘ JSX BẰNG THEME MỚI (SAGE/PEACH) ---
    return (
        // 1. "Card" (thẻ) chính, style lấy từ .card trong Figma
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-neutral-200">

            <h2 className="text-3xl font-medium text-neutral-800 border-b border-neutral-200 pb-4 mb-6">
                Đăng nhập
            </h2>
            
            {/* 2. Form (dùng font-sans, màu sage) */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4" autoComplete="on">
                
                <div className="flex flex-col gap-1">
                    <label className="font-sans text-sm font-medium text-neutral-700">Email hoặc Username:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="username" 
                        // Style input mới (từ design-system.html)
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
                        autoComplete="current-password" 
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:border-sage-400 focus:ring-3 focus:ring-sage-400/10 outline-none transition-colors"
                    />
                </div>

                {/* 3. Nút bấm (style .btn-primary từ Figma) */}
                <button 
                    type="submit"
                    className="w-full p-3 bg-sage-400 text-white rounded-xl font-medium hover:bg-sage-500 transition-colors shadow-lg shadow-sage-400/30 hover:shadow-xl hover:-translate-y-0.5"
                >
                    Đăng nhập
                </button>
            </form>

            {message && <p className="text-error mt-4">{message}</p>}

            {/* Dấu gạch "hoặc" */}
            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-neutral-200"></div>
                <span className="mx-4 text-xs text-neutral-500">HOẶC</span>
                <div className="flex-grow border-t border-neutral-200"></div>
            </div>
            
            {/* 4. Nút Google (style cho nó nằm giữa) */}
            <div className="flex justify-center">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                />
            </div>

            <p className="mt-6 text-center text-sm">
                Chưa có tài khoản? 
                <Link to="/register" className="text-sage-700 hover:text-sage-500 font-medium ml-1">
                    Đăng ký ngay
                </Link>
            </p>
        </div>
    );
}

export default LoginPage;