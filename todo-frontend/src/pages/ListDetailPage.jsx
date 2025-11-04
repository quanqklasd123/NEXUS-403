// src/ListDetailPage.jsx
import React, { useState, useEffect } from 'react'; 
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/apiService'; 
import useDebounce from '../hooks/useDebounce';

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
        <div>
            <h2>{list.name}</h2> 
            <hr />

            {/* Form tạo item (giữ nguyên) */}
            <form onSubmit={handleCreateItem} style={formStyle}>
                {/* ... (code form này giữ nguyên) ... */}
                <label>Tên:</label>
                <input
                    type="text"
                    placeholder="Tên công việc mới"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                />
                <label>Ưu tiên:</label>
                <select 
                    value={newItemPriority}
                    onChange={(e) => setNewItemPriority(parseInt(e.target.value))}
                >
                    <option value="0">Thấp</option>
                    <option value="1">Trung bình</option>
                    <option value="2">Cao</option>
                </select>
                <label>Ngày hết hạn:</label>
                <input
                    type="date"
                    value={newItemDueDate}
                    onChange={(e) => setNewItemDueDate(e.target.value)}
                />
                <button type="submit">Thêm công việc</button>
            </form>

            <h3>Các công việc:</h3>
            {/* Sử dụng "item-list" */}
            <ul className="item-list">
                {list.items.length > 0 ? (
                    list.items.map(item => (
                        // --- ĐÂY LÀ SỰ THAY ĐỔI LỚN NHẤT ---
                        // Bọc toàn bộ <li> bằng logic (nếu đang sửa thì...)
                        
                        editingItemId === item.id ? (
                            
                            // --- Chế độ SỬA (Render Form) ---
                            <li key={item.id} className="list-item" style={{ backgroundColor: '#fffbe5' }}>
                                <form onSubmit={(e) => handleSaveEdit(e, item)} style={formStyle}>
                                    <input
                                        type="text"
                                        name="title"
                                        value={editFormData.title}
                                        onChange={handleEditFormChange}
                                        style={{ flex: 1 }} /* Cho ô input dài ra */
                                    />
                                    <select
                                        name="priority"
                                        value={editFormData.priority}
                                        onChange={handleEditFormChange}
                                    >
                                        <option value="0">Thấp</option>
                                        <option value="1">Trung bình</option>
                                        <option value="2">Cao</option>
                                    </select>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={editFormData.dueDate}
                                        onChange={handleEditFormChange}
                                    />
                                    <button type="submit" style={{ color: 'green' }}>Lưu</button>
                                    <button type="button" onClick={handleCancelEdit}>Hủy</button>
                                </form>
                            </li>

                        ) : (
                            
                            // --- Chế độ XEM (Render bình thường) ---
                            <li key={item.id} className="list-item">
                                <input
                                    type="checkbox"
                                    checked={item.isDone}
                                    onChange={() => handleToggleDone(item)}
                                />
                                
                                <span className={item.isDone ? "item-title-done" : "item-title"}>
                                    {item.title} 
                                </span>

                                <span className="item-details">
                                    {priorityMap[item.priority] || 'Trung bình'}
                                </span>

                                <span className="item-details">
                                    {formatDate(item.dueDate)}
                                </span>
                                
                                {/* Nút "Sửa" mới */}
                                <button 
                                    onClick={() => handleEditClick(item)}
                                    style={{ marginLeft: 'auto', cursor: 'pointer' }}
                                >
                                    Sửa
                                </button>
                                
                                <button 
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="delete-button"
                                >
                                    Xóa
                                </button>
                            </li>
                        )
                        // --- KẾT THÚC THAY ĐỔI ---
                    ))
                ) : (
                    <p>Danh sách này chưa có công việc nào.</p>
                )}
            </ul>

            <br />
            <Link to="/">Quay về Danh sách</Link>
        </div>
    );
}

export default ListDetailPage;