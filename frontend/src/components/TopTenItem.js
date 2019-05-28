// An individual item
// It is a stateful component so that the description field can be shown only if there is a name defined.

import store from '../store';

import React, { Component } from 'react';
import { Button, Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { Link } from 'react-router-dom';
import EditableTextField from './EditableTextField.js';
import * as permissions from '../modules/permissions';
import './TopTenItem.scss';
import { MAX_TOPTENITEMS_IN_TOPTENLIST, COLORS } from '../constants';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class Item extends Component {
	constructor(props) {
		super();

		this.state = {
			'isEditingName': false,
			'popoverOpen': false,
		};
		//console.log('topTenItem props, ', props);
		this.onCreateChildTopTenList = this.onCreateChildTopTenList.bind(this);
		this.setIsEditingName = this.setIsEditingName.bind(this);
		this.setIsEditingDescription = this.setIsEditingDescription.bind(this);
		this.onMoveUp = this.onMoveUp.bind(this);
		this.onMoveDown = this.onMoveDown.bind(this);

		this.togglePopover = this.togglePopover.bind(this);
	}

	togglePopover() {
		this.setState({
			'popoverOpen': !this.state.popoverOpen
		});
	}

	setIsEditingName(showInput) {
		this.setState({
			'isEditingName': showInput,
		});
	}

	setIsEditingDescription(showInput) {
		this.setState({
			'setIsEditingDescription': showInput,
		});
	}

	onCreateChildTopTenList = () => {
		this.props.onCreateChildTopTenList(this.props.topTenItem);
	}

	onMoveUp = () => {
		this.props.onMoveTopTenItemUp(this.props.topTenItem.id);
	}

	onMoveDown = () => {
		this.props.onMoveTopTenItemDown(this.props.topTenItem.id);
	}

	render() {
		let showDescription = true;
		if (this.props.topTenItem.name === '' && !this.state.isEditingName) {
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
			childTopTenList = (<button className="btn btn-primary create-childtoptenlist" onClick={this.onCreateChildTopTenList}>Create child Top Ten list</button>); 
		} else if (canViewChildTopTenList) {
			childTopTenList = (
				<div className="child-toptenlist">  
					<Link to={`/toptenlist/${this.props.topTenItem.childTopTenList.id}`}>{this.props.topTenItem.childTopTenList.name} ></Link>
				</div>);
		}

		let showUp = true;
		let showDown = true;

		if (this.state.isEditingName || this.state.setIsEditingDescription) {
			showUp = false;
			showDown = false;
		} else if (!this.props.canEdit ||
			this.props.topTenItem.name === '' ||
			!showDescription) { // assume that showDescription means there is a saved name i.e. the topTenItem exists
			showUp = false;
			showDown = false;
		} else if (this.props.topTenItem.order === 1) {
			showUp = false;
		} else if (this.props.topTenItem.order === MAX_TOPTENITEMS_IN_TOPTENLIST) {
			showDown = false;
		}

		let reusableItem;

		if (this.props.topTenItem.reusableItem) {
			reusableItem = store.getState().reusableItem.things[this.props.topTenItem.reusableItem];
			const popoverId = `popover${this.props.topTenItem.order}`;

			reusableItem = (
				<div>
					<Button id={popoverId} type="button" className="name-icon btn bg-transparent">
						<FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" />
					</Button>
					<Popover placement="bottom" isOpen={this.state.popoverOpen} target={popoverId} toggle={this.togglePopover} html="true">
						<PopoverHeader>{reusableItem.name}</PopoverHeader>
						<PopoverBody>{reusableItem.definition}<br />
							{reusableItem.link}<br />
							<Link to={`/reusableitem/${reusableItem.id}`}>More information...
							</Link>
						</PopoverBody>
					</Popover>
				</div>
			);
			// TODO make this work for multiple popovers
			// make link work
		}

		return (
			<div className="toptenitem-container">
				<div className="toptenitem-header">
					<span className="order">{this.props.topTenItem.order}:</span>{reusableItem}<EditableTextField
						canEdit={this.props.canEdit}
						name={`${this.props.topTenItem.order}_name`}
						label="Item name"
						placeholder="Click here to add a topTenItem"
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
					<div className="toptenitem-body">
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
							isEditing={this.setIsEditingDescription}
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
