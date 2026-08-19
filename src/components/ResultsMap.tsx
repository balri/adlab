import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { LabSummary, LatLng } from "../types";

const mapWidth = 360;

interface Props {
  center: LatLng;
  radiusMetres: number;
  labs: LabSummary[];
  onSelect: (guid: string) => void;
}

function RecenterOnChange({ center, radiusMetres }: { center: LatLng; radiusMetres: number; }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.latitude, center.longitude]);
    map.setZoom(radiusToZoom(radiusMetres, center.latitude, mapWidth));
  }, [center.latitude, center.longitude, map]);
  return null;
}

function radiusToZoom(
  radiusMetres: number,
  latitude: number,
  mapWidthPixels: number
): number {
  const earthCircumference = 40075016.686;

  const metresPerPixelAtZoom0 =
    earthCircumference * Math.cos(latitude * Math.PI / 180) /
    256;

  const desiredPixels = mapWidthPixels / 2;

  return Math.log2(
    metresPerPixelAtZoom0 * desiredPixels / radiusMetres
  );
}

export default function ResultsMap({ center, radiusMetres, labs, onSelect }: Props) {
  const zoomLevel = radiusToZoom(radiusMetres, center.latitude, mapWidth);

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={zoomLevel}
      className="results-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterOnChange center={center} radiusMetres={radiusMetres} />
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
