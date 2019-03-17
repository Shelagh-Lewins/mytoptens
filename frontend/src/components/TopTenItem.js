// An individual item
// It is a stateful component so that the description field can be shown only if there is a name defined.

import store from '../store';

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import EditableTextField from './EditableTextField.js';
import * as permissions from '../modules/permissions';
import './TopTenItem.scss';
import { MAX_ITEMS_IN_TOPTENLIST } from '../constants';

class Item extends Component {
	constructor(props) {
		super();

		this.state = {
			'isEditingName': false,
		};
		//console.log('item props, ', props);
		this.onCreateChildTopTenList = this.onCreateChildTopTenList.bind(this);
		this.setIsEditingName = this.setIsEditingName.bind(this);
		this.onMoveUp = this.onMoveUp.bind(this);
		this.onMoveDown = this.onMoveDown.bind(this);
	}

	setIsEditingName(showInput) {
		this.setState({
			'isEditingName': showInput,
		});
	}

	onCreateChildTopTenList = () => {
		this.props.onCreateChildTopTenList(this.props.item);
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
		} else if (this.state.isEditingName && store.getState().item.things[this.props.item.id] && store.getState().item.things[this.props.item.id].name === '') {
			showDescription = false;
		}

		let canCreateChildTopTenList = true; // should the "create child toptenlist" button be visible?

		if (this.props.item.childTopTenList || // there is already a child toptenlist
			this.props.item.name === '' || // there is no item
			this.state.isEditingName || // the item name is being edited
			!this.props.canEdit) { // the user can't edit this toptenlist
			canCreateChildTopTenList = false;
		}

		let canViewChildTopTenList = false;

		// child toptenlist exists and user can view it
		if (this.props.item.childTopTenList && permissions.canViewTopTenList(this.props.item.childTopTenList.id)) {
			canViewChildTopTenList = true;
		}

		let childTopTenList;

		if (canCreateChildTopTenList) {
			childTopTenList = (<button className="btn btn-primary create-childtoptenlist" onClick={this.onCreateChildTopTenList}>Create child Top Ten list</button>);	
		} else if (canViewChildTopTenList) {
			childTopTenList = (
				<div className="child-toptenlist">	
					<Link to={`/toptenlist/${this.props.item.childTopTenList.id}`}>{this.props.item.childTopTenList.name} ></Link>
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
		} else if (this.props.item.order === MAX_ITEMS_IN_TOPTENLIST) {
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
						isEditing={this.setIsEditingName}
						value={this.props.item.name}
					/>
				</div>
				{childTopTenList}
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
				{showUp && <button className="btn btn-secondary move-up" onClick={this.onMoveUp}>Up</button>
				}
				{showDown && <button className="btn btn-secondary move-down" onClick={this.onMoveDown}>Down</button>
				}
			</div>
		);
	}
};

export default Item;
