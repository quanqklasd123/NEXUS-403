// src/components/builder/RenderComponent.jsx
import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
    FiX, FiImage, FiPieChart, FiUpload, FiCalendar
} from 'react-icons/fi';
import { handleEvent } from '../../utils/eventHandler';
import { evaluateCondition, getConditionalStyle, getConditionalProps, resolveDataBinding } from '../../utils/conditionEvaluator';

// Import Data & Control renders
import {
    TaskTableRender,
    TaskListRender,
    TaskBoardRender,
    TaskCalendarRender,
    ViewSwitcherRender,
    ViewSidebarRender,
    FilterBarRender,
    SearchBoxRender,
    SortDropdownRender,
    AddTaskButtonRender,
    DatabaseTitleRender,
} from './renders';

// Helper component để wrap children trong DraggableComponent
const DraggableChildComponent = ({ child, items, isSelected, onClick, isPreview, navigate, context }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: child.id,
        disabled: isPreview,
        data: {
            type: 'component',
            item: child
        }
    });

    const childStyle = child.style || {};
    const wrapperStyle = {
        width: childStyle.width || '100%',
        minHeight: childStyle.minHeight || '50px',
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 1000 : (isSelected ? 100 : 1),
        opacity: isDragging ? 0.8 : 1,
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
    };

    return (
        <div
            ref={setNodeRef}
            style={wrapperStyle}
            {...(isPreview ? {} : { ...attributes, ...listeners })}
            onClick={(e) => {
                e.stopPropagation();
                if (!isPreview && !isDragging) {
                    onClick(child.id);
                }
            }}
            className={isDragging ? 'shadow-2xl' : ''}
        >
            <RenderComponent 
                item={child} 
                items={items}
                isSelected={isSelected} 
                onClick={onClick} 
                isPreview={isPreview} 
                navigate={navigate}
                context={context}
            />
        </div>
    );
};

