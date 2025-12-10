// src/pages/KanbanPage.jsx

import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FiLink } from 'react-icons/fi'; // Icon để link về Project

// (Sao chép các helper 'priorityMap' và 'formatDate'
//  từ 'ListDetailPage.jsx' của bạn)
const priorityMap = {
    0: { text: 'Low', class: 'bg-info/20 text-info' },
    1: { text: 'Medium', class: 'bg-warning/20 text-warning' },
    2: { text: 'High', class: 'bg-error/20 text-error' } 
};
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
};

// --- COMPONENT KANBAN CARD (THẺ CÔNG VIỆC) ---
// (ĐÃ NÂNG CẤP: Hiển thị tên Project/List)
const KanbanCard = ({ item, index }) => {
    const priority = priorityMap[item.priority] || priorityMap[1];

    return (
        <Draggable draggableId={item.id.toString()} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-white border border-neutral-200 rounded-xl p-4 mb-3
                                transition-all hover:shadow-md hover:border-sage-300
                                ${snapshot.isDragging ? 'shadow-lg rotate-3' : ''}`}
                >
                    {/* (Style từ .priority-high, .priority-medium...) */}
                    <div className={`border-l-4 ${priority.class.replace('bg-', 'border-').replace('/20', '')} pl-3`}>
                        <h4 className="font-medium text-neutral-800 mb-2">{item.title}</h4>

                        {/* --- THÊM TÊN PROJECT/LIST --- */}
                        <div className="flex items-center text-xs text-neutral-500 mb-3">
                            <FiLink className="w-3 h-3 mr-1" />
                            <span>{item.todoListName || 'N/A'}</span>
                        </div>
                        {/* ------------------------- */}

                        <div className="flex items-center gap-2 mt-2">
                            <span 
                                className={`text-xs font-medium px-2 py-0.5 rounded-md ${priority.class}`}
                            >
                                {priority.text}
                            </span>
                            {item.dueDate && (
                                <span className="text-xs text-neutral-500">
                                    Due: {formatDate(item.dueDate)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

// --- COMPONENT KANBAN COLUMN (CỘT) ---
// (Lấy style từ 'kanban.html' - .kanban-column)
const KanbanColumn = ({ title, statusId, items }) => {
    const columnColors = {
        0: 'border-t-info',    // To Do (Info)
        1: 'border-t-warning', // In Progress (Warning)
        2: 'border-t-success'  // Done (Success)
    };

    return (
        <div className={`bg-neutral-100 rounded-lg p-4 border-t-4 ${columnColors[statusId]}`}>
            <h3 className="text-lg font-medium text-neutral-800 mb-4">{title} ({items.length})</h3>

            <Droppable droppableId={statusId.toString()}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[400px] transition-colors
                                    ${snapshot.isDraggingOver ? 'bg-sage-100' : 'bg-transparent'}`}
                    >
                        {items.map((item, index) => (
                            <KanbanCard key={item.id} item={item} index={index} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};


// --- TRANG KANBAN CHÍNH (ĐÃ "LỘT XÁC") ---
function KanbanPage() {
    // State chính: Chỉ cần 1 mảng (array) "allItems"
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 1. Tải TẤT CẢ items (chỉ 1 lần)
    useEffect(() => {
        const fetchAllItems = async () => {
            try {
                setLoading(true);
                // Dùng API "tổng thể" MỚI
                const response = await apiService.getAllMyItems();
                setAllItems(response.data);
            } catch (error) {
                console.error("Lỗi tải Items:", error);
                setError("Không thể tải bảng Kanban.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllItems();
    }, []); // [] = Chạy 1 lần khi trang tải

    // 2. Logic Kéo-Thả (Drag-and-Drop)
    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        // Nếu thả ra ngoài, hoặc thả về vị trí cũ
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        const itemId = parseInt(draggableId);
        const newStatus = parseInt(destination.droppableId); // ID của cột mới (0, 1, 2)

        // --- Cập nhật Giao diện (UI) ngay lập tức (Optimistic Update) ---
        const itemToMove = allItems.find(i => i.id === itemId);
        const updatedItem = { ...itemToMove, status: newStatus };

        // Lọc item cũ ra và thêm item (đã update) vào
        const newItems = allItems.filter(i => i.id !== itemId);
        newItems.push(updatedItem);

        setAllItems(newItems); // Cập nhật UI

        // --- Gọi API ở "hậu trường" (Background) ---
        try {
            await apiService.updateItemStatus(itemId, newStatus);
            // (Thành công, không cần làm gì)
        } catch (error) {
            console.error("Lỗi cập nhật Status:", error);
            // (Nếu lỗi, "hoàn tác" (rollback) lại UI)
            setAllItems(allItems); // Quay về trạng thái cũ
            alert("Không thể di chuyển card!");
        }
    };

    // 3. Lọc (Filter) items vào 3 cột
    const todoItems = allItems.filter(item => item.status === 0);
    const inProgressItems = allItems.filter(item => item.status === 1);
    const doneItems = allItems.filter(item => item.status === 2);

    return (
        <div className="bg-transparent p-0">
            {/* Header đã được thêm vào App.jsx - không cần thêm ở đây nữa */}

            {/* (Xóa Dropdown chọn Project (List) - vì đây là view "tổng thể") */}

            {loading ? (
                <p>Đang tải bảng Kanban...</p>
            ) : error ? (
                <p>{error}</p>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KanbanColumn title="To Do" statusId={0} items={todoItems} />
                        <KanbanColumn title="In Progress" statusId={1} items={inProgressItems} />
                        <KanbanColumn title="Done" statusId={2} items={doneItems} />
                    </div>
                </DragDropContext>
            )}
        </div>
    );
}

export default KanbanPage;