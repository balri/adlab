import type { MouseEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface Props {
	to: string;
	children: ReactNode;
}

export default function BackLink({ to, children }: Props) {
	const location = useLocation();
	const navigate = useNavigate();
	const hasInAppHistory = location.key !== "default";

	function handleClick(event: MouseEvent<HTMLAnchorElement>) {
		if (
			!hasInAppHistory ||
			event.button !== 0 ||
			event.metaKey ||
			event.altKey ||
			event.ctrlKey ||
			event.shiftKey
		) {
			return;
		}

		event.preventDefault();
		navigate(-1);
	}

	return (
		<Link to={to} onClick={handleClick}>
			{children}
		</Link>
	);
}
