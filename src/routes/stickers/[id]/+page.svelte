<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { createHelia } from 'helia';
	import { strings } from '@helia/strings';
	import { dagJson } from '@helia/dag-json';
	import { dagCbor } from '@helia/dag-cbor';
	import pkg from 'crypto-js';
	import { CID } from 'multiformats/cid';
	const { AES, enc } = pkg;

	// Get the sticker ID from the URL parameter
	const stickerId = $page.params.id;

	let message = '';
	let password = '';
	let ipfs: any;
	let str: any;
	let loading = false;
	let error = '';
	let success = '';
	let decryptMode = false;
	let decryptPassword = '';
	let decryptedMessage = '';
	let inputCid = '';
	let dagCborInstance: any;

	onMount(async () => {
		try {
			ipfs = await createHelia();
			dagCborInstance = dagCbor(ipfs);
		} catch (err) {
			error = 'Failed to initialize IPFS';
			console.error(err);
		}
	});

	async function encryptAndUpload() {
		if (!message || !password) {
			error = 'Please provide both message and password';
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			// Encrypt the message with the password
			const encryptedMessage = AES.encrypt(message, password).toString();

			// Create metadata object
			const metadata = {
				stickerId,
				encryptedMessage,
				timestamp: new Date().toISOString()
			};

			// Upload to IPFS using dag-cbor
			const cid = await dagCborInstance.add(metadata);
			success = `Message encrypted and stored! CID: ${cid.toString()}`;

			// Clear form
			message = '';
			password = '';
		} catch (err) {
			if (err instanceof Error) {
				error = `Failed to upload message: ${err.message}`;
			} else {
				error = 'Failed to upload message';
			}
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function retrieveAndDecrypt(cidString: string) {
		if (!decryptPassword) {
			error = 'Please provide a password';
			return;
		}

		loading = true;
		error = '';
		decryptedMessage = '';

		try {
			// Parse the CID string into a CID object
			const cid = CID.parse(cidString);
			
			// Retrieve from IPFS using dag-cbor
			const metadata = await dagCborInstance.get(cid);

			// Decrypt the message
			const bytes = AES.decrypt(metadata.encryptedMessage, decryptPassword);
			const decrypted = bytes.toString(enc.Utf8);

			if (decrypted) {
				decryptedMessage = decrypted;
			} else {
				error = 'Incorrect password';
			}
		} catch (err) {
			if (err instanceof Error) {
				error = `Failed to retrieve or decrypt message: ${err.message}`;
			} else {
				error = 'Failed to retrieve or decrypt message';
			}
			console.error(err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<h1 class="mb-6 text-2xl font-bold">Sticker #{stickerId}</h1>

	<div class="mb-6">
		<button
			class="mr-2 rounded bg-blue-500 px-4 py-2 text-white"
			on:click={() => (decryptMode = false)}
			class:opacity-50={!decryptMode}
		>
			Create Message
		</button>
		<button
			class="rounded bg-green-500 px-4 py-2 text-white"
			on:click={() => (decryptMode = true)}
			class:opacity-50={decryptMode}
		>
			Decrypt Message
		</button>
	</div>

	{#if !decryptMode}
		<!-- Create Message Form -->
		<div class="space-y-4">
			<div>
				<label class="mb-1 block text-sm font-medium" for="message">Secret Message</label>
				<textarea
					id="message"
					bind:value={message}
					class="w-full rounded border p-2"
					rows="4"
					placeholder="Enter your secret message"
				></textarea>
			</div>

			<div>
				<label class="mb-1 block text-sm font-medium" for="password">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					class="w-full rounded border p-2"
					placeholder="Enter encryption password"
				/>
			</div>

			<button
				on:click={encryptAndUpload}
				disabled={loading}
				class="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
			>
				{loading ? 'Processing...' : 'Encrypt & Upload'}
			</button>
		</div>
	{:else}
		<!-- Decrypt Message Form -->
		<div class="space-y-4">
			<div>
				<label class="mb-1 block text-sm font-medium" for="cid">IPFS CID</label>
				<input
					type="text"
					id="cid"
					class="w-full rounded border p-2"
					placeholder="Enter the IPFS CID"
					bind:value={inputCid}
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm font-medium" for="decryptPassword">Password</label>
				<input
					type="password"
					id="decryptPassword"
					bind:value={decryptPassword}
					class="w-full rounded border p-2"
					placeholder="Enter decryption password"
				/>
			</div>

			<button
				on:click={() => retrieveAndDecrypt(inputCid)}
				disabled={loading}
				class="w-full rounded bg-green-500 py-2 text-white hover:bg-green-600 disabled:opacity-50"
			>
				{loading ? 'Processing...' : 'Decrypt Message'}
			</button>

			{#if decryptedMessage}
				<div class="mt-4 rounded bg-gray-100 p-4">
					<h3 class="mb-2 font-semibold">Decrypted Message:</h3>
					<p class="whitespace-pre-wrap">{decryptedMessage}</p>
				</div>
			{/if}
		</div>
	{/if}

	{#if error}
		<div class="mt-4 rounded bg-red-100 p-4 text-red-700">
			{error}
		</div>
	{/if}

	{#if success}
		<div class="mt-4 rounded bg-green-100 p-4 text-green-700">
			{success}
		</div>
	{/if}
</div>
