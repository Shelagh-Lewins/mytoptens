// Navbar.js

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import NotificationsButton from './NotificationsButton';

import * as authReducer from '../modules/auth';
import * as pageReducer from '../modules/page';
import * as notificationReducer from '../modules/notification';

import Search from './Search';

class Navbar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			'showDropdown': false,
		};

		this.onLogout = this.onLogout.bind(this);
	}

	onLogout(e) {
		e.preventDefault();

		const { dispatch, history } = this.props;

		dispatch(authReducer.logoutUser(history));
	}

	onSearch = (e) => {
		// wait until the user stops typing before searching
		const searchTerm = e.target.value;

		const { dispatch } = this.props;
		clearTimeout(this.searchTimeout);

		this.searchTimeout = setTimeout(() => {
			dispatch(pageReducer.searchHome(searchTerm));
		}, 500);
	}

	showDropdown(e) {
		e.preventDefault();
		this.setState(prevState => ({
			'showDropdown': !prevState.showDropdown,
		}));
	}

	render() {
		const {
			auth,
			dispatch,
			history,
			location,
			newNotificationsCount,
			notifications,
			reusableItems,
			searchComplete,
			searchResults,
			searchTerm,
		} = this.props;
		const { isAuthenticated, user } = auth;
		const { showDropdown } = this.state;

		const authLinks = (
			<ul className="navbar-nav ml-auto">
				{user.username
					&& (
						<React.Fragment>
							<li className="nav-item">
								<NotificationsButton
									dispatch={dispatch}
									history={history}
									newNotificationsCount={newNotificationsCount}
									notifications={notifications}
									pathname={location.pathname}
									reusableItems={reusableItems}
								/>
							</li>
							<li className="nav-item"><Link to="/account" className="nav-link">{user.username}</Link></li>
						</React.Fragment>
					)}
				<li className="nav-item"><Link to="/" className="nav-link" onClick={this.onLogout}>Logout</Link></li>
			</ul>
		);
		const guestLinks = (
			<ul className="navbar-nav ml-auto">
				<li className="nav-item">
					<Link className="nav-link" to="/register">Register</Link>
				</li>
				<li className="nav-item">
					<Link className="nav-link" to="/login">Login</Link>
				</li>
			</ul>
		);

		return (
			<nav className="navbar navbar-expand-sm navbar-dark bg-dark">
				<Link className="navbar-brand" to="/">My Top Tens</Link>
				<button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation" onClick={(e) => { this.showDropdown(e); }}>
					<span className="navbar-toggler-icon" />
				</button>
				<div className={`collapse navbar-collapse ${showDropdown ? 'show' : ''}`} id="navbarSupportedContent">
					{isAuthenticated ? authLinks : guestLinks}
					<Search
						onChange={this.onSearch}
						placeholder="Search lists and items..."
						searchComplete={searchComplete}
						searchResults={searchResults}
						searchTerm={searchTerm}
					/>
				</div>
			</nav>
		);
	}
}

Navbar.propTypes = {
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'dispatch': PropTypes.func.isRequired,
	'history': PropTypes.objectOf(PropTypes.any).isRequired,
	'location': PropTypes.objectOf(PropTypes.any).isRequired,
	'newNotificationsCount': PropTypes.number.isRequired,
	'notifications': PropTypes.arrayOf(PropTypes.any).isRequired,
	'reusableItems': PropTypes.objectOf(PropTypes.any).isRequired,
	'searchTerm': PropTypes.string.isRequired,
	'searchComplete': PropTypes.bool.isRequired,
	'searchResults': PropTypes.arrayOf(PropTypes.any).isRequired,
};

const mapStateToProps = (state, ownProps) => ({
	'auth': state.auth,
	'location': ownProps.location,
	'notifications': notificationReducer.getSortedNotifications(state),
	'newNotificationsCount': notificationReducer.getNewNotificationsCount(state),
	'reusableItems': state.reusableItem.things,
	'searchTerm': state.page.searchTerm,
	'searchComplete': state.page.searchComplete,
	'searchResults': state.page.searchResults,
});

export default withRouter(connect(mapStateToProps)(Navbar));
