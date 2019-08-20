import { createSelector } from 'reselect';
import { normalize, schema } from 'normalizr';
import fetchAPI from './fetchAPI';
import { getErrors } from './errors';
// import { getErrors } from './errors';

import * as topTenListsReducer from './topTenList';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

import {
	RECEIVE_ENTITIES,
	FETCH_TOPTENLIST_DETAIL_STARTED,
} from './topTenList';

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
export const CREATE_REUSABLEITEM_REQUESTED = 'CREATE_REUSABLEITEM_REQUESTED';
export const RECEIVE_REUSABLEITEMS = 'RECEIVE_REUSABLEITEMS';

export const SUGGEST_REUSABLE_ITEMS_STARTED = 'SUGGEST_REUSABLE_ITEMS_STARTED';
export const SEARCH_REUSABLEITEMS_STARTED = 'SEARCH_REUSABLEITEMS_STARTED';
export const SEARCH_REUSABLEITEMS_SUCCEEDED = 'SEARCH_REUSABLEITEMS_SUCCEEDED';
export const SEARCH_REUSABLEITEMS_FAILED = 'SEARCH_REUSABLEITEMS_FAILED';
export const SEARCH_REUSABLEITEMS_CLEAR = 'SEARCH_REUSABLEITEMS_CLEAR';

export const SEARCH_TOPTENITEMS_STARTED = 'SEARCH_TOPTENITEMS_STARTED';
export const SEARCH_TOPTENITEMS_SUCCEEDED = 'SEARCH_TOPTENITEMS_SUCCEEDED';
export const SEARCH_TOPTENITEMS_FAILED = 'SEARCH_TOPTENITEMS_FAILED';

export const SET_REUSABLEITEM_IS_PUBLIC_SUCCEEDED = 'SET_REUSABLEITEM_IS_PUBLIC_SUCCEEDED';

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

function searchReusableItemsFailed(widgetId) {
	return {
		'type': SEARCH_REUSABLEITEMS_FAILED,
		'payload': { widgetId },
	};
}

// reset if there is no searchTerm
export function searchReusableItemsClear(widgetId) {
	return {
		'type': SEARCH_REUSABLEITEMS_CLEAR,
		'payload': { widgetId },
	};
}

export function searchReusableItems(searchTerm, widgetId) {
	return (dispatch, getState) => {
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
}

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

export function fetchReusableItemDetail(id) {
	return (dispatch, getState) => {
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

			let userId;

			if (getState().auth.isAuthenticated) {
				userId = getState().auth.user.id;
			}

			dispatch(topTenListsReducer.fetchOrganizerData(userId));

			return dispatch(receiveEntities(normalizedData));
		}).catch((error) => {
			dispatch(fetchReusableItemDetailFailed());

			return dispatch(getErrors({ 'fetch reusableItemDetail': error.message }));
		});
	};
}

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

export function searchTopTenItems(searchTerm, widgetId) {
	return (dispatch, getState) => {
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
}

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

export const updateReusableItem = (id, data) => (dispatch) => {
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

		return dispatch(receiveEntities(normalizedData));
	}).catch((error) => {
		dispatch(updateReusableItemFailed());

		return dispatch(getErrors({ 'update reusableItem': error.message }));
	});
};

// ////////////////////////////////
// Reducer

// this is no longer used but shows the data structure
/* const fakeResuableItems = [
	{
		'id': '1001',
		'created_by': '1234', // UUID
		'created_at': new Date(),
		'name': 'Jane austen', // name, definition, link need to be easily accessible and searchable. This is the third version.
		'definition': 'English novelist (16 December 1775 – 18 July 1817)',
		'link': 'https://en.wikipedia.org/wiki/Jane_Austen',
		'modified_at': new Date(),
		'users_when_modified': 403, // number of different users referencing this resuableItem in their own lists at the time when the last update was accepted. This is for tracking the approval process.
		'change_request_votes_yes': [], // votes cast for the most recent change request
		'change_request_votes_no': [],
		'change_request': [ // may need to allow multiple proposed edits
		// prevent same user voting more than once
		// allow them to change their vote
		// only allow votes by people using the item? And remove the vote if they stop using the item. Time delay?
		// check for approval a few seconds after vote cast?
		// user sees a notification that there is a suggested edit on an item they are referencing
			{ // proposed change not yet approved
				'name': 'Jane Austen',
				'definition': 'English novelist (16 December 1775 – 18 July 1817)',
				'link': 'https://en.wikipedia.org/wiki/Jane_Austen',
				'change_request_by': '1234',
				'change_request_at': new Date(),
				'change_request_votes_yes': [], // list of usernames
				'change_request_votes_no': [], // list of usernames
			},
		],
		'change_request_by': '1234',
		'history': [ // not sure this will be used but safer to keep it from the start
		// when a new version is accepted, add current version to history
		// remove version from suggested_edits
		// update current values
			{ // first version
				'name': 'Jane austin',
				'definition': 'Writer',
				'link': '',
				'change_request_by': '1234',
				'modified_at': new Date(),
				'users_when_modified': 403,
				'change_request_votes_yes': [],
				'change_request_votes_no': [],
			},
			{ // second version
				'name': 'Jane austen',
				'definition': 'Novelist',
				'link': 'https://en.wikipedia.org/wiki/Jane_Austen',
				'change_request_by': '1234',
				'modified_at': new Date(),
				'users_when_modified': 403,
				'change_request_votes_yes': [],
				'change_request_votes_no': [],
			}
		]
	}
]; */

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

