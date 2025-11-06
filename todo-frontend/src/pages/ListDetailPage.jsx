// src/ListDetailPage.jsx
import React, { useState, useEffect } from 'react'; 
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/apiService'; 
import useDebounce from '../hooks/useDebounce';
import PageHeader from '../components/PageHeader';
import Stats from '../components/Stats';
// CSS cho item
const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px', 
    margin: '5px 0'
};

// CSS cho form
const formStyle = {
    display: 'flex',
    gap: '10px',
    margin: '20px 0',
    alignItems: 'center'
};

// --- HÀM HELPER (ĐỂ HIỂN THỊ) ---
// Định nghĩa Priority (giống BE)
const priorityMap = {
    0: 'Thấp',
    1: 'Trung bình',
    2: 'Cao'
};
// Format ngày
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN'); // Format kiểu VN
};
// ----------------------------------

function ListDetailPage() {
    const { id } = useParams(); 
    const [list, setList] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- 1. THÊM STATE CHO FORM ---
    const [newItemTitle, setNewItemTitle] = useState('');
    // State cho Priority (mặc định là 1 'Trung bình')
    const [newItemPriority, setNewItemPriority] = useState(1);
    // State cho DueDate (mặc định là rỗng)
    const [newItemDueDate, setNewItemDueDate] = useState('');

    // (State của form edit)
    const [editingItemId, setEditingItemId] = useState(null); 
    const [editFormData, setEditFormData] = useState({ title: '', priority: 1, dueDate: '' });

    // --- 2. SỬ DỤNG DEBOUNCE ---
    // "Theo dõi" state 'newItemTitle'
    // Chỉ cập nhật 'debouncedTitle' sau khi người dùng ngừng gõ 700ms
    const debouncedTitle = useDebounce(newItemTitle, 700);
    // -----------------------------

    // useEffect (tải dữ liệu) giữ nguyên
    useEffect(() => {
        const fetchListDetails = async () => {
            try {
                setLoading(true); 
                const response = await apiService.getTodoListById(id);
                setList(response.data); 
            } catch (err) {
                setError('Không thể tải dữ liệu cho list này.');
                if (err.response && err.response.status === 401) window.location.href = '/login'; 
            } finally {
                setLoading(false); 
            }
        };
        fetchListDetails();
    }, [id]); 

    // --- 3. useEffect MỚI ĐỂ GỌI AI ---
    // "Theo dõi" giá trị ĐÃ DEBOUNCE
    useEffect(() => {
        // Chỉ chạy nếu:
        // 1. Tên công việc có nội dung (dài hơn 3 ký tự)
        // 2. Chúng ta *không* đang ở chế độ Sửa (Edit)
        if (debouncedTitle.length > 3 && !editingItemId) {
            
            // Định nghĩa hàm gọi AI
            const fetchSuggestion = async () => {
                console.log(`AI: Đang dự đoán cho: "${debouncedTitle}"`);
                try {
                    const response = await apiService.suggestPriority(debouncedTitle);
                    
                    // Lấy kết quả (ví dụ: 2)
                    const suggestedPriority = response.data.priority;
                    console.log(`AI: Gợi ý: ${suggestedPriority}`);

                    // Tự động cập nhật ô <select>
                    setNewItemPriority(suggestedPriority);
                    
                } catch (err) {
                    console.error("Lỗi gọi AI:", err);
                }
            };
            
            // Chạy hàm
            fetchSuggestion();
        }
    }, [debouncedTitle, editingItemId]); // Chạy lại khi 2 giá trị này thay đổi

    // --- 2. CẬP NHẬT HÀM `handleCreateItem` ---
    const handleCreateItem = async (e) => {
        e.preventDefault(); 
        if (!newItemTitle.trim()) {
            alert('Tên công việc không được để trống');
            return;
        }

        try {
            // Chuẩn bị DTO để gửi đi (với 3 trường)
            const newItemData = {
                title: newItemTitle,
                todoListId: parseInt(id),
                priority: parseInt(newItemPriority), // Gửi priority (dưới dạng số)
                // Gửi dueDate (nếu rỗng thì gửi null, ngược lại gửi giá trị)
                dueDate: newItemDueDate ? newItemDueDate : null 
            };
            
            // BE của chúng ta (nhờ DTO) sẽ tự điền IsDone=false

            const response = await apiService.createTodoItem(newItemData);

            // Cập nhật state (quan trọng)
            setList(prevList => ({
                ...prevList, 
                items: [...prevList.items, response.data] 
            }));

            // Reset form
            setNewItemTitle('');
            setNewItemPriority(1);
            setNewItemDueDate('');

        } catch (error) {
            console.error('Lỗi khi tạo item:', error.response?.data);
            alert('Không thể tạo công việc mới. Hãy thử lại.');
        }
    };

    // 1. Khi nhấn nút "Sửa"
    const handleEditClick = (item) => {
        setEditingItemId(item.id); // Bật chế độ sửa cho item này

        // Quan trọng: Tải dữ liệu hiện tại của item vào state của form
        // Cần format lại Date cho đúng chuẩn <input type="date"> (yyyy-MM-dd)
        const formattedDueDate = item.dueDate 
            ? new Date(item.dueDate).toISOString().split('T')[0] 
            : '';

        setEditFormData({
            title: item.title,
            priority: item.priority,
            dueDate: formattedDueDate
        });
    };

    // 2. Khi nhấn nút "Hủy"
    const handleCancelEdit = () => {
        setEditingItemId(null); // Tắt chế độ sửa
        setEditFormData({ title: '', priority: 1, dueDate: '' }); // Xóa form
    };

    // 3. Khi gõ vào form sửa (giống form tạo)
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // 4. Khi nhấn nút "Lưu"
    const handleSaveEdit = async (e, itemToSave) => {
        e.preventDefault();

        try {
            // Chuẩn bị DTO đầy đủ để gửi lên (giống hàm toggle)
            const updateDto = {
                // Lấy các giá trị cũ
                ...itemToSave,
                // Ghi đè các giá trị mới từ form
                title: editFormData.title,
                priority: parseInt(editFormData.priority),
                dueDate: editFormData.dueDate ? editFormData.dueDate : null
            };

            // Gọi API Update
            // (BE sẽ trả về 204 NoContent)
            await apiService.updateTodoItem(itemToSave.id, updateDto);

            // Cập nhật state (giao diện)
            setList(prevList => ({
                ...prevList,
                items: prevList.items.map(item =>
                    item.id === itemToSave.id
                        ? { ...item, ...updateDto } // Cập nhật item trong danh sách
                        : item
                )
            }));

            // Tắt chế độ sửa
            handleCancelEdit(); 

        } catch (error) {
            console.error('Lỗi khi lưu cập nhật:', error);
            alert('Không thể lưu thay đổi.');
        }
    };
    // ----------------------------------------

    // (Các hàm `handleToggleDone` và `handleDeleteItem` giữ nguyên y hệt)
    const handleToggleDone = async (itemToToggle) => {
        try {
            const updateDto = {
                title: itemToToggle.title,
                isDone: !itemToToggle.isDone, 
                priority: itemToToggle.priority, // Gửi lại giá trị cũ
                dueDate: itemToToggle.dueDate,   // Gửi lại giá trị cũ
                todoListId: parseInt(id)
            };
            await apiService.updateTodoItem(itemToToggle.id, updateDto);
            setList(prevList => ({
                ...prevList,
                items: prevList.items.map(item =>
                    item.id === itemToToggle.id 
                        ? { ...item, isDone: !item.isDone } 
                        : item 
                )
            }));
        } catch (error) { alert('Không thể cập nhật trạng thái.'); }
    };
    const handleDeleteItem = async (idToDelete) => {
        if (!window.confirm('Bạn có chắc muốn xóa công việc này?')) return;
        try {
            await apiService.deleteTodoItem(idToDelete);
            setList(prevList => ({
                ...prevList,
                items: prevList.items.filter(item => item.id !== idToDelete)
            }));
        } catch (error) { alert('Không thể xóa công việc này.'); }
    };
    // (Kết thúc các hàm)

    if (loading) return <p>Đang tải chi tiết...</p>;
    if (error) return <p>{error}</p>;
    if (!list) return <p>Không tìm thấy danh sách.</p>;

    // Cập nhật phần JSX (HTML)
    return (
        // 1. "Tờ giấy" (Card) chính
        <div className="bg-paper p-6 md:p-8 rounded-lg shadow-lg border border-primary/20">

            {/* 2. Tiêu đề (Tên của List, ví dụ "học tập") */}
            <PageHeader title={list.name} />

            <Stats items={list.items} />

            {/* (Chúng ta sẽ thêm "Stats" và "Filters" của Figma vào đây sau) */}

            {/* 3. Form tạo Item mới (Style giống Figma) */}
            <form 
                onSubmit={handleCreateItem} 
                className="flex flex-wrap items-center gap-4 p-4 bg-wood/40 rounded-lg mb-6"
            >
                <input
                    type="text"
                    placeholder="Thêm công việc mới..."
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    className="flex-1 min-w-[200px] p-2 border border-primary/50 rounded-md bg-white font-serif"
                />
                <select 
                    value={newItemPriority}
                    onChange={(e) => setNewItemPriority(parseInt(e.target.value))}
                    className="p-2 border border-primary/50 rounded-md bg-white font-serif"
                >
                    <option value="0">Thấp</option>
                    <option value="1">Trung bình</option>
                    <option value="2">Cao</option>
                </select>
                <input
                    type="date"
                    value={newItemDueDate}
                    onChange={(e) => setNewItemDueDate(e.target.value)}
                    className="p-2 border border-primary/50 rounded-md bg-white font-serif"
                />
                <button 
                    type="submit"
                    className="p-2 bg-primary text-paper rounded-lg font-serif
                               hover:bg-accent hover:text-text-main transition-colors"
                >
                    Thêm
                </button>
            </form>

            {/* 4. Danh sách các Items */}
            <div className="flex flex-col gap-3">
                {list.items.length > 0 ? (
                    list.items.map(item => (
                        // Logic "Edit mode" hay "View mode"
                        editingItemId === item.id ? (
                            
                            // --- Chế độ SỬA (Form Edit) ---
                            <form 
                                key={item.id} 
                                onSubmit={(e) => handleSaveEdit(e, item)} 
                                className="flex flex-wrap items-center gap-2 p-3 bg-accent/20 rounded-lg"
                            >
                                <input
                                    type="text" name="title"
                                    value={editFormData.title} onChange={handleEditFormChange}
                                    className="flex-1 min-w-[150px] p-2 border border-primary/50 rounded-md bg-white font-serif"
                                />
                                <select
                                    name="priority" value={editFormData.priority} onChange={handleEditFormChange}
                                    className="p-2 border border-primary/50 rounded-md bg-white font-serif"
                                >
                                    <option value="0">Thấp</option>
                                    <option value="1">Trung bình</option>
                                    <option value="2">Cao</option>
                                </select>
                                <input
                                    type="date" name="dueDate"
                                    value={editFormData.dueDate} onChange={handleEditFormChange}
                                    className="p-2 border border-primary/50 rounded-md bg-white font-serif"
                                />
                                <button type="submit" className="p-2 bg-green-600 text-white rounded font-serif">Lưu</button>
                                <button type="button" onClick={handleCancelEdit} className="p-2 bg-gray-500 text-white rounded font-serif">Hủy</button>
                            </form>

                        ) : (
                            
                            // --- Chế độ XEM (Card Item bình thường) ---
                            <div 
                                key={item.id} 
                                className="flex flex-wrap items-center gap-4 p-3 bg-white rounded-lg shadow-sm border border-primary/10"
                            >
                                <input
                                    type="checkbox"
                                    checked={item.isDone}
                                    onChange={() => handleToggleDone(item)}
                                    className="w-5 h-5"
                                />
                                <span className={`font-serif ${item.isDone ? 'line-through text-gray-400' : 'text-text-main'}`}>
                                    {item.title} 
                                </span>
                                <span className="text-sm text-primary font-serif bg-wood/50 px-2 py-1 rounded">
                                    {priorityMap[item.priority] || 'Trung bình'}
                                </span>
                                <span className="text-sm text-gray-500 font-serif">
                                    {formatDate(item.dueDate)}
                                </span>
                                
                                {/* Nút điều khiển ở cuối */}
                                <div className="ml-auto flex gap-2">
                                    <button 
                                        onClick={() => handleEditClick(item)}
                                        className="p-1 text-sm text-primary hover:text-accent font-serif"
                                    >
                                        Sửa
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-1 text-sm text-red-600 hover:text-red-800 font-serif"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        )
                    ))
                ) : (
                    <p className="text-center text-primary/70 italic">Danh sách này chưa có công việc nào.</p>
                )}
            </div>

            <br />
            <Link to="/" className="text-primary hover:text-accent font-serif mt-6">
                &larr; Quay về Danh sách
            </Link>
        </div>
    );
}

export default ListDetailPage;