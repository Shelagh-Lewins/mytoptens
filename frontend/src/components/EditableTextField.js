// An input or textarea that can be edited by clicking on it
// use type 'input' or 'textarea' for simple fields
// use type 'combobox' for the complex topTenItem control to allow reusableItems to be created and selected
// It can be blank, or required
// note custom property data-state which is the name of the property in this.state
// Can be used with keyboard only
// It is a regular form with cancel, submit. This allows keyboard navigation but the form stays open on blur - otherwise cancel would not be possible with keyboard.

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {
	Row, Col, Label, Input,
} from 'reactstrap';
import './EditableTextField.scss';
import Markdown from 'react-markdown';
import PropTypes from 'prop-types';
import ReusableItemComboBox from './ReusableItemComboBox';


class EditableTextField extends Component {
	constructor(props) {
		super();
		this.state = {
			'showInput': false,
			'isValidated': false,
			'initialValue': '',
			'overflowActive': false,
			'type': props.type,
		};

		if (props.type === 'textarea') {
			this.state.expanded = false;
		}

		this.showInput = this.showInput.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.toggleMore = this.toggleMore.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	componentDidMount() {
		this.isOverflowActive();
	}

	componentDidUpdate = (prevProps) => {
		this.isOverflowActive();
	}

	onKeyUp(e) {
		const code = e.keyCode || e.which;
		if (code === 13) { // 13 is the enter keycode
			this.showInput(e);
		}
	}

	cancel = () => {
		// restore the initial value of the field as though the user had just entered it
		const {
			type, initialReusableItem, initialValue,
		} = this.state;
		const {
			id, onSelect, handleInputChange,
		} = this.props;

		if (type === 'reusableItemCombobox') {
			// restore reusableItem defaults
			const fakeSelectEvent = {
				'type': initialReusableItem ? 'reusableItem' : 'text',
				'id': initialReusableItem,
				'name': initialValue,
			};

			onSelect(fakeSelectEvent, id);

			this.toggleInput();
			return;
		}

		// regular input or textarea
		const fakeEvent = {
			'target': {
				'dataset': { 'state': this.props['data-state'] },
				'value': initialValue,
			},
		};

		handleInputChange(fakeEvent, id);
		this.toggleInput();
	}

	validate = () => {
		// custom validation for consistency with other forms

		const { type } = this.state;

		if (type === 'reusableItemCombobox') { // cannot validate combobox so accept anything; should not cause an error
			return true;
		}
		// component parent node
		const formEl = ReactDOM.findDOMNode(this); /* eslint-disable-line react/no-find-dom-node */
		const elem = formEl.querySelector(type);
		const errorLabel = elem.parentNode.querySelector('.invalid-feedback');

		if (!elem.validity.valid) {
			const message = elem.validationMessage;
			errorLabel.textContent = message;

			return false;
		}
		errorLabel.textContent = '';

		return true;
	}

	showInput(e) {
		const { value, reusableItem } = this.props;
		const { type } = this.state;

		const isPlaceholder = e.target.classList.contains('placeholder');
		if (!isPlaceholder) {
			this.setState({
				'initialValue': value,
			});

			if (type === 'reusableItemCombobox') {
				// set reusableItem initial values. A topTenItem from the database can either have a reusableItem, or not.
				this.setState({
					'initialReusableItem': reusableItem ? reusableItem.id : undefined,
				});
			}
		}

		this.toggleInput();
	}

	toggleMore() {
		const { expanded } = this.state;

		this.setState({
			'expanded': !expanded,
		});
	}

	toggleInput() {
		const { showInput } = this.state;
		const { isEditing } = this.props;

		const newShowInputValue = !showInput;

		// optionally, tell the parent component whether the field is being edited
		if (typeof isEditing === 'function') {
			isEditing(newShowInputValue);
		}

		this.setState({
			'showInput': newShowInputValue,
		});
	}


	// does the text overflow its container?
	isOverflowActive() {
		const { type, overflowActive } = this.state;

		if (!type === 'textarea') {
			return false;
		}

		const element = this.textElement;
		if (!element) {
			return false;
		}

		const newOverflowActive = element.offsetHeight < element.scrollHeight;

		if (newOverflowActive !== overflowActive) {
			this.setState({ 'overflowActive': newOverflowActive });
		}
	}

	handleSubmit(e) {
		e.preventDefault();

		// the user has typed a new value and the parent component should be notified
		let { type } = this.state;
		const { handleNewValue } = this.props;

		if (type === 'reusableItemCombobox') {
			type = 'input';
		}

		// id of the database object to update, and the property to change, are encoded in the element's data attribute
		// this is perhaps unnecessary - data could be passed directly as we do have EditableTextField as 'this' context - but would involve refactoring
		const inputElement = e.target.querySelector(type);

		if (this.validate()) {
			handleNewValue(inputElement);
			this.toggleInput();
		}

		this.setState({ 'isValidated': true });
	}

	renderValue() {
		const { expanded, overflowActive } = this.state;
		const { canEdit, value } = this.props;

		// construct the display of the text value
		let expandedText = '';
		if (expanded) {
			expandedText = 'expanded';
		}

		let showMoreButton = false;

		if (overflowActive || expanded) {
			showMoreButton = true;
		}

		let moreButtonText = 'More...';
		if (expanded) {
			moreButtonText = 'Less...';
		}

		let onClick;
		let onKeyUp;
		let tabIndex = '';

		if (canEdit) {
			tabIndex = '0';
			onClick = this.showInput;
			onKeyUp = this.onKeyUp;
		}

		const item = (
			<span>
				<span
					className={`text ${expandedText}`}
					ref={ref => (this.textElement = ref)}
					onKeyUp={onKeyUp}
					onClick={onClick}
					tabIndex={tabIndex}
					role="button"
				>
					<Markdown
						escapeHtml
						source={value}
					/>
					{showMoreButton && <span className="fader" />}
				</span>
				{showMoreButton && <button type="button" className="show-more" onClick={this.toggleMore}>{moreButtonText}</button>}
			</span>
		);

		return item;
	}

	render() {
		const { type, isValidated, showInput } = this.state;
		const {
			className, id, label, required, handleInputChange, value, placeholder, data, onSelect, newReusableItem, reusableItem, topTenItem, handleDetailsChange, canEdit,
		} = this.props;

		// Add bootstrap's 'was-validated' class to the forms classes to support its styling
		let classNames = [];
		if (className) {
			classNames = [...className];
			// delete className;
		}

		if (isValidated) {
			classNames.push('was-validated');
		}

		// const showInput = this.state.showInput;
		let item;
		let inputElement;

		switch (type) {
			case 'input':
			case 'textarea':
				inputElement = (
					<div className="form-group">
						<Label for={id}>{label}</Label>
						<Input
							autoFocus
							type={type}
							name={id}
							required={required}
							data-state={this.props['data-state']}
							data-entityid={this.props['data-entityid']}
							id={id}
							onChange={handleInputChange}
							value={value}
							placeholder={placeholder}
						/>
						<div className="invalid-feedback" />
					</div>
				);
				break;

			case 'reusableItemCombobox':
				inputElement = (
					<div className="form-group">
						<ReusableItemComboBox
							widgetId={id}
							labelText={label}
							data={data}
							defaultValue={value}
							onChange={param => handleInputChange(param, id)}
							onSelect={param => onSelect(param, id)}
							newReusableItem={newReusableItem}
							reusableItem={reusableItem}
							topTenItem={topTenItem}
							onDetailsChange={handleDetailsChange}
							inputProps={{
								'data-entityid': this.props['data-entityid'],
								'data-state': this.props['data-state'],
							}}
						/>
					</div>
				);
				break;

			default:
				inputElement = <div className="form-group"></div>;
		}

		if (canEdit) {
			if (showInput) {
				item = (
					<form
						noValidate
						onSubmit={this.handleSubmit}
						className={classNames}
					>
						<Row>
							<Col>
								{inputElement}
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
								{type === 'textarea'
								&& (
									<span className="hint">
								You can use <a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/" target="_blank" rel="noopener noreferrer">Markdown</a>
									</span>
								)}
							</Col>
						</Row>
					</form>
				);
			} else if (value !== '') {
				item = this.renderValue();
			} else {
				item = (
					<span
						className="placeholder"
						tabIndex="0"
						onClick={this.showInput}
						onKeyUp={this.onKeyUp}
						role="button"
					>
						{placeholder}
					</span>
				);
			}
		} else if (value !== '') {
			item = this.renderValue();
		}
		return (
			<div className={`editable-text-field ${showInput && 'editing'}`}>
				{ item }
			</div>
		);
	}
}

EditableTextField.propTypes = {
	'canEdit': PropTypes.bool,
	'className': PropTypes.string,
	'data': PropTypes.arrayOf(PropTypes.any),
	'data-state': PropTypes.string,
	'handleDetailsChange': PropTypes.func,
	'handleInputChange': PropTypes.func.isRequired,
	'handleNewValue': PropTypes.func.isRequired,
	'id': PropTypes.string.isRequired,
	'isEditing': PropTypes.func,
	'label': PropTypes.string.isRequired,
	'newReusableItem': PropTypes.objectOf(PropTypes.any),
	'onSelect': PropTypes.func,
	'placeholder': PropTypes.string.isRequired,
	'required': PropTypes.bool,
	'reusableItem': PropTypes.objectOf(PropTypes.any),
	'topTenItem': PropTypes.string,
	'type': PropTypes.string.isRequired,
	'value': PropTypes.string,
};

export default EditableTextField;
