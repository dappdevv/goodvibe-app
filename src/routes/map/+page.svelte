<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import MapNFT from '$lib/mapNFT/mapNFT.svelte';

	let mapContainer: HTMLElement;
	let map: maplibregl.Map;
	let mapInitialized = false;
	let nftMap = false;

	// Set up map context for child components
	setContext('map', {
		getMap: () => map
	});

	function roundCoordinate(coord: number): number {
		return Math.round(coord * 1000) / 1000;
	}

	onMount(() => {
		if (mapContainer) {
			map = new maplibregl.Map({
				container: mapContainer,
				style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAP_TILER_API_KEY}`,
				center: [52.3924, 55.7306],
				zoom: 15,
				maxZoom: 19,
				attributionControl: false,
				doubleClickZoom: false
			});

			map.on('load', () => {
				mapInitialized = true;
			});

			// Add click handler to log coordinates
			map.on('click', (e) => {
				const lng = e.lngLat.lng;
				const lat = e.lngLat.lat;
				// const lng = roundCoordinate(e.lngLat.lng);
				// const lat = roundCoordinate(e.lngLat.lat);
				console.log('Clicked coordinates:', { lng, lat });
				nftMap = nftMap ? false : true;
			});

			// Clean up on component destruction
			return () => {
				map.remove();
			};
		}
	});
</script>

<div class="map-container">
	<div bind:this={mapContainer} id="map"></div>
	{#if mapInitialized && nftMap}
		<MapNFT />
	{/if}
</div>

<style>
	.map-container {
		width: 100%;
	}

	#map {
		min-height: 600px;
		width: 100%;
	}

	:global(.maplibregl-control-container) {
		display: none;
	}
</style>
