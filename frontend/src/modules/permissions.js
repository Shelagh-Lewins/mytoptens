// check whether the user can perform global actions
// at present only canCreateTopTenList but maybe more in future

import store from '../store';

export function canCreateTopTenList() {
	// the user can create a topTenList if they are logged in
	// and have verified their email address
	const state = store.getState();

	if (state.auth.isAuthenticated && state.auth.user.emailVerified) {
		return true;
	}

	return false;
}
