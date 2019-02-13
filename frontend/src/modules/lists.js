import { createSelector } from 'reselect';
import { LIST_IS_PUBLIC_VALUES } from '../constants';
import fetchAPI from '../modules/fetchAPI';
import { getErrors } from '../modules/errors';
import { normalize, schema } from 'normalizr';
import store from '../store';


import {
	LOGOUT_USER_COMPLETE
} from './auth';

import {
	CREATE_ITEM_SUCCEEDED,
	// DELETE_ITEM_SUCCEEDED,
	MOVE_ITEM_UP_SUCCEEDED,
} from './items';

// define action types so they are visible
// and export them so other reducers can use them
export const RECEIVE_ENTITIES = 'RECEIVE_ENTITIES';
export const FETCH_LISTS_STARTED = 'FETCH_LISTS_STARTED';
export const FETCH_LISTS_FAILED = 'FETCH_LISTS_FAILED';
export const FETCH_LIST_BY_SLUG_STARTED = 'FETCH_LIST_BY_SLUG_STARTED';
export const FETCH_LIST_BY_SLUG_FAILED = 'FETCH_LISTS_FAILED';
export const FILTER_LISTS = 'FILTER_LISTS';
export const CREATE_LIST_STARTED = 'CREATE_LIST_STARTED';
export const CREATE_LIST_SUCCEEDED = 'CREATE_LIST_SUCCEEDED';
export const DELETE_LIST_SUCCEEDED = 'DELETE_LIST_SUCCEEDED';
export const SET_LIST_IS_PUBLIC_SUCCEEDED = 'SET_LIST_IS_PUBLIC_SUCCEEDED';
export const UPDATE_LIST_SUCCEEDED = 'UPDATE_LIST_SUCCEEDED';

const itemSchema = new schema.Entity('items', {
	'list': ['listSchema'],
});
const listSchema = new schema.Entity('lists', {
	'items': [itemSchema],
});

function receiveEntities(entities) {
	return {
		'type': RECEIVE_ENTITIES,
		'payload': entities,
	};
}

export function fetchListsStarted(is_public) {
	return {
		'type': FETCH_LISTS_STARTED,
	};
}

function fetchListsFailed() {
	return {
		'type': FETCH_LISTS_FAILED
	};
}

export function fetchLists() {
	return (dispatch, getState) => {
		dispatch(fetchListsStarted());

		// if the user is not logged in, don't use auth. The server should return only the lists a non-authenticated user should see.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': '/api/v1/content/lists/',
			'method': 'GET',
			'useAuth': useAuth,
		}).then(response => {
			const normalizedData = normalize(response, [listSchema]);
			
			return dispatch(receiveEntities(normalizedData));
		}).catch(error => {
			dispatch(fetchListsFailed());

			return dispatch(getErrors({ 'fetch lists': error.message }));
		});
	};
}

///////////////////////////////
// fetch a single list by slug
export function fetchListBySlugStarted() {
	return {
		'type': FETCH_LIST_BY_SLUG_STARTED,
	};
}

function fetchListBySlugFailed() {
	return {
		'type': FETCH_LIST_BY_SLUG_FAILED
	};
}

export function fetchListBySlug(slug) {
	return (dispatch, getState) => {
		dispatch(fetchListBySlugStarted());

		// if the user is not logged in, don't use auth. The server should return the list if a non-authenticated user should see it.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': `/api/v1/content/list/?slug=${slug}`,
			'method': 'GET',
			'useAuth': useAuth,
		}).then(response => {
			const normalizedData = normalize(response, [listSchema]);

			return dispatch(receiveEntities(normalizedData));
		}).catch(error => {
			dispatch(fetchListBySlugFailed());

			return dispatch(getErrors({ 'fetch lists': error.message }));
		});
	};
}

export function filterLists(searchTerm) {
	return { 
		'type': FILTER_LISTS,
		'payload': { searchTerm },
	};
}

/////////////////////////////
// create list
export const createList = (list, history) => dispatch => {
	dispatch(createListStarted());

	return fetchAPI({
		'url': '/api/v1/content/lists/',
		'data': JSON.stringify(list),
		'method': 'POST',
		'useAuth': true,
		'headers': { 'Content-Type': 'application/json' },
	}).then(response => {
		dispatch(createListSucceeded(response));
		history.push(`/list/${response.slug}`);
		return;
	}).catch(error => {
		return dispatch(getErrors({ 'create list': error.message }));
	});
};

export function createListStarted() {
	return {
		'type': CREATE_LIST_STARTED,
	};
}

export function createListSucceeded(list) {
	return {
		'type': CREATE_LIST_SUCCEEDED,
		'payload': {
			list
		}
	};
}

///////////////////////////
// update list
export const updateList = (listId, propertyName, value) => dispatch => {
	// should be able to update any simple property e.g. name, description

	return fetchAPI({
		'url': `/api/v1/content/lists/${listId}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ [propertyName]: value }),
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(updateListSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'update item': error.message }));
	});
};

export function updateListSucceeded({ id }) {
	return {
		'type': UPDATE_LIST_SUCCEEDED,
		'payload': {
			'id': id,
		}
	};
}

///////////////////////////
// delete list
export const deleteList = id => (dispatch, getState) => {
	return fetchAPI({
		'url': `/api/v1/content/lists/${id}/`,
		'method': 'DELETE',
		'useAuth': true,
	}).then(response => {
		return dispatch(deleteListSucceeded(id));
	}).catch(error => {
		return dispatch(getErrors({ 'delete list': error.message }));
	});
};

export function deleteListSucceeded(id) {
	return {
		'type': DELETE_LIST_SUCCEEDED,
		'payload': {
			id
		}
	};
}

export const setListIsPublic = ({ id, is_public }) => dispatch => {
	return fetchAPI({
		'url': `/api/v1/content/lists/${id}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ is_public }),
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(setListIsPublicSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'set list is public': error.message }));
	});
};

