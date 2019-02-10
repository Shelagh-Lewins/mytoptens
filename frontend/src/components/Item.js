// An individual item
// It is a stateful component so that the description field can be shown only if there is a name defined.

import store from '../store';

import React, { Component } from 'react';
import { Col } from 'reactstrap';
import EditableTextField from './EditableTextField.js';
import './Item.scss';

class Item extends Component {
	constructor(props) {
		super();

		this.state = {
			'isEditingName': false,
		};
	}

	setIsEditingName(showInput) {
		this.setState({
			'isEditingName': showInput,
		});
	}

	onCreateSubList = () => {
		this.props.onCreateSubList(this.props.item.id);
	}

	render() {
		let showDescription = true;
		if (this.props.item.name === '') {
			showDescription = false;
		} else if (this.state.isEditingName && store.getState().items.things[this.props.item.id] && store.getState().items.things[this.props.item.id].name === '') {
			showDescription = false;
		}

		let showCreateSubList = true;
		if (this.props.item.name === '') {
			showCreateSubList = false;
		} else if (this.state.isEditingName) {
			showCreateSubList = false;
		}

		return (
			<Col className="item-container">
				<div className="item-header">
					<span className="order">{this.props.item.order}:</span><EditableTextField
						canEdit={this.props.canEdit}
						name={`${this.props.item.order}_name`}
						label="Item name"
						placeholder="Click here to add an item"
						data-state={`${this.props.item.order}_name`}
						data-entityid={this.props.item.id} // database id of the item
						id={`${this.props.item.order}_name`} // id of the html element
						handleInputChange={this.props.handleInputChange}
						handleNewValue={this.props.handleNewValue}
						isEditing={this.setIsEditingName.bind(this)}
						value={this.props.item.name}
					/>
				</div>
				child list {this.props.item.childList && this.props.item.childList.name}
				{showCreateSubList &&
					<button className="btn btn-primary create-sublist" onClick={this.onCreateSubList.bind(this)}>Create child list</button>
				}
				{showDescription &&
					<div className="item-body">
						<EditableTextField
							textarea={true}
							canEdit={this.props.canEdit}
							name={`${this.props.item.order}_description`}
							placeholder="Click here to add a description"
							label="Item description"
							data-state={`${this.props.item.order}_description`}
							data-entityid={this.props.item.id} // database id of the item
							id={`${this.props.item.order}_description`} // id of the html element
							handleInputChange={this.props.handleInputChange}
							handleNewValue={this.props.handleNewValue}
							value={this.props.item.description}
						/>
					</div>
				}
			</Col>
		);
	}
};

export default Item;
