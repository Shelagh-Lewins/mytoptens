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

	const state = store.getState();
	const topTenLists = state.topTenList.things;
	const userId = state.auth.user.id;

	let canView = false;

	if (Object.keys(topTenLists).length > 0) {
		const topTenList = findObjectByProperty({ 'parentObject': topTenLists, 'property': 'id', 'value': id });

		if (topTenList && (topTenList.is_public || (topTenList.created_by === userId))) {
			canView = true;
		}
	}

	return canView;
}

export function canEditTopTenList(id) {
	// a topTenList can be edited if created by user
	const state = store.getState();
	const topTenLists = state.topTenList.things;
	const userId = state.auth.user.id;

	let canEdit = false;

	if (Object.keys(topTenLists).length > 0) {
		const topTenList = findObjectByProperty({ 'parentObject': topTenLists, 'property': 'id', 'value': id });

		if (topTenList && (topTenList.created_by === userId)) {
			canEdit = true;
		}
	}

	return canEdit;
}

export function canCreateTopTenList() {
	// the user can create a topTenList if they are logged in
	// and have verified their email address
	const state = store.getState();

	if (state.auth.isAuthenticated && state.auth.user.emailVerified) {
		return true;
	}

	return false;
}

export function canViewReusableItem(id) {
	// public reusableItems can be viewed
	// plus private ones the user created
	const state = store.getState();
	const reusableItems = state.reusableItem.things;

	let canView = false;
	console.log('testing permissions');
	console.log('reusableItems', reusableItems);
	if (Object.keys(reusableItems).length > 0) {
		const reusableItem = findObjectByProperty({ 'parentObject': reusableItems, 'property': 'id', 'value': id });

		if (reusableItem.is_public) {
			canView = true;
			console.log('its public');
		}

		if (state.auth.isAuthenticated && (reusableItem.created_by === state.auth.user.id)) {
			canView = true;
		}
	}

	return canView;
}
