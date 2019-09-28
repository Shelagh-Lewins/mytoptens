// check whether the user can perform actions on topTenLists, topTenItems
// topTenItems inherit permissions from their topTenList

// result depends on whether they are logged in:
// whether they own the topTenList:
// whether the topTenList is public

// topTenList is identified by id (primary key)
// for viewing, we could trust the server that if a topTenList is returned, it can be viewed.
// but for editing, we need to check if the user created it

// identifier should be like { 'id': 'efg' } i.e. an object with one property

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

export function canViewReusableItem(reusableItem) {
	// public reusableItems can be viewed
	// also private ones the user created
	const { auth } = store.getState();

	if (reusableItem.is_public) {
		return true;
	}

	if (auth.isAuthenticated && (reusableItem.created_by === auth.user.id)) {
		return true;
	}

	return false;
}

// can the user view, create and vote on change requests?
export function reusableItemChangeRequestsAvailable(reusableItem, myTopTenItems) {
	const { auth } = store.getState();
	const { isAuthenticated, user } = auth;
	console.log('*** permissions', reusableItem);
	console.log('auth', auth);
	console.log('myTopTenItems', myTopTenItems);
	if (!reusableItem) {
		return false;
	}

	if (!isAuthenticated) {
		return false;
	}

	// user created the reusableItem
	if (reusableItem.created_by === user.id) {
		return true;
	}

	// reusableItem is public and user references it in one of their lists
	if (reusableItem.is_public && myTopTenItems.length > 0) {
		return true;
	}

	return false;
}

export function userCreatedReusableItem(reusableItem) {
	const { auth } = store.getState();
	const { isAuthenticated, user } = auth;

	if (!reusableItem) {
		return false;
	}

	if (isAuthenticated && reusableItem.created_by === user.id) {
		return true;
	}

	return false;
}
