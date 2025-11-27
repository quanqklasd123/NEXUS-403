// src/pages/AppBuilderPage.jsx
import React, { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { 
    FiBox, FiLayout, FiType, FiImage, FiUploadCloud, FiX, FiTrash2, FiSave,
    FiGrid, FiCreditCard, FiPieChart, FiMinus, FiCheckSquare, FiList
} from 'react-icons/fi';
import apiService from '../services/apiService';
import { useNavigate, useParams } from 'react-router-dom';
import PropertiesPanel from '../components/builder/PropertiesPanel';

// 1. TOOLS
const TOOLS = [
    { type: 'container', label: 'Container', icon: FiLayout, defaultProps: { label: 'Container' }, defaultStyle: { width: '100%', height: '150px', backgroundColor: '#f8fafc', padding: '20px', margin: '0px', border: '1px dashed #cbd5e1' } },
    { type: 'row', label: 'Row (Flex)', icon: FiGrid, defaultProps: { label: 'Row' }, defaultStyle: { width: '100%', height: 'auto', display: 'flex', gap: '10px', padding: '10px', border: '1px dashed #94a3b8' } },
    { type: 'divider', label: 'Divider', icon: FiMinus, defaultProps: { label: '' }, defaultStyle: { width: '100%', height: '1px', backgroundColor: '#e2e8f0', margin: '10px 0' } },
    { type: 'card', label: 'Card', icon: FiCreditCard, defaultProps: { label: 'Card Content' }, defaultStyle: { width: '300px', height: '200px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '20px', border: '1px solid #e2e8f0'} },
    { type: 'chart', label: 'Chart (Mock)', icon: FiPieChart, defaultProps: { label: 'Sales Chart' }, defaultStyle: { width: '100%', height: '200px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534'} },
    { type: 'image', label: 'Image', icon: FiImage, defaultProps: { label: 'Image' }, defaultStyle: { width: '100%', height: '200px', backgroundColor: '#e2e8f0', margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    { type: 'text', label: 'Text Block', icon: FiType, defaultProps: { label: 'Lorem ipsum dolor sit amet.' }, defaultStyle: { width: '100%', height: 'auto', color: '#333333', padding: '5px', margin: '5px 0', fontSize: '16px' } },
    { type: 'button', label: 'Button', icon: FiBox, defaultProps: { label: 'Click Me' }, defaultStyle: { width: 'auto', height: 'auto', backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', margin: '5px', borderRadius: '8px', border: 'none', cursor: 'pointer' } },
    { type: 'input', label: 'Input Field', icon: FiType, defaultProps: { label: 'Input', placeholder: 'Enter text...' }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    { type: 'checkbox', label: 'Checkbox', icon: FiCheckSquare, defaultProps: { label: 'Check me' }, defaultStyle: { width: 'auto', height: 'auto', margin: '5px', display: 'flex', alignItems: 'center', gap: '8px', color: '#333333' } },
    { type: 'select', label: 'Select / Dropdown', icon: FiList, defaultProps: { label: 'Select Option' }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
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
const RenderComponent = ({ item, isSelected, onClick }) => {
    const contentStyle = { ...item.style, width: '100%', height: '100%', margin: 0, position: undefined, border: undefined };

    const content = () => {
        switch (item.type) {
            case 'button': return <button className="flex items-center justify-center" style={contentStyle}>{item.props.label}</button>;
            case 'input': return <input type="text" placeholder={item.props.placeholder} className="outline-none pointer-events-none" style={contentStyle} readOnly />;
            case 'text': return <p style={contentStyle}>{item.props.label}</p>;
            case 'checkbox': return <div style={contentStyle} className="pointer-events-none flex items-center gap-2"><input type="checkbox" className="w-4 h-4" readOnly /><span>{item.props.label}</span></div>;
            case 'select': return <div style={contentStyle} className="flex items-center justify-between px-2 text-gray-500 pointer-events-none"><span>{item.props.label}</span><span className="text-xs">▼</span></div>;
            case 'card': return <div style={contentStyle}><h3 className="font-bold text-lg mb-2">Card Title</h3><p className="text-sm text-gray-500">{item.props.label}</p></div>;
            case 'chart': return <div style={contentStyle} className="flex flex-col items-center justify-center"><FiPieChart className="w-10 h-10 mb-2 opacity-50" /><span className="font-medium">{item.props.label}</span></div>;
            case 'image': return <div style={contentStyle} className="flex items-center justify-center text-neutral-400"><FiImage className="w-8 h-8" /></div>;
            case 'container': return <div style={contentStyle} className="flex items-center justify-center text-neutral-400 text-sm">{item.props.label} (Drop items here)</div>;
            case 'row': return <div style={contentStyle} className="flex items-center justify-center text-neutral-400 text-sm">Row (Flex)</div>;
            case 'divider': return <div style={contentStyle}></div>;
            default: return null;
        }
    };

    // Wrapper Style: Layout & Background (cho Container/Card)
    const wrapperStyle = {
        width: item.style.width, height: item.style.height, margin: item.style.margin,
        position: 'relative', border: isSelected ? '2px solid #2563eb' : (item.style.border || 'none'),
        cursor: 'pointer', boxSizing: 'border-box', display: item.style.display || 'block', gap: item.style.gap,
        backgroundColor: ['container', 'card', 'row', 'image', 'chart'].includes(item.type) ? item.style.backgroundColor : 'transparent',
        padding: ['container', 'card', 'row'].includes(item.type) ? item.style.padding : 0,
        borderRadius: item.style.borderRadius
    };

    // Với input/button... style nằm trong contentStyle
    if (['button', 'input', 'select', 'checkbox', 'text'].includes(item.type)) {
         return <div onClick={(e) => { e.stopPropagation(); onClick(item.id); }} style={wrapperStyle} className={`transition-all rounded-sm ${item.type !== 'divider' ? 'hover:ring-1 hover:ring-sage-300' : ''}`}>{content()}</div>;
    }
    return <div onClick={(e) => { e.stopPropagation(); onClick(item.id); }} style={wrapperStyle} className={`transition-all rounded-sm ${item.type !== 'divider' ? 'hover:ring-1 hover:ring-sage-300' : ''}`}>{content()}</div>;
};

// 4. CANVAS AREA
const CanvasArea = ({ items, selectedId, onSelectItem }) => {
    const { setNodeRef, isOver } = useDroppable({ id: 'canvas-area' });
    return (
        <div ref={setNodeRef} className={`w-full max-w-4xl min-h-[700px] bg-white rounded-xl shadow-sm transition-colors relative overflow-hidden ${isOver ? 'ring-4 ring-sage-100' : ''}`} onClick={() => onSelectItem(null)}>
            {items.length === 0 && !isOver && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="text-center"><p className="text-neutral-400 mb-2">Canvas trống</p><p className="text-xs text-neutral-300">Kéo component vào đây</p></div></div>}
            <div className="p-8 flex flex-col gap-4 items-start"> 
                {items.map((item) => <RenderComponent key={item.id} item={item} isSelected={item.id === selectedId} onClick={onSelectItem} />)}
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
function AppBuilderPage() {
    const [activeTab, setActiveTab] = useState('ui');
    const [canvasItems, setCanvasItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    
    const { projectId } = useParams();
    const [projectInfo, setProjectInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false); // ĐÃ THÊM STATE NÀY ĐỂ FIX LỖI
    
    const navigate = useNavigate();
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [publishData, setPublishData] = useState({ name: '', description: '', category: 'Template', price: '' });

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
                    } catch (e) {
                        console.error("Lỗi parse JSON:", e);
                        setCanvasItems([]);
                    }
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
                setCanvasItems((prev) => [...prev, newItem]);
                setSelectedId(newItem.id);
            }
        }
    };

    const handleUpdateItem = (id, updatedItem) => setCanvasItems(prev => prev.map(item => item.id === id ? updatedItem : item));
    const handleDeleteItem = (id) => { setCanvasItems(prev => prev.filter(item => item.id !== id)); setSelectedId(null); };
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

    if (loading) return <div className="p-10 text-center">Đang tải dự án...</div>;

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="flex h-[calc(100vh-6rem)] bg-neutral-100 overflow-hidden border border-neutral-200 rounded-xl shadow-sm m-[-24px]">
                
                {/* LEFT: Toolbox */}
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

                {/* CENTER: Canvas */}
                <div className="flex-1 bg-neutral-100 flex flex-col relative overflow-hidden">
                    <div className="h-12 bg-white border-b border-neutral-200 flex items-center justify-between px-4 shadow-sm z-10">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-neutral-700">{projectInfo?.name}</span>
                            <span className={`text-xs text-white px-2 py-0.5 rounded ${projectInfo?.isPublished ? 'bg-green-500' : 'bg-gray-400'}`}>
                                {projectInfo?.isPublished ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors">
                                <FiSave /> {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => setIsPublishModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-sage-500 text-white text-xs font-medium rounded-lg hover:bg-sage-600">
                                <FiUploadCloud /> Publish
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 p-10 overflow-auto flex justify-center items-start">
                        <CanvasArea items={canvasItems} selectedId={selectedId} onSelectItem={setSelectedId} />
                    </div>
                </div>

                {/* RIGHT: Properties Panel */}
                <div className="w-80 bg-white border-l border-neutral-200 flex flex-col z-10">
                    <PropertiesPanel selectedItem={selectedItem} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} />
                </div>
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