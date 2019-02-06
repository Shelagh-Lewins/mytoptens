// Shown after user successfully verifies email address

import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Container, Row, Col } from 'reactstrap';

import { logoutUser } from '../modules/auth';

class Verified extends Component {
	constructor(props) {
		super();
		this.state = {
			'errors': {}
		};
	}

	componentDidMount() {
		this.onLogout();
	}

	onLogout(e) {
		// just in case a different user is logged in
		// to avoid confusion and force new login
		if (this.props.auth.isAuthenticated) {
			this.props.logoutUser(this.props.history);
		}
	}

	render() {
		return(
			<Container>
				<h2>Your email address has been verified</h2>
				<Row>
					<Col>
						<Link to="/login" className="nav-link">Login</Link>
					</Col>
				</Row>
			</Container>
		);
	}
}

Verified.propTypes = {
	'logoutUser': PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
	'auth': state.auth
});

export default connect(mapStateToProps, { logoutUser })(withRouter(Verified));
