import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';

import * as topTenItemsReducer from '../modules/topTenItem';

import { MAX_TOPTENITEMS_IN_TOPTENLIST } from '../constants';
import TopTenItem from './TopTenItem';

class TopTenItemsPage extends Component {
	constructor(props) {
		super(props);

		this.state = {};

		// set up the state to hold each topTenItem's name and description
		// coded by order
		// this is not elegant but keeps state flat
		for (let i=1; i<= MAX_TOPTENITEMS_IN_TOPTENLIST; i++) {
			this.state[`${i}_name`] = '';
			this.state[`${i}_description`] = '';
		}

		// build the topTenItems
		// each topTenItem's order and the field to update are coded in the 'state' data e.g. '1_name'
		const topTenItems = this.props.topTenItems;

		Object.keys(topTenItems).forEach((key) => {
			if (topTenItems[key].order && topTenItems[key].order <= MAX_TOPTENITEMS_IN_TOPTENLIST) {
				const order = topTenItems[key].order;

				this.state[`${order}_id`] = topTenItems[key].id;
				this.state[`${order}_name`] = topTenItems[key].name;
				this.state[`${order}_description`] = topTenItems[key].description;

				// child topTenLists
				if (topTenItems[key].childTopTenList) {
					this.state[`${order}_childTopTenList`] = topTenItems[key].childTopTenList;
				}

				// reusableItem
				if (topTenItems[key].reusableItem) {
					this.state[`${order}_reusableItem`] = topTenItems[key].reusableItem;
				}
			}
		});
	}

	onMoveTopTenItemUp = (topTenItemId) => {
		this.props.dispatch(topTenItemsReducer.moveTopTenItemUp({ topTenItemId }));
	}

	onMoveTopTenItemDown = (topTenItemId) => {
		this.props.dispatch(topTenItemsReducer.moveTopTenItemDown({ topTenItemId }));
	}

	componentDidUpdate(prevProps) {
		let update = {};
		for (let i=0; i<this.props.topTenItems.length; i++) {
			const topTenItem = this.props.topTenItems[i];

			// first the topTenList is loaded and this just gives ids
			// only when the full data are loaded and getTopTenItemsForTopTenList recalculated do we find the childTopTenList
			if (prevProps.topTenItems[i].id !== this.props.topTenItems[i].id ||
				prevProps.topTenItems[i].childTopTenList !== this.props.topTenItems[i].childTopTenList) {
				const order = topTenItem.order;

				// update topTenItem properties
				update[`${order}_id`] = topTenItem.id;
				update[`${order}_name`] = topTenItem.name;
				update[`${order}_description`] = topTenItem.description;

				// set child topTenList if exists
				// or set to null if it does not
				update[`${order}_childTopTenList`] = topTenItem.childTopTenList;
			}
		}
		// only setState if there is a change to make
		// otherwise it triggers endless updates
		if (Object.keys(update).length > 0) {
			this.setState(update);
		}
	}

	handleInputChange = (e) => {
		this.setState({
			[e.target.dataset.state]: e.target.value,
		});
	}

	handleNewValue = (element) => {
		const topTenItemId = element.dataset.entityid;

		// the topTenItem's order and the field to update are coded in the 'state' data e.g. '1_name'
		const identifiers = element.dataset.state.split('_');
		const propertyName = identifiers[1];
		const value = element.value;

		// if name is deleted, then description will also be removed
		if (propertyName === 'name' && value === '') {
			if (confirm('Do you want to delete this item?')) {// eslint-disable-line no-restricted-globals
				this.props.dispatch(topTenItemsReducer.updateTopTenItem(topTenItemId, propertyName, value));
				this.props.dispatch(topTenItemsReducer.updateTopTenItem(topTenItemId, 'description', ''));
				this.setState({
					[`${identifiers[0]}_description`]: '',
				});
			}
			return;
		}

		this.props.dispatch(topTenItemsReducer.updateTopTenItem(topTenItemId, propertyName, value));
	}

	toggleForm = () => {
		this.setState({ 'showNewTopTenItemForm': !this.state.showNewTopTenItemForm });
	}

	renderTopTenItemsList() {
		let elements = [];
		for (let i=1; i<=MAX_TOPTENITEMS_IN_TOPTENLIST; i++) {
			const name = this.state[`${i}_name`];
			const canEdit = this.props.canEdit;
			if (name || canEdit) {
				elements.push(
					<Row key={`topTenItem${i}`}>
						<Col>
							<TopTenItem
								key={`topTenItem${i}`}
								topTenItem={{
									'id': this.state[`${i}_id`],
									'order': i,
									'name': name,
									'description': this.state[`${i}_description`],
									'childTopTenList': this.state[`${i}_childTopTenList`],
									'reusableItem': this.state[`${i}_reusableItem`],
									 }}
								handleInputChange={this.handleInputChange}
								handleNewValue={this.handleNewValue}
								topTenList={this.props.topTenList}
								canEdit={canEdit}
								onCreateChildTopTenList={this.props.onCreateChildTopTenList}
								onMoveTopTenItemUp={this.onMoveTopTenItemUp}
								onMoveTopTenItemDown={this.onMoveTopTenItemDown}
							/>
						</Col>
					</Row>
				);
			}
		}
		return elements;
	}

	render() {
		return (
			<div className="topTenItems-list">
				{this.renderTopTenItemsList()}
			</div>
		);
	}
}

export default connect()(TopTenItemsPage);
