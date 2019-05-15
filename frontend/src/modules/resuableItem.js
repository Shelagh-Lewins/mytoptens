import { getErrors } from '../modules/errors';
import store from '../store';

import {
	LOGOUT_USER_COMPLETE
} from './auth';

// TODO clear store on logout

//////////////////////////////////
// Action creators

// define action types so they are visible
// and export them so other reducers can use them
export const CREATE_REUSABLEITEM_REQUESTED = 'CREATE_REUSABLEITEM_REQUESTED';
export const RECEIVE_REUSABLEITEMS = 'RECEIVE_REUSABLEITEMS';

//////////////////////////////////
// Reducer
var updeep = require('updeep');

const fakeResuableItems = {
	'1001': { // uuid
		'created_by': store.getState().auth.user.username,
		'created_at': new Date(),
		'is_public': false,
		'name': 'Jane austen', // name, definition, link need to be easily accessible and searchable. This is the third version.
		'definition': 'English novelist (16 December 1775 – 18 July 1817)',
		'link': 'https://en.wikipedia.org/wiki/Jane_Austen',
		'modified_by': store.getState().auth.user.username,
		'modified_at': new Date(),
		'users_when_modified': 403, // number of different users referencing this resuableItem in their own lists at the time when the last update was accepted. This is for tracking the approval process.
		'votes_yes': [],
		'votes_no': [],
		'suggested_edits': [ // may need to allow multiple proposed edits
		// prevent same user voting more than once
		// allow them to change their vote
		// only allow votes by people using the item? And remove the vote if they stop using the item. Time delay?
		// check for approval a few seconds after vote cast?
		// user sees a notification that there is a suggested edit on an item they are referencing
			{ // proposed change not yet approved
				'name': 'Jane Austen',
				'definition': 'English novelist (16 December 1775 – 18 July 1817)',
				'link': 'https://en.wikipedia.org/wiki/Jane_Austen',
				'created_by': store.getState().auth.user.username,
				'created_at': new Date(),
				'votes_yes': [], // list of usernames
				'votes_no': [], // list of usernames
			},
		],
		'history': [ // not sure this will be used but safer to keep it from the start
		// when a new version is accepted, add current version to history
		// remove version from suggested_edits
		// update current values
			{ // first version
				'name': 'Jane austin',
				'definition': 'Writer',
				'link': '',
				'modified_by': store.getState().auth.user.username,
				'modified_at': new Date(),
				'votes_yes': [],
				'votes_no': [],
			},
			{ // second version
				'name': 'Jane austen',
				'definition': 'Novelist',
				'link': 'https://en.wikipedia.org/wiki/Jane_Austen',
				'modified_by': store.getState().auth.user.username,
				'modified_at': new Date(),
				'votes_yes': [],
				'votes_no': [],
			}
		]
	},
};

const initialResuableItemsState = {
	'isLoading': false,
	'error': null,
	'count': null,
	'next': null,
	'previous': null,
	// 'things': {},
	'things': fakeResuableItems,
	'organizerData': {},
};

/////////////////////////////
// state updates

export default function topTenItem(state = initialResuableItemsState, action) {
	switch (action.type) {
		case LOGOUT_USER_COMPLETE: {
			return updeep(initialResuableItemsState, {}); // constant provides placement instead of update, so all previous entries are removed
		}
		
		case RECEIVE_REUSABLEITEMS: {
			const { entities } = action.payload;

			let things = {};

			if (entities && entities.topTenItem) {
				things = entities.topTenItem;
			}

			return updeep({
				'things': updeep.constant(things),
				'organizerData': updeep.constant({}), // new topTenList data so clear out old organizer data, this must be loaded separately
				'isLoading': false }, state);
		}
		default:
			return state;
	}
}
