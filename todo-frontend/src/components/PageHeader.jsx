// src/components/PageHeader.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';

function PageHeader({ title }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
        window.location.reload(); 
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
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                        className="w-10 h-10 rounded-full bg-primary text-paper
                                   flex items-center justify-center font-bold font-serif
                                   cursor-pointer"
                    >
                        Q
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