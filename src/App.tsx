import { Routes, Route, Link } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import LabDetailPage from "./pages/LabDetailPage";

export default function App() {
	return (
		<div className="app">
			<header className="app-header">
				<Link to="/" className="app-title">
					Adventure Lab Finder
				</Link>
			</header>
			<main>
				<Routes>
					<Route path="/" element={<SearchPage />} />
					<Route path="/labs/:guid" element={<LabDetailPage />} />
				</Routes>
			</main>
		</div>
	);
}
