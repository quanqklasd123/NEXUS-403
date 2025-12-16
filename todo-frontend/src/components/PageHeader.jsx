// src/components/PageHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBell, FiShield, FiUser, FiSettings } from 'react-icons/fi';
import { isAdmin, getUserInfo } from '../utils/jwtUtils';
import apiService from '../services/apiService';

// Map routes to page titles
const getPageTitle = (pathname) => {
    const titleMap = {
        '/': 'My Apps',
        '/marketplace': 'Marketplace',
        '/app-builder': 'App Builder',
        '/admin': 'Admin Area'
    };

    // Check exact match first
    if (titleMap[pathname]) {
        return titleMap[pathname];
    }

    // Check for dynamic routes
    if (pathname.startsWith('/app-builder/')) {
        return 'App Builder';
    }
    if (pathname.startsWith('/app/')) {
        return 'App Runtime';
    }

    return 'NEXUS';
};

function PageHeader({ title: propTitle }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);

    // Use prop title if provided, otherwise get from route
    const displayTitle = propTitle || getPageTitle(location.pathname);

    useEffect(() => {
        // Fetch user info từ API
        const fetchUserInfo = async () => {
            try {
                const response = await apiService.getCurrentUser();
                if (response.data) {
                    setUserInfo({
                        userId: response.data.userId,
                        email: response.data.email,
                        userName: response.data.userName,
                        roles: response.data.roles || []
                    });
                    setIsUserAdmin(response.data.isAdmin || false);
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                // Fallback to token info if API fails
                const user = getUserInfo();
                const admin = isAdmin();
                setUserInfo(user);
                setIsUserAdmin(admin);
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
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
        if (userInfo?.userName) {
            return userInfo.userName.charAt(0).toUpperCase();
        }
        if (userInfo?.email) {
            return userInfo.email.charAt(0).toUpperCase();
        }
        return 'U';
    };



    if (loading) {
        return (
            <div className="flex items-center justify-between w-full mb-6 pb-4 border-b border-primary/10">
                <h2 className="text-3xl font-serif text-text-main">{displayTitle}</h2>
                <div className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between w-full mb-6 pb-4 border-b border-primary/10">
            <h2 className="text-3xl font-serif text-text-main">
                {displayTitle}
            </h2>

            <div className="flex items-center gap-4">
                {/* Nút chuông */}
                <button className="p-2 rounded-full hover:bg-wood/50 text-primary transition-colors">
                    <FiBell className="w-6 h-6" />
                </button>
                
                {/* Avatar với menu dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                        className="w-10 h-10 rounded-full bg-primary text-paper
                                   flex items-center justify-center font-bold font-serif
                                   cursor-pointer hover:opacity-90 transition-opacity
                                   shadow-sm"
                        title={userInfo?.userName || userInfo?.email || 'User'}
                    >
                        {getInitial()}
                    </button>

                    {/* Menu thả xuống */}
                    {isDropdownOpen && (
                        <div 
                            className="absolute top-12 right-0 w-64 
                                       bg-white rounded-xl shadow-2xl border-2 border-neutral-900
                                       overflow-hidden z-50"
                        >
                            {/* User Info Section */}
                            <div className="px-5 py-4 bg-neutral-900 border-b-2 border-neutral-800">
                                <div className="font-bold text-white text-base">
                                    {userInfo?.userName || 'User'}
                                </div>
                                <div className="text-sm text-neutral-300 mt-1 truncate">
                                    {userInfo?.email || ''}
                                </div>
                                {userInfo?.roles && userInfo.roles.length > 0 && (
                                    <div className="flex gap-1 mt-2">
                                        {userInfo.roles.map((role, idx) => (
                                            <span 
                                                key={idx}
                                                className="text-xs px-2.5 py-1 bg-white text-neutral-900 rounded-md font-medium"
                                            >
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Menu Items */}
                            <div className="py-2">
                                {isUserAdmin && (
                                    <button
                                        onClick={handleAdminArea}
                                        className="w-full text-left px-5 py-3 text-neutral-900 hover:bg-neutral-100 font-medium flex items-center gap-3 transition-all"
                                    >
                                        <FiShield className="w-5 h-5" />
                                        Admin Area
                                    </button>
                                )}
                            </div>
                            
                            <div className="border-t-2 border-neutral-100"></div>
                            
                            <button 
                                onClick={handleLogout}
                                className="w-full text-left px-5 py-3 text-red-600 hover:bg-red-50 font-bold transition-all flex items-center gap-3"
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