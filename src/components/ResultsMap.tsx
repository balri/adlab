import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { LabSummary, LatLng } from "../types";

interface Props {
  center: LatLng;
  labs: LabSummary[];
  onSelect: (guid: string) => void;
}

function RecenterOnChange({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.latitude, center.longitude]);
  }, [center.latitude, center.longitude, map]);
  return null;
}

export default function ResultsMap({ center, labs, onSelect }: Props) {
  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={12}
      className="results-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterOnChange center={center} />
      {labs.map((lab) => (
        <Marker
          key={lab.guid}
          position={[lab.location.latitude, lab.location.longitude]}
          eventHandlers={{ click: () => onSelect(lab.guid) }}
        >
          <Popup>{lab.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
