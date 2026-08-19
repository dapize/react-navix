export interface NavigateOptions<T = unknown> {
	replace?: boolean;
	relative?: "route" | "path";
	state?: T;
}

export type NavigateFunction<T = unknown> = (to: string | number, options?: NavigateOptions<T>) => void;
