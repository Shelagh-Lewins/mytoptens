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
	}

	getOrganizerData = () => {
		// minimal data for all my lists and items to allow parent list to be changed.
		this.props.dispatch(listReducer.fetchOrganizerData());
	}

	onClickOrganize = () => {
		const showOrganizer = !this.state.showOrganizer;
		this.setState({
			'showOrganizer': showOrganizer,
		});
	}

	renderParentList() {
		console.log('props ', this.props);

		let content;

		if (this.props.parentList) {
			content = (
				<div className="parent-list">
					<span>Current parent list: </span>
					<OrganizerList
						list={this.props.parentList}
						items={this.props.itemData[this.props.parentList.id]}
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
		return (
			<div className="lists">
				{this.props.listData.map(list =>
					<OrganizerList
						list={list}
						key={list.id}
						items={this.props.itemData[list.id]}
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
		let organizeButtonText = 'Organize...';

		if (this.state.showOrganizer) {
			organizeButtonText = 'Done';
		}

		return (
			<div className="list-organizer">
				<Row>
					<Col>
						<div className="change-parent-list">
							<button className="btn btn-secondary" onClick={this.onClickOrganize.bind(this)}>{organizeButtonText}</button>
						</div>
					</Col>
				</Row>
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
