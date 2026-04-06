import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3014";

const api = axios.create({
  baseURL: API_URL,
});

export const getDeliveryPartners = async () => {
  try {
    const response = await api.get("/delivery-partners");
    return response.data;
  }
    catch (error) {
    console.error("Error fetching delivery partners:", error);
    throw error;
  }
};

export const getDeliveryPartnerById = async (partnerId) => {
    try
    {        const response = await api.get(`/delivery-partners/${partnerId}`);
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching delivery partner with ID ${partnerId}:`, error);
        throw error;
    }
};


export const createDeliveryPartner = async (partnerData) => {
    try {
        const response = await api.post("/delivery-partners", partnerData); 
        return response.data;
    } catch (error) {
        console.error("Error creating delivery partner:", error);
        throw error;
    }
};

export const updateDeliveryPartner = async (partnerId, partnerData) => {
    try {
        const response = await api.put(`/delivery-partners/${partnerId}`, partnerData); 
        return response.data;
    } catch (error) {
        console.error(`Error updating delivery partner with ID ${partnerId}:`, error);
        throw error;
    }
};

export const deleteDeliveryPartner = async (partnerId) => {
    try {
        await api.delete(`/delivery-partners/${partnerId}`);
    } catch (error) {
        console.error(`Error deleting delivery partner with ID ${partnerId}:`, error);
        throw error;
    }
};