const RenderComponent = ({ item, items = [], isSelected, onClick, isPreview = false, navigate = null, context = {} }) => {
    // Make container/row/grid droppable (hooks must be called before any early returns)
    const isDroppableType = !isPreview && (item.type === 'container' || item.type === 'row' || item.type === 'grid');
    const droppableResult = useDroppable({ 
        id: item.id,
        disabled: !isDroppableType // Disable if not a droppable type
    });
    const { setNodeRef: setDroppableRef, isOver } = isDroppableType ? droppableResult : { setNodeRef: () => {}, isOver: false };
    
    // Check visibility condition
    const shouldShow = item.visibility?.condition 
        ? evaluateCondition(item.visibility.condition, context)
        : (item.visibility?.default !== undefined ? item.visibility.default : true);
    
    if (!shouldShow) {
        return null; // Don't render if condition is false
    }
    
    // Check dependencies (disable if dependencies are invalid)
    const checkDependencies = (item, allItems) => {
        if (!item.relationships?.dependsOn || item.relationships.dependsOn.length === 0) {
            return true; // No dependencies, always enabled
        }
        
        // For now, we'll just check if dependencies exist
        // In the future, can add validation logic here
        const dependencies = item.relationships.dependsOn
            .map(id => allItems.find(i => i.id === id))
            .filter(Boolean);
        
        // If all dependencies exist, consider it valid
        // Can be extended to check if dependencies have valid values
        return dependencies.length === item.relationships.dependsOn.length;
    };
    
    const dependenciesValid = checkDependencies(item, items);
    
    // Get conditional style and props
    const finalStyle = getConditionalStyle(item, context);
    const finalProps = getConditionalProps(item, context);
    
    // Apply dependency-based disabled state
    if (!dependenciesValid && isPreview) {
        finalProps.disabled = true;
    }
    
    // Merge finalProps into item.props for rendering
    const mergedProps = { ...item.props, ...finalProps };
    
    // Lấy children của item này (sắp xếp theo order)
    const childItems = items
        .filter(child => child.parentId === item.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const contentStyle = { ...finalStyle, width: '100%', height: '100%', margin: 0, position: undefined, border: undefined };

    const content = () => {
        switch (item.type) {
            // === LAYOUT ===
            case 'container': {
                const containerProps = {};
                if (isPreview && mergedProps.events?.onClick) {
                    containerProps.onClick = async (e) => {
                        e.stopPropagation();
                        await handleEvent(mergedProps.events.onClick, navigate);
                    };
                    containerProps.className = 'flex items-center justify-center text-neutral-400 text-sm cursor-pointer';
                } else {
                    containerProps.className = 'flex items-center justify-center text-neutral-400 text-sm';
                }
                
                // Add droppable ref and visual feedback
                if (isDroppableType) {
                    containerProps.ref = setDroppableRef;
                    if (isOver) {
                        containerProps.className += ' ring-2 ring-sage-400 bg-sage-50';
                    }
                }
                
                // Render children nếu có
                if (childItems.length > 0) {
                    return (
                        <div style={contentStyle} {...containerProps}>
                            {childItems.map(child => (
                                <DraggableChildComponent
                                    key={child.id}
                                    child={child}
                                    items={items}
                                    isSelected={child.id === isSelected}
                                    onClick={onClick}
                                    isPreview={isPreview}
                                    navigate={navigate}
                                    context={context}
                                />
                            ))}
                        </div>
                    );
                }
                // Ẩn placeholder text khi ở preview mode
                if (isPreview) return null;
                return <div style={contentStyle} {...containerProps}>{mergedProps.label || 'Container'} (Drop items here)</div>;
            }
            case 'row': {
                const rowClassName = `flex items-center justify-center text-neutral-400 text-sm ${isDroppableType && isOver ? 'ring-2 ring-sage-400 bg-sage-50' : ''}`;
                
                if (childItems.length > 0) {
                    return (
                        <div style={contentStyle} className={rowClassName} ref={isDroppableType ? setDroppableRef : undefined}>
                            {childItems.map(child => (
                                <DraggableChildComponent
                                    key={child.id}
                                    child={child}
                                    items={items}
                                    isSelected={child.id === isSelected}
                                    onClick={onClick}
                                    isPreview={isPreview}
                                    navigate={navigate}
                                    context={context}
                                />
                            ))}
                        </div>
                    );
                }
                // Ẩn placeholder text khi ở preview mode
                if (isPreview) return null;
                return <div style={contentStyle} className={rowClassName} ref={isDroppableType ? setDroppableRef : undefined}>Row (Flex)</div>;
            }
            case 'grid': {
                const gridClassName = `flex items-center justify-center text-neutral-400 text-sm ${isDroppableType && isOver ? 'ring-2 ring-sage-400 bg-sage-50' : ''}`;
                
                if (childItems.length > 0) {
                    return (
                        <div style={contentStyle} className={gridClassName} ref={isDroppableType ? setDroppableRef : undefined}>
                            {childItems.map(child => (
                                <DraggableChildComponent
                                    key={child.id}
                                    child={child}
                                    items={items}
                                    isSelected={child.id === isSelected}
                                    onClick={onClick}
                                    isPreview={isPreview}
                                    navigate={navigate}
                                    context={context}
                                />
                            ))}
                        </div>
                    );
                }
                // Ẩn placeholder text khi ở preview mode
                if (isPreview) return null;
                return <div style={contentStyle} className={gridClassName} ref={isDroppableType ? setDroppableRef : undefined}>Grid ({mergedProps.columns || '3'} columns)</div>;
            }
            case 'divider': return <div style={contentStyle}></div>;
            case 'tabs': return (
                <div style={contentStyle} className={!isPreview ? 'pointer-events-none' : ''}>
                    <div className="flex border-b border-neutral-200 mb-2">
                        {(mergedProps.tabs || ['Tab 1', 'Tab 2']).slice(0, 3).map((tab, idx) => (
                            <div key={idx} className={`px-4 py-2 text-sm font-medium cursor-pointer ${idx === 0 ? 'border-b-2 border-sage-600 text-sage-600' : 'text-neutral-500'} ${isPreview ? 'hover:text-sage-600' : ''}`}>
                                {tab}
                            </div>
                        ))}
                    </div>
                    <div className="p-2 text-sm text-neutral-400">Tab content area</div>
                </div>
            );
            case 'modal': {
                const title = resolveDataBinding(mergedProps.title, context) || mergedProps.title || 'Modal Title';
                const label = resolveDataBinding(mergedProps.label, context) || mergedProps.label || 'Modal content goes here';
                return (
                    <div style={contentStyle} className={!isPreview ? 'pointer-events-none' : ''}>
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-neutral-200">
                            <h3 className="font-semibold text-neutral-800">{title}</h3>
                            {isPreview && <button className="p-1 hover:bg-neutral-100 rounded"><FiX className="w-4 h-4 text-neutral-400" /></button>}
                            {!isPreview && <FiX className="w-4 h-4 text-neutral-400" />}
                        </div>
                        <p className="text-sm text-neutral-500">{label}</p>
                    </div>
                );
            }
            
            // === DISPLAY ===
            case 'card': {
                const cardProps = {};
                if (isPreview && mergedProps.events?.onClick) {
                    cardProps.onClick = async (e) => {
                        e.stopPropagation();
                        await handleEvent(mergedProps.events.onClick, navigate);
                    };
                    cardProps.className = 'cursor-pointer';
                }
                const label = resolveDataBinding(mergedProps.label, context) || mergedProps.label || '';
                return <div style={contentStyle} {...cardProps}><h3 className="font-bold text-lg mb-2">Card Title</h3><p className="text-sm text-gray-500">{label}</p></div>;
            }
            case 'chart': {
                const label = resolveDataBinding(mergedProps.label, context) || mergedProps.label || '';
                return <div style={contentStyle} className="flex flex-col items-center justify-center"><FiPieChart className="w-10 h-10 mb-2 opacity-50" /><span className="font-medium">{label}</span></div>;
            }
            case 'image': return <div style={contentStyle} className="flex items-center justify-center text-neutral-400"><FiImage className="w-8 h-8" /></div>;
            case 'text': {
                const label = resolveDataBinding(mergedProps.label, context) || mergedProps.label || '';
                return <p style={contentStyle}>{label}</p>;
            }
            case 'statCard': {
                const value = resolveDataBinding(mergedProps.value, context) || mergedProps.value || '0';
                const title = resolveDataBinding(mergedProps.title, context) || mergedProps.title || 'Total';
                return (
                    <div style={contentStyle} className={!isPreview ? 'pointer-events-none' : ''}>
                        <div className="text-3xl font-bold text-sage-600 mb-1">{value}</div>
                        <div className="text-sm text-neutral-500">{title}</div>
                    </div>
                );
            }
            case 'dataTable': return (
                <div style={contentStyle} className={!isPreview ? 'pointer-events-none' : ''}>
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50">
                            <tr>
                                {(mergedProps.columns || ['Column 1', 'Column 2', 'Column 3']).slice(0, 3).map((col, idx) => (
                                    <th key={idx} className="px-4 py-2 text-left font-medium text-neutral-700 border-b border-neutral-200">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3].map(row => (
                                <tr key={row} className={`border-b border-neutral-100 ${isPreview ? 'hover:bg-neutral-50 cursor-pointer' : ''}`}>
                                    {(mergedProps.columns || ['Column 1', 'Column 2', 'Column 3']).slice(0, 3).map((_, idx) => (
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
                        {(mergedProps.items || ['Item 1', 'Item 2', 'Item 3']).slice(0, 5).map((listItem, idx) => (
                            <li key={idx} className={`flex items-center gap-2 p-2 rounded ${isPreview ? 'hover:bg-neutral-50 cursor-pointer' : ''}`}>
                                <div className="w-2 h-2 bg-sage-400 rounded-full"></div>
                                <span className="text-sm text-neutral-700">{listItem}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
            
            // === FORM ===
            case 'button': {
                const buttonProps = {};
                if (isPreview && mergedProps.events?.onClick) {
                    buttonProps.onClick = async (e) => {
                        e.stopPropagation();
                        await handleEvent(mergedProps.events.onClick, navigate);
                    };
                }
                // Apply conditional props (disabled, etc.)
                if (mergedProps.disabled !== undefined) {
                    buttonProps.disabled = mergedProps.disabled;
                }
                const label = resolveDataBinding(mergedProps.label, context) || mergedProps.label || 'Button';
                return <button className="flex items-center justify-center" style={contentStyle} {...buttonProps}>{label}</button>;
            }
            case 'input': {
                const inputProps = {
                    type: 'text',
                    placeholder: resolveDataBinding(mergedProps.placeholder, context) || mergedProps.placeholder,
                    className: 'outline-none',
                    style: contentStyle,
                    readOnly: !isPreview || mergedProps.readOnly,
                    disabled: !isPreview || mergedProps.disabled
                };
                if (isPreview && mergedProps.events) {
                    if (mergedProps.events.onChange) {
                        inputProps.onChange = async () => {
                            await handleEvent(mergedProps.events.onChange, navigate);
                        };
                    }
                    if (mergedProps.events.onFocus) {
                        inputProps.onFocus = async () => {
                            await handleEvent(mergedProps.events.onFocus, navigate);
                        };
                    }
                    if (mergedProps.events.onBlur) {
                        inputProps.onBlur = async () => {
                            await handleEvent(mergedProps.events.onBlur, navigate);
                        };
                    }
                }
                return <input {...inputProps} />;
            }
            case 'checkbox': {
                const label = resolveDataBinding(mergedProps.label, context) || mergedProps.label || '';
                return <div style={contentStyle} className={`flex items-center gap-2 ${!isPreview ? 'pointer-events-none' : ''}`}><input type="checkbox" className="w-4 h-4" readOnly={!isPreview} disabled={!isPreview || mergedProps.disabled} /><span>{label}</span></div>;
            }
            case 'select': {
                const label = resolveDataBinding(mergedProps.label, context) || mergedProps.label || '';
                return (
                    isPreview ? (
                        <select style={contentStyle} className="outline-none" disabled={mergedProps.disabled}>
                            <option>{label}</option>
                        </select>
                    ) : (
                        <div style={contentStyle} className="flex items-center justify-between px-2 text-gray-500 pointer-events-none"><span>{label}</span><span className="text-xs">▼</span></div>
                    )
                );
            }
            case 'datePicker': {
                const placeholder = resolveDataBinding(mergedProps.placeholder, context) || mergedProps.placeholder || 'Select Date';
                return (
                    isPreview ? (
                        <input type="date" style={contentStyle} className="outline-none" placeholder={placeholder} disabled={mergedProps.disabled} />
                    ) : (
                        <div style={contentStyle} className="pointer-events-none flex items-center justify-between px-2">
                            <span className="text-neutral-500">{placeholder}</span>
                            <FiCalendar className="w-4 h-4 text-neutral-400" />
                        </div>
                    )
                );
            }
            case 'richText': {
                const placeholder = resolveDataBinding(mergedProps.placeholder, context) || mergedProps.placeholder || 'Enter formatted text...';
                return (
                    <div style={contentStyle} className={`border border-neutral-200 rounded p-2 ${!isPreview ? 'pointer-events-none' : ''}`}>
                        {isPreview && (
                            <div className="flex gap-1 mb-2 pb-2 border-b border-neutral-200">
                                <button className="w-6 h-6 text-xs border rounded hover:bg-neutral-100">B</button>
                                <button className="w-6 h-6 text-xs border rounded hover:bg-neutral-100">I</button>
                                <button className="w-6 h-6 text-xs border rounded hover:bg-neutral-100">U</button>
                            </div>
                        )}
                        {isPreview ? (
                            <textarea className="w-full text-sm outline-none min-h-[100px]" placeholder={placeholder} disabled={mergedProps.disabled}></textarea>
                        ) : (
                            <div className="text-sm text-neutral-400 min-h-[100px]">{placeholder}</div>
                        )}
                    </div>
                );
            }
            case 'fileUpload': {
                const placeholder = resolveDataBinding(mergedProps.placeholder, context) || mergedProps.placeholder || 'Click to upload or drag and drop';
                return (
                    <div style={contentStyle} className={`flex flex-col items-center justify-center gap-2 ${!isPreview ? 'pointer-events-none' : ''}`}>
                        <FiUpload className="w-8 h-8 text-neutral-400" />
                        <span className="text-sm text-neutral-500">{placeholder}</span>
                        <span className="text-xs text-neutral-400">PNG, JPG, PDF up to 10MB</span>
                    </div>
                );
            }
            case 'switch': {
                const label = resolveDataBinding(mergedProps.label, context) || mergedProps.label || '';
                const checked = mergedProps.checked || false;
                return (
                    <div style={contentStyle} className={`flex items-center gap-2 ${!isPreview ? 'pointer-events-none' : ''}`}>
                        {isPreview ? (
                            <button 
                                className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-sage-500' : 'bg-neutral-300'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Toggle switch state (có thể cần update item)
                                }}
                                disabled={mergedProps.disabled}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ml-0.5 ${checked ? 'translate-x-5' : ''}`}></div>
                            </button>
                        ) : (
                            <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-sage-500' : 'bg-neutral-300'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ml-0.5 ${checked ? 'translate-x-5' : ''}`}></div>
                            </div>
                        )}
                        <span>{label}</span>
                    </div>
                );
            }

            // === DATA COMPONENTS (Notion-like) ===
            case 'taskTable':
                return <TaskTableRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;
            
            case 'taskList':
                return <TaskListRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;
            
            case 'taskBoard':
                return <TaskBoardRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;
            
            case 'taskCalendar':
                return <TaskCalendarRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;

            // === CONTROL COMPONENTS ===
            case 'viewSwitcher':
                return <ViewSwitcherRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;
            
            case 'viewSidebar':
                return <ViewSidebarRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;
            
            case 'filterBar':
                return <FilterBarRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;
            
            case 'searchBox':
                return <SearchBoxRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;
            
            case 'sortDropdown':
                return <SortDropdownRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;
            
            case 'addTaskButton':
                return <AddTaskButtonRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;
            
            case 'databaseTitle':
                return <DatabaseTitleRender props={mergedProps} style={contentStyle} isPreview={isPreview} />;
            
            default: return null;
        }
    };

    // Wrapper Style: Layout & Background (cho Container/Card)
    const layoutComponents = ['container', 'card', 'row', 'grid', 'image', 'chart', 'tabs', 'modal', 'statCard', 'dataTable', 'listView'];
    const formComponents = ['button', 'input', 'select', 'checkbox', 'text', 'datePicker', 'richText', 'fileUpload', 'switch'];
    const dataComponents = ['taskTable', 'taskList', 'taskBoard', 'taskCalendar'];
    const controlComponents = ['viewSwitcher', 'filterBar', 'searchBox', 'sortDropdown', 'addTaskButton', 'databaseTitle'];
    
    // Border giống nhau trong cả preview và non-preview mode
    const getBorder = () => {
        return item.style.border || 'none';
    };
    
    const wrapperStyle = {
        width: finalStyle.width, height: finalStyle.height, margin: finalStyle.margin,
        position: 'relative', border: getBorder(),
        cursor: 'default', boxSizing: 'border-box', display: finalStyle.display || 'block', gap: finalStyle.gap,
        gridTemplateColumns: finalStyle.gridTemplateColumns, // Cho grid component
        backgroundColor: [...layoutComponents, ...dataComponents].includes(item.type) ? finalStyle.backgroundColor : undefined,
        padding: [...layoutComponents, ...dataComponents].includes(item.type) ? finalStyle.padding : 0,
        borderRadius: finalStyle.borderRadius,
        boxShadow: finalStyle.boxShadow
    };

    // Không có onClick trong cả hai mode để giao diện giống nhau
    const handleClick = undefined;
    const hoverClass = '';

    // Control components - no wrapper, return content directly
    if (controlComponents.includes(item.type)) {
        return content();
    }

    // Với input/button... style nằm trong contentStyle
    if (formComponents.includes(item.type)) {
         return <div onClick={handleClick} style={wrapperStyle} className={`transition-all rounded-sm ${hoverClass}`}>{content()}</div>;
    }
    return <div onClick={handleClick} style={wrapperStyle} className={`transition-all rounded-sm ${hoverClass}`}>{content()}</div>;
};

export default RenderComponent;

