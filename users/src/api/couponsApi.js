import api from "./axios"

export const requestCoupon = (type) => api.post("/coupons/request", { type })

export const getCouponStatus = () => api.get("/coupons/status")

export const uploadCouponProof = (requestId, proofImage) => 
  api.post("/coupons/upload-proof", { requestId, proofImage })

export const getUserCoupons = () => api.get("/coupons/user-coupons")

export const redeemCoupon = (code) => api.post("/coupons/redeem", { code })

export const getMyCouponRequests = () => api.get("/coupons/my-requests")
