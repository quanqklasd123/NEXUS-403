// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    FiHome,
    FiCheckSquare,
    FiTrello,
    FiCalendar,
} from 'react-icons/fi';
import { FiShoppingBag, FiCpu } from 'react-icons/fi';

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

function Sidebar() {
    return (
        <aside className="w-72 bg-white border-r border-neutral-200 h-screen fixed top-0 left-0 z-40 flex flex-col">

            {/* Logo */}
            <div className="p-6">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-sage-400 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">N</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-800">NEXUS</h1>
                        <p className="text-sm text-neutral-500">Productivity OS</p>
                    </div>
                </div>
            </div>

            {/* Điều hướng */}
            <nav className="flex-1">
                <NavLink to="/" className={getLinkClass}>
                    <FiHome className="w-5 h-5 mr-3" />
                    <span>Dashboard</span>
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
                    {/* Dùng icon Marketplace/Shopping Bag */}
                    <FiShoppingBag className="w-5 h-5 mr-3" />
                    <span>Marketplace</span>
                </NavLink>

                <NavLink to="/builder/:projectId" className={getLinkClass}>
                    {/* Dùng icon CPU/Tool cho Builder */}
                    <FiCpu className="w-5 h-5 mr-3" />
                    <span>App Builder</span>
                </NavLink>
            </nav>
        </aside>
    );
}

export default Sidebar;