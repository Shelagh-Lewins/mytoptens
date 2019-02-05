// Account
// user account settings, change password link

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as auth from '../modules/auth';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

class Account extends Component {
	constructor() {
		super();
		this.state = {
			'errors': {}
		};
	}

	componentWillReceiveProps(nextProps) {
		if(!nextProps.auth.isAuthenticated) {
			this.props.history.push('/'); // if not logged in, redirect to Home
		}
	}

	componentDidMount() {
		if(!this.props.auth.isAuthenticated) {
			this.props.history.push('/');
		}
		this.props.dispatch(auth.confirmEmailNotSent());
	}

	sendConfirmationEmail() {
		this.props.dispatch(auth.sendConfirmationEmail());
	}

	render() {
		const email_verified = this.props.auth.user.email_verified;
		const email_status = email_verified ? 'verified': 'unverified';
		return(
			<Container>
				<h2>Account management</h2>
				<Row>
					<Col>
						<Link to="/changepassword" className="nav-link">Change password</Link>
					</Col>
				</Row>
				<Row>
					<Col>
						<div>Email address: {this.props.auth.user.email}</div>
						<div>Status: {email_status}</div>
						{!email_verified &&	<button type="button" className="btn btn-primary"onClick={this.sendConfirmationEmail.bind(this)}>
								Resend confirmation email
						</button>}
					</Col>
				</Row>
				{this.props.auth.confirmEmailSent && (<div className="valid-feedback">A verification email has been sent to {this.props.auth.user.email}. If you don't see it within a few minutes, please check your junk mail folder.</div>)}
				{this.props.auth.confirmEmailAlreadyVerified && (<div className="valid-feedback">The email address {this.props.auth.user.email} has already been verified.</div>)}
			</Container>
		);
	}
}

Account.propTypes = {
	'sendConfirmationEmail': PropTypes.func.isRequired,
	'confirmEmailNotSent': PropTypes.func.isRequired,
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
	'auth': state.auth,
	'errors': state.errors,
	'sendConfirmationEmail': auth.sendConfirmationEmail,
	'confirmEmailNotSent': auth.confirmEmailNotSent,
});

export default connect(mapStateToProps)(Account);
