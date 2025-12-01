// src/components/builder/CanvasToolbar.jsx
import React from 'react';
import { 
    FiX, FiSave, FiUploadCloud, FiEye, 
    FiCornerUpLeft, FiCornerUpRight 
} from 'react-icons/fi';

const CanvasToolbar = ({ 
    projectInfo, 
    isPreviewMode, 
    onEnterPreview, 
    onExitPreview, 
    onSave, 
    saving, 
    onPublish, 
    onUndo, 
    onRedo, 
    canUndo, 
    canRedo 
}) => {
    if (isPreviewMode) {
        return (
            <div className="h-12 bg-white border-b border-neutral-200 flex items-center justify-end px-4 shadow-sm z-10">
                <button 
                    onClick={onExitPreview}
                    className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 text-white text-xs font-medium rounded-lg hover:bg-black transition-colors"
                >
                    <FiX /> Exit Preview
                </button>
            </div>
        );
    }

    return (
        <div className="h-12 bg-white border-b border-neutral-200 flex items-center justify-between px-4 shadow-sm z-10">
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-700">{projectInfo?.name}</span>
                <span className={`text-xs text-white px-2 py-0.5 rounded ${projectInfo?.isPublished ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {projectInfo?.isPublished ? 'PUBLISHED' : 'DRAFT'}
                </span>
            </div>
            <div className="flex items-center gap-2">
                {/* Undo/Redo Buttons */}
                <div className="flex items-center gap-1 border-r border-neutral-200 pr-2 mr-2">
                    <button 
                        onClick={onUndo} 
                        disabled={!canUndo}
                        className="flex items-center justify-center w-8 h-8 border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Undo (Ctrl+Z)"
                    >
                        <FiCornerUpLeft className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onRedo} 
                        disabled={!canRedo}
                        className="flex items-center justify-center w-8 h-8 border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Redo (Ctrl+Y)"
                    >
                        <FiCornerUpRight className="w-4 h-4" />
                    </button>
                </div>
                
                <button 
                    onClick={onEnterPreview} 
                    className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                >
                    <FiEye /> Preview
                </button>
                <button 
                    onClick={onSave} 
                    disabled={saving} 
                    className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                >
                    <FiSave /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                    onClick={onPublish} 
                    className="flex items-center gap-2 px-3 py-1.5 bg-sage-500 text-white text-xs font-medium rounded-lg hover:bg-sage-600"
                >
                    <FiUploadCloud /> Publish
                </button>
            </div>
        </div>
    );
};

export default CanvasToolbar;

