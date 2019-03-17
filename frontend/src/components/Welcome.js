// Shown after successful registration of a new user

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

class Welcome extends Component {
	constructor() {
		super();
		this.state = {
			'errors': {}
		};
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.auth.isAuthenticated) {
			this.props.history.push('/'); // if logged in, redirect to Home
		}
	}

	componentDidMount() {
		if(this.props.auth.isAuthenticated) {
			this.props.history.push('/');
		}
	}

	render() {
		return(
			<Container>
				<h2>Welcome to My Top Tens</h2>
				<p>Your account has been created.</p>
				<p>To create Top Ten lists, you will need to verify your email address. An email containing a verification link has been sent to the email address with which you registered. Please click the link to verify your email address.</p>
				<p>If you do not receive the email within a few minutes, please check your Junk or Spam folder.</p>
				<Row>
					<Col>
						<p>You can request a new registration email by <Link to="/login">Logging in</Link> and going to your user account (click your username in the header bar).</p>
						
					</Col>
				</Row>
			</Container>
		);
	}
}

Welcome.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
	'auth': state.auth,
	'errors': state.errors
});

export default connect(mapStateToProps)(Welcome);
