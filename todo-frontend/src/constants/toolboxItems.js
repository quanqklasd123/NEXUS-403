// src/constants/toolboxItems.js
import { 
    FiBox, FiLayout, FiType, FiImage, FiUploadCloud,
    FiGrid, FiCreditCard, FiPieChart, FiMinus, FiCheckSquare, FiList,
    FiCalendar, FiFileText, FiUpload, FiToggleRight, FiTable, FiList as FiListView,
    FiBarChart2, FiLayers, FiMaximize2
} from 'react-icons/fi';

export const TOOLS = [
    // === LAYOUT & STRUCTURE ===
    { type: 'container', label: 'Container', icon: FiLayout, defaultProps: { label: 'Container', events: {} }, defaultStyle: { width: '100%', height: '150px', backgroundColor: '#f8fafc', padding: '20px', margin: '0px', border: '1px dashed #cbd5e1' } },
    { type: 'row', label: 'Row (Flex)', icon: FiGrid, defaultProps: { label: 'Row' }, defaultStyle: { width: '100%', height: 'auto', display: 'flex', gap: '10px', padding: '10px', border: '1px dashed #94a3b8' } },
    { type: 'grid', label: 'Grid (Columns)', icon: FiGrid, defaultProps: { label: 'Grid', columns: '3' }, defaultStyle: { width: '100%', height: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '10px', border: '1px dashed #94a3b8' } },
    { type: 'divider', label: 'Divider', icon: FiMinus, defaultProps: { label: '' }, defaultStyle: { width: '100%', height: '1px', backgroundColor: '#e2e8f0', margin: '10px 0' } },
    { type: 'tabs', label: 'Tabs', icon: FiLayers, defaultProps: { label: 'Tabs', tabs: ['Tab 1', 'Tab 2', 'Tab 3'] }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' } },
    { type: 'modal', label: 'Modal / Popup', icon: FiMaximize2, defaultProps: { label: 'Modal', title: 'Modal Title' }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } },
    
    // === DISPLAY ===
    { type: 'card', label: 'Card', icon: FiCreditCard, defaultProps: { label: 'Card Content', events: {} }, defaultStyle: { width: '300px', height: '200px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '20px', border: '1px solid #e2e8f0'} },
    { type: 'chart', label: 'Chart (Mock)', icon: FiPieChart, defaultProps: { label: 'Sales Chart' }, defaultStyle: { width: '100%', height: '200px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534'} },
    { type: 'image', label: 'Image', icon: FiImage, defaultProps: { label: 'Image' }, defaultStyle: { width: '100%', height: '200px', backgroundColor: '#e2e8f0', margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    { type: 'text', label: 'Text Block', icon: FiType, defaultProps: { label: 'Lorem ipsum dolor sit amet.' }, defaultStyle: { width: '100%', height: 'auto', color: '#333333', padding: '5px', margin: '5px 0', fontSize: '16px' } },
    { type: 'statCard', label: 'Statistic Card', icon: FiBarChart2, defaultProps: { label: 'Statistic', value: '0', title: 'Total' }, defaultStyle: { width: '200px', height: 'auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' } },
    { type: 'dataTable', label: 'Data Table', icon: FiTable, defaultProps: { label: 'Data Table', columns: ['Column 1', 'Column 2', 'Column 3'] }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' } },
    { type: 'listView', label: 'List View', icon: FiListView, defaultProps: { label: 'List View', items: ['Item 1', 'Item 2', 'Item 3'] }, defaultStyle: { width: '100%', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' } },
    
    // === FORM & INPUT ===
    { type: 'button', label: 'Button', icon: FiBox, defaultProps: { label: 'Click Me', events: {} }, defaultStyle: { width: 'auto', height: 'auto', backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', margin: '5px', borderRadius: '8px', border: 'none', cursor: 'pointer' } },
    { type: 'input', label: 'Input Field', icon: FiType, defaultProps: { label: 'Input', placeholder: 'Enter text...', events: {} }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    { type: 'checkbox', label: 'Checkbox', icon: FiCheckSquare, defaultProps: { label: 'Check me', events: {} }, defaultStyle: { width: 'auto', height: 'auto', margin: '5px', display: 'flex', alignItems: 'center', gap: '8px', color: '#333333' } },
    { type: 'select', label: 'Select / Dropdown', icon: FiList, defaultProps: { label: 'Select Option', events: {} }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    { type: 'datePicker', label: 'Date Picker', icon: FiCalendar, defaultProps: { label: 'Select Date', placeholder: 'Pick a date', events: {} }, defaultStyle: { width: '100%', height: 'auto', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    { type: 'richText', label: 'Rich Text Editor', icon: FiFileText, defaultProps: { label: 'Rich Text', placeholder: 'Enter formatted text...', events: {} }, defaultStyle: { width: '100%', height: '150px', padding: '10px', margin: '5px 0', backgroundColor: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '150px' } },
    { type: 'fileUpload', label: 'File Upload', icon: FiUpload, defaultProps: { label: 'Upload File', placeholder: 'Choose file...', events: {} }, defaultStyle: { width: '100%', height: 'auto', padding: '20px', margin: '5px 0', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } },
    { type: 'switch', label: 'Switch / Toggle', icon: FiToggleRight, defaultProps: { label: 'Toggle', checked: false, events: {} }, defaultStyle: { width: 'auto', height: 'auto', margin: '5px', display: 'flex', alignItems: 'center', gap: '8px', color: '#333333' } },
];

