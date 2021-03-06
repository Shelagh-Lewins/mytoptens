import { createSelector } from 'reselect';
import { normalize, schema } from 'normalizr';
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
export const UPDATE_NOTIFICATION_SUCCEEDED = 'UPDATE_NOTIFICATION_SUCCEEDED';
export const DELETE_NOTIFICATION_SUCCEEDED = 'DELETE_NOTIFICATION_SUCCEEDED';
export const DELETE_MY_NOTIFICATIONS_SUCCEEDED = 'DELETE_MY_NOTIFICATIONS_SUCCEEDED';

// https://medium.com/overlander/normalizing-data-into-relational-redux-state-with-normalizr-47e7020dd3c1
// define all schemas so they can be referenced
const topTenItemSchema = new schema.Entity('topTenItem');
const reusableItemSchema = new schema.Entity('reusableItem');
const notificationSchema = new schema.Entity('notification');

// each data relationship must be defined in both directions
// a topTenItem may have many notifications
topTenItemSchema.define({
	'notification': [notificationSchema],
});

// a reusableItem may have many notifications
reusableItemSchema.define({
	'notification': [notificationSchema],
});

// a notification may have one reusableItem and one topTenItem
notificationSchema.define({
	'reusableItem': reusableItemSchema,
	'topTenItem': topTenItemSchema,
});

// ////////////////////
function receiveNotifications(entities) {
	return {
		'type': RECEIVE_NOTIFICATIONS,
		'payload': entities,
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
		// notifications can only be fetched if the user is logged in

		if (!getState().auth.user.token) {
			return;
		}

		const url = `/api/v1/content/notification/`;

		return fetchAPI({
			'url': url,
			'method': 'GET',
			'useAuth': true,
		}).then((response) => {
			const data = {
				'entities': normalize(response, [notificationSchema]).entities,
			};

			return dispatch(receiveNotifications(data));
		}).catch((error) => {
			dispatch(fetchNotificationsFailed());

			return dispatch(getErrors({ 'fetch notifications': error.message }));
		});
	};
}

// ////////////////////////////////
// update Notifications
// only 'new' and 'unread' are editable via the api
export function updateNotificationSucceeded(response) {
	return {
		'type': UPDATE_NOTIFICATION_SUCCEEDED,
		'payload': response,
	};
}

export const updateNotification = (notificationId, propertyName, value) => (dispatch, getState) => {
	// should be able to update any simple editable property e.g. new, unread

	if (!getState().auth.user.token) {
		return;
	}

	return fetchAPI({
		'url': `/api/v1/content/notification/${notificationId}/`,
		'headers': { 'Content-Type': 'application/json' },
		'data': JSON.stringify({ [propertyName]: value }),
		'method': 'PATCH',
		'useAuth': true,
	}).then((response) => {
		return dispatch(updateNotificationSucceeded(response));
	}).catch((error) => {
		return dispatch(getErrors({ 'update notification': error.message }));
	});
};

// bulk set an array of notifications to the same value of 'New'
export const setNew = (idArray, value) => (dispatch) =>  {
	idArray.forEach((obj) => {
		dispatch(updateNotification(obj.id, 'new', value));
	});
};

// /////////////////////////
// delete notification
export function deleteNotificationSucceeded(id) {
	return {
		'type': DELETE_NOTIFICATION_SUCCEEDED,
		'payload': {
			id,
		},
	};
}

export const deleteNotification = id => (dispatch, getState) => {
	if (!getState().auth.user.token) {
		return;
	}

	return fetchAPI({
		'url': `/api/v1/content/notification/${id}/`,
		'method': 'DELETE',
		'useAuth': true,
	}).then((response) => {
		// dispatch(fetchNotifications());
		return dispatch(deleteNotificationSucceeded(id));
	}).catch((error) => {
		return dispatch(getErrors({ 'delete notification': error.message }));
	});
};

// /////////////////////////
// delete all notifications belonging to the user
export function deleteMyNotificationSucceededs(response) {
	return {
		'type': DELETE_MY_NOTIFICATIONS_SUCCEEDED,
		'payload': {
			'notificationIds': response,
		},
	};
}

export const deleteMyNotifications = () => (dispatch, getState) => {
	if (!getState().auth.user.token) {
		return;
	}

	return fetchAPI({
		'url': `/api/v1/content/notification/deleteall/`,
		'method': 'DELETE',
		'useAuth': true,
	}).then((response) => {
		return dispatch(deleteMyNotificationSucceededs(response));
	}).catch((error) => {
		return dispatch(getErrors({ 'delete my notifications': error.message }));
	});
};

// ////////////////////////////////
// Reducer
const initialNotificationsState = {
	'error': null,
	'things': {},
};

// ///////////////////////////
// get reduce info for components
const getNotifications = state => state.notification.things;

// returns notifications in an array, sorted by name
// instead of the state.notification.things object, keyed by id
export const getSortedNotifications = createSelector(
	[getNotifications],
	(notifications) => {
		const notificationsArray = Object.keys(notifications).map((id) => {
			return notifications[id];
		});

		notificationsArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

		return notificationsArray;
	},
);

export const getNewNotificationsCount = createSelector(
	[getSortedNotifications],
	(notifications) => {
		const notificationsArray = notifications.filter(obj => obj.new === true);

		return notificationsArray.length;
	},
);

// ///////////////////////////
// state updates
export default function notification(state = initialNotificationsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialNotificationsState, {}); // constant provides placement instead of update, so all previous entries are removed
		}

		case RECEIVE_NOTIFICATIONS: {
			const { entities } = action.payload;

			let things = {};

			if (entities && entities.notification) {
				things = entities.notification;
			}

			return updeep({ things }, state);

			// I would prefer to completely replace the notifications in the store, but using updeep.constant triggers a complete update to the store, which is OTT to do every 10 seconds.
			// So I'm trusting that the actions here to remove notifications will work, and if things do get out of sync, a refresh will fix it.
			/* return updeep({
				'things': updeep.constant(things), // replace store data
			}, state); */
		}

		case UPDATE_NOTIFICATION_SUCCEEDED: {
			// update editable properties
			const update = {
				'new': action.payload.new,
				'unread': action.payload.unread,
			};

			return updeep({ 'things': { [action.payload.id]: update } }, state);
		}

		case DELETE_NOTIFICATION_SUCCEEDED: {
			return updeep({ 'things': updeep.omit([action.payload.id]) }, state);
		}

		case DELETE_MY_NOTIFICATIONS_SUCCEEDED: {
			return updeep({ 'things': updeep.omit(action.payload.notificationIds) }, state);
		}

		default:
			return state;
	}
}
