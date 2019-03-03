// Account
// user account settings, change password link

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as auth from '../modules/auth';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import Loading from '../components/Loading';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';

class Account extends Component {
	constructor() {
		super();
		this.state = {
			'errors': {}
		};

		this.sendConfirmationEmail = this.sendConfirmationEmail.bind(this);
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
		const emailVerified = this.props.auth.user.emailVerified;
		const email_status = emailVerified ? 'verified': 'unverified';
		return(
			<div>
				{!isEmpty(this.props.errors) && (<Container>
					<Row>
						<Col>
							<FlashMessage
								message={formatErrorMessages(this.props.errors)}
								type="error"
								onClick={this.onCloseFlashMessage}
							/>
						</Col>
					</Row>
				</Container>)}
				<Container>
					{this.props.isLoading && <Loading />}
					<h2>My account</h2>
					<Row>
						<Col>
							<div>Username: {this.props.auth.user.username}</div>
						</Col>
					</Row>
					<Row>
						<Col>
							<Link to="/changepassword">Change password</Link>
						</Col>
					</Row>
					<Row>
						<Col>
							<div>Email address: {this.props.auth.user.email}</div>
							<div>Status: {email_status}</div>
							{!emailVerified &&	<button type="button" className="btn btn-primary"onClick={this.sendConfirmationEmail}>
									Resend confirmation email
							</button>}
						</Col>
					</Row>
					{this.props.auth.confirmEmailSent && (<div className="valid-feedback">A verification email has been sent to {this.props.auth.user.email}. If you do not receive the email within a few minutes, please check your Junk or Spam folder.</div>)}
					{this.props.auth.confirmEmailAlreadyVerified && (<div className="valid-feedback">The email address {this.props.auth.user.email} has already been verified.</div>)}
				</Container>
			</div>
		);
	}
}

Account.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'sendConfirmationEmail': PropTypes.func.isRequired,
	'confirmEmailNotSent': PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
	'auth': state.auth,
	'errors': state.errors,
	'isLoading': state.list.isLoading,
	'sendConfirmationEmail': auth.sendConfirmationEmail,
	'confirmEmailNotSent': auth.confirmEmailNotSent,
});

export default connect(mapStateToProps)(Account);
