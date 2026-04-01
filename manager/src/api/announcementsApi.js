import adminApi from "./adminAxios"

export const getAnnouncements = () =>
  adminApi.get("/admin/announcements")

export const createAnnouncement = (data) =>
  adminApi.post("/admin/announcements", data)

export const updateAnnouncement = (id, data) =>
  adminApi.patch(`/admin/announcements/${id}`, data)

export const deleteAnnouncement = (id) =>
  adminApi.delete(`/admin/announcements/${id}`)