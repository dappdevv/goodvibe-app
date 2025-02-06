import {
	type Chain,
	createPublicClient,
	createWalletClient,
	custom,
	http,
	defineChain
} from 'viem';

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
} as const satisfies Chain);

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
