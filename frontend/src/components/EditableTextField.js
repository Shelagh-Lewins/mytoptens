// A text field that can be edited by clicking on it
// It can be blank, it is not required, there is no validation
// note custom property data-state which is the name of the property in this.state
// Can be used with keyboard only

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Row, Col, Label, Input } from 'reactstrap';
import './EditableTextField.scss';

class EditableTextField extends Component {
	constructor() {
		super();
		this.state = {
			'showInput': false,
			'isValidated': false,
			'initialValue': '',
		};

		this.handleSubmit = this.handleSubmit.bind(this);
		this.showInput = this.showInput.bind(this);
		this.toggleInput = this.toggleInput.bind(this);
		this.cancel = this.cancel.bind(this);
		this.validate = this.validate.bind(this);
	}

	showInput(e) {
		this.setState({
			'initialValue': e.target.textContent,
		});
		this.toggleInput();
	}

	toggleInput() {
		this.setState({
			'showInput': !this.state.showInput,
		});
	}

	cancel = () => {
		// restore the initial value of the field as though the user had just entered it
		const fakeEvent = {
			'target': {
				'dataset': { 'state': this.props['data-state'] },
				'value': this.state.initialValue,
			}
		};
		this.props.handleInputChange(fakeEvent);
		this.toggleInput();
	}

	validate = () => {
		// custom validation for consistency with other forms
		const formEl = ReactDOM.findDOMNode(this); // component parent node
		const elem = formEl.querySelector('input');
		const errorLabel = elem.parentNode.querySelector('.invalid-feedback');

		if (!elem.validity.valid) {
			let message = elem.validationMessage;
			errorLabel.textContent = message;

			return false;
		} else {
			errorLabel.textContent = '';

			return true;
		}
	}

	handleSubmit(e) {
		e.preventDefault();
		// the user has typed a new value and the parent component should be notified

		if (this.validate()) {
			this.props.handleNewValue(e.target[this.props.id]);
			this.toggleInput();
		}

		this.setState({ 'isValidated': true });
	}

	render() {
		// Add bootstrap's 'was-validated' class to the forms classes to support its styling
		let classNames = [];
		if (this.props.className) {
			classNames = [...this.props.className];
			delete this.props.className;
		}

		if (this.state.isValidated) {
			classNames.push('was-validated');
		}

		const showInput = this.state.showInput;
		let item;

		if(this.props.canEdit) {
			if (showInput) {			
				item = (
					<form
						noValidate
						onSubmit={ this.handleSubmit }
						className={classNames}
					>
						<Row>
							<Col>
								<div className="form-group">
									<Label for={this.props.id}>{this.props.label}</Label>
									<Input autoFocus
										type="text"
										name={this.props.id}
										className="form-control"
										required={this.props.required}
										data-state={this.props['data-state']}
										data-entityid={this.props['data-entityid']}
										id={this.props.id}
										onChange={this.props.handleInputChange}
										value={this.props.value}
										placeholder={this.props.placeholder}
									/>
									<div className='invalid-feedback' />
								</div>
							</Col>
						</Row>
						<Row>
							<Col>
								<button type="button" className="btn btn-secondary"onClick={this.cancel}>
								Cancel
								</button>
								<button type="submit" className="btn btn-primary">
								Done
								</button>
							</Col>
						</Row>
					</form>);
			} else {
				if (this.props.value !== '') {
					item = (
						<span
							onClick={this.showInput}
							tabIndex="0"
						>{this.props.value}</span>
					);
				} else {
					item = (
						<span className="placeholder" tabIndex="0" onClick={this.showInput} >{this.props.placeholder}</span>
					);
				}
			}
		} else {
			if (this.props.value !== '') {
				item = (
					<span>{this.props.value}</span>
				);
			} else {

			}
		}
		return (
			<div className="editable-text-field">
				{ item }
			</div>
		);
	}
}

export default EditableTextField;
