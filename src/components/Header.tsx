import { Link } from "react-router-dom";
import { useAuth } from "../useAuth";

export default function Header() {
	const { user, logout } = useAuth();

	return (
		<header className="app-header">
			<Link to="/" className="app-title">
				Adventure Lab Finder
			</Link>
			<div className="user-menu">
				{user && (
					<>
						<img
							src={user.Avatar.AvatarUrl}
							alt=""
							className="user-avatar"
						/>
						<span>{user.UserName}</span>
						<button
							type="button"
							className="logout-link"
							onClick={logout}
						>
							Log out
						</button>
					</>
				)}
			</div>
		</header>
	);
}
