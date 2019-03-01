// Navbar.js

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
//import { logoutUser } from '../modules/auth';
import { withRouter } from 'react-router-dom';

import * as authReducer from '../modules/auth';
import * as pageReducer from '../modules/page';

import Search from '../components/Search';

class Navbar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			'showDropdown': false,
		};

		this.onLogout = this.onLogout.bind(this);
	}
	showDropdown(e) {
		e.preventDefault();
		this.setState(prevState => ({
			'showDropdown': !prevState.showDropdown,
		}));
	}

	onLogout(e) {
		e.preventDefault();
		//this.props.logoutUser(authReducer.props.history);
		this.props.dispatch(authReducer.logoutUser(this.props.history));
	}

	/*onSearch = searchTerm => {
		console.log('event ', searchTerm);
		// wait until the user pauses in typing before searching
		clearTimeout(this.searchTimeout);
		this.searchTimeout = setTimeout(() => {
			this.props.dispatch(pageReducer.searchHome(searchTerm));
		}, 500);
	} */

	onSearch = e => {
		console.log('event ', e.target.value);
		const searchTerm = e.target.value;
		clearTimeout(this.searchTimeout);
		this.searchTimeout = setTimeout(() => {
			this.props.dispatch(pageReducer.searchHome(searchTerm));
		}, 500);
		//this.props.onSearch(e.target.value);
	}

	render() {
		const { isAuthenticated, user } = this.props.auth;

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
	//'logoutUser': PropTypes.func.isRequired,
	'auth': PropTypes.object.isRequired,
	'searchTerm': PropTypes.string.isRequired,
	'searchComplete': PropTypes.bool.isRequired,
	'searchResults': PropTypes.array.isRequired,
};

const mapStateToProps = (state) => ({
	'auth': state.auth,
	'searchTerm': state.page.searchTerm,
	'searchComplete': state.page.searchComplete,
	'searchResults': state.page.searchResults,
});

export default connect(mapStateToProps)(withRouter(Navbar));
// export default connect(mapStateToProps, { logoutUser })(withRouter(Navbar));
