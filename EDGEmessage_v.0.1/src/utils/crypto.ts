import * as ExpoCrypto from 'expo-crypto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const CryptoJS = require('crypto-js');

export const hashSHA256 = async (value: string): Promise<string> => {
  return ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, value);
};

const derive = async (seed: string): Promise<string> => hashSHA256(seed);

export const encryptAES256 = async (plain: string, seed: string): Promise<string> => {
  const key = await derive(seed);
  const cipherText = CryptoJS.AES.encrypt(plain, key).toString();
  return JSON.stringify({ algorithm: 'aes-256', cipherText });
};

export const decryptAES256 = async (sealed: string, seed: string): Promise<string> => {
  const key = await derive(seed);
  const parsed = JSON.parse(sealed) as { cipherText: string };
  const bytes = CryptoJS.AES.decrypt(parsed.cipherText, key);
  const plain = bytes.toString(CryptoJS.enc.Utf8);
  if (!plain) throw new Error('Decrypt failed');
  return plain;
};
