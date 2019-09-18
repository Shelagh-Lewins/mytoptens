// authReducer.js

import store from '../store';
import fetchAPI from './fetchAPI';
import { getErrors, clearErrors } from './errors';
import isEmpty from './isEmpty';
import { fetchNotifications } from './notification';

const updeep = require('updeep');

// ////////////////////////////////
// Action creators

// define action types so they are visible
// and export them so other reducers can use them
export const SET_CURRENT_USER = 'SET_CURRENT_USER';
export const LOGOUT_USER_COMPLETE = 'LOGOUT_USER_COMPLETE';
export const FORGOT_PASSWORD_EMAIL_SENT = 'FORGOT_PASSWORD_EMAIL_SENT';
export const RESET_PASSWORD_COMPLETE = 'RESET_PASSWORD_COMPLETE';
export const PASSWORD_NOT_CHANGED = 'PASSWORD_NOT_CHANGED';
export const CHANGE_PASSWORD_COMPLETE = 'CHANGE_PASSWORD_COMPLETE';
export const SET_USER_INFO = 'SET_USER_INFO';
export const FORGOT_PASSWORD_EMAIL_NOT_SENT = 'FORGOT_PASSWORD_EMAIL_NOT_SENT';
export const CONFIRM_EMAIL_NOT_SENT = 'CONFIRM_EMAIL_NOT_SENT';
export const CONFIRM_EMAIL_SENT = 'CONFIRM_EMAIL_SENT';
export const CONFIRM_EMAIL_ALREADY_VERIFIED = 'CONFIRM_EMAIL_ALREADY_VERIFIED';

// Side effects Services
export const getAuthToken = () => {
	return localStorage.getItem('mytoptensJwtToken');
};

function setAuthToken(token) {
	localStorage.setItem('mytoptensJwtToken', token);
}

function removeAuthToken() {
	localStorage.removeItem('mytoptensJwtToken');
}

export const registerUser = (user, history) => (dispatch) => {
	dispatch(clearErrors());

	const formData = new FormData();

	// Push our data into our FormData object
	/* for (const name in user) {
		formData.append(name, user[name]);
	} */

	Object.keys(user).forEach((key) => {
		formData.append(key, user[key]);
	});

	/*
	for (var pair of formData.entries()) {
		console.log(pair[0]+ ', ' + pair[1]);
	} */

	return fetchAPI({
		'url': '/api/v1/rest-auth/registration/',
		'data': formData,
		'method': 'POST',
	}).then((response) => {
		history.push('/welcome');
		return response;
	}).catch((error) => {
		return dispatch(getErrors({ 'registration': error.message }));
	});
};

export const loginUser = (user, history) => (dispatch) => {
	dispatch(clearErrors());

	const formData = new FormData();

	// Push our data into our FormData object
	/* for(var name in user) {
		formData.append(name, user[name]);
	} */

	Object.keys(user).forEach((key) => {
		formData.append(key, user[key]);
	});

	return fetchAPI({
		'url': '/api/v1/rest-auth/login/',
		'data': formData,
		'method': 'POST',
		'useAuth': false,
	}).then((response) => {
		return dispatch(setCurrentUser(response.key));
	}).then(() => {
		history.push('/');
		// after store has been updated with token, we can query the server for current user info
		return store.dispatch(getUserInfo());
	}).catch((error) => {
		return dispatch(getErrors({ 'authentication': 'Unable to log in with the provided credentials, please try again.' }));
	});
};

export const setCurrentUser = (token, dispatch) => {
	setAuthToken(token);
	return {
		'type': SET_CURRENT_USER,
		'payload': { token },
	};
};

export const logoutUserComplete = (token) => {
	return {
		'type': LOGOUT_USER_COMPLETE,
	};
};

export const logoutUser = history => (dispatch) => {
	dispatch(clearErrors());
	return fetchAPI({
		'url': '/api/v1/rest-auth/logout/',
		'method': 'POST',
		'useAuth': false,
	}).then((response) => {
		removeAuthToken();
		return dispatch(logoutUserComplete());
	}).then(() => {
		// ensure token is removed from localStorage and store before redirecting
		// history.push('/');
	}).catch((error) => {
		return dispatch(getErrors({ 'logout user': 'Unable to logout' }));
	});
};

// /////////////////////////////
// get user info
// http://v1k45.com/blog/modern-django-part-4-adding-authentication-to-react-spa-using-drf/
export const setUserInfo = (user) => {
	return {
		'type': SET_USER_INFO,
		'payload': user,
	};
};

export const getUserInfo = () => (dispatch) => {
	return fetchAPI({
		'url': '/api/v1/rest-auth/user/',
		'method': 'GET',
		'useAuth': true,
	}).then((user) => {
		dispatch(fetchNotifications());
		return dispatch(setUserInfo({
			'username': user.username,
			'email': user.email,
			'id': user.id,
			'emailVerified': user.email_verified,
		}));
	}).catch((error) => {
		return dispatch(getErrors({ 'get user info': 'Unable to get user info' }));
	});
};

// /////////////////////////////
// reset password
export const forgotPasswordEmailNotSent = (token) => {
	return {
		'type': FORGOT_PASSWORD_EMAIL_NOT_SENT,
	};
};

export const forgotPasswordEmailSent = () => {
	return {
		'type': FORGOT_PASSWORD_EMAIL_SENT,
	};
};

