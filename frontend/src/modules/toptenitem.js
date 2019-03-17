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
export const CREATE_TOPTENITEM_REQUESTED = 'CREATE_TOPTENITEM_REQUESTED';
export const CREATE_TOPTENITEM_SUCCEEDED = 'CREATE_TOPTENITEM_SUCCEEDED';
export const UPDATE_TOPTENITEM_SUCCEEDED = 'UPDATE_TOPTENITEM_SUCCEEDED';
export const MOVE_TOPTENITEM_UP_SUCCEEDED = 'MOVE_TOPTENITEM_UP_SUCCEEDED';

////////////////////////////////////
// create toptenitem
export const createTopTenItem = toptenitem => dispatch => {
	dispatch(createTopTenItemRequested());

	return fetchAPI({
		'url': '/api/v1/content/toptenitem/',
		'data': JSON.stringify(toptenitem),
		'method': 'POST',
		'useAuth': true,
		'headers': { 'Content-Type': 'application/json' },
	}).then(response => {
		return dispatch(createTopTenItemSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'create toptenitem': error.message }));
	});
};

export function createTopTenItemRequested() {
	return {
		'type': 'CREATE_TOPTENITEM_REQUESTED',
	};
}

export function createTopTenItemSucceeded(toptenitem) {
	return {
		'type': 'CREATE_TOPTENITEM_SUCCEEDED',
		'payload': {
			toptenitem
		}
	};
}

////////////////////////////////////
// update toptenitem
export const updateTopTenItem = (toptenitemId, propertyName, value) => dispatch => {
	// should be able to update any simple property e.g. name, description

	return fetchAPI({
		'url': `/api/v1/content/toptenitem/${toptenitemId}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ [propertyName]: value }),
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(updateTopTenItemSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'update toptenitem': error.message }));
	});
};

export function updateTopTenItemSucceeded(response) {
	return {
		'type': UPDATE_TOPTENITEM_SUCCEEDED,
		'payload': response,
	};
}

//////////////////////////////////
// move toptenitem up
export const moveTopTenItemUp = ({ toptenitemId }) => dispatch => {
	return fetchAPI({
		'url': `/api/v1/content/toptenitem/${toptenitemId}/moveup/`,
		'headers': { 'Content-Type': 'application/json' },
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(moveTopTenItemUpSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'move toptenitem up error ': error.message }));
	});
};

export const moveTopTenItemDown = ({ toptenitemId }) => dispatch => {
	// to move an toptenitem down, we move the toptenitem below up
	// find the toptenitem
	const toptenitem = store.getState().toptenitem.things[toptenitemId];

	// find its parent toptenlist
	const toptenlistId = toptenitem.toptenlist_id;

	// find the toptenitem's order
	const order = toptenitem.order;

	// find the toptenitem below it in the parent toptenlist
	const toptenitem_below_id = store.getState().toptenlist.things[toptenlistId].toptenitem[order];

	dispatch(moveTopTenItemUp({ 'toptenitemId': toptenitem_below_id }));
};

export function moveTopTenItemUpSucceeded(toptenitems) {
	return {
		'type': 'MOVE_TOPTENITEM_UP_SUCCEEDED',
		'payload': {
			toptenitems,
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
// all toptenitems and toptenlists, for selector to use
export const getOrganizerTopTenItems = state => state.toptenitem.organizerData;
const getOrganizerTopTenLists = state => state.toptenlist.organizerData;

export const groupedTopTenItems = createSelector(
	[getOrganizerTopTenItems, getOrganizerTopTenLists],
	(toptenitems, toptenlists) => {
		let toptenitemsByTopTenList = {};

		// find the toptenitems for each toptenlist
		Object.keys(toptenlists).map(toptenlistId => { // eslint-disable-line array-callback-return
			const toptenlist = toptenlists[toptenlistId];

			let toptenitemsArray = [];

			for (let i=0; i<toptenlist.toptenitem.length; i++) {
				let toptenitem = { ...toptenitems[toptenlist.toptenitem[i]] };

				if (toptenitem.name !== '') {
					toptenitemsArray.push(toptenitem);
				}
			}

			toptenitemsByTopTenList[toptenlist.id] = toptenitemsArray;
		});
		// note the parent_toptenitem, if any, of each toptenlist
		// add the toptenlist's id to the toptenitem as childTopTenListId
		Object.keys(toptenlists).map(toptenlistId => { // eslint-disable-line array-callback-return
			const toptenlist = toptenlists[toptenlistId];

			if (toptenlist.parent_toptenitem) {
				const parentTopTenItem = toptenitems[toptenlist.parent_toptenitem];

				if (parentTopTenItem) {
					// can't use array order to pull out toptenitem, because toptenitems with no name have been removed
					// instead, explicitly find the toptenitem object in the array by its 'order' property

					let toptenitemsArray2 = toptenitemsByTopTenList[parentTopTenItem.toptenlist_id];
					let toptenitem = toptenitemsArray2.find(toptenitem => toptenitem.order === parentTopTenItem.order);
					toptenitem.childTopTenListId = toptenlist.id;
				}
			}
		});

		return toptenitemsByTopTenList;
	}

);

/////////////////////////////
// state updates

export default function toptenitem(state = initialTopTenItemsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialTopTenItemsState, {}); // constant provides placement instead of update, so all previous entries are removed
		}
		
		case RECEIVE_ENTITIES: {
			const { entities } = action.payload;

			let things = {};

			if (entities && entities.toptenitem) {
				things = entities.toptenitem;
			}

			return updeep({
				'things': updeep.constant(things),
				'organizerData': updeep.constant({}), // new toptenlist data so clear out old organizer data, this must be loaded separately
				'isLoading': false }, state);
		}

		case FETCH_TOPTENLIST_DETAIL_STARTED: {
			return updeep(state, state);
		}

		case CREATE_TOPTENITEM_SUCCEEDED: {
			const toptenitem = action.payload.toptenitem;
			return updeep({ 'things': { [toptenitem.id]: toptenitem } }, state);
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
			const toptenitemsArray = action.payload.toptenitems; // array containing the two toptenitems that have been swapped

			let toptenitemsObject = {};
			toptenitemsArray.map((toptenitem) => { // eslint-disable-line array-callback-return
				toptenitemsObject[toptenitem.id] = toptenitem;
			});
			return updeep({ 'things': toptenitemsObject }, state);
		}

		case RECEIVE_ORGANIZER_DATA: {
			const { entities } = action.payload;

			if (entities && entities.toptenitem) {
				return updeep({ 'organizerData': updeep.constant(entities.toptenitem), 'isLoading': false }, state);
			}

			return state;
		}

		default:
			return state;
	}
}

