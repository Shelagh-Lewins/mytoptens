// A text field that can be edited by clicking on it
// It can be blank, it is not required, there is no validation
// note custom property data-state which is the name of the property in this.state

// TODO add placeholder text

import React, { Component } from 'react';
import { Label, Input } from 'reactstrap';

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

	render() {
		const showInput = this.state.showInput;
		let item;

		if (showInput) {			
			item = (
				<div><Label for={this.props.id}>Title</Label>
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
			item = (
				<p onClick={this.toggleInput} >{this.props.value}</p>
			);
		}
		return (
			<div>
				{ item }
			</div>
		);
	}
}

export default EditableTextField;
