import { createSelector } from 'reselect';
import { TOPTENLIST_IS_PUBLIC_VALUES } from '../constants';
import { normalize, schema } from 'normalizr';
import fetchAPI from '../modules/fetchAPI';
import { getErrors } from '../modules/errors';
import store from '../store';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

import {
	CREATE_TOPTENITEM_SUCCEEDED,
	// MOVE_TOPTENITEM_UP_SUCCEEDED,
} from './topTenItem';

var updeep = require('updeep');

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

// https://medium.com/overlander/normalizing-data-into-relational-redux-state-with-normalizr-47e7020dd3c1
// define all schemas so they can be referenced
const topTenItemSchema = new schema.Entity('topTenItem');
const reusableItemSchema = new schema.Entity('reusableItem');
const topTenListSchema = new schema.Entity('topTenList');

// each data relationship must be defined in both directions
// a topTenItem has one topTenList and one reusableItem
topTenItemSchema.define({
	'topTenList': topTenListSchema,
	'reusableItem': reusableItemSchema,
});

// a reusableItem has many topTenItems
reusableItemSchema.define({
	'topTenItem': [topTenItemSchema],
});

// a topTenList has many topTenItems
topTenListSchema.define({
	'topTenItem': [topTenItemSchema],
});


function receiveEntities(entities) {
	return {
		'type': RECEIVE_ENTITIES,
		'payload': entities,
	};
}

export function fetchTopTenListsStarted() {
	// export function fetchTopTenListsStarted(is_public) {
	return {
		'type': FETCH_TOPTENLISTS_STARTED,
	};
}

function fetchTopTenListsFailed() {
	return {
		'type': FETCH_TOPTENLISTS_FAILED,
	};
}

export function fetchTopTenLists({
	listset, limit, offset, publicTopTenListsFilterTerm, publicTopTenListsFilterBy,
} = {}) {
	return (dispatch, getState) => {
		dispatch(fetchTopTenListsStarted());
		// if the user is not logged in, don't use auth. The server should return only the topTenLists a non-authenticated user should see.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		let url = `/api/v1/content/toptenlist/?`;

		if (listset) {
			url += `&listset=${listset}`;
		}

		if (limit) {
			url += `&limit=${limit}`;
		}

		if (offset) {
			url += `&offset=${offset}`;
		}

		if (publicTopTenListsFilterTerm && publicTopTenListsFilterTerm !== '' && listset === 'publictoptens') {
			if (publicTopTenListsFilterBy === 'username') {
				url += `&created_by_username=${publicTopTenListsFilterTerm}`;
			} else if (publicTopTenListsFilterBy === 'name') {
				url += `&name=${publicTopTenListsFilterTerm}`;
			}
		}

		let data;

		return fetchAPI({
			'url': url,
			'method': 'GET',
			'useAuth': useAuth,
		}).then((response) => {
			// when paginating, response is an object
			// with array of objects from database as a property
			if (response.results) {
				data = {
					'count': response.count,
					'next': response.next,
					'previous': response.previous,
					'entities': normalize(response.results, [topTenListSchema]).entities,
				};
			} else {
				data = {
					'entities': normalize(response, [topTenListSchema]).entities,
				};
			}

			return dispatch(receiveEntities(data));
		}).catch((error) => {
			dispatch(fetchTopTenListsFailed());

			return dispatch(getErrors({ 'fetch topTenLists': error.message }));
		});
	};
}

// /////////////////////////////
// fetch a single topTenList with is parent and children, if any
export function fetchTopTenListDetailStarted() {
	return {
		'type': FETCH_TOPTENLIST_DETAIL_STARTED,
	};
}

function fetchTopTenListDetailFailed() {
	return {
		'type': FETCH_TOPTENLIST_DETAIL_FAILED,
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
		}).then((response) => {
			const normalizedData = normalize(response, [topTenListSchema]);

			return dispatch(receiveEntities(normalizedData));
		}).catch((error) => {
			dispatch(fetchTopTenListDetailFailed());

			return dispatch(getErrors({ 'fetch topTenLists': error.message }));
		});
	};
}

