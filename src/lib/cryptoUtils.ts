export const encryptData = async (data: string, password: string): Promise<string> => {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(16));

	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);

	const key = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		true,
		['encrypt']
	);

	const encrypted = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		new TextEncoder().encode(data)
	);

	// Преобразуем данные в base64 для безопасного хранения
	const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
	const saltBase64 = btoa(String.fromCharCode(...salt));
	const ivBase64 = btoa(String.fromCharCode(...iv));

	return JSON.stringify({
		salt: saltBase64,
		iv: ivBase64,
		ciphertext: encryptedBase64
	});
};

export const decryptData = async (encryptedData: string, password: string): Promise<string> => {
	const { salt, iv, ciphertext } = JSON.parse(encryptedData);

	// Преобразуем из base64 обратно в Uint8Array
	const saltArray = new Uint8Array([...atob(salt)].map(c => c.charCodeAt(0)));
	const ivArray = new Uint8Array([...atob(iv)].map(c => c.charCodeAt(0)));
	const ciphertextArray = new Uint8Array([...atob(ciphertext)].map(c => c.charCodeAt(0)));

	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);

	const key = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: saltArray,
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		true,
		['decrypt']
	);

	const decrypted = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: ivArray },
		key,
		ciphertextArray
	);

	return new TextDecoder().decode(decrypted);
};
