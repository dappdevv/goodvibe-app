<script lang="ts">
	import { formatEther, bytesToHex } from 'viem';
	import {
		privateKeyToAccount,
		generatePrivateKey,
		generateMnemonic,
		english,
		mnemonicToAccount
	} from 'viem/accounts';
	import { onMount } from 'svelte';
	import { encryptData, decryptData } from '$lib/cryptoUtils';
	import { walletClient, initWallet, publicClient } from '$lib/stores/walletStore';

	let address = '';
	let privateKey = '';
	let mnemonic = '';
	let balance = '0';
	let blockNumber = 0n;
	let error = '';
	let encryptPassword = '';
	let storedWallets: string[] = [];
	let encryptError = '';
	let decryptPassword = '';
	let decryptError = '';
	let activeWalletIndex: number | null = null;
	let connectedWalletAddress = '';
	let connectedWalletBalance = '0';
	let showPrivateKey = false;
	let connectedPrivateKey = '';

	async function updateBlockNumber() {
		try {
			blockNumber = await publicClient.getBlockNumber();
		} catch (error) {
			console.error('Error getting block number:', error);
		}
	}

	function generateWallet() {
		try {
			mnemonic = generateMnemonic(english);
			const mnemonicAccount = mnemonicToAccount(mnemonic);
			address = mnemonicAccount.address;

			error = '';
		} catch (err) {
			error = 'Ошибка генерации кошелька';
			mnemonic = '';
		}
	}

	async function encryptAndStoreWallet() {
		try {
			if (!mnemonic || !encryptPassword) {
				encryptError = 'Сначала сгенерируйте кошелек и введите пароль';
				return;
			}

			const encryptedWallet = await encryptData(mnemonic, encryptPassword);
			const storedWalletsJson = localStorage.getItem('encryptedWallets') || '[]';
			const currentStoredWallets = JSON.parse(storedWalletsJson);

			if (!currentStoredWallets.includes(encryptedWallet)) {
				currentStoredWallets.push(encryptedWallet);
				localStorage.setItem('encryptedWallets', JSON.stringify(currentStoredWallets));
				storedWallets = currentStoredWallets;
			}

			encryptPassword = '';
			encryptError = '';
		} catch (err) {
			encryptError = 'Ошибка шифрования';
			console.error(err);
		}
	}

	async function connectStoredWallet(index: number) {
		try {
			if (!decryptPassword) {
				decryptError = 'Введите пароль';
				return;
			}

			const encryptedWallet = storedWallets[index];
			const decryptedMnemonic = await decryptData(encryptedWallet, decryptPassword);

			const client = await initWallet(decryptedMnemonic);

			// Получаем приватный ключ напрямую из мнемоники
			const hdKey = mnemonicToAccount(decryptedMnemonic).getHdKey();
			if (hdKey.privateKey) {
				connectedPrivateKey = bytesToHex(hdKey.privateKey);
			}

			// Обновление UI
			activeWalletIndex = index;
			decryptPassword = '';
			decryptError = '';

			// Получение баланса
			const newBalance = await publicClient.getBalance({
				address: client.account.address as `0x${string}`
			});
			connectedWalletBalance = formatEther(newBalance);
			connectedWalletAddress = client.account.address;
		} catch (err) {
			decryptError = 'Неверный пароль или поврежденный кошелек';
			console.error(err);
		}
	}

	async function updateConnectedWalletBalance() {
		if (connectedWalletAddress) {
			const newBalance = await publicClient.getBalance({
				address: connectedWalletAddress as `0x${string}`
			});
			connectedWalletBalance = formatEther(newBalance);
		}
	}

	function deleteStoredWallet(index: number) {
		const updatedWallets = [...storedWallets];
		updatedWallets.splice(index, 1);
		localStorage.setItem('encryptedWallets', JSON.stringify(updatedWallets));
		storedWallets = updatedWallets;

		// Сброс активного кошелька, если удаляем подключенный
		if (activeWalletIndex === index) {
			activeWalletIndex = null;
			connectedWalletAddress = '';
			connectedWalletBalance = '0';
			connectedPrivateKey = '';
			showPrivateKey = false;
		}
		// Корректировка индекса активного кошелька после удаления
		else if (activeWalletIndex !== null && index < activeWalletIndex) {
			activeWalletIndex--;
		}
	}

	onMount(() => {
		updateBlockNumber();
		const blockInterval = setInterval(updateBlockNumber, 10000);
		const balanceInterval = setInterval(updateConnectedWalletBalance, 10000);

		const storedWalletsJson = localStorage.getItem('encryptedWallets');
		storedWallets = storedWalletsJson ? JSON.parse(storedWalletsJson) : [];

		return () => {
			clearInterval(blockInterval);
			clearInterval(balanceInterval);
		};
	});
