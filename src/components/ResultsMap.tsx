import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { LabSummary, LatLng } from "../types";
import { Link } from "react-router-dom";
import { distanceBetween } from "../utils/distanceBetween";
import L from "leaflet";

const mapWidth = 360;

interface Props {
	centre: LatLng;
	radius: number;
	labs: LabSummary[];
	searchCentre: LatLng | null;
}

const statusMarker = (lab: LabSummary) => {
	const colours = {
		NotStarted: "#d32f2f",
		InProgress: "#f9a825",
		Completed: "#388e3c",
	};

	const colour =
		lab.ownerPublicGuid === localStorage.getItem("userGuid")
			? "#1976d2"
			: colours[lab.completionStatus];

	return L.divIcon({
		className: "status-marker",
		html: `<div class="status-marker-pin" style="background-color: ${colour}"></div>`,
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
	});
};

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

export default function ResultsMap({
	centre,
	radius,
	labs,
	searchCentre,
}: Props) {
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
					icon={statusMarker(lab)}
				>
					<Popup>
						<Link to={`/labs/${lab.adventureGuid}`}>
							{lab.title}
						</Link>
						<div className="results-list-meta">
							{lab.ratingsAverage !== null && (
								<span>★ {lab.ratingsAverage.toFixed(1)}</span>
							)}
							{lab.stagesTotalCount !== null && (
								<span>{lab.stagesTotalCount} stages</span>
							)}
							{searchCentre && (
								<span>
									{(
										distanceBetween(
											lab.location,
											searchCentre,
										) / 1000
									).toFixed(2)}{" "}
									km
								</span>
							)}
						</div>
					</Popup>
				</Marker>
			))}
		</MapContainer>
	);
}
