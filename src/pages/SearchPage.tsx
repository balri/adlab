import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SearchForm from "../components/SearchForm";
import ResultsList from "../components/ResultsList";
import ResultsMap from "../components/ResultsMap";
import { searchLabs } from "../api";
import type { LabSummary, LatLng, SearchParams } from "../types";

function getCentre(labs: LabSummary[]) {
  if (labs.length === 0) {
    return null;
  }

  const lats = labs.map(l => l.location.latitude);
  const lngs = labs.map(l => l.location.longitude);

  return {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [labs, setLabs] = useState<LabSummary[]>([]);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [radiusMetres, setRadiusMetres] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(params: SearchParams) {
    setLoading(true);
    setError(null);
    try {
      const results = await searchLabs(params);
      setLabs(results);
      setCenter(getCentre(results));
      setRadiusMetres(params.radiusInMeters);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-page">
      <SearchForm onSearch={handleSearch} loading={loading} />
      {error && <p className="error-text">{error}</p>}
      {center && (
        <div className="search-results">
          <ResultsMap
            center={center}
            radiusMetres={radiusMetres}
            labs={labs}
            onSelect={(guid) => navigate(`/labs/${guid}`)}
          />
          <ResultsList labs={labs} />
        </div>
      )}
    </div>
  );
}
