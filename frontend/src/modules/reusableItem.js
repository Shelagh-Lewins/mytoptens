import { createSelector } from 'reselect';
import { normalize, schema } from 'normalizr';
import fetchAPI from './fetchAPI';
import { getErrors } from './errors';

import * as topTenListsReducer from './topTenList';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

import {
	RECEIVE_ENTITIES,
	FETCH_TOPTENLIST_DETAIL_STARTED,
} from './topTenList';

// topTenItem reducer also uses this action, and is loaded first.
import {
	SET_REUSABLEITEM_IS_PUBLIC_SUCCEEDED,
} from './topTenItem';

const updeep = require('updeep');

/* eslint-disable array-callback-return */

const topTenItemSchema = new schema.Entity('topTenItem');
const reusableItemSchema = new schema.Entity('reusableItem');

// each data relationship must be defined in both directions
// a topTenItem has one topTenList and one reusableItem
topTenItemSchema.define({
	'reusableItem': reusableItemSchema,
});

// a reusableItem has many topTenItems
reusableItemSchema.define({
	'topTenItem': [topTenItemSchema],
});

function receiveEntities(entities) {
	return {
		'type': RECEIVE_ENTITIES,
		'payload': entities,
	};
}

// ////////////////////////////////
// Action creators

// define action types so they are visible
// and export them so other reducers can use them
// export const CREATE_REUSABLEITEM_REQUESTED = 'CREATE_REUSABLEITEM_REQUESTED';
export const RECEIVE_REUSABLEITEMS = 'RECEIVE_REUSABLEITEMS';

export const SUGGEST_REUSABLE_ITEMS_STARTED = 'SUGGEST_REUSABLE_ITEMS_STARTED';
export const SEARCH_REUSABLEITEMS_STARTED = 'SEARCH_REUSABLEITEMS_STARTED';
export const SEARCH_REUSABLEITEMS_SUCCEEDED = 'SEARCH_REUSABLEITEMS_SUCCEEDED';
export const SEARCH_REUSABLEITEMS_FAILED = 'SEARCH_REUSABLEITEMS_FAILED';
export const SEARCH_REUSABLEITEMS_CLEAR = 'SEARCH_REUSABLEITEMS_CLEAR';

export const SEARCH_TOPTENITEMS_STARTED = 'SEARCH_TOPTENITEMS_STARTED';
export const SEARCH_TOPTENITEMS_SUCCEEDED = 'SEARCH_TOPTENITEMS_SUCCEEDED';
export const SEARCH_TOPTENITEMS_FAILED = 'SEARCH_TOPTENITEMS_FAILED';

// export const SET_REUSABLEITEM_IS_PUBLIC_SUCCEEDED = 'SET_REUSABLEITEM_IS_PUBLIC_SUCCEEDED';
// weird event to
export const SET_REUSABLEITEM_IS_PUBLIC_UI_UPDATED = 'SET_REUSABLEITEM_IS_PUBLIC_UI_UPDATED';

export const UPDATE_REUSABLEITEM_SUCCEEDED = 'UPDATE_REUSABLEITEM_SUCCEEDED';

export const UPDATE_REUSABLEITEM_STARTED = 'UPDATE_REUSABLEITEMS_STARTED';
export const UPDATE_REUSABLEITEM_FAILED = 'UPDATE_REUSABLEITEMS_FAILED';

export const FETCH_REUSABLEITEM_DETAIL_STARTED = 'FETCH_REUSABLEITEM_DETAIL_STARTED';
export const FETCH_REUSABLEITEM_DETAIL_FAILED = 'FETCH_REUSABLEITEM_DETAIL_FAILED';

export const FETCH_REUSABLEITEM_VOTES_STARTED = 'FETCH_REUSABLEITEM_VOTES_STARTED';

// ////////////////////////////////
// Suggest names for topTenItems based on reusableItems and topTenItems that have no reusable item
export function suggestReusableItems(searchTerm, widgetId) {
	return (dispatch) => {
		dispatch(suggestReusableItemsStarted(searchTerm, widgetId));
		dispatch(searchReusableItems(searchTerm, widgetId));
		dispatch(searchTopTenItems(searchTerm, widgetId));
	};
}

export function suggestReusableItemsStarted(searchTerm, widgetId) {
	return {
		'type': SUGGEST_REUSABLE_ITEMS_STARTED,
		'payload': { searchTerm, widgetId },
	};
}

