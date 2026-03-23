import api from "./axios"

export const register = (data) => api.post("/auth/register", data)

export const login = (data) => api.post("/auth/login", data)

export const getProfile = () => api.get("/auth/me")

export const getReferralStats = () => api.get("/referrals")

export const getMyReferrals = () => api.get("/referrals/my-referrals")
