import adminApi from "./adminAxios"

export const getPendingCompletions = () =>
  adminApi.get("/admin/task-completions")

export const approveCompletion = (id) =>
  adminApi.post(`/admin/task-completions/${id}/approve`)

export const rejectCompletion = (id) =>
  adminApi.post(`/admin/task-completions/${id}/reject`)