// store.js

import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction';
import thunk from 'redux-thunk';
import rootReducer from './modules/rootReducer';

const composeEnhancers = composeWithDevTools({
	// options like actionSanitizer, stateSanitizer
});

const store = createStore(
	rootReducer, 
	// inititalState, // by not supplying initial state, we tell the store to use the defaults specified in the reducer
	composeEnhancers(
		applyMiddleware(thunk),
	));

if (process.env.NODE_ENV !== 'production' && module.hot) {
	module.hot.accept('./modules/rootReducer', () => store.replaceReducer(rootReducer));
}

export default store;