export function setListIsPublicSucceeded({ id, is_public }) {
	return {
		'type': SET_LIST_IS_PUBLIC_SUCCEEDED,
		'payload': {
			'id': id,
			is_public
		}
	};
}

//////////////////////////////////
// Reducer
var updeep = require('updeep');

// this is initial state of lists and the list loading states
const initialListsState = {
	'isLoading': false,
	'error': null,
	'things': {},
};

// 'state' here is global state
export const getSearchTerm = state => {
	return state.page.searchTerm;
};

export const getLists = state => {
	return Object.keys(state.lists.things).map(id => {
		return state.lists.things[id];
	});
};

export const getFilteredLists = createSelector(
	[getLists, getSearchTerm],
	(lists, searchTerm) => {
		return lists.filter(list => {
			// if no search term, return every list
			if (searchTerm === '') {
				return list;
			}
			return list.name.match(new RegExp(searchTerm, 'i'));
		});
	}
);

export const getGroupedAndFilteredLists = createSelector(
	[getFilteredLists],
	lists => {
		const grouped = {};

		LIST_IS_PUBLIC_VALUES.forEach(is_public => {
			grouped[is_public] = lists.filter(list => list.is_public === is_public);
		});

		return grouped;
	}
);

export const getFilteredPublicLists = createSelector(
	[getFilteredLists],
	lists => {
		return lists.filter(list => {
			return list.is_public;
		});
	}
);

export const getMyGroupedAndFilteredLists = createSelector(
	[getFilteredLists],
	lists => {
		const grouped = {};

		LIST_IS_PUBLIC_VALUES.forEach(is_public => {
			grouped[is_public] = lists.filter(list => (list.created_by_id === store.getState().auth.user.id) && (list.is_public === is_public));
		});

		return grouped;
	}
);

// state here is the substate state.lists
// the book uses 'items' for the list of things i.e. lists. items
// as 'items' for us is a specific thing, we need another name for the set of entities to be displayed i.e. the lists themselves
// so those are globalState.lists.things
// i.e. state.things here
export default function lists(state = initialListsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialListsState, {});
		}

		case RECEIVE_ENTITIES: {
			const { entities } = action.payload;
			let lists = {};

			if (entities && entities.lists) {
				lists = entities.lists; // there is at least one list
			}

			return updeep({ 'things': lists, 'isLoading': false }, state);
		}

		case FETCH_LISTS_STARTED: {
			return updeep({ 'isLoading': true }, state);
		}

		case FETCH_LISTS_FAILED: {
			return updeep({ 'isLoading': false }, state);
		}

		case FETCH_LIST_BY_SLUG_STARTED: {
			return updeep({
				'isLoading': true,
				'things': updeep.constant({}), // remove all existing lists
			}, state);
		}

		case FETCH_LIST_BY_SLUG_FAILED: {
			return updeep({ 'isLoading': false }, state);
		}

		case CREATE_LIST_STARTED: {
			// at present this does nothing, it's really just to track that the action happened
			return updeep(state, state);
		}

		case CREATE_LIST_SUCCEEDED: {
			const list = action.payload.list;
			return updeep({ 'things': { [list.id]: list } }, state);
		}

		case DELETE_LIST_SUCCEEDED: {
			return updeep({ 'things': updeep.omit([action.payload.id]) }, state);
		}

		case SET_LIST_IS_PUBLIC_SUCCEEDED: {
			const listId = action.payload.id;

			return updeep({ 'things': { [listId]: { 'is_public': action.payload.is_public } } }, state);
			// reminder of another way to update nested arrays
			/* const index = state.things.findIndex((list) => list.id === action.payload.id);

			if (index !== -1) {
				return updeep.updateIn(`things.${index}.is_public`, action.payload.is_public, state);
			} 

			return state; // in case list was not found
			*/
		}

		case CREATE_ITEM_SUCCEEDED: {
			const item = action.payload.item;

			function addItem(items) {
				return [].concat(items, item.id);
			}

			return updeep.updateIn(`things.${item.list}.items`, addItem, state);
		}

		/* case DELETE_ITEM_SUCCEEDED: {
			function deleteItem(items) {
				const itemIndex = items.findIndex((item) => item === action.payload.itemId); 
				let newItems = [].concat(items);
				newItems.splice(itemIndex, 1);
				return newItems;
			}

			return updeep.updateIn(`things.${action.payload.listId}.items`, deleteItem, state);
		} */

		case MOVE_ITEM_UP_SUCCEEDED: {
			const itemsArray = action.payload.items; // array containing the two items that have been swapped
			// update the Items array in their parent list, change order
			const listId = itemsArray[0].list_id;

			function replaceItems(items) {
				let newItems = [].concat(items);
				itemsArray.map((item) => { // eslint-disable-line array-callback-return
					newItems[item.order-1] = item.id;
				});

				return newItems;
			}

			return updeep.updateIn(`things.${listId}.items`, replaceItems, state);
		}

		default:
			return state;
	}
}