// ////////////////////////////////
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
		'type': FETCH_ORGANIZER_DATA_FAILED,
	};
}

export function fetchOrganizerData({ userId, reusableItemId }) {
	// get minimal information about all topTenLists owned by one user
	// for use in organizer
	return (dispatch, getState) => {
		dispatch(fetchOrganizerDataStarted());

		// if the user is not logged in, don't use auth. The server should return only the topTenLists a non-authenticated user should see.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		let URL = '/api/v1/content/toptenlist/?expand=topTenItem&fields=id,name,created_at,created_by,created_by_username,modified_at,topTenItem,reusableItem,is_public,order,parent_topTenItem';

		if (reusableItemId) {
			URL += `&reusableItem=${reusableItemId}`;
		}
		// console.log('fetchOrganizerData userId', userId);
		if (userId) {
			// console.log('fetchOrganizerData userId', userId);
			URL += `&created_by=${userId}`;
		}

		return fetchAPI({
			'url': URL,
			'method': 'GET',
			'useAuth': useAuth,
		}).then((response) => {
			// console.log('response', response);
			const normalizedData = normalize(response, [topTenListSchema]);
			// console.log('normalizedData', normalizedData);
			return dispatch(receiveOrganizerData(normalizedData));
		}).catch((error) => {
			dispatch(fetchOrganizerDataFailed());

			return dispatch(getErrors({ 'fetch my topTenList names': error.message }));
		});
	};
}

// ///////////////////////////
// create topTenList
export function createTopTenListStarted() {
	return {
		'type': CREATE_TOPTENLIST_STARTED,
	};
}

export function createTopTenListSucceeded(topTenListData) {
	return {
		'type': CREATE_TOPTENLIST_SUCCEEDED,
		'payload': {
			topTenListData,
		},
	};
}

export const createTopTenList = (topTenListData, history) => (dispatch) => {
	dispatch(createTopTenListStarted());
	// console.log('createTopTenList data', topTenListData);

	return fetchAPI({
		'url': '/api/v1/content/toptenlist/',
		'data': JSON.stringify(topTenListData),
		'method': 'POST',
		'useAuth': true,
		'headers': { 'Content-Type': 'application/json' },
	}).then((response) => {
		dispatch(createTopTenListSucceeded(response));

		history.push(`/topTenList/${response.id}`);
		// return;
	}).catch((error) => {
		return dispatch(getErrors({ 'create topTenList': error.message }));
	});
};

// /////////////////////////
// update topTenList
export function updateTopTenListSucceeded(response) {
	return {
		'type': UPDATE_TOPTENLIST_SUCCEEDED,
		'payload': response,
	};
}

export const updateTopTenList = (topTenListId, propertyName, value) => (dispatch, getState) => {
	// should be able to update any simple property e.g. name, description

	if (!getState().auth.user.token) {
		return;
	}

	return fetchAPI({
		'url': `/api/v1/content/toptenlist/${topTenListId}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ [propertyName]: value }),
		'method': 'PATCH',
		'useAuth': true,
	}).then((response) => {
		dispatch(fetchOrganizerData({ 'userId': response.created_by }));
		return dispatch(updateTopTenListSucceeded(response));
	}).catch((error) => {
		return dispatch(getErrors({ 'update topTenItem': error.message }));
	});
};

// /////////////////////////
// delete topTenList
export function deleteTopTenListSucceeded(id) {
	return {
		'type': DELETE_TOPTENLIST_SUCCEEDED,
		'payload': {
			id,
		},
	};
}

export const deleteTopTenList = id => (dispatch, getState) => {
	if (!getState().auth.user.token) {
		return;
	}

	return fetchAPI({
		'url': `/api/v1/content/toptenlist/${id}/`,
		'method': 'DELETE',
		'useAuth': true,
	}).then((response) => {
		return dispatch(deleteTopTenListSucceeded(id));
	}).catch((error) => {
		return dispatch(getErrors({ 'delete topTenList': error.message }));
	});
};

// /////////////////////////
// change topTenList is_public

export function setTopTenListIsPublicSucceeded({ id, is_public }) {
	return {
		'type': SET_TOPTENLIST_IS_PUBLIC_SUCCEEDED,
		'payload': {
			'id': id,
			is_public,
		},
	};
}

export const setTopTenListIsPublic = ({ id, is_public }) => (dispatch) => {
	return fetchAPI({
		'url': `/api/v1/content/toptenlist/${id}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ is_public }),
		'method': 'PATCH',
		'useAuth': true,
	}).then((response) => {
		return dispatch(setTopTenListIsPublicSucceeded(response));
	}).catch((error) => {
		return dispatch(getErrors({ 'set topTenList is public': error.message }));
	});
};

