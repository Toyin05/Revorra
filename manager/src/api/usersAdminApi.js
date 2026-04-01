import adminApi from "./adminAxios"

export const getUsers = () =>
  adminApi.get("/admin/users")

export const getUserDetails = (id) =>
  adminApi.get(`/admin/users/${id}`)

export const suspendUser = (id) =>
  adminApi.patch(`/admin/users/${id}/suspend`)

export const deleteUser = (id) =>
  adminApi.delete(`/admin/users/${id}`)