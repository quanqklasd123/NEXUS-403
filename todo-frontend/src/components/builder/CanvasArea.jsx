// src/components/builder/CanvasArea.jsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import RenderComponent from './RenderComponent';

const CanvasArea = ({ items, selectedId, onSelectItem, isPreview = false, navigate = null, searchQuery = '', filterTag = 'all', context = {} }) => {
    const { setNodeRef, isOver } = useDroppable({ id: 'canvas-area' });
    const handleCanvasClick = isPreview ? undefined : () => onSelectItem(null);
    
    // Filter items by search query and tag
    const filteredItems = items.filter(item => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = (item.name || '').toLowerCase().includes(query);
            const matchesType = (item.type || '').toLowerCase().includes(query);
            const matchesTags = (item.metadata?.tags || []).some(tag => tag.toLowerCase().includes(query));
            if (!matchesName && !matchesType && !matchesTags) return false;
        }
        
        // Tag filter
        if (filterTag !== 'all') {
            const tags = item.metadata?.tags || [];
            if (!tags.includes(filterTag)) return false;
        }
        
        return true;
    });
    
    // Chỉ render root items (items không có parentId)
    const rootItems = filteredItems.filter(item => !item.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return (
        <div 
            ref={setNodeRef} 
            className={`w-full max-w-4xl min-h-[700px] bg-white rounded-xl shadow-sm transition-colors relative overflow-hidden ${!isPreview && isOver ? 'ring-4 ring-sage-100' : ''}`} 
            onClick={handleCanvasClick}
        >
            {rootItems.length === 0 && !isOver && !isPreview && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-neutral-400 mb-2">Canvas trống</p>
                        <p className="text-xs text-neutral-300">Kéo component vào đây</p>
                    </div>
                </div>
            )}
            <div className="p-8 flex flex-col gap-4 items-start"> 
                {rootItems.map((item) => (
                    <RenderComponent 
                        key={item.id} 
                        item={item} 
                        items={items}
                        isSelected={item.id === selectedId} 
                        onClick={onSelectItem} 
                        isPreview={isPreview} 
                        navigate={navigate}
                        context={context}
                    />
                ))}
            </div>
        </div>
    );
};

export default CanvasArea;

