import { writable } from 'svelte/store';
import {
	createPublicClient,
	createWalletClient,
	http,
	defineChain,
	type WalletClient,
	type Chain
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

export const walletClient = writable<WalletClient>();

const GoodVibeChain: Chain = defineChain({
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

const transport = http(import.meta.env.VITE_GOODVIBE_CHAIN_RPC, {
	fetchOptions: {
		headers: {
			Authorization: import.meta.env.VITE_GOODVIBE_CHAIN_RPC_AUTHORIZATION
		}
	}
});

export const publicClient = createPublicClient({
	chain: GoodVibeChain,
	transport
});

export async function initWallet(mnemonic: string) {
	const account = mnemonicToAccount(mnemonic);
	const client = createWalletClient({
		account,
		chain: GoodVibeChain,
		transport
	});

	walletClient.set(client);
	return client;
}
