import { createSelector } from 'reselect';
import fetchAPI from './fetchAPI';
import { getErrors } from './errors';
import store from '../store';

import * as topTenListsReducer from './topTenList';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

import {
	DELETE_TOPTENLIST_SUCCEEDED,
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
export const SET_REUSABLEITEM_IS_PUBLIC_SUCCEEDED = 'SET_REUSABLEITEM_IS_PUBLIC_SUCCEEDED';

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

export const moveTopTenItemUp = ({ topTenItemId }) => (dispatch, getState) => {
	return fetchAPI({
		'url': `/api/v1/content/toptenitem/${topTenItemId}/moveup/`,
		'headers': { 'Content-Type': 'application/json' },
		'method': 'PATCH',
		'useAuth': true,
	}).then((response) => {
		// construct the revised Top Ten Items with swapped order
		const allTopTenItems = getState().topTenItem.things;
		const lowerTopTenItem = { ...allTopTenItems[topTenItemId] };
		const lowerOrder = lowerTopTenItem.order;
		const topTenListId = lowerTopTenItem.topTenList_id;

		let upperTopTenItem;

		const ids = Object.keys(allTopTenItems); // array of ids of all Top Ten Items

		for (let i = 0; i < ids.length; i += 1) {
			const topTenItemObj = allTopTenItems[ids[i]];
			if (topTenItemObj.topTenList_id === topTenListId
			&& topTenItemObj.order === lowerOrder - 1) {
				upperTopTenItem = { ...topTenItemObj };
				break;
			}
		}

		if (lowerOrder < 2) {
			return;
		}

		lowerTopTenItem.order -= 1;
		upperTopTenItem.order += 1;

		const topTenItems = {
			[lowerTopTenItem.id]: lowerTopTenItem,
			[upperTopTenItem.id]: upperTopTenItem,
		};

		return dispatch(moveTopTenItemUpSucceeded(topTenItems));
		// return dispatch(moveTopTenItemUpSucceeded(response));
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
	// 'organizerData': {},
};

// ///////////////////////////
// organizer data
// all topTenItems and topTenLists, for selector to use
export const getOrganizerTopTenItems = state => state.topTenItem.things;
const getOrganizerTopTenLists = state => state.topTenList.things;

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
				'things': things, // add data because notifications also use top ten items
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
			// swap the two top ten items in the store
			const { topTenItems } = action.payload;

			return updeep({ 'things': topTenItems }, state);
		}

		case DELETE_TOPTENLIST_SUCCEEDED: {
			const topTenItems = state.things;
			const topTenItemsToDelete = [];

			Object.keys(topTenItems).forEach((topTenItemId) => {
				const topTenItemObj = state.things[topTenItemId];

				if (topTenItemObj.topTenList_id === action.payload.id) {
					topTenItemsToDelete.push(topTenItemObj.id);
				}
			});
			return updeep({ 'things': updeep.omit(topTenItemsToDelete) }, state);
		}

		case RECEIVE_ORGANIZER_DATA: {
			const { entities } = action.payload;

			if (entities && entities.topTenItem) {
				// we only want items that have a name
				const topTenItemObject = {};

				Object.keys(entities.topTenItem).map((id) => {
					if (entities.topTenItem[id].name) {
						topTenItemObject[id] = entities.topTenItem[id];
					}
				});

				return updeep({ 'things': topTenItemObject, 'isLoading': false }, state);

				// return updeep({ 'organizerData': updeep.constant(topTenItemObject), 'isLoading': false }, state);
			}

			return updeep(state, state);
		}

		case SET_REUSABLEITEM_IS_PUBLIC_SUCCEEDED: {
			const { id, is_public, sourceId } = action.payload;
			// console.log('response', action.payload);

			if (id !== sourceId) { // a new reusableItem, probably because the user made a new private reusableItem from a public one
				// sourceId is the original reusableItem that was copied.

				// all top ten items that referenced the old reusableItem need to reference the new one
				// console.log('new id', id);
				// console.log('old id', sourceId);
				// console.log('state.things', state.things);

				const topTenItems = {};

				Object.keys(state.things).forEach((key) => {
					const topTenItemObj = state.things[key];
					// console.log('topTenItemObj', topTenItemObj);

					if (topTenItemObj.reusableItem === sourceId) {
						const newTopTenItemObj = { ...topTenItemObj };
						newTopTenItemObj.reusableItem = id;
						newTopTenItemObj.reusableItem_id = id;

						topTenItems[key] = newTopTenItemObj;
					}
				});
				// console.log('topTenItems', topTenItems);

				return updeep({ 'things': topTenItems }, state);
			}

			return updeep(state, state);

			// same reusableItem that the user was originally trying to edit
			// probably the user made a private reusableItem public
		}

		default:
			return state;
	}
}
