import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { changePassword, passwordNotChanged } from '../modules/auth';
import { Container, Row, Col, Label, Input } from 'reactstrap';
import ValidatedForm from './ValidatedForm.js';

class ChangePassword extends Component {
	constructor() {
		super();
		this.state = {
			'old_password': '',
			'new_password': '',
			'new_password_confirm': '',
		};
		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleInputChange(e) {
		this.setState({
			[e.target.name]: e.target.value
		});
	}

	handleSubmit(e) {
		e.preventDefault();

		const data = {
			'old_password': this.state.old_password,
			'new_password1': this.state.new_password,
			'new_password2': this.state.new_password_confirm
		};

		this.props.changePassword(data, this.props.history);
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

	///////////////

	render() {
		return(
			<Container>
				<h2>Change your password</h2>
				<ValidatedForm onSubmit={ this.handleSubmit } inputsmustmatch={ {
					'input1': 'new_password',
					'input2': 'new_password_confirm',
					'message': 'New passwords must match',
				} }>
					<Row>
						<Col md="9" lg="6">
							<div className="form-group">
								<Label for="old_password">Old password</Label>
								<Input
									type="password"
									name="old_password"
									id="old_password"
									required={true}
									minLength={8}
									pattern=".*[^0-9].*"
									value={ this.state.old_password }
									placeholder="Enter your old password"
									onChange={ this.handleInputChange }
								/>
								<div className='invalid-feedback' />
							</div>
						</Col>
					</Row>
					<Row>
						<Col md="9" lg="6">
							<div className="form-group">
								<Label for="new_password">New password</Label>
								<Input
									type="password"
									name="new_password"
									id="new_password"
									required={true}
									minLength={8}
									pattern=".*[^0-9].*"
									value={ this.state.new_password }
									placeholder="Enter your password"
									onChange={ this.handleInputChange }
								/>
								<div className='invalid-feedback' />
							</div>
						</Col>
					</Row>
					<Row>
						<Col md="9" lg="6">
							<div className="form-group">
								<Label for="new_password_confirm">Confirm your new password</Label>
								<Input
									type="password"
									name="new_password_confirm"
									id="new_password_confirm"
									required={true}
									minLength={8}
									pattern=".*[^0-9].*"
									value={ this.state.new_password_confirm }
									placeholder="Confirm your password"
									onChange={ this.handleInputChange }
								/>
								<div className='invalid-feedback' />
								<small className='form-text text-muted'><ul>
									<li>Your password can't be too similar to your other personal information.</li>
									<li>Your password must contain at least 8 characters.</li>
									<li>Your password can't be a commonly used password.</li>
									<li>Your password can't be entirely numbers.</li>
								</ul></small>
							</div>
						</Col>
					</Row>
					<Row>
						<Col md="9" lg="6">
							<button type="submit" className="btn btn-primary">
								Change password now
							</button>
						</Col>
					</Row>
	        <Row>
						<Col md="9" lg="6">
							{this.props.errors.changePassword && <div className="invalid-feedback" style={{ 'display': 'block' }}>{this.props.errors.changePassword}</div>}
						</Col>
					</Row>
	      </ValidatedForm>
	      {this.props.auth.changePasswordComplete && (<div className="valid-feedback">Your new password has been saved</div>)}
			</Container>
		);
	}
}

ChangePassword.propTypes = {
	'changePassword': PropTypes.func.isRequired,
	'passwordNotChanged': PropTypes.func.isRequired,
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired
};

const mapStateToProps = state => ({
	'auth': state.auth,
	'errors': state.errors
});

export default connect(mapStateToProps,{ changePassword, passwordNotChanged })(withRouter(ChangePassword));
