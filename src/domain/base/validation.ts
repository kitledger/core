import { type BaseIssue } from "@valibot/valibot";

export type ValidationError = {
	type: "structure" | "data";
	path: string;
	message: string;
};

export function parseValibotIssues<T>(issues: BaseIssue<T>[]): ValidationError[] {
	return issues.map((issue) => ({
		type: "structure",
		path: issue.path ? issue.path.map((p) => p.key).join(".") : "",
		message: issue.message,
	}));
}

export type ValidationResult<T> = {
	success: boolean;
	data?: T;
	errors?: ValidationError[];
};
