import api from "./axios"

export const getWallet = () => api.get("/wallet")

export const getTransactions = () => api.get("/wallet/transactions")
