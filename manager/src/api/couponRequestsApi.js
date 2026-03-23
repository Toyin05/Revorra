import adminApi from "./adminAxios"

export const getCouponRequests = () =>
  adminApi.get("/admin/coupons/requests")

export const approveCouponRequest = (id) =>
  adminApi.patch(`/admin/coupons/${id}/approve`)

export const rejectCouponRequest = (id) =>
  adminApi.patch(`/admin/coupons/${id}/reject`)