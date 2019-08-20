// Navbar.js

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import * as authReducer from '../modules/auth';
import * as pageReducer from '../modules/page';

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

		this.props.dispatch(authReducer.logoutUser(this.props.history));
	}

	onSearch = e => {
		// wait until the user stops typing before searching
		const searchTerm = e.target.value;
		clearTimeout(this.searchTimeout);

		this.searchTimeout = setTimeout(() => {
			this.props.dispatch(pageReducer.searchHome(searchTerm));
		}, 500);
	}

	showDropdown(e) {
		e.preventDefault();
		this.setState(prevState => ({
			'showDropdown': !prevState.showDropdown,
		}));
	}

	render() {
		const { auth } = this.props;
		const { isAuthenticated, user } = auth;

		const authLinks = (
			<ul className="navbar-nav ml-auto">
				{user.username && <li className="nav-item"><Link to="/account" className="nav-link">{user.username}</Link></li>}
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
		return(
			<nav className="navbar navbar-expand-sm navbar-light bg-light">
				<Link className="navbar-brand" to="/">My Top Tens</Link>
				<button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"
					onClick={(e) => {this.showDropdown(e);}} >
					<span className="navbar-toggler-icon"></span>
				</button>
				<div className={`collapse navbar-collapse ${this.state.showDropdown ? 'show' : ''}`} id="navbarSupportedContent">
					{isAuthenticated ? authLinks : guestLinks}
					<Search
						onChange={this.onSearch}
						placeholder="Search lists and items..."
						searchComplete={this.props.searchComplete}
						searchResults={this.props.searchResults}
						searchTerm={this.props.searchTerm}
					/>
				</div>
			</nav>
		);
	}
}
Navbar.propTypes = {
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'searchTerm': PropTypes.string.isRequired,
	'searchComplete': PropTypes.bool.isRequired,
	'searchResults': PropTypes.arrayOf(PropTypes.any).isRequired,
};

const mapStateToProps = state => ({
	'auth': state.auth,
	'searchTerm': state.page.searchTerm,
	'searchComplete': state.page.searchComplete,
	'searchResults': state.page.searchResults,
});

export default connect(mapStateToProps)(withRouter(Navbar));
