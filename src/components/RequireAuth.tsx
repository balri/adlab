import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAuth() {
	const location = useLocation();
	const accessToken = sessionStorage.getItem("accessToken");

	if (!accessToken) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
}
