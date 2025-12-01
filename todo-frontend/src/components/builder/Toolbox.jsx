// src/components/builder/Toolbox.jsx
import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { TOOLS } from '../../constants/toolboxItems';
import DraggableTool from './DraggableTool';

const Toolbox = ({ canvasItems, searchQuery, setSearchQuery, filterTag, setFilterTag }) => {
    const [activeTab, setActiveTab] = useState('ui');
    
    // Filter tools by search query
    const filteredTools = TOOLS.filter(tool => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return tool.label.toLowerCase().includes(query) || tool.type.toLowerCase().includes(query);
    });

    return (
        <div className="w-64 bg-white border-r border-neutral-200 flex flex-col z-10">
            <div className="p-4 border-b border-neutral-200">
                <h3 className="font-semibold text-neutral-800">Toolbox</h3>
            </div>
            
            {/* Search & Filter */}
            <div className="p-4 border-b border-neutral-200 space-y-2">
                <div className="relative">
                    <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search items..."
                        className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                    />
                </div>
                {canvasItems.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        <button
                            onClick={() => setFilterTag('all')}
                            className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                filterTag === 'all' 
                                    ? 'bg-sage-500 text-white' 
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                        >
                            All
                        </button>
                        {Array.from(new Set(canvasItems.flatMap(item => item.metadata?.tags || []))).map(tag => (
                            <button
                                key={tag}
                                onClick={() => setFilterTag(tag)}
                                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                    filterTag === tag 
                                        ? 'bg-sage-500 text-white' 
                                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="flex border-b border-neutral-200">
                <button 
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'ui' ? 'text-sage-600 border-b-2 border-sage-600' : 'text-neutral-500'}`} 
                    onClick={() => setActiveTab('ui')}
                >
                    UI
                </button>
                <button 
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'data' ? 'text-sage-600 border-b-2 border-sage-600' : 'text-neutral-500'}`} 
                    onClick={() => setActiveTab('data')}
                >
                    Data
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'ui' && (
                    <div className="grid grid-cols-2 gap-2">
                        {filteredTools.map((tool) => (
                            <DraggableTool key={tool.type} tool={tool} />
                        ))}
                    </div>
                )}
                {activeTab === 'data' && (
                    <p className="text-center text-sm text-neutral-400 mt-4">Data models here</p>
                )}
            </div>
        </div>
    );
};

export default Toolbox;

