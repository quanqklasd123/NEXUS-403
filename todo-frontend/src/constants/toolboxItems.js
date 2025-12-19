// src/constants/toolboxItems.js
import { 
    FiLayout, FiGrid, FiType, FiImage, FiCreditCard,
    FiBox, FiCheckSquare, FiList, FiCalendar, FiTable,
    FiColumns, FiPlus, FiDatabase, FiMinus, FiToggleLeft,
    FiFilter, FiSearch, FiArrowDown, FiRefreshCw
} from 'react-icons/fi';

/**
 * Toolbox Items - Components cần thiết để tạo Todo List App
 * Được tổ chức theo categories: Layout, Display, Form, Data, Control
 * 
 * Mỗi tool có:
 * - type: unique identifier
 * - label: tên hiển thị
 * - icon: React icon component
 * - category: phân loại
 * - description: mô tả ngắn
 * - defaultProps: props mặc định
 * - defaultStyle: style mặc định
 */
export const TOOLS = [
    // ========== LAYOUT ==========
    {
        type: 'container',
        label: 'Container',
        icon: FiLayout,
        category: 'Layout',
        description: 'Container để nhóm các components',
        defaultProps: {
            label: 'Container',
            events: {}
        },
        defaultStyle: {
            width: '100%',
            height: '200px',
            backgroundColor: '#f8fafc',
            padding: '20px',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px'
        }
    },
    {
        type: 'row',
        label: 'Row',
        icon: FiGrid,
        category: 'Layout',
        description: 'Flex row để sắp xếp components ngang',
        defaultProps: {
            label: 'Row'
        },
        defaultStyle: {
            width: '100%',
            height: 'auto',
            display: 'flex',
            gap: '10px',
            padding: '10px',
            border: '1px dashed #94a3b8',
            borderRadius: '8px'
        }
    },
    {
        type: 'divider',
        label: 'Divider',
        icon: FiMinus,
        category: 'Layout',
        description: 'Đường phân cách',
        defaultProps: {
            label: ''
        },
        defaultStyle: {
            width: '100%',
            height: '1px',
            backgroundColor: '#e2e8f0',
            margin: '10px 0'
        }
    },
    {
        type: 'grid',
        label: 'Grid',
        icon: FiGrid,
        category: 'Layout',
        description: 'Grid layout để tạo lưới',
        defaultProps: {
            label: 'Grid',
            columns: 3,
            gap: '10px'
        },
        defaultStyle: {
            width: '100%',
            height: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            padding: '10px',
            border: '1px dashed #94a3b8',
            borderRadius: '8px'
        }
    },

    // ========== DISPLAY ==========
    {
        type: 'text',
        label: 'Text',
        icon: FiType,
        category: 'Display',
        description: 'Text block',
        defaultProps: {
            label: 'Text content'
        },
        defaultStyle: {
            width: '100%',
            height: 'auto',
            color: '#333333',
            padding: '5px',
            fontSize: '16px'
        }
    },
    {
        type: 'card',
        label: 'Card',
        icon: FiCreditCard,
        category: 'Display',
        description: 'Card container',
        defaultProps: {
            label: 'Card Content',
            events: {}
        },
        defaultStyle: {
            width: '300px',
            height: '200px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '20px',
            border: '1px solid #e2e8f0'
        }
    },
    {
        type: 'image',
        label: 'Image',
        icon: FiImage,
        category: 'Display',
        description: 'Image placeholder',
        defaultProps: {
            label: 'Image',
            src: '',
            alt: 'Image'
        },
        defaultStyle: {
            width: '100%',
            height: '200px',
            backgroundColor: '#e2e8f0',
            margin: '10px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px'
        }
    },

    // ========== FORM ==========
    {
        type: 'button',
        label: 'Button',
        icon: FiBox,
        category: 'Form',
        description: 'Button component',
        defaultProps: {
            label: 'Button',
            events: {}
        },
        defaultStyle: {
            width: 'auto',
            height: 'auto',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500'
        }
    },
    {
        type: 'input',
        label: 'Input',
        icon: FiType,
        category: 'Form',
        description: 'Input field',
        defaultProps: {
            label: 'Input',
            placeholder: 'Enter text...',
            events: {}
        },
        defaultStyle: {
            width: '100%',
            height: 'auto',
            padding: '10px',
            backgroundColor: '#ffffff',
            color: '#333333',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
        }
    },
    {
        type: 'checkbox',
        label: 'Checkbox',
        icon: FiCheckSquare,
        category: 'Form',
        description: 'Checkbox input',
        defaultProps: {
            label: 'Checkbox',
            checked: false,
            events: {}
        },
        defaultStyle: {
            width: 'auto',
            height: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#333333'
        }
    },
    {
        type: 'select',
        label: 'Select',
        icon: FiArrowDown,
        category: 'Form',
        description: 'Dropdown chọn',
        defaultProps: {
            label: 'Select option',
            options: ['Option 1', 'Option 2', 'Option 3'],
            placeholder: 'Chọn...',
            events: {}
        },
        defaultStyle: {
            width: '100%',
            height: 'auto',
            padding: '10px',
            backgroundColor: '#ffffff',
            color: '#333333',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
        }
    },
    {
        type: 'datePicker',
        label: 'Date Picker',
        icon: FiCalendar,
        category: 'Form',
        description: 'Chọn ngày',
        defaultProps: {
            label: 'Date Picker',
            placeholder: 'Select Date',
            events: {}
        },
        defaultStyle: {
            width: '100%',
            height: 'auto',
            padding: '10px',
            backgroundColor: '#ffffff',
            color: '#333333',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
        }
    },

    // ========== DATA (Todo List Components) ==========
    {
        type: 'database',
        label: 'Database',
        icon: FiDatabase,
        category: 'Data',
        description: 'Quản lý dữ liệu (CRUD operations)',
        defaultProps: {
            label: 'Database',
            collectionName: 'items',
            allowCreate: true,
            allowEdit: true,
            allowDelete: true,
            showSearch: true,
            showFilter: true,
            showSort: true
        },
        defaultStyle: {
            width: '100%',
            height: 'auto',
            minHeight: '400px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px'
        }
    },
    {
        type: 'viewSwitcher',
        label: 'View Switcher',
        icon: FiRefreshCw,
        category: 'Data',
        description: 'Chuyển đổi view (list/grid)',
        defaultProps: {
            label: 'View Switcher',
            views: ['table', 'list', 'board', 'calendar'],
            defaultView: 'table'
        },
        defaultStyle: {
            width: 'auto',
            height: 'auto',
            padding: '4px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            gap: '4px'
        }
    },
    {
        type: 'filterBar',
        label: 'Filter Bar',
        icon: FiFilter,
        category: 'Data',
        description: 'Thanh lọc dữ liệu',
        defaultProps: {
            label: 'Filter Bar',
            filters: ['status', 'priority', 'dueDate']
        },
        defaultStyle: {
            width: 'fit-content',
            height: 'auto',
            padding: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
        }
    },
    {
        type: 'searchBox',
        label: 'Search Box',
        icon: FiSearch,
        category: 'Data',
        description: 'Tìm kiếm',
        defaultProps: {
            label: 'Search Box',
            placeholder: 'Search...',
            debounce: 300
        },
        defaultStyle: {
            width: '100%',
            height: 'auto',
            padding: '10px',
            backgroundColor: '#ffffff',
            color: '#333333',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
        }
    },
    {
        type: 'sortDropdown',
        label: 'Sort Dropdown',
        icon: FiArrowDown,
        category: 'Data',
        description: 'Sắp xếp',
        defaultProps: {
            label: 'Sort Dropdown',
            options: [
                { value: 'title-asc', label: 'Title A-Z' },
                { value: 'title-desc', label: 'Title Z-A' },
                { value: 'date-asc', label: 'Date Oldest' },
                { value: 'date-desc', label: 'Date Newest' }
            ],
            defaultSort: 'title-asc'
        },
        defaultStyle: {
            width: 'auto',
            height: 'auto',
            padding: '8px 12px',
            backgroundColor: '#ffffff',
            color: '#333333',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
        }
    },
    {
        type: 'taskTable',
        label: 'Task Table',
        icon: FiTable,
        category: 'Data',
        description: 'Table view của tasks',
        defaultProps: {
            label: 'Task Table',
            columns: ['title', 'status', 'priority', 'dueDate', 'category'],
            showHeader: true,
            allowEdit: true,
            allowDelete: true,
            todoListId: null
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
        description: 'List view của tasks',
        defaultProps: {
            label: 'Task List',
            showCheckbox: true,
            showPriority: true,
            showDueDate: true,
            showCategory: true,
            groupByStatus: false,
            todoListId: null
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
        description: 'Kanban board view',
        defaultProps: {
            label: 'Kanban Board',
            columns: ['Todo', 'InProgress', 'Done'],
            allowDrag: true,
            showPriority: true,
            showDueDate: true,
            todoListId: null
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
        description: 'Calendar view của tasks',
        defaultProps: {
            label: 'Task Calendar',
            viewMode: 'month',
            showPriority: true,
            todoListId: null
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

    // ========== CONTROL ==========
    {
        type: 'addTaskButton',
        label: 'Add Task',
        icon: FiPlus,
        category: 'Control',
        description: 'Button để thêm task mới',
        defaultProps: {
            label: 'New Task',
            defaultStatus: 'Todo',
            defaultPriority: 'Medium'
        },
        defaultStyle: {
            width: 'auto',
            height: 'auto',
            backgroundColor: '#000000',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500'
        }
    },
    {
        type: 'switch',
        label: 'Switch',
        icon: FiToggleLeft,
        category: 'Control',
        description: 'Công tắc bật/tắt',
        defaultProps: {
            label: 'Switch',
            checked: false,
            events: {}
        },
        defaultStyle: {
            width: 'auto',
            height: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#333333'
        }
    },
    {
        type: 'databaseTitle',
        label: 'Title',
        icon: FiDatabase,
        category: 'Control',
        description: 'Database/List title',
        defaultProps: {
            label: 'My Tasks',
            editable: true,
            icon: '📋'
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
    }
];

// Categories cho Toolbox UI - thứ tự hiển thị
export const CATEGORIES = ['Layout', 'Display', 'Form', 'Data', 'Control'];

/**
 * Helper: Lấy tools theo category
 */
export const getToolsByCategory = () => {
    const categories = {};
    TOOLS.forEach(tool => {
        const cat = tool.category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(tool);
    });
    return categories;
};

/**
 * Helper: Lấy tool theo type
 */
export const getToolByType = (type) => {
    return TOOLS.find(tool => tool.type === type);
};

/**
 * Helper: Kiểm tra xem component có phải là control component không
 * (components nhỏ, fit-content)
 */
export const isControlComponent = (type) => {
    const controlTypes = [
        'button', 'checkbox', 'addTaskButton', 'databaseTitle',
        'input', 'select', 'datePicker', 'switch'
    ];
    return controlTypes.includes(type);
};

/**
 * Helper: Kiểm tra xem component có phải là layout component không
 */
export const isLayoutComponent = (type) => {
    return ['container', 'row', 'grid'].includes(type);
};