export const forgotPassword = email => (dispatch) => {
	dispatch(clearErrors());
	dispatch(forgotPasswordEmailNotSent());

	const formData = new FormData();

	/* for(var name in email) {
		formData.append(name, email[name]);
	} */

	Object.keys(email).forEach((key) => {
		formData.append(key, email[key]);
	});

	return fetchAPI({
		'url': '/api/v1/rest-auth/password/reset/',
		'data': formData,
		'method': 'POST',
		'useAuth': false,
	}).then((response) => {
		return dispatch(forgotPasswordEmailSent());
	}).catch((error) => {
		return dispatch(getErrors({ 'sendPasswordResetEmail': error.message }));
	});
};

export const resetPasswordComplete = (token) => {
	return {
		'type': RESET_PASSWORD_COMPLETE,
		'token': token,
	};
};

// ////////////////////////////////
// change password
export const changePassword = data => (dispatch) => {
	dispatch(clearErrors());
	dispatch(passwordNotChanged());

	const formData = new FormData();

	// Push our data into our FormData object
	/* for(var name in data) {
		formData.append(name, data[name]);
	} */

	Object.keys(data).forEach((key) => {
		formData.append(key, data[key]);
	});

	return fetchAPI({
		'url': '/api/v1/rest-auth/password/change/',
		'data': formData,
		'method': 'POST',
		'useAuth': true,
	}).then((response) => {
		dispatch(changePasswordComplete());
		return response;
	}).catch((error) => {
		return dispatch(getErrors({ 'changePassword': error.message }));
	});
};

export const passwordNotChanged = (token) => {
	return {
		'type': PASSWORD_NOT_CHANGED,
	};
};

export const changePasswordComplete = (token) => {
	return {
		'type': CHANGE_PASSWORD_COMPLETE,
	};
};

// ////////////////////////////////
// Email confirmation
export const confirmEmailNotSent = (token) => {
	return {
		'type': CONFIRM_EMAIL_NOT_SENT,
	};
};

export const confirmEmailSent = (token) => {
	return {
		'type': CONFIRM_EMAIL_SENT,
	};
};

export const confirmEmailAlreadyVerified = (token) => {
	return {
		'type': CONFIRM_EMAIL_ALREADY_VERIFIED,
	};
};

// ////////////////////////////////

export const sendConfirmationEmail = () => (dispatch) => {
	dispatch(clearErrors());
	dispatch(confirmEmailNotSent());

	return fetchAPI({
		'url': '/api/v1/sendconfirmationemail/',
		'method': 'POST',
		'useAuth': true,
	}).then((response) => {
		if (response.message === 'Email confirmation sent') {
			return dispatch(confirmEmailSent());
		}

		if (response.message === 'Email already verified') {
			return dispatch(confirmEmailAlreadyVerified());
		}
	}).catch((error) => {
		console.log('sendConfirmationEmail error ', error);
		const message = 'Unable to send confirmation email. This probably means that there is no user registered with that email address.';
		return dispatch(getErrors({ 'sendConfirmationEmail': message }));
	});
};

// ////////////////////////////////
// Reducer
const initialState = {
	'isLoading': false,
	'isAuthenticated': false,
	'forgotPasswordEmailSent': false,
	'resetPasswordComplete': false,
	'changePasswordComplete': false,
	'confirmEmailSent': false,
	'user': {},
};

export default function (state = initialState, action) {
	switch (action.type) {
		case SET_CURRENT_USER:
			return updeep({
				'isAuthenticated': !isEmpty(action.payload.token),
				'isLoading': true,
				'user': updeep.constant({ 'token': action.payload.token }), // remove user info
			}, state);

		case SET_USER_INFO: // update user info
			return updeep({
				'isLoading': false,
				'user': {
					'username': action.payload.username,
					'email': action.payload.email,
					'id': action.payload.id,
					'emailVerified': action.payload.emailVerified,
				},
			}, state);

		case LOGOUT_USER_COMPLETE: {
			return updeep({
				'isAuthenticated': false,
				'user': updeep.constant({}), // remove user profile
			}, state);
		}

		// ///////////////////////
		// forgot password
		case FORGOT_PASSWORD_EMAIL_NOT_SENT: {
			return updeep({
				'forgotPasswordEmailSent': false,
				'resetPasswordComplete': false,
			}, state);
		}

		case FORGOT_PASSWORD_EMAIL_SENT: {
			return updeep({
				'forgotPasswordEmailSent': true,
				'resetPasswordComplete': false,
			}, state);
		}

		case RESET_PASSWORD_COMPLETE: {
			return updeep({
				'forgotPasswordEmailSent': false,
				'resetPasswordComplete': true,
			}, state);
		}

		case PASSWORD_NOT_CHANGED: {
			return updeep({
				'changePasswordComplete': false,
				'errors': {},
			}, state);
		}

		case CHANGE_PASSWORD_COMPLETE: {
			return updeep({
				'changePasswordComplete': true,
			}, state);
		}

		// ///////////////////////
		// confirm email
		case CONFIRM_EMAIL_NOT_SENT: {
			return updeep({
				'confirmEmailSent': false,
				'confirmEmailAlreadyVerified': false,
			}, state);
		}

		case CONFIRM_EMAIL_SENT: {
			return updeep({
				'confirmEmailSent': true,
			}, state);
		}

		case CONFIRM_EMAIL_ALREADY_VERIFIED: {
			return updeep({
				'confirmEmailAlreadyVerified': true,
			}, state);
		}

		default:
			return state;
	}
}
