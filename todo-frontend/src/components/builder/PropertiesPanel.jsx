// src/components/builder/PropertiesPanel.jsx
import React from 'react';
import { FiTrash2, FiType, FiLayout, FiMaximize, FiMonitor } from 'react-icons/fi';

const PropertiesPanel = ({ selectedItem, onUpdateItem, onDeleteItem }) => {
    if (!selectedItem) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-neutral-400 p-6 text-center">
                <FiLayout className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm italic">Chọn một phần tử trên Canvas để chỉnh sửa.</p>
            </div>
        );
    }

    // Hàm xử lý thay đổi giá trị style/props
    const handleChange = (section, key, value) => {
        let finalValue = value;

        // Tự động thêm 'px' cho width/height/padding/margin nếu người dùng chỉ nhập số
        if (section === 'style' && ['width', 'height', 'padding', 'margin'].includes(key)) {
            // Kiểm tra xem value có phải là số không (regex)
            if (value && /^[0-9]+$/.test(value)) {
                finalValue = `${value}px`;
            }
        }

        onUpdateItem(selectedItem.id, {
            ...selectedItem,
            [section]: {
                ...selectedItem[section],
                [key]: finalValue
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header Panel */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/50">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ID: {selectedItem.id.slice(-4)}</span>
                    <span className="px-2 py-0.5 bg-sage-100 text-sage-700 text-[10px] uppercase font-bold rounded-full">
                        {selectedItem.type}
                    </span>
                </div>
                <h3 className="font-semibold text-neutral-800">Thuộc tính (Properties)</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">

                {/* 1. NỘI DUNG (Content) */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                        <FiType /> Nội dung
                    </h4>

                    {/* Label / Text */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Label / Text</label>
                        <input
                            type="text"
                            value={selectedItem.props.label || ''}
                            onChange={(e) => handleChange('props', 'label', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none transition-all"
                            placeholder="Nhập nội dung..."
                        />
                    </div>

                    {/* Placeholder (Chỉ cho Input) */}
                    {selectedItem.type === 'input' && (
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Placeholder</label>
                            <input
                                type="text"
                                value={selectedItem.props.placeholder || ''}
                                onChange={(e) => handleChange('props', 'placeholder', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none transition-all"
                            />
                        </div>
                    )}
                </div>

                <hr className="border-neutral-100" />

                {/* 2. KÍCH THƯỚC & BỐ CỤC (Layout) */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                        <FiMaximize /> Kích thước & Layout
                    </h4>

                    {/* Width / Height */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Width</label>
                            <input
                                type="text"
                                value={selectedItem.style.width || 'auto'}
                                onChange={(e) => handleChange('style', 'width', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none"
                                placeholder="e.g. 100%, 200px"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Height</label>
                            <input
                                type="text"
                                value={selectedItem.style.height || 'auto'}
                                onChange={(e) => handleChange('style', 'height', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none"
                                placeholder="e.g. auto, 50px"
                            />
                        </div>
                    </div>

                    {/* Padding / Margin (TÙY CHỈNH) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Padding</label>
                            <input
                                type="text"
                                value={selectedItem.style.padding || '0px'}
                                onChange={(e) => handleChange('style', 'padding', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none"
                                placeholder="e.g. 10px 20px"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Margin</label>
                            <input
                                type="text"
                                value={selectedItem.style.margin || '0px'}
                                onChange={(e) => handleChange('style', 'margin', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none"
                                placeholder="e.g. 0px auto"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-neutral-100" />

                {/* 3. MÀU SẮC (Appearance) */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                        <FiMonitor /> Giao diện
                    </h4>

                    {/* Background Color */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Màu nền (Background)</label>
                        <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-lg border border-neutral-200 overflow-hidden shrink-0">
                                <input
                                    type="color"
                                    value={selectedItem.style.backgroundColor || '#ffffff'}
                                    onChange={(e) => handleChange('style', 'backgroundColor', e.target.value)}
                                    className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                />
                            </div>
                            <input
                                type="text"
                                value={selectedItem.style.backgroundColor || 'transparent'}
                                onChange={(e) => handleChange('style', 'backgroundColor', e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none uppercase"
                            />
                        </div>
                    </div>

                    {/* Text Color */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Màu chữ (Text Color)</label>
                        <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-lg border border-neutral-200 overflow-hidden shrink-0">
                                <input
                                    type="color"
                                    value={selectedItem.style.color || '#000000'}
                                    onChange={(e) => handleChange('style', 'color', e.target.value)}
                                    className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                />
                            </div>
                            <input
                                type="text"
                                value={selectedItem.style.color || 'inherit'}
                                onChange={(e) => handleChange('style', 'color', e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none uppercase"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* DELETE BUTTON */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50">
                <button
                    onClick={() => onDeleteItem(selectedItem.id)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
                >
                    <FiTrash2 /> Xóa thành phần này
                </button>
            </div>
        </div>
    );
};

export default PropertiesPanel;