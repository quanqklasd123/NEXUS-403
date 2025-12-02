// src/components/builder/CanvasArea.jsx
import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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
            id="canvas-area"
            ref={setNodeRef} 
            className={`w-full h-full bg-neutral-50 transition-colors relative overflow-auto ${!isPreview && isOver ? 'ring-4 ring-sage-100' : ''}`} 
            onClick={handleCanvasClick}
            style={{
                backgroundImage: !isPreview ? `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                ` : 'none',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0'
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
            <div className="w-full h-full relative min-h-full min-w-full"> 
                {rootItems.map((item) => (
                    <DraggableComponent
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

// Draggable Component Wrapper
const DraggableComponent = ({ item, items, isSelected, onClick, isPreview, navigate, context }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
        disabled: isPreview,
        data: {
            type: 'component',
            item: item
        }
    });

    const itemStyle = item.style || {};
    const baseStyle = {
        position: 'absolute',
        left: `${item.position?.x || 0}px`,
        top: `${item.position?.y || 0}px`,
        width: itemStyle.width || '200px',
        height: itemStyle.height || 'auto',
        minWidth: itemStyle.minWidth || '100px',
        minHeight: itemStyle.minHeight || '50px',
        padding: itemStyle.padding || '0px',
        margin: itemStyle.margin || '0px',
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 1000 : (isSelected ? 100 : 1),
    };

    // Merge với các style khác từ item.style, nhưng giữ baseStyle cho position và transform
    const mergedStyle = {
        ...itemStyle,
        ...baseStyle,
        // Đảm bảo position và transform luôn được áp dụng
        position: baseStyle.position,
        left: baseStyle.left,
        top: baseStyle.top,
        transform: baseStyle.transform,
        zIndex: baseStyle.zIndex,
    };

    return (
        <div
            ref={setNodeRef}
            style={mergedStyle}
            {...(isPreview ? {} : { ...attributes, ...listeners })}
            onClick={(e) => {
                e.stopPropagation();
                // Chỉ select nếu không đang drag
                if (!isPreview && !isDragging) {
                    onClick(item.id);
                }
            }}
            className={`${isSelected ? 'ring-2 ring-sage-400' : ''} ${isDragging ? 'opacity-50' : ''} ${!isPreview ? 'cursor-move' : ''}`}
        >
            <RenderComponent 
                item={item} 
                items={items}
                isSelected={isSelected} 
                onClick={onClick} 
                isPreview={isPreview} 
                navigate={navigate}
                context={context}
            />
        </div>
    );
};

export default CanvasArea;

