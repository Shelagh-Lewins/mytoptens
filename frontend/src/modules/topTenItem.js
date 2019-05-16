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
} from './topTenList';

//////////////////////////////////
// Action creators

// define action types so they are visible
// and export them so other reducers can use them
export const CREATE_TOPTENITEM_REQUESTED = 'CREATE_TOPTENITEM_REQUESTED';
export const CREATE_TOPTENITEM_SUCCEEDED = 'CREATE_TOPTENITEM_SUCCEEDED';
export const UPDATE_TOPTENITEM_SUCCEEDED = 'UPDATE_TOPTENITEM_SUCCEEDED';
export const MOVE_TOPTENITEM_UP_SUCCEEDED = 'MOVE_TOPTENITEM_UP_SUCCEEDED';

////////////////////////////////////
// create topTenItem
export const createTopTenItem = topTenItem => dispatch => {
	dispatch(createTopTenItemRequested());

	return fetchAPI({
		'url': '/api/v1/content/toptenitem/',
		'data': JSON.stringify(topTenItem),
		'method': 'POST',
		'useAuth': true,
		'headers': { 'Content-Type': 'application/json' },
	}).then(response => {
		return dispatch(createTopTenItemSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'create topTenItem': error.message }));
	});
};

export function createTopTenItemRequested() {
	return {
		'type': 'CREATE_TOPTENITEM_REQUESTED',
	};
}

export function createTopTenItemSucceeded(topTenItem) {
	return {
		'type': 'CREATE_TOPTENITEM_SUCCEEDED',
		'payload': {
			topTenItem
		}
	};
}

////////////////////////////////////
// update topTenItem
export const updateTopTenItem = (topTenItemId, propertyName, value) => dispatch => {
	// should be able to update any simple property e.g. name, description

	return fetchAPI({
		'url': `/api/v1/content/toptenitem/${topTenItemId}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ [propertyName]: value }),
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(updateTopTenItemSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'update topTenItem': error.message }));
	});
};

export function updateTopTenItemSucceeded(response) {
	return {
		'type': UPDATE_TOPTENITEM_SUCCEEDED,
		'payload': response,
	};
}

//////////////////////////////////
// move topTenItem up
export const moveTopTenItemUp = ({ topTenItemId }) => dispatch => {
	return fetchAPI({
		'url': `/api/v1/content/toptenitem/${topTenItemId}/moveup/`,
		'headers': { 'Content-Type': 'application/json' },
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(moveTopTenItemUpSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'move topTenItem up error ': error.message }));
	});
};

export const moveTopTenItemDown = ({ topTenItemId }) => dispatch => {
	// to move an topTenItem down, we move the topTenItem below up
	// find the topTenItem
	const topTenItem = store.getState().topTenItem.things[topTenItemId];

	// find its parent topTenList
	const topTenListId = topTenItem.topTenList_id;

	// find the topTenItem's order
	const order = topTenItem.order;

	// find the topTenItem below it in the parent topTenList
	const topTenItem_below_id = store.getState().topTenList.things[topTenListId].topTenItem[order];

	dispatch(moveTopTenItemUp({ 'topTenItemId': topTenItem_below_id }));
};

export function moveTopTenItemUpSucceeded(topTenItems) {
	return {
		'type': 'MOVE_TOPTENITEM_UP_SUCCEEDED',
		'payload': {
			topTenItems,
		}
	};
}

//////////////////////////////////
// Reducer
var updeep = require('updeep');

const initialTopTenItemsState = {
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
// all topTenItems and topTenLists, for selector to use
export const getOrganizerTopTenItems = state => state.topTenItem.organizerData;
const getOrganizerTopTenLists = state => state.topTenList.organizerData;

export const groupedTopTenItems = createSelector(
	[getOrganizerTopTenItems, getOrganizerTopTenLists],
	(topTenItems, topTenLists) => {
		let topTenItemsByTopTenList = {};

		// find the topTenItems for each topTenList
		Object.keys(topTenLists).map(topTenListId => { // eslint-disable-line array-callback-return
			const topTenList = topTenLists[topTenListId];

			let topTenItemsArray = [];

			for (let i=0; i<topTenList.topTenItem.length; i++) {
				let topTenItem = { ...topTenItems[topTenList.topTenItem[i]] };

				if (topTenItem.name !== '') {
					topTenItemsArray.push(topTenItem);
				}
			}

			topTenItemsByTopTenList[topTenList.id] = topTenItemsArray;
		});
		// note the parent_topTenItem, if any, of each topTenList
		// add the topTenList's id to the topTenItem as childTopTenListId
		Object.keys(topTenLists).map(topTenListId => { // eslint-disable-line array-callback-return
			const topTenList = topTenLists[topTenListId];

			if (topTenList.parent_topTenItem) {
				const parentTopTenItem = topTenItems[topTenList.parent_topTenItem];

				if (parentTopTenItem) {
					// can't use array order to pull out topTenItem, because topTenItems with no name have been removed
					// instead, explicitly find the topTenItem object in the array by its 'order' property

					let topTenItemsArray2 = topTenItemsByTopTenList[parentTopTenItem.topTenList_id];
					let topTenItem = topTenItemsArray2.find(topTenItem => topTenItem.order === parentTopTenItem.order);
					topTenItem.childTopTenListId = topTenList.id;
				}
			}
		});

		return topTenItemsByTopTenList;
	}

);

/////////////////////////////
// state updates

export default function topTenItem(state = initialTopTenItemsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialTopTenItemsState, {}); // constant provides placement instead of update, so all previous entries are removed
		}
		
		case RECEIVE_ENTITIES: {
			const { entities } = action.payload;

			let things = {};

			if (entities && entities.topTenItem) {
				things = entities.topTenItem;
			}

			return updeep({
				'things': updeep.constant(things),
				'organizerData': updeep.constant({}), // new topTenList data so clear out old organizer data, this must be loaded separately
				'isLoading': false }, state);
		}

		case FETCH_TOPTENLIST_DETAIL_STARTED: {
			return updeep(state, state);
		}

		case CREATE_TOPTENITEM_SUCCEEDED: {
			const topTenItem = action.payload.topTenItem;
			return updeep({ 'things': { [topTenItem.id]: topTenItem } }, state);
		}

		case UPDATE_TOPTENITEM_SUCCEEDED: {
			// update editable properties
			const update = {
				'name': action.payload.name,
				'description': action.payload.description,
				'modified_at': action.payload.modified_at,
				'order': action.payload.order,
			};

			return updeep({ 'things': { [action.payload.id]: update } }, state);
		}

		case MOVE_TOPTENITEM_UP_SUCCEEDED: {
			const topTenItemsArray = action.payload.topTenItems; // array containing the two topTenItems that have been swapped

			let topTenItemsObject = {};
			topTenItemsArray.map((topTenItem) => { // eslint-disable-line array-callback-return
				topTenItemsObject[topTenItem.id] = topTenItem;
			});
			return updeep({ 'things': topTenItemsObject }, state);
		}

		case RECEIVE_ORGANIZER_DATA: {
			const { entities } = action.payload;

			// we only want items that have a name
			const topTenItem = {};
			Object.keys(entities.topTenItem).map(id => {
				if (entities.topTenItem[id].name) {
					topTenItem[id] = entities.topTenItem[id];
				}
			});

			if (entities && entities.topTenItem) {
				return updeep({ 'organizerData': updeep.constant(topTenItem), 'isLoading': false }, state);
			}

			return state;
		}

		default:
			return state;
	}
}

