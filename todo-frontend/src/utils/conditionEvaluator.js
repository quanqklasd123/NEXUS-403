// Safe condition evaluator for App Builder
// Evaluates conditions like "{{user.role}} === 'admin'" safely

/**
 * Parse và evaluate condition string
 * @param {string} condition - Condition string, e.g. "{{user.role}} === 'admin'"
 * @param {object} context - Context object containing variables
 * @returns {boolean} - Result of condition evaluation
 */
export const evaluateCondition = (condition, context = {}) => {
    if (!condition || typeof condition !== 'string') {
        return true; // Default to visible if no condition
    }

    try {
        // Replace {{variable}} with actual values from context
        let processedCondition = condition.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            // Support nested keys like "user.role"
            const keys = key.trim().split('.');
            let value = context;
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return 'undefined';
                }
            }
            
            // Convert to string for comparison, handle different types
            if (typeof value === 'string') {
                return `'${value}'`;
            } else if (typeof value === 'boolean') {
                return value.toString();
            } else if (value === null || value === undefined) {
                return 'undefined';
            } else {
                return String(value);
            }
        });

        // Use Function constructor for safer evaluation (better than eval)
        // Only allow simple comparisons and logical operators
        const allowedPattern = /^[\w\s'",.()=!<>]+$/;
        if (!allowedPattern.test(processedCondition)) {
            console.warn('Condition contains invalid characters:', condition);
            return true; // Default to visible on error
        }

        // Create a safe evaluation function
        const func = new Function('return ' + processedCondition);
        const result = func();
        
        return Boolean(result);
    } catch (error) {
        console.warn('Error evaluating condition:', condition, error);
        return true; // Default to visible on error
    }
};

/**
 * Get value from data binding string
 * @param {string} binding - Data binding string, e.g. "{{user.name}}"
 * @param {object} context - Context object
 * @returns {any} - Resolved value
 */
export const resolveDataBinding = (binding, context = {}) => {
    if (!binding || typeof binding !== 'string') {
        return binding;
    }

    // Check if it's a data binding
    if (!binding.includes('{{')) {
        return binding;
    }

    try {
        return binding.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const keys = key.trim().split('.');
            let value = context;
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return match; // Return original if not found
                }
            }
            
            return value !== undefined && value !== null ? String(value) : match;
        });
    } catch (error) {
        console.warn('Error resolving data binding:', binding, error);
        return binding;
    }
};

/**
 * Apply conditional style based on conditions
 * @param {object} item - Item object with conditionalStyle
 * @param {object} context - Context object
 * @returns {object} - Final style object
 */
export const getConditionalStyle = (item, context = {}) => {
    if (!item.conditionalStyle || !item.conditionalStyle.conditions) {
        return item.style || {};
    }

    // Check each condition in order
    for (const condition of item.conditionalStyle.conditions) {
        if (evaluateCondition(condition.when, context)) {
            return { ...item.style, ...condition.style };
        }
    }

    // Return default style if no condition matches
    return item.style || item.conditionalStyle.default || {};
};

/**
 * Get conditional props based on conditions
 * @param {object} item - Item object with conditionalProps
 * @param {object} context - Context object
 * @returns {object} - Final props object
 */
export const getConditionalProps = (item, context = {}) => {
    if (!item.conditionalProps) {
        return item.props || {};
    }

    const props = { ...item.props };
    
    // Process each conditional prop
    Object.entries(item.conditionalProps).forEach(([key, condition]) => {
        if (typeof condition === 'string' && condition.includes('{{')) {
            // It's a data binding
            props[key] = resolveDataBinding(condition, context);
        } else if (typeof condition === 'string') {
            // It's a condition expression
            props[key] = evaluateCondition(condition, context);
        } else {
            props[key] = condition;
        }
    });

    return props;
};

