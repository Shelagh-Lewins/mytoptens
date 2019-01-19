import { createSelector } from 'reselect';
import { RECEIVE_ENTITIES } from '../modules/lists';
import fetchAPI from '../modules/fetchAPI';
import { getErrors } from '../modules/errors';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

import {
	FETCH_LIST_BY_SLUG_STARTED
} from './lists';

//////////////////////////////////
// Action creators

// define action types so they are visible
// and export them so other reducers can use them
export const CREATE_ITEM_REQUESTED = 'CREATE_ITEM_REQUESTED';
export const CREATE_ITEM_SUCCEEDED = 'CREATE_ITEM_SUCCEEDED';
export const DELETE_ITEM_SUCCEEDED = 'DELETE_ITEM_SUCCEEDED';

export const createItem = item => dispatch => {
	dispatch(createItemRequested());

	return fetchAPI({
		'url': '/api/v1/content/items/',
		'data': JSON.stringify(item),
		'method': 'POST',
		'useAuth': true,
		'headers': { 'Content-Type': 'application/json' },
	}).then(response => {
		return dispatch(createItemSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'create item': error.message }));
	});
};

export function createItemRequested() {
	return {
		'type': 'CREATE_ITEM_REQUESTED',
	};
}

export function createItemSucceeded(item) {
	return {
		'type': 'CREATE_ITEM_SUCCEEDED',
		'payload': {
			item
		}
	};
}

export const deleteItem = ({ itemId, listId }) => dispatch => {
	return fetchAPI({
		'url': `/api/v1/content/items/${itemId}/`,
		'method': 'DELETE',
	}).then(response => {
		return dispatch(deleteItemSucceeded({ itemId, listId }));
	}).catch(error => {
		return dispatch(getErrors({ 'delete item': error.message }));
	});
};

export function deleteItemSucceeded({ itemId, listId }) {
	return {
		'type': 'DELETE_ITEM_SUCCEEDED',
		'payload': {
			itemId,
			listId
		}
	};
}

//////////////////////////////////
// Reducer
var updeep = require('updeep');

const initialItemsState = {
	'things': {},
	'isLoading': false,
	'error': null,
};

export default function items(state = initialItemsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialItemsState, {});
		}
		
		case RECEIVE_ENTITIES: {
			const { entities } = action.payload;
			if (entities && entities.items) {
				return updeep({ 'things': entities.items, 'isLoading': false }, state);
			}

			return state;
		}

		case FETCH_LIST_BY_SLUG_STARTED: {
			return updeep({
				'things': updeep.constant({}), // remove all existing items
			}, state);
		}

		case CREATE_ITEM_SUCCEEDED: {
			const item = action.payload.item;
			return updeep({ 'things': { [item.id]: item } }, state);
		}

		case DELETE_ITEM_SUCCEEDED: {
			return updeep({ 'things': updeep.omit([action.payload.id]) }, state);
		}

		default:
			return state;
	}
}

// all items, for selector to use
export const getItems = state => state.items.things;

// items belonging to the current list
export const sortedItems = createSelector(
	[getItems],
	(items) => {
		let listItems = (Object.keys(items).map(id => {
			return items[id];
		})).sort(function(a, b){
			return a.order - b.order; // sort to index order
		});

		return listItems;
	}
);

