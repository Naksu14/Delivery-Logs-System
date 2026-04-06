import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3014";

const api = axios.create({
  baseURL: API_URL,
});

export const getCompanies = async () => {
  try {
    const response = await api.get("/companies");
    return response.data;
  }
    catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

export const getCompanyById = async (companyId) => {
  try
    {
        const response = await api.get(`/companies/${companyId}`);
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching company with ID ${companyId}:`, error);
        throw error;
    }
};
