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
} from './toptenitem';

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

const toptenitemSchema = new schema.Entity('toptenitem', {
	'toptenlist': ['toptenlistSchema'],
});
const toptenlistSchema = new schema.Entity('toptenlist', {
	'toptenitem': [toptenitemSchema],
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
		// if the user is not logged in, don't use auth. The server should return only the toptenlists a non-authenticated user should see.
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
				'entities': normalize(response.results, [toptenlistSchema]).entities,
			};

			return dispatch(receiveEntities(data));
		}).catch(error => {
			dispatch(fetchTopTenListsFailed());

			return dispatch(getErrors({ 'fetch toptenlists': error.message }));
		});
	};
}

///////////////////////////////
// fetch a single toptenlist with is parent and children, if any
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

		// if the user is not logged in, don't use auth. The server should return the toptenlist if a non-authenticated user should see it.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': `/api/v1/content/toptenlistdetail/?id=${id}`,
			'method': 'GET',
			'useAuth': useAuth,
		}).then(response => {
			const normalizedData = normalize(response, [toptenlistSchema]);

			return dispatch(receiveEntities(normalizedData));
		}).catch(error => {
			dispatch(fetchTopTenListDetailFailed());

			return dispatch(getErrors({ 'fetch toptenlists': error.message }));
		});
	};
}

/////////////////////////////
// create toptenlist
export const createTopTenList = (toptenlist, history) => dispatch => {
	dispatch(createTopTenListStarted());

	return fetchAPI({
		'url': '/api/v1/content/toptenlist/',
		'data': JSON.stringify(toptenlist),
		'method': 'POST',
		'useAuth': true,
		'headers': { 'Content-Type': 'application/json' },
	}).then(response => {
		dispatch(createTopTenListSucceeded(response));

		history.push(`/toptenlist/${response.id}`);
		return;
	}).catch(error => {
		return dispatch(getErrors({ 'create toptenlist': error.message }));
	});
};

export function createTopTenListStarted() {
	return {
		'type': CREATE_TOPTENLIST_STARTED,
	};
}

export function createTopTenListSucceeded(toptenlist) {
	return {
		'type': CREATE_TOPTENLIST_SUCCEEDED,
		'payload': {
			toptenlist
		}
	};
}

