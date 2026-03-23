import api from "./axios"

export const getTWBalance = () =>
  api.get('/vtu/tw-balance');

export const getDataPlans = (network) =>
  api.get(`/vtu/data-plans/${network}`);

export const validateMobile = (mobileNumber) =>
  api.post('/vtu/validate-mobile', { mobileNumber });

export const purchaseAirtime = (data) =>
  api.post('/vtu/airtime', {
    network: data.network,
    phoneNumber: data.phoneNumber || data.phone,
    amount: data.amount
  });

export const purchaseData = (data) =>
  api.post('/vtu/data', {
    network: data.network,
    phoneNumber: data.phoneNumber || data.phone,
    serviceID: data.serviceID,
    planName: data.planName,
    amountNGN: data.amountNGN
  });

export const getVTUHistory = () =>
  api.get('/vtu/history');

export const getWallet = () =>
  api.get('/wallet')
