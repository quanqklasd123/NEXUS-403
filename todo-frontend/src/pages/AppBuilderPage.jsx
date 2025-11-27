// src/pages/AppBuilderPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { 
    FiBox, FiLayout, FiType, FiImage, FiUploadCloud, FiX, FiTrash2, FiSave,
    FiGrid, FiCreditCard, FiPieChart, FiMinus, FiCheckSquare, FiList,
    FiCalendar, FiFileText, FiUpload, FiToggleRight, FiTable, FiList as FiListView,
    FiBarChart2, FiLayers, FiMaximize2, FiEye, FiCornerUpLeft, FiCornerUpRight
} from 'react-icons/fi';
import apiService from '../services/apiService';
import { useNavigate, useParams } from 'react-router-dom';
import PropertiesPanel from '../components/builder/PropertiesPanel';
import useDebounce from '../hooks/useDebounce';

// 1. TOOLS
const TOOLS = [
    // === LAYOUT & STRUCTURE ===
    { type: 'container', label: 'Container', icon: FiLayout, defaultProps: { label: 'Container' }, defaultStyle: { width: '100%', height: '150px', backgroundColor: '#f8fafc', padding: '20px', margin: '0px', border: '1px dashed #cbd5e1' } },
    { type: 'row', label: 'Row (Flex)', icon: FiGrid, defaultProps: { label: 'Row' }, defaultStyle: { width: '100%', height: 'auto', display: 'flex', gap: '10px', padding: '10px', border: '1px dashed #94a3b8' } },
    { type: 'grid', label: 'Grid (Columns)', icon: FiGrid, defaultProps: { label: 'Grid', columns: '3' }, defaultStyle: { width: '100%', height: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '10px', border: '1px dashed #94a3b8' } },
    { type: 'divider', label: 'Divider', icon: FiMinus, defaultProps: { label: '' }, defaultStyle: { width: '100%', height: '1px', backgroundColor: '#e2e8f0', margin: '10px 0' } },
    { type: 'tabs', label: 'Tabs', icon: FiLayers, defaultProps: { label: 'Tabs', tabs: ['Tab 1', 'Tab 2', 'Tab 3'] }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' } },
    { type: 'modal', label: 'Modal / Popup', icon: FiMaximize2, defaultProps: { label: 'Modal', title: 'Modal Title' }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } },
    
    // === DISPLAY ===
    { type: 'card', label: 'Card', icon: FiCreditCard, defaultProps: { label: 'Card Content' }, defaultStyle: { width: '300px', height: '200px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '20px', border: '1px solid #e2e8f0'} },
    { type: 'chart', label: 'Chart (Mock)', icon: FiPieChart, defaultProps: { label: 'Sales Chart' }, defaultStyle: { width: '100%', height: '200px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534'} },
    { type: 'image', label: 'Image', icon: FiImage, defaultProps: { label: 'Image' }, defaultStyle: { width: '100%', height: '200px', backgroundColor: '#e2e8f0', margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    { type: 'text', label: 'Text Block', icon: FiType, defaultProps: { label: 'Lorem ipsum dolor sit amet.' }, defaultStyle: { width: '100%', height: 'auto', color: '#333333', padding: '5px', margin: '5px 0', fontSize: '16px' } },
    { type: 'statCard', label: 'Statistic Card', icon: FiBarChart2, defaultProps: { label: 'Statistic', value: '0', title: 'Total' }, defaultStyle: { width: '200px', height: 'auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' } },
    { type: 'dataTable', label: 'Data Table', icon: FiTable, defaultProps: { label: 'Data Table', columns: ['Column 1', 'Column 2', 'Column 3'] }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' } },
    { type: 'listView', label: 'List View', icon: FiListView, defaultProps: { label: 'List View', items: ['Item 1', 'Item 2', 'Item 3'] }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' } },
    
    // === FORM & INPUT ===
    { type: 'button', label: 'Button', icon: FiBox, defaultProps: { label: 'Click Me' }, defaultStyle: { width: 'auto', height: 'auto', backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', margin: '5px', borderRadius: '8px', border: 'none', cursor: 'pointer' } },
    { type: 'input', label: 'Input Field', icon: FiType, defaultProps: { label: 'Input', placeholder: 'Enter text...' }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    { type: 'checkbox', label: 'Checkbox', icon: FiCheckSquare, defaultProps: { label: 'Check me' }, defaultStyle: { width: 'auto', height: 'auto', margin: '5px', display: 'flex', alignItems: 'center', gap: '8px', color: '#333333' } },
    { type: 'select', label: 'Select / Dropdown', icon: FiList, defaultProps: { label: 'Select Option' }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    { type: 'datePicker', label: 'Date Picker', icon: FiCalendar, defaultProps: { label: 'Select Date', placeholder: 'Pick a date' }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    { type: 'richText', label: 'Rich Text Editor', icon: FiFileText, defaultProps: { label: 'Rich Text', placeholder: 'Enter formatted text...' }, defaultStyle: { width: '100%', height: '150px', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '150px' } },
    { type: 'fileUpload', label: 'File Upload', icon: FiUpload, defaultProps: { label: 'Upload File', placeholder: 'Choose file...' }, defaultStyle: { width: '100%', height: 'auto', padding: '20px', margin: '5px 0', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } },
    { type: 'switch', label: 'Switch / Toggle', icon: FiToggleRight, defaultProps: { label: 'Toggle', checked: false }, defaultStyle: { width: 'auto', height: 'auto', margin: '5px', display: 'flex', alignItems: 'center', gap: '8px', color: '#333333' } },
];

// 2. DRAGGABLE TOOL
const DraggableTool = ({ tool }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `tool-${tool.type}`,
        data: { type: tool.type, ...tool }
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999, opacity: 0.8, boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
    } : undefined;

    return (
        <div ref={setNodeRef} {...listeners} {...attributes} style={style}
            className="flex flex-col items-center justify-center p-3 bg-white border border-neutral-200 rounded-lg cursor-move hover:border-sage-400 hover:bg-sage-50 transition-all shadow-sm">
            <tool.icon className="w-6 h-6 text-neutral-600 mb-1" />
            <span className="text-xs text-neutral-600 text-center">{tool.label}</span>
        </div>
    );
};

// 3. RENDER COMPONENT
const RenderComponent = ({ item, isSelected, onClick, isPreview = false }) => {
    const contentStyle = { ...item.style, width: '100%', height: '100%', margin: 0, position: undefined, border: undefined };

    const content = () => {
        switch (item.type) {
            // === LAYOUT ===
            case 'container': return <div style={contentStyle} className="flex items-center justify-center text-neutral-400 text-sm">{item.props.label} (Drop items here)</div>;
            case 'row': return <div style={contentStyle} className="flex items-center justify-center text-neutral-400 text-sm">Row (Flex)</div>;
            case 'grid': return <div style={contentStyle} className="flex items-center justify-center text-neutral-400 text-sm">Grid ({item.props.columns || '3'} columns)</div>;
            case 'divider': return <div style={contentStyle}></div>;
            case 'tabs': return (
                <div style={contentStyle} className={!isPreview ? 'pointer-events-none' : ''}>
                    <div className="flex border-b border-neutral-200 mb-2">
                        {(item.props.tabs || ['Tab 1', 'Tab 2']).slice(0, 3).map((tab, idx) => (
                            <div key={idx} className={`px-4 py-2 text-sm font-medium cursor-pointer ${idx === 0 ? 'border-b-2 border-sage-600 text-sage-600' : 'text-neutral-500'} ${isPreview ? 'hover:text-sage-600' : ''}`}>
                                {tab}
                            </div>
                        ))}
                    </div>
                    <div className="p-2 text-sm text-neutral-400">Tab content area</div>
                </div>
            );
            case 'modal': return (
                <div style={contentStyle} className={!isPreview ? 'pointer-events-none' : ''}>
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-neutral-200">
                        <h3 className="font-semibold text-neutral-800">{item.props.title || 'Modal Title'}</h3>
                        {isPreview && <button className="p-1 hover:bg-neutral-100 rounded"><FiX className="w-4 h-4 text-neutral-400" /></button>}
                        {!isPreview && <FiX className="w-4 h-4 text-neutral-400" />}
                    </div>
                    <p className="text-sm text-neutral-500">{item.props.label || 'Modal content goes here'}</p>
                </div>
            );
            
            // === DISPLAY ===
            case 'card': return <div style={contentStyle}><h3 className="font-bold text-lg mb-2">Card Title</h3><p className="text-sm text-gray-500">{item.props.label}</p></div>;
            case 'chart': return <div style={contentStyle} className="flex flex-col items-center justify-center"><FiPieChart className="w-10 h-10 mb-2 opacity-50" /><span className="font-medium">{item.props.label}</span></div>;
            case 'image': return <div style={contentStyle} className="flex items-center justify-center text-neutral-400"><FiImage className="w-8 h-8" /></div>;
            case 'text': return <p style={contentStyle}>{item.props.label}</p>;
            case 'statCard': return (
                <div style={contentStyle} className={!isPreview ? 'pointer-events-none' : ''}>
                    <div className="text-3xl font-bold text-sage-600 mb-1">{item.props.value || '0'}</div>
                    <div className="text-sm text-neutral-500">{item.props.title || 'Total'}</div>
                </div>
            );
            case 'dataTable': return (
                <div style={contentStyle} className={!isPreview ? 'pointer-events-none' : ''}>
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50">
                            <tr>
                                {(item.props.columns || ['Column 1', 'Column 2', 'Column 3']).slice(0, 3).map((col, idx) => (
                                    <th key={idx} className="px-4 py-2 text-left font-medium text-neutral-700 border-b border-neutral-200">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3].map(row => (
                                <tr key={row} className={`border-b border-neutral-100 ${isPreview ? 'hover:bg-neutral-50 cursor-pointer' : ''}`}>
                                    {(item.props.columns || ['Column 1', 'Column 2', 'Column 3']).slice(0, 3).map((_, idx) => (
                                        <td key={idx} className="px-4 py-2 text-neutral-600">Row {row} Data</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            case 'listView': return (
                <div style={contentStyle} className={!isPreview ? 'pointer-events-none' : ''}>
                    <ul className="space-y-2">
                        {(item.props.items || ['Item 1', 'Item 2', 'Item 3']).slice(0, 5).map((listItem, idx) => (
                            <li key={idx} className={`flex items-center gap-2 p-2 rounded ${isPreview ? 'hover:bg-neutral-50 cursor-pointer' : ''}`}>
                                <div className="w-2 h-2 bg-sage-400 rounded-full"></div>
                                <span className="text-sm text-neutral-700">{listItem}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
            
            // === FORM ===
            case 'button': return <button className="flex items-center justify-center" style={contentStyle}>{item.props.label}</button>;
            case 'input': return <input type="text" placeholder={item.props.placeholder} className="outline-none" style={contentStyle} readOnly={!isPreview} disabled={!isPreview} />;
            case 'checkbox': return <div style={contentStyle} className={`flex items-center gap-2 ${!isPreview ? 'pointer-events-none' : ''}`}><input type="checkbox" className="w-4 h-4" readOnly={!isPreview} disabled={!isPreview} /><span>{item.props.label}</span></div>;
            case 'select': return (
                isPreview ? (
                    <select style={contentStyle} className="outline-none">
                        <option>{item.props.label}</option>
                    </select>
                ) : (
                    <div style={contentStyle} className="flex items-center justify-between px-2 text-gray-500 pointer-events-none"><span>{item.props.label}</span><span className="text-xs">▼</span></div>
                )
            );
            case 'datePicker': return (
                isPreview ? (
                    <input type="date" style={contentStyle} className="outline-none" placeholder={item.props.placeholder || 'Select Date'} />
                ) : (
                    <div style={contentStyle} className="pointer-events-none flex items-center justify-between px-2">
                        <span className="text-neutral-500">{item.props.placeholder || 'Select Date'}</span>
                        <FiCalendar className="w-4 h-4 text-neutral-400" />
                    </div>
                )
            );
            case 'richText': return (
                <div style={contentStyle} className={`border border-neutral-200 rounded p-2 ${!isPreview ? 'pointer-events-none' : ''}`}>
                    {isPreview && (
                        <div className="flex gap-1 mb-2 pb-2 border-b border-neutral-200">
                            <button className="w-6 h-6 text-xs border rounded hover:bg-neutral-100">B</button>
                            <button className="w-6 h-6 text-xs border rounded hover:bg-neutral-100">I</button>
                            <button className="w-6 h-6 text-xs border rounded hover:bg-neutral-100">U</button>
                        </div>
                    )}
                    {isPreview ? (
                        <textarea className="w-full text-sm outline-none min-h-[100px]" placeholder={item.props.placeholder || 'Enter formatted text...'}></textarea>
                    ) : (
                        <div className="text-sm text-neutral-400 min-h-[100px]">{item.props.placeholder || 'Enter formatted text...'}</div>
                    )}
                </div>
            );
            case 'fileUpload': return (
                <div style={contentStyle} className={`flex flex-col items-center justify-center gap-2 ${!isPreview ? 'pointer-events-none' : ''}`}>
                    <FiUpload className="w-8 h-8 text-neutral-400" />
                    <span className="text-sm text-neutral-500">{item.props.placeholder || 'Click to upload or drag and drop'}</span>
                    <span className="text-xs text-neutral-400">PNG, JPG, PDF up to 10MB</span>
                </div>
            );
            case 'switch': return (
                <div style={contentStyle} className={`flex items-center gap-2 ${!isPreview ? 'pointer-events-none' : ''}`}>
                    {isPreview ? (
                        <button 
                            className={`w-11 h-6 rounded-full transition-colors ${item.props.checked ? 'bg-sage-500' : 'bg-neutral-300'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Toggle switch state (có thể cần update item)
                            }}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ml-0.5 ${item.props.checked ? 'translate-x-5' : ''}`}></div>
                        </button>
                    ) : (
                        <div className={`w-11 h-6 rounded-full transition-colors ${item.props.checked ? 'bg-sage-500' : 'bg-neutral-300'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ml-0.5 ${item.props.checked ? 'translate-x-5' : ''}`}></div>
                        </div>
                    )}
                    <span>{item.props.label}</span>
                </div>
            );
            
            default: return null;
        }
    };

    // Wrapper Style: Layout & Background (cho Container/Card)
    const layoutComponents = ['container', 'card', 'row', 'grid', 'image', 'chart', 'tabs', 'modal', 'statCard', 'dataTable', 'listView'];
    const formComponents = ['button', 'input', 'select', 'checkbox', 'text', 'datePicker', 'richText', 'fileUpload', 'switch'];
    
    // Trong preview mode: ẩn border selection và border dashed
    const getBorder = () => {
        if (isPreview) return 'none';
        if (isSelected) return '2px solid #2563eb';
        // Ẩn border dashed trong preview
        if (item.style.border && item.style.border.includes('dashed') && isPreview) return 'none';
        return item.style.border || 'none';
    };
    
    const wrapperStyle = {
        width: item.style.width, height: item.style.height, margin: item.style.margin,
        position: 'relative', border: getBorder(),
        cursor: isPreview ? 'default' : 'pointer', boxSizing: 'border-box', display: item.style.display || 'block', gap: item.style.gap,
        gridTemplateColumns: item.style.gridTemplateColumns, // Cho grid component
        backgroundColor: layoutComponents.includes(item.type) ? item.style.backgroundColor : 'transparent',
        padding: layoutComponents.includes(item.type) ? item.style.padding : 0,
        borderRadius: item.style.borderRadius,
        boxShadow: item.style.boxShadow
    };

    // Trong preview mode: cho phép pointer-events, không có onClick để select
    const handleClick = isPreview ? undefined : (e) => { e.stopPropagation(); onClick(item.id); };
    const hoverClass = isPreview ? '' : (item.type !== 'divider' ? 'hover:ring-1 hover:ring-sage-300' : '');

    // Với input/button... style nằm trong contentStyle
    if (formComponents.includes(item.type)) {
         return <div onClick={handleClick} style={wrapperStyle} className={`transition-all rounded-sm ${hoverClass}`}>{content()}</div>;
    }
    return <div onClick={handleClick} style={wrapperStyle} className={`transition-all rounded-sm ${hoverClass}`}>{content()}</div>;
};

// 4. CANVAS AREA
const CanvasArea = ({ items, selectedId, onSelectItem, isPreview = false }) => {
    const { setNodeRef, isOver } = useDroppable({ id: 'canvas-area' });
    const handleCanvasClick = isPreview ? undefined : () => onSelectItem(null);
    return (
        <div ref={setNodeRef} className={`w-full max-w-4xl min-h-[700px] bg-white rounded-xl shadow-sm transition-colors relative overflow-hidden ${!isPreview && isOver ? 'ring-4 ring-sage-100' : ''}`} onClick={handleCanvasClick}>
            {items.length === 0 && !isOver && !isPreview && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="text-center"><p className="text-neutral-400 mb-2">Canvas trống</p><p className="text-xs text-neutral-300">Kéo component vào đây</p></div></div>}
            <div className="p-8 flex flex-col gap-4 items-start"> 
                {items.map((item) => <RenderComponent key={item.id} item={item} isSelected={item.id === selectedId} onClick={onSelectItem} isPreview={isPreview} />)}
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
function AppBuilderPage() {
    const [activeTab, setActiveTab] = useState('ui');
    const [canvasItems, setCanvasItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    
    // Undo/Redo state
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const maxHistorySize = 50;
    
    const { projectId } = useParams();
    const [projectInfo, setProjectInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false); // ĐÃ THÊM STATE NÀY ĐỂ FIX LỖI
    
    const navigate = useNavigate();
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [publishData, setPublishData] = useState({ name: '', description: '', category: 'Template', price: '' });
    
    // Ref để track xem có đang undo/redo không (tránh lưu history khi undo/redo)
    const isUndoRedoRef = useRef(false);
    
    // Debounce canvasItems để lưu history khi update (tránh lưu quá nhiều khi đang type)
    const debouncedCanvasItems = useDebounce(canvasItems, 500);

    // Hàm lưu history
    const saveToHistory = useCallback((items) => {
        // Deep copy của canvasItems
        const snapshot = JSON.parse(JSON.stringify(items));
        
        setHistory(prevHistory => {
            // Xóa các bước sau historyIndex (khi user làm action mới sau khi undo)
            const newHistory = prevHistory.slice(0, historyIndex + 1);
            
            // Thêm snapshot mới
            newHistory.push(snapshot);
            
            // Giới hạn history size
            if (newHistory.length > maxHistorySize) {
                newHistory.shift(); // Xóa bước cũ nhất
                return newHistory;
            }
            
            return newHistory;
        });
        
        // Cập nhật historyIndex
        setHistoryIndex(prevIndex => {
            const newIndex = prevIndex + 1;
            // Nếu đã vượt quá maxHistorySize, giữ nguyên index
            return Math.min(newIndex, maxHistorySize - 1);
        });
    }, [historyIndex, maxHistorySize]);

    // Hàm Undo
    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            isUndoRedoRef.current = true; // Đánh dấu đang undo
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            
            // Lấy snapshot từ history hiện tại
            const snapshot = JSON.parse(JSON.stringify(history[newIndex]));
            setCanvasItems(snapshot);
            setSelectedId(null); // Bỏ chọn component khi undo
            
            // Reset flag sau một chút
            setTimeout(() => {
                isUndoRedoRef.current = false;
            }, 100);
        }
    }, [historyIndex, history]);

    // Hàm Redo
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            isUndoRedoRef.current = true; // Đánh dấu đang redo
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            
            // Lấy snapshot từ history hiện tại
            const snapshot = JSON.parse(JSON.stringify(history[newIndex]));
            setCanvasItems(snapshot);
            setSelectedId(null); // Bỏ chọn component khi redo
            
            // Reset flag sau một chút
            setTimeout(() => {
                isUndoRedoRef.current = false;
            }, 100);
        }
    }, [historyIndex, history]);

    // Keyboard shortcuts cho Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+Z hoặc Cmd+Z (Mac) - Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (historyIndex > 0) {
                    handleUndo();
                }
            }
            // Ctrl+Y hoặc Ctrl+Shift+Z - Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (historyIndex < history.length - 1) {
                    handleRedo();
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [historyIndex, history.length, handleUndo, handleRedo]);

    // Lưu history khi debouncedCanvasItems thay đổi (cho handleUpdateItem)
    useEffect(() => {
        // Chỉ lưu history nếu:
        // 1. Không phải đang undo/redo
        // 2. Có items trong canvas
        // 3. Đã có history ban đầu (historyIndex >= 0)
        if (!isUndoRedoRef.current && debouncedCanvasItems.length >= 0 && historyIndex >= 0) {
            // Kiểm tra xem có thay đổi thực sự không (so sánh với history hiện tại)
            const currentSnapshot = JSON.stringify(debouncedCanvasItems);
            const lastSnapshot = history[historyIndex] ? JSON.stringify(history[historyIndex]) : '';
            
            if (currentSnapshot !== lastSnapshot) {
                // Chỉ lưu nếu thay đổi thực sự (không phải do undo/redo)
                saveToHistory(debouncedCanvasItems);
            }
        }
    }, [debouncedCanvasItems, historyIndex, history, saveToHistory]); // Chỉ trigger khi debounced value thay đổi

    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) return;
            try {
                setLoading(true);
                const response = await apiService.getProject(projectId);
                const project = response.data;
                setProjectInfo(project);
                if (project.jsonData) {
                    try {
                        const items = JSON.parse(project.jsonData);
                        setCanvasItems(items);
                        // Khởi tạo history với snapshot đầu tiên
                        const snapshot = JSON.parse(JSON.stringify(items));
                        setHistory([snapshot]);
                        setHistoryIndex(0);
                    } catch (e) {
                        console.error("Lỗi parse JSON:", e);
                        setCanvasItems([]);
                        setHistory([]);
                        setHistoryIndex(-1);
                    }
                } else {
                    // Nếu không có data, khởi tạo history rỗng
                    setHistory([]);
                    setHistoryIndex(-1);
                }
                setPublishData(prev => ({
                    ...prev,
                    name: project.name,
                    description: project.description || ''
                }));
            } catch (error) {
                console.error("Lỗi tải Project:", error);
                alert("Không thể tải dự án.");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId, navigate]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && over.id === 'canvas-area') {
            const toolData = active.data.current;
            if (toolData) {
                const newItem = { 
                    id: `comp-${Date.now()}`, 
                    type: toolData.type,
                    props: { ...toolData.defaultProps },
                    style: { ...toolData.defaultStyle } 
                };
                setCanvasItems((prev) => {
                    const newItems = [...prev, newItem];
                    // Lưu history sau khi thêm component
                    saveToHistory(newItems);
                    return newItems;
                });
                setSelectedId(newItem.id);
            }
        }
    };

    const handleUpdateItem = (id, updatedItem) => {
        setCanvasItems(prev => prev.map(item => item.id === id ? updatedItem : item));
        // History sẽ được lưu tự động qua debouncedCanvasItems useEffect
    };
    
    const handleDeleteItem = (id) => {
        setCanvasItems(prev => {
            const newItems = prev.filter(item => item.id !== id);
            // Lưu history sau khi xóa component
            saveToHistory(newItems);
            return newItems;
        });
        setSelectedId(null);
    };
    const selectedItem = canvasItems.find(i => i.id === selectedId);

    const handleSave = async () => {
        if (!projectId) return;
        setSaving(true);
        try {
            const updateDto = {
                name: projectInfo.name,
                description: projectInfo.description,
                jsonData: JSON.stringify(canvasItems)
            };
            await apiService.updateProject(projectId, updateDto);
            alert("Đã lưu thành công!");
        } catch (error) {
            console.error("Lỗi lưu:", error);
            alert("Lỗi khi lưu dự án.");
        } finally {
            setSaving(false);
        }
    };

    // --- HÀM PUBLISH (Đã Fix) ---
    const handlePublish = async (e) => {
        e.preventDefault();
        if (!projectId) return;

        setPublishing(true);
        try {
            await apiService.publishProject(projectId, { ...publishData });
            
            alert("Đã xuất bản ứng dụng thành công lên Marketplace!");
            setIsPublishModalOpen(false);
            navigate('/marketplace');
        } catch (error) {
            console.error("Lỗi publish:", error);
            alert("Không thể xuất bản ứng dụng.");
        } finally {
            setPublishing(false);
        }
    };

    // --- HÀM PREVIEW MODE ---
    const handleEnterPreview = () => {
        setIsPreviewMode(true);
        setSelectedId(null); // Bỏ chọn component khi vào preview
    };

    const handleExitPreview = () => {
        setIsPreviewMode(false);
    };

    // Keyboard shortcut ESC để exit preview
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isPreviewMode) {
                handleExitPreview();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPreviewMode]);

    if (loading) return <div className="p-10 text-center">Đang tải dự án...</div>;

    return (
        <DndContext onDragEnd={isPreviewMode ? undefined : handleDragEnd}>
            <div className="flex h-[calc(100vh-6rem)] bg-neutral-100 overflow-hidden border border-neutral-200 rounded-xl shadow-sm m-[-24px]">
                
                {/* LEFT: Toolbox - Ẩn trong preview mode */}
                {!isPreviewMode && (
                    <div className="w-64 bg-white border-r border-neutral-200 flex flex-col z-10">
                        <div className="p-4 border-b border-neutral-200"><h3 className="font-semibold text-neutral-800">Toolbox</h3></div>
                        <div className="flex border-b border-neutral-200">
                             <button className={`flex-1 py-3 text-sm font-medium ${activeTab === 'ui' ? 'text-sage-600 border-b-2 border-sage-600' : 'text-neutral-500'}`} onClick={() => setActiveTab('ui')}>UI</button>
                             <button className={`flex-1 py-3 text-sm font-medium ${activeTab === 'data' ? 'text-sage-600 border-b-2 border-sage-600' : 'text-neutral-500'}`} onClick={() => setActiveTab('data')}>Data</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {activeTab === 'ui' && <div className="grid grid-cols-2 gap-2">{TOOLS.map((tool) => <DraggableTool key={tool.type} tool={tool} />)}</div>}
                            {activeTab === 'data' && <p className="text-center text-sm text-neutral-400 mt-4">Data models here</p>}
                        </div>
                    </div>
                )}

                {/* CENTER: Canvas */}
                <div className={`flex-1 bg-neutral-100 flex flex-col relative overflow-hidden ${isPreviewMode ? 'w-full' : ''}`}>
                    {/* Thanh công cụ Canvas - Ẩn trong preview mode, chỉ hiện nút Exit Preview */}
                    {isPreviewMode ? (
                        <div className="h-12 bg-white border-b border-neutral-200 flex items-center justify-end px-4 shadow-sm z-10">
                            <button 
                                onClick={handleExitPreview}
                                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 text-white text-xs font-medium rounded-lg hover:bg-black transition-colors"
                            >
                                <FiX /> Exit Preview
                            </button>
                        </div>
                    ) : (
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
                                        onClick={handleUndo} 
                                        disabled={historyIndex <= 0}
                                        className="flex items-center justify-center w-8 h-8 border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Undo (Ctrl+Z)"
                                    >
                                        <FiCornerUpLeft className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={handleRedo} 
                                        disabled={historyIndex >= history.length - 1}
                                        className="flex items-center justify-center w-8 h-8 border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Redo (Ctrl+Y)"
                                    >
                                        <FiCornerUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <button onClick={handleEnterPreview} className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors">
                                    <FiEye /> Preview
                                </button>
                                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors">
                                    <FiSave /> {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button onClick={() => setIsPublishModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-sage-500 text-white text-xs font-medium rounded-lg hover:bg-sage-600">
                                    <FiUploadCloud /> Publish
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex-1 p-10 overflow-auto flex justify-center items-start">
                        <CanvasArea items={canvasItems} selectedId={selectedId} onSelectItem={setSelectedId} isPreview={isPreviewMode} />
                    </div>
                </div>

                {/* RIGHT: Properties Panel - Ẩn trong preview mode */}
                {!isPreviewMode && (
                    <div className="w-80 bg-white border-l border-neutral-200 flex flex-col z-10">
                        <PropertiesPanel selectedItem={selectedItem} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} />
                    </div>
                )}
            </div>

             {/* Modal Publish */}
             {isPublishModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-neutral-200 animation-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-neutral-800">Publish to Marketplace</h3>
                            <button onClick={() => setIsPublishModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-full"><FiX /></button>
                        </div>
                        <form onSubmit={handlePublish} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">App Name</label>
                                <input type="text" required className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none" value={publishData.name} onChange={e => setPublishData({...publishData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                                <textarea required rows="3" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-sage-400 outline-none" value={publishData.description} onChange={e => setPublishData({...publishData, description: e.target.value})}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                                    <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none" value={publishData.category} onChange={e => setPublishData({...publishData, category: e.target.value})}>
                                        <option>Template</option>
                                        <option>Module</option>
                                        <option>Component</option>
                                        <option>Automation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Price (Optional)</label>
                                    <input type="text" placeholder="Free" className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none" value={publishData.price} onChange={e => setPublishData({...publishData, price: e.target.value})} />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsPublishModalOpen(false)} className="flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50">Cancel</button>
                                <button type="submit" disabled={publishing} className="flex-1 py-2.5 bg-sage-500 text-white font-medium rounded-xl hover:bg-sage-600 shadow-lg shadow-sage-500/20">
                                    {publishing ? 'Publishing...' : 'Publish App'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DndContext>
    );
}

export default AppBuilderPage;