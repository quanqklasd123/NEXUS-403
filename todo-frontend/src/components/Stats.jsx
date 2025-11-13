// src/components/Stats.jsx
import React from 'react';

// Component này nhận vào một prop: mảng "items"
function Stats({ items = [] }) {

    // --- 1. LOGIC TÍNH TOÁN ---

    // Đếm tổng số
    const totalTasks = items.length;

    // Đếm số item có "isDone === true"
    const completedTasks = items.filter(item => item.status === 2).length;

    // Tính phần trăm (xử lý trường hợp chia cho 0)
    const progressPercentage = (totalTasks > 0) 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;

    // --- 2. JSX (GIAO DIỆN) ---
    return (
        // Bố cục "Grid" (lưới) 3 cột, có "gap" (khoảng cách)
        <div className="grid grid-cols-3 gap-4 mb-6">

            {/* Card 1: Total Tasks */}
            <div className="bg-wood/40 p-4 rounded-lg shadow-sm border border-primary/10">
                <h4 className="text-sm font-serif text-primary">Total Tasks</h4>
                <p className="text-3xl font-bold text-text-main">{totalTasks}</p>
            </div>

            {/* Card 2: Completed */}
            <div className="bg-wood/40 p-4 rounded-lg shadow-sm border border-primary/10">
                <h4 className="text-sm font-serif text-primary">Completed</h4>
                <p className="text-3xl font-bold text-text-main">{completedTasks}</p>
            </div>

            {/* Card 3: Progress (Thanh tiến độ) */}
            <div className="bg-wood/40 p-4 rounded-lg shadow-sm border border-primary/10">
                <h4 className="text-sm font-serif text-primary">Progress</h4>
                {/* Thanh tiến độ */}
                <div className="w-full bg-primary/20 rounded-full h-2.5 my-2">
                    {/* Lõi của thanh tiến độ, dùng màu "accent" (vàng) */}
                    <div 
                        className="bg-accent h-2.5 rounded-full" 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <p className="text-right text-lg font-bold text-text-main">{progressPercentage}%</p>
            </div>
        </div>
    );
}

export default Stats;