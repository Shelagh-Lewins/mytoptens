import { createSelector } from 'reselect';
import { TOPTENLIST_IS_PUBLIC_VALUES } from '../constants';
import fetchAPI from '../modules/fetchAPI';
import { getErrors } from '../modules/errors';
import { normalize, schema } from 'normalizr';
import store from '../store';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

import {
	CREATE_TOPTENITEM_SUCCEEDED,
	MOVE_TOPTENITEM_UP_SUCCEEDED,
} from './topTenItem';

// define action types so they are visible
// and export them so other reducers can use them
export const RECEIVE_ENTITIES = 'RECEIVE_ENTITIES';
export const FETCH_TOPTENLISTS_STARTED = 'FETCH_TOPTENLISTS_STARTED';
export const FETCH_TOPTENLISTS_FAILED = 'FETCH_TOPTENLISTS_FAILED';
export const FETCH_TOPTENLIST_DETAIL_STARTED = 'FETCH_TOPTENLIST_DETAIL_STARTED';
export const FETCH_TOPTENLIST_DETAIL_FAILED = 'FETCH_TOPTENLIST_DETAIL_FAILED';
export const CREATE_TOPTENLIST_STARTED = 'CREATE_TOPTENLIST_STARTED';
export const CREATE_TOPTENLIST_SUCCEEDED = 'CREATE_TOPTENLIST_SUCCEEDED';
export const DELETE_TOPTENLIST_SUCCEEDED = 'DELETE_TOPTENLIST_SUCCEEDED';
export const SET_TOPTENLIST_IS_PUBLIC_SUCCEEDED = 'SET_TOPTENLIST_IS_PUBLIC_SUCCEEDED';
export const UPDATE_TOPTENLIST_SUCCEEDED = 'UPDATE_TOPTENLIST_SUCCEEDED';

export const RECEIVE_ORGANIZER_DATA = 'RECEIVE_ORGANIZER_DATA';
export const FETCH_ORGANIZER_DATA_STARTED = 'FETCH_ORGANIZER_DATA_STARTED';
export const FETCH_ORGANIZER_DATA_FAILED = 'FETCH_ORGANIZER_DATA_FAILED';

const topTenItemSchema = new schema.Entity('topTenItem', {
	'topTenList': ['topTenListSchema'],
});
const topTenListSchema = new schema.Entity('topTenList', {
	'topTenItem': [topTenItemSchema],
});

function receiveEntities(entities) {
	return {
		'type': RECEIVE_ENTITIES,
		'payload': entities,
	};
}

export function fetchTopTenListsStarted(is_public) {
	return {
		'type': FETCH_TOPTENLISTS_STARTED,
	};
}

function fetchTopTenListsFailed() {
	return {
		'type': FETCH_TOPTENLISTS_FAILED
	};
}

export function fetchTopTenLists({ listset, topLevelTopTenListsOnly, limit, offset } = {}) {
	return (dispatch, getState) => {
		dispatch(fetchTopTenListsStarted());
		// if the user is not logged in, don't use auth. The server should return only the topTenLists a non-authenticated user should see.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		let url = `/api/v1/content/toptenlist/?`;

		if (topLevelTopTenListsOnly) {
			url += '&toplevel=1';
		}

		if (listset) {
			url += `&listset=${listset}`;
		}

		if (limit) {
			url += `&limit=${limit}`;
		}

		if (offset) {
			url += `&offset=${offset}`;
		}
		return fetchAPI({
			'url': url,
			'method': 'GET',
			'useAuth': useAuth,
		}).then(response => {
			let data = {
				'count': response.count,
				'next': response.next,
				'previous': response.previous,
				'entities': normalize(response.results, [topTenListSchema]).entities,
			};

			return dispatch(receiveEntities(data));
		}).catch(error => {
			dispatch(fetchTopTenListsFailed());

			return dispatch(getErrors({ 'fetch topTenLists': error.message }));
		});
	};
}

///////////////////////////////
// fetch a single topTenList with is parent and children, if any
export function fetchTopTenListDetailStarted() {
	return {
		'type': FETCH_TOPTENLIST_DETAIL_STARTED,
	};
}

function fetchTopTenListDetailFailed() {
	return {
		'type': FETCH_TOPTENLIST_DETAIL_FAILED
	};
}

