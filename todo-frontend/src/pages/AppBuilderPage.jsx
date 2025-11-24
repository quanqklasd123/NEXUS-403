// src/pages/AppBuilderPage.jsx
import React, { useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { FiBox, FiLayout, FiType, FiImage, FiPlay, FiSave, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi';
import apiService from '../services/apiService'; // Import API
import { useNavigate } from 'react-router-dom';

// (Giữ nguyên TOOLS, DraggableTool, CanvasArea như cũ)
const TOOLS = [
    { type: 'container', label: 'Container', icon: FiLayout },
    { type: 'button', label: 'Button', icon: FiBox },
    { type: 'input', label: 'Input Field', icon: FiType },
    { type: 'text', label: 'Text Block', icon: FiType },
    { type: 'image', label: 'Image', icon: FiImage },
];

const DraggableTool = ({ tool }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `tool-${tool.type}`,
        data: { type: tool.type, label: tool.label }
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999, opacity: 0.8, boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
    } : undefined;

    return (
        <div ref={setNodeRef} {...listeners} {...attributes} style={style}
            className="flex flex-col items-center justify-center p-3 bg-white border border-neutral-200 rounded-lg cursor-move hover:border-sage-400 hover:bg-sage-50 transition-all shadow-sm">
            <tool.icon className="w-6 h-6 text-neutral-600 mb-1" />
            <span className="text-xs text-neutral-600">{tool.label}</span>
        </div>
    );
};

const CanvasArea = ({ items, onRemoveItem }) => {
    const { setNodeRef, isOver } = useDroppable({ id: 'canvas-area' });
    return (
        <div ref={setNodeRef} className={`w-full max-w-3xl min-h-[600px] rounded-xl transition-colors border-2 border-dashed relative ${isOver ? 'border-sage-500 bg-sage-50' : 'border-neutral-200 bg-white'}`}>
            {items.length === 0 && !isOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-neutral-400 text-sm">Kéo các thành phần từ Toolbox vào đây</p>
                </div>
            )}
            <div className="p-6 flex flex-col gap-4">
                {items.map((item) => (
                    <div key={item.id} className="relative group">
                        <div className="p-4 border border-transparent hover:border-sage-300 rounded-lg transition-all">
                            {item.type === 'button' && <button className="px-4 py-2 bg-sage-500 text-white rounded-lg shadow-sm">Button</button>}
                            {item.type === 'input' && <input type="text" placeholder="Input field..." className="w-full p-2 border rounded-lg bg-neutral-50" />}
                            {item.type === 'container' && <div className="h-24 bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400">Container Area</div>}
                            {item.type === 'text' && <p className="text-neutral-700">Đây là một đoạn văn bản mẫu.</p>}
                            {item.type === 'image' && <div className="h-32 bg-neutral-200 rounded-lg flex items-center justify-center text-neutral-500">Image Placeholder</div>}
                        </div>
                        <button onClick={() => onRemoveItem(item.id)} className="absolute top-2 right-2 p-1 bg-white shadow-md rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <FiTrash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
function AppBuilderPage() {
    const [activeTab, setActiveTab] = useState('ui');
    const [canvasItems, setCanvasItems] = useState([]);
    const navigate = useNavigate();

    // State cho Modal Publish
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [publishData, setPublishData] = useState({ name: '', description: '', category: 'Template', price: '' });

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && over.id === 'canvas-area') {
            const toolType = active.data.current?.type;
            if (toolType) {
                const newItem = { id: `item-${Date.now()}`, type: toolType };
                setCanvasItems((prev) => [...prev, newItem]);
            }
        }
    };

    const handleRemoveItem = (id) => setCanvasItems((prev) => prev.filter(item => item.id !== id));

    // Xử lý Publish
    const handlePublish = async (e) => {
        e.preventDefault();
        try {
            // Gọi API
            await apiService.publishApp({
                ...publishData,
                // appDataJson: JSON.stringify(canvasItems) // Gửi kèm cấu trúc app (nếu cần sau này)
            });
            
            alert("Đã xuất bản ứng dụng thành công!");
            setIsPublishModalOpen(false);
            
            // Chuyển hướng về Marketplace để xem thành quả
            navigate('/marketplace');
        } catch (error) {
            console.error("Lỗi publish:", error);
            alert("Không thể xuất bản ứng dụng.");
        }
    };

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="flex h-[calc(100vh-6rem)] bg-neutral-50 overflow-hidden border border-neutral-200 rounded-xl shadow-sm m-[-24px]">
                
                {/* LEFT SIDEBAR */}
                <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
                    <div className="p-4 border-b border-neutral-200"><h3 className="font-semibold text-neutral-800">Toolbox</h3></div>
                    <div className="flex border-b border-neutral-200">
                        <button className={`flex-1 py-3 text-sm font-medium ${activeTab === 'ui' ? 'text-sage-600 border-b-2 border-sage-600' : 'text-neutral-500'}`} onClick={() => setActiveTab('ui')}>UI</button>
                        <button className={`flex-1 py-3 text-sm font-medium ${activeTab === 'data' ? 'text-sage-600 border-b-2 border-sage-600' : 'text-neutral-500'}`} onClick={() => setActiveTab('data')}>Data</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'ui' && <div className="grid grid-cols-2 gap-2">{TOOLS.map((tool) => <DraggableTool key={tool.type} tool={tool} />)}</div>}
                        {activeTab === 'data' && <p className="text-center text-sm text-neutral-400 mt-4">Data models here</p>}
                    </div>
                </div>

                {/* CENTER CANVAS */}
                <div className="flex-1 bg-neutral-100 flex flex-col relative">
                    <div className="h-12 bg-white border-b border-neutral-200 flex items-center justify-between px-4">
                        <span className="text-sm font-medium text-neutral-500">Canvas Editor</span>
                        {/* Nút Publish mới */}
                        <button 
                            onClick={() => setIsPublishModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-sage-500 text-white text-xs font-medium rounded-lg hover:bg-sage-600 transition-colors"
                        >
                            <FiUploadCloud /> Publish to Marketplace
                        </button>
                    </div>
                    <div className="flex-1 p-8 overflow-auto flex justify-center">
                        <CanvasArea items={canvasItems} onRemoveItem={handleRemoveItem} />
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="w-72 bg-white border-l border-neutral-200 flex flex-col">
                    <div className="p-4 border-b border-neutral-200"><h3 className="font-semibold text-neutral-800">Properties</h3></div>
                    <div className="p-4 flex-1"><p className="text-sm text-neutral-400 italic text-center mt-10">Select an item on canvas to edit.</p></div>
                </div>
            </div>

            {/* --- MODAL PUBLISH --- */}
            {isPublishModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-neutral-200 animation-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-neutral-800">Publish to Marketplace</h3>
                            <button onClick={() => setIsPublishModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-full"><FiX /></button>
                        </div>
                        
                        <form onSubmit={handlePublish} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">App Name</label>
                                <input 
                                    type="text" required 
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none"
                                    value={publishData.name}
                                    onChange={e => setPublishData({...publishData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                                <textarea 
                                    required rows="3"
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none"
                                    value={publishData.description}
                                    onChange={e => setPublishData({...publishData, description: e.target.value})}
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                                    <select 
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none"
                                        value={publishData.category}
                                        onChange={e => setPublishData({...publishData, category: e.target.value})}
                                    >
                                        <option>Template</option>
                                        <option>Module</option>
                                        <option>Component</option>
                                        <option>Automation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Price (Optional)</label>
                                    <input 
                                        type="text" placeholder="Free"
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none"
                                        value={publishData.price}
                                        onChange={e => setPublishData({...publishData, price: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsPublishModalOpen(false)} className="flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-sage-500 text-white font-medium rounded-xl hover:bg-sage-600 shadow-lg shadow-sage-500/20">Publish App</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DndContext>
    );
}

export default AppBuilderPage;