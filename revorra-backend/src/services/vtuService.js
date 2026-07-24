import axios from 'axios';
import prisma from '../config/prisma.js';

const BASE_URL = process.env.TOPUPWIZARD_BASE_URL || 'https://topupwizard.com/api';

// Dynamic config fetchers - read from database, fallback to env
const getTopupWizardToken = async () => {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'TOPUPWIZARD_TOKEN' }
    });
    const token = setting?.value || process.env.TOPUPWIZARD_TOKEN;
    return token;
  } catch (error) {
    console.error('[VTU Token] Error reading from DB:', error);
    return process.env.TOPUPWIZARD_TOKEN;
  }
};

export const getToken = getTopupWizardToken;

export const getRate = async () => {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'EUR_TO_NGN_RATE' }
    });
    if (setting?.value) return parseFloat(setting.value);
  } catch {}
  return parseFloat(process.env.EUR_TO_NGN_RATE || '1600');
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
  const token = await getTopupWizardToken();
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
  const token = await getToken();

  // Force convert to number no matter what is passed
  let numericAmount;
  if (typeof amountNGN === 'object' && amountNGN !== null) {
    // If somehow an object was passed, try to extract a number from it
    numericAmount = parseFloat(amountNGN.amount || amountNGN.value || amountNGN.ngn || JSON.stringify(amountNGN));
  } else {
    numericAmount = parseFloat(amountNGN);
  }

  if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error(`Invalid airtime amount received: ${JSON.stringify(amountNGN)}`);
  }

  const AIRTIME_SERVICE_IDS = {
    MTN: 100,
    AIRTEL: 101,
    GLO: 102,
    '9MOBILE': 103
  };

  const serviceID = AIRTIME_SERVICE_IDS[network.toUpperCase()];
  if (!serviceID) throw new Error(`Invalid network: ${network}`);

  const clientReference = `REV-AIR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const response = await axios.post(`${BASE_URL}/airtime`, {
    serviceID,
    amount: numericAmount,
    mobileNumber: phoneNumber,
    clientReference,
    bypassMobileValidator: false
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization-Token': token
    }
  });

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
  getRate,
  checkTWBalance,
  getDataPlans,
  purchaseAirtime,
  purchaseData,
  requeryTransaction,
  validateMobile
};