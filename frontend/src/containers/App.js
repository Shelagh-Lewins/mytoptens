// App.js

import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '../store';
import { setCurrentUser, getUserInfo, logoutUser, getAuthToken } from '../modules/auth';

import Navbar from '../components/Navbar';
import Register from '../components/Register';
import Welcome from '../components/Welcome';
import Login from '../components/Login';
import Home from '../containers/Home';
import CreateTopTenList from '../containers/CreateTopTenList';
import TopTenListDetails from '../containers/TopTenListDetail';
import Account from '../components/Account';
import ForgotPassword from '../components/ForgotPassword';
import ChangePassword from '../components/ChangePassword';
import Verified from '../components/Verified';

import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './App.scss';
// note that the Django template pages reset password loads the bootstrap css from static/bootstrap

// check if user is already logged in
if(getAuthToken()) {
	store.dispatch(setCurrentUser(localStorage.mytoptensJwtToken));
	store.dispatch(getUserInfo());

	const currentTime = Date.now() / 1000;
	if(localStorage.mytoptensJwtToken.exp < currentTime) {
		store.dispatch(logoutUser());
	}
}

class App extends Component {
	render() {
		return (
			<Provider store = { store }>
				<Router>
					<div>
						<Navbar />	
						<div className="container">
							<Route exact path="/" component={ Home } />
							<Route exact path="/newtopTenList" component={ CreateTopTenList } />
							<Route exact path="/topTenList/:id" component={ TopTenListDetails } />
							<Route exact path="/register" component={ Register } />
							<Route exact path="/welcome" component={ Welcome } />
							<Route exact path="/login" component={ Login } />
							<Route exact path="/forgotpassword" component={ ForgotPassword } />
							<Route exact path="/account" component={ Account } />
							<Route exact path="/changepassword" component={ ChangePassword } />
							<Route exact path="/verified" component={ Verified } />
						</div>
					</div>
				</Router>
			</Provider>
		);
	}
}

export default App;
