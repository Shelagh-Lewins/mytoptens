// import { createSelector } from 'reselect';
import { RECEIVE_ENTITIES } from '../modules/lists';
import fetchAPI from '../modules/fetchAPI';
import { getErrors } from '../modules/errors';
import store from '../store';

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
export const UPDATE_ITEM_SUCCEEDED = 'UPDATE_ITEM_SUCCEEDED';
export const DELETE_ITEM_SUCCEEDED = 'DELETE_ITEM_SUCCEEDED';
export const MOVE_ITEM_UP_SUCCEEDED = 'MOVE_ITEM_UP_SUCCEEDED';

////////////////////////////////////
// create item
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

////////////////////////////////////
// update item
export const updateItem = (itemId, propertyName, value) => dispatch => {
	// should be able to update any simple property e.g. name, description

	return fetchAPI({
		'url': `/api/v1/content/items/${itemId}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ [propertyName]: value }),
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(updateItemSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'update item': error.message }));
	});
};

export function updateItemSucceeded({ id }) {
	return {
		'type': UPDATE_ITEM_SUCCEEDED,
		'payload': {
			'id': id,
		}
	};
}

//////////////////////////////////
// move item up
export const moveItemUp = ({ itemId }) => dispatch => {
	return fetchAPI({
		'url': `/api/v1/content/items/${itemId}/moveup/`,
		'headers': { 'Content-Type': 'application/json' },
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(moveItemUpSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'move item up error ': error.message }));
	});
};

export const moveItemDown = ({ itemId }) => dispatch => {
	// to move an item down, we move the item below up
	// find the item
	const item = store.getState().items.things[itemId];

	// find its parent list
	const listId = item.list;

	// find the item's order
	const order = item.order;

	// find the item below it in the parent list
	const item_below_id = store.getState().lists.things[listId].items[order];

	dispatch(moveItemUp({ 'itemId': item_below_id }));
};

export function moveItemUpSucceeded(items) {
	return {
		'type': 'MOVE_ITEM_UP_SUCCEEDED',
		'payload': {
			items,
		}
	};
}

//////////////////////////////////
// delete item
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

		case MOVE_ITEM_UP_SUCCEEDED: {
			const itemsArray = action.payload.items; // array containing the two items that have been swapped
			// update items.things object, change order

			let itemsObject = {};
			itemsArray.map((item) => { // eslint-disable-line array-callback-return
				itemsObject[item.id] = item;
			});
			//return state;
			return updeep({ 'things': itemsObject }, state);
		}

		default:
			return state;
	}
}

// all items, for selector to use
export const getItems = state => state.items.things;

//// not currently used but left in as an example of sorting list items by order
// items belonging to the current list
/* export const sortedItems = createSelector(
	[getItems],
	(items) => {
		let listItems = (Object.keys(items).map(id => {
			return items[id];
		})).sort(function(a, b){
			return a.order - b.order; // sort to index order
		});

		return listItems;
	}
); */

