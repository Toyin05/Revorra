import adminApi from "./adminAxios"

export const getTopReferrers = () =>
  adminApi.get("/admin/referrals/top")