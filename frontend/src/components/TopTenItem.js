// An individual item
// It is a stateful component so that the description field can be shown only if there is a name defined.

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	Button, Popover, PopoverHeader, PopoverBody,
} from 'reactstrap';
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import EditableTextField from './EditableTextField';
import * as permissions from '../modules/permissions';
import './TopTenItem.scss';
import { MAX_TOPTENITEMS_IN_TOPTENLIST, COLORS } from '../constants';


class Item extends Component {
	constructor(props) {
		super();

		this.state = {
			'isEditingName': false,
			'popoverOpen': false,
		};

		this.onCreateChildTopTenList = this.onCreateChildTopTenList.bind(this);
		this.setIsEditingName = this.setIsEditingName.bind(this);
		this.setIsEditingDescription = this.setIsEditingDescription.bind(this);
		this.onMoveUp = this.onMoveUp.bind(this);
		this.onMoveDown = this.onMoveDown.bind(this);

		this.togglePopover = this.togglePopover.bind(this);
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
		const { onCreateChildTopTenList, topTenItem } = this.props;
		onCreateChildTopTenList(topTenItem);
	}

	onMoveUp = () => {
		const { onMoveTopTenItemUp, topTenItem } = this.props;
		onMoveTopTenItemUp(topTenItem.id);
	}

	onMoveDown = () => {
		const { onMoveTopTenItemDown, topTenItem } = this.props;
		onMoveTopTenItemDown(topTenItem.id);
	}

	togglePopover() {
		const { popoverOpen } = this.state;
		this.setState({
			'popoverOpen': !popoverOpen,
		});
	}

