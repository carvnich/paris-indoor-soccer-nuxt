// The last league a visitor opened: "/" goes there, and pages without a league in the URL (Login) link to it. Friday co-ed until one is opened.
export const useLeagueCookie = () => useCookie("league", { default: () => "friday-coed", maxAge: 60 * 60 * 24 * 365 });
