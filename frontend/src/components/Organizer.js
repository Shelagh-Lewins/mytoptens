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
			'newParentItem': props.list.parent_item,
		};

		this.getOrganizerData();
	}

	componentDidUpdate = (prevProps) => {
		if ((!prevProps.item && !prevProps.list) && (this.props.item && this.props.list)) {
			const parent_item_id = this.props.list.parent_item;

			if (parent_item_id) {
				const parent_item = this.props.item[parent_item_id];
				const parent_list_id = parent_item.list;
				const parent_list = this.props.list[parent_list_id];
			}
		}

		console.log('newParentItem ', this.state.newParentItem);
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
		console.log('parent item ', this.state.newParentItem);
		this.props.dispatch(listReducer.updateList(this.props.list.id, 'parent_item_id', this.state.newParentItem));
	}

	onSelectParentItem = ({ list, order }) => {
		this.setState({
			'newParentItem': list.item[order-1],
		});
	}

	selectedItemOrder() {
		// find the order of the parent item
		let order; // there may not be a parent item, so there may not be a default selection

		if (this.props.parentList) {
			let parentItemId = this.props.list.parent_item;
			let parentListItems = this.props.parentList.item;
			order = parentListItems.indexOf(parentItemId) + 1;
		}

		return order;
	}

	renderParentList() {
		let content;

		if (this.props.parentList) {
			content = (
				<div className="parent-list">
					<span>Current parent: </span>
					<OrganizerList
						list={this.props.parentList}
						items={this.props.itemData[this.props.parentList.id]}
						showItems={true}
						selectedListId={this.props.parentList.id}
						selectedItemOrder={this.selectedItemOrder()}
						onSelectItem={this.onSelectParentItem.bind(this)}
					/>
				</div>
			);
		}

		return (
			<div className="parent-list">
				{content}
			</div>
		);
	}

	renderLists() {
		let parentListId;
		if (this.props.parentList) {
			parentListId = this.props.parentList.id;
		}

		return (
			<div className="lists">
				<span>Select a new parent: </span>
				{this.props.listData.map(list =>
					<OrganizerList
						list={list}
						items={this.props.itemData[list.id]}
						key={list.id}
						selectedListId={parentListId}
						selectedItemOrder={this.selectedItemOrder()}
						onSelectItem={this.onSelectParentItem.bind(this)}
					/>
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
				{this.state.showOrganizer && this.props.list.parent_item && this.renderParentList()}
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
