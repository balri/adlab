import { useEffect, useState } from "react";
import type { LatLng } from "../types";

interface Props {
	location: LatLng;
	name?: string;
}

function formatCoordinate(
	coordinate: number,
	degreeDigits: number,
	positiveDirection: string,
	negativeDirection: string,
) {
	const roundedMinutes = Math.round(Math.abs(coordinate) * 60 * 1000);
	const degrees = Math.floor(roundedMinutes / 60000);
	const minutes = ((roundedMinutes % 60000) / 1000)
		.toFixed(3)
		.padStart(6, "0");
	const direction = coordinate < 0 ? negativeDirection : positiveDirection;

	return `${direction}${String(degrees).padStart(degreeDigits, "0")} ${minutes}`;
}

function formatCoordinates(location: LatLng) {
	return `${formatCoordinate(location.latitude, 2, "N", "S")} ${formatCoordinate(location.longitude, 3, "E", "W")}`;
}

export default function CoordinateLink({ location, name }: Props) {
	const coordinates = formatCoordinates(location);
	const coordinatePair = `${location.latitude},${location.longitude}`;
	const mapName = name?.trim();
	const isAppleDevice =
		/iphone|ipad|ipod/i.test(navigator.userAgent) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
	const isAndroidDevice = /android/i.test(navigator.userAgent);
	const androidQuery = mapName
		? `${coordinatePair}(${encodeURIComponent(mapName).replace(/%20/g, "+")})`
		: coordinatePair;
	const mapUrl = isAppleDevice
		? `https://maps.apple.com/?ll=${coordinatePair}&q=${encodeURIComponent(mapName || coordinatePair)}`
		: isAndroidDevice
			? `geo:0,0?q=${androidQuery}`
			: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinatePair)}`;
	const [copyStatus, setCopyStatus] = useState("Copy");

	useEffect(() => {
		if (copyStatus !== "Copied") return;

		const timeoutId = window.setTimeout(() => setCopyStatus("Copy"), 1500);
		return () => window.clearTimeout(timeoutId);
	}, [copyStatus]);

	async function copyCoordinates() {
		try {
			await navigator.clipboard.writeText(coordinates);
			setCopyStatus("Copied");
		} catch {
			setCopyStatus("Copy failed");
		}
	}

	return (
		<span className="coordinate-actions">
			<a
				href={mapUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="coordinate-link"
				title={mapName ? `Open ${mapName} in Maps` : "Open in Maps"}
			>
				Navigate
			</a>
			<button
				type="button"
				className="coordinate-copy"
				aria-label="Copy coordinates"
				title={`Copy coordinates`}
				onClick={copyCoordinates}
			>
				{copyStatus}
			</button>
		</span>
	);
}
