import { Link } from "react-router-dom";
import { useAuth } from "../useAuth";
import { useFavourites } from "../useFavourites";

export default function Header() {
	const { user, logout } = useAuth();
	const { favourites } = useFavourites();

	return (
		<header className="app-header">
			<Link to="/" className="app-title">
				Adventure Lab Finder
			</Link>
			<div className="user-menu">
				{user && (
					<>
						<div className="user-info">
							<div className="user-header">
								<img
									src={user.Avatar.AvatarUrl}
									alt=""
									className="user-avatar"
								/>
								<span>{user.UserName}</span>
							</div>
							<Link to="/favourites" className="favourites-link">
								Favourite labs ({favourites.length})
							</Link>
							<button
								type="button"
								className="logout-link"
								onClick={logout}
							>
								Log out
							</button>
						</div>
					</>
				)}
			</div>
		</header>
	);
}
