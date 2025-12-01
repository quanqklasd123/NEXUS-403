
// src/utils/getCategoryByType.js

/**
 * Xác định category của component dựa trên type
 * @param {string} type - Type của component
 * @returns {string} - Category: 'layout', 'form', 'display', hoặc 'other'
 */
export const getCategoryByType = (type) => {
    const layoutTypes = ['container', 'row', 'grid', 'divider', 'tabs', 'modal'];
    const formTypes = ['button', 'input', 'checkbox', 'select', 'datePicker', 'richText', 'fileUpload', 'switch'];
    const displayTypes = ['card', 'chart', 'image', 'text', 'statCard', 'dataTable', 'listView'];
    
    if (layoutTypes.includes(type)) return 'layout';
    if (formTypes.includes(type)) return 'form';
    if (displayTypes.includes(type)) return 'display';
    return 'other';
};

