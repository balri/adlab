import { createContext } from "react";
import type { LoginParams, User } from "./types";

export interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (params: LoginParams) => Promise<void>;
	logout: () => void;
	authenticatedFetch: <T>(url: string, signal?: AbortSignal) => Promise<T>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);
