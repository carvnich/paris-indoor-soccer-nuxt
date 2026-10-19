// Whether the signed-in user is a superadmin, or has one of the roles and the page's league in their `leagues` list (empty = none). The server checks the same rule (canManage); this only decides which buttons show.
export function useCanManage(roles: string[]) {
	const { user } = useUserSession();
	const route = useRoute();
	return computed(() => user.value?.role === "superadmin" || (!!user.value && roles.includes(user.value.role ?? "") && !!user.value.leagues?.split(",").includes(String(route.params.league))));
}
