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
            {/* Removed empty-canvas placeholder to avoid persistent background box behind components */}
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

