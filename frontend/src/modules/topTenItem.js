import { createSelector } from 'reselect';
import fetchAPI from './fetchAPI';
import { getErrors } from './errors';
import store from '../store';

import * as topTenListsReducer from './topTenList';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

import {
	RECEIVE_ENTITIES,
	FETCH_TOPTENLIST_DETAIL_STARTED,
	RECEIVE_ORGANIZER_DATA,
} from './topTenList';

const updeep = require('updeep');

/* eslint-disable array-callback-return */

// ////////////////////////////////
// Action creators

// define action types so they are visible
// and export them so other reducers can use them
export const CREATE_TOPTENITEM_REQUESTED = 'CREATE_TOPTENITEM_REQUESTED';
export const CREATE_TOPTENITEM_SUCCEEDED = 'CREATE_TOPTENITEM_SUCCEEDED';
export const UPDATE_TOPTENITEM_SUCCEEDED = 'UPDATE_TOPTENITEM_SUCCEEDED';
export const MOVE_TOPTENITEM_UP_SUCCEEDED = 'MOVE_TOPTENITEM_UP_SUCCEEDED';

// //////////////////////////////////
// create topTenItem
export function createTopTenItemRequested() {
	return {
		'type': 'CREATE_TOPTENITEM_REQUESTED',
	};
}

export function createTopTenItemSucceeded(topTenItemData) {
	return {
		'type': 'CREATE_TOPTENITEM_SUCCEEDED',
		'payload': {
			topTenItemData,
		},
	};
}
export const createTopTenItem = topTenItemData => (dispatch) => {
	dispatch(createTopTenItemRequested());

	return fetchAPI({
		'url': '/api/v1/content/toptenitem/',
		'data': JSON.stringify(topTenItemData),
		'method': 'POST',
		'useAuth': true,
		'headers': { 'Content-Type': 'application/json' },
	}).then((response) => {
		return dispatch(createTopTenItemSucceeded(response));
	}).catch((error) => {
		return dispatch(getErrors({ 'create topTenItem': error.message }));
	});
};

// //////////////////////////////////
// update topTenItem
export function updateTopTenItemSucceeded(response) {
	return {
		'type': UPDATE_TOPTENITEM_SUCCEEDED,
		'payload': response,
	};
}

