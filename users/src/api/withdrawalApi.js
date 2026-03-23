import api from "./axios"

export const requestWithdrawal = (data) =>
  api.post("/withdrawals", data)

export const getWithdrawals = () =>
  api.get("/withdrawals")

export const submitWithdrawal = (data) =>
  api.post("/withdrawals", data)
