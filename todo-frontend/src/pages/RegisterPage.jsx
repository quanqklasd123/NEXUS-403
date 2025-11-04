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
        <div>
            <h2>Đăng Ký Tài Khoản Mới</h2>
            
            {/* --- CẬP NHẬT FORM --- */}
            {/* 1. Thêm style VÀ autoComplete="off" vào thẻ form */}
            <form onSubmit={handleRegister} style={authFormStyle} autoComplete="off">
                
                <div style={inputGroupStyle}>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username" // 2. Gợi ý đây là ô username
                    />
                </div>
                
                <div style={inputGroupStyle}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email" // 3. Gợi ý đây là ô email
                    />
                </div>

                <div style={inputGroupStyle}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        // 4. Quan trọng nhất: "new-password"
                        // Báo cho trình duyệt đây là form TẠO MẬT KHẨU MỚI
                        autoComplete="new-password" 
                    />
                </div>

                <button type="submit">Đăng Ký</button>
            </form>
            {/* --------------------- */}

            {message && <p>{message}</p>}

            <p>
                Đã có tài khoản? <Link to="/login">Đăng nhập tại đây</Link>
            </p>
        </div>
    );
}

export default RegisterPage;