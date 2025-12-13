// src/components/builder/Toolbox.jsx
import React, { useState, useMemo } from 'react';
import { TOOLS, CATEGORIES } from '../../constants/toolboxItems';
import DraggableTool from './DraggableTool';

/**
 * Toolbox - Component hiển thị danh sách tools có thể kéo vào canvas
 */
const Toolbox = () => {
    const [activeTab, setActiveTab] = useState('Layout');
    
    // Group tools by category
    const toolsByCategory = useMemo(() => {
        const grouped = {};
        TOOLS.forEach(tool => {
            const cat = tool.category || 'Other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(tool);
        });
        return grouped;
    }, []);

    // Get tools for active tab
    const currentTools = toolsByCategory[activeTab] || [];

    return (
        <div className="w-full bg-white border-t border-neutral-200 flex items-center gap-2 px-3 py-2 z-10 h-16">
            {/* Category Tabs */}
            <div className="flex border border-neutral-200 rounded-lg overflow-hidden shrink-0">
                {CATEGORIES.map((cat) => (
                    <button 
                        key={cat}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-neutral-200 first:border-l-0 ${
                            activeTab === cat 
                                ? 'bg-sage-500 text-white' 
                                : 'bg-white text-neutral-500 hover:bg-neutral-50'
                        }`} 
                        onClick={() => setActiveTab(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-neutral-200 shrink-0"></div>
            
            {/* Tools - Horizontal Scroll */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
                <div className="flex gap-2 min-w-max py-1">
                    {currentTools.length > 0 ? (
                        currentTools.map((tool) => (
                            <DraggableTool key={tool.type} tool={tool} />
                        ))
                    ) : (
                        <div className="flex items-center px-4">
                            <p className="text-xs text-neutral-400">No components in this category</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Toolbox;
