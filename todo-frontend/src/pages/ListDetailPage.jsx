// src/pages/ListDetailPage.jsx
import React, { useState, useEffect } from 'react'; 
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/apiService'; 
import useDebounce from '../hooks/useDebounce'; 
import Stats from '../components/Stats';       // Import Stats (Mới)
// Import icon (chúng ta sẽ dùng cho nút Sửa/Xóa)
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

// --- HÀM HELPER (ĐỂ HIỂN THỊ) ---
// Định nghĩa Priority (lấy từ design-system.html - .badge-*)
const priorityMap = {
    0: { text: 'Low', class: 'bg-info/20 text-info' }, // Dùng màu Info
    1: { text: 'Medium', class: 'bg-warning/20 text-warning' }, // Dùng màu Warning
    2: { text: 'High', class: 'bg-error/20 text-error' }  // Dùng màu Error
};
// Format ngày
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};
// ----------------------------------


function ListDetailPage() {
    // (TOÀN BỘ LOGIC STATE, USEEFFECT, HANDLERS CỦA BẠN GIỮ NGUYÊN)
    // ...
    // ... (useState, useDebounce, useEffect fetchListDetails, useEffect fetchSuggestion)
    // ... (handleCreateItem, handleToggleDone, handleDeleteItem)
    // ... (handleEditClick, handleCancelEdit, handleEditFormChange, handleSaveEdit)
    // ... (Tất cả logic code C# của bạn ở trên)
    // ...
    const { id } = useParams(); 
    const [list, setList] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemPriority, setNewItemPriority] = useState(1);
    const [newItemDueDate, setNewItemDueDate] = useState('');
    const [editingItemId, setEditingItemId] = useState(null); 
    const [editFormData, setEditFormData] = useState({ title: '', priority: 1, dueDate: '' });
    const debouncedTitle = useDebounce(newItemTitle, 700);
    
    // useEffect (tải chi tiết list)
    useEffect(() => {
        const fetchListDetails = async () => {
            if (!id) return;
            try {
                setLoading(true); 
                const response = await apiService.getTodoListById(id);
                setList(response.data); 
                setError(''); 
            } catch (err) {
                console.error('Lỗi khi lấy chi tiết list:', err);
                setError('Không thể tải dữ liệu cho list này.');
                if (err.response && err.response.status === 401) window.location.href = '/login'; 
            } finally {
                setLoading(false); 
            }
        };
        fetchListDetails();
    }, [id]); 

    // useEffect (gọi AI)
    useEffect(() => {
        if (debouncedTitle.length > 3 && !editingItemId) {
            const fetchSuggestion = async () => {
                try {
                    const response = await apiService.suggestPriority(debouncedTitle);
                    setNewItemPriority(response.data.priority);
                } catch (err) { console.error("Lỗi gọi AI:", err); }
            };
            fetchSuggestion();
        }
    }, [debouncedTitle, editingItemId]);

    // (Các hàm Handlers)
    const handleCreateItem = async (e) => {
        e.preventDefault(); 
        if (!newItemTitle.trim()) return;
        try {
            const newItemData = { 
                title: newItemTitle, 
                todoListId: id, // MongoDB dùng string, không parse int
                priority: parseInt(newItemPriority),
                dueDate: newItemDueDate ? newItemDueDate : null,
                status: 0 // Default status: To Do
            };
            const response = await apiService.createTodoItem(newItemData);
            setList(prevList => ({ ...prevList, items: [...prevList.items, response.data] }));
            setNewItemTitle(''); setNewItemPriority(1); setNewItemDueDate('');
        } catch (error) { 
            console.error('Lỗi tạo task:', error);
            alert(`Không thể tạo công việc mới: ${error.response?.data?.message || error.message || 'Lỗi không xác định'}`); 
        }
    };
    const handleToggleDone = async (itemToToggle) => {
        try {
            // 0 = To Do, 1 = In Progress, 2 = Done
            const newStatus = itemToToggle.status === 0 ? 2 : 0;

            // Build DTO cho API
            const updateDto = {
                ...itemToToggle,
                status: newStatus,
                todoListId: id // MongoDB dùng string, không parse int
            };

            // Gọi API cập nhật item
            await apiService.updateTodoItem(itemToToggle.id, updateDto);

            // Cập nhật UI cục bộ
            setList(prevList => ({
                ...prevList,
                items: prevList.items.map(it =>
                    it.id === itemToToggle.id ? { ...it, status: newStatus } : it
                )
            }));
        } catch (err) {
            console.error('Lỗi khi cập nhật trạng thái:', err);
            alert('Không thể cập nhật trạng thái công việc.');
        }
    };

    const handleDeleteItem = async (idToDelete) => {
        if (!window.confirm('Bạn có chắc muốn xóa công việc này?')) return;
        try {
            await apiService.deleteTodoItem(idToDelete);
            setList(prevList => ({
                ...prevList,
                items: prevList.items.filter(item => item.id !== idToDelete)
            }));
        } catch (error) {
            console.error('Lỗi khi xóa:', error);
            alert('Không thể xóa công việc này.');
        }
    };
    const handleEditClick = (item) => {
        setEditingItemId(item.id); 
        const formattedDueDate = item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '';
        setEditFormData({ title: item.title, priority: item.priority, dueDate: formattedDueDate });
    };
    const handleCancelEdit = () => { setEditingItemId(null); };
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevData => ({ ...prevData, [name]: value }));
    };
    const handleSaveEdit = async (e, itemToSave) => {
        e.preventDefault();
        try {
            const updateDto = {
                ...itemToSave,
                title: editFormData.title,
                priority: parseInt(editFormData.priority),
                dueDate: editFormData.dueDate ? editFormData.dueDate : null
            };
            await apiService.updateTodoItem(itemToSave.id, updateDto);
            setList(prevList => ({
                ...prevList,
                items: prevList.items.map(item =>
                    item.id === itemToSave.id ? updateDto : item
                )
            }));
            handleCancelEdit(); 
        } catch (error) { alert('Không thể lưu thay đổi.'); }
    };
    // (Kết thúc Logic)


    if (loading) return <p>Đang tải chi tiết...</p>;
    if (error) return <p>{error}</p>;
    // (Phải kiểm tra `list` trước khi dùng `list.name` hay `list.items`)
    if (!list) return <p>Không tìm thấy danh sách.</p>; 

    // --- TÁI CẤU TRÚC TOÀN BỘ JSX BẰNG THEME MỚI (SAGE) ---
    return (
        // 1. "Tờ giấy" (Card) chính, style lấy từ .card trong Figma
        // Tái sử dụng style của TodoList: nền trong suốt, p-0
        <div className="bg-transparent p-0">

            {/* Header đã được thêm vào App.jsx - không cần thêm ở đây nữa */} 

            {/* 3. Component "Stats" (Thống kê) */}
            <Stats items={list.items} />

            {/* 4. Form tạo Item mới (Style giống Figma) */}
            {/* Đây là .task-item.editing từ today.html */}
            <form 
                onSubmit={handleCreateItem} 
                className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg mb-6 shadow border border-sage-300 ring-3 ring-sage-400/10"
            >
                <input
                    type="text"
                    placeholder="Thêm công việc mới..."
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    // style "task-input" từ today.html
                    className="flex-1 min-w-[200px] p-2 bg-transparent font-medium text-lg text-neutral-800 outline-none"
                />
                <select 
                    value={newItemPriority}
                    onChange={(e) => setNewItemPriority(parseInt(e.target.value))}
                    className="p-2 border border-neutral-200 rounded-lg bg-white font-sans text-sm"
                >
                    <option value="0">Thấp</option>
                    <option value="1">Trung bình</option>
                    <option value="2">Cao</option>
                </select>
                <input
                    type="date"
                    value={newItemDueDate}
                    onChange={(e) => setNewItemDueDate(e.target.value)}
                    className="p-2 border border-neutral-200 rounded-lg bg-white font-sans text-sm"
                />
                <button 
                    type="submit"
                    // style .btn-primary từ Figma
                    className="px-5 py-2 bg-sage-400 text-white rounded-xl font-medium hover:bg-sage-500 transition-colors"
                >
                    Thêm
                </button>
            </form>

            {/* 5. Danh sách các Items (style .task-item từ today.html) */}
            <div className="flex flex-col gap-3">
                {list.items.length > 0 ? (
                    list.items.map(item => (
                        // Logic "Edit mode" hay "View mode"
                        editingItemId === item.id ? (
                            
                            // --- Chế độ SỬA (Form Edit) ---
                            // (Style giống form tạo)
                            <form 
                                key={item.id} 
                                onSubmit={(e) => handleSaveEdit(e, item)} 
                                className="flex flex-wrap items-center gap-2 p-3 bg-sage-50 rounded-lg border border-sage-300"
                            >
                                <input
                                    type="text" name="title"
                                    value={editFormData.title} onChange={handleEditFormChange}
                                    className="flex-1 min-w-[150px] p-2 border border-neutral-200 rounded-lg bg-white font-sans"
                                />
                                <select
                                    name="priority" value={editFormData.priority} onChange={handleEditFormChange}
                                    className="p-2 border border-neutral-200 rounded-lg bg-white font-sans text-sm"
                                >
                                    <option value="0">Thấp</option>
                                    <option value="1">Trung bình</option>
                                    <option value="2">Cao</option>
                                </select>
                                <input
                                    type="date" name="dueDate"
                                    value={editFormData.dueDate} onChange={handleEditFormChange}
                                    className="p-2 border border-neutral-200 rounded-lg bg-white font-sans text-sm"
                                />
                                <button type="submit" className="p-2 bg-success text-white rounded font-sans text-sm">Lưu</button>
                                <button type="button" onClick={handleCancelEdit} className="p-2 bg-neutral-500 text-white rounded font-sans text-sm">Hủy</button>
                            </form>

                        ) : (
                            
                            // --- Chế độ XEM (Card Item bình thường) ---
                            // (Style .task-item từ today.html)
                            <div 
                                key={item.id} 
                                className={`flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border border-neutral-200 
                                            hover:border-sage-300 hover:shadow-md transition-all
                                            ${item.status === 2 ? 'opacity-60' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={item.status === 2}
                                    onChange={() => handleToggleDone(item)}
                                    // style .checkbox từ design-system.html
                                    className="w-5 h-5 rounded border-2 border-neutral-300 text-sage-400 focus:ring-sage-400 mt-0.5"
                                />
                                
                                <div className="flex-1">
                                    <span className={`font-medium ${item.status === 2 ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                                        {item.title} 
                                    </span>
                                    {/* (Hiển thị các "badge" (huy hiệu) giống Figma) */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span 
                                            className={`text-xs font-medium px-2 py-0.5 rounded-md 
                                                        ${priorityMap[item.priority]?.class || 'bg-neutral-200 text-neutral-600'}`}
                                        >
                                            {priorityMap[item.priority]?.text || '---'}
                                        </span>
                                        {item.dueDate && (
                                            <span className="text-xs text-neutral-500">
                                                Due: {formatDate(item.dueDate)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Nút điều khiển ở cuối */}
                                <div className="ml-auto flex gap-2">
                                    <button 
                                        onClick={() => handleEditClick(item)}
                                        className="p-1 text-neutral-500 hover:text-sage-600"
                                    >
                                        <FiEdit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-1 text-neutral-500 hover:text-error"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    ))
                ) : (
                    <div className="text-center p-10 bg-white rounded-lg border border-neutral-200">
                        <p className="text-neutral-500">Danh sách này chưa có công việc nào.</p>
                    </div>
                )}
            </div>
            
            {/* (Nút Quay về) */}
            <div className="mt-8">
                <Link to="/tasks" className="text-sage-600 hover:text-sage-800 font-medium">
                    &larr; Quay về tất cả danh sách
                </Link>
            </div>
        </div>
    );
}

export default ListDetailPage;