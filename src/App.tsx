import { Routes, Route, useLocation } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import LabDetailPage from "./pages/LabDetailPage";
import LabStageDetailPage from "./pages/LabStageDetailPage";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import Header from "./components/Header";
import LabReviews from "./pages/LabReviews";
import FavoritesPage from "./pages/FavoritesPage";
import { FavoritesProvider } from "./FavoritesProvider";

export default function App() {
	useLocation();

	return (
		<FavoritesProvider>
			<div className="app">
				<Header />
				<main>
					<Routes>
						<Route path="/login" element={<LoginPage />} />
						<Route element={<RequireAuth />}>
							<Route path="/" element={<SearchPage />} />
							<Route
								path="/favorites"
								element={<FavoritesPage />}
							/>
							<Route
								path="/labs/:guid"
								element={<LabDetailPage />}
							/>
							<Route
								path="/labs/:guid/stage/:stageId"
								element={<LabStageDetailPage />}
							/>
							<Route
								path="/labs/:guid/reviews"
								element={<LabReviews />}
							/>
						</Route>
					</Routes>
				</main>
			</div>
		</FavoritesProvider>
	);
}
