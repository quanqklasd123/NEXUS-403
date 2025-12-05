// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    FiHome,
    FiCheckSquare,
    FiTrello,
    FiCalendar,
    FiMenu,
    FiX,
    FiShoppingBag,
    FiCpu,
    FiLayers,
    FiGrid,
} from 'react-icons/fi';

const getLinkClass = ({ isActive }) => {
    return `
    flex items-center p-3 mx-3 my-1 rounded-lg
    text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800
    transition-colors duration-200
    ${isActive
            ? 'bg-sage-100 text-sage-700 font-medium' // Style khi "Active"
            : 'font-normal' // Style mặc định
        }
  `;
};

function Sidebar({ isOpen = true, onToggle }) {
    return (
        <>
            {/* Nút toggle khi sidebar bị ẩn */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center shadow-md hover:bg-neutral-50 transition-colors"
                    title="Hiện sidebar"
                >
                    <FiMenu className="w-5 h-5 text-neutral-700" />
                </button>
            )}
            
            <aside className={`w-72 bg-white border-r border-neutral-200 h-screen fixed top-0 left-0 z-40 flex flex-col transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>

            {/* Logo và nút đóng */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-sage-400 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">N</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-800">NEXUS</h1>
                            <p className="text-sm text-neutral-500">Productivity OS</p>
                        </div>
                    </div>
                    <button
                        onClick={onToggle}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
                        title="Ẩn sidebar"
                    >
                        <FiX className="w-5 h-5 text-neutral-600" />
                    </button>
                </div>
            </div>

            {/* Điều hướng */}
            <nav className="flex-1">
                {/* My Apps - Trang chủ */}
                <NavLink to="/" className={getLinkClass}>
                    <FiGrid className="w-5 h-5 mr-3" />
                    <span>My Apps</span>
                </NavLink>

                <NavLink to="/tasks" className={getLinkClass}>
                    <FiCheckSquare className="w-5 h-5 mr-3" />
                    <span>My Tasks</span>
                </NavLink>

                <NavLink to="/kanban" className={getLinkClass}>
                    <FiTrello className="w-5 h-5 mr-3" />
                    <span>Kanban</span>
                </NavLink>
                <NavLink to="/calendar" className={getLinkClass}>
                    <FiCalendar className="w-5 h-5 mr-3" />
                    <span>Calendar</span>
                </NavLink>
                <NavLink to="/marketplace" className={getLinkClass}>
                    <FiShoppingBag className="w-5 h-5 mr-3" />
                    <span>Marketplace</span>
                </NavLink>

                {/* Divider */}
                <div className="mx-3 my-4 border-t border-neutral-200"></div>

                {/* App Builder - Create new apps */}
                <NavLink to="/app-builder" className={getLinkClass}>
                    <FiLayers className="w-5 h-5 mr-3" />
                    <span>App Builder</span>
                </NavLink>
            </nav>
        </aside>
        </>
    );
}

export default Sidebar;