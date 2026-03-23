import axios from "axios"

const adminApi = axios.create({
  baseURL: "http://localhost:5000/api"
})

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  console.log('Interceptor reading token:', token)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default adminApi