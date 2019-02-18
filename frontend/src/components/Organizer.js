// Displays the user's lists and items
// Allows the parent item of a list to be changed

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';

import * as listReducer from '../modules/list';
//import * as itemReducer from '../modules/item';

import OrganizerList from './OrganizerList';

import './Organizer.scss';

class Organizer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'showOrganizer': false,
			'parentItemId': props.list.parent_item,
			'parentListId': props.parentListId,
			'selectedItemOrder': undefined,
		};

		//this.getOrganizerData();
	}

	componentDidUpdate = (prevProps) => {
		if (prevProps.listOrganizerData.length === 0 && this.props.listOrganizerData.length !== 0) {

			this.setState({
				'selectedItemOrder': this.selectedItemOrder(),
			});
		}
	}

	/* getOrganizerData = () => {
		// minimal data for all my lists and items to allow parent list to be changed.
		this.props.dispatch(listReducer.fetchOrganizerData());
	} */

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

		if (this.state.parentListId) {
			let parentItemId = this.state.parentItemId;
			//const parentList = this.props.listOrganizerData[this.state.parentListId];
			const parentList = this.props.listOrganizerData.find(list => list.id === this.state.parentListId);
			let parentListItems = parentList.item;
			order = parentListItems.indexOf(parentItemId) + 1;
		}

		if (this.state.parentItem) {

		}

		return order;
	}

	renderLists() {
		return (
			<div className="lists">
				<span>Select a new parent: </span>
				{this.props.listOrganizerData.map(list => {
					const showItems = list.id === this.state.parentListId ? true : false;

					return (<OrganizerList
						list={list}
						listOrganizerData={this.props.listOrganizerData}
						itemOrganizerData={this.props.itemOrganizerData}
						key={list.id}
						selectedListId={this.state.parentListId}
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
		// by top level?
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

/* const mapStateToProps = (state, ownProps) => {
	return ({
		'listOrganizerData': listReducer.getOrganizerLists(state), // array. limited list info: id, name, item (array of child items), parent_item
		'itemOrganizerData': itemReducer.getOrganizerItemsByList(state), // object. limited item info: id, name, list_id
	});
}; */

export default connect()(Organizer);
// export default connect(mapStateToProps)(Organizer);
