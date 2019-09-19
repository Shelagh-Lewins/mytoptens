import { createSelector } from 'reselect';
import fetchAPI from './fetchAPI';
import { getErrors } from './errors';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

const updeep = require('updeep');

/* eslint-disable array-callback-return */

export const RECEIVE_NOTIFICATIONS = 'RECEIVE_NOTIFICATIONS';
export const FETCH_NOTIFICATIONS_STARTED = 'FETCH_NOTIFICATIONS_STARTED';
export const FETCH_NOTIFICATIONS_FAILED = 'FETCH_NOTIFICATIONS_FAILED';

export const SET_NOTIFICATION_UNREAD_SUCCEEDED = 'SET_NOTIFICATION_UNREAD_SUCCEEDED';

export const DELETE_NOTIFICATION_SUCCEEDED = 'DELETE_NOTIFICATION_SUCCEEDED';

// ////////////////////
function receiveNotifications(notifications) {
	return {
		'type': RECEIVE_NOTIFICATIONS,
		'payload': notifications,
	};
}

export function fetchNotificationsStarted() {
	return {
		'type': FETCH_NOTIFICATIONS_STARTED,
	};
}

function fetchNotificationsFailed() {
	return {
		'type': FETCH_NOTIFICATIONS_FAILED,
	};
}

export function fetchNotifications() {
	return (dispatch, getState) => {
		dispatch(fetchNotificationsStarted());
		// if the user is not logged in, don't use auth. The server should return only the topTenLists a non-authenticated user should see.
		let useAuth = false;

		if (getState().auth.user.token) {
			useAuth = true;
		}

		const url = `/api/v1/content/notification/`;

		return fetchAPI({
			'url': url,
			'method': 'GET',
			'useAuth': useAuth,
		}).then((response) => {
			return dispatch(receiveNotifications(response));
		}).catch((error) => {
			dispatch(fetchNotificationsFailed());

			return dispatch(getErrors({ 'fetch topTenLists': error.message }));
		});
	};
}

// ////////////////////////////////
// Reducer
const initialNotificationsState = {
	'isLoading': false,
	'error': null,
	'things': [],
};

// ///////////////////////////
// state updates
const getNotifications = state => state.notification.things;

export const getSortedNotifications = createSelector(
	[getNotifications],
	notifications => notifications.slice().sort((a, b) => a.created_at < b.created_at),
);

export default function notification(state = initialNotificationsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialNotificationsState, {}); // constant provides placement instead of update, so all previous entries are removed
		}

		case RECEIVE_NOTIFICATIONS: {
			const notifications = action.payload;

			let things = {};

			if (notifications) {
				things = notifications;
			}

			return updeep({
				'things': updeep.constant(things),
				'isLoading': false,
			}, state);
		}

		default:
			return state;
	}
}

// TODO
// delete notification
// set unread to false
