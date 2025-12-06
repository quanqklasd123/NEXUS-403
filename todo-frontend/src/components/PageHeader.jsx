// src/components/PageHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiShield } from 'react-icons/fi';
import { isAdmin, getUserInfo } from '../utils/jwtUtils';

function PageHeader({ title }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        // Kiểm tra role khi component mount
        const user = getUserInfo();
        const admin = isAdmin();
        setUserInfo(user);
        setIsUserAdmin(admin);
    }, []);

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
        window.location.reload(); 
    };

    const handleAdminArea = () => {
        navigate('/admin');
        setIsDropdownOpen(false);
    };

    // Lấy chữ cái đầu để hiển thị avatar
    const getInitial = () => {
        if (userInfo?.email) {
            return userInfo.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    return (
        <div className="flex items-center justify-between w-full mb-6 pb-4 border-b border-primary/10">

            <h2 className="text-3xl font-serif text-text-main">
                {title}
            </h2>

            <div className="flex items-center gap-4">
                {/* Nút chuông */}
                <button className="p-2 rounded-full hover:bg-wood/50 text-primary">
                    <FiBell className="w-6 h-6" />
                </button>
                
                {/* Avatar với menu dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                        className="w-10 h-10 rounded-full bg-primary text-paper
                                   flex items-center justify-center font-bold font-serif
                                   cursor-pointer"
                    >
                        {getInitial()}
                    </button>

                    {/* Menu thả xuống */}
                    {isDropdownOpen && (
                        <div 
                            className="absolute top-12 right-0 w-48 
                                       bg-paper rounded-lg shadow-lg border border-primary/20
                                       py-2 z-10"
                        >
                            <a 
                                href="#"
                                className="block px-4 py-2 text-text-main hover:bg-wood font-serif"
                            >
                                Hồ sơ (Profile)
                            </a>
                            {isUserAdmin && (
                                <button
                                    onClick={handleAdminArea}
                                    className="w-full text-left px-4 py-2 text-text-main hover:bg-wood font-serif flex items-center gap-2"
                                >
                                    <FiShield className="w-4 h-4" />
                                    Admin Area
                                </button>
                            )}
                            <button 
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-wood font-serif"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PageHeader;