// ////////////////////////////////
// Reducer
// this is initial state of topTenLists and the topTenList loading states
// note that the topTenLists's list of topTenItems is called 'topTenItem' for consistency with the database.
const initialTopTenListsState = {
	'publicTopTenListsFilterBy': 'topTenListName',
	'publicTopTenListsFilterTerm': '',
	'isLoading': false,
	'isLoadingOrganizerData': false,
	'error': null,
	'count': 0,
	'next': '',
	'previous': '',
	'things': {},
};

// 'state' here is global state
export const getSearchTerm = state => state.page.searchTerm;

// ///////////////////////////
// Permissions
const canViewTopTenList = (auth, topTenListObj) => {
	if (!topTenListObj) {
		return false;
	}

	if (topTenListObj.is_public) {
		return true;
	}

	if (!auth.isAuthenticated) {
		return false;
	}

	if (!auth.user) {
		return false;
	}

	if (topTenListObj.created_by === auth.user.id) {
		return true;
	}

	return false;
};

const canEditTopTenList = (auth, topTenListObj) => {
	if (!topTenListObj) {
		return false;
	}

	if (!auth.isAuthenticated) {
		return false;
	}

	if (!auth.user) {
		return false;
	}

	if (topTenListObj.created_by === auth.user.id) {
		return true;
	}

	return false;
};

// functions to get topTenLists and topTenItems
// get objects from state
const getUserId = state => state.auth.user.id;

const getTopTenLists = (state) => {
	const topTenLists = state.topTenList.things;
	const enhancedTopTenLists = {};

	Object.keys(topTenLists).forEach((key) => {
		const topTenListObj = topTenLists[key];

		enhancedTopTenLists[key] = {
			...topTenListObj,
			'canView': canViewTopTenList(state.auth, topTenListObj),
			'canEdit': canEditTopTenList(state.auth, topTenListObj),
		};
	});
	return enhancedTopTenLists;
};

const getLatestThings = state => state.topTenList.latestThings || [];

const getTopTenItems = state => state.topTenItem.things;

// group, sort, filter objects
export const getTopTenList = (state, topTenListId) => {
	// console.log('topTenListId', topTenListId);
	const topTenListObj = state.topTenList.things[topTenListId];
	if (!topTenListObj) {
		return;
	}
	return {
		...topTenListObj,
		'canView': canViewTopTenList(state.auth, topTenListObj),
		'canEdit': canEditTopTenList(state.auth, topTenListObj),
	};
};

// returns topTenLists as an array not an object
export const getTopTenListsArray = createSelector(
	[getTopTenLists],
	topTenLists => Object.keys(topTenLists).map(id => topTenLists[id]),
);

// return topTenItems and indicate whether the user can view any child top ten lists of those top ten items

// get all public Top Ten Lists
export const getPublicTopTenLists = createSelector(
	[getTopTenListsArray, getLatestThings],
	(topTenLists, latestThings) => {
		let selectedTopTenLists = topTenLists.filter(topTenListObject => topTenListObject.is_public);

		//
		selectedTopTenLists = topTenLists.filter(topTenListObject => latestThings.indexOf(topTenListObject.id) !== -1);
		return selectedTopTenLists;
	},
);

// get Top Ten Lists belonging to the user
export const getMyTopTenLists = createSelector(
	[getTopTenLists, getUserId],
	(allTopTenLists, userId) => {
		if (!userId) {
			return {};
		}

		const myTopTenLists = {};

		Object.keys(allTopTenLists).forEach((key) => {
			const topTenListObj = allTopTenLists[key];

			if (topTenListObj.created_by === userId) {
				myTopTenLists[topTenListObj.id] = topTenListObj;
			}
		});

		return myTopTenLists;
	},
);

