// src/utils/getCategoryByType.js

/**
 * Xác định category của component dựa trên type
 * @param {string} type - Type của component
 * @returns {string} - Category: 'Layout', 'Display', 'Form', 'Data', 'Control', hoặc 'Other'
 */
export const getCategoryByType = (type) => {
    const layoutTypes = ['container', 'row', 'divider'];
    const displayTypes = ['card', 'image', 'text'];
    const formTypes = ['button', 'input', 'checkbox'];
    const dataTypes = ['taskTable', 'taskList', 'taskBoard', 'taskCalendar'];
    const controlTypes = ['addTaskButton', 'databaseTitle'];
    
    if (layoutTypes.includes(type)) return 'Layout';
    if (displayTypes.includes(type)) return 'Display';
    if (formTypes.includes(type)) return 'Form';
    if (dataTypes.includes(type)) return 'Data';
    if (controlTypes.includes(type)) return 'Control';
    return 'Other';
};

