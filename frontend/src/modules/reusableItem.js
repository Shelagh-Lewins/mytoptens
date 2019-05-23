import { createSelector } from 'reselect';
import fetchAPI from '../modules/fetchAPI';
import { getErrors } from '../modules/errors';
import store from '../store';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

// TODO clear store on logout

import {
	RECEIVE_ENTITIES,
	FETCH_TOPTENLIST_DETAIL_STARTED,
} from './topTenList';

//////////////////////////////////
// Action creators

// define action types so they are visible
// and export them so other reducers can use them
export const CREATE_REUSABLEITEM_REQUESTED = 'CREATE_REUSABLEITEM_REQUESTED';
export const RECEIVE_REUSABLEITEMS = 'RECEIVE_REUSABLEITEMS';

export const SEARCH_REUSABLEITEMS_STARTED = 'SEARCH_REUSABLEITEMS_STARTED';
export const SEARCH_REUSABLEITEMS_SUCCEEDED = 'SEARCH_REUSABLEITEMS_SUCCEEDED';
export const SEARCH_REUSABLEITEMS_FAILED = 'SEARCH_REUSABLEITEMS_FAILED';
export const SEARCH_REUSABLEITEMS_CLEAR = 'SEARCH_REUSABLEITEMS_CLEAR';

export const SEARCH_TOPTENITEMS_STARTED = 'SEARCH_TOPTENITEMS_STARTED';
export const SEARCH_TOPTENITEMS_SUCCEEDED = 'SEARCH_TOPTENITEMS_SUCCEEDED';
export const SEARCH_TOPTENITEMS_FAILED = 'SEARCH_TOPTENITEMS_FAILED';

//////////////////////////////////
// Suggest names for topTenItems based on reusableItems and topTenItems that have no reusable item
export function suggestReusableItems(searchTerm) {
	return (dispatch) => {
		// TODO also search topTenItems
		console.log('searchTerm 1 ', searchTerm);
		dispatch(searchReusableItems(searchTerm));
		dispatch(searchTopTenItems(searchTerm));
	};
}

//////////////////////////////////
// Search for reusableItems
export function searchReusableItemsStarted(searchTerm) {
	return {
		'type': SEARCH_REUSABLEITEMS_STARTED,
		'payload': { searchTerm },
	};
}

function searchReusableItemsSucceeded(results) {
	// TODO notify if no results
	return {
		'type': SEARCH_REUSABLEITEMS_SUCCEEDED,
		'payload': { results },
	};
}

function searchReusableItemsFailed() {
	return {
		'type': SEARCH_REUSABLEITEMS_FAILED,
	};
}

// reset if there is no searchTerm
export function searchReusableItemsClear() {
	return {
		'type': SEARCH_REUSABLEITEMS_CLEAR,
	};
}

export function searchReusableItems(searchTerm) {
	return (dispatch, getState) => {
		// don't search on empty string
		if(!searchTerm || searchTerm === '') {
			return dispatch(searchReusableItemsClear());
		}

		dispatch(searchReusableItemsStarted(searchTerm));

		// all reusableItems are public, so do not use auth

		return fetchAPI({
			'url': `/api/v1/content/searchreusableitems/?search=${searchTerm}`,
			'method': 'GET',
		}).then(response => {
			return dispatch(searchReusableItemsSucceeded(response.results));
		}).catch(error => {
			dispatch(searchReusableItems());

			return dispatch(getErrors({ 'fetch reusableItems': error.message }));
		});
	};
}

//////////////////////////////////
// Search for Top Ten Items by name, but only those which have no reusableItem
export function searchTopTenItemsStarted(searchTerm) {
	return {
		'type': SEARCH_TOPTENITEMS_STARTED,
		'payload': { searchTerm },
	};
}

function searchTopTenItemsSucceeded(results) {
	// TODO notify if no results
	return {
		'type': SEARCH_TOPTENITEMS_SUCCEEDED,
		'payload': { results },
	};
}

function searchTopTenItemsFailed() {
	return {
		'type': SEARCH_TOPTENITEMS_FAILED,
	};
}

export function searchTopTenItems(searchTerm) {
	return (dispatch, getState) => {
		// clear is handled by reusableItem reducer
		// don't search on empty string
		/*if(!searchTerm || searchTerm === '') {
			return dispatch(searchReusableItemsClear());
		} */

		dispatch(searchTopTenItemsStarted(searchTerm));

		// if the user is not logged in, don't use auth. The server should return the topTenItem if a non-authenticated user should see it.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': `/api/v1/content/searchlistsitems/?search=${searchTerm}&includetoptenlists=false&excludereusableitems=true`,
			'method': 'GET',
			'useAuth': useAuth,
		}).then(response => {
			// console.log('search api says ', response.results);
			return dispatch(searchTopTenItemsSucceeded(response.results));
		}).catch(error => {
			dispatch(searchTopTenItemsFailed());

			return dispatch(getErrors({ 'search topTenItems': error.message }));
		});
	};
}


//////////////////////////////////
// Reducer
var updeep = require('updeep');

