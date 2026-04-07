import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3014'

const api = axios.create({
  baseURL: API_URL
})

export async function loginAuth(credentials) {
  const response = await api.post('/auth/login', credentials)
  return response.data
}
