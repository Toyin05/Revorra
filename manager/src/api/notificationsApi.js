import axios from "./axios"

export const getNotifications = (unreadOnly = false) =>
  axios.get(`/notifications?unreadOnly=${unreadOnly}`)

export const markAsRead = (id) =>
  axios.patch(`/notifications/${id}/read`)

export const markAllAsRead = () =>
  axios.patch(`/notifications/read-all`)

export const deleteNotification = (id) =>
  axios.delete(`/notifications/${id}`)