import axios from 'axios';
import prisma from '../config/prisma.js';

const BASE_URL = process.env.TOPUPWIZARD_BASE_URL || 'https://topupwizard.com/api';

// Dynamic config fetchers - read from database, fallback to env
const getToken = async () => {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'TOPUPWIZARD_TOKEN' }
    });
    return setting?.value || process.env.TOPUPWIZARD_TOKEN;
  } catch {
    return process.env.TOPUPWIZARD_TOKEN;
  }
};

const getRate = async () => {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'EUR_TO_NGN_RATE' }
    });
    return parseFloat(setting?.value || process.env.EUR_TO_NGN_RATE || '1600');
  } catch {
    return parseFloat(process.env.EUR_TO_NGN_RATE || '1600');
  }
};

export const eurToNgn = async (euros) => {
  const rate = await getRate();
  return Math.round(euros * rate);
};

export const ngnToEur = async (naira) => {
  const rate = await getRate();
  return parseFloat((naira / rate).toFixed(4));
};

const AIRTIME_SERVICE_IDS = {
  MTN: 100,
  AIRTEL: 101,
  GLO: 102,
  '9MOBILE': 103
};

// Get headers with dynamic token
const getHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization-Token': token
  };
};

export const checkTWBalance = async () => {
  const headers = await getHeaders();
  const response = await axios.get(`${BASE_URL}/balance`, { headers });
  return response.data;
};

export const getDataPlans = async (network) => {
  const headers = await getHeaders();
  const response = await axios.post(`${BASE_URL}/pricing`, {
    type: 'data',
    typeSingle: network.toLowerCase() === '9mobile' ? '9mobile' : network.toLowerCase()
  }, { headers });
  return response.data;
};

export const purchaseAirtime = async (network, phoneNumber, amountNGN) => {
  const headers = await getHeaders();
  const serviceID = AIRTIME_SERVICE_IDS[network.toUpperCase()];
  if (!serviceID) throw new Error('Invalid network');

  const clientReference = `REV-AIR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const response = await axios.post(`${BASE_URL}/airtime`, {
    serviceID,
    amount: amountNGN,
    mobileNumber: phoneNumber,
    clientReference,
    bypassMobileValidator: false
  }, { headers });

  return { clientReference, response: response.data };
};

export const purchaseData = async (phoneNumber, serviceID) => {
  const headers = await getHeaders();
  const clientReference = `REV-DATA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const response = await axios.post(`${BASE_URL}/data`, {
    serviceID,
    mobileNumber: phoneNumber,
    clientReference,
    bypassMobileValidator: false
  }, { headers });

  return { clientReference, response: response.data };
};

export const requeryTransaction = async (reference) => {
  const headers = await getHeaders();
  const response = await axios.post(`${BASE_URL}/requerytrx`, {
    reference
  }, { headers });
  return response.data;
};

export const validateMobile = async (mobileNumber) => {
  const headers = await getHeaders();
  const response = await axios.post(`${BASE_URL}/validatemobile`, {
    mobileNumber
  }, { headers });
  return response.data;
};

export default {
  eurToNgn,
  ngnToEur,
  checkTWBalance,
  getDataPlans,
  purchaseAirtime,
  purchaseData,
  requeryTransaction,
  validateMobile
};