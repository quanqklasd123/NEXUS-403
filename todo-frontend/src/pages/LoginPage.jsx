// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import apiService from '../services/apiService'; 
import { Link } from 'react-router-dom'; 

// --- Thêm style (giống hệt trang Register) ---
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

function LoginPage({ onLoginSuccess }) {
    const [email, setEmail] = useState(''); // State này vẫn tên là 'email'
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('Đang đăng nhập...');

        try {
            // Gửi dữ liệu đi. BE sẽ tự hiểu đây là email hay username
            const response = await apiService.login(email, password);

            console.log('Đăng nhập thành công:', response.data);
            const { token } = response.data;
            
            localStorage.setItem('authToken', token);
            setMessage('Đăng nhập thành công!');
            
            onLoginSuccess(); 

        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            setMessage(`Lỗi: Sai email hoặc mật khẩu`);
        }
    };

    return (
        <div>
            <h2>Đăng nhập</h2>
            
            {/* --- CẬP NHẬT FORM --- */}
            {/* 1. Thêm style VÀ autoComplete="on" */}
            <form onSubmit={handleLogin} style={authFormStyle} autoComplete="on">
                
                <div style={inputGroupStyle}>
                    {/* 2. ĐỔI NHÃN (LABEL) */}
                    <label>Email hoặc Username:</label>
                    <input
                        type="email" // Giữ type="email" để trình duyệt gợi ý email
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        // 3. Thêm "username" để báo trình duyệt đây là ô định danh
                        autoComplete="username" 
                    />
                </div>
                
                <div style={inputGroupStyle}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        // 4. Quan trọng: "current-password"
                        // Báo trình duyệt dùng mật khẩu ĐÃ LƯU
                        autoComplete="current-password" 
                    />
                </div>

                <button type="submit">Đăng nhập</button>
            </form>
            {/* --------------------- */}

            {message && <p>{message}</p>}

            <p>
                Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
        </div>
    );
}

export default LoginPage;