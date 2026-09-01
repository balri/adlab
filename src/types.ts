export interface LatLng {
	latitude: number;
	longitude: number;
}

// interface AdventureCredit {
//   isFeatured: boolean;
//   isPartner: boolean;
//   maxStages: number;
//   feeAllowed: boolean;
//   hyperlinksAllowed: boolean;
//   lodestoneAllowed: boolean;
// }

export type CompletionStatus = "NotStarted" | "InProgress" | "Completed";

export interface LabSummary {
	adventureGuid: string;
	title: string;
	keyImageUrl: string;
	smartLink: string;
	deepLink: string;
	firebaseDynamicLink: string;
	description: string;
	ownerPublicGuid: string;
	// visibility: string;
	createdUtc: string;
	publishedUtc: string;
	// isArchived: boolean;
	ratingsAverage: number;
	ratingsTotalCount: number;
	isHighlyRecommended: boolean;
	location: LatLng;
	stagesTotalCount: number;
	// isTest: boolean;
	adventureType: string;
	completionStatus: CompletionStatus;
	adventureThemes: Array<string>;
	// adventureCredit: AdventureCredit;
}

export interface LabStage {
	id: string;
	title: string;
	keyImageUrl: string;
	// findCodeHashBase16v2: Array<string>;
	// answerCodeHashesBase16v2: Array<string>;
	isComplete: boolean;
	description: string;
	location: LatLng;
	geofencingRadius: number;
	challengeType: string;
	question: string;
	isFinal: boolean;
}

export interface LabDetail extends LabSummary {
	stageSummaries: LabStage[];
	journalsTotalCount: number;
	ownerUsername: string;
	reviewsTotalCount: number;
	recommendedCount: number;
	completionCount: number;
}

export interface LoginParams {
	username: string;
	password: string;
}

export interface LoginResponse {
	accessToken: string;
	// refreshToken: string;
	expiresIn: number;
}

export interface SearchParams {
	latitude: number;
	longitude: number;
	radiusInMeters: number;
	take: number;
	statuses: CompletionStatus[];
	excludeOwned: boolean;
}

// interface UserAccountSettings {
// 	Admin: {
// 		SuspendHidingPrivileges: boolean;
// 	};
// 	Adventures: {
// 		Locale: string;
// 		LocationPreview: boolean;
// 		PlayNearbyCaches: boolean;
// 	};
// }

interface UserAvatar {
	AvatarUrl: string;
}

export interface User {
	Id: string;
	UserName: string;
	PublicGuid: string;
	Avatar: UserAvatar;
	GeocacheFindCount: number;
	CompletedAdventures: number;
	// MembershipLevel: number;
	// HasLodestoneAccess: boolean;
	// SignupDate: number;
	// MembershipExpiryDate: number;
	// AdventureCredits: number;
	StagesCompletedCount: number;
	StagesHideCount: number;
	HideCount: number;
	// SecurityGroup: string;
	// AdventuresHideCount: number;
	AdventuresPublicHideCount: number;
	// SignupSource: string;
	// InProgressAdventuresCount: number;
	// AccountSettings: UserAccountSettings;
}
