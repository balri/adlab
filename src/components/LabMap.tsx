import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { LabDetail, LatLng } from "../types";
import { Link } from "react-router-dom";
import { distanceBetween } from "../utils/distanceBetween";
import { getBounds, getCentre, statusMarker } from "../utils/mapUtils";
import FitBounds from "./FitBounds";

interface Props {
	lab: LabDetail;
	searchCentre: LatLng | null;
}

export default function LabMap({ lab, searchCentre }: Props) {
	const centre = getCentre(lab.stageSummaries);
	const bounds = getBounds(lab.stageSummaries);

	if (!centre) {
		return null;
	}

	return (
		<MapContainer
			center={[centre.latitude, centre.longitude]}
			zoom={10}
			className="search-map"
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<FitBounds bounds={bounds} />
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
