import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { LabDetail, LatLng } from "../types";
import { Link } from "react-router-dom";
import { distanceBetween } from "../utils/distanceBetween";
import { radiusToZoom, statusMarker } from "../utils/mapUtils";

const mapWidth = 360;

interface Props {
	centre: LatLng;
	radius: number;
	lab: LabDetail;
	searchCentre: LatLng | null;
}

export default function LabMap({ centre, radius, lab, searchCentre }: Props) {
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
			{lab.stageSummaries.map((stage) => (
				<Marker
					key={stage.id}
					position={[
						stage.location.latitude,
						stage.location.longitude,
					]}
					icon={statusMarker({ stage })}
				>
					<Popup>
						<Link
							to={`/labs/${lab.adventureGuid}/stage/${stage.id}`}
						>
							{stage.title}
						</Link>
						{searchCentre !== null && (
							<div className="results-list-meta">
								<span>
									{(
										distanceBetween(
											stage.location,
											searchCentre,
										) / 1000
									).toFixed(2)}{" "}
									km
								</span>
							</div>
						)}
					</Popup>
				</Marker>
			))}
		</MapContainer>
	);
}