// data for suggesting reusableItems to select
// for each widgetId in search
// returns reusableItems as an array
export const getReusableItems = (state) => {
	const searchResults = state.reusableItem.search;
	const results = {};
	// console.log('running getReusableItems');

	Object.keys(searchResults).map((widgetId) => {
		// console.log('map');
		if (!searchResults[widgetId].reusableItems) {
			// console.log('return undefined');
			return undefined;
		}

		const extendedReusableItems = searchResults[widgetId].reusableItems.map((thisReusableItem) => {
			const extendedReusableItem = JSON.parse(JSON.stringify(thisReusableItem));
			extendedReusableItem.type = 'reusableItem';
			return extendedReusableItem;
		});

		results[widgetId] = extendedReusableItems;
	});

	return results;
};

// data for suggesting reusableItems to create
// for each widgetId in search
// returns topTenItems with no reusableItem, as an array
export const getTopTenItems = (state) => {
	const searchResults = state.reusableItem.search;
	const results = {};
	// console.log('running getTopTenItems');
	Object.keys(searchResults).map((widgetId) => {
		// console.log('map');
		if (!searchResults[widgetId].topTenItems) {
			// console.log('return undefined');
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

// combined data for suggesting reusableItems
// memoize as possible
export const getSortedReusableItemSuggestions = createSelector(
	[getReusableItems, getTopTenItems],
	(reusableItems, topTenItems) => {
		// console.log('running getSortedReusableItemSuggestions');
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
	// console.log('running getReusableItemList');
	// console.log('widgetIds', widgetIds);
	const sortedResults = getSortedReusableItemSuggestions(state);
	const { search } = state.reusableItem;
	const results = {};

	Object.keys(search).map((widgetId) => {
		// console.log('widgetId', widgetId);
		const { searchTerm } = search[widgetId];

		if (searchTerm === '' || searchTerm === undefined) {
			results[widgetId] = [];
			return;
		}

		const option1 = {
			'type': 'text',
			'id': '',
			'name': searchTerm,
			'value': searchTerm,
		};

		// option to create a new reusableItem with this text
		const option2 = {
			'type': 'newReusableItem',
			'id': '',
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

// Functions to provide data to component
// topTenItems belonging to the user
const getMyTopTenItems = state => state.topTenItem.organizerData;

const getReusableItemId = (state, props) => props.match.params.id;

// return array of ids of topTenItems that reference the reusableItem being viewed in ReusableItemDetails
export const getMyTopTenItemsForReusableItem = createSelector(
	[getMyTopTenItems, getReusableItemId],
	(myTopTenItems, reusableItemId) => {
		const results = [];

		Object.keys(myTopTenItems).map((id) => {
			const topTenItem = myTopTenItems[id];

			if (topTenItem.reusableItem_id === reusableItemId) {
				results.push(topTenItem.id);
			}
		});
		return results;
	},
);


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
				'things': updeep.constant(things),
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
				// sourceId is the original reusableItem that was copied. This reusableItem needs to be modified so the UI will detect a change in properties
				return updeep({ 'things': { [id]: { 'is_public': is_public }, [sourceId]: { 'targetId': id } } }, state);
			}

			// same reusableItem that the user was originally trying to edit
			// probably the user made a private reusableItem public
			return updeep({ 'things': { [id]: { 'is_public': is_public } } }, state);
		}

		default:
			return state;
	}
}
