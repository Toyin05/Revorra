declare module "@/api/adminAxios" {
  import { AxiosInstance } from "axios";
  const adminApi: AxiosInstance;
  export default adminApi;
}

declare module "@/api/statsApi" {
  export const getAdminStats: () => Promise<any>;
  export const getRevenueStats: () => Promise<any>;
  export const getAnalyticsTasks: () => Promise<any>;
  export const getAnalyticsUsers: () => Promise<any>;
}

declare module "@/api/tasksAdminApi" {
  export const createTask: (data: any) => Promise<any>;
  export const getTasks: () => Promise<any>;
  export const deleteTask: (id: string) => Promise<any>;
}

declare module "@/api/taskApprovalApi" {
  export const getPendingCompletions: () => Promise<any>;
  export const approveCompletion: (id: string) => Promise<any>;
  export const rejectCompletion: (id: string) => Promise<any>;
}

declare module "@/api/withdrawalAdminApi" {
  export const getWithdrawals: () => Promise<any>;
  export const approveWithdrawal: (id: string) => Promise<any>;
  export const rejectWithdrawal: (id: string) => Promise<any>;
  export const markPaid: (id: string) => Promise<any>;
}

declare module "@/api/couponAdminApi" {
  export const generateCoupon: (data: any) => Promise<any>;
  export const getCoupons: () => Promise<any>;
}

declare module "@/api/usersAdminApi" {
  export const getUsers: () => Promise<any>;
  export const getUserDetails: (id: string) => Promise<any>;
}

declare module "@/api/referralAdminApi" {
  export const getTopReferrers: () => Promise<any>;
}

declare module "@/api/announcementsApi" {
  export const getAnnouncements: () => Promise<any>;
  export const createAnnouncement: (data: any) => Promise<any>;
  export const updateAnnouncement: (id: string, data: any) => Promise<any>;
  export const deleteAnnouncement: (id: string) => Promise<any>;
}

declare module "@/api/couponRequestsApi" {
  export const getCouponRequests: () => Promise<any>;
  export const approveCouponRequest: (id: string) => Promise<any>;
  export const rejectCouponRequest: (id: string) => Promise<any>;
}

declare module "@/components/AdminRoute" {
  import { ReactNode } from "react";
  const AdminRoute: ({ children }: { children: ReactNode }) => JSX.Element;
  export default AdminRoute;
}