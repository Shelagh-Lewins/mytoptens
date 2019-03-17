import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';

import * as toptenitemsReducer from '../modules/toptenitem';

import { MAX_TOPTENITEMS_IN_TOPTENLIST } from '../constants';
import TopTenItem from './TopTenItem';

class TopTenItemsPage extends Component {
	constructor(props) {
		super(props);

		this.state = {};

		// set up the state to hold each toptenitem's name and description
		// coded by order
		// this is not elegant but keeps state flat
		for (let i=1; i<= MAX_TOPTENITEMS_IN_TOPTENLIST; i++) {
			this.state[`${i}_name`] = '';
			this.state[`${i}_description`] = '';
		}

		// build the toptenitems
		// each toptenitem's order and the field to update are coded in the 'state' data e.g. '1_name'
		const toptenitems = this.props.toptenitems;

		Object.keys(toptenitems).forEach((key) => {
			if (toptenitems[key].order && toptenitems[key].order <= MAX_TOPTENITEMS_IN_TOPTENLIST) {
				const order = toptenitems[key].order;

				this.state[`${order}_id`] = toptenitems[key].id;
				this.state[`${order}_name`] = toptenitems[key].name;
				this.state[`${order}_description`] = toptenitems[key].description;

				// child toptenlists
				if (toptenitems[key].childTopTenList) {
					this.state[`${order}_childTopTenList`] = toptenitems[key].childTopTenList;
				}
			}
		});
	}

	onMoveTopTenItemUp = (toptenitemId) => {
		this.props.dispatch(toptenitemsReducer.moveTopTenItemUp({ toptenitemId }));
	}

	onMoveTopTenItemDown = (toptenitemId) => {
		this.props.dispatch(toptenitemsReducer.moveTopTenItemDown({ toptenitemId }));
	}

	componentDidUpdate(prevProps) {
		let update = {};
		for (let i=0; i<this.props.toptenitems.length; i++) {
			const toptenitem = this.props.toptenitems[i];

			// first the toptenlist is loaded and this just gives ids
			// only when the full data are loaded and getTopTenItemsForTopTenList recalculated do we find the childTopTenList
			if (prevProps.toptenitems[i].id !== this.props.toptenitems[i].id ||
				prevProps.toptenitems[i].childTopTenList !== this.props.toptenitems[i].childTopTenList) {
				const order = toptenitem.order;

				// update toptenitem properties
				update[`${order}_id`] = toptenitem.id;
				update[`${order}_name`] = toptenitem.name;
				update[`${order}_description`] = toptenitem.description;

				// set child toptenlist if exists
				// or set to null if it does not
				update[`${order}_childTopTenList`] = toptenitem.childTopTenList;
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
			[e.target.dataset.state]: e.target.value
		});
	}

	handleNewValue = (element) => {
		const toptenitemId = element.dataset.entityid;

		// the toptenitem's order and the field to update are coded in the 'state' data e.g. '1_name'
		const identifiers = element.dataset.state.split('_');
		const propertyName = identifiers[1];
		const value = element.value;

		this.props.dispatch(toptenitemsReducer.updateTopTenItem(toptenitemId, propertyName, value));
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
					<Row key={`toptenitem${i}`}>
						<Col>
							<TopTenItem
								key={`toptenitem${i}`}
								toptenitem={{
									'id': this.state[`${i}_id`],
									'order': i,
									'name': name,
									'description': this.state[`${i}_description`],
									'childTopTenList': this.state[`${i}_childTopTenList`],
									 }}
								handleInputChange={this.handleInputChange}
								handleNewValue={this.handleNewValue}
								toptenlist={this.props.toptenlist}
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
			<div className="toptenitems-list">
				{this.renderTopTenItemsList()}
			</div>
		);
	}
}

export default connect()(TopTenItemsPage);
