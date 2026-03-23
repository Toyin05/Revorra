import api from "./axios"

export const getActiveAnnouncements = () => api.get("/announcements/active")
