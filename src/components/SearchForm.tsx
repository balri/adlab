import { useState } from "react";
import type { SearchParams } from "../types";

interface Props {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

const DEFAULT_RADIUS = 10000;
const DEFAULT_TAKE = 25;

export default function SearchForm({ onSearch, loading }: Props) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusInMeters, setRadiusInMeters] = useState(DEFAULT_RADIUS);
  const [take, setTake] = useState(DEFAULT_TAKE);
  const [geoError, setGeoError] = useState<string | null>(null);

  function useMyLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
      },
      (err) => setGeoError(err.message),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setGeoError("Enter a valid latitude and longitude");
      return;
    }
    setGeoError(null);
    onSearch({ latitude: lat, longitude: lng, radiusInMeters, take });
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-form-row">
        <label>
          Latitude
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
          />
        </label>
        <button type="button" onClick={useMyLocation}>
          Use my location
        </button>
      </div>
      <div className="search-form-row">
        <label>
          Radius (m)
          <input
            type="number"
            min={100}
            max={100000}
            step={100}
            value={radiusInMeters}
            onChange={(e) => setRadiusInMeters(Number(e.target.value))}
          />
        </label>
        <label>
          Max results
          <input
            type="number"
            min={1}
            max={100}
            value={take}
            onChange={(e) => setTake(Number(e.target.value))}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </div>
      {geoError && <p className="error-text">{geoError}</p>}
    </form>
  );
}
