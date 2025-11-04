// src/TodoList.jsx
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService'; // Dùng lại dịch vụ API
import { Link } from 'react-router-dom';

function TodoList() {
    const [lists, setLists] = useState([]); // State để lưu danh sách
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- THÊM STATE MỚI ---
    // State để lưu nội dung của ô input "Tên list mới"
    const [newListName, setNewListName] = useState('');
    // -----------------------

    // useEffect (Lấy data) giữ nguyên
    useEffect(() => {
        const fetchLists = async () => {
            try {
                const response = await apiService.getTodoLists();
                console.log('Lấy data thành công:', response.data);
                setLists(response.data); 
                setLoading(false);
            } catch (err) {
                console.error('Lỗi khi lấy data:', err);
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('authToken');
                    setError('Phiên đăng nhập hết hạn. Vui lòng tải lại trang và đăng nhập.');
                } else {
                    setError('Không thể tải danh sách.');
                }
                setLoading(false);
            }
        };
        fetchLists();
    }, []); 

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        window.location.reload(); 
    };

    // --- THÊM HÀM MỚI ---
    // Hàm này sẽ chạy khi nhấn nút "Tạo List"
    const handleCreateList = async (e) => {
        e.preventDefault(); // Ngăn form load lại trang
        if (!newListName.trim()) {
            alert('Tên list không được để trống');
            return;
        }

        try {
            // 1. Gọi API để tạo list mới
            const response = await apiService.createTodoList(newListName);
            
            // 2. Nếu thành công, BE sẽ trả về list vừa tạo
            // Thêm list mới này vào state "lists"
            // (Đây là cách để React tự động cập nhật UI)
            setLists([...lists, response.data]);

            // 3. Xóa nội dung trong ô input
            setNewListName(''); 

        } catch (error) {
            console.error('Lỗi khi tạo list:', error);
            alert('Không thể tạo list mới. Hãy thử lại.');
        }
    };
    // -----------------------

    // (Các phần `if (loading)` và `if (error)` giữ nguyên)
    if (loading) return <p>Đang tải danh sách...</p>;
    if (error) return <p>{error}</p>;

    // Cập nhật phần JSX (HTML)
    return (
        <div>
            <h2>Danh sách công việc của bạn</h2>
            <button onClick={handleLogout}>Đăng xuất</button>

            {/* Sử dụng "form-container" */}
            <form onSubmit={handleCreateList} className="form-container">
                <input
                    type="text"
                    placeholder="Tên danh sách mới"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                />
                <button type="submit">Thêm List mới</button>
            </form>

            {/* Sử dụng "item-list" */}
            <ul className="item-list">
                {lists.map(list => (
                    // Sử dụng "list-item"
                    <li key={list.id} className="list-item">
                        <Link to={`/list/${list.id}`} className="list-item-link">
                            {list.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TodoList;