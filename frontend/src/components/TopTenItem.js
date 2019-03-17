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
		//console.log('toptenitem props, ', props);
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
		this.props.onCreateChildTopTenList(this.props.toptenitem);
	}

	onMoveUp = () => {
		this.props.onMoveItemUp(this.props.toptenitem.id);
	}

	onMoveDown = () => {
		this.props.onMoveItemDown(this.props.toptenitem.id);
	}

	render() {
		let showDescription = true;
		if (this.props.toptenitem.name === '') {
			showDescription = false;
		} else if (this.state.isEditingName && store.getState().toptenitem.things[this.props.toptenitem.id] && store.getState().toptenitem.things[this.props.toptenitem.id].name === '') {
			showDescription = false;
		}

		let canCreateChildTopTenList = true; // should the "create child toptenlist" button be visible?

		if (this.props.toptenitem.childTopTenList || // there is already a child toptenlist
			this.props.toptenitem.name === '' || // there is no toptenitem
			this.state.isEditingName || // the toptenitem name is being edited
			!this.props.canEdit) { // the user can't edit this toptenlist
			canCreateChildTopTenList = false;
		}

		let canViewChildTopTenList = false;

		// child toptenlist exists and user can view it
		if (this.props.toptenitem.childTopTenList && permissions.canViewTopTenList(this.props.toptenitem.childTopTenList.id)) {
			canViewChildTopTenList = true;
		}

		let childTopTenList;

		if (canCreateChildTopTenList) {
			childTopTenList = (<button className="btn btn-primary create-childtoptenlist" onClick={this.onCreateChildTopTenList}>Create child Top Ten list</button>);	
		} else if (canViewChildTopTenList) {
			childTopTenList = (
				<div className="child-toptenlist">	
					<Link to={`/toptenlist/${this.props.toptenitem.childTopTenList.id}`}>{this.props.toptenitem.childTopTenList.name} ></Link>
				</div>);
		}

		let showUp = true;
		let showDown = true;

		if (!this.props.canEdit ||
			this.props.toptenitem.name === '' ||
			!showDescription) { // assume that showDescription means there is a saved name i.e. the toptenitem exists
			showUp = false;
			showDown = false;
		} else if (this.props.toptenitem.order === 1) {
			showUp = false;
		} else if (this.props.toptenitem.order === MAX_TOPTENITEMS_IN_TOPTENLIST) {
			showDown = false;
		}

		return (
			<div className="toptenitem-container">
				<div className="toptenitem-header">
					<span className="order">{this.props.toptenitem.order}:</span><EditableTextField
						canEdit={this.props.canEdit}
						name={`${this.props.toptenitem.order}_name`}
						label="Item name"
						placeholder="Click here to add an toptenitem"
						data-state={`${this.props.toptenitem.order}_name`}
						data-entityid={this.props.toptenitem.id} // database id of the toptenitem
						id={`${this.props.toptenitem.order}_name`} // id of the html element
						handleInputChange={this.props.handleInputChange}
						handleNewValue={this.props.handleNewValue}
						isEditing={this.setIsEditingName}
						value={this.props.toptenitem.name}
					/>
				</div>
				{childTopTenList}
				{showDescription &&
					<div className="toptenitem-body">
						<EditableTextField
							textarea={true}
							canEdit={this.props.canEdit}
							name={`${this.props.toptenitem.order}_description`}
							placeholder="Click here to add a description"
							label="Item description"
							data-state={`${this.props.toptenitem.order}_description`}
							data-entityid={this.props.toptenitem.id} // database id of the toptenitem
							id={`${this.props.toptenitem.order}_description`} // id of the html element
							handleInputChange={this.props.handleInputChange}
							handleNewValue={this.props.handleNewValue}
							value={this.props.toptenitem.description}
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
