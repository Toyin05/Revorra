import adminApi from "./adminAxios"

export const getWithdrawals = () =>
  adminApi.get("/admin/withdrawals")

export const approveWithdrawal = (id) =>
  adminApi.post(`/admin/withdrawals/${id}/approve`)

export const rejectWithdrawal = (id) =>
  adminApi.post(`/admin/withdrawals/${id}/reject`)

export const markPaid = (id) =>
  adminApi.post(`/admin/withdrawals/${id}/paid`)