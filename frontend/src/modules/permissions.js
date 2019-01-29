// check whether the user can perform actions on lists, items
// items inherit permissions from their list

// result depends on whether they are logged in:
// whether they own the list:
// whether the list is public

// list may be identified by id (primary key) or by slug (provided by URL)
// for viewing, we could trust the server that if a list is returned, it can be viewed.
// but for editing, we need to check if the user created it

// identifier should be like { 'slug': 'abc' } or { 'id': 'efg' } i.e. an object with one property

import store from '../store';
import findObjectByProperty from './findObjectByProperty';

export function canViewList(identifier) {
	// a list can be viewed if public or if created by user
	const property = Object.keys(identifier)[0];
	const value = identifier[property];
	const state = store.getState();
	const lists = state.lists.things;
	const userId = state.auth.user.id;

	let canViewList = false;

	if (Object.keys(lists).length > 0) {
		let list = findObjectByProperty({ 'parentObject': lists, property, value });

		if (list && (list.is_public || (list.created_by_id === userId))) {
			canViewList = true;
		}
	}

	return canViewList;
}

export function canEditList(identifier) {
	// a list can be edited if created by user
	const property = Object.keys(identifier)[0];
	const value = identifier[property];
	const state = store.getState();
	const lists = state.lists.things;
	const userId = state.auth.user.id;

	let canEditList = false;

	if (Object.keys(lists).length > 0) {
		let list = findObjectByProperty({ 'parentObject': lists, property, value });

		if (list && (list.created_by_id === userId)) {
			canEditList = true;
		}
	}

	return canEditList;
}