export function fetchTopTenListDetail(id) {
	return (dispatch, getState) => {
		dispatch(fetchTopTenListDetailStarted());

		// if the user is not logged in, don't use auth. The server should return the topTenList if a non-authenticated user should see it.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': `/api/v1/content/toptenlistdetail/?id=${id}`,
			'method': 'GET',
			'useAuth': useAuth,
		}).then(response => {
			const normalizedData = normalize(response, [topTenListSchema]);

			return dispatch(receiveEntities(normalizedData));
		}).catch(error => {
			dispatch(fetchTopTenListDetailFailed());

			return dispatch(getErrors({ 'fetch topTenLists': error.message }));
		});
	};
}

/////////////////////////////
// create topTenList
export const createTopTenList = (topTenList, history) => dispatch => {
	dispatch(createTopTenListStarted());

	return fetchAPI({
		'url': '/api/v1/content/toptenlist/',
		'data': JSON.stringify(topTenList),
		'method': 'POST',
		'useAuth': true,
		'headers': { 'Content-Type': 'application/json' },
	}).then(response => {
		dispatch(createTopTenListSucceeded(response));

		history.push(`/topTenList/${response.id}`);
		return;
	}).catch(error => {
		return dispatch(getErrors({ 'create topTenList': error.message }));
	});
};

export function createTopTenListStarted() {
	return {
		'type': CREATE_TOPTENLIST_STARTED,
	};
}

export function createTopTenListSucceeded(topTenList) {
	return {
		'type': CREATE_TOPTENLIST_SUCCEEDED,
		'payload': {
			topTenList
		}
	};
}

///////////////////////////
// update topTenList
export const updateTopTenList = (topTenListId, propertyName, value) => dispatch => {
	// should be able to update any simple property e.g. name, description
	return fetchAPI({
		'url': `/api/v1/content/toptenlist/${topTenListId}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ [propertyName]: value }),
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(updateTopTenListSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'update topTenItem': error.message }));
	});
};

export function updateTopTenListSucceeded(response) {
	return {
		'type': UPDATE_TOPTENLIST_SUCCEEDED,
		'payload': response,
	};
}

///////////////////////////
// delete topTenList
export const deleteTopTenList = id => (dispatch, getState) => {
	return fetchAPI({
		'url': `/api/v1/content/toptenlist/${id}/`,
		'method': 'DELETE',
		'useAuth': true,
	}).then(response => {
		return dispatch(deleteTopTenListSucceeded(id));
	}).catch(error => {
		return dispatch(getErrors({ 'delete topTenList': error.message }));
	});
};

export function deleteTopTenListSucceeded(id) {
	return {
		'type': DELETE_TOPTENLIST_SUCCEEDED,
		'payload': {
			id
		}
	};
}

export const setTopTenListIsPublic = ({ id, is_public }) => dispatch => {
	return fetchAPI({
		'url': `/api/v1/content/toptenlist/${id}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ is_public }),
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(setTopTenListIsPublicSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'set topTenList is public': error.message }));
	});
};

export function setTopTenListIsPublicSucceeded({ id, is_public }) {
	return {
		'type': SET_TOPTENLIST_IS_PUBLIC_SUCCEEDED,
		'payload': {
			'id': id,
			is_public
		}
	};
}

//////////////////////////////////
// fetch the names of my topTenLists and their topTenItems
// for displaying and managing topTenList hierarchy i.e. topTenList parent_topTenItem
// returns only the fields that are required for this function
function receiveOrganizerData(entities) {
	return {
		'type': RECEIVE_ORGANIZER_DATA,
		'payload': entities,
	};
}

export function fetchOrganizerDataStarted(is_public) {
	return {
		'type': FETCH_ORGANIZER_DATA_STARTED,
	};
}

function fetchOrganizerDataFailed() {
	return {
		'type': FETCH_ORGANIZER_DATA_FAILED
	};
}

export function fetchOrganizerData(userId) {
	// get minimal information about all topTenLists owned by one user
	// for use in organizer
	return (dispatch, getState) => {
		dispatch(fetchOrganizerDataStarted());

		// if the user is not logged in, don't use auth. The server should return only the topTenLists a non-authenticated user should see.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': `/api/v1/content/toptenlist/?expand=topTenItem&fields=id,name,topTenItem,is_public,order,parent_topTenItem&created_by=${userId}`,
			'method': 'GET',
			'useAuth': useAuth,
		}).then(response => {
			const normalizedData = normalize(response, [topTenListSchema]);

			return dispatch(receiveOrganizerData(normalizedData));
		}).catch(error => {
			dispatch(fetchOrganizerDataFailed());

			return dispatch(getErrors({ 'fetch my topTenList names': error.message }));
		});
	};
}

