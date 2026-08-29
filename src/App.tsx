import { Routes, Route, useLocation } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import LabDetailPage from "./pages/LabDetailPage";
import LabStageDetailPage from "./pages/LabStageDetailPage";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import Header from "./components/Header";

export default function App() {
	useLocation();

	return (
		<div className="app">
			<Header />
			<main>
				<Routes>
					<Route path="/login" element={<LoginPage />} />
					<Route element={<RequireAuth />}>
						<Route path="/" element={<SearchPage />} />
						<Route path="/labs/:guid" element={<LabDetailPage />} />
						<Route
							path="/labs/:guid/stage/:stageId"
							element={<LabStageDetailPage />}
						/>
					</Route>
				</Routes>
			</main>
		</div>
	);
}
