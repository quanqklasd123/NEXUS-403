// src/pages/AppBuilderPage.jsx
import React, { useState } from 'react';
import { FiBox, FiLayout, FiDatabase, FiCpu, FiPlay, FiSave, FiSettings, FiPlus } from 'react-icons/fi';

// --- MOCK COMPONENTS ---
const UI_COMPONENTS = [
    { icon: FiLayout, label: "Container" },
    { icon: FiBox, label: "Button" },
    { icon: FiLayout, label: "Input Field" },
    { icon: FiLayout, label: "Table" },
    { icon: FiLayout, label: "Card" },
    { icon: FiLayout, label: "Image" },
];

function AppBuilderPage() {
    const [activeTab, setActiveTab] = useState('ui'); // ui, data, logic

    return (
        // Container chiếm toàn bộ chiều cao còn lại (trừ header chính)
        <div className="flex h-[calc(100vh-6rem)] bg-neutral-50 overflow-hidden border border-neutral-200 rounded-xl shadow-sm m-[-24px]">
            
            {/* --- 1. LEFT SIDEBAR (Tools) --- */}
            <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
                <div className="p-4 border-b border-neutral-200">
                    <h3 className="font-semibold text-neutral-800">Toolbox</h3>
                </div>
                
                {/* Tabs */}
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
                    <button 
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'logic' ? 'text-sage-600 border-b-2 border-sage-600' : 'text-neutral-500'}`}
                        onClick={() => setActiveTab('logic')}
                    >
                        Logic
                    </button>
                </div>

                {/* Tool Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'ui' && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-neutral-400 uppercase mb-3">Basic Elements</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {UI_COMPONENTS.map((comp, i) => (
                                        <div key={i} className="flex flex-col items-center justify-center p-3 bg-neutral-50 border border-neutral-200 rounded-lg cursor-move hover:border-sage-400 hover:bg-sage-50 transition-colors">
                                            <comp.icon className="w-6 h-6 text-neutral-600 mb-1" />
                                            <span className="text-xs text-neutral-600">{comp.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'data' && (
                        <div className="text-center text-neutral-500 mt-10">
                            <FiDatabase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Data Models will appear here</p>
                            <button className="mt-4 px-3 py-1.5 bg-sage-100 text-sage-700 text-xs font-medium rounded-lg">
                                + New Table
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- 2. CENTER CANVAS (Preview) --- */}
            <div className="flex-1 bg-neutral-100 flex flex-col relative">
                {/* Canvas Header */}
                <div className="h-12 bg-white border-b border-neutral-200 flex items-center justify-between px-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-neutral-500">Page:</span>
                        <select className="text-sm border-none bg-transparent font-semibold text-neutral-800 focus:ring-0">
                            <option>Home Page</option>
                            <option>Details Page</option>
                            <option>Settings</option>
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded"><FiLayout /></button>
                        <button className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded"><FiCpu /></button>
                    </div>
                </div>

                {/* The Canvas Itself */}
                <div className="flex-1 p-8 overflow-auto flex justify-center">
                    <div className="w-full max-w-3xl bg-white min-h-[600px] shadow-sm border border-neutral-200 rounded-lg relative">
                        {/* Placeholder Content */}
                        <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-neutral-200 m-4 rounded-lg">
                            <div className="text-center">
                                <p className="text-neutral-400 text-sm">Drag components here to build your app</p>
                            </div>
                        </div>
                        
                        {/* Fake header for preview */}
                        <div className="border-b border-neutral-100 p-6">
                            <div className="h-8 w-1/3 bg-neutral-100 rounded mb-4"></div>
                            <div className="h-4 w-1/2 bg-neutral-50 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 3. RIGHT SIDEBAR (Properties) --- */}
            <div className="w-72 bg-white border-l border-neutral-200 flex flex-col">
                <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-800">Properties</h3>
                    <button className="text-sage-600 text-xs font-medium hover:underline">Reset</button>
                </div>
                <div className="p-4 space-y-6">
                    <div className="text-sm text-neutral-500 italic text-center mt-10">
                        Select a component on the canvas to edit its properties.
                    </div>
                    
                    {/* Fake Properties Form */}
                    <div className="opacity-50 pointer-events-none">
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-neutral-700 block mb-1">Component ID</label>
                                <input type="text" value="container_1" className="w-full text-xs p-2 border rounded bg-neutral-50" readOnly />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-neutral-700 block mb-1">Width</label>
                                <div className="flex gap-2">
                                    <input type="text" value="100%" className="w-full text-xs p-2 border rounded" />
                                    <select className="text-xs border rounded"><option>px</option><option>%</option></select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-neutral-700 block mb-1">Background</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded border bg-white"></div>
                                    <input type="text" value="#FFFFFF" className="flex-1 text-xs p-2 border rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Bottom Actions */}
                <div className="mt-auto p-4 border-t border-neutral-200 bg-neutral-50">
                    <button className="w-full py-2 bg-sage-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-sage-600">
                        <FiPlay className="w-4 h-4" /> Preview App
                    </button>
                    <button className="w-full mt-2 py-2 border border-neutral-300 text-neutral-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-white">
                        <FiSave className="w-4 h-4" /> Save Draft
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AppBuilderPage;