<script lang="ts">
	import { walletClient } from '$lib/stores/walletStore';

	let isShowAddress = false;
	let walletAddress = '';

	async function showAddress() {
		const addresses = await $walletClient.getAddresses();
		walletAddress = addresses[0];
		console.log('walletClient: ', $walletClient);
		isShowAddress = true;
	}
</script>

{#if isShowAddress}
	<div class="wallet-info">Address: {walletAddress}</div>
{:else}
	<div class="wallet-info">
		<button on:click={showAddress}> show </button>
	</div>
{/if}

<style>
	.wallet-info {
		position: fixed;
		top: 1rem;
		right: 1rem;
		padding: 0.5rem 1rem;
		background: #f8f9fa;
		border-radius: 0.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.wallet-connected {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.address {
		font-family: monospace;
		color: #1a1a1a;
	}

	.balance {
		color: #666;
		font-size: 0.9rem;
	}

	.error {
		color: #dc3545;
		font-size: 0.9rem;
	}

	button {
		background: #0d6efd;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
</style>
