// An individual item
// It is a stateful component so that the description field can be shown only if there is a name defined.

import store from '../store';

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import EditableTextField from './EditableTextField.js';
import * as permissions from '../modules/permissions';
import './TopTenItem.scss';
import { MAX_TOPTENITEMS_IN_TOPTENLIST } from '../constants';

class Item extends Component {
	constructor(props) {
		super();

		this.state = {
			'isEditingName': false,
		};
		//console.log('topTenItem props, ', props);
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
		this.props.onCreateChildTopTenList(this.props.topTenItem);
	}

	onMoveUp = () => {
		this.props.onMoveItemUp(this.props.topTenItem.id);
	}

	onMoveDown = () => {
		this.props.onMoveItemDown(this.props.topTenItem.id);
	}

	render() {
		let showDescription = true;
		if (this.props.topTenItem.name === '') {
			showDescription = false;
		} else if (this.state.isEditingName && store.getState().topTenItem.things[this.props.topTenItem.id] && store.getState().topTenItem.things[this.props.topTenItem.id].name === '') {
			showDescription = false;
		}

		let canCreateChildTopTenList = true; // should the "create child topTenList" button be visible?

		if (this.props.topTenItem.childTopTenList || // there is already a child topTenList
			this.props.topTenItem.name === '' || // there is no topTenItem
			this.state.isEditingName || // the topTenItem name is being edited
			!this.props.canEdit) { // the user can't edit this topTenList
			canCreateChildTopTenList = false;
		}

		let canViewChildTopTenList = false;

		// child topTenList exists and user can view it
		if (this.props.topTenItem.childTopTenList && permissions.canViewTopTenList(this.props.topTenItem.childTopTenList.id)) {
			canViewChildTopTenList = true;
		}

		let childTopTenList;

		if (canCreateChildTopTenList) {
			childTopTenList = (<button className="btn btn-primary create-childtopTenList" onClick={this.onCreateChildTopTenList}>Create child Top Ten list</button>);	
		} else if (canViewChildTopTenList) {
			childTopTenList = (
				<div className="child-topTenList">	
					<Link to={`/topTenList/${this.props.topTenItem.childTopTenList.id}`}>{this.props.topTenItem.childTopTenList.name} ></Link>
				</div>);
		}

		let showUp = true;
		let showDown = true;

		if (!this.props.canEdit ||
			this.props.topTenItem.name === '' ||
			!showDescription) { // assume that showDescription means there is a saved name i.e. the topTenItem exists
			showUp = false;
			showDown = false;
		} else if (this.props.topTenItem.order === 1) {
			showUp = false;
		} else if (this.props.topTenItem.order === MAX_TOPTENITEMS_IN_TOPTENLIST) {
			showDown = false;
		}

		return (
			<div className="topTenItem-container">
				<div className="topTenItem-header">
					<span className="order">{this.props.topTenItem.order}:</span><EditableTextField
						canEdit={this.props.canEdit}
						name={`${this.props.topTenItem.order}_name`}
						label="Item name"
						placeholder="Click here to add an topTenItem"
						data-state={`${this.props.topTenItem.order}_name`}
						data-entityid={this.props.topTenItem.id} // database id of the topTenItem
						id={`${this.props.topTenItem.order}_name`} // id of the html element
						handleInputChange={this.props.handleInputChange}
						handleNewValue={this.props.handleNewValue}
						isEditing={this.setIsEditingName}
						value={this.props.topTenItem.name}
					/>
				</div>
				{childTopTenList}
				{showDescription &&
					<div className="topTenItem-body">
						<EditableTextField
							textarea={true}
							canEdit={this.props.canEdit}
							name={`${this.props.topTenItem.order}_description`}
							placeholder="Click here to add a description"
							label="Item description"
							data-state={`${this.props.topTenItem.order}_description`}
							data-entityid={this.props.topTenItem.id} // database id of the topTenItem
							id={`${this.props.topTenItem.order}_description`} // id of the html element
							handleInputChange={this.props.handleInputChange}
							handleNewValue={this.props.handleNewValue}
							value={this.props.topTenItem.description}
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