// ////////////////////////////////
// Search for reusableItems
export function searchReusableItemsStarted(searchTerm, widgetId) {
	return {
		'type': SEARCH_REUSABLEITEMS_STARTED,
		'payload': { searchTerm, widgetId },
	};
}

function searchReusableItemsSucceeded(results, widgetId) {
	// TODO notify if no results
	return {
		'type': SEARCH_REUSABLEITEMS_SUCCEEDED,
		'payload': { results, widgetId },
	};
}

// reset if there is no searchTerm
export function searchReusableItemsClear(widgetId) {
	return {
		'type': SEARCH_REUSABLEITEMS_CLEAR,
		'payload': { widgetId },
	};
}

export const searchReusableItems = (searchTerm, widgetId) => (dispatch, getState) => {
	// don't search on empty string
	if (!searchTerm || searchTerm === '') {
		return dispatch(searchReusableItemsClear(widgetId));
	}

	dispatch(searchReusableItemsStarted(searchTerm, widgetId));

	// if the user is not logged in, don't use auth. The server should return the reusableItem if a non-authenticated user should see it.
	let useAuth = false;

	if (getState().auth.user.token) {
		useAuth = true;
	}

	return fetchAPI({
		'url': `/api/v1/content/searchreusableitems/?search=${searchTerm}`,
		'method': 'GET',
		'useAuth': useAuth,
	}).then((response) => {
		// console.log('searchApi says ', response);
		return dispatch(searchReusableItemsSucceeded(response.results, widgetId));
	}).catch((error) => {
		dispatch(searchReusableItems());

		return dispatch(getErrors({ 'fetch reusableItems': error.message }));
	});
};

// /////////////////////////////
// fetch a single reusableItem
export function fetchReusableItemDetailStarted() {
	return {
		'type': FETCH_REUSABLEITEM_DETAIL_STARTED,
	};
}

function fetchReusableItemDetailFailed() {
	return {
		'type': FETCH_REUSABLEITEM_DETAIL_FAILED,
	};
}

export const fetchReusableItemDetail = id => (dispatch, getState) => {
	dispatch(fetchReusableItemDetailStarted());

	// if the user is not logged in, don't use auth. The server should return the reusableItem if a non-authenticated user should see it.
	let useAuth = false;

	if (getState().auth.user.token) {
		useAuth = true;
	}

	return fetchAPI({
		'url': `/api/v1/content/reusableitem/?id=${id}`,
		'method': 'GET',
		'useAuth': useAuth,
	}).then((response) => {
		// console.log('fetchReusableItemDetail response', response);
		const normalizedData = normalize(response, [reusableItemSchema]);

		dispatch(topTenListsReducer.fetchOrganizerData({ 'reusableItemId': id }));

		return dispatch(receiveEntities(normalizedData));
	}).catch((error) => {
		dispatch(fetchReusableItemDetailFailed());

		return dispatch(getErrors({ 'fetch reusableItemDetail': error.message }));
	});
};

// ////////////////////////////////
// Search for Top Ten Items by name, but only those which have no reusableItem
export function searchTopTenItemsStarted(searchTerm, widgetId) {
	return {
		'type': SEARCH_TOPTENITEMS_STARTED,
		'payload': { searchTerm, widgetId },
	};
}

function searchTopTenItemsSucceeded(results, widgetId) {
	// TODO notify if no results
	return {
		'type': SEARCH_TOPTENITEMS_SUCCEEDED,
		'payload': { results, widgetId },
	};
}

function searchTopTenItemsFailed() {
	return {
		'type': SEARCH_TOPTENITEMS_FAILED,
	};
}

export const searchTopTenItems = (searchTerm, widgetId) => (dispatch, getState) => {
	// clear is handled by reusableItem reducer
	// don't search on empty string
	if (!searchTerm || searchTerm === '') {
		return;
	}

	dispatch(searchTopTenItemsStarted(searchTerm, widgetId));

	// if the user is not logged in, don't use auth. The server should return the topTenItem if a non-authenticated user should see it.
	let useAuth = false;

	if (getState().auth.user.token) {
		useAuth = true;
	}

	return fetchAPI({
		'url': `/api/v1/content/searchlistsitems/?search=${searchTerm}&includetoptenlists=false&excludereusableitems=true`,
		'method': 'GET',
		'useAuth': useAuth,
	}).then((response) => {
		return dispatch(searchTopTenItemsSucceeded(response.results, widgetId));
	}).catch((error) => {
		dispatch(searchTopTenItemsFailed());

		return dispatch(getErrors({ 'search topTenItems': error.message }));
	});
};

