// src/pages/TodoList.jsx
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService'; 
import { Link, useNavigate } from 'react-router-dom'; 
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import Stats from '../components/Stats';       // Import Stats (Mới)

function TodoList() {
    // (TOÀN BỘ LOGIC STATE, USEEFFECT, HANDLERS CỦA BẠN GIỮ NGUYÊN)
    const [lists, setLists] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newListName, setNewListName] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // State tìm kiếm
    const [editingId, setEditingId] = useState(null);
    const [editListName, setEditListName] = useState('');
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const response = await apiService.getTodoLists();
                setLists(response.data); 
                setLoading(false);
            } catch (err) {
                console.error('Lỗi khi lấy data:', err);
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('authToken');
                    navigate('/login'); 
                } else {
                    setError('Không thể tải danh sách.');
                }
            }
        };
        fetchLists();
    }, [navigate]); // Thêm navigate vào dependency array

    const handleCreateList = async (e) => {
        e.preventDefault(); 
        if (!newListName.trim()) return;
        try {
            const response = await apiService.createTodoList(newListName);
            setLists([...lists, response.data]); // Thêm list mới vào UI
            setNewListName(''); 
        } catch (error) {
            console.error('Lỗi khi tạo list:', error);
            alert('Không thể tạo list mới.');
        }
    };

    // Handle Edit
    const handleEditClick = (list) => {
        setEditingId(list.id);
        setEditListName(list.name);
    };

    const handleSaveEdit = async (listId) => {
        if (!editListName.trim()) {
            alert('Vui lòng nhập tên danh sách!');
            return;
        }
        try {
            const response = await apiService.updateTodoList(listId, editListName.trim());
            setLists(lists.map(list => 
                list.id === listId ? { ...list, name: editListName.trim() } : list
            ));
            setEditingId(null);
            setEditListName('');
        } catch (error) {
            console.error('Lỗi khi cập nhật list:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
            alert(`Không thể cập nhật danh sách: ${errorMessage}`);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditListName('');
    };

    // Handle Delete
    const handleDeleteList = async (listId, listName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa danh sách "${listName}"? Tất cả các task trong danh sách này sẽ bị xóa.`)) {
            return;
        }
        try {
            await apiService.deleteTodoList(listId);
            setLists(lists.filter(list => list.id !== listId));
        } catch (error) {
            console.error('Lỗi khi xóa list:', error);
            alert('Không thể xóa danh sách.');
        }
    };

    // Tính toán danh sách đã lọc (filter)
    const filteredLists = lists.filter(list =>
        list.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Tính toán "Stats" (Thống kê)
    // Chúng ta cần tính tổng số "items" từ *tất cả* các "lists"
    const allItems = lists.reduce((acc, list) => acc.concat(list.items || []), []);
    // (Kết thúc Logic)


    if (loading) return <p>Đang tải danh sách...</p>;
    if (error) return <p>{error}</p>;

    // --- TÁI CẤU TRÚC TOÀN BỘ JSX BẰNG THEME MỚI (SAGE) ---
    return (
        // 1. "Tờ giấy" (Card) chính, style lấy từ .card trong Figma
        // Chúng ta dùng "bg-transparent" (nền trong suốt) vì nền xám ấm đã ở <body>
        // Bỏ shadow và border, để nó hòa vào nền chính
        <div className="bg-transparent p-0">
            
            {/* Header đã được thêm vào App.jsx - không cần thêm ở đây nữa */}

            {/* 3. Component "Stats" (Thống kê) */}
            {/* Chúng ta truyền "allItems" vào để nó tính toán */}
            <Stats items={allItems} />

            {/* 4. Tiêu đề phụ và Form tạo List mới */}
            <div className="flex justify-between items-center mb-6 mt-10">
                <h3 className="text-2xl font-medium text-neutral-800">Danh sách (Projects)</h3>
                <form 
                    onSubmit={handleCreateList} 
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        placeholder="Tên danh sách mới..."
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        // Style input mới (từ design-system.html)
                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:border-sage-400 focus:ring-3 focus:ring-sage-400/10 outline-none transition-colors"
                    />
                    <button 
                        type="submit"
                        // Style nút .btn-primary từ Figma
                        className="px-5 py-2 bg-sage-400 text-white rounded-xl font-medium hover:bg-sage-500 transition-colors shadow-lg shadow-sage-400/30 hover:shadow-xl hover:-translate-y-0.5"
                    >
                        Thêm
                    </button>
                </form>
            </div>

            {/* 5. Danh sách các List (đã được style) */}
            <div className="flex flex-col gap-3">
                {/* Dùng danh sách đã lọc (filteredLists) */}
                {filteredLists.map(list => (
                    <div
                        key={list.id}
                        className="group p-4 bg-white rounded-xl shadow-sm border border-neutral-200
                                   hover:shadow-md hover:border-sage-300 transition-all flex items-center justify-between"
                    >
                        {editingId === list.id ? (
                            // Edit Mode
                            <div className="flex-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editListName}
                                    onChange={(e) => setEditListName(e.target.value)}
                                    className="flex-1 px-3 py-2 text-lg font-medium border border-sage-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveEdit(list.id);
                                        } else if (e.key === 'Escape') {
                                            handleCancelEdit();
                                        }
                                    }}
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleSaveEdit(list.id)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Lưu"
                                >
                                    <FiCheck size={20} />
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Hủy"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                <Link 
                                    to={`/tasks/${list.id}`}
                                    className="flex-1"
                                >
                                    <div className="font-medium text-lg text-neutral-800">
                                        {list.name}
                                    </div>
                                    <p className="text-sm font-normal text-neutral-500 mt-1">
                                        {list.items?.length || 0} công việc
                                    </p>
                                </Link>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleEditClick(list);
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Sửa danh sách"
                                    >
                                        <FiEdit2 size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteList(list.id, list.name);
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Xóa danh sách"
                                    >
                                        <FiTrash2 size={18} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* (Thêm thông báo nếu không tìm thấy) */}
            {filteredLists.length === 0 && (
                <div className="text-center p-10 bg-white rounded-lg border border-neutral-200">
                    <p className="text-neutral-500">
                        {searchTerm.length > 0 
                            ? `Không tìm thấy danh sách nào khớp với "${searchTerm}"`
                            : "Bạn chưa có danh sách nào. Hãy tạo một cái!"
                        }
                    </p>
                </div>
            )}
        </div>
    );
}

export default TodoList;