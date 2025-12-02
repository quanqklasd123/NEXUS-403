// src/components/builder/PropertiesPanel.jsx
import React, { useState } from 'react';
import { FiTrash2, FiType, FiLayout, FiMaximize, FiMonitor, FiZap, FiPlus, FiX, FiInfo, FiTag, FiFolder, FiSettings } from 'react-icons/fi';

const PropertiesPanel = ({ selectedItem, onUpdateItem, onDeleteItem, allItems = [], onClose }) => {
    const [activeTab, setActiveTab] = useState('properties');
    
    if (!selectedItem) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-neutral-400 p-6 text-center">
                <FiLayout className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm italic">Chọn một phần tử trên Canvas để chỉnh sửa.</p>
            </div>
        );
    }
    
    // Xác định component có thể có events nào
    const getAvailableEvents = () => {
        const componentType = selectedItem.type;
        const eventMap = {
            'button': ['onClick'],
            'card': ['onClick'],
            'container': ['onClick'],
            'input': ['onChange', 'onFocus', 'onBlur'],
            'select': ['onChange'],
            'datePicker': ['onChange'],
            'checkbox': ['onChange'],
            'switch': ['onChange'],
            'fileUpload': ['onChange'],
        };
        return eventMap[componentType] || [];
    };
    
    const availableEvents = getAvailableEvents();
    const hasEventsSupport = availableEvents.length > 0;

    // Hàm xử lý thay đổi giá trị style/props
    const handleChange = (section, key, value) => {
        let finalValue = value;

        // Tự động thêm 'px' cho width/height/padding/margin nếu người dùng chỉ nhập số
        if (section === 'style' && ['width', 'height', 'padding', 'margin'].includes(key)) {
            // Kiểm tra xem value có phải là số không (regex) - cho phép số thập phân
            if (value && /^[0-9]+(\.[0-9]+)?$/.test(value.toString().trim())) {
                finalValue = `${value}px`;
            } else if (value === '' || value === null || value === undefined) {
                // Nếu xóa giá trị, giữ nguyên hoặc set về undefined
                finalValue = undefined;
            }
        }

        // Merge đúng cách để không mất các property khác
        const currentSection = selectedItem[section] || {};
        const updatedSection = {
            ...currentSection,
            [key]: finalValue
        };
        
        // Nếu finalValue là undefined, xóa key đó
        if (finalValue === undefined) {
            delete updatedSection[key];
        }

        onUpdateItem(selectedItem.id, {
            ...selectedItem,
            [section]: updatedSection
        });
    };

    // Hàm xử lý thay đổi events
    const handleEventChange = (eventType, field, value) => {
        const currentProps = selectedItem.props || {};
        const currentEvents = currentProps.events || {};
        const currentEvent = currentEvents[eventType] || {};
        
        // Nếu field là 'config' và value là object, merge với config hiện tại
        let updatedEvent;
        if (field === 'config' && typeof value === 'object' && value !== null) {
            updatedEvent = {
                ...currentEvent,
                config: {
                    ...(currentEvent.config || {}),
                    ...value
                }
            };
        } else {
            updatedEvent = {
                ...currentEvent,
                [field]: value
            };
        }
        
        onUpdateItem(selectedItem.id, {
            ...selectedItem,
            props: {
                ...currentProps,
                events: {
                    ...currentEvents,
                    [eventType]: updatedEvent
                }
            }
        });
    };
    
    const handleAddEvent = (eventType) => {
        const currentProps = selectedItem.props || {};
        const currentEvents = currentProps.events || {};
        onUpdateItem(selectedItem.id, {
            ...selectedItem,
            props: {
                ...currentProps,
                events: {
                    ...currentEvents,
                    [eventType]: {
                        type: 'notification',
                        config: {}
                    }
                }
            }
        });
    };
    
    const handleRemoveEvent = (eventType) => {
        const currentProps = selectedItem.props || {};
        const currentEvents = { ...(currentProps.events || {}) };
        delete currentEvents[eventType];
        
        onUpdateItem(selectedItem.id, {
            ...selectedItem,
            props: {
                ...currentProps,
                events: currentEvents
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header Panel */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/50">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ID: {selectedItem.id.slice(-4)}</span>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-sage-100 text-sage-700 text-[10px] uppercase font-bold rounded-full">
                            {selectedItem.type}
                        </span>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-200 transition-colors"
                                title="Đóng panel"
                            >
                                <FiX className="w-4 h-4 text-neutral-600" />
                            </button>
                        )}
                    </div>
                </div>
                <h3 className="font-semibold text-neutral-800">
                    {selectedItem.name || selectedItem.type}
                </h3>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'info'
                            ? 'text-sage-600 border-b-2 border-sage-600'
                            : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    <FiInfo className="inline w-4 h-4 mr-1" /> Info
                </button>
                <button
                    onClick={() => setActiveTab('logic')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'logic'
                            ? 'text-sage-600 border-b-2 border-sage-600'
                            : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    <FiSettings className="inline w-4 h-4 mr-1" /> Logic
                </button>
                <button
                    onClick={() => setActiveTab('properties')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'properties'
                            ? 'text-sage-600 border-b-2 border-sage-600'
                            : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    Properties
                </button>
                {hasEventsSupport && (
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'events'
                                ? 'text-sage-600 border-b-2 border-sage-600'
                                : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        <FiZap className="inline w-4 h-4 mr-1" /> Events
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">

                {activeTab === 'info' ? (
                    <>
                        {/* 1. ITEM NAME */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiType /> Tên Item
                            </h4>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Name</label>
                                <input
                                    type="text"
                                    value={selectedItem.name || ''}
                                    onChange={(e) => onUpdateItem(selectedItem.id, {
                                        ...selectedItem,
                                        name: e.target.value,
                                        metadata: {
                                            ...(selectedItem.metadata || {}),
                                            updatedAt: new Date().toISOString()
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none transition-all"
                                    placeholder="Enter item name..."
                                />
                                <p className="text-xs text-neutral-400 mt-1">Tên để dễ nhận biết item này</p>
                            </div>
                        </div>

                        {/* 2. TAGS */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiTag /> Tags
                            </h4>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Tags (phân cách bằng dấu phẩy)</label>
                                <input
                                    type="text"
                                    value={(selectedItem.metadata?.tags || []).join(', ')}
                                    onChange={(e) => {
                                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                                        onUpdateItem(selectedItem.id, {
                                            ...selectedItem,
                                            metadata: {
                                                ...(selectedItem.metadata || {}),
                                                tags: tags,
                                                updatedAt: new Date().toISOString()
                                            }
                                        });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none transition-all"
                                    placeholder="form, button, primary"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {(selectedItem.metadata?.tags || []).map((tag, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-sage-100 text-sage-700 text-xs rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. NOTES */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiType /> Ghi chú
                            </h4>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Notes</label>
                                <textarea
                                    value={selectedItem.metadata?.notes || ''}
                                    onChange={(e) => onUpdateItem(selectedItem.id, {
                                        ...selectedItem,
                                        metadata: {
                                            ...(selectedItem.metadata || {}),
                                            notes: e.target.value,
                                            updatedAt: new Date().toISOString()
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none transition-all"
                                    rows="3"
                                    placeholder="Ghi chú về item này..."
                                />
                            </div>
                        </div>

                        {/* 4. HIERARCHY */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiFolder /> Hierarchy
                            </h4>
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Category</label>
                                    <div className="px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50">
                                        {selectedItem.metadata?.category || 'other'}
                                    </div>
                                </div>
                                {selectedItem.parentId && (
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Parent</label>
                                        <div className="px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50">
                                            {selectedItem.parentId}
                                        </div>
                                    </div>
                                )}
                                {selectedItem.children && selectedItem.children.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Children ({selectedItem.children.length})</label>
                                        <div className="px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 max-h-32 overflow-y-auto">
                                            {selectedItem.children.map((childId, idx) => (
                                                <div key={idx} className="text-xs text-neutral-600">
                                                    • {childId}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {!selectedItem.parentId && (!selectedItem.children || selectedItem.children.length === 0) && (
                                    <p className="text-xs text-neutral-400">Root level item</p>
                                )}
                            </div>
                        </div>

                        {/* 5. METADATA */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiInfo /> Metadata
                            </h4>
                            <div className="space-y-2 text-xs text-neutral-500">
                                {selectedItem.metadata?.createdAt && (
                                    <div>
                                        <span className="font-medium">Created:</span> {new Date(selectedItem.metadata.createdAt).toLocaleString()}
                                    </div>
                                )}
                                {selectedItem.metadata?.updatedAt && (
                                    <div>
                                        <span className="font-medium">Updated:</span> {new Date(selectedItem.metadata.updatedAt).toLocaleString()}
                                    </div>
                                )}
                                {selectedItem.metadata?.version && (
                                    <div>
                                        <span className="font-medium">Version:</span> {selectedItem.metadata.version}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : activeTab === 'logic' ? (
                    <>
                        {/* 1. VISIBILITY */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiSettings /> Visibility
                            </h4>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Condition</label>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            checked={!selectedItem.visibility?.condition}
                                            onChange={() => onUpdateItem(selectedItem.id, {
                                                ...selectedItem,
                                                visibility: {
                                                    default: true
                                                }
                                            })}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm text-neutral-700">Always visible</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            checked={!!selectedItem.visibility?.condition}
                                            onChange={() => onUpdateItem(selectedItem.id, {
                                                ...selectedItem,
                                                visibility: {
                                                    condition: "{{user.isLoggedIn}}",
                                                    default: true
                                                }
                                            })}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm text-neutral-700">Conditional</label>
                                    </div>
                                    {selectedItem.visibility?.condition && (
                                        <input
                                            type="text"
                                            value={selectedItem.visibility.condition}
                                            onChange={(e) => onUpdateItem(selectedItem.id, {
                                                ...selectedItem,
                                                visibility: {
                                                    ...selectedItem.visibility,
                                                    condition: e.target.value
                                                }
                                            })}
                                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none font-mono text-xs"
                                            placeholder="{{user.role}} === 'admin'"
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-neutral-400 mt-1">Sử dụng {'{{variable}}'} để tham chiếu state</p>
                            </div>
                        </div>

                        {/* 2. CONDITIONAL STYLE */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiSettings /> Conditional Style
                            </h4>
                            <div>
                                <button
                                    onClick={() => {
                                        const currentConditions = selectedItem.conditionalStyle?.conditions || [];
                                        onUpdateItem(selectedItem.id, {
                                            ...selectedItem,
                                            conditionalStyle: {
                                                conditions: [
                                                    ...currentConditions,
                                                    {
                                                        when: "{{formData.isValid}}",
                                                        style: { backgroundColor: "#22c55e" }
                                                    }
                                                ],
                                                default: selectedItem.style || {}
                                            }
                                        });
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                                >
                                    <FiPlus className="w-4 h-4" /> Add Condition
                                </button>
                                {(selectedItem.conditionalStyle?.conditions || []).map((condition, idx) => (
                                    <div key={idx} className="mt-2 p-3 border border-neutral-200 rounded-lg space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-neutral-700">Condition {idx + 1}</span>
                                            <button
                                                onClick={() => {
                                                    const newConditions = selectedItem.conditionalStyle.conditions.filter((_, i) => i !== idx);
                                                    onUpdateItem(selectedItem.id, {
                                                        ...selectedItem,
                                                        conditionalStyle: {
                                                            ...selectedItem.conditionalStyle,
                                                            conditions: newConditions
                                                        }
                                                    });
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FiX className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">When</label>
                                            <input
                                                type="text"
                                                value={condition.when}
                                                onChange={(e) => {
                                                    const newConditions = [...selectedItem.conditionalStyle.conditions];
                                                    newConditions[idx] = { ...condition, when: e.target.value };
                                                    onUpdateItem(selectedItem.id, {
                                                        ...selectedItem,
                                                        conditionalStyle: {
                                                            ...selectedItem.conditionalStyle,
                                                            conditions: newConditions
                                                        }
                                                    });
                                                }}
                                                className="w-full px-2 py-1 text-xs border border-neutral-200 rounded font-mono"
                                                placeholder="{{formData.isValid}}"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">Style (JSON)</label>
                                            <textarea
                                                value={JSON.stringify(condition.style || {}, null, 2)}
                                                onChange={(e) => {
                                                    try {
                                                        const style = JSON.parse(e.target.value);
                                                        const newConditions = [...selectedItem.conditionalStyle.conditions];
                                                        newConditions[idx] = { ...condition, style };
                                                        onUpdateItem(selectedItem.id, {
                                                            ...selectedItem,
                                                            conditionalStyle: {
                                                                ...selectedItem.conditionalStyle,
                                                                conditions: newConditions
                                                            }
                                                        });
                                                    } catch {
                                                        // Invalid JSON, ignore
                                                    }
                                                }}
                                                className="w-full px-2 py-1 text-xs border border-neutral-200 rounded font-mono"
                                                rows="3"
                                                placeholder='{"backgroundColor": "#22c55e"}'
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. CONDITIONAL PROPS */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiSettings /> Conditional Props
                            </h4>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Disabled</label>
                                <input
                                    type="text"
                                    value={selectedItem.conditionalProps?.disabled || ''}
                                    onChange={(e) => onUpdateItem(selectedItem.id, {
                                        ...selectedItem,
                                        conditionalProps: {
                                            ...(selectedItem.conditionalProps || {}),
                                            disabled: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none font-mono text-xs"
                                    placeholder="{{!user.isLoggedIn}}"
                                />
                                <p className="text-xs text-neutral-400 mt-1">Condition để disable component</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Placeholder (for Input)</label>
                                <input
                                    type="text"
                                    value={selectedItem.conditionalProps?.placeholder || ''}
                                    onChange={(e) => onUpdateItem(selectedItem.id, {
                                        ...selectedItem,
                                        conditionalProps: {
                                            ...(selectedItem.conditionalProps || {}),
                                            placeholder: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none font-mono text-xs"
                                    placeholder="{{user.name ? 'Hi ' + user.name : 'Enter name'}}"
                                />
                            </div>
                        </div>

                        {/* 4. ITEM RELATIONSHIPS */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiFolder /> Relationships
                            </h4>
                            
                            {/* Depends On */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Depends On</label>
                                <p className="text-xs text-neutral-400 mb-2">Items này phụ thuộc vào (disable nếu dependencies invalid)</p>
                                <div className="space-y-2">
                                    {(selectedItem.relationships?.dependsOn || []).map((depId, idx) => {
                                        const depItem = allItems.find(i => i.id === depId);
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-neutral-50 rounded border border-neutral-200">
                                                <span className="text-xs text-neutral-700">
                                                    {depItem ? (depItem.name || depItem.type) : depId}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const newDependsOn = (selectedItem.relationships?.dependsOn || []).filter(id => id !== depId);
                                                        onUpdateItem(selectedItem.id, {
                                                            ...selectedItem,
                                                            relationships: {
                                                                ...(selectedItem.relationships || {}),
                                                                dependsOn: newDependsOn
                                                            }
                                                        });
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const newDependsOn = [...(selectedItem.relationships?.dependsOn || []), e.target.value];
                                                onUpdateItem(selectedItem.id, {
                                                    ...selectedItem,
                                                    relationships: {
                                                        ...(selectedItem.relationships || {}),
                                                        dependsOn: newDependsOn
                                                    }
                                                });
                                                e.target.value = '';
                                            }
                                        }}
                                        className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                    >
                                        <option value="">Add dependency...</option>
                                        {allItems
                                            .filter(item => item.id !== selectedItem.id && !(selectedItem.relationships?.dependsOn || []).includes(item.id))
                                            .map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name || item.type} ({item.id.slice(-4)})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            {/* Affects */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Affects</label>
                                <p className="text-xs text-neutral-400 mb-2">Items này ảnh hưởng đến (khi thay đổi sẽ trigger update)</p>
                                <div className="space-y-2">
                                    {(selectedItem.relationships?.affects || []).map((affectId, idx) => {
                                        const affectItem = allItems.find(i => i.id === affectId);
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-neutral-50 rounded border border-neutral-200">
                                                <span className="text-xs text-neutral-700">
                                                    {affectItem ? (affectItem.name || affectItem.type) : affectId}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const newAffects = (selectedItem.relationships?.affects || []).filter(id => id !== affectId);
                                                        onUpdateItem(selectedItem.id, {
                                                            ...selectedItem,
                                                            relationships: {
                                                                ...(selectedItem.relationships || {}),
                                                                affects: newAffects
                                                            }
                                                        });
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const newAffects = [...(selectedItem.relationships?.affects || []), e.target.value];
                                                onUpdateItem(selectedItem.id, {
                                                    ...selectedItem,
                                                    relationships: {
                                                        ...(selectedItem.relationships || {}),
                                                        affects: newAffects
                                                    }
                                                });
                                                e.target.value = '';
                                            }
                                        }}
                                        className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                    >
                                        <option value="">Add affected item...</option>
                                        {allItems
                                            .filter(item => item.id !== selectedItem.id && !(selectedItem.relationships?.affects || []).includes(item.id))
                                            .map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name || item.type} ({item.id.slice(-4)})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            {/* References */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">References</label>
                                <p className="text-xs text-neutral-400 mb-2">Items này tham chiếu đến (để hiển thị data từ item khác)</p>
                                <div className="space-y-2">
                                    {(selectedItem.relationships?.references || []).map((refId, idx) => {
                                        const refItem = allItems.find(i => i.id === refId);
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-neutral-50 rounded border border-neutral-200">
                                                <span className="text-xs text-neutral-700">
                                                    {refItem ? (refItem.name || refItem.type) : refId}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const newReferences = (selectedItem.relationships?.references || []).filter(id => id !== refId);
                                                        onUpdateItem(selectedItem.id, {
                                                            ...selectedItem,
                                                            relationships: {
                                                                ...(selectedItem.relationships || {}),
                                                                references: newReferences
                                                            }
                                                        });
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const newReferences = [...(selectedItem.relationships?.references || []), e.target.value];
                                                onUpdateItem(selectedItem.id, {
                                                    ...selectedItem,
                                                    relationships: {
                                                        ...(selectedItem.relationships || {}),
                                                        references: newReferences
                                                    }
                                                });
                                                e.target.value = '';
                                            }
                                        }}
                                        className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                    >
                                        <option value="">Add reference...</option>
                                        {allItems
                                            .filter(item => item.id !== selectedItem.id && !(selectedItem.relationships?.references || []).includes(item.id))
                                            .map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name || item.type} ({item.id.slice(-4)})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </>
                ) : activeTab === 'properties' ? (
                    <>
                {/* 1. NỘI DUNG (Content) */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                        <FiType /> Nội dung
                    </h4>

                    {/* Label / Text */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Label / Text</label>
                        <input
                            type="text"
                            value={selectedItem.props?.label || ''}
                            onChange={(e) => handleChange('props', 'label', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none transition-all"
                            placeholder="Nhập nội dung..."
                        />
                    </div>

                    {/* Placeholder (Chỉ cho Input) */}
                    {selectedItem.type === 'input' && (
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Placeholder</label>
                            <input
                                type="text"
                                value={selectedItem.props?.placeholder || ''}
                                onChange={(e) => handleChange('props', 'placeholder', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none transition-all"
                            />
                        </div>
                    )}
                </div>

                <hr className="border-neutral-100" />

                {/* 2. KÍCH THƯỚC & BỐ CỤC (Layout) */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                        <FiMaximize /> Kích thước & Layout
                    </h4>

                    {/* Width / Height */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Width</label>
                            <input
                                type="text"
                                value={selectedItem.style?.width || 'auto'}
                                onChange={(e) => handleChange('style', 'width', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none"
                                placeholder="e.g. 100%, 200px"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Height</label>
                            <input
                                type="text"
                                value={selectedItem.style?.height || 'auto'}
                                onChange={(e) => handleChange('style', 'height', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none"
                                placeholder="e.g. auto, 50px"
                            />
                        </div>
                    </div>

                    {/* Padding / Margin (TÙY CHỈNH) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Padding</label>
                            <input
                                type="text"
                                value={selectedItem.style?.padding || '0px'}
                                onChange={(e) => handleChange('style', 'padding', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none"
                                placeholder="e.g. 10px 20px"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Margin</label>
                            <input
                                type="text"
                                value={selectedItem.style?.margin || '0px'}
                                onChange={(e) => handleChange('style', 'margin', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none"
                                placeholder="e.g. 0px auto"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-neutral-100" />

                {/* 3. MÀU SẮC (Appearance) */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                        <FiMonitor /> Giao diện
                    </h4>

                    {/* Background Color */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Màu nền (Background)</label>
                        <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-lg border border-neutral-200 overflow-hidden shrink-0">
                                <input
                                    type="color"
                                    value={selectedItem.style?.backgroundColor || '#ffffff'}
                                    onChange={(e) => handleChange('style', 'backgroundColor', e.target.value)}
                                    className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                />
                            </div>
                            <input
                                type="text"
                                value={selectedItem.style?.backgroundColor || 'transparent'}
                                onChange={(e) => handleChange('style', 'backgroundColor', e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none uppercase"
                            />
                        </div>
                    </div>

                    {/* Text Color */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Màu chữ (Text Color)</label>
                        <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-lg border border-neutral-200 overflow-hidden shrink-0">
                                <input
                                    type="color"
                                    value={selectedItem.style?.color || '#000000'}
                                    onChange={(e) => handleChange('style', 'color', e.target.value)}
                                    className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                />
                            </div>
                            <input
                                type="text"
                                value={selectedItem.style?.color || 'inherit'}
                                onChange={(e) => handleChange('style', 'color', e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 outline-none uppercase"
                            />
                        </div>
                    </div>
                </div>
                    </>
                ) : (
                    /* TAB EVENTS */
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiZap /> Events
                            </h4>
                        </div>
                        
                        {availableEvents.length === 0 ? (
                            <p className="text-sm text-neutral-400 text-center py-4">
                                Component này không hỗ trợ events.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {availableEvents.map((eventType) => {
                                    const currentProps = selectedItem.props || {};
                                    const currentEvents = currentProps.events || {};
                                    const event = currentEvents[eventType];
                                    const hasEvent = !!event;
                                    
                                    return (
                                        <div key={eventType} className="border border-neutral-200 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium text-neutral-700">{eventType}</label>
                                                {hasEvent ? (
                                                    <button
                                                        onClick={() => handleRemoveEvent(eventType)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        title="Remove Event"
                                                    >
                                                        <FiX className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddEvent(eventType)}
                                                        className="text-sage-600 hover:text-sage-700 p-1"
                                                        title="Add Event"
                                                    >
                                                        <FiPlus className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {hasEvent && (
                                                <>
                                                    {/* Action Type */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Action Type</label>
                                                        <select
                                                            value={event.type || 'notification'}
                                                            onChange={(e) => handleEventChange(eventType, 'type', e.target.value)}
                                                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                                        >
                                                            <option value="navigate">Navigate to Page</option>
                                                            <option value="notification">Show Notification</option>
                                                            <option value="api">Call API</option>
                                                            <option value="modal">Open Modal</option>
                                                            <option value="variable">Update Variable</option>
                                                        </select>
                                                    </div>
                                                    
                                                    {/* Action Config - Navigate */}
                                                    {event.type === 'navigate' && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Route</label>
                                                            <input
                                                                type="text"
                                                                value={event.config?.route || ''}
                                                                onChange={(e) => handleEventChange(eventType, 'config', { ...(event.config || {}), route: e.target.value })}
                                                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                                                placeholder="/dashboard"
                                                            />
                                                        </div>
                                                    )}
                                                    
                                                    {/* Action Config - Notification */}
                                                    {event.type === 'notification' && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Message</label>
                                                            <textarea
                                                                value={event.config?.message || ''}
                                                                onChange={(e) => handleEventChange(eventType, 'config', { ...(event.config || {}), message: e.target.value })}
                                                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                                                rows="2"
                                                                placeholder="Enter notification message..."
                                                            />
                                                        </div>
                                                    )}
                                                    
                                                    {/* Action Config - API */}
                                                    {event.type === 'api' && (
                                                        <>
                                                            <div>
                                                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Endpoint</label>
                                                                <input
                                                                    type="text"
                                                                    value={event.config?.endpoint || ''}
                                                                    onChange={(e) => handleEventChange(eventType, 'config', { ...(event.config || {}), endpoint: e.target.value })}
                                                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                                                    placeholder="/api/endpoint"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Method</label>
                                                                <select
                                                                    value={event.config?.method || 'GET'}
                                                                    onChange={(e) => handleEventChange(eventType, 'config', { ...(event.config || {}), method: e.target.value })}
                                                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                                                >
                                                                    <option value="GET">GET</option>
                                                                    <option value="POST">POST</option>
                                                                    <option value="PUT">PUT</option>
                                                                    <option value="DELETE">DELETE</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Params (JSON)</label>
                                                                <textarea
                                                                    value={event.config?.params ? JSON.stringify(event.config.params, null, 2) : '{}'}
                                                                    onChange={(e) => {
                                                                        try {
                                                                            const value = e.target.value.trim();
                                                                            if (value === '') {
                                                                                handleEventChange(eventType, 'config', { ...(event.config || {}), params: {} });
                                                                                return;
                                                                            }
                                                                            const params = JSON.parse(value);
                                                                            if (typeof params === 'object' && params !== null) {
                                                                                handleEventChange(eventType, 'config', { ...(event.config || {}), params });
                                                                            }
                                                                        } catch {
                                                                            // Invalid JSON, ignore - user đang gõ
                                                                        }
                                                                    }}
                                                                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none font-mono"
                                                                    rows="3"
                                                                    placeholder='{"key": "value"}'
                                                                />
                                                                <p className="text-xs text-neutral-400 mt-1">Nhập JSON hợp lệ, ví dụ: &#123;"key": "value"&#125;</p>
                                                            </div>
                                                        </>
                                                    )}
                                                    
                                                    {/* Action Config - Modal */}
                                                    {event.type === 'modal' && (
                                                        <>
                                                            <div>
                                                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Title</label>
                                                                <input
                                                                    type="text"
                                                                    value={event.config?.title || ''}
                                                                    onChange={(e) => handleEventChange(eventType, 'config', { ...(event.config || {}), title: e.target.value })}
                                                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                                                    placeholder="Modal Title"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Content</label>
                                                                <textarea
                                                                    value={event.config?.content || ''}
                                                                    onChange={(e) => handleEventChange(eventType, 'config', { ...(event.config || {}), content: e.target.value })}
                                                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                                                    rows="3"
                                                                    placeholder="Modal content..."
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                    
                                                    {/* Action Config - Variable */}
                                                    {event.type === 'variable' && (
                                                        <>
                                                            <div>
                                                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Variable Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={event.config?.variableName || ''}
                                                                    onChange={(e) => handleEventChange(eventType, 'config', { ...(event.config || {}), variableName: e.target.value })}
                                                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                                                    placeholder="variableName"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Value</label>
                                                                <input
                                                                    type="text"
                                                                    value={event.config?.value || ''}
                                                                    onChange={(e) => handleEventChange(eventType, 'config', { ...(event.config || {}), value: e.target.value })}
                                                                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/10 outline-none"
                                                                    placeholder="New value"
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* DELETE BUTTON */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50">
                <button
                    onClick={() => onDeleteItem(selectedItem.id)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
                >
                    <FiTrash2 /> Xóa thành phần này
                </button>
            </div>
        </div>
    );
};

export default PropertiesPanel;