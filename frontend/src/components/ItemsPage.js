import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col, Label, Input } from 'reactstrap';

import * as items from '../modules/items';

import { MAX_ITEMS_IN_LIST } from '../constants';
import './ItemsPage.scss';
import Item from './Item';

class ItemsPage extends Component {
	constructor(props) {
		super(props);

		this.state = {};

		// set up the state to hold each item's title and description
		// coded by order
		// this is not elegant but keeps state flat
		for (let i=1; i<= MAX_ITEMS_IN_LIST; i++) {
			this.state[`${i}_title`] = '';
			this.state[`${i}_description`] = '';
		}

		// fill in whatever items exist
		const items = this.props.items;

		Object.keys(items).forEach((key) => {
			if (items[key].order && items[key].order <= MAX_ITEMS_IN_LIST) {
				const order = items[key].order;

				this.state[`${order}_id`] = items[key].id;
				this.state[`${order}_title`] = items[key].title;
				this.state[`${order}_description`] = items[key].description;
			}
		});
	}

	handleInputChange = (e) => {
		this.setState({
			[e.target.dataset.state]: e.target.value
		});
	}

	handleNewValue = (e) => {
		const itemId = e.target.dataset.entityid;

		// the item's order and the field to update are coded in the 'state' data e.g. '1_title'
		const identifiers = e.target.dataset.state.split('_');
		const propertyName = identifiers[1];
		const value = e.target.value;

		this.props.dispatch(items.updateItem(itemId, propertyName, value));
	}

	toggleForm = () => {
		this.setState({ 'showNewItemForm': !this.state.showNewItemForm });
	}

	renderItemsList() {
		let elements = [];
		for (let i=1; i<=MAX_ITEMS_IN_LIST; i++) {
			elements.push(
				<Row key={`item${i}`}>
					<Col>
						<Item
							key={`item${i}`}
							item={{
								'id': this.state[`${i}_id`],
								'order': i,
								'title': this.state[`${i}_title`],
								'description': this.state[`${i}_description`],
								 }}
							handleInputChange={this.handleInputChange}
							handleNewValue={this.handleNewValue}
							list={this.props.list}
						/>
					</Col>
				</Row>
			);
		}
		return elements;
	}

	render() {
		return (
			<div className="items-list">
				{this.renderItemsList()}
			</div>
		);
	}
}

export default connect()(ItemsPage);
