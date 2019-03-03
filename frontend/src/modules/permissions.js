// check whether the user can perform actions on lists, items
// items inherit permissions from their list

// result depends on whether they are logged in:
// whether they own the list:
// whether the list is public

// list is identified by id (primary key)
// for viewing, we could trust the server that if a list is returned, it can be viewed.
// but for editing, we need to check if the user created it

// identifier should be like { 'id': 'efg' } i.e. an object with one property

import store from '../store';
import findObjectByProperty from './findObjectByProperty';

export function canViewList(id) {
	// a list can be viewed if public or if created by user
	//const property = Object.keys(identifier)[0];
	//const value = identifier[property];
	const state = store.getState();
	const lists = state.list.things;
	const userId = state.auth.user.id;

	let canViewList = false;

	if (Object.keys(lists).length > 0) {
		let list = findObjectByProperty({ 'parentObject': lists, 'property': 'id', 'value': id });

		if (list && (list.is_public || (list.created_by === userId))) {
			canViewList = true;
		}
	}

	return canViewList;
}

export function canEditList(id) {
	// a list can be edited if created by user
	//const property = Object.keys(identifier)[0];
	//const value = identifier[property];
	const state = store.getState();
	const lists = state.list.things;
	const userId = state.auth.user.id;

	let canEditList = false;

	if (Object.keys(lists).length > 0) {
		let list = findObjectByProperty({ 'parentObject': lists, 'property': 'id', 'value': id });

		if (list && (list.created_by === userId)) {
			canEditList = true;
		}
	}

	return canEditList;
}

export function canCreateList() {
	// the user can create a list if they are logged in
	// and have verified their email address
	const state = store.getState();

	if (state.auth.isAuthenticated && state.auth.user.emailVerified) {
		return true;
	} else {
		return false;
	}
}
