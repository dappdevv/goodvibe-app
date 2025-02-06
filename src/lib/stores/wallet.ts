// import { writable } from 'svelte/store';
// import { GoodVibeChain } from '$lib/chain/config';
// import { type WalletClient, createWalletClient } from 'viem';

// export const walletStore = writable<WalletClient | null>(null);
// export const walletAddress = writable<string | null>(null);

// export async function initWallet() {
//     const client = await createWalletClient();
//     walletStore.set(client);
//     const [address] = await client.requestAddresses();
//     walletAddress.set(address);
// }
