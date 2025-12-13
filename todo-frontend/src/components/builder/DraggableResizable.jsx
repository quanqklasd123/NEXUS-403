// src/components/builder/DraggableResizable.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { FiMove } from 'react-icons/fi';
import RenderComponent from './RenderComponent';
import { GRID_SIZE, snapToGrid } from './gridConstants';

// Helper function to get initial position and size from item
const getInitialBounds = (item) => {
    const style = item.style || {};
    // Chỉ dùng position cho root components (không có parentId)
    // Layout children không có position (dùng flow layout)
    const position = item.parentId ? null : (item.position || { x: 20, y: 20 });
    
    // Control component sizes (components that should be small and fit content)
    const controlSizes = {
        'button': { width: 120, height: 40 },
        'checkbox': { width: 150, height: 30 },
        'switch': { width: 100, height: 30 },
        'addTaskButton': { width: 140, height: 40 },
        'viewSwitcher': { width: 200, height: 40 },
        'filterBar': { width: 250, height: 40 },
        'sortDropdown': { width: 150, height: 40 },
        'searchBox': { width: 250, height: 40 },
        'databaseTitle': { width: 300, height: 50 },
        'input': { width: 250, height: 40 },
        'select': { width: 250, height: 40 },
        'datePicker': { width: 250, height: 40 },
    };
    
    // Parse width and height (could be string like "400px" or number)
    let width = 400;
    let height = 200;
    
    // Check if it's a control component
    if (controlSizes[item.type]) {
        width = controlSizes[item.type].width;
        height = controlSizes[item.type].height;
    } else if (style.width) {
        if (typeof style.width === 'string') {
            if (style.width.includes('px')) {
                width = parseInt(style.width) || 400;
            } else if (style.width === 'auto') {
                width = 150; // Default for auto width
            } else if (style.width === '100%') {
                width = 400; // Default for 100% width
            } else {
                width = parseInt(style.width) || 400;
            }
        } else {
            width = style.width;
        }
    }
    
    if (style.height) {
        if (typeof style.height === 'string') {
            if (style.height.includes('px')) {
                height = parseInt(style.height) || 200;
            } else if (style.height === 'auto') {
                height = 40; // Default for auto height
            } else {
                height = parseInt(style.height) || 200;
            }
        } else {
            height = style.height;
        }
    }
    
    return {
        x: position ? (position.x || 20) : 0, // 0 nếu là layout child
        y: position ? (position.y || 20) : 0, // 0 nếu là layout child
        width: width,
        height: height
    };
};

