import { createSelector } from 'reselect';
import fetchAPI from '../modules/fetchAPI';
import { getErrors } from '../modules/errors';
import store from '../store';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

import {
	RECEIVE_ENTITIES,
	FETCH_TOPTENLIST_DETAIL_STARTED,
	RECEIVE_ORGANIZER_DATA,
} from './toptenlist';

//////////////////////////////////
// Action creators

// define action types so they are visible
// and export them so other reducers can use them
export const CREATE_ITEM_REQUESTED = 'CREATE_ITEM_REQUESTED';
export const CREATE_ITEM_SUCCEEDED = 'CREATE_ITEM_SUCCEEDED';
export const UPDATE_ITEM_SUCCEEDED = 'UPDATE_ITEM_SUCCEEDED';
export const MOVE_ITEM_UP_SUCCEEDED = 'MOVE_ITEM_UP_SUCCEEDED';

////////////////////////////////////
// create item
export const createItem = item => dispatch => {
	dispatch(createItemRequested());

	return fetchAPI({
		'url': '/api/v1/content/toptenitem/',
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
		'url': `/api/v1/content/toptenitem/${itemId}/`,
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

export function updateItemSucceeded(response) {
	return {
		'type': UPDATE_ITEM_SUCCEEDED,
		'payload': response,
	};
}

//////////////////////////////////
// move item up
export const moveItemUp = ({ itemId }) => dispatch => {
	return fetchAPI({
		'url': `/api/v1/content/toptenitem/${itemId}/moveup/`,
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
	const item = store.getState().item.things[itemId];

	// find its parent toptenlist
	const toptenlistId = item.toptenlist_id;

	// find the item's order
	const order = item.order;

	// find the item below it in the parent toptenlist
	const item_below_id = store.getState().toptenlist.things[toptenlistId].toptenitem[order];

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
// Reducer
var updeep = require('updeep');

const initialItemsState = {
	'isLoading': false,
	'error': null,
	'count': null,
	'next': null,
	'previous': null,
	'things': {},
	'organizerData': {},
};

/////////////////////////////
// organizer data
// all items and toptenlists, for selector to use
export const getOrganizerItems = state => state.item.organizerData;
const getOrganizerTopTenLists = state => state.toptenlist.organizerData;

export const groupedItems = createSelector(
	[getOrganizerItems, getOrganizerTopTenLists],
	(items, toptenlists) => {
		let itemsByTopTenList = {};

		// find the items for each toptenlist
		Object.keys(toptenlists).map(toptenlistId => { // eslint-disable-line array-callback-return
			const toptenlist = toptenlists[toptenlistId];

			let itemsArray = [];

			for (let i=0; i<toptenlist.toptenitem.length; i++) {
				let item = { ...items[toptenlist.toptenitem[i]] };

				if (item.name !== '') {
					itemsArray.push(item);
				}
			}

			itemsByTopTenList[toptenlist.id] = itemsArray;
		});
		// note the parent_toptenitem, if any, of each toptenlist
		// add the toptenlist's id to the item as childTopTenListId
		Object.keys(toptenlists).map(toptenlistId => { // eslint-disable-line array-callback-return
			const toptenlist = toptenlists[toptenlistId];

			if (toptenlist.parent_toptenitem) {
				const parentItem = items[toptenlist.parent_toptenitem];

				if (parentItem) {
					// can't use array order to pull out item, because items with no name have been removed
					// instead, explicitly find the item object in the array by its 'order' property

					let itemsArray2 = itemsByTopTenList[parentItem.toptenlist_id];
					let item = itemsArray2.find(item => item.order === parentItem.order);
					item.childTopTenListId = toptenlist.id;
				}
			}
		});

		return itemsByTopTenList;
	}

);

/////////////////////////////
// state updates

export default function item(state = initialItemsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialItemsState, {}); // constant provides placement instead of update, so all previous entries are removed
		}
		
		case RECEIVE_ENTITIES: {
			const { entities } = action.payload;

			let things = {};

			if (entities && entities.item) {
				things = entities.item;
			}

			return updeep({
				'things': updeep.constant(things),
				'organizerData': updeep.constant({}), // new toptenlist data so clear out old organizer data, this must be loaded separately
				'isLoading': false }, state);
		}

		case FETCH_TOPTENLIST_DETAIL_STARTED: {
			return updeep(state, state);
		}

		case CREATE_ITEM_SUCCEEDED: {
			const item = action.payload.item;
			return updeep({ 'things': { [item.id]: item } }, state);
		}

		case UPDATE_ITEM_SUCCEEDED: {
			// update editable properties
			const update = {
				'name': action.payload.name,
				'description': action.payload.description,
				'modified_at': action.payload.modified_at,
				'order': action.payload.order,
			};

			return updeep({ 'things': { [action.payload.id]: update } }, state);
		}

		case MOVE_ITEM_UP_SUCCEEDED: {
			const itemsArray = action.payload.items; // array containing the two items that have been swapped

			let itemsObject = {};
			itemsArray.map((item) => { // eslint-disable-line array-callback-return
				itemsObject[item.id] = item;
			});
			return updeep({ 'things': itemsObject }, state);
		}

		case RECEIVE_ORGANIZER_DATA: {
			const { entities } = action.payload;

			if (entities && entities.item) {
				return updeep({ 'organizerData': updeep.constant(entities.item), 'isLoading': false }, state);
			}

			return state;
		}

		default:
			return state;
	}
}

// all items, for selector to use
// export const getItems = state => state.item.things;

//// not currently used but left in as an example of sorting toptenlist items by order
// items belonging to the current toptenlist
/* export const sortedItems = createSelector(
	[getItems],
	(items) => {
		let toptenlistItems = (Object.keys(items).map(id => {
			return items[id];
		})).sort(function(a, b){
			return a.order - b.order; // sort to index order
		});

		return toptenlistItems;
	}
); */

