// src/components/builder/DraggableTool.jsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';

const DraggableTool = ({ tool }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `tool-${tool.type}`,
        data: { type: tool.type, ...tool }
    });
    
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
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
            className="flex flex-col items-center justify-center p-1.5 bg-white border border-neutral-200 rounded cursor-move hover:border-sage-400 hover:bg-sage-50 transition-all shadow-sm min-w-[60px] max-w-[60px] flex-shrink-0 h-12"
            title={tool.label}
        >
            <tool.icon className="w-4 h-4 text-neutral-600 mb-0.5" />
            <span className="text-[10px] text-neutral-600 text-center leading-tight truncate w-full">{tool.label}</span>
        </div>
    );
};

export default DraggableTool;