//////////////////////////////////
// Reducer
var updeep = require('updeep');

// this is initial state of topTenLists and the topTenList loading states
// note that the topTenLists's list of topTenItems is called 'topTenItem' for consistency with the database.
const initialTopTenListsState = {
	'isLoading': false,
	'error': null,
	'count': 0,
	'next': '',
	'previous': '',
	'things': {},
	'organizerData': {},
};

// 'state' here is global state
export const getSearchTerm = state => {
	return state.page.searchTerm;
};

// returns topTenLists as an array not an object
export const getTopTenLists = state => {
	return Object.keys(state.topTenList.things).map(id => {
		return state.topTenList.things[id];
	});
};

const getTopTenItems = state => state.topTenItem.things;

export const getPublicTopTenLists = createSelector(
	[getTopTenLists],
	topTenLists => {
		return topTenLists.filter(topTenList => {
			return topTenList.is_public;
		});
	}
); 

export const getMyGroupedTopTenLists = createSelector(
	[getTopTenLists],
	topTenLists => {
		const grouped = {};

		TOPTENLIST_IS_PUBLIC_VALUES.forEach(is_public => {
			grouped[is_public] = topTenLists.filter(topTenList => (topTenList.created_by === store.getState().auth.user.id) && (topTenList.is_public === is_public));
		});

		return grouped;
	}
);

/////////////////////////////
// organizer data
export const getOrganizerTopTenLists = state => state.topTenList.organizerData;
const getOrganizerTopTenItems = state => state.topTenItem.organizerData;

// returns topTenLists in an array, sorted by name
// instead of the state.topTenList.organizerData object, keyed by id
export const getSortedOrganizerTopTenLists = createSelector(
	[getOrganizerTopTenLists],
	(topTenLists) => {
		const topTenListsArray = Object.keys(topTenLists).map(id => {
			return topTenLists[id];
		});

		topTenListsArray.sort(function (a, b) {
			return a.name.localeCompare(b.name);
		});

		return topTenListsArray;
	}
);

// topTenLists, topTenItems should be memoized
// even though the rest of the selector will be rerun, it's still a gain
export const getTopTenItemsForTopTenList = createSelector(
	[getTopTenLists, getTopTenItems],
	(topTenLists, topTenItems) => (topTenList) => {
		let topTenListTopTenItems = [];

		if (topTenList) {
			console.log('list ', topTenList);
			topTenList.topTenItem.map((topTenItemId) => { // eslint-disable-line array-callback-return
				let topTenItem = { ...topTenItems[topTenItemId] }; // shallow copy is extensible

				const childTopTenList = topTenLists.find(topTenList => topTenList.parent_topTenItem === topTenItemId);

				if (childTopTenList) {
					topTenItem.childTopTenList = { ...childTopTenList };
				}

				topTenListTopTenItems.push(topTenItem);
			});
		}
		return topTenListTopTenItems;
	}
);

// topTenLists, topTenItems should be memoized
// even though the rest of the selector will be rerun, it's still a gain
export const getParentTopTenItemAndTopTenList = createSelector(
	[getOrganizerTopTenLists, getOrganizerTopTenItems],
	// find a topTenLists's parent topTenItem and the parent topTenList, if any
	// uses the organizer data which has minimal data for all topTenLists belonging to that user
	(topTenLists, topTenItems) => (topTenList) => {
		let parentTopTenItem;
		let parentTopTenList;

		if (topTenList && topTenList.parent_topTenItem) {
			if (topTenItems) {
				parentTopTenItem = topTenItems[topTenList.parent_topTenItem];

				if (parentTopTenItem) {
					parentTopTenList = topTenLists[parentTopTenItem.topTenList_id];
				}
			}
		}
		return { parentTopTenItem, parentTopTenList };
	}
);

/////////////////////////////
// state updates