export const updateTopTenItem = (topTenItemId, data) => (dispatch) => {
	/* update any simple properties e.g. {
		'name': 'my new name',
		'description': 'my new description',
		}
		*/
	// console.log('updateTopTenItem ', topTenItemId, data);
	return fetchAPI({
		'url': `/api/v1/content/toptenitem/${topTenItemId}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify(data),
		'method': 'PATCH',
		'useAuth': true,
	}).then((response) => {
		dispatch(topTenListsReducer.fetchTopTenListDetail(response.topTenList_id));
		return dispatch(updateTopTenItemSucceeded(response));
	}).catch((error) => {
		return dispatch(getErrors({ 'update topTenItem': error.message }));
	});
};

// ////////////////////////////////
// move topTenItem up
export function moveTopTenItemUpSucceeded(topTenItems) {
	return {
		'type': 'MOVE_TOPTENITEM_UP_SUCCEEDED',
		'payload': {
			topTenItems,
		},
	};
}

export const moveTopTenItemUp = ({ topTenItemId }) => (dispatch) => {
	return fetchAPI({
		'url': `/api/v1/content/toptenitem/${topTenItemId}/moveup/`,
		'headers': { 'Content-Type': 'application/json' },
		'method': 'PATCH',
		'useAuth': true,
	}).then((response) => {
		return dispatch(moveTopTenItemUpSucceeded(response));
	}).catch((error) => {
		return dispatch(getErrors({ 'move topTenItem up error ': error.message }));
	});
};

export const moveTopTenItemDown = ({ topTenItemId }) => (dispatch) => {
	// to move an topTenItem down, we move the topTenItem below up
	// find the topTenItem
	const topTenItemObject = store.getState().topTenItem.things[topTenItemId];

	// find its parent topTenList
	const topTenListId = topTenItemObject.topTenList_id;

	// find the topTenItem's order
	const { order } = topTenItemObject;

	// find the topTenItem below it in the parent topTenList
	const topTenItemBelowId = store.getState().topTenList.things[topTenListId].topTenItem[order];

	dispatch(moveTopTenItemUp({ 'topTenItemId': topTenItemBelowId }));
};

// ////////////////////////////////
// Reducer
const initialTopTenItemsState = {
	'isLoading': false,
	'error': null,
	'count': null,
	'next': null,
	'previous': null,
	'things': {},
	'organizerData': {},
};

// ///////////////////////////
// organizer data
// all topTenItems and topTenLists, for selector to use
export const getOrganizerTopTenItems = state => state.topTenItem.organizerData;
const getOrganizerTopTenLists = state => state.topTenList.organizerData;

export const groupedTopTenItems = createSelector(
	[getOrganizerTopTenItems, getOrganizerTopTenLists],
	(topTenItems, topTenLists) => {
		const topTenItemsByTopTenList = {};

		// find the topTenItems for each topTenList
		Object.keys(topTenLists).map((topTenListId) => { // eslint-disable-line array-callback-return
			const topTenList = topTenLists[topTenListId];

			const topTenItemsArray = [];

			for (let i = 0; i < topTenList.topTenItem.length; i += 1) {
				const topTenItemObject = { ...topTenItems[topTenList.topTenItem[i]] };

				if (topTenItemObject.name !== '') {
					topTenItemsArray.push(topTenItemObject);
				}
			}

			topTenItemsByTopTenList[topTenList.id] = topTenItemsArray;
		});
		// note the parent_topTenItem, if any, of each topTenList
		// add the topTenList's id to the topTenItem as childTopTenListId
		Object.keys(topTenLists).map((topTenListId) => { // eslint-disable-line array-callback-return
			const topTenList = topTenLists[topTenListId];

			if (topTenList.parent_topTenItem) {
				const parentTopTenItem = topTenItems[topTenList.parent_topTenItem];

				if (parentTopTenItem) {
					// can't use array order to pull out topTenItem, because topTenItems with no name have been removed
					// instead, explicitly find the topTenItem object in the array by its 'order' property

					const topTenItemsArray2 = topTenItemsByTopTenList[parentTopTenItem.topTenList_id];
					const topTenItemObject = topTenItemsArray2.find(topTenItemInner => topTenItemInner.order === parentTopTenItem.order);
					topTenItemObject.childTopTenListId = topTenList.id;
				}
			}
		});

		return topTenItemsByTopTenList;
	},
);

// ///////////////////////////
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
				'isLoading': false,
			}, state);
		}

		case FETCH_TOPTENLIST_DETAIL_STARTED: {
			return updeep(state, state);
		}

		case CREATE_TOPTENITEM_SUCCEEDED: {
			const { topTenItemData } = action.payload;
			return updeep({ 'things': { [topTenItem.id]: topTenItemData } }, state);
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

			const topTenItemsObject = {};
			topTenItemsArray.map((topTenItemObject) => { // eslint-disable-line array-callback-return
				topTenItemsObject[topTenItemObject.id] = topTenItemObject;
			});
			return updeep({ 'things': topTenItemsObject }, state);
		}

		case RECEIVE_ORGANIZER_DATA: {
			const { entities } = action.payload;

			// we only want items that have a name
			const topTenItemObject = {};
			Object.keys(entities.topTenItem).map((id) => {
				if (entities.topTenItem[id].name) {
					topTenItemObject[id] = entities.topTenItem[id];
				}
			});

			if (entities && entities.topTenItem) {
				return updeep({ 'organizerData': updeep.constant(topTenItemObject), 'isLoading': false }, state);
			}

			return state;
		}

		default:
			return state;
	}
}
