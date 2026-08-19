import { useCallback, useMemo } from "react";

import type { NavigateOptions } from "@contexts/NavigatorContext";
import { useLocation } from "../useLocation";
import { useNavigate } from "../useNavigate";
import type { SearchParamsInput } from "./useSearchParams.types";

export const useSearchParams = () => {
	const location = useLocation();
	const navigate = useNavigate();

	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

	const setSearchParams = useCallback(
		(params: SearchParamsInput, options?: NavigateOptions) => {
			const nextSearch = params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString();
			const nextUrl = location.pathname + (nextSearch ? `?${nextSearch}` : "") + location.hash;
			navigate(nextUrl, options);
		},
		[location.pathname, location.hash, navigate],
	);

	return [searchParams, setSearchParams] as const;
};

export type UseSearchParamsReturn = ReturnType<typeof useSearchParams>;