// state here is the substate state.topTenLists
// the book uses 'topTenItems' for the list of things i.e. topTenLists. topTenItems
// as 'topTenItems' for us is a specific thing, we need another name for the set of entities to be displayed i.e. the topTenLists themselves
// so those are globalState.topTenLists.things
// i.e. state.things here
export default function topTenList(state = initialTopTenListsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialTopTenListsState, {});
		}

		case RECEIVE_ENTITIES: {
			// load topTenLists data into store
			const { count, previous, next, entities } = action.payload;

			let things = {};

			if (entities && entities.topTenList) {
				things = entities.topTenList;
			}

			return updeep({
				'count': count,
				'previous': previous,
				'next': next,
				'things': updeep.constant(things), // constant provides placement instead of update, so all previous entries are removed
				'organizerData': updeep.constant({}), // new topTenList data so clear out old organizer data, this must be loaded separately
				'isLoading': false
			}, state);
		}

		case FETCH_TOPTENLISTS_STARTED: {
			return updeep({ 'isLoading': true }, state);
		}

		case FETCH_TOPTENLISTS_FAILED: {
			return updeep({ 'isLoading': false }, state);
		}

		case FETCH_TOPTENLIST_DETAIL_STARTED: {
			return updeep({ 'isLoading': true	}, state);
		}

		case FETCH_TOPTENLIST_DETAIL_FAILED: {
			return updeep({ 'isLoading': false }, state);
		}

		case CREATE_TOPTENLIST_STARTED: {
			// at present this does nothing, it's really just to track that the action happened
			return updeep(state, state);
		}

		case CREATE_TOPTENLIST_SUCCEEDED: {
			const topTenList = action.payload.topTenList;
			return updeep({ 'things': { [topTenList.id]: topTenList } }, state);
		}

		case DELETE_TOPTENLIST_SUCCEEDED: {
			return updeep({ 'things': updeep.omit([action.payload.id]) }, state);
		}

		case SET_TOPTENLIST_IS_PUBLIC_SUCCEEDED: {
			const topTenListId = action.payload.id;

			return updeep({ 'things': { [topTenListId]: { 'is_public': action.payload.is_public } } }, state);
			// reminder of another way to update nested arrays
			/* const index = state.things.findIndex((topTenList) => topTenList.id === action.payload.id);

			if (index !== -1) {
				return updeep.updateIn(`things.${index}.is_public`, action.payload.is_public, state);
			} 

			return state; // in case topTenList was not found
			*/
		}

		case CREATE_TOPTENITEM_SUCCEEDED: {
			const topTenItem = action.payload.topTenItem;

			function addTopTenItem(topTenItems) {
				return [].concat(topTenItems, topTenItem.id);
			}

			return updeep.updateIn(`things.${topTenItem.topTenList}.topTenItem`, addTopTenItem, state);
		}

		case UPDATE_TOPTENLIST_SUCCEEDED: {
			// update editable properties
			const update = {
				'name': action.payload.name,
				'description': action.payload.description,
				'is_public': action.payload.is_public,
				'modified_by': action.payload.modified_by,
				'modified_at': action.payload.modified_at,
				'parent_topTenItem': action.payload.parent_topTenItem,
			};

			return updeep({ 'things': { [action.payload.id]: update } }, state);
		}

		case MOVE_TOPTENITEM_UP_SUCCEEDED: {
			const topTenItemsArray = action.payload.topTenItems; // array containing the two topTenItems that have been swapped
			// update the TopTenItems array in their parent topTenList, change order
			const topTenListId = topTenItemsArray[0].topTenList_id;

			function replaceTopTenItems(topTenItems) {
				let newTopTenItems = [].concat(state.things[topTenListId].topTenItem);
				topTenItemsArray.map((topTenItem) => { // eslint-disable-line array-callback-return
					newTopTenItems[topTenItem.order-1] = topTenItem.id;
				});

				return newTopTenItems;
			}

			return updeep.updateIn(`things.${topTenListId}.topTenItem`, replaceTopTenItems, state);
		}

		case RECEIVE_ORGANIZER_DATA: {
			// load topTenLists data into store
			const { entities } = action.payload;
			let topTenLists = {};

			if (entities && entities.topTenList) {
				topTenLists = entities.topTenList; // there is at least one topTenList
			}

			return updeep({ 'organizerData': updeep.constant(topTenLists), 'isLoading': false }, state);
		}

		case FETCH_ORGANIZER_DATA_STARTED: {
			return updeep(state, state);
		}

		case FETCH_ORGANIZER_DATA_FAILED: {
			return updeep(state, state);
		}

		default:
			return state;
	}
}