const DraggableResizable = ({ 
    item, 
    items, 
    isSelected, 
    onClick, 
    isPreview, 
    navigate, 
    context,
    onPositionChange,
    onSizeChange
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [actualSize, setActualSize] = useState(null);
    const contentRef = useRef(null);
    
    const bounds = getInitialBounds(item);
    
    // Check if it's a control component that should fit content
    const controlComponents = ['viewSwitcher', 'filterBar', 'searchBox', 'sortDropdown', 'addTaskButton', 'databaseTitle', 'button', 'checkbox', 'switch', 'input', 'select', 'datePicker'];
    const isControlComponent = controlComponents.includes(item.type);
    
    // Check if it's a layout component (container, row, grid)
    const isLayoutComponent = item.type === 'container' || item.type === 'row' || item.type === 'grid';
    
    // Check if layout has children - if it does, disable dragging for the layout itself
    // Only allow dragging empty layouts
    const layoutHasChildren = isLayoutComponent && items.some(child => child.parentId === item.id);
    const shouldDisableLayoutDrag = isLayoutComponent && layoutHasChildren;
    
    // Measure actual content size for control components
    useEffect(() => {
        if (isControlComponent && contentRef.current && !isPreview) {
            const measureSize = () => {
                if (contentRef.current) {
                    const rect = contentRef.current.getBoundingClientRect();
                    setActualSize({
                        width: snapToGrid(rect.width),
                        height: snapToGrid(rect.height)
                    });
                }
            };
            
            // Measure after render
            const timeoutId = setTimeout(measureSize, 0);
            
            // Re-measure on window resize
            window.addEventListener('resize', measureSize);
            return () => {
                clearTimeout(timeoutId);
                window.removeEventListener('resize', measureSize);
            };
        }
    }, [isControlComponent, isPreview, item]);
    
    const handleDragStart = () => {
        setIsDragging(true);
    };
    
    const handleDragStop = (e, d) => {
        setIsDragging(false);
        const snappedX = snapToGrid(d.x);
        const snappedY = snapToGrid(d.y);
        
        // Chỉ update position cho root components (không có parentId)
        // Components trong layout không nên có position (dùng flow layout)
        if (onPositionChange && !item.parentId) {
            onPositionChange(item.id, snappedX, snappedY);
        }
    };
    
    const handleResizeStart = () => {
        setIsResizing(true);
    };
    
    const handleResizeStop = (e, direction, ref, delta, position) => {
        setIsResizing(false);
        const snappedWidth = snapToGrid(ref.offsetWidth);
        const snappedHeight = snapToGrid(ref.offsetHeight);
        const snappedX = snapToGrid(position.x);
        const snappedY = snapToGrid(position.y);
        
        // Chỉ update position cho root components (không có parentId)
        // Components trong layout không nên có position (dùng flow layout)
        if (onSizeChange) {
            if (item.parentId) {
                // Component trong layout: chỉ update size, không update position
                onSizeChange(item.id, snappedWidth, snappedHeight, null, null);
            } else {
                // Root component: update cả size và position
                onSizeChange(item.id, snappedWidth, snappedHeight, snappedX, snappedY);
            }
        }
    };
    
    // Disable drag/resize in preview mode
    if (isPreview) {
        return (
            <div
                style={{
                    position: 'absolute',
                    left: `${bounds.x}px`,
                    top: `${bounds.y}px`,
                    width: isControlComponent ? 'fit-content' : `${bounds.width}px`,
                    height: isControlComponent ? 'fit-content' : `${bounds.height}px`,
                    zIndex: isSelected ? 100 : 1
                }}
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
    }
    
    // Use actual measured size for control components if available
    const rndSize = isControlComponent && actualSize 
        ? { width: actualSize.width, height: actualSize.height }
        : { width: bounds.width, height: bounds.height };
    
    // If layout has children, use Rnd but disable dragging completely
    // Still allow resizing
    
    // Nếu component có parentId (trong layout), không dùng Rnd - render trực tiếp
    // Layout children không nên có absolute positioning
    if (item.parentId) {
        return (
            <div
                style={{
                    width: `${bounds.width}px`,
                    height: `${bounds.height}px`,
                    position: 'relative', // Relative, không absolute
                    zIndex: isSelected ? 100 : 1
                }}
                className={`
                    ${isSelected ? 'ring-2 ring-sage-500 ring-offset-2' : ''}
                    transition-shadow duration-200
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(item.id);
                }}
            >
                {/* Selection indicator */}
                {isSelected && (
                    <div className="absolute -top-6 left-0 flex items-center gap-2 px-2 py-1 bg-sage-500 text-white text-xs rounded shadow-lg z-50">
                        <FiMove className="w-3 h-3" />
                        <span>{item.name || item.type}</span>
                    </div>
                )}
                
                {/* Component content */}
                <div className="w-full h-full relative">
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
            </div>
        );
    }
    
    // Root components: dùng Rnd với absolute positioning
    return (
        <Rnd
            size={rndSize}
            position={{ x: bounds.x, y: bounds.y }}
            onDragStart={handleDragStart}
            onDragStop={handleDragStop}
            onResizeStart={handleResizeStart}
            onResizeStop={handleResizeStop}
            dragGrid={[GRID_SIZE, GRID_SIZE]}
            resizeGrid={[GRID_SIZE, GRID_SIZE]}
            bounds="parent"
            enableResizing={!isPreview}
            disableDragging={isPreview}
            dragHandleClassName="drag-handle"
            minWidth={isControlComponent ? 50 : undefined}
            minHeight={isControlComponent ? 30 : undefined}
            style={{
                zIndex: isDragging || isResizing ? 1000 : (isSelected ? 100 : 1),
                opacity: isDragging || isResizing ? 0.8 : 1,
                ...(isControlComponent ? {
                    display: 'inline-block'
                } : {})
            }}
            className={`
                ${isSelected ? 'ring-2 ring-sage-500 ring-offset-2' : ''}
                ${isDragging || isResizing ? 'shadow-2xl' : 'shadow-sm'}
                transition-shadow duration-200
                ${isControlComponent ? 'control-component-rnd' : ''}
            `}
            onClick={(e) => {
                e.stopPropagation();
                if (!isDragging && !isResizing) {
                    onClick(item.id);
                }
            }}
            resizeHandleStyles={{
                top: { cursor: 'n-resize', height: '10px' },
                right: { cursor: 'e-resize', width: '10px' },
                bottom: { cursor: 's-resize', height: '10px' },
                left: { cursor: 'w-resize', width: '10px' },
                topRight: { cursor: 'ne-resize', width: '12px', height: '12px' },
                bottomRight: { cursor: 'se-resize', width: '12px', height: '12px' },
                bottomLeft: { cursor: 'sw-resize', width: '12px', height: '12px' },
                topLeft: { cursor: 'nw-resize', width: '12px', height: '12px' }
            }}
            resizeHandleClasses={{
                top: 'hover:bg-sage-400/20',
                right: 'hover:bg-sage-400/20',
                bottom: 'hover:bg-sage-400/20',
                left: 'hover:bg-sage-400/20',
                topRight: 'hover:bg-sage-400/20',
                bottomRight: 'hover:bg-sage-400/20',
                bottomLeft: 'hover:bg-sage-400/20',
                topLeft: 'hover:bg-sage-400/20'
            }}
        >
            {/* Selection indicator */}
            {isSelected && (
                <div className="absolute -top-6 left-0 flex items-center gap-2 px-2 py-1 bg-sage-500 text-white text-xs rounded shadow-lg z-50">
                    <FiMove className="w-3 h-3" />
                    <span>{item.name || item.type}</span>
                    <span className="text-sage-200">
                        {Math.round(bounds.width)} × {Math.round(bounds.height)}
                    </span>
                </div>
            )}
            
            {/* Drag handle - only this area allows dragging (hide if layout has children) */}
            {!isPreview && !shouldDisableLayoutDrag && (
                <div className="drag-handle absolute top-0 left-0 right-0 h-6 bg-sage-500/10 hover:bg-sage-500/20 cursor-move flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10">
                    <FiMove className="w-3 h-3 text-sage-600" />
                </div>
            )}
            
            {/* Component content - control components use inline-block wrapper */}
            {isControlComponent ? (
                <div 
                    ref={contentRef}
                    className="relative" 
                    style={{ display: 'inline-block', width: 'fit-content', height: 'fit-content' }}
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
            ) : (
                <div 
                    className="w-full h-full relative"
                    style={{
                        // Re-enable pointer events for children when layout has children
                        // This allows children to receive mouse events while preventing Rnd from dragging
                        pointerEvents: shouldDisableLayoutDrag ? 'auto' : 'auto'
                    }}
                    onMouseDown={(e) => {
                        // Prevent dragging parent layout when clicking/dragging children
                        if (shouldDisableLayoutDrag) {
                            e.stopPropagation();
                            // Don't prevent default to allow @dnd-kit to work
                        }
                    }}
                    onClick={(e) => {
                        // Prevent selecting parent layout when clicking children
                        if (shouldDisableLayoutDrag && e.target !== e.currentTarget) {
                            e.stopPropagation();
                        }
                    }}
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
            )}
        </Rnd>
    );
};

export default DraggableResizable;

