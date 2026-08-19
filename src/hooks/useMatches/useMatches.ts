import { useContext } from "react";

import { MatchesContext, type MatchRecord } from "@contexts/MatchesContext";

export const useMatches = (): MatchRecord[] => {
	return useContext(MatchesContext);
};
