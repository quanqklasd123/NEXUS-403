// src/TodoList.jsx
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService'; // Dùng lại dịch vụ API
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';  

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
        // 1. "Tờ giấy" (Card) chính, giống hệt LoginPage
        <div className="bg-paper p-6 md:p-8 rounded-lg shadow-lg border border-primary/20">
            <PageHeader /> {/* <-- DÙNG COMPONENT MỚI */}

            <form 
                onSubmit={handleCreateList} 
                className="flex gap-4 p-4 bg-wood/40 rounded-lg mb-6"
            >
                <input
                    type="text"
                    placeholder="Tên danh sách mới..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    // Thêm class Tailwind cho input
                    className="flex-1 p-2 border border-primary/50 rounded-md bg-white font-serif"
                />
                <button 
                    type="submit"
                    className="p-2 bg-primary text-paper rounded-lg font-serif
                               hover:bg-accent hover:text-text-main transition-colors"
                >
                    Thêm List
                </button>
            </form>

            {/* 4. Danh sách các List (đã được style) */}
            <div className="flex flex-col gap-3">
                {lists.map(list => (
                    // Mỗi link là một "item" có style
                    <Link 
                        key={list.id} 
                        to={`/list/${list.id}`}
                        className="block p-4 bg-white rounded-md shadow-sm border border-primary/10
                                   font-serif text-lg text-text-main 
                                   hover:shadow-md hover:border-accent transition-all"
                    >
                        {list.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default TodoList;