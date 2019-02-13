// An individual item
// It is a stateful component so that the description field can be shown only if there is a name defined.

import store from '../store';

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import EditableTextField from './EditableTextField.js';
import * as permissions from '../modules/permissions';
import './Item.scss';
import { MAX_ITEMS_IN_LIST } from '../constants';

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

	onCreateChildList = () => {
		this.props.onCreateChildList(this.props.item.id);
	}

	onMoveUp = () => {
		this.props.onMoveItemUp(this.props.item.id);
	}

	onMoveDown = () => {
		this.props.onMoveItemDown(this.props.item.id);
	}

	render() {
		let showDescription = true;
		if (this.props.item.name === '') {
			showDescription = false;
		} else if (this.state.isEditingName && store.getState().items.things[this.props.item.id] && store.getState().items.things[this.props.item.id].name === '') {
			showDescription = false;
		}

		let canCreateChildList = true; // should the "create child list" button be visible?

		if (this.props.item.childList || // there is already a child list
			this.props.item.name === '' || // there is no item
			this.state.isEditingName || // the item name is being edited
			!this.props.canEdit) { // the user can't edit this list
			canCreateChildList = false;
		}

		let canViewChildList = false;

		// child list exists and user can view it
		if (this.props.item.childList && permissions.canViewList({ 'slug': this.props.item.childList.slug })) {
			canViewChildList = true;
		}

		let childList;

		if (canCreateChildList) {
			childList = (<button className="btn btn-primary create-childlist" onClick={this.onCreateChildList.bind(this)}>Create child list</button>);	
		} else if (canViewChildList) {
			childList = (
				<div className="child-list">	
					<Link to={`/list/${this.props.item.childList.slug}`}>{this.props.item.childList.name} ></Link>
				</div>);
		}

		let showUp = true;
		let showDown = true;

		if (!this.props.canEdit ||
			this.props.item.name === '' ||
			!showDescription) { // assume that showDescription means there is a saved name i.e. the item exists
			showUp = false;
			showDown = false;
		} else if (this.props.item.order === 1) {
			showUp = false;
		} else if (this.props.item.order === MAX_ITEMS_IN_LIST) {
			showDown = false;
		}

		return (
			<div className="item-container">
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
				{childList}
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
				{showUp && <button className="btn btn-secondary move-up" onClick={this.onMoveUp.bind(this)}>Up</button>
				}
				{showDown && <button className="btn btn-secondary move-down" onClick={this.onMoveDown.bind(this)}>Down</button>
				}
			</div>
		);
	}
};

export default Item;
