// App.js

import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Provider } from 'react-redux';

// fontawesome
import { library } from '@fortawesome/fontawesome-svg-core';
import {
	faPencilAlt,
	faClone,
	faPlus,
	faListOl,
	faStickyNote,
	faQuestionCircle,
	faEdit,
	faBell,
	faUser,
	faFileDownload,
	faLock,
	faLockOpen,
	faTrash,
} from '@fortawesome/free-solid-svg-icons'; // import the icons you want

import store from '../store';
import {
	setCurrentUser, getUserInfo, logoutUser, getAuthToken,
} from '../modules/auth';

import Navbar from '../components/Navbar';
import Register from '../components/Register';
import Welcome from '../components/Welcome';
import Login from '../components/Login';
import Home from './Home';
import CreateTopTenList from './CreateTopTenList';
import TopTenListDetails from './TopTenListDetail';
import ReusableItemDetail from './ReusableItemDetail';
import Account from '../components/Account';
import ForgotPassword from '../components/ForgotPassword';
import ChangePassword from '../components/ChangePassword';
import Verified from '../components/Verified';

import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './App.scss';
// note that the Django template pages reset password loads the bootstrap css from static/bootstrap

library.add(faPencilAlt, faClone, faPlus, faListOl, faStickyNote, faQuestionCircle, faEdit, faBell, faUser, faFileDownload, faLock, faLockOpen, faTrash); // and add them to your library

// usage: for regular icons, import the component and specify 'far' i.e. font awesome regular as below
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// <FontAwesomeIcon icon={['far', 'clone']} />

// check if user is already logged in
if (getAuthToken()) {
	store.dispatch(setCurrentUser(localStorage.mytoptensJwtToken));
	store.dispatch(getUserInfo());

	const currentTime = Date.now() / 1000;
	if (localStorage.mytoptensJwtToken.exp < currentTime) {
		store.dispatch(logoutUser());
	}
}

const App = () => (
	<Provider store={store}>
		<Router>
			<div>
				<Navbar />
				<div className="container">
					<Route exact path="/" component={Home} />
					<Route exact path="/newtoptenlist" component={CreateTopTenList} />
					<Route exact path="/toptenlist/:id" component={TopTenListDetails} />
					<Route exact path="/reusableitem/:id" component={ReusableItemDetail} />
					<Route exact path="/register" component={Register} />
					<Route exact path="/welcome" component={Welcome} />
					<Route exact path="/login" component={Login} />
					<Route exact path="/forgotpassword" component={ForgotPassword} />
					<Route exact path="/account" component={Account} />
					<Route exact path="/changepassword" component={ChangePassword} />
					<Route exact path="/verified" component={Verified} />
				</div>
			</div>
		</Router>
	</Provider>
);

export default App;
