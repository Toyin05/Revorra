import adminApi from "./adminAxios"

export const getUsers = () =>
  adminApi.get("/admin/users")

export const getUserDetails = (id) =>
  adminApi.get(`/admin/users/${id}`)