// /////////////////////////
// change reusableItem is_public

export function setReusableItemIsPublicSucceeded({ id, is_public, sourceId }) {
	return {
		'type': SET_REUSABLEITEM_IS_PUBLIC_SUCCEEDED,
		'payload': {
			'id': id,
			is_public,
			sourceId,
		},
	};
}

export function setReusableItemIsPublicUIUpdated({ id }) {
	return {
		'type': SET_REUSABLEITEM_IS_PUBLIC_UI_UPDATED,
		'payload': {
			'id': id,
		},
	};
}

export const setReusableItemIsPublic = ({ id, is_public }) => (dispatch) => {
	return fetchAPI({
		'url': `/api/v1/content/reusableitem/${id}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ is_public }),
		'method': 'PATCH',
		'useAuth': true,
	}).then((response) => {
		// console.log('setReusableItemIsPublic response', response);
		// this may be a new reusableItem if the user made a popular reusableItem private
		// so pass on the original ID so the UI can check

		const newResponse = JSON.parse(JSON.stringify(response));
		newResponse.sourceId = id;
		// console.log('newResponse', newResponse);

		return dispatch(setReusableItemIsPublicSucceeded(newResponse));
	}).catch((error) => {
		return dispatch(getErrors({ 'set reusableItem is public': error.message }));
	});
};

// /////////////////////////////
// Modify reusableItem
export function updateReusableItemStarted() {
	return {
		'type': UPDATE_REUSABLEITEM_STARTED,
	};
}

function updateReusableItemFailed() {
	return {
		'type': UPDATE_REUSABLEITEM_FAILED,
	};
}

export const updateReusableItem = (id, data) => (dispatch, getState) => {
	// console.log('updateReusableItem', reusableItemId, data);
	dispatch(updateReusableItemStarted());

	return fetchAPI({
		'url': `/api/v1/content/reusableitem/${id}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify(data),
		'method': 'PATCH',
		'useAuth': true,
	}).then((response) => {
		// console.log('updateReusableItem response', response);

		const normalizedData = normalize([response], [reusableItemSchema]);

		dispatch(topTenListsReducer.fetchOrganizerData({ 'userId': getState().auth.user.id }));

		return dispatch(receiveEntities(normalizedData));
	}).catch((error) => {
		dispatch(updateReusableItemFailed());

		return dispatch(getErrors({ 'update reusableItem': error.message }));
	});
};

// ////////////////////////////////
// Reducer

const initialResuableItemsState = {
	'isLoading': false,
	'error': null,
	'count': null,
	'next': null,
	'previous': null,
	'search': {},
	'things': {},
};

// ///////////////////////////
// data for props

// ///////////////////////////
// Permissions
const canViewReusableItem = (auth, reusableItemObj) => {
	if (!reusableItemObj) {
		return false;
	}

	if (reusableItemObj.is_public) {
		return true;
	}

	if (!auth.isAuthenticated) {
		return false;
	}

	if (!auth.user) {
		return false;
	}

	if (reusableItemObj.created_by === auth.user.id) {
		return true;
	}

	return false;
};

const canEditReusableItem = (state, reusableItemObj, myTopTenListsArray) => {
	const { auth } = state;

	if (!reusableItemObj) {
		return false;
	}

	if (!auth.isAuthenticated) {
		return false;
	}

	if (!auth.user) {
		return false;
	}

	if (reusableItemObj.created_by === auth.user.id) {
		return true;
	}

	if (!reusableItemObj.is_public) {
		return false;
	}

	if (myTopTenListsArray.length > 0) {
		return true;
	}

	return false;
};

// list all Reusable Items
export const getReusableItems = state => state.reusableItem.things;

const getTopTenItems = state => state.topTenItem.things;

const getUserId = state => state.auth.user.id;

// all Reusable Items referenced by lists belonging to a particular user

const getReusableItemsFromTopTenLists = (topTenLists, topTenItems, reusableItems) => {
	const reusableItemsArray = [];

	Object.keys(topTenLists).forEach((topTenListId) => {
		const topTenListObj = topTenLists[topTenListId];

		topTenListObj.topTenItem.forEach((topTenItemId) => {
			const topTenItemObj = topTenItems[topTenItemId];

			if (topTenItemObj.reusableItem && topTenItemObj.reusableItem !== '') {
				const reusableItemObj = reusableItems[topTenItemObj.reusableItem];
				reusableItemsArray.push(reusableItemObj);
			}
		});
	});

	const reusableItemsSet = new Set(reusableItemsArray);

	return [...reusableItemsSet].sort((a, b) => a.name.localeCompare(b.name));
};

