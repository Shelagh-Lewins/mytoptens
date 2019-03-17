// check whether the user can perform actions on toptenlists, items
// items inherit permissions from their toptenlist

// result depends on whether they are logged in:
// whether they own the toptenlist:
// whether the toptenlist is public

// toptenlist is identified by id (primary key)
// for viewing, we could trust the server that if a toptenlist is returned, it can be viewed.
// but for editing, we need to check if the user created it

// identifier should be like { 'id': 'efg' } i.e. an object with one property

import store from '../store';
import findObjectByProperty from './findObjectByProperty';

export function canViewTopTenList(id) {
	// a toptenlist can be viewed if public or if created by user
	//const property = Object.keys(identifier)[0];
	//const value = identifier[property];
	const state = store.getState();
	const toptenlists = state.toptenlist.things;
	const userId = state.auth.user.id;

	let canViewTopTenList = false;

	if (Object.keys(toptenlists).length > 0) {
		let toptenlist = findObjectByProperty({ 'parentObject': toptenlists, 'property': 'id', 'value': id });

		if (toptenlist && (toptenlist.is_public || (toptenlist.created_by === userId))) {
			canViewTopTenList = true;
		}
	}

	return canViewTopTenList;
}

export function canEditTopTenList(id) {
	// a toptenlist can be edited if created by user
	//const property = Object.keys(identifier)[0];
	//const value = identifier[property];
	const state = store.getState();
	const toptenlists = state.toptenlist.things;
	const userId = state.auth.user.id;

	let canEditTopTenList = false;

	if (Object.keys(toptenlists).length > 0) {
		let toptenlist = findObjectByProperty({ 'parentObject': toptenlists, 'property': 'id', 'value': id });

		if (toptenlist && (toptenlist.created_by === userId)) {
			canEditTopTenList = true;
		}
	}

	return canEditTopTenList;
}

export function canCreateTopTenList() {
	// the user can create a toptenlist if they are logged in
	// and have verified their email address
	const state = store.getState();

	if (state.auth.isAuthenticated && state.auth.user.emailVerified) {
		return true;
	} else {
		return false;
	}
}