export const getMyGroupedTopTenLists = createSelector(
	[getTopTenListsArray],
	(topTenLists) => {
		const grouped = {};

		TOPTENLIST_IS_PUBLIC_VALUES.forEach((is_public) => {
			grouped[is_public] = topTenLists.filter(topTenListObject => (topTenListObject.created_by === store.getState().auth.user.id) && (topTenListObject.is_public === is_public));
		});

		return grouped;
	},
);

// only get top level lists
export const getTopLevelPublicTopTenLists = createSelector(
	[getPublicTopTenLists],
	topTenLists => topTenLists.filter(topTenListObject => !topTenListObject.parent_topTenItem),
);

export const getTopLevelMyGroupedTopTenLists = createSelector(
	[getMyGroupedTopTenLists],
	(groupedTopTenLists) => {
		const grouped = {};

		TOPTENLIST_IS_PUBLIC_VALUES.forEach((is_public) => {
			grouped[is_public] = groupedTopTenLists[is_public].filter(topTenListObject => !topTenListObject.parent_topTenItem);
		});

		return grouped;
	},
);

// ///////////////////////////
// organizer data
// const getOrganizerTopTenItems = state => state.topTenItem.things;

// returns topTenLists in an array, sorted by name
// instead of the state.topTenList.things object, keyed by id
export const getMySortedOrganizerTopTenLists = createSelector(
	[getMyTopTenLists],
	(topTenLists) => {
		const topTenListsArray = Object.keys(topTenLists).map(id => topTenLists[id]);

		topTenListsArray.sort((a, b) => a.name.localeCompare(b.name));

		return topTenListsArray;
	},
);

// topTenListsArray, topTenItems should be memoized
// even though the rest of the selector will be rerun, it's still a gain
export const getTopTenItemsForTopTenList = createSelector(
	[getTopTenListsArray, getTopTenItems],
	(topTenLists, topTenItems) => (topTenListObject) => {
		const topTenListTopTenItems = [];

		if (topTenListObject) {
			topTenListObject.topTenItem.map((topTenItemId) => { // eslint-disable-line array-callback-return
				const topTenItem = { ...topTenItems[topTenItemId] }; // shallow copy is extensible

				const childTopTenList = topTenLists.find(topTenListInner => topTenListInner.parent_topTenItem === topTenItemId);

				if (childTopTenList) {
					topTenItem.childTopTenList = { ...childTopTenList };
				}

				topTenListTopTenItems.push(topTenItem);
			});
		}

		topTenListTopTenItems.sort((a, b) => {
			//console.log('a', a.order);
			//console.log('typeof a', typeof a.order);
			//console.log('b', b.order);
			//console.log('typeof b', typeof b.order);
			return a.order - b.order; // Chrome doesn't support the common boolean sort. Must return a number.
		});
		// console.log('topTenListTopTenItems', topTenListTopTenItems);
		return topTenListTopTenItems;
	},
);

// Top Ten Lists for a Reusable Item
const getReusableItemId = (state, id) => id;

