// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import apiService from '../services/apiService';
import { Link, useNavigate } from 'react-router-dom';

// --- Thêm một chút style cho form ---
const authFormStyle = {
    display: 'flex',
    flexDirection: 'column', // Xếp các mục theo chiều dọc
    gap: '15px',             // Khoảng cách giữa các mục
    maxWidth: '300px',       // Giới hạn chiều rộng
    margin: '20px auto'      // Căn giữa
};

const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
};
// ------------------------------------

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    
    const navigate = useNavigate(); 

    const handleRegister = async (e) => {
        // (Logic hàm này giữ nguyên)
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

    return (
        // 1. "Tờ giấy" (Card) chính, giống hệt LoginPage
        <div className="max-w-md mx-auto bg-paper p-8 rounded-lg shadow-lg border border-primary/20">

            <h2 className="text-3xl font-serif text-text-main border-b border-primary/10 pb-4 mb-6">
                Đăng Ký Tài Khoản Mới
            </h2>

            {/* 2. Style Form (giống hệt LoginPage) */}
            <form onSubmit={handleRegister} className="flex flex-col gap-4" autoComplete="off">
                
                <div className="flex flex-col gap-1">
                    <label className="font-serif">Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username" 
                        className="p-2 border border-primary/50 rounded-md bg-white font-serif"
                    />
                </div>
                
                <div className="flex flex-col gap-1">
                    <label className="font-serif">Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email" 
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
                        autoComplete="new-password" 
                        className="p-2 border border-primary/50 rounded-md bg-white font-serif"
                    />
                </div>

                <button 
                    type="submit"
                    className="p-2 bg-primary text-paper rounded-lg font-serif text-lg
                               hover:bg-accent hover:text-text-main transition-colors"
                >
                    Đăng Ký
                </button>
            </form>

            {message && <p className="text-red-600 mt-4">{message}</p>}

            <p className="mt-6 text-center">
                Đã có tài khoản? 
                <Link to="/login" className="text-primary hover:text-accent font-bold ml-2">
                    Đăng nhập tại đây
                </Link>
            </p>
        </div>
    );
}

export default RegisterPage;