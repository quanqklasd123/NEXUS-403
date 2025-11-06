// src/components/PageHeader.jsx
import React, { useState } from 'react'; // <-- 1. Thêm useState
import { useNavigate } from 'react-router-dom'; // <-- 2. Thêm useNavigate
import { FiSearch, FiBell } from 'react-icons/fi';

function PageHeader({ title, searchTerm, onSearchChange }) {
    // --- 3. LOGIC CHO DROPDOWN MENU ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        // Xóa "chìa khóa"
        localStorage.removeItem('authToken');
        
        // Quay về trang Login
        navigate('/login');
        
        // (Tùy chọn, nhưng nên làm) Tải lại trang để reset toàn bộ state
        window.location.reload(); 
    };
    // ----------------------------------

    return (
        <div className="flex items-center justify-between w-full mb-6 pb-4 border-b border-primary/10">

            <h2 className="text-3xl font-serif text-text-main">
                {title}
            </h2>

            {/* (Ô tìm kiếm giữ nguyên) */}
            <div className="relative w-1/3">
                <div className="absolute inset-y-0 left-0 ...">
                    <FiSearch className="w-5 h-5 text-primary/60" />
                </div>
                <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="w-full p-2 pl-10 ..."
                    value={searchTerm} 
                    onChange={(e) => onSearchChange(e.target.value)} 
                />
            </div>

            {/* --- 4. CẬP NHẬT AVATAR VÀ THÊM MENU --- */}
            <div className="flex items-center gap-4">
                {/* (Nút chuông giữ nguyên) */}
                <button className="p-2 rounded-full hover:bg-wood/50 text-primary">
                    <FiBell className="w-6 h-6" />
                </button>
                
                {/* Dùng "relative" để menu con định vị theo nó */}
                <div className="relative">
                    {/* Biến Avatar thành một "nút" */}
                    <button
                        onClick={() => setIsDropdownOpen(prev => !prev)} // Bật/Tắt menu
                        className="w-10 h-10 rounded-full bg-primary text-paper
                                   flex items-center justify-center font-bold font-serif
                                   cursor-pointer"
                    >
                        Q
                    </button>

                    {/* Menu thả xuống (Dropdown Menu) */}
                    {isDropdownOpen && (
                        <div 
                            className="absolute top-12 right-0 w-48 
                                       bg-paper rounded-lg shadow-lg border border-primary/20
                                       py-2 z-10" // z-10 để nó "nổi" lên trên
                        >
                            <a 
                                href="#" // (Tạm thời, có thể là link /profile sau)
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
            {/* -------------------------------------- */}
        </div>
    );
}

export default PageHeader;