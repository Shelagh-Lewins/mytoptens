// A text field that can be edited by clicking on it
// It can be blank, it is not required, there is no validation
// note custom property data-state which is the name of the property in this.state
// Can be used with keyboard only

import React, { Component } from 'react';
import { Label, Input } from 'reactstrap';
import './EditableTextField.scss';

class EditableTextField extends Component {
	constructor() {
		super();
		this.state = {
			'showInput': false,
		};

		this.onBlur = this.onBlur.bind(this);
		this.toggleInput = this.toggleInput.bind(this);
	}

	toggleInput(e) {
		this.setState({
			'showInput': !this.state.showInput,
		});
	}

	onBlur(e) {
		// the user has typed a new value and the parent component should be notified
		this.props.handleNewValue(e);
		this.toggleInput(e);
	}

	onKeyUp(e) {
		var code = e.keyCode || e.which;
		if(code === 13) { //13 is the enter keycode
			//Do stuff in here
			this.toggleInput(e);
		}
	}

	render() {
		const showInput = this.state.showInput;
		let item;

		if(this.props.canEdit) {
			if (showInput) {			
				item = (
					<div><Label for={this.props.id}>{this.props.label}</Label>
						<Input autoFocus
							type="text"
							name={this.props.id}
							data-state={this.props['data-state']}
							data-entityid={this.props['data-entityid']}
							id={this.props.id}
							onChange={this.props.handleInputChange}
							onBlur={this.onBlur}
							value={this.props.value}
						/>
					</div>);
			} else {
				if (this.props.value !== '') {
					item = (
						<span
							onClick={this.toggleInput}
							tabIndex="0"
							onKeyUp={this.onKeyUp.bind(this)}
						>{this.props.value}</span>
					);
				} else {
					item = (
						<span className="placeholder" tabIndex="0" onClick={this.toggleInput} >{this.props.placeholder}</span>
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