const fakeResuableItems = [
	{
		'id': '1001',
		'created_by': '1234', // UUID
		'created_at': new Date(),
		'name': 'Jane austen', // name, definition, link need to be easily accessible and searchable. This is the third version.
		'definition': 'English novelist (16 December 1775 – 18 July 1817)',
		'link': 'https://en.wikipedia.org/wiki/Jane_Austen',
		'modified_at': new Date(),
		'users_when_modified': 403, // number of different users referencing this resuableItem in their own lists at the time when the last update was accepted. This is for tracking the approval process.
		'votes_yes': [], // votes cast for the most recent modification
		'votes_no': [],
		'proposed_modification': [ // may need to allow multiple proposed edits
		// prevent same user voting more than once
		// allow them to change their vote
		// only allow votes by people using the item? And remove the vote if they stop using the item. Time delay?
		// check for approval a few seconds after vote cast?
		// user sees a notification that there is a suggested edit on an item they are referencing
			{ // proposed change not yet approved
				'name': 'Jane Austen',
				'definition': 'English novelist (16 December 1775 – 18 July 1817)',
				'link': 'https://en.wikipedia.org/wiki/Jane_Austen',
				'proposed_by': '1234',
				'proposed_at': new Date(),
				'votes_yes': [], // list of usernames
				'votes_no': [], // list of usernames
			},
		],
		'proposed_by': '1234',
		'history': [ // not sure this will be used but safer to keep it from the start
		// when a new version is accepted, add current version to history
		// remove version from suggested_edits
		// update current values
			{ // first version
				'name': 'Jane austin',
				'definition': 'Writer',
				'link': '',
				'proposed_by': '1234',
				'modified_at': new Date(),
				'users_when_modified': 403,
				'votes_yes': [],
				'votes_no': [],
			},
			{ // second version
				'name': 'Jane austen',
				'definition': 'Novelist',
				'link': 'https://en.wikipedia.org/wiki/Jane_Austen',
				'proposed_by': '1234',
				'modified_at': new Date(),
				'users_when_modified': 403,
				'votes_yes': [],
				'votes_no': [],
			}
		]
	}
];

const initialResuableItemsState = {
	'isLoading': false,
	'error': null,
	'count': null,
	'next': null,
	'previous': null,
	'searchTerm': '',
	'searchComplete': false,
	'searchResults': {
		'reusableItems': [], // todo search for reusableItems
		'topTenItems': [], // todo search for topTenItems
	},
};

/////////////////////////////
// data for props

// data for suggesting reusableItems to select
// returns reusableItems as an array not an object
export const getReusableItems = state => {
	// console.log('state', state.reusableItem.searchResults);
	return state.reusableItem.searchResults.reusableItems.map(reusableItem => {
		// const reusableItem = state.reusableItem.searchResults.reusableItems[id];

		return {
			'type': 'reusableItem',
			'id': reusableItem.id,
			'name': reusableItem.name,
		};
	});
};

// data for suggesting reusableItems to create
// returns topTenItems with no reusableItem as an array
export const getTopTenItems = state => {
	return state.reusableItem.searchResults.topTenItems.map(topTenItem => {
		//const topTenItem = state.reusableItem.searchResults.topTenitems[id];
		if (!topTenItem.reusableItem) {
			return {
				'type': 'topTenItem',
				'id': topTenItem.id,
				'name': topTenItem.name,
				'value': topTenItem.name,
			};
		}
	});
};

// combined data for suggesting reusableItems
// memoize as possible
export const getSortedReusableItemSuggestions = createSelector(
	[getReusableItems, getTopTenItems],
	(reusableItems, topTenItems) => {
		reusableItems.sort(function (a, b) {
			return a.name.localeCompare(b.name);
		});

		topTenItems.sort(function (a, b) {
			return a.name.localeCompare(b.name);
		});

		return reusableItems.concat(topTenItems);
	}
);

export const getReusableItemList = state => {
	// console.log('here', state.reusableItem.searchTerm);
	const optionText = state.reusableItem.searchTerm;
	const option = {
		'type': 'text',
		'id': '',
		'name': optionText,
		'value': optionText,
	};
	return [option].concat(getSortedReusableItemSuggestions(state));
};


// construct list of suggested item names
// reusableItems, sorted by name. Filter in combobox.
// own TopTenItems with no reusableItem, sorted by name
// identify type (reusableItem, topTenItem) for use when selected

// maybe set max number of items to show? Ah, but this is a problem when filtering.

/////////////////////////////
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
				'isLoading': false }, state);
		}

		case FETCH_TOPTENLIST_DETAIL_STARTED: {
			return updeep(state, state);
		}
		
		case SEARCH_REUSABLEITEMS_STARTED	: {
			return updeep({
				'searchTerm': action.payload.searchTerm,
				'searchComplete': false,
				'searchResults': { 'reusableItems': updeep.constant([]) },
			}, state);
		}

		case SEARCH_REUSABLEITEMS_SUCCEEDED	: {
			// console.log('search reusable items succeeded', action.payload);
			return updeep({
				'searchComplete': true,
				'searchResults': { 'reusableItems': updeep.constant(action.payload.results) },
			}, state);
		}

		case SEARCH_REUSABLEITEMS_FAILED	: {
			return updeep({
				'searchComplete': true,
			}, state);
		}

		case SEARCH_REUSABLEITEMS_CLEAR	: {
			return updeep({
				'searchTerm': updeep.constant(''),
				'searchComplete': false,
				'searchResults': { 
					'reusableItems': updeep.constant([]),
					'topTenItems': updeep.constant([]),
				},
			}, state);
		}

		case SEARCH_TOPTENITEMS_STARTED	: {
			return updeep({
				'searchTerm': action.payload.searchTerm,
				'searchComplete': false,
				'searchResults': { 'topTenItems': updeep.constant([]) },
			}, state);
		}

		case SEARCH_TOPTENITEMS_SUCCEEDED	: {
			// console.log('search toptenitems succeeded', action.payload);
			return updeep({
				'searchComplete': true,
				'searchResults': { 'topTenItems': updeep.constant(action.payload.results) },
			}, state);
		}

		case SEARCH_TOPTENITEMS_FAILED	: {
			return updeep({
				'searchComplete': true,
			}, state);
		}

		default:
			return state;
	}
}
