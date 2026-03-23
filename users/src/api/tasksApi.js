import api from "./axios"

export const getTasks = () => api.get("/tasks")

export const completeTask = (taskId, proof) =>
  api.post(`/tasks/${taskId}/complete`, { proof })

export const getTaskHistory = () => api.get("/tasks/history")
