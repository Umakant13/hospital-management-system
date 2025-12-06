import api from './api';

const aiService = {
    // Get list of symptoms
    getSymptoms: async () => {
        const response = await api.get('/ai/symptoms');
        return response.data;
    },

    // Predict disease with model selection
    predictDisease: async (symptoms, modelType = 'random_forest') => {
        const response = await api.post('/ai/predict', {
            symptoms,
            model_type: modelType
        });
        return response.data;
    },

    // Compare both models
    compareModels: async (symptoms) => {
        const response = await api.post('/ai/compare-models', {
            symptoms
        });
        return response.data;
    },

    // Get disease information
    getDiseaseInfo: async (diseaseName) => {
        const response = await api.get(`/ai/disease-info/${diseaseName}`);
        return response.data;
    },

    // Generate text using AI
    generateText: async (prompt) => {
        const response = await api.post('/ai/chat', { message: prompt });
        return response.data;
    },

    // Generate form data
    generateFormData: async (fieldDescriptions) => {
        const response = await api.post('/ai/generate-form-data', {
            field_descriptions: fieldDescriptions
        });
        return response.data;
    }
};

export default aiService;
