// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import apiService from '../services/apiService';
import { isAdmin } from '../utils/jwtUtils';
import { FiUsers, FiPackage, FiLock, FiUnlock, FiTrash2, FiSearch, FiShield } from 'react-icons/fi';

function AdminPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users'); // 'users' hoặc 'marketplace'
    const [users, setUsers] = useState([]);
    const [marketplaceApps, setMarketplaceApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Kiểm tra quyền Admin khi component mount
    useEffect(() => {
        if (!isAdmin()) {
            alert('Bạn không có quyền truy cập trang này.');
            navigate('/');
        }
    }, [navigate]);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAdminUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Không thể tải danh sách users. Bạn có phải Admin không?');
        } finally {
            setLoading(false);
        }
    };

    // Fetch marketplace apps
    const fetchMarketplaceApps = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAdminMarketplaceApps();
            setMarketplaceApps(response.data);
        } catch (error) {
            console.error('Error fetching marketplace apps:', error);
            alert('Không thể tải danh sách apps.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else {
            fetchMarketplaceApps();
        }
    }, [activeTab]);

    // Lock user
    const handleLockUser = async (userId) => {
        if (!window.confirm('Bạn có chắc chắn muốn khóa user này không?')) {
            return;
        }

        try {
            await apiService.lockUser(userId);
            alert('Đã khóa user thành công.');
            fetchUsers();
        } catch (error) {
            console.error('Error locking user:', error);
            alert('Không thể khóa user.');
        }
    };

    // Unlock user
    const handleUnlockUser = async (userId) => {
        if (!window.confirm('Bạn có chắc chắn muốn mở khóa user này không?')) {
            return;
        }

        try {
            await apiService.unlockUser(userId);
            alert('Đã mở khóa user thành công.');
            fetchUsers();
        } catch (error) {
            console.error('Error unlocking user:', error);
            alert('Không thể mở khóa user.');
        }
    };

    // Delete user
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa user này không? Hành động này không thể hoàn tác.')) {
            return;
        }

        try {
            await apiService.deleteUser(userId);
            alert('Đã xóa user thành công.');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            const errorMsg = error.response?.data?.message || 'Không thể xóa user.';
            alert(errorMsg);
        }
    };

    // Delete marketplace app
    const handleDeleteApp = async (appId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa app này khỏi marketplace không?')) {
            return;
        }

        try {
            await apiService.deleteMarketplaceApp(appId);
            alert('Đã xóa app khỏi marketplace thành công.');
            fetchMarketplaceApps();
        } catch (error) {
            console.error('Error deleting app:', error);
            alert('Không thể xóa app.');
        }
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            user.userName?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term)
        );
    });

    // Filter marketplace apps
    const filteredApps = marketplaceApps.filter(app => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            app.name?.toLowerCase().includes(term) ||
            app.description?.toLowerCase().includes(term) ||
            app.authorName?.toLowerCase().includes(term) ||
            app.authorEmail?.toLowerCase().includes(term)
        );
    });

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Admin Area" />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-neutral-200">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 font-medium transition-colors ${
                        activeTab === 'users'
                            ? 'text-sage-600 border-b-2 border-sage-600'
                            : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <FiUsers className="w-5 h-5" />
                        <span>Quản lý Users</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('marketplace')}
                    className={`px-6 py-3 font-medium transition-colors ${
                        activeTab === 'marketplace'
                            ? 'text-sage-600 border-b-2 border-sage-600'
                            : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <FiPackage className="w-5 h-5" />
                        <span>Marketplace Apps</span>
                    </div>
                </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={`Tìm kiếm ${activeTab === 'users' ? 'users' : 'apps'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
                </div>
            ) : activeTab === 'users' ? (
                /* Users Table */
                <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">User</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Roles</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Trạng thái</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-700">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-neutral-500">
                                            Không tìm thấy user nào.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-sage-500 text-white flex items-center justify-center font-bold">
                                                        {user.userName?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-neutral-800">{user.userName}</div>
                                                        <div className="text-xs text-neutral-500">ID: {user.id.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {user.roles?.map((role, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                                role === 'Admin'
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-sage-100 text-sage-700'
                                                            }`}
                                                        >
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.isLocked ? (
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                                                        <FiLock className="w-3 h-3" />
                                                        Đã khóa
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                                        Hoạt động
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.isLocked ? (
                                                        <button
                                                            onClick={() => handleUnlockUser(user.id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Mở khóa"
                                                        >
                                                            <FiUnlock className="w-5 h-5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleLockUser(user.id)}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Khóa user"
                                                        >
                                                            <FiLock className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {!user.roles?.includes('Admin') && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xóa user"
                                                        >
                                                            <FiTrash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Marketplace Apps Table */
                <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">App</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Mô tả</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Tác giả</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Ngày tạo</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-700">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredApps.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-neutral-500">
                                            Không tìm thấy app nào.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApps.map((app) => (
                                        <tr key={app.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-neutral-800">{app.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600 text-sm">
                                                {app.description || 'Không có mô tả'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-neutral-800">{app.authorName || 'N/A'}</div>
                                                    <div className="text-xs text-neutral-500">{app.authorEmail}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">
                                                {formatDate(app.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end">
                                                    <button
                                                        onClick={() => handleDeleteApp(app.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa app"
                                                    >
                                                        <FiTrash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPage;

