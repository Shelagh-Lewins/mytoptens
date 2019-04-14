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
import findObjectByProperty from './findObjectByProperty';

export function canViewTopTenList(id) {
	// a topTenList can be viewed if public or if created by user
	//const property = Object.keys(identifier)[0];
	//const value = identifier[property];
	const state = store.getState();
	const topTenLists = state.topTenList.things;
	const userId = state.auth.user.id;

	let canViewTopTenList = false;

	if (Object.keys(topTenLists).length > 0) {
		let topTenList = findObjectByProperty({ 'parentObject': topTenLists, 'property': 'id', 'value': id });

		if (topTenList && (topTenList.is_public || (topTenList.created_by === userId))) {
			canViewTopTenList = true;
		}
	}

	return canViewTopTenList;
}

export function canEditTopTenList(id) {
	// a topTenList can be edited if created by user
	const state = store.getState();
	const topTenLists = state.topTenList.things;
	const userId = state.auth.user.id;

	let canEditTopTenList = false;

	if (Object.keys(topTenLists).length > 0) {
		let topTenList = findObjectByProperty({ 'parentObject': topTenLists, 'property': 'id', 'value': id });

		if (topTenList && (topTenList.created_by === userId)) {
			canEditTopTenList = true;
		}
	}

	return canEditTopTenList;
}

export function canCreateTopTenList() {
	// the user can create a topTenList if they are logged in
	// and have verified their email address
	const state = store.getState();

	if (state.auth.isAuthenticated && state.auth.user.emailVerified) {
		return true;
	} else {
		return false;
	}
}
