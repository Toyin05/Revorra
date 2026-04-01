import api from "./axios"

export const getCouponLink = () => api.get("/settings/coupon-link")

export const getSettings = () => api.get("/settings")
