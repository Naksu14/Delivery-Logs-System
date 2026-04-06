import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3014";

const api = axios.create({
  baseURL: API_URL,
});

export const getDeliveryTypes = async () => {
  try {
    const response = await api.get("/delivery-type");
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery types:", error);
    throw error;
  }
};

export const getDeliveryTypeById = async (deliveryTypeId) => {
  try {
    const response = await api.get(`/delivery-type/${deliveryTypeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching delivery type with ID ${deliveryTypeId}:`, error);
    throw error;
  }
};

export const createDeliveryType = async (deliveryTypeData) => {
  try {
    const response = await api.post("/delivery-type", deliveryTypeData);
    return response.data;
  } catch (error) {
    console.error("Error creating delivery type:", error);
    throw error;
  }
};

export const updateDeliveryType = async (deliveryTypeId, deliveryTypeData) => {
  try {
    const response = await api.put(`/delivery-type/${deliveryTypeId}`, deliveryTypeData);
    return response.data;
  } catch (error) {
    console.error(`Error updating delivery type with ID ${deliveryTypeId}:`, error);
    throw error;
  }
};

export const deleteDeliveryType = async (deliveryTypeId) => {
  try {
    await api.delete(`/delivery-type/${deliveryTypeId}`);
  } catch (error) {
    console.error(`Error deleting delivery type with ID ${deliveryTypeId}:`, error);
    throw error;
  }
};