import CryptoJS from 'crypto-js';

export const generateAccessKey = (length: number = 8): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

export const hashKey = (key: string): string => {
  return CryptoJS.SHA256(key).toString();
};

export const verifyKey = (key: string, hash: string): boolean => {
  return hashKey(key) === hash;
};
