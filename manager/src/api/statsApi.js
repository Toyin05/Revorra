import adminApi from "./adminAxios"

export const getAdminStats = () =>
  adminApi.get("/admin/stats")

export const getRevenueStats = () =>
  adminApi.get("/admin/revenue")

export const getAnalyticsTasks = () =>
  adminApi.get("/admin/analytics/tasks")

export const getAnalyticsUsers = () =>
  adminApi.get("/admin/analytics/users")