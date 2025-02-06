<!-- Wallet.svelte -->
<script lang="ts">
	import { writable } from 'svelte/store';
	import { mnemonicToAccount, generateMnemonic, english, HDKey } from 'viem/accounts';
	import { createWalletClient, http } from 'viem';
	import { GoodVibeChain } from '$lib/chain/config';
	import pkg from 'crypto-js';
	const { AES } = pkg;

	// Wallet store type
	interface WalletStore {
		address: string | null;
		encryptedData: string | null;
		chain: typeof GoodVibeChain | null;
	}

	// Initialize store
	export const wallet = writable<WalletStore>({
		address: null,
		encryptedData: null,
		chain: GoodVibeChain
	});

	let mnemonic = generateMnemonic(english);
	const hdKey = HDKey.fromMasterSeed(mnemonic);
	const privateKey = hdKey.privateKey;
	console.log('privateKey; ', privateKey);
	let password = '';
	let errorMessage = '';

	const encryptWallet = (privateKey: string, password: string): string => {
		return AES.encrypt(privateKey, password).toString();
	};

	const handleSubmit = async () => {
		console.log('hadle');
		try {
			const account = mnemonicToAccount(mnemonic);
			// const encryptedData = encryptWallet(account.privateKey, password);
			const encryptedData = encryptWallet(mnemonic, password);

			wallet.set({
				address: account.address,
				encryptedData,
				chain: GoodVibeChain
			});
			console.log('wallet: ', wallet);
			// Initialize wallet client
			const client = createWalletClient({
				account: account,
				chain: GoodVibeChain,
				transport: http(import.meta.env.VITE_GOODVIBE_CHAIN_RPC, {
					fetchOptions: {
						headers: {
							Authorization: import.meta.env.VITE_GOODVIBE_CHAIN_RPC_AUTHORIZATION
						}
					}
				})
			});
			console.log('client: ', client);

			errorMessage = '';
		} catch (error) {
			console.log(error);
			errorMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	};
</script>

<div class="wallet-container">
	<h2>Wallet Setup</h2>

	{#if errorMessage}
		<div class="error">{errorMessage}</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label>Mnemonic Phrase:</label>
			<textarea bind:value={mnemonic} rows="3" />
			<button type="button" on:click={() => generateMnemonic(english)}>Generate New</button>
		</div>

		<div class="form-group">
			<label>Encryption Password:</label>
			<input type="password" bind:value={password} required />
		</div>

		<button type="submit">Create Wallet</button>
	</form>
</div>

<style>
	.wallet-container {
		max-width: 600px;
		margin: 20px auto;
		padding: 20px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	textarea {
		width: 100%;
		margin-top: 0.5rem;
	}

	button {
		background: #007bff;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
