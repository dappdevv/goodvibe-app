<script lang="ts">
	import { walletStore } from '$lib/stores/walletStore';
	import { publicClient } from '$lib/stores/walletStore';
	import daoUsersABI from '$lib/abi/daoUsers.json';
	import type { WalletClient, Account } from 'viem';
	import { page } from '$app/state';
	import Wallet from '$lib/components/Wallet.svelte';

	let name = '';
	let referrer = page.url.searchParams.get('ref') || '0x0000000000000000000000000000000000000000';
	let loading = false;
	let error = '';
	let success = false;

	const daoUsersAddress = import.meta.env.VITE_DAO_USERS_ADDRESS;

	// BigInt JSON serialization fix
	const replacer = (_key: string, value: unknown) =>
		typeof value === 'bigint' ? value.toString() : value;

	async function handleRegistration() {
		if (!walletStore?.client?.account) {
			error = 'Пожалуйста, подключите кошелёк';
			return;
		}

		try {
			loading = true;
			error = '';

			const { request } = await publicClient.simulateContract({
				address: daoUsersAddress,
				abi: daoUsersABI,
				functionName: 'registerUser',
				args: [referrer, name],
				account: walletStore.client.account
			});

			const hash = await walletStore.client.writeContract(request);
			const receipt = await publicClient.waitForTransactionReceipt({ hash });

			if (receipt.status === 'success') {
				success = true;
			} else {
				error = 'Ошибка транзакции';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : JSON.stringify(err, replacer);
		} finally {
			loading = false;
		}
	}
</script>

// src/routes/reg/+page.svelte
<div class="container mx-auto max-w-lg p-4">
	<h1 class="mb-6 text-2xl font-bold">Регистрация в DAO</h1>

	<div class="mb-6">
		<Wallet />
	</div>

	{#if success}
		<div class="rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
			Регистрация успешна! Добро пожаловать в DAO.
		</div>
	{:else}
		<form on:submit|preventDefault={handleRegistration} class="space-y-4">
			<div>
				<label for="referrer" class="block text-sm font-medium">Реферальный адрес</label>
				<input
					type="text"
					id="referrer"
					bind:value={referrer}
					required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					placeholder="Введите реферальный адрес"
				/>
			</div>

			<div>
				<label for="name" class="block text-sm font-medium">Имя</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					placeholder="Введите ваше имя"
				/>
			</div>

			{#if error}
				<div class="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
					{error}
				</div>
			{/if}

			<button
				type="submit"
				disabled={loading || !walletStore?.client?.account}
				class="focus:shadow-outline w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none {loading ||
				!$walletStore?.client?.account
					? 'cursor-not-allowed opacity-50'
					: ''}"
			>
				{loading ? 'Регистрация...' : 'Зарегистрироваться'}
			</button>
		</form>
	{/if}
</div>
