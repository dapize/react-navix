import { useContext } from "react";

import { ParamsContext } from "@contexts/ParamsContext";

export const useParams = <T extends Record<string, string> = Record<string, string>>(): T => {
	const params = useContext(ParamsContext);

	if (params === null) {
		throw new Error("useParams() must be used inside a <Routes> component.");
	}

	return params as T;
};
