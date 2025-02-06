import { writable } from 'svelte/store';
import { encryptData, decryptData } from '../cryptoUtils';
import { createPublicClient, createWalletClient, http, defineChain } from 'viem';

// Проверка доступности localStorage
const isBrowser = typeof window !== 'undefined';

// Define GoodVibe Chain
export const GoodVibeChain = defineChain({
	id: 1127,
	name: 'GoodVibe',
	nativeCurrency: {
		decimals: 18,
		name: 'GoodVibeToken',
		symbol: 'GVT'
	},
	rpcUrls: {
		default: {
			http: [import.meta.env.VITE_GOODVIBE_CHAIN_RPC]
		},
		public: {
			http: [import.meta.env.VITE_GOODVIBE_CHAIN_RPC]
		}
	}
});

// Initialize transport with authorization headers
const transport = http(import.meta.env.VITE_GOODVIBE_CHAIN_RPC, {
	fetchOptions: {
		headers: {
			Authorization: import.meta.env.VITE_GOODVIBE_CHAIN_RPC_AUTHORIZATION
		}
	}
});

// Create and export public client
export const publicClient = createPublicClient({
	chain: GoodVibeChain,
	transport
});

const STORAGE_KEY = 'encryptedWallet';

// Безопасная инициализация хранилища
const initialWallet =
	isBrowser && localStorage.getItem(STORAGE_KEY)
		? decryptData(localStorage.getItem(STORAGE_KEY))
		: null;

export const walletStore = writable(initialWallet);
export const walletAddress = writable(null);

export async function createNewWallet(password) {
	if (!isBrowser) return;

	const wallet = createWalletClient({ transport });
	const encrypted = encryptData(wallet.account.privateKey, password);
	localStorage.setItem(STORAGE_KEY, encrypted);
	walletStore.set(wallet);
}

export function unlockWallet(password) {
	if (!isBrowser) return null;

	const encrypted = localStorage.getItem(STORAGE_KEY);
	const privateKey = decryptData(encrypted, password);
	return createWalletClient({ transport, key: privateKey });
}
