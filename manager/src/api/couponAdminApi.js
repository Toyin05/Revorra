import adminApi from "./adminAxios"

export const generateCoupon = (data) =>
  adminApi.post("/admin/coupons", data)

export const getCoupons = () =>
  adminApi.get("/admin/coupons")

export const getCouponLink = () =>
  adminApi.get("/admin/coupon-link")

export const updateCouponLink = (link) =>
  adminApi.post("/admin/coupon-link", { link })