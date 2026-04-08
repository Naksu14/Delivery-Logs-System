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