export const getAllMyReusableItems = createSelector(
	[topTenListsReducer.getMyTopTenLists, getTopTenItems, getReusableItems, getUserId],
	(myTopTenLists, myTopTenItems, allReusableItems, userId) => {
		if (!userId) {
			return [];
		}

		return getReusableItemsFromTopTenLists(myTopTenLists, myTopTenItems, allReusableItems);
	},
);

export const getTopLevelMyReusableItems = createSelector(
	[topTenListsReducer.getMyTopLevelTopTenLists, getTopTenItems, getReusableItems, getUserId],
	(myTopTenLists, myTopTenItems, allReusableItems, userId) => {
		if (!userId) {
			return [];
		}
		return getReusableItemsFromTopTenLists(myTopTenLists, myTopTenItems, allReusableItems);
	},
);

export const getMyReusableItems = (state, topLevelTopTenListsOnly) => (topLevelTopTenListsOnly ? getTopLevelMyReusableItems(state) : getAllMyReusableItems(state));

// data for suggesting reusableItems to select
// for each widgetId in search
// returns reusableItems as an array
export const getReusableItemsSearchSuggestions = (state) => {
	const searchResults = state.reusableItem.search;
	const results = {};

	Object.keys(searchResults).map((widgetId) => {
		if (!searchResults[widgetId].reusableItems) {
			return undefined;
		}

		const extendedReusableItems = searchResults[widgetId].reusableItems.map((ReusableItemObj) => {
			const extendedReusableItem = {
				...ReusableItemObj,
				'type': 'reusableItem',
			};
			return extendedReusableItem;
		});

		results[widgetId] = extendedReusableItems;
	});

	return results;
};

// data for suggesting reusableItems to create
// for each widgetId in search
// returns topTenItems with no reusableItem, as an array
export const getTopTenItemsSearchSuggestions = (state) => {
	const searchResults = state.reusableItem.search;
	const results = {};

	Object.keys(searchResults).map((widgetId) => {
		if (!searchResults[widgetId].topTenItems) {
			return undefined;
		}

		const extendedTopTenItems = searchResults[widgetId].topTenItems.map((topTenItem) => {
			if (!topTenItem.reusableItem) {
				return {
					'type': 'topTenItem',
					'id': topTenItem.id,
					'name': topTenItem.name,
					'value': topTenItem.name,
				};
			}
		});

		results[widgetId] = extendedTopTenItems;
	});

	return results;
};
// ///////////////////
export const getReusableItem = (state, reusableItemId, myTopTenListsArray) => {
	const reusableItemObj = state.reusableItem.things[reusableItemId];
	if (!reusableItemObj) {
		return;
	}
	return {
		...reusableItemObj,
		'canView': canViewReusableItem(state.auth, reusableItemObj),
		'canEdit': canEditReusableItem(state, reusableItemObj, myTopTenListsArray),
	};
};

// combined data for suggesting reusableItems
// memoize as possible
export const getSortedReusableItemSuggestions = createSelector(
	[getReusableItemsSearchSuggestions, getTopTenItemsSearchSuggestions],
	(reusableItems, topTenItems) => {
		const results = {};
		Object.keys(reusableItems).map((widgetId) => {
			const sortedItems = reusableItems[widgetId].slice();

			sortedItems.sort((a, b) => a.name.localeCompare(b.name));

			results[widgetId] = sortedItems || [];
		});

		Object.keys(topTenItems).map((widgetId) => {
			topTenItems[widgetId].sort((a, b) => a.name.localeCompare(b.name));

			results[widgetId] = results[widgetId] || [];
			results[widgetId] = results[widgetId].concat(topTenItems[widgetId]);
		});

		return results;
	},
);

export const getReusableItemList = (state) => {
	const sortedResults = getSortedReusableItemSuggestions(state);
	const { search } = state.reusableItem;
	const results = {};

	Object.keys(search).map((widgetId) => {
		const { searchTerm } = search[widgetId];

		if (searchTerm === '' || searchTerm === undefined) {
			results[widgetId] = [];
			return;
		}

		// all options must have a unique id for keyboard navigation in the dropdwon
		const option1 = {
			'type': 'text',
			'id': 'usetext',
			'name': searchTerm,
			'value': searchTerm,
		};

		// option to create a new reusableItem with this text
		const option2 = {
			'type': 'newReusableItem',
			'id': 'newreusableitem',
			'name': searchTerm,
			'value': searchTerm,
		};

		results[widgetId] = [option1, option2];

		// if there are no results, there will be no entry for the widgetId
		if (typeof sortedResults[widgetId] !== 'undefined') {
			results[widgetId] = results[widgetId].concat(sortedResults[widgetId]);
		}
	});

	return results;
};