</script>

<div class="mx-auto max-w-2xl p-6">
	<h1 class="mb-6 text-2xl font-bold">GoodVibe Wallet</h1>

	<button
		on:click={generateWallet}
		class="mb-6 w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600"
	>
		Generate Wallet
	</button>

	{#if mnemonic}
		<div class="space-y-4">
			<div class="rounded bg-gray-100 p-4">
				<h2 class="font-semibold">Block Number</h2>
				<p class="font-mono">{blockNumber.toString()}</p>
			</div>

			<div class="rounded bg-gray-100 p-4">
				<h2 class="font-semibold">Address</h2>
				<p class="break-all font-mono">{address}</p>
			</div>

			<div class="rounded bg-gray-100 p-4">
				<h2 class="font-semibold">Private Key</h2>
				<p class="break-all font-mono">{privateKey}</p>
			</div>

			<div class="rounded bg-gray-100 p-4">
				<h2 class="font-semibold">Mnemonic</h2>
				<p class="break-all font-mono">{mnemonic}</p>
			</div>

			<div class="rounded bg-gray-100 p-4">
				<h2 class="mb-2 font-semibold">Store Encrypted Wallet</h2>
				<div class="space-y-2">
					<input
						type="password"
						bind:value={encryptPassword}
						placeholder="Enter password for encryption"
						class="w-full rounded border p-2"
					/>
					<button
						on:click={encryptAndStoreWallet}
						class="w-full rounded bg-green-500 py-2 text-white hover:bg-green-600"
					>
						Encrypt and Store Wallet
					</button>
					{#if encryptError}
						<p class="text-sm text-red-600">{encryptError}</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if storedWallets.length > 0}
		<div class="mt-6">
			<h2 class="mb-4 text-xl font-bold">Stored Wallets</h2>

			<!-- Add Connected Wallet Info Block -->
			{#if activeWalletIndex !== null && connectedWalletAddress}
				<div class="mb-4 rounded border border-green-200 bg-green-50 p-4">
					<h3 class="mb-2 text-lg font-semibold text-green-800">Connected Wallet</h3>
					<div class="space-y-2">
						<div>
							<span class="text-sm font-medium text-green-700">Address:</span>
							<p class="break-all font-mono text-sm">{connectedWalletAddress}</p>
						</div>
						<div>
							<span class="text-sm font-medium text-green-700">Balance:</span>
							<p class="font-mono text-sm">{connectedWalletBalance} GVT</p>
						</div>
						<div>
							<button
								on:click={() => (showPrivateKey = !showPrivateKey)}
								class="rounded bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600"
							>
								{showPrivateKey ? 'Hide Private Key' : 'Show Private Key'}
							</button>
							{#if showPrivateKey}
								<div class="mt-2">
									<span class="text-sm font-medium text-green-700">Private Key:</span>
									<p class="break-all font-mono text-sm">{connectedPrivateKey}</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<div class="space-y-2">
				{#each storedWallets as _, index}
					<div class="rounded bg-gray-100 p-4">
						<div class="flex items-center justify-between">
							<p class="font-mono">Encrypted Wallet #{index + 1}</p>
							<div class="flex items-center space-x-2">
								{#if activeWalletIndex === index}
									<span class="text-sm text-green-600">Connected</span>
									<button
										on:click={() => deleteStoredWallet(index)}
										class="ml-2 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
									>
										Удалить
									</button>
								{:else}
									<input
										type="password"
										placeholder="Enter password"
										class="rounded border p-1 text-sm"
										bind:value={decryptPassword}
									/>
									<button
										on:click={() => connectStoredWallet(index)}
										class="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
									>
										Connect
									</button>
									<button
										on:click={() => deleteStoredWallet(index)}
										class="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
									>
										Удалить
									</button>
								{/if}
							</div>
						</div>
						{#if decryptError && activeWalletIndex === null}
							<p class="mt-1 text-sm text-red-600">{decryptError}</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Add any component-specific styles here if needed */
</style>
