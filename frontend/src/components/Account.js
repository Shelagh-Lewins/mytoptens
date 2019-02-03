// Account
// user account settings, change password link

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Input } from 'reactstrap';
import { sendConfirmationEmail } from '../modules/auth';

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
	}

	sendConfirmationEmail() {
		console.log('resend');
		this.props.sendConfirmationEmail();
	}

	getCookie(name) {
		var cookieValue = null;
		if (document.cookie && document.cookie !== '') {
			var cookies = document.cookie.split(';');
			for (var i = 0; i < cookies.length; i++) {
				var cookie = cookies[i].trim();
				//var cookie = jQuery.trim(cookies[i]);
				// Does this cookie string begin with the name we want?
				if (cookie.substring(0, name.length + 1) === (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
		}
		return cookieValue;
	}

	render() {
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
						<div>Email address</div>
						<div>Status: </div>
						<Input type="hidden" name="csrfmiddlewaretoken"  value={this.getCookie('csrftoken')} />
						<button type="button" className="btn btn-primary"onClick={this.sendConfirmationEmail.bind(this)}>
								Resend confirmation email
						</button>

						<form action="api/v1/sendconfirmationemail" method="POST">
							<Input type="hidden" name="csrfmiddlewaretoken"  value={this.getCookie('csrftoken')} />
							<button type="submit">Send</button>
						</form>
					</Col>
				</Row>
			</Container>
		);
	}
}

Account.propTypes = {
	'sendConfirmationEmail': PropTypes.func.isRequired,
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
	'auth': state.auth,
	'errors': state.errors
});

export  default connect(mapStateToProps, { sendConfirmationEmail })(Account);