// construct list of suggested item names
// reusableItems, sorted by name. Filter in combobox.
// own TopTenItems with no reusableItem, sorted by name
// identify type (reusableItem, topTenItem) for use when selected

// maybe set max number of items to show? Ah, but this is a problem when filtering.

// ///////////////////////////
// state updates

export default function reusableItem(state = initialResuableItemsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialResuableItemsState, {}); // constant provides placement instead of update, so all previous entries are removed
		}

		case RECEIVE_ENTITIES: {
			const { entities } = action.payload;

			let things = {};

			if (entities && entities.reusableItem) {
				things = entities.reusableItem;
			}

			return updeep({
				'things': things,
				'isLoading': false,
			}, state);
		}

		case FETCH_REUSABLEITEM_DETAIL_STARTED: {
			return updeep({ 'isLoading': true	}, state);
		}

		case FETCH_REUSABLEITEM_DETAIL_FAILED: {
			return updeep({ 'isLoading': false }, state);
		}

		case FETCH_TOPTENLIST_DETAIL_STARTED: {
			return updeep(state, state);
		}

		case SUGGEST_REUSABLE_ITEMS_STARTED: {
			// record searchTerm used by both reusableItem and topTenItem searches
			return updeep(
				updeep.updateIn(`search.${action.payload.widgetId}.searchTerm`, action.payload.searchTerm),
				state,
			);
		}

		case SEARCH_REUSABLEITEMS_STARTED: {
			return updeep(
				updeep.updateIn(`search.${action.payload.widgetId}.reusableItems`, []),
				state,
			);
		}

		case SEARCH_REUSABLEITEMS_SUCCEEDED: {
			return updeep.updateIn(`search.${action.payload.widgetId}.reusableItems`, action.payload.results, state);
		}

		case SEARCH_REUSABLEITEMS_FAILED: {
			return updeep(state, state);
		}

		case SEARCH_REUSABLEITEMS_CLEAR: {
			return updeep({ 'search': updeep.omit([action.payload.widgetId]) }, state);
			return updeep(
				updeep.updateIn(`search.${action.payload.widgetId}`, {
					'searchTerm': '',
					'reusableItems': [],
					'topTenItems': [],
				}),
				state,
			);
		}

		case SEARCH_TOPTENITEMS_STARTED: {
			return updeep(
				updeep.updateIn(`search.${action.payload.widgetId}.topTenItems`, []),
				state,
			);
		}

		case SEARCH_TOPTENITEMS_SUCCEEDED: {
			return updeep.updateIn(`search.${action.payload.widgetId}.topTenItems`, action.payload.results, state);
		}

		case SEARCH_TOPTENITEMS_FAILED: {
			return updeep(state, state);
		}

		case SET_REUSABLEITEM_IS_PUBLIC_SUCCEEDED: {
			const { id, is_public, sourceId } = action.payload;
			// console.log('response', action.payload);

			if (id !== sourceId) { // a new reusableItem, probably because the user made a new private reusableItem from a public one
				// sourceId is the original reusableItem that was copied, and is unchanged.
				// there is a new reusableItem that should be added to the store.
				const sourceReusableItem = state.things[sourceId];

				const newReusableItem = { ...sourceReusableItem };
				newReusableItem.id = id;
				newReusableItem.is_public = is_public;

				const newThings = {};

				// if the user is on the reusable item detail page, they will need to be redirected to the new reusable item
				// this is effectively a one-time signal to the UI which will respond after redirection with
				newThings[sourceId] = { ...{ 'copiedTo': id }, ...sourceReusableItem };
				newThings[id] = newReusableItem;
				// console.log('updated reusable item', newThings[sourceId]);

				return updeep({ 'things': newThings }, state);
			}

			// same reusableItem that the user was originally trying to edit
			// probably the user made a private reusableItem public
			return updeep({ 'things': { [id]: { 'is_public': is_public } } }, state);
		}

		// remove the property which causes the user to be redirected to a new reusableItem
		case SET_REUSABLEITEM_IS_PUBLIC_UI_UPDATED: {
			return updeep({ 'things': { [action.payload.id]: { 'copiedTo': undefined } } }, state);
		}

		default:
			return state;
	}
}
