import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SearchForm from "../components/SearchForm";
import ResultsList from "../components/ResultsList";
import ResultsMap from "../components/ResultsMap";
import { searchLabs } from "../api";
import type { LabSummary, LatLng, SearchParams } from "../types";

export default function SearchPage() {
  const navigate = useNavigate();
  const [labs, setLabs] = useState<LabSummary[]>([]);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(params: SearchParams) {
    setLoading(true);
    setError(null);
    try {
      const results = await searchLabs(params);
      setLabs(results);
      setCenter({ latitude: params.latitude, longitude: params.longitude });
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
            labs={labs}
            onSelect={(guid) => navigate(`/labs/${guid}`)}
          />
          <ResultsList labs={labs} />
        </div>
      )}
    </div>
  );
}
