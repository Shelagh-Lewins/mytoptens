import fetchAPI from '../modules/fetchAPI';
import { getErrors } from '../modules/errors';
var updeep = require('updeep');

export const SEARCH_HOME_STARTED = 'SEARCH_HOME_STARTED';
export const SEARCH_HOME_LISTSITEMS_SUCCEEDED = 'SEARCH_HOME_LISTSITEMS_SUCCEEDED';
export const SEARCH_HOME_REUSABLEITEMS_SUCCEEDED = 'SEARCH_HOME_REUSABLEITEMS_SUCCEEDED';
export const SEARCH_HOME_FAILED = 'SEARCH_HOME_FAILED';
export const SEARCH_HOME_CLEAR = 'SEARCH_HOME_CLEAR';

// /////////////////////////////////
// Home page search function
export function searchHomeStarted(searchTerm) {
	return {
		'type': SEARCH_HOME_STARTED,
		'payload': { searchTerm },
	};
}

function searchHomeListsItemsSucceeded(results) {
	// TODO notify if no results
	return {
		'type': SEARCH_HOME_LISTSITEMS_SUCCEEDED,
		'payload': { results },
	};
}

function searchHomeReusableItemsSucceeded(results) {
	// TODO notify if no results
	return {
		'type': SEARCH_HOME_REUSABLEITEMS_SUCCEEDED,
		'payload': { results },
	};
}

function searchHomeFailed() {
	return {
		'type': SEARCH_HOME_FAILED,
	};
}

// reset if there is no searchTerm
export function searchHomeClear() {
	return {
		'type': SEARCH_HOME_CLEAR,
	};
}

export function searchHomeListsItems(searchTerm) {
	return (dispatch, getState) => {
		// if the user is not logged in, don't use auth. The server should return the topTenList if a non-authenticated user should see it.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': `/api/v1/content/searchlistsitems/?search=${searchTerm}`,
			'method': 'GET',
			'useAuth': useAuth,
		}).then((response) => {
			return dispatch(searchHomeListsItemsSucceeded(response.results));
		}).catch((error) => {
			dispatch(searchHomeFailed());

			return dispatch(getErrors({ 'search topTenLists': error.message }));
		});
	};
}

export function searchHomeReusableItems(searchTerm) {
	return (dispatch, getState) => {
		// if the user is not logged in, don't use auth. The server should return the topTenList if a non-authenticated user should see it.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': `/api/v1/content/searchreusableitems/?search=${searchTerm}`,
			'method': 'GET',
			'useAuth': useAuth,
		}).then((response) => {
			return dispatch(searchHomeReusableItemsSucceeded(response.results));
		}).catch((error) => {
			dispatch(searchHomeFailed());

			return dispatch(getErrors({ 'search reusableItems': error.message }));
		});
	};
}

export function searchHome(searchTerm) {
	return (dispatch) => {
		// don't search on empty string
		if (!searchTerm || searchTerm === '') {
			return dispatch(searchHomeClear());
		}

		dispatch(searchHomeStarted(searchTerm));
		dispatch(searchHomeListsItems(searchTerm));
		dispatch(searchHomeReusableItems(searchTerm));
	};
}

// /////////////////////////////////
// reducer
const initialState = {
	'searchTerm': '',
	'searchComplete': false,
	'searchListsItemsComplete': false,
	'searchReusableItemsComplete': false,
	'searchResults': [],
};

export default function page(state = initialState, action) {
	switch (action.type) {
		case SEARCH_HOME_STARTED: {
			return updeep({
				'searchTerm': action.payload.searchTerm,
				'searchComplete': false,
				'searchListsItemsComplete': false,
				'searchReusableItemsComplete': false,
				'searchResults': updeep.constant([]),
			}, state);
		}

		case SEARCH_HOME_LISTSITEMS_SUCCEEDED: {
			function addResults() { // eslint-disable-line no-inner-declarations
				return [].concat(state.searchResults, action.payload.results);
			}

			return updeep({
				'searchListsItemsComplete': true,
				'searchComplete': state.searchReusableItemsComplete,
				'searchResults': addResults,
			}, state);
		}

		case SEARCH_HOME_REUSABLEITEMS_SUCCEEDED: {
			function addResults() { // eslint-disable-line no-inner-declarations
				return [].concat(state.searchResults, action.payload.results);
			}

			return updeep({
				'searchReusableItemsComplete': true,
				'searchComplete': state.searchListsItemsComplete,
				'searchResults': addResults,
			}, state);
		}

		case SEARCH_HOME_FAILED: {
			return updeep({
				'searchComplete': true,
			}, state);
		}

		case SEARCH_HOME_CLEAR: {
			return updeep({
				'searchTerm': updeep.constant(''),
				'searchComplete': false,
				'searchResults': updeep.constant([]),
			}, state);
		}

		default: {
			return state;
		}
	}
}
