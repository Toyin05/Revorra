import adminApi from "./adminAxios"

export const generateCoupon = (data) =>
  adminApi.post("/admin/coupons", data)

export const getCoupons = () =>
  adminApi.get("/admin/coupons")