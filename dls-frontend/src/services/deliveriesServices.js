import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3014";

const api = axios.create({
  baseURL: API_URL,
});

export const createDeliveryLog = async (logData) => {
  try {
    const response = await api.post("/deliveries", logData);
    return response.data;
    } catch (error) {
    console.error("Error creating delivery log:", error);
    throw error;
  }
};

export const getDeliveryLogs = async (params = {}) => {
  try {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    );
    const response = await api.get("/deliveries", { params: cleanParams });
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery logs:", error);
    throw error;
  }
};

export const getDeliveryLogById = async (logId) => {
  try {
    const response = await api.get(`/deliveries/${logId}`);
    return response.data;
    } catch (error) {
    console.error(`Error fetching delivery log with ID ${logId}:`, error);
    throw error;
  }
};

export const updateDeliveryLog = async (logId, logData) => {
    try {
        const response = await api.patch(`/deliveries/${logId}`, logData);
        return response.data;
    }
    catch (error) {
        console.error(`Error updating delivery log with ID ${logId}:`, error);
        throw error;
    }
};

export const deleteDeliveryLog = async (logId) => {
    try {
        await api.delete(`/deliveries/${logId}`);
    } catch (error) {
        console.error(`Error deleting delivery log with ID ${logId}:`, error);
        throw error;
    }
};

export const verifyAndReleaseDelivery = async (logId, payload) => {
  try {
    const response = await api.patch(`/deliveries/${logId}/verify-release`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error verifying delivery release with ID ${logId}:`, error);
    throw error;
  }
};

export const getDeliveryNotificationState = async () => {
  try {
    const response = await api.get('/deliveries/notification-state');
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery notification state:', error);
    throw error;
  }
};

export const markDeliveryNotificationStateSeen = async () => {
  try {
    const response = await api.patch('/deliveries/notification-state/seen');
    return response.data;
  } catch (error) {
    console.error('Error marking delivery notification state as seen:', error);
    throw error;
  }
};

export const getDeliverySpreadsheetSettings = async () => {
  try {
    const response = await api.get('/deliveries/spreadsheet-settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery spreadsheet settings:', error);
    throw error;
  }
};

export const updateDeliverySpreadsheetSettings = async (payload) => {
  try {
    const response = await api.patch('/deliveries/spreadsheet-settings', payload);
    return response.data;
  } catch (error) {
    console.error('Error updating delivery spreadsheet settings:', error);
    throw error;
  }
};

export const upsertCompanyDeliverySpreadsheetMapping = async (payload) => {
  try {
    const response = await api.post('/deliveries/spreadsheet-settings/company-mappings', payload);
    return response.data;
  } catch (error) {
    console.error('Error upserting company spreadsheet mapping:', error);
    throw error;
  }
};

export const deleteCompanyDeliverySpreadsheetMapping = async (mappingId) => {
  try {
    const response = await api.delete(`/deliveries/spreadsheet-settings/company-mappings/${mappingId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting company spreadsheet mapping with ID ${mappingId}:`, error);
    throw error;
  }
};
