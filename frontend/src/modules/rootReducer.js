// note that the reducers are called 'list', 'item' for consistency with the database and endpoints
// this terminology is maintained in the store
// however in the UI we use 'lists' and 'items' for the plural
// this isn't ideal but absolute naming consistency seems to be required on the server for DRF FlexFields to work


// server, store: list, listbyslug, item
// React components: lists, items

// import the partial reducers
import { combineReducers } from 'redux';
import errors from './errors';
import auth from './auth';
import page from './page';
import list from './list';
import item from './item';
// by importing the actual reducer as the default, the state of each is initialised

export default combineReducers({
	'errors': errors,
	'auth': auth,
	'page': page,
	'list': list,
	'item': item,
});
