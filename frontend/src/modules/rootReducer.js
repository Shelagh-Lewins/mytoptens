// note that the reducers are called 'toptenlist', 'item' for consistency with the database and endpoints
// this terminology is maintained in the store
// in the UI components we use toptenlistReducer, itemReducer
// this isn't ideal but absolute naming consistency seems to be required on the server for DRF FlexFields to work

// import the partial reducers
import { combineReducers } from 'redux';
import errors from './errors';
import auth from './auth';
import page from './page';
import toptenlist from './toptenlist';
import item from './toptenitem';
// by importing the actual reducer as the default, the state of each is initialised

export default combineReducers({
	'errors': errors,
	'auth': auth,
	'page': page,
	'toptenlist': toptenlist,
	'item': item,
});
