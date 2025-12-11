// src/components/builder/gridConstants.js
// Grid size constant - snap to 20px grid
export const GRID_SIZE = 20;

// Helper function to snap value to grid
export const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

