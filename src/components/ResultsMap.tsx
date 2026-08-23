import {
	MapContainer,
	Marker,
	TileLayer,
	Tooltip,
	useMap,
} from "react-leaflet";
import { useEffect } from "react";
import type { LabSummary, LatLng } from "../types";

const mapWidth = 360;

interface Props {
	centre: LatLng;
	radius: number;
	labs: LabSummary[];
	onSelect: (guid: string) => void;
}

function RecentreOnChange({
	centre,
	radius,
}: {
	centre: LatLng;
	radius: number;
}) {
	const map = useMap();
	useEffect(() => {
		map.setView([centre.latitude, centre.longitude]);
		map.setZoom(radiusToZoom(radius, centre.latitude, mapWidth));
	}, [centre.latitude, centre.longitude, radius, map]);
	return null;
}

function radiusToZoom(
	radius: number,
	latitude: number,
	mapWidthPixels: number,
): number {
	const earthCircumference = 40075016.686;

	const metresPerPixelAtZoom0 =
		(earthCircumference * Math.cos((latitude * Math.PI) / 180)) / 256;

	const desiredPixels = mapWidthPixels / 2;

	return Math.log2((metresPerPixelAtZoom0 * desiredPixels) / radius);
}

export default function ResultsMap({ centre, radius, labs, onSelect }: Props) {
	const zoomLevel = radiusToZoom(radius, centre.latitude, mapWidth);

	return (
		<MapContainer
			center={[centre.latitude, centre.longitude]}
			zoom={zoomLevel}
			className="results-map"
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<RecentreOnChange centre={centre} radius={radius} />
			{labs.map((lab) => (
				<Marker
					key={lab.adventureGuid}
					position={[lab.location.latitude, lab.location.longitude]}
					eventHandlers={{ click: () => onSelect(lab.adventureGuid) }}
				>
					<Tooltip>{lab.title}</Tooltip>
				</Marker>
			))}
		</MapContainer>
	);
}
