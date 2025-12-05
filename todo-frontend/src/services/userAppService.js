// src/services/userAppService.js
import apiService from './apiService';

/**
 * Service for managing user apps (created from App Builder or downloaded from Marketplace)
 */
const userAppService = {
    /**
     * Get all user apps
     * @param {string} filter - 'all' | 'created' | 'downloaded'
     */
    getUserApps: async (filter = 'all') => {
        try {
            const response = await apiService.get(`/userapps?filter=${filter}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user apps:', error);
            throw error;
        }
    },

    /**
     * Get a single app by ID
     * @param {number} id - App ID
     */
    getAppById: async (id) => {
        try {
            const response = await apiService.get(`/userapps/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching app:', error);
            throw error;
        }
    },

    /**
     * Create a new app (from App Builder)
     * @param {Object} appData - { name, icon, description, config }
     */
    createApp: async (appData) => {
        try {
            const response = await apiService.post('/userapps', {
                ...appData,
                source: 'created'
            });
            return response.data;
        } catch (error) {
            console.error('Error creating app:', error);
            throw error;
        }
    },

    /**
     * Update an existing app (only for source='created')
     * @param {number} id - App ID
     * @param {Object} appData - Updated app data
     */
    updateApp: async (id, appData) => {
        try {
            const response = await apiService.put(`/userapps/${id}`, appData);
            return response.data;
        } catch (error) {
            console.error('Error updating app:', error);
            throw error;
        }
    },

    /**
     * Delete an app
     * @param {number} id - App ID
     */
    deleteApp: async (id) => {
        try {
            await apiService.delete(`/userapps/${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting app:', error);
            throw error;
        }
    },

    /**
     * Download an app from Marketplace
     * @param {number} marketplaceAppId - Marketplace app ID
     */
    downloadApp: async (marketplaceAppId) => {
        try {
            const response = await apiService.post(`/userapps/download/${marketplaceAppId}`);
            return response.data;
        } catch (error) {
            console.error('Error downloading app:', error);
            throw error;
        }
    },

    /**
     * Save app from App Builder to My Apps
     * @param {Object} appData - { name, icon, description, config }
     */
    saveFromBuilder: async (appData) => {
        try {
            const response = await apiService.post('/userapps/save-from-builder', {
                name: appData.name || 'Untitled App',
                icon: appData.icon || '📱',
                description: appData.description || '',
                config: JSON.stringify(appData.config || []),
                source: 'created'
            });
            return response.data;
        } catch (error) {
            console.error('Error saving app from builder:', error);
            throw error;
        }
    }
};

export default userAppService;
