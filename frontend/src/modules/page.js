import fetchAPI from '../modules/fetchAPI';
import { getErrors } from '../modules/errors';

export const SEARCH_HOME_STARTED = 'SEARCH_HOME_STARTED';
export const SEARCH_HOME_FAILED = 'SEARCH_HOME_FAILED';

/* export function searchHome(searchTerm) {
	return { 
		'type': SEARCH_HOME,
		'payload': { searchTerm },
	};
} */

///////////////////////////////////
// Home page search function
export function searchHomeStarted(searchTerm) {
	console.log('started search for ', searchTerm);
	return {
		'type': SEARCH_HOME_STARTED,
		'payload': { searchTerm },
	};
}

function searchHomeSucceeded() {
	// TODO notify if no results
	return {
		'type': SEARCH_HOME_FAILED,
	};
}

function searchHomeFailed() {
	return {
		'type': SEARCH_HOME_FAILED,
	};
}

export function searchHome(searchTerm) {
	return (dispatch, getState) => {
		dispatch(searchHomeStarted(searchTerm));

		// if the user is not logged in, don't use auth. The server should return the list if a non-authenticated user should see it.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		return fetchAPI({
			'url': `/api/v1/content/searchhome/?searchterm=${searchTerm}`,
			'method': 'GET',
			'useAuth': useAuth,
		}).then(response => {
			//const normalizedData = normalize(response, [listSchema]);
			console.log('Response ', response);

			return dispatch(searchHomeSucceeded(response));
		}).catch(error => {
			dispatch(searchHomeFailed());

			return dispatch(getErrors({ 'fetch lists': error.message }));
		});
	};
}

///////////////////////////////////
// reducer
var updeep = require('updeep');

const initialState = {
	'searchTerm': '',
};

export default function page(state = initialState, action) {
	switch (action.type) {
		case SEARCH_HOME_STARTED	: {
			return updeep({ 'searchTerm': action.payload.searchTerm }, state);
		}

		default: {
			return state;
		}
	}
}
