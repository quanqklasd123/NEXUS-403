// src/components/builder/DraggableTool.jsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

/**
 * DraggableTool - Component hiển thị tool trong toolbox, có thể kéo vào canvas
 * 
 * Props:
 * - tool: object chứa thông tin tool (type, label, icon, category, description, defaultProps, defaultStyle)
 */
const DraggableTool = ({ tool }) => {
    const { 
        attributes, 
        listeners, 
        setNodeRef, 
        transform, 
        isDragging 
    } = useDraggable({
        id: `tool-${tool.type}`,
        data: {
            ...tool, // Spread tool first to get all properties
            type: 'tool', // Override type to 'tool' to identify it's from toolbox (must be last)
            toolType: tool.type // Keep the actual component type in toolType
        }
    });
    
    // Transform style khi đang drag
    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: 999, 
        opacity: 0.8, 
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
    } : undefined;

    return (
        <div 
            ref={setNodeRef} 
            {...listeners} 
            {...attributes} 
            style={style}
            className={`
                flex flex-col items-center justify-center p-2 
                bg-white border border-neutral-200 rounded-lg
                cursor-grab active:cursor-grabbing
                hover:border-sage-400 hover:bg-sage-50 
                transition-all shadow-sm hover:shadow-md
                min-w-[70px] max-w-[70px] shrink-0 h-14
                ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
            `}
            title={`${tool.label} - ${tool.description || ''}`}
        >
            <tool.icon className="w-5 h-5 text-neutral-600 mb-1" />
            <span className="text-[10px] text-neutral-600 text-center leading-tight truncate w-full font-medium">
                {tool.label}
            </span>
        </div>
    );
};

export default DraggableTool;
