// src/constants/toolboxItems.js
import { 
    FiBox, FiLayout, FiType, FiImage, FiUploadCloud,
    FiGrid, FiCreditCard, FiPieChart, FiMinus, FiCheckSquare, FiList,
    FiCalendar, FiFileText, FiUpload, FiToggleRight, FiTable, FiList as FiListView,
    FiBarChart2, FiLayers, FiMaximize2, FiColumns, FiFilter, FiSearch, FiPlus,
    FiDatabase, FiSliders, FiArrowDown
} from 'react-icons/fi';

export const TOOLS = [
    // === LAYOUT & STRUCTURE ===
    { type: 'container', label: 'Container', icon: FiLayout, category: 'Layout', defaultProps: { label: 'Container', events: {} }, defaultStyle: { width: '100%', height: '150px', backgroundColor: '#f8fafc', padding: '20px', margin: '0px', border: '1px dashed #cbd5e1' } },
    { type: 'row', label: 'Row (Flex)', icon: FiGrid, category: 'Layout', defaultProps: { label: 'Row' }, defaultStyle: { width: '100%', height: 'auto', display: 'flex', gap: '10px', padding: '10px', border: '1px dashed #94a3b8' } },
    { type: 'grid', label: 'Grid (Columns)', icon: FiGrid, category: 'Layout', defaultProps: { label: 'Grid', columns: '3' }, defaultStyle: { width: '100%', height: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '10px', border: '1px dashed #94a3b8' } },
    { type: 'divider', label: 'Divider', icon: FiMinus, category: 'Layout', defaultProps: { label: '' }, defaultStyle: { width: '100%', height: '1px', backgroundColor: '#e2e8f0', margin: '10px 0' } },
    { type: 'tabs', label: 'Tabs', icon: FiLayers, category: 'Layout', defaultProps: { label: 'Tabs', tabs: ['Tab 1', 'Tab 2', 'Tab 3'] }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' } },
    { type: 'modal', label: 'Modal / Popup', icon: FiMaximize2, category: 'Layout', defaultProps: { label: 'Modal', title: 'Modal Title' }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } },
    
    // === DISPLAY ===
    { type: 'card', label: 'Card', icon: FiCreditCard, category: 'Display', defaultProps: { label: 'Card Content', events: {} }, defaultStyle: { width: '300px', height: '200px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '20px', border: '1px solid #e2e8f0'} },
    { type: 'chart', label: 'Chart (Mock)', icon: FiPieChart, category: 'Display', defaultProps: { label: 'Sales Chart' }, defaultStyle: { width: '100%', height: '200px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534'} },
    { type: 'image', label: 'Image', icon: FiImage, category: 'Display', defaultProps: { label: 'Image' }, defaultStyle: { width: '100%', height: '200px', backgroundColor: '#e2e8f0', margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    { type: 'text', label: 'Text Block', icon: FiType, category: 'Display', defaultProps: { label: 'Lorem ipsum dolor sit amet.' }, defaultStyle: { width: '100%', height: 'auto', color: '#333333', padding: '5px', margin: '5px 0', fontSize: '16px' } },
    { type: 'statCard', label: 'Statistic Card', icon: FiBarChart2, category: 'Display', defaultProps: { label: 'Statistic', value: '0', title: 'Total' }, defaultStyle: { width: '200px', height: 'auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' } },
    { type: 'dataTable', label: 'Data Table', icon: FiTable, category: 'Display', defaultProps: { label: 'Data Table', columns: ['Column 1', 'Column 2', 'Column 3'] }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' } },
    { type: 'listView', label: 'List View', icon: FiListView, category: 'Display', defaultProps: { label: 'List View', items: ['Item 1', 'Item 2', 'Item 3'] }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' } },
    
    // === FORM & INPUT ===
    { type: 'button', label: 'Button', icon: FiBox, category: 'Form', defaultProps: { label: 'Click Me', events: {} }, defaultStyle: { width: 'auto', height: 'auto', backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', margin: '5px', borderRadius: '8px', border: 'none', cursor: 'pointer' } },
    { type: 'input', label: 'Input Field', icon: FiType, category: 'Form', defaultProps: { label: 'Input', placeholder: 'Enter text...', events: {} }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    { type: 'checkbox', label: 'Checkbox', icon: FiCheckSquare, category: 'Form', defaultProps: { label: 'Check me', events: {} }, defaultStyle: { width: 'auto', height: 'auto', margin: '5px', display: 'flex', alignItems: 'center', gap: '8px', color: '#333333' } },
    { type: 'select', label: 'Select / Dropdown', icon: FiList, category: 'Form', defaultProps: { label: 'Select Option', events: {} }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    { type: 'datePicker', label: 'Date Picker', icon: FiCalendar, category: 'Form', defaultProps: { label: 'Select Date', placeholder: 'Pick a date', events: {} }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    { type: 'richText', label: 'Rich Text Editor', icon: FiFileText, category: 'Form', defaultProps: { label: 'Rich Text', placeholder: 'Enter formatted text...', events: {} }, defaultStyle: { width: '100%', height: '150px', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '150px' } },
    { type: 'fileUpload', label: 'File Upload', icon: FiUpload, category: 'Form', defaultProps: { label: 'Upload File', placeholder: 'Choose file...', events: {} }, defaultStyle: { width: '100%', height: 'auto', padding: '20px', margin: '5px 0', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } },
    { type: 'switch', label: 'Switch / Toggle', icon: FiToggleRight, category: 'Form', defaultProps: { label: 'Toggle', checked: false, events: {} }, defaultStyle: { width: 'auto', height: 'auto', margin: '5px', display: 'flex', alignItems: 'center', gap: '8px', color: '#333333' } },

    // === DATA COMPONENTS (Notion-like) - Sử dụng dữ liệu từ API có sẵn ===
    { 
        type: 'taskTable', 
        label: 'Task Table', 
        icon: FiTable, 
        category: 'Data',
        defaultProps: { 
            label: 'Task Table',
            columns: ['title', 'status', 'priority', 'dueDate'],
            showHeader: true,
            allowEdit: true,
            allowDelete: true,
            todoListId: null, // null = tất cả tasks
        }, 
        defaultStyle: { 
            width: '100%', 
            height: 'auto', 
            minHeight: '300px',
            backgroundColor: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            overflow: 'hidden' 
        } 
    },
    { 
        type: 'taskList', 
        label: 'Task List', 
        icon: FiList, 
        category: 'Data',
        defaultProps: { 
            label: 'Task List',
            showCheckbox: true,
            showPriority: true,
            showDueDate: true,
            groupByStatus: false,
            todoListId: null,
        }, 
        defaultStyle: { 
            width: '100%', 
            height: 'auto', 
            minHeight: '200px',
            backgroundColor: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '0' 
        } 
    },
    { 
        type: 'taskBoard', 
        label: 'Kanban Board', 
        icon: FiColumns, 
        category: 'Data',
        defaultProps: { 
            label: 'Kanban Board',
            columns: ['Todo', 'InProgress', 'Done'],
            allowDrag: true,
            showPriority: true,
            showDueDate: true,
            todoListId: null,
        }, 
        defaultStyle: { 
            width: '100%', 
            height: 'auto', 
            minHeight: '400px',
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '16px',
            overflow: 'auto'
        } 
    },
    { 
        type: 'taskCalendar', 
        label: 'Task Calendar', 
        icon: FiCalendar, 
        category: 'Data',
        defaultProps: { 
            label: 'Task Calendar',
            viewMode: 'month', // 'month', 'week', 'day'
            showPriority: true,
            todoListId: null,
        }, 
        defaultStyle: { 
            width: '100%', 
            height: '500px', 
            backgroundColor: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '16px' 
        } 
    },

    // === CONTROL COMPONENTS (Notion-like) ===
    { 
        type: 'viewSwitcher', 
        label: 'View Switcher', 
        icon: FiLayers, 
        category: 'Control',
        defaultProps: { 
            label: 'View Switcher',
            views: ['table', 'list', 'board', 'calendar'],
            defaultView: 'table',
            targetComponentId: null, // ID của component Data để điều khiển
        }, 
        defaultStyle: { 
            width: 'auto', 
            height: 'auto', 
            backgroundColor: '#f1f5f9', 
            borderRadius: '8px', 
            padding: '4px',
            display: 'inline-flex',
            gap: '4px'
        } 
    },
    { 
        type: 'filterBar', 
        label: 'Filter Bar', 
        icon: FiFilter, 
        category: 'Control',
        defaultProps: { 
            label: 'Filter',
            filterFields: ['status', 'priority', 'dueDate'],
            targetComponentId: null,
        }, 
        defaultStyle: { 
            width: 'auto', 
            height: 'auto', 
            backgroundColor: 'transparent', 
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
        } 
    },
    { 
        type: 'searchBox', 
        label: 'Search Box', 
        icon: FiSearch, 
        category: 'Control',
        defaultProps: { 
            label: 'Search',
            placeholder: 'Search tasks...',
            targetComponentId: null,
        }, 
        defaultStyle: { 
            width: '250px', 
            height: 'auto', 
            backgroundColor: '#ffffff', 
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
        } 
    },
    { 
        type: 'sortDropdown', 
        label: 'Sort Dropdown', 
        icon: FiArrowDown, 
        category: 'Control',
        defaultProps: { 
            label: 'Sort by',
            sortFields: ['title', 'status', 'priority', 'dueDate'],
            defaultSort: { field: 'title', order: 'asc' },
            targetComponentId: null,
        }, 
        defaultStyle: { 
            width: 'auto', 
            height: 'auto', 
            backgroundColor: '#ffffff', 
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
        } 
    },
    { 
        type: 'addTaskButton', 
        label: 'Add Task Button', 
        icon: FiPlus, 
        category: 'Control',
        defaultProps: { 
            label: '+ New Task',
            defaultStatus: 'Todo',
            defaultPriority: 'Medium',
            todoListId: null,
        }, 
        defaultStyle: { 
            width: 'auto', 
            height: 'auto', 
            backgroundColor: '#6366f1', 
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500'
        } 
    },
    { 
        type: 'databaseTitle', 
        label: 'Database Title', 
        icon: FiDatabase, 
        category: 'Control',
        defaultProps: { 
            label: 'My Tasks',
            editable: true,
            icon: '📋',
        }, 
        defaultStyle: { 
            width: '100%', 
            height: 'auto', 
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1e293b',
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        } 
    },
];

// Helper: Lấy components theo category
export const getToolsByCategory = () => {
    const categories = {};
    TOOLS.forEach(tool => {
        const cat = tool.category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(tool);
    });
    return categories;
};

// Export categories cho Toolbox UI
export const CATEGORIES = ['Layout', 'Display', 'Form', 'Data', 'Control'];

