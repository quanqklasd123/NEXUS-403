// src/components/builder/CanvasArea.jsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import RenderComponent from './RenderComponent';
import DraggableResizable from './DraggableResizable';
import { GRID_SIZE } from './gridConstants';

const CanvasArea = ({ 
    items, 
    selectedId, 
    onSelectItem, 
    isPreview = false, 
    navigate = null, 
    searchQuery = '', 
    filterTag = 'all', 
    context = {},
    onPositionChange,
    onSizeChange
}) => {
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
            id="canvas-area"
            ref={setNodeRef} 
            className={`w-full h-full bg-neutral-50 transition-colors overflow-auto ${!isPreview && isOver ? 'ring-4 ring-sage-100' : ''}`} 
            onClick={handleCanvasClick}
            style={{
                backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                backgroundPosition: '0 0',
                position: 'relative'
            }}
        >
            {rootItems.length === 0 && !isOver && !isPreview && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-neutral-300">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-neutral-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <p className="text-neutral-600 font-medium mb-1">Canvas trống</p>
                        <p className="text-sm text-neutral-400">Kéo component từ thanh Toolbox vào đây để bắt đầu</p>
                    </div>
                </div>
            )}
            {/* Absolute positioned components with snap to grid */}
            <div 
                className="w-full min-h-full p-4 relative" 
                style={{ minHeight: '100vh', position: 'relative' }}
                onDragOver={(e) => {
                    // Allow drop from toolbox
                    e.preventDefault();
                }}
            > 
                {rootItems.map((item) => (
                    <DraggableResizable
                        key={item.id}
                        item={item}
                        items={items}
                        isSelected={item.id === selectedId}
                        onClick={onSelectItem}
                        isPreview={isPreview}
                        navigate={navigate}
                        context={context}
                        onPositionChange={onPositionChange}
                        onSizeChange={onSizeChange}
                    />
                ))}
            </div>
        </div>
    );
};

export default CanvasArea;

