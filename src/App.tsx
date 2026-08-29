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
import { useState } from "react";
import { User } from "./types";

export default function App() {
	const navigate = useNavigate();
	useLocation();
	const [isLoggedIn, setIsLoggedIn] = useState(() => {
		const accessToken = sessionStorage.getItem("accessToken");
		const expiresAt = Number(
			sessionStorage.getItem("accessTokenExpiresAt"),
		);

		return Boolean(accessToken) && expiresAt > Date.now();
	});
	const [user, setUser] = useState<User | null>(() => {
		const savedUser = sessionStorage.getItem("user");

		if (!savedUser) {
			return null;
		}

		try {
			return JSON.parse(savedUser);
		} catch {
			sessionStorage.removeItem("user");
			return null;
		}
	});

	function handleLogout() {
		logout();
		setUser(null);
		setIsLoggedIn(false);
		navigate("/login");
	}

	return (
		<div className="app">
			<header className="app-header">
				<Link to="/" className="app-title">
					Adventure Lab Finder
				</Link>
				{isLoggedIn && (
					<div className="user-menu">
						{user && (
							<>
								<img
									src={user.Avatar.AvatarUrl}
									alt=""
									className="user-avatar"
								/>
								<span>{user.UserName}</span>
							</>
						)}
						<button
							type="button"
							className="logout-link"
							onClick={handleLogout}
						>
							Log out
						</button>
					</div>
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