///////////////////////////
// update toptenlist
export const updateTopTenList = (toptenlistId, propertyName, value) => dispatch => {
	// should be able to update any simple property e.g. name, description
	return fetchAPI({
		'url': `/api/v1/content/toptenlist/${toptenlistId}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ [propertyName]: value }),
		'method': 'PATCH',
		'useAuth': true,
	}).then(response => {
		return dispatch(updateTopTenListSucceeded(response));
	}).catch(error => {
		return dispatch(getErrors({ 'update toptenitem': error.message }));
	});
};

export function updateTopTenListSucceeded(response) {
	return {
		'type': UPDATE_TOPTENLIST_SUCCEEDED,
		'payload': response,
	};
}

///////////////////////////
// delete toptenlist
export const deleteTopTenList = id => (dispatch, getState) => {
	return fetchAPI({
		'url': `/api/v1/content/toptenlist/${id}/`,
		'method': 'DELETE',
		'useAuth': true,
	}).then(response => {
		return dispatch(deleteTopTenListSucceeded(id));
	}).catch(error => {
		return dispatch(getErrors({ 'delete toptenlist': error.message }));
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
		return dispatch(getErrors({ 'set toptenlist is public': error.message }));
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
// fetch the names of my toptenlists and their toptenitems
// for displaying and managing toptenlist hierarchy i.e. toptenlist parent_toptenitem
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
	// get minimal information about all toptenlists owned by one user
	// for use in organizer
	return (dispatch, getState) => {
		dispatch(fetchOrganizerDataStarted());

		// if the user is not logged in, don't use auth. The server should return only the toptenlists a non-authenticated user should see.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': `/api/v1/content/toptenlist/?expand=toptenitem&fields=id,name,toptenitem,is_public,order,parent_toptenitem&created_by=${userId}`,
			'method': 'GET',
			'useAuth': useAuth,
		}).then(response => {
			const normalizedData = normalize(response, [toptenlistSchema]);

			return dispatch(receiveOrganizerData(normalizedData));
		}).catch(error => {
			dispatch(fetchOrganizerDataFailed());

			return dispatch(getErrors({ 'fetch my toptenlist names': error.message }));
		});
	};
}

//////////////////////////////////
// Reducer
var updeep = require('updeep');

// this is initial state of toptenlists and the toptenlist loading states
// note that the toptenlists's list of toptenitems is called 'toptenitem' for consistency with the database.
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

// returns toptenlists as an array not an object
export const getTopTenLists = state => {
	return Object.keys(state.toptenlist.things).map(id => {
		return state.toptenlist.things[id];
	});
};

const getTopTenItems = state => state.toptenitem.things;

export const getPublicTopTenLists = createSelector(
	[getTopTenLists],
	toptenlists => {
		return toptenlists.filter(toptenlist => {
			return toptenlist.is_public;
		});
	}
); 

export const getMyGroupedTopTenLists = createSelector(
	[getTopTenLists],
	toptenlists => {
		const grouped = {};

		TOPTENLIST_IS_PUBLIC_VALUES.forEach(is_public => {
			grouped[is_public] = toptenlists.filter(toptenlist => (toptenlist.created_by === store.getState().auth.user.id) && (toptenlist.is_public === is_public));
		});

		return grouped;
	}
);

/////////////////////////////
// organizer data
export const getOrganizerTopTenLists = state => state.toptenlist.organizerData;
const getOrganizerTopTenItems = state => state.toptenitem.organizerData;

// returns toptenlists in an array, sorted by name
// instead of the state.toptenlist.organizerData object, keyed by id
export const getSortedOrganizerTopTenLists = createSelector(
	[getOrganizerTopTenLists],
	(toptenlists) => {
		const toptenlistsArray = Object.keys(toptenlists).map(id => {
			return toptenlists[id];
		});

		toptenlistsArray.sort(function (a, b) {
			return a.name.localeCompare(b.name);
		});

		return toptenlistsArray;
	}
);

// toptenlists, toptenitems should be memoized
// even though the rest of the selector will be rerun, it's still a gain
export const getTopTenItemsForTopTenList = createSelector(
	[getTopTenLists, getTopTenItems],
	(toptenlists, toptenitems) => (toptenlist) => {
		let toptenlistTopTenItems = [];

		if (toptenlist) {
			toptenlist.toptenitem.map((toptenitemId) => { // eslint-disable-line array-callback-return
				let toptenitem = { ...toptenitems[toptenitemId] }; // shallow copy is extensible

				const childTopTenList = toptenlists.find(toptenlist => toptenlist.parent_toptenitem === toptenitemId);

				if (childTopTenList) {
					toptenitem.childTopTenList = { ...childTopTenList };
				}

				toptenlistTopTenItems.push(toptenitem);
			});
		}
		return toptenlistTopTenItems;
	}
);

// toptenlists, toptenitems should be memoized
// even though the rest of the selector will be rerun, it's still a gain
export const getParentTopTenItemAndTopTenList = createSelector(
	[getOrganizerTopTenLists, getOrganizerTopTenItems],
	// find a toptenlists's parent toptenitem and the parent toptenlist, if any
	// uses the organizer data which has minimal data for all toptenlists belonging to that user
	(toptenlists, toptenitems) => (toptenlist) => {
		let parentTopTenItem;
		let parentTopTenList;

		if (toptenlist && toptenlist.parent_toptenitem) {
			if (toptenitems) {
				parentTopTenItem = toptenitems[toptenlist.parent_toptenitem];

				if (parentTopTenItem) {
					parentTopTenList = toptenlists[parentTopTenItem.toptenlist_id];
				}
			}
		}
		return { parentTopTenItem, parentTopTenList };
	}
);

/////////////////////////////
// state updates

// state here is the substate state.toptenlists
// the book uses 'toptenitems' for the list of things i.e. toptenlists. toptenitems
// as 'toptenitems' for us is a specific thing, we need another name for the set of entities to be displayed i.e. the toptenlists themselves
// so those are globalState.toptenlists.things
// i.e. state.things here
export default function toptenlist(state = initialTopTenListsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialTopTenListsState, {});
		}

		case RECEIVE_ENTITIES: {
			// load toptenlists data into store
			const { count, previous, next, entities } = action.payload;

			let things = {};

			if (entities && entities.toptenlist) {
				things = entities.toptenlist;
			}

			return updeep({
				'count': count,
				'previous': previous,
				'next': next,
				'things': updeep.constant(things), // constant provides placement instead of update, so all previous entries are removed
				'organizerData': updeep.constant({}), // new toptenlist data so clear out old organizer data, this must be loaded separately
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
			const toptenlist = action.payload.toptenlist;
			return updeep({ 'things': { [toptenlist.id]: toptenlist } }, state);
		}

		case DELETE_TOPTENLIST_SUCCEEDED: {
			return updeep({ 'things': updeep.omit([action.payload.id]) }, state);
		}

		case SET_TOPTENLIST_IS_PUBLIC_SUCCEEDED: {
			const toptenlistId = action.payload.id;

			return updeep({ 'things': { [toptenlistId]: { 'is_public': action.payload.is_public } } }, state);
			// reminder of another way to update nested arrays
			/* const index = state.things.findIndex((toptenlist) => toptenlist.id === action.payload.id);

			if (index !== -1) {
				return updeep.updateIn(`things.${index}.is_public`, action.payload.is_public, state);
			} 

			return state; // in case toptenlist was not found
			*/
		}

		case CREATE_TOPTENITEM_SUCCEEDED: {
			const toptenitem = action.payload.toptenitem;

			function addTopTenItem(toptenitems) {
				return [].concat(toptenitems, toptenitem.id);
			}

			return updeep.updateIn(`things.${toptenitem.toptenlist}.toptenitem`, addTopTenItem, state);
		}

		case UPDATE_TOPTENLIST_SUCCEEDED: {
			// update editable properties
			const update = {
				'name': action.payload.name,
				'description': action.payload.description,
				'is_public': action.payload.is_public,
				'modified_by': action.payload.modified_by,
				'modified_at': action.payload.modified_at,
				'parent_toptenitem': action.payload.parent_toptenitem,
			};

			return updeep({ 'things': { [action.payload.id]: update } }, state);
		}

		case MOVE_TOPTENITEM_UP_SUCCEEDED: {
			const toptenitemsArray = action.payload.toptenitems; // array containing the two toptenitems that have been swapped
			// update the TopTenItems array in their parent toptenlist, change order
			const toptenlistId = toptenitemsArray[0].toptenlist_id;

			function replaceTopTenItems(toptenitems) {
				let newTopTenItems = [].concat(state.things[toptenlistId].toptenitem);
				toptenitemsArray.map((toptenitem) => { // eslint-disable-line array-callback-return
					newTopTenItems[toptenitem.order-1] = toptenitem.id;
				});

				return newTopTenItems;
			}

			return updeep.updateIn(`things.${toptenlistId}.toptenitem`, replaceTopTenItems, state);
		}

		case RECEIVE_ORGANIZER_DATA: {
			// load toptenlists data into store
			const { entities } = action.payload;
			let toptenlists = {};

			if (entities && entities.toptenlist) {
				toptenlists = entities.toptenlist; // there is at least one toptenlist
			}

			return updeep({ 'organizerData': updeep.constant(toptenlists), 'isLoading': false }, state);
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

