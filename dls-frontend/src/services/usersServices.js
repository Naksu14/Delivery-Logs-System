import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3014'

const api = axios.create({
  baseURL: API_URL,
})

function authConfig(accessToken) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
}

export async function getCurrentUser(accessToken) {
  const response = await api.get('/users/me', authConfig(accessToken))
  return response.data
}

export async function updateCurrentUser(payload, accessToken) {
  const response = await api.put('/users/me', payload, authConfig(accessToken))
  return response.data
}
