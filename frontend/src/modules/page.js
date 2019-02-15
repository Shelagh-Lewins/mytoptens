import {
	FILTER_LISTS,
} from './list';


var updeep = require('updeep');

const initialState = {
	'searchTerm': '',
};

export default function page(state = initialState, action) {
	switch (action.type) {
		case FILTER_LISTS: {
			return updeep({ 'searchTerm': action.payload.searchTerm }, state);
		}

		default: {
			return state;
		}
	}
}
