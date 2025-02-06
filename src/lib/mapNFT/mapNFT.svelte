<script>
	import { onDestroy, onMount } from 'svelte';
	import { getContext } from 'svelte';
	import geojsonABI from '$lib/abi/geojson.json';
	import nftABI from '$lib/abi/daoNFT.json';
	import {
		createPublicClient,
		createWalletClient,
		http,
		defineChain,
		parseEther,
		formatEther,
		getContract,
		formatUnits
	} from 'viem';
	import {
		privateKeyToAccount,
		generatePrivateKey,
		generateMnemonic,
		english,
		mnemonicToAccount
	} from 'viem/accounts';

	import { publicClient } from '$lib/chain/config';

	// Get the map context
	const { getMap } = getContext('map');
	const map = getMap();

	export let currentNFTArea = {};
	$: nft = currentNFTArea;
	console.log('nft: ', nft);

	let clickedPolygonCoors = {};

	const contractGEOJSON = getContract({
		address: import.meta.env.VITE_GEOJSON_ADDRESS,
		abi: geojsonABI,
		client: publicClient
	});

	const contractNFT = getContract({
		address: import.meta.env.VITE_DAO_NFT_ADDRESS,
		abi: nftABI,
		client: publicClient
	});

	onMount(async () => {
		// let { lng, lat } = map.getCenter();
		// console.log('center lng lat: ', lng, lat);

		// let corrected = correctCoors(lng, lat);
		// console.log('corrected: ', corrected);

		// const adjustedLng = Math.trunc(corrected.lng * 1000) * 1e14;
		// const adjustedLat = Math.trunc(corrected.lat * 1000) * 1e14;
		// console.log('adjustedLng: ', adjustedLng);
		// console.log('adjustedLat: ', adjustedLat);
		// const test = await contractGEOJSON.read.calcCoordinates([adjustedLng, adjustedLat]);
		// console.log('test: ', test);
		const testNFT = await contractNFT.read.getTokenCoordinates([1]);
		console.log('testNFT: ', testNFT);
		// await generateNFTBounds();
	});

	onDestroy(() => {
		unsubscribe();
	});

	async function unsubscribe() {
		map.off('click', `polygons-layer`, onPolygonLayerClick);
	}

	async function getTokenCoordinates() {}

	function correctCoors(lng, lat) {
		var point = { lat: lat, lng: lng };
		var quadrant = Math.floor(Math.abs(lat) / 90) % 4;
		var pole = lat > 0 ? 90 : -90;
		var offset = lat % 90;

		switch (quadrant) {
			case 0:
				point.lat = offset;
				break;
			case 1:
				point.lat = pole - offset;
				point.lng += 180;
				break;
			case 2:
				point.lat = -offset;
				point.lng += 180;
				break;
			case 3:
				point.lat = -pole + offset;
				break;
		}

		if (point.lng > 180 || point.lng < -180) {
			point.lng -= Math.floor((point.lng + 180) / 360) * 360;
		}

		return point;
	}

	async function generateNFTBounds() {
		const bounds = map.getBounds();
		console.log('start generateNFTBounds, map bounds: ', bounds);

		const startX = Math.trunc(bounds._sw.lng * 1000) / 1000;
		const startY = Math.trunc(bounds._sw.lat * 1000) / 1000;

		let squareAmount = 10;

		const zoom = map.getZoom();
		console.log('zoom: ', zoom);

		if (zoom < 15) squareAmount = 10;
		if (zoom < 14.5) squareAmount = 20;
		if (zoom < 14) squareAmount = 30;
		if (zoom < 13.5) squareAmount = 40;

		if (zoom < 13) {
			if (map.getLayer('polygons-layer')) map.removeLayer('polygons-layer');
			if (map.getSource('polygons')) map.removeSource('polygons');
			return;
		}

		await geojsonFromContract(startX, startY, squareAmount);
	}

	async function geojsonFromContract(startX, startY, squareAmount) {
		const amount = squareAmount;
		const startLng = Math.abs(Math.round(startX * 1e14));
		const startLat = Math.abs(Math.round(startY * 1e14));

		console.log('geojsonFromContract: ', { startLng, startLat });

		try {
			const res = await contractGEOJSON.read.generateGeoJSON([amount, startLng, startLat]);
			console.log('generate res: ', res);

			const arrayResponse = convertResponseToArray(res);
			// console.log("arrayResponse: ", arrayResponse);

			const formatted = convertBigNumberArrayToIntegerArray(arrayResponse);
			// console.log("formatted: ", formatted);

			const geojson = generateGeoJsonFromCoordinatesArray(formatted);
			console.log('geojson: ', geojson);

			displayNFTBounds(geojson);
		} catch (error) {
			console.log(error);
		}
	}

	function convertResponseToArray(response) {
		const array = [];

		for (let i = 0; i < Object.keys(response).length; i++) {
			const innerArray = [];

			for (let j = 0; j < Object.keys(response[i]).length; j++) {
				const innerInnerArray = [];

				for (let k = 0; k < Object.keys(response[i][j]).length; k++) {
					const values = response[i][j][k];
					innerInnerArray.push(values);
				}

				innerArray.push(innerInnerArray);
			}

			array.push(innerArray);
		}

		return array;
	}

	function convertBigNumberArrayToIntegerArray(arr) {
		for (let i = 0; i < arr.length; i++) {
			for (let j = 0; j < arr[i].length; j++) {
				for (let k = 0; k < arr[i][j].length; k++) {
					arr[i][j][k] = +formatUnits(arr[i][j][k], 14);
				}
			}
		}

		return arr;
	}

	function generateGeoJsonFromCoordinatesArray(arr) {
		const features = [];

		arr.forEach((coors) => {
			const square = {
				type: 'Feature',
				properties: {
					coordinates: [coors]
				},
				geometry: {
					type: 'Polygon',
					coordinates: [coors]
				}
			};

			features.push(square);
		});

		const geoJSON = {
			type: 'FeatureCollection',
			features: features
		};

		return geoJSON;
	}

	function displayNFTBounds(geojson) {
		map.off('click', `polygons-layer`, onPolygonLayerClick);

		if (map.getLayer('polygons-layer')) map.removeLayer('polygons-layer');
		if (map.getSource('polygons')) map.removeSource('polygons');

		map.addSource('polygons', {
			type: 'geojson',
			data: geojson,
			generateId: true
		});

		map.addLayer({
			id: 'polygons-layer',
			type: 'fill',
			source: `polygons`,
			paint: {
				'fill-color': 'rgba(200, 100, 240, 0.4)',
				'fill-outline-color': 'rgba(200, 100, 240, 2)',
				'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.1, 0.5]
			}
		});

		map.on('click', `polygons-layer`, onPolygonLayerClick);
	}

	async function onPolygonLayerClick(e) {
		const el = e.features[0];
		console.log('on click el: ', el);

		const coors = JSON.parse(el.properties.coordinates);
		const startLng = coors[0][0][0] * 1e14;
		const startLat = coors[0][0][1] * 1e14;

		clickedPolygonCoors = { lng: startLng, lat: startLat };
		console.log('clickedPolygonCoors: ', clickedPolygonCoors);
		console.log('lng + lat: ', `${startLng}${startLat}`);

		map.setFeatureState(
			{
				source: 'polygons',
				id: el.id
			},
			{
				hover: true
			}
		);

		map.once('mousemove', 'polygons-layer', () => {
			map.setFeatureState({ source: 'polygons', id: el.id }, { hover: false });
		});
		map.once('mouseleave', 'polygons-layer', () => {
			map.setFeatureState({ source: 'polygons', id: el.id }, { hover: false });
		});

		currentNFTArea = {
			coordinates: e.features[0].properties.coordinates,
			info: null,
			tokenId: null
		};

		console.log('currentNFTArea: ', currentNFTArea);
	}
</script>

<style>
	/* Add any custom styles here if needed */
</style>
