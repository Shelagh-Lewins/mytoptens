// An input or textarea that can be edited by clicking on it
// It can be blank, or required
// note custom property data-state which is the name of the property in this.state
// Can be used with keyboard only
// It is a regular form with cancel, submit. This allows keyboard navigation but the form stays open on blur - otherwise cancel would not be possible with keyboard.

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Row, Col, Label, Input } from 'reactstrap';
import './EditableTextField.scss';
import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';

class EditableTextField extends Component {
	constructor(props) {
		super();
		this.state = {
			'showInput': false,
			'isValidated': false,
			'initialValue': '',
			'overflowActive': false,
			'type': props.textarea ? 'textarea' : 'input',
		};

		if (props.textarea === true) {
			this.state.expanded = false;
		}

		this.showInput = this.showInput.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.toggleMore = this.toggleMore.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	// does the text overflow its container?
	isOverflowActive() {
		if (!this.props.textarea) {
			return false;
		}

		const element = this.textElement;
		if (!element) {
			return false;
		}

		const overflowActive = element.offsetHeight < element.scrollHeight;

		if (overflowActive !== this.state.overflowActive) {
			this.setState({ 'overflowActive': overflowActive });
		}
	}

	toggleMore() {
		this.setState({
			'expanded': !this.state.expanded,
		});
	}

	componentDidMount() {
		this.isOverflowActive();
	}

	componentDidUpdate() {
		this.isOverflowActive();
	}

	onKeyUp(e) {
		var code = e.keyCode || e.which;
		if(code === 13) { //13 is the enter keycode
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

	renderValue() {
		// construct the display of the text value
		let expanded = '';
		if (this.state.expanded) {
			expanded = 'expanded';
		}

		let showMoreButton = false;

		if (this.state.overflowActive || this.state.expanded) {
			showMoreButton = true;
		}

		let moreButtonText = 'More...';
		if (this.state.expanded) {
			moreButtonText = 'Less...';
		}

		let onClick;
		let onKeyUp;
		let tabIndex = '';

		if (this.props.canEdit) {
			tabIndex = '0';
			onClick=this.showInput;
			onKeyUp=this.onKeyUp;
		}

		let item = (
			<span>
				<span className={`text ${expanded}`}
					ref={ref => (this.textElement = ref)}
					onKeyUp={onKeyUp}
					onClick={onClick}
					tabIndex={tabIndex}	
				>
					<Markdown 
						escapeHtml={true}
						source={this.props.value} 
					/>
					{showMoreButton && <span className="fader"></span>}</span>
				{showMoreButton && <button type="button" className="show-more" onClick={this.toggleMore}>{moreButtonText}</button>}
			</span>
		);

		return item;
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

		if (this.props.canEdit) {
			if (showInput) {			
				item = (
					<form
						noValidate
						onSubmit={this.handleSubmit}
						className={classNames}
					>
						<Row>
							<Col>
								<div className="form-group">
									<Label for={this.props.id}>{this.props.label}</Label>
									<Input autoFocus
										type={type}
										name={this.props.id}
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
							<Col className="controls">
								<button type="button" className="btn btn-secondary" onClick={this.cancel}>
								Cancel
								</button>
								<button type="submit" className="btn btn-primary">
								Done
								</button>
								<span className="hint">You can use <Link to="https://help.github.com/articles/basic-writing-and-formatting-syntax/">Markdown</Link></span>
							</Col>
						</Row>
					</form>);
			} else {
				if (this.props.value !== '') {
					item = this.renderValue();
				} else {
					item = (
						<span
							className="placeholder"
							tabIndex="0"
							onClick={this.showInput}
							onKeyUp={this.onKeyUp}
						>{this.props.placeholder}</span>
					);
				}
			}
		} else {
			if (this.props.value !== '') {
				item = this.renderValue();
			}
		}
		return (
			<div className={`editable-text-field ${showInput && 'editing'}`}>
				{ item }
			</div>
		);
	}
}

export default EditableTextField;