// find the Top Ten Items, Top Ten Lists and Users that reference this Reusable Item
export const getReusableItemUsageData = createSelector(
	[getTopTenLists, getTopTenItems, getReusableItemId, getUserId],
	(topTenLists, topTenItems, targetReusableItemId, userId) => {
		const topTenItemsArray = [];
		const topTenListsArray = [];

		const myTopTenItemsArray = [];
		const myTopTenListsArray = [];

		Object.keys(topTenItems).map((id) => { // eslint-disable-line array-callback-return
			const topTenItemObj = topTenItems[id];
			const { reusableItem_id, topTenList_id } = topTenItemObj;
			const topTenListObj = topTenLists[topTenList_id];

			// the Top Ten Item references the Reusable Item
			if (reusableItem_id === targetReusableItemId) {
				// avoid duplicates
				if (!topTenItemsArray.includes(topTenItemObj)) {
					topTenItemsArray.push(topTenItemObj);

					if (topTenListObj.created_by === userId) {
						myTopTenItemsArray.push(topTenItemObj);
					}
				}

				if (!topTenListsArray.includes(topTenListObj)) {
					topTenListsArray.push(topTenListObj);

					if (topTenListObj.created_by === userId) {
						myTopTenListsArray.push(topTenListObj);
					}
				}
			}
		});

		topTenListsArray.sort((a, b) => a.name.localeCompare(b.name));
		// topTenListsArray.sort((a, b) => a.name.localeCompare(b.name));

		const users = new Set(topTenListsArray.map(topTenListObj => topTenListObj.created_by)); // all users who reference this Reusable Item, as a Set to avoid duplicates

		return {
			topTenListsArray,
			topTenItemsArray,
			myTopTenItemsArray,
			myTopTenListsArray,
			users,
		};
	},
);

// topTenLists, topTenItems should be memoized
// even though the rest of the selector will be rerun, it's still a gain
export const getParentTopTenItemAndTopTenList = createSelector(
	[getTopTenLists, getTopTenItems],
	// find a topTenLists's parent topTenItem and the parent topTenList, if any
	(topTenLists, topTenItems) => (topTenListId) => {
		const topTenListObject = topTenLists[topTenListId];

		let parentTopTenItem;
		let parentTopTenList;

		if (topTenListObject && topTenListObject.parent_topTenItem) {
			if (topTenItems) {
				parentTopTenItem = topTenItems[topTenListObject.parent_topTenItem];

				if (parentTopTenItem) {
					parentTopTenList = topTenLists[parentTopTenItem.topTenList_id];
				}
			}
		}
		return { parentTopTenItem, parentTopTenList };
	},
);

// ///////////////////////////
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
			const {
				count,
				previous,
				next,
				entities,
			} = action.payload;

			let things = {};

			if (entities && entities.topTenList) {
				things = entities.topTenList;
			}

			return updeep({
				'count': count,
				'previous': previous,
				'next': next,
				'latestThings': updeep.constant(Object.keys(things)), // array of ids of the Top Ten Lists that were fetched. UI uses this to select the Top Ten Lists to show when paginating
				'things': things, // add data because notifications also use top ten lists
				'isLoading': false,
				'isLoadingOrganizerData': false,
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
			const { topTenListData } = action.payload;
			return updeep({ 'things': { [topTenListData.id]: topTenListData } }, state);
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
			const { topTenItem } = action.payload;

			function addTopTenItem(topTenItems) { // eslint-disable-line no-inner-declarations
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

		/* case MOVE_TOPTENITEM_UP_SUCCEEDED: {
			console.log('in topTenList reducer');
			return updeep(state, state);
			const topTenItemsArray = action.payload.topTenItems; // array containing the two topTenItems that have been swapped
			// update the TopTenItems array in their parent topTenList, change order
			const topTenListId = topTenItemsArray[0].topTenList_id;

			function replaceTopTenItems() { // eslint-disable-line no-inner-declarations
				const newTopTenItems = [].concat(state.things[topTenListId].topTenItem);
				topTenItemsArray.map((topTenItem) => { // eslint-disable-line array-callback-return
					newTopTenItems[topTenItem.order - 1] = topTenItem.id;
				});

				return newTopTenItems;
			}

			return updeep.updateIn(`things.${topTenListId}.topTenItem`, replaceTopTenItems, state);
		} */

		case RECEIVE_ORGANIZER_DATA: {
			// load topTenLists data into store
			const newEntities = action.payload.entities || {};
			const organizerData = newEntities.topTenList || {};

			return updeep({
				// 'organizerData': updeep.constant(organizerData),
				'things': organizerData,
				'isLoadingOrganizerData': false,
			}, state);
		}

		case FETCH_ORGANIZER_DATA_STARTED: {
			return updeep({ 'isLoadingOrganizerData': true	}, state);
		}

		case FETCH_ORGANIZER_DATA_FAILED: {
			return updeep(state, state);
		}

		default:
			return state;
	}
}
