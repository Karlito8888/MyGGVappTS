import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";
import houseImage from "../assets/img/house.png";
import pinImage from "../assets/img/pin.png";
import { useAuth } from "../hooks";
import { useAssociatedLocationsWithCoords, useUserLocationIds } from "../hooks";

const MAP_STYLES = {
	osm: {
		version: 8 as const,
		glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
		sources: {
			osm: {
				type: "raster" as const,
				tiles: [
					"https://tile.openstreetmap.org/{z}/{x}/{y}.png",
					"https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
					"https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
					"https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
				],
				tileSize: 256,
				maxzoom: 19,
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			},
		},
		layers: [
			{
				id: "osm",
				type: "raster" as const,
				source: "osm",
			},
		],
	},
};

interface MapProps {
	style?: React.CSSProperties;
	className?: string;
}

export default function MapComponent({ style, className }: MapProps) {
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<maplibregl.Map | null>(null);
	const markersRef = useRef<maplibregl.Marker[]>([]);

	const { user } = useAuth();
	const { data: locations = [] } = useAssociatedLocationsWithCoords();
	const { data: userLocationIds = [] } = useUserLocationIds(user?.id || "");

	useEffect(() => {
		if (!mapContainer.current) return;

		map.current = new maplibregl.Map({
			container: mapContainer.current,
			style: MAP_STYLES.osm,
			center: [120.95134859887523, 14.347872973134175],
			zoom: 15,
		});

		return () => {
			map.current?.remove();
		};
	}, []);

	useEffect(() => {
		if (!map.current || locations.length === 0) return;

		// Clear existing markers
		for (const marker of markersRef.current) {
			marker.remove();
		}
		markersRef.current = [];

		// Add markers for each location
		for (const location of locations) {
			// Handle coordinates which might be an object or string
			let coords: { lat: number; lng: number } | null = null;

			if (
				typeof location.coordinates === "object" &&
				location.coordinates !== null
			) {
				coords = location.coordinates;
			} else if (typeof location.coordinates === "string") {
				try {
					coords = JSON.parse(location.coordinates);
				} catch (e) {
					console.warn("Invalid coordinates format:", location.coordinates);
				}
			}

			if (coords?.lat && coords.lng) {
				// Determine if this location belongs to the current user
				const isUserLocation = userLocationIds.includes(location.id);

				// Use different icons based on ownership
				const el = document.createElement("img");
				el.src = isUserLocation ? houseImage : pinImage;

				// Different sizes for house vs pin
				if (isUserLocation) {
					el.style.width = "26px";
					el.style.height = "auto";
				} else {
					el.style.width = "auto";
					el.style.height = "32px";
				}

				// Create the MapLibre marker with coordinates
				const marker = new maplibregl.Marker({ element: el })
					.setLngLat([coords.lng, coords.lat])
					.addTo(map.current);

				markersRef.current.push(marker);
			}
		}
	}, [locations, userLocationIds]);

	return (
		<div
			ref={mapContainer}
			style={{
				width: "100%",
				height: "100%",
				...style,
			}}
			className={className}
		/>
	);
}
