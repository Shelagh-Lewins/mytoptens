// Displays the user's lists and items
// Allows the parent item of a list to be changed

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';

import * as listReducer from '../modules/list';

import OrganizerList from './OrganizerList';
import './Organizer.scss';

class Organizer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'showOrganizer': false,
			'parentItemId': props.list.parent_item,
			'parentListId': props.parentListId,
			'selectedItemChildListId': null,
			'selectedItemOrder': null,
		};

		this.onSelectParentItem = this.onSelectParentItem.bind(this);
		this.onClickCancel = this.onClickCancel.bind(this);
		this.onClickDone = this.onClickDone.bind(this);
		this.onClickOrganize = this.onClickOrganize.bind(this);
	}

	componentDidUpdate = (prevProps) => {
		//console.log('Oganizer. parentItemId ', this.props.list.parent_item);
		//console.log('Organizer. parentListId ', this.props.parentListId);
		// just loaded
		if ((prevProps.listOrganizerData.length === 0 && this.props.listOrganizerData.length !== 0) ||
			(prevProps.list.parent_item !== this.props.list.parent_item)) { // navigated to new list
			this.setState({
				'parentListId': this.props.parentListId,
				'selectedItemOrder': this.selectedItemOrder(),
			});
		}
	}

	onClickOrganize = () => {
		this.setState({
			'showOrganizer': true,
		});
	}

	onClickCancel = () => {
		this.setState({
			'showOrganizer': false,
		});
	}

	onClickDone = () => {
		this.setState({
			'showOrganizer': false,
		});

		if (this.state.selectedItemChildListId === this.state.parentItemId) {
			return;
		}

		console.log('selectedItemChildListId ', this.state.selectedItemChildListId);
		console.log('current parent ', this.state.parentItemId);
		if (this.state.selectedItemChildListId) {
			const childList = this.props.listOrganizerData.find((list) => list.id === this.state.selectedItemChildListId);
			if (confirm(`The existing child list '${childList.name}' will become a top level list. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
				this.setParentItem();
			}
			return;
		}

		this.setParentItem();
	}

	setParentItem() {
		this.props.dispatch(listReducer.updateList(
			this.props.list.id,
			'parent_item_id',
			this.state.parentItemId));
	}

	onSelectParentItem = ({ list, order, childListId }) => {
		this.setState({
			'parentItemId': list.item[order-1],
			'parentListId': list.id,
			'selectedItemChildListId': childListId,
			'selectedItemOrder': order,
		});
	}

	selectedItemOrder() {
		// find the order of the parent item
		let order; // there may not be a parent item, so there may not be a default selection
		console.log('Organizer. selectedItemOrder. parentListId ', this.props.parentListId);
		if (this.props.parentListId) {
			let parentItemId = this.state.parentItemId;
			const parentList = this.props.listOrganizerData.find(list => list.id === this.props.parentListId);
			let parentListItems = parentList.item;

			order = parentListItems.indexOf(parentItemId);

			if (order !== -1) { // item is found
				order += 1;
			}
		}

		return order;
	}

	renderLists() {
		return (
			<div className="lists">
				<div className="inner-tube">
					<span>Select a new parent item for this list: </span>
					{this.props.listOrganizerData.map(list => {
						const numberOfItems = this.props.itemOrganizerData[list.id].length;
						const showItems = (list.id === this.state.parentListId);
						//console.log('number of items ', this.props.itemOrganizerData[list.id]);
						//console.log('list ', list.name);
						//console.log('items ', this.props.itemOrganizerData[list.id]);
						
						if (numberOfItems > 0) {
							return (<OrganizerList
								list={list}
								listOrganizerData={this.props.listOrganizerData}
								itemOrganizerData={this.props.itemOrganizerData}
								key={list.id}
								selectedListId={this.state.parentListId}
								selectedItemOrder={this.state.selectedItemOrder}
								onSelectItem={this.onSelectParentItem}
								showItems={showItems}
							/>);
						} else {
							return; // eslint-disable-line array-callback-return
						}
					}
					)}
				</div>
			</div>
		);
	}

	render() {
		let controls;

		if (this.state.showOrganizer) {
			controls = (
				<Row>
					<Col>
						<div className="controls">
							<button className="btn btn-secondary" onClick={this.onClickCancel}>Cancel</button>
							<button className="btn btn-primary" onClick={this.onClickDone}>Done</button>
						</div>
					</Col>
				</Row>);
		} else {
			controls = (
				<Row>
					<Col>
						<div className="controls">
							<button className="btn btn-secondary" onClick={this.onClickOrganize}>Organize...</button>
						</div>
					</Col>
				</Row>);
		}

		return (
			<div className={`list-organizer ${this.state.showOrganizer ? 'open' : ''}`}>
				{controls}
				{this.state.showOrganizer && this.renderLists()}
			</div>
		);
	}
}

export default connect()(Organizer);
