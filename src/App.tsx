import {
	Routes,
	Route,
	Link,
	useLocation,
	useNavigate,
} from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import LabDetailPage from "./pages/LabDetailPage";
import LabStageDetailPage from "./pages/LabStageDetailPage";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import { logout } from "./api";

export default function App() {
	const navigate = useNavigate();
	useLocation();
	const isLoggedIn = Boolean(sessionStorage.getItem("accessToken"));

	function handleLogout() {
		logout();
		navigate("/login");
	}

	return (
		<div className="app">
			<header className="app-header">
				<Link to="/" className="app-title">
					Adventure Lab Finder
				</Link>
				{isLoggedIn && (
					<button
						type="button"
						className="logout-link"
						onClick={handleLogout}
					>
						Log out
					</button>
				)}
			</header>
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
