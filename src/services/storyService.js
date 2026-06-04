import apiClient from './apiClient';

const storyService = {
    getStories: async (params) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        return await apiClient(`/private/stories${query}`);
    },

    getStoryById: async (id) => {
        return await apiClient(`/private/stories/${id}`);
    },

    createStory: async (storyData) => {
        return await apiClient('/private/stories', {
            method: 'POST',
            body: storyData
        });
    },

    updateStory: async (id, storyData) => {
        return await apiClient(`/private/stories/${id}`, {
            method: 'PUT',
            body: storyData
        });
    },

    deleteStory: async (id) => {
        return await apiClient(`/private/stories/${id}`, {
            method: 'DELETE'
        });
    }
};

export default storyService;
