// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import apiService from '../services/apiService'; 
import { Link } from 'react-router-dom'; 

function LoginPage({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    // --- ĐÂY LÀ HÀM LOGIC BỊ THIẾU ---
    const handleLogin = async (e) => {
        e.preventDefault(); // Ngăn trang load lại
        setMessage('Đang đăng nhập...');

        try {
            // 1. Gọi API (dùng email và password trong state)
            const response = await apiService.login(email, password);

            console.log('Đăng nhập thành công:', response.data);
            const { token } = response.data;
            
            // 2. Lưu token
            localStorage.setItem('authToken', token);
            setMessage('Đăng nhập thành công!');
            
            // 3. Báo cho App.jsx biết
            onLoginSuccess(); 

        } catch (error) {
            // 4. Xử lý lỗi (sai mật khẩu, BE sập...)
            console.error('Lỗi đăng nhập:', error);
            if (error.response) {
                setMessage(`Lỗi: Sai email hoặc mật khẩu`);
            } else if (error.request) {
                // Lỗi này xảy ra khi Backend CỦA BẠN CHƯA CHẠY!
                setMessage('Lỗi kết nối: Không thể gọi API. Bạn đã chạy server Backend chưa?');
            } else {
                setMessage('Có lỗi xảy ra.');
            }
        }
    };
    // --- KẾT THÚC HÀM LOGIC ---

    return (
        // (Phần JSX (HTML) của bạn đã CHUẨN, giữ nguyên)
        <div className="max-w-md mx-auto bg-paper p-8 rounded-lg shadow-lg border border-primary/20">
            
            <h2 className="text-3xl font-serif text-text-main border-b border-primary/10 pb-4 mb-6">
                Đăng nhập
            </h2>
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4" autoComplete="on">
                
                <div className="flex flex-col gap-1">
                    <label className="font-serif">Email hoặc Username:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="username" 
                        className="p-2 border border-primary/50 rounded-md bg-white font-serif"
                    />
                </div>
                
                <div className="flex flex-col gap-1">
                    <label className="font-serif">Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password" 
                        className="p-2 border border-primary/50 rounded-md bg-white font-serif"
                    />
                </div>

                <button 
                    type="submit"
                    className="p-2 bg-primary text-paper rounded-lg font-serif text-lg
                               hover:bg-accent hover:text-text-main transition-colors"
                >
                    Đăng nhập
                </button>
            </form>

            {message && <p className="text-red-600 mt-4">{message}</p>}

            <p className="mt-6 text-center">
                Chưa có tài khoản? 
                <Link to="/register" className="text-primary hover:text-accent font-bold ml-2">
                    Đăng ký ngay
                </Link>
            </p>
        </div>
    );
}

export default LoginPage;