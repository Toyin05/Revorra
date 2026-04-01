import adminApi from './adminAxios';

export const getSettings = () =>
  adminApi.get('/admin/settings');

export const updateSettings = (data) =>
  adminApi.post('/admin/settings', { settings: data });

export const getTWBalance = () =>
  adminApi.get('/vtu/tw-balance');