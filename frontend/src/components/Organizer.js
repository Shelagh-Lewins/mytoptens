// Displays the user's lists and items
// Allows the parent item of a list to be changed

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';

import * as listsReducer from '../modules/list';

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

				console.log('parent_list ', parent_list);

				
			}
		}
	}

	getOrganizerData = () => {
		// minimal data for all my lists and items to allow parent list to be changed.
		this.props.dispatch(listsReducer.fetchOrganizerData());
	}

	onClickOrganize = () => {
		const showOrganizer = !this.state.showOrganizer;
		this.setState({
			'showOrganizer': showOrganizer,
		});
	}

	renderLists() {
		return (
			<p>Some content. List id {this.props.list.id}</p>
		);
	}

	render() {
		// show current parent list
		// then all others
		// by top level?
		// should there be a Cancel button?
		let organizeButtonText = 'Organize...';

		if (this.state.showListOrganizer) {
			organizeButtonText = 'Hide organizer';
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
				{this.state.showOrganizer && this.renderLists()}
			</div>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
	return ({
		'listData': state.list.organizerData, // limited list info: id, name, item (array of child items), parent_item
		'itemData': state.item.listOrganizerData, // limited item info: id, name, list_id
	});
};

export default connect(mapStateToProps)(Organizer);
