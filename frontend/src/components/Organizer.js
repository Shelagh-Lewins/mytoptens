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
		console.log('constructor');
		this.state = {
			'showOrganizer': false,
			'parentItemId': props.list.parent_item,
			'parentListId': props.parentListId,
			'selectedItemOrder': undefined,
		};
		console.log('parentItemId ', props.list.parent_item);
	}

	componentDidUpdate = (prevProps) => {
		console.log('state ', this.state);
		console.log('update. this.props.list.parent_item ', this.props.list.parent_item);
		console.log('update. this.props.parentItemId ', this.state.parentItemId);
		// just loaded
		if ((prevProps.listOrganizerData.length === 0 && this.props.listOrganizerData.length !== 0) ||
			(prevProps.list.parent_item !== this.props.list.parent_item)) { // navigated to new list

			this.setState({
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

		this.props.dispatch(listReducer.updateList(
			this.props.list.id,
			'parent_item_id',
			this.state.parentItemId));
	}

	onSelectParentItem = ({ list, order }) => {
		this.setState({
			'parentItemId': list.item[order-1],
			'parentListId': list.id,
			'selectedItemOrder': order,
		});
	}

	selectedItemOrder() {
		// find the order of the parent item
		let order; // there may not be a parent item, so there may not be a default selection
		console.log('this.props.listOrganizerData ', this.props.listOrganizerData);
		if (this.props.parentListId) {
			let parentItemId = this.state.parentItemId;
			const parentList = this.props.listOrganizerData.find(list => list.id === this.props.parentListId);
			let parentListItems = parentList.item;

			order = parentListItems.indexOf(parentItemId);

			if (order !== -1) { // item is found
				order += 1;
			}
		}

		console.log('selectedItemOrder ', order);
		return order;
	}

	renderLists() {
		return (
			<div className="lists">
				<span>Select a new parent: </span>
				{this.props.listOrganizerData.map(list => {
					const showItems = (list.id === this.props.parentListId);
					//console.log('list.id ', list.id);
					//console.log('this.props.parentListId ', this.props.parentListId);
					//console.log('showItems ', showItems);

					return (<OrganizerList
						list={list}
						listOrganizerData={this.props.listOrganizerData}
						itemOrganizerData={this.props.itemOrganizerData}
						key={list.id}
						selectedListId={this.props.parentListId}
						selectedItemOrder={this.state.selectedItemOrder}
						onSelectItem={this.onSelectParentItem.bind(this)}
						showItems={showItems}
					/>);
				}
				)}
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
							<button className="btn btn-secondary" onClick={this.onClickCancel.bind(this)}>Cancel</button>
							<button className="btn btn-primary" onClick={this.onClickDone.bind(this)}>Done</button>
						</div>
					</Col>
				</Row>);
		} else {
			controls = (
				<Row>
					<Col>
						<div className="controls">
							<button className="btn btn-secondary" onClick={this.onClickOrganize.bind(this)}>Organize...</button>
						</div>
					</Col>
				</Row>);
		}

		return (
			<div className="list-organizer">
				{controls}
				{this.state.showOrganizer && this.renderLists()}
			</div>
		);
	}
}

export default connect()(Organizer);
