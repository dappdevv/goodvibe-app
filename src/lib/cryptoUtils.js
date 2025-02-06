// src/lib/cryptoUtils.js
import pkg from 'crypto-js';

const { AES, enc, mode, pad, PBKDF2 } = pkg;
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const KEY_SIZE = 256 / 32;
const ITERATIONS = 1000;

export function encryptData(data, password) {
	try {
		const salt = enc.Hex.parse(AES.lib.WordArray.random(SALT_LENGTH));
		const iv = AES.lib.WordArray.random(IV_LENGTH);

		const key = PBKDF2(password, salt, {
			keySize: KEY_SIZE,
			iterations: ITERATIONS
		});

		const encrypted = AES.encrypt(data, key, {
			iv: iv,
			mode: mode.CBC,
			padding: pad.Pkcs7
		});

		// Формат: salt + iv + ciphertext
		return salt.toString() + iv.toString() + encrypted.toString();
	} catch (error) {
		console.error('Encryption error:', error);
		return null;
	}
}

export function decryptData(encryptedData, password) {
	try {
		// Извлекаем компоненты из строки
		const salt = enc.Hex.parse(encryptedData.substr(0, SALT_LENGTH * 2));
		const iv = enc.Hex.parse(encryptedData.substr(SALT_LENGTH * 2, IV_LENGTH * 2));
		const ciphertext = encryptedData.substring((SALT_LENGTH + IV_LENGTH) * 2);

		const key = PBKDF2(password, salt, {
			keySize: KEY_SIZE,
			iterations: ITERATIONS
		});

		const decrypted = AES.decrypt(ciphertext, key, {
			iv: iv,
			mode: mode.CBC,
			padding: pad.Pkcs7
		});

		return decrypted.toString(enc.Utf8);
	} catch (error) {
		console.error('Decryption error:', error);
		return null;
	}
}
