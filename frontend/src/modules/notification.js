import { createSelector } from 'reselect';
import { normalize, schema } from 'normalizr';
import fetchAPI from './fetchAPI';
import { getErrors } from './errors';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

const updeep = require('updeep');

/* eslint-disable array-callback-return */

export const RECEIVE_ENTITIES = 'RECEIVE_ENTITIES';
export const FETCH_NOTIFICATIONS_STARTED = 'FETCH_NOTIFICATIONS_STARTED';
export const FETCH_NOTIFICATIONS_FAILED = 'FETCH_NOTIFICATIONS_FAILED';
export const SET_NOTIFICATION_UNREAD_SUCCEEDED = 'SET_NOTIFICATION_UNREAD_SUCCEEDED';
export const DELETE_NOTIFICATION_SUCCEEDED = 'DELETE_NOTIFICATION_SUCCEEDED';

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
function receiveEntities(entities) {
	return {
		'type': RECEIVE_ENTITIES,
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
			// console.log('fetchNotifications response', response);
			const data = {
				'entities': normalize(response, [notificationSchema]).entities,
			};

			return dispatch(receiveEntities(data));
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
	'things': {},
};

// ///////////////////////////
// get reduce info for components
const getNotifications = state => state.notification.things;

// returns notifications in an array, sorted by name
// instead of the state.notification.organizerData object, keyed by id
export const getSortedNotifications = createSelector(
	[getNotifications],
	(notifications) => {
		const notificationsArray = Object.keys(notifications).map((id) => {
			return notifications[id];
		});

		notificationsArray.sort((a, b) => a.created_at < b.created_at);

		return notificationsArray;
	},
);

export const getNewNotificationsCount = createSelector(
	[getNotifications],
	(notifications) => {
		const notificationsArray = Object.keys(notifications).map(id => notifications[id]);

		notificationsArray.sort((a, b) => a.created_at < b.created_at);

		return notificationsArray;
	},
);

// ///////////////////////////
// state updates
export default function notification(state = initialNotificationsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialNotificationsState, {}); // constant provides placement instead of update, so all previous entries are removed
		}

		case RECEIVE_ENTITIES: {
			const { entities } = action.payload;

			let things = {};

			if (entities && entities.notification) {
				things = entities.notification;
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
// set unread
// set new
