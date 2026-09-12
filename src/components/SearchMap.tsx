import {
	MapContainer,
	Marker,
	Popup,
	TileLayer,
	Tooltip,
	useMap,
} from "react-leaflet";
import { useEffect, useRef } from "react";
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
	onRecentre: (centre: LatLng) => void;
}
const statusMarker = (lab: LabSummary) => {
	const colour =
		lab.ownerPublicGuid === localStorage.getItem("userGuid")
			? "#1976d2"
			: {
					NotStarted: "#c62828",
					InProgress: "#e09f00",
					Completed: "#388e3c",
				}[lab.completionStatus];

	return L.divIcon({
		className: "",
		html: `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="33"
        viewBox="0 0 25 41"
      >
        <path
          fill="${colour}"
          stroke="#fff"
          stroke-width="1"
          d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"
        />
        <circle
          cx="12.5"
          cy="12.5"
          r="4"
          fill="#fff"
        />
      </svg>
    `,
		iconSize: [20, 33],
		iconAnchor: [10, 33],
		popupAnchor: [0, -33],
	});
};

function RecentreOnChange({
	centre,
	searchCentre,
	radius,
	onRecentre,
}: {
	centre: LatLng;
	searchCentre: LatLng | null;
	radius: number;
	onRecentre: (centre: LatLng) => void;
}) {
	const map = useMap();

	const previousCentre = useRef<LatLng | null>(null);

	// A new search result centre has arrived.
	useEffect(() => {
		const centreChanged =
			previousCentre.current === null ||
			previousCentre.current.latitude !== centre.latitude ||
			previousCentre.current.longitude !== centre.longitude;

		if (centreChanged) {
			map.setView(
				[centre.latitude, centre.longitude],
				radiusToZoom(radius, centre.latitude, mapWidth),
			);

			previousCentre.current = centre;
		}
	}, [centre, radius, map]);

	// User dragged the map.
	useEffect(() => {
		const handleDragEnd = () => {
			const mapCentre = map.getCenter();

			onRecentre({
				latitude: Number(mapCentre.lat.toFixed(6)),
				longitude: Number(mapCentre.lng.toFixed(6)),
			});
		};

		map.on("dragend", handleDragEnd);

		return () => {
			map.off("dragend", handleDragEnd);
		};
	}, [map, onRecentre]);

	// Use My Location / other external search-centre change.
	useEffect(() => {
		if (!searchCentre) return;

		const isDifferent =
			searchCentre.latitude !== map.getCenter().lat ||
			searchCentre.longitude !== map.getCenter().lng;

		if (isDifferent) {
			map.panTo([searchCentre.latitude, searchCentre.longitude]);
		}
	}, [searchCentre, map]);

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

export default function SearchMap({
	centre,
	radius,
	labs,
	searchCentre,
	onRecentre,
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
			<RecentreOnChange
				centre={centre}
				radius={radius}
				searchCentre={searchCentre}
				onRecentre={onRecentre}
			/>
			{labs.map((lab) => (
				<Marker
					key={lab.adventureGuid}
					position={[lab.location.latitude, lab.location.longitude]}
					icon={statusMarker(lab)}
				>
					<Tooltip>{lab.title}</Tooltip>
					<Popup>
						<Link to={`/labs/${lab.adventureGuid}`}>
							{lab.title}
						</Link>
						<div className="results-list-meta">
							{lab.ratingsAverage !== null && (
								<span>
									★ {lab.ratingsAverage.toFixed(1)} (
									{lab.ratingsTotalCount})
								</span>
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
