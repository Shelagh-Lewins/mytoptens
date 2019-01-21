import React, { Component } from 'react';
import { Container, Row, Col, Label, Input } from 'reactstrap';
import ItemsList from '../components/ItemsList';

import { MAX_ITEMS_IN_LIST } from '../constants';
import './ItemsPage.scss';
import Item from './Item';

class ItemsPage extends Component {
	constructor(props) {
		super(props);

		this.state = {};

		// set up the state to hold each item's title and description
		// coded by order
		// this is messy but keeps state flat
		for (let i=1; i<= MAX_ITEMS_IN_LIST; i++) {
			this.state[`${i}_title`] = '';
			this.state[`${i}_description`] = '';
		}

		// fill in whatever items exist
		const items = this.props.items;

		Object.keys(items).forEach((key) => {
			if (items[key].order && items[key].order <= MAX_ITEMS_IN_LIST) {
				const order = items[key].order;
				const title = items[key].title;
				const description = items[key].description;

				this.state[`${order}_title`] = title;
				this.state[`${order}_description`] = description;
			}
		});
	}

	onTitleChange = (e) => {
		this.setState({ 'title': e.target.value });
	}

	onDescriptionChange = (e) => {
		this.setState({ 'description': e.target.value });
	}

	resetForm() {
		this.setState({
			'showNewItemForm': false,
			'title': '',
			'description': ''
		});
	}

	handleInputChange = (e) => {
		this.setState({
			[e.target.dataset.state]: e.target.value
		});
	}

	onCreateItem = (e) => {
		e.preventDefault();

		// find the next available position in the list
		const orders = this.props.items.map((item) => parseInt(item.order));
		orders.sort(function(a, b){return a - b;});
		let order;

		for (let i=1; i<=MAX_ITEMS_IN_LIST; i++) {
			if (orders.indexOf(i) === -1) {
				order = i;
				break;
			}
		}

		if (!order) {
			return; // the list is full
		}

		this.props.onCreateItem({
			'title': this.state.title,
			'description': this.state.description,
			'list': this.props.list,
			order, 
		});
		this.resetForm();
	}

	toggleForm = () => {
		this.setState({ 'showNewItemForm': !this.state.showNewItemForm });
	}

	renderItemsList() {
		let elements = [];
		for (let i=1; i<=MAX_ITEMS_IN_LIST; i++) {
			const titleIdentifier = `${i}_title`;
			const descriptionIdentifier = `${i}_description`;
			elements.push(
				<Row key={`item${i}`}>
					<Col>
						<Item
							key={`item${i}`}
							item={{ 'order': i, 'title': this.state[titleIdentifier], 'description': this.state[descriptionIdentifier] }}
							onDeleteItem={this.props.onDeleteItem}
							handleInputChange={ this.handleInputChange }
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

export default ItemsPage;
