// errorReducer.js

import { GET_ERRORS } from '../actions/types';

const initialState = {};

export default function(state = initialState, action ) {
	switch(action.type) {
		case GET_ERRORS: {
			console.log('error reducer ', action.payload);
			return action.payload;
		}

		default: 
			return state;
	}
}
