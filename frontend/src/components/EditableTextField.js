// An input or textarea that can be edited by clicking on it
// It can be blank, or required
// note custom property data-state which is the name of the property in this.state
// Can be used with keyboard only
// It is a regular form with cancel, submit. This allows keyboard navigation but the form stays open on blur - otherwise cancel would not be possible with keyboard.

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Row, Col, Label, Input } from 'reactstrap';
import './EditableTextField.scss';

class EditableTextField extends Component {
	constructor(props) {
		super();
		this.state = {
			'showInput': false,
			'isValidated': false,
			'initialValue': '',
			'type': props.textarea ? 'textarea' : 'input',
		};

		//this.showInput = this.showInput.bind(this);
	}

	onKeyUp(e) {
		var code = e.keyCode || e.which;
		if(code === 13) { //13 is the enter keycode
			//Do stuff in here
			this.showInput(e);
		}
	}

	showInput(e) {
		const isPlaceholder = e.target.classList.contains('placeholder');

		if (!isPlaceholder) {
			this.setState({
				'initialValue': e.target.textContent,
			});
		}
		this.toggleInput();
	}

	toggleInput() {
		const newShowInputValue = !this.state.showInput;

		// optionally, tell the parent component whether the field is being edited
		if (typeof this.props.isEditing === 'function') {
			this.props.isEditing(newShowInputValue);
		}

		this.setState({
			'showInput': newShowInputValue,
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
		const elem = formEl.querySelector(this.state.type);
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

		const inputElement = e.target.querySelector(this.state.type);

		if (this.validate()) {
			this.props.handleNewValue(inputElement);
			this.toggleInput();
		}

		this.setState({ 'isValidated': true });
	}

	render() {
		let type = 'text';
		if (this.props.textarea) {
			type = 'textarea';
		}
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
						onSubmit={this.handleSubmit.bind(this)}
						className={classNames}
					>
						<Row>
							<Col>
								<div className="form-group">
									<Label for={this.props.id}>{this.props.label}</Label>
									<Input autoFocus
										type={type}
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
							onClick={this.showInput.bind(this)}
							 onKeyUp={this.onKeyUp.bind(this)}
							tabIndex="0"
						>{this.props.value}</span>
					);
				} else {
					item = (
						<span
							className="placeholder"
							tabIndex="0"
							onClick={this.showInput.bind(this)}
							onKeyUp={this.onKeyUp.bind(this)}
						>{this.props.placeholder}</span>
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