	render() {
		let showDescription = true;
		const {
			topTenItem,
			topTenItemFromStore,
			canEdit,
			reusableItemSuggestions,
			handleComboboxChange,
			handleInputChange,
			handleNewValue,
			onSelectItemName,
			newReusableItem,
			reusableItem,
			reusableItems, // all reusable items from store
			topTenItemForReusableItem,
		} = this.props;
		// console.log('topTenItem', topTenItem);
		// console.log('reusableItem', reusableItem);
		const { isEditingName, setIsEditingDescription, popoverOpen } = this.state;

		if (topTenItem.name === '' && !isEditingName) {
			showDescription = false;
		} else if (isEditingName && topTenItemFromStore && topTenItemFromStore.name === '') {
			showDescription = false;
		}

		let canCreateChildTopTenList = true; // should the "create child topTenList" button be visible?

		if (topTenItem.childTopTenList // there is already a child topTenList
		|| topTenItem.name === '' // there is no topTenItem
			|| isEditingName // the topTenItem name is being edited
			|| !canEdit) { // the user can't edit this topTenList
			canCreateChildTopTenList = false;
		}

		let canViewChildTopTenList = false;

		// child topTenList exists and user can view it
		if (topTenItem.childTopTenList && permissions.canViewTopTenList(topTenItem.childTopTenList.id)) {
			canViewChildTopTenList = true;
		}

		let childTopTenList;

		if (canCreateChildTopTenList) {
			childTopTenList = (<button type="button" className="btn btn-primary create-childtoptenlist" onClick={this.onCreateChildTopTenList}>Create child Top Ten list</button>);
		} else if (canViewChildTopTenList) {
			childTopTenList = (
				<div className="child-toptenlist">
					<Link to={`/toptenlist/${topTenItem.childTopTenList.id}`}>
						{topTenItem.childTopTenList.name}
					</Link>
				</div>
			);
		}

		let showUp = true;
		let showDown = true;

		if (isEditingName || setIsEditingDescription) {
			showUp = false;
			showDown = false;
		} else if (!canEdit
			|| topTenItem.name === ''
			|| !showDescription) { // assume that showDescription means there is a saved name i.e. the topTenItem exists
			showUp = false;
			showDown = false;
		} else if (topTenItem.order === 1) {
			showUp = false;
		} else if (topTenItem.order === MAX_TOPTENITEMS_IN_TOPTENLIST) {
			showDown = false;
		}

		let currentReusableItem;
		let reusableItemIcon;

		// icon by name to indicate it's a reusableItem. Not shown when editing name.
		if (topTenItem.reusableItem && !isEditingName) {
			// currentReusableItem = store.getState().reusableItem.things[topTenItem.reusableItem] || {};
			currentReusableItem = reusableItems[topTenItem.reusableItem] || {};
			const popoverId = `popover${topTenItem.order}`;

			reusableItemIcon = (
				<div>
					<Button id={popoverId} type="button" className="name-icon btn bg-transparent">
						<FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" />
					</Button>
					<Popover placement="bottom" isOpen={popoverOpen} target={popoverId} toggle={this.togglePopover} html="true">
						<PopoverHeader>{currentReusableItem.name}</PopoverHeader>
						<PopoverBody>
							<p>Reusable item</p>
							{currentReusableItem.definition && (
								<div className="definition">
									{currentReusableItem.definition}
								</div>
							)}
							<Link to={`/reusableitem/${currentReusableItem.id}`}>
							More information...
							</Link>
						</PopoverBody>
					</Popover>
				</div>
			);
		}

		// for topTenItem combobox
		// TODO only get data if editing
		// cancel doesn't restore
		const comboboxId = `${topTenItem.order}_name`;

		let data;

		if (isEditingName) {
			data = reusableItemSuggestions[comboboxId];
			// console.log('data', data);
			// console.log('this.props.topTenItem.id', this.props.topTenItem.id);

			if (data) {
				for (let i = 0; i < data.length; i += 1) {
					if (data[i].id === topTenItem.id) {
						// console.log('entry id', data[i].id);
						data.splice(i, 1);
						break;
					}
				}
			}
			// console.log('filtered data', data);
		}

		return (
			<div className="toptenitem-container">
				<div className="toptenitem-header">
					<span className="order">
						{topTenItem.order}
						:
					</span>
					{reusableItemIcon}
					<EditableTextField
						type="reusableItemCombobox"
						canEdit={canEdit}
						name={comboboxId}
						data={data}
						label={`Top Ten item ${topTenItem.order} name`}
						placeholder="Click here to add a topTenItem"
						data-state={comboboxId}
						data-entityid={topTenItem.id} // database id of the topTenItem
						id={comboboxId} // id of the html element
						handleInputChange={handleComboboxChange}
						handleDetailsChange={handleInputChange}
						handleNewValue={handleNewValue}
						onSelect={onSelectItemName}
						isEditing={this.setIsEditingName}
						value={topTenItem.name}
						newReusableItem={newReusableItem}
						reusableItem={reusableItem}
						topTenItem={topTenItemForReusableItem}
					/>
				</div>
				{childTopTenList}
				{showDescription
					&& (
						<div className="toptenitem-body">
							<EditableTextField
								type="textarea"
								canEdit={canEdit}
								name={`${topTenItem.order}_description`}
								placeholder="Click here to add a description"
								label="Item description"
								data-state={`${topTenItem.order}_description`}
								data-entityid={topTenItem.id} // database id of the topTenItem
								id={`${topTenItem.order}_description`} // id of the html element
								handleInputChange={handleInputChange}
								handleNewValue={handleNewValue}
								isEditing={this.setIsEditingDescription}
								value={topTenItem.description}
							/>
						</div>
					)
				}
				{showUp && <button type="button" className="btn btn-secondary move-up" onClick={this.onMoveUp}>Up</button>
				}
				{showDown && <button type="button" className="btn btn-secondary move-down" onClick={this.onMoveDown}>Down</button>
				}
			</div>
		);
	}
}

Item.propTypes = {
	'topTenItem': PropTypes.objectOf(PropTypes.any).isRequired,
	'topTenItemFromStore': PropTypes.objectOf(PropTypes.any).isRequired,
	'onCreateChildTopTenList': PropTypes.func.isRequired,
	'onMoveTopTenItemUp': PropTypes.func.isRequired,
	'onMoveTopTenItemDown': PropTypes.func.isRequired,
	'reusableItemSuggestions': PropTypes.objectOf(PropTypes.any).isRequired,
	'canEdit': PropTypes.bool.isRequired,
	'handleComboboxChange': PropTypes.func.isRequired,
	'handleInputChange': PropTypes.func.isRequired,
	'handleNewValue': PropTypes.func.isRequired,
	'onSelectItemName': PropTypes.func.isRequired,
	'newReusableItem': PropTypes.objectOf(PropTypes.any),
	'reusableItem': PropTypes.objectOf(PropTypes.any),
	'reusableItems': PropTypes.objectOf(PropTypes.any),
	'topTenItemForReusableItem': PropTypes.objectOf(PropTypes.any),
};

export default Item;
