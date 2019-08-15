// Login.js

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Container, Row, Col, Label, Input } from 'reactstrap';
import { Link } from 'react-router-dom';
import ValidatedForm from './ValidatedForm';
import { loginUser } from '../modules/auth';

class Login extends Component {
	constructor() {
		super();
		this.state = {
			'email': '',
			'password': '',
		};

		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);
	}

	componentDidMount() {
		const { auth, history } = this.props;

		if (auth.isAuthenticated) {
			history.push('/');
		}
	}

	componentWillReceiveProps(nextProps) {
		const { auth } = nextProps;
		const { history } = this.props;

		if (auth.isAuthenticated) {
			history.push('/');
		}
	}

	handleInputChange(e) {
		this.setState({
			[e.target.name]: e.target.value,
		});
	}

	handleSubmit(e) {
		const { email, password } = this.state;
		const { history } = this.props;

		e.preventDefault();
		const user = {
			'email': email,
			'password': password,
		};
		this.props.loginUser(user, history); // eslint-disable-line react/destructuring-assignment
		// avoid ambiguity with loginUser declared in upper scope
	}

	render() {
		const { email, password } = this.state;
		const { errors } = this.props;

		return (
			<Container>
				<h2>Login</h2>
				<ValidatedForm onSubmit={this.handleSubmit}>
					<Row>
						<Col md="9" lg="6">
							<div className="form-group">
								<Label for="email">Email address</Label>
								<Input
									type="email"
									name="email"
									id="email"
									required={true}
									onChange={this.handleInputChange}
									value={email}
									placeholder="Email address"
								/>
								<div className="invalid-feedback" />
							</div>
						</Col>
					</Row>
					<Row>
						<Col md="9" lg="6">
							<div className="form-group">
								<Label for="password">Password</Label>
								<Input
									type="password"
									name="password"
									required={true}
									id="password"
									value={password}
									placeholder="Password"
									onChange={this.handleInputChange}
								/>
								<div className="invalid-feedback" />
							</div>
						</Col>
					</Row>
					<Row>
						<Col md="9" lg="6">
							<button type="submit" className="btn btn-primary">
								Login
							</button>
						</Col>
					</Row>
					<Row>
						<Col md="9" lg="6">
							{errors.authentication && <div className="invalid-feedback " style={{ 'display': 'block' }}>{errors.authentication}</div>}
						</Col>
					</Row>
				</ValidatedForm>
				<Link className="nav-link" to="/forgotpassword">Forgot password?</Link>
			</Container>
		);
	}
}

Login.propTypes = {
	'loginUser': PropTypes.func.isRequired,
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'errors': PropTypes.objectOf(PropTypes.any).isRequired,
	'history': PropTypes.objectOf(PropTypes.any).isRequired,
};

const mapStateToProps = state => ({
	'auth': state.auth,
	'errors': state.errors,
});

export default connect(mapStateToProps, { loginUser })(Login);
