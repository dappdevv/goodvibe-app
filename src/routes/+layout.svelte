<script lang="ts">
	import '../app.css';
	import WalletInfo from '$lib/components/WalletInfo.svelte';
	let { children } = $props();
</script>

<WalletInfo />
{@render children()}
