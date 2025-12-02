// src/components/builder/Toolbox.jsx
import React, { useState } from 'react';
import { TOOLS } from '../../constants/toolboxItems';
import DraggableTool from './DraggableTool';

const Toolbox = ({ canvasItems, searchQuery, setSearchQuery, filterTag, setFilterTag }) => {
    const [activeTab, setActiveTab] = useState('ui');
    
    // Filter tools - không còn search nữa
    const filteredTools = TOOLS;

    return (
        <div className="w-full bg-white border-t border-neutral-200 flex items-center gap-2 px-3 py-2 z-10 h-16">
            {/* Tabs */}
            <div className="flex border border-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                <button 
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                        activeTab === 'ui' 
                            ? 'bg-sage-500 text-white' 
                            : 'bg-white text-neutral-500 hover:bg-neutral-50'
                    }`} 
                    onClick={() => setActiveTab('ui')}
                >
                    UI
                </button>
                <button 
                    className={`px-3 py-1 text-xs font-medium transition-colors border-l border-neutral-200 ${
                        activeTab === 'data' 
                            ? 'bg-sage-500 text-white' 
                            : 'bg-white text-neutral-500 hover:bg-neutral-50'
                    }`} 
                    onClick={() => setActiveTab('data')}
                >
                    Data
                </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-neutral-200 flex-shrink-0"></div>
            
            {/* Tools - Horizontal Scroll */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-1.5 min-w-max">
                    {activeTab === 'ui' && filteredTools.map((tool) => (
                        <DraggableTool key={tool.type} tool={tool} />
                    ))}
                    {activeTab === 'data' && (
                        <div className="flex items-center px-4">
                            <p className="text-xs text-neutral-400">Data models here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Toolbox;

