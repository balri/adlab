import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import type { LabSummary, LatLng } from "../types";
import { Link } from "react-router-dom";
import LabMeta from "./LabMeta";
import { radiusToZoom, statusMarker } from "../utils/mapUtils";

const mapWidth = 360;

interface Props {
	centre: LatLng;
	radius: number;
	labs: LabSummary[];
	searchCentre: LatLng | null;
	onRecentre: (centre: LatLng) => void;
}

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
	const previousRadius = useRef<number | null>(null);
	const userDragged = useRef(false);

	useEffect(() => {
		const searchChanged =
			previousCentre.current === null ||
			previousCentre.current.latitude !== centre.latitude ||
			previousCentre.current.longitude !== centre.longitude ||
			previousRadius.current !== radius;

		if (searchChanged) {
			map.flyTo(
				[centre.latitude, centre.longitude],
				radiusToZoom(radius, centre.latitude, mapWidth),
			);

			previousCentre.current = centre;
			previousRadius.current = radius;
		}
	}, [centre, radius, map]);

	// User dragged the map.
	useEffect(() => {
		const handleDragEnd = () => {
			userDragged.current = true;
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
		if (!searchCentre || userDragged.current) {
			userDragged.current = false;
			return;
		}

		const isDifferent =
			searchCentre.latitude !== map.getCenter().lat ||
			searchCentre.longitude !== map.getCenter().lng;

		if (isDifferent) {
			map.flyTo(
				[searchCentre.latitude, searchCentre.longitude],
				radiusToZoom(radius, centre.latitude, mapWidth),
			);
		}
	}, [searchCentre, map, centre.latitude, radius]);

	return null;
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
			className="search-map"
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
					icon={statusMarker({ lab })}
				>
					<Popup>
						<Link to={`/labs/${lab.adventureGuid}`}>
							{lab.title}
						</Link>
						<LabMeta lab={lab} searchCentre={searchCentre} />
					</Popup>
				</Marker>
			))}
		</MapContainer>
	);
}
