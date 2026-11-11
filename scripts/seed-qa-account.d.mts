export function qaSeedSettings(existing: unknown): null | { onboardingCompleted: boolean; measurementUnit: string; dailyCalorieTarget: number; currentWeight?: number };
export function seedQaAccount(): Promise<{ projectId: string; uid: string; createdProfile: boolean; onboardingCompleted: boolean; measurementUnit: string }>;
