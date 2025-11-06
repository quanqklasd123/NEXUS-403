// src/components/Sidebar.jsx
import React from 'react';
// 1. Import "NavLink" thay vì "Link"
import { NavLink } from 'react-router-dom';

// Hàm style (chúng ta sẽ dùng nó để làm nổi bật link "active")
const getLinkClass = ({ isActive }) => {
    return `
        flex items-center p-3 rounded-lg text-lg font-serif
        transition-colors duration-200
        ${
          isActive
            ? 'bg-primary text-paper' // Style khi "Active" (màu nâu, chữ trắng)
            : 'text-text-main hover:bg-wood' // Style mặc định
        }
    `;
};

function Sidebar() {
    return (
        // 2. Cột Sidebar (rộng 64 = 256px), nền "giấy"
        <aside className="w-64 bg-paper p-6 shadow-lg">

            {/* Logo (Bạn có thể thay bằng logo) */}
            <h1 className="text-3xl font-bold font-serif text-text-main mb-8">
                NEXUS
            </h1>

            {/* 3. Khu vực điều hướng */}
            <nav className="flex flex-col gap-4">
                {/* "NavLink" sẽ tự động thêm class "active"
                  khi URL khớp với "to"
                */}
                <NavLink to="/" className={getLinkClass}>
                    {/* (Bạn có thể thêm icon ở đây sau) */}
                    <span>All Tasks</span>
                </NavLink>
            </nav>
        </aside>
    );
}

export default Sidebar;