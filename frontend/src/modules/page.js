import fetchAPI from '../modules/fetchAPI';
import { getErrors } from '../modules/errors';

export const SEARCH_HOME_STARTED = 'SEARCH_HOME_STARTED';
export const SEARCH_HOME_SUCCEEDED = 'SEARCH_HOME_SUCCEEDED';
export const SEARCH_HOME_FAILED = 'SEARCH_HOME_FAILED';
export const SEARCH_HOME_CLEAR = 'SEARCH_HOME_CLEAR';

///////////////////////////////////
// Home page search function
export function searchHomeStarted(searchTerm) {
	return {
		'type': SEARCH_HOME_STARTED,
		'payload': { searchTerm },
	};
}

function searchHomeSucceeded(results) {
	// TODO notify if no results
	return {
		'type': SEARCH_HOME_SUCCEEDED,
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

export function searchHome(searchTerm) {
	return (dispatch, getState) => {
		// don't search on empty string
		if(!searchTerm || searchTerm === '') {
			return dispatch(searchHomeClear());
		}

		dispatch(searchHomeStarted(searchTerm));

		// if the user is not logged in, don't use auth. The server should return the topTenList if a non-authenticated user should see it.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': `/api/v1/content/searchlistsitems/?search=${searchTerm}`,
			'method': 'GET',
			'useAuth': useAuth,
		}).then(response => {
			return dispatch(searchHomeSucceeded(response.results));
		}).catch(error => {
			dispatch(searchHomeFailed());

			return dispatch(getErrors({ 'fetch topTenLists': error.message }));
		});
	};
}

///////////////////////////////////
// reducer
var updeep = require('updeep');

const initialState = {
	'searchTerm': '',
	'searchComplete': false,
	'searchResults': [],
};

export default function page(state = initialState, action) {
	switch (action.type) {
		case SEARCH_HOME_STARTED	: {
			return updeep({
				'searchTerm': action.payload.searchTerm,
				'searchComplete': false,
				'searchResults': updeep.constant([]),
			}, state);
		}

		case SEARCH_HOME_SUCCEEDED	: {
			return updeep({
				'searchComplete': true,
				'searchResults': updeep.constant(action.payload.results),
			}, state);
		}

		case SEARCH_HOME_FAILED	: {
			return updeep({
				'searchComplete': true,
			}, state);
		}

		case SEARCH_HOME_CLEAR	: {
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
