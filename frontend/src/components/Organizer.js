// Displays the user's lists and items
// Allows the parent item of a list to be changed

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';

import * as listReducer from '../modules/list';
import * as itemReducer from '../modules/item';

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

		this.getOrganizerData();
	}

	componentDidUpdate = (prevProps) => {
		if (prevProps.listData.length === 0 && this.props.listData !== 0) {
			this.setState({
				'selectedItemOrder': this.selectedItemOrder(),
			});
		}
	}

	getOrganizerData = () => {
		// minimal data for all my lists and items to allow parent list to be changed.
		this.props.dispatch(listReducer.fetchOrganizerData());
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

		if (this.state.parentListId) {
			let parentItemId = this.state.parentItemId;
			//const parentList = this.props.listData[this.state.parentListId];
			const parentList = this.props.listData.find(list => list.id === this.state.parentListId);
			let parentListItems = parentList.item;
			order = parentListItems.indexOf(parentItemId) + 1;
		}

		if (this.state.parentItem) {

		}

		return order;
	}

	/* renderParentList() {
		let content;
		const parentListId = this.state.parentListId;

		if (parentListId) {
			const parentList = this.props.listData.find(list => list.id === parentListId);

			if (parentList) { // make sure data are loaded
				content = (
					<div className="parent-list">
						<span>Current parent: </span>
						<OrganizerList
							list={parentList}
							items={this.props.itemData[parentListId]}
							showItems={true}
							selectedListId={parentListId}
							selectedItemOrder={this.state.selectedItemOrder}
							onSelectItem={this.onSelectParentItem.bind(this)}
						/>
					</div>
				);
			}
		}

		return (
			<div className="parent-list">
				{content}
			</div>
		);
	} */

	renderLists() {
		return (
			<div className="lists">
				<span>Select a new parent: </span>
				{this.props.listData.map(list => {
					const showItems = list.id === this.state.parentListId ? true : false;

					return (<OrganizerList
						list={list}
						items={this.props.itemData[list.id]}
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
		// show current parent list
		// then all others
		// by top level?
		// should there be a Cancel button?
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
				{/* {this.state.showOrganizer && this.props.list.parent_item && this.renderParentList()}*/}
				{this.state.showOrganizer && this.renderLists()}
			</div>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
	return ({
		'listData': listReducer.getOrganizerLists(state), // array. limited list info: id, name, item (array of child items), parent_item
		'itemData': itemReducer.getOrganizerItemsByList(state), // object. limited item info: id, name, list_id
	});
};

export default connect(mapStateToProps)(Organizer);
