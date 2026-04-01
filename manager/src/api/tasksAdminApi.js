import adminApi from "./adminAxios"

export const createTask = (data) =>
  adminApi.post("/admin/tasks", data)

export const getTasks = () =>
  adminApi.get("/admin/tasks")

export const deleteTask = (id) =>
  adminApi.delete(`/admin/tasks/${id}`)