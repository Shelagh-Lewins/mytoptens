import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';

import * as topTenItemsReducer from '../modules/topTenItem';
import * as reusableItemReducer from '../modules/reusableItem';

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

				// when editing, to create new reusableItem
				this.state[`${order}_newReusableItem`] = false;
				this.state[`${order}_topTenItemId`] = undefined;
			}
		});

		this.handleItemNameChange = this.handleItemNameChange.bind(this);
		this.onSelectItemName = this.onSelectItemName.bind(this);
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

	handleInputChange = (e, comboboxId) => {
		console.log('handleInputChange', e, comboboxId);
		this.setState({
			[e.target.dataset.state]: e.target.value,
		});
	}

	// handleNewValue = (topTenItemId, elementId, value) => {
	handleNewValue = (element) => {
		console.log('handleNewValue', topTenItemId);
		const topTenItemId = element.dataset.entityid;

		// the topTenItem's order and the field to update are coded in the 'state' data e.g. '1_name'
		//const identifiers = elementId.split('_');
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

	// user types in an item name combobox.
	handleItemNameChange(e, widgetId) {
		console.log('handleItemNameChange', e, widgetId);

		clearTimeout(this.itemNameTimeout);
		this.itemNameTimeout = setTimeout(() => {
			if (typeof e === 'string') {
				// the combobox change function fires when an item is selected from the dropdown
				// and the passed event is the selected item - an object - not the entered text
				// so, only update the search string if the user has typed text
				// not if they have made a selection
				//console.log('suggest for ', e);

				// the dropdown list will be rebuilt.
				// We need to remove the selection from state to avoid confusion.
				// value must be selected from list.
				this.setState({
					[`${widgetId}`]: e, // use the entered text directly if the user hasn't made a selection
					[`${widgetId}_reusableItemId`]: undefined,
				});

				this.props.dispatch(reusableItemReducer.suggestReusableItems(e, widgetId));
			}
		}, 300);
	}

	// user selects an item name from a dropdown list. This can be to use text directly, or to use or create a ReusableItem
	onSelectItemName(e, widgetId) {
		console.log('onSelectItemName', e, widgetId);
		const order = parseInt(widgetId); // we expect a form like 1_name which resolves to 1

		this.setState({
			[`${widgetId}`]: e.name,
		});

		switch (e.type) {
			case 'newReusableItem':
				this.setState({
					[`${order}_newReusableItem`]: true,
					[`${order}_reusableItemId`]: undefined,
					[`${order}_topTenItemForNewReusableItem`]: undefined,
				});
				break;

			case 'reusableItem':
				this.setState({
					[`${order}_newReusableItem`]: undefined,
					[`${order}_reusableItemId`]: e.id,
					[`${order}_topTenItemForNewReusableItem`]: undefined,
				});
				break;

			case 'topTenItem':
				this.setState({
					[`${order}_newReusableItem`]: undefined,
					[`${order}_reusableItemId`]: undefined,
					[`${order}_topTenItemForNewReusableItem`]: e.id,
				});
				break;

			default:
				this.setState({
					[`${order}_newReusableItem`]: undefined,
					[`${order}_reusableItemId`]: undefined,
					[`${order}_topTenItemForNewReusableItem`]: undefined,
				});
		}
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
				// has the user selected an existing topTenItem?
				const topTenItemId = this.state[`${i}_topTenItemForNewReusableItem`];

				let newReusableItem;
				let topTenItem;
				let reusableItem;
				const reusableItemSuggestions = this.props.reusableItemSuggestions[`${i}_name`];

				// create a new reusableItem based on the name the user typed
				if (this.state[`${i}_newReusableItem`]) {
					newReusableItem = { 'name': this.state[`${i}_name`] };
				} else 	if (topTenItemId) { // create a new reusableItem to share with the selected topTenItem
					topTenItem = reusableItemSuggestions.find(item => item.id === topTenItemId);
				} else {
					// use an existing reusableItem
					const reusableItemId = this.state[`${i}_reusableItemId`];

					if (reusableItemId) {
						reusableItem = reusableItemSuggestions.find(item => item.id === reusableItemId);
					}
				}

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
									'reusableItem': this.state[`${i}_reusableItemId`],
								}}
								handleInputChange={this.handleInputChange}
								handleItemNameChange={this.handleItemNameChange}
								handleNewValue={this.handleNewValue}
								onSelectItemName={this.onSelectItemName}
								topTenList={this.props.topTenList}
								canEdit={canEdit}
								onCreateChildTopTenList={this.props.onCreateChildTopTenList}
								onMoveTopTenItemUp={this.onMoveTopTenItemUp}
								onMoveTopTenItemDown={this.onMoveTopTenItemDown}
								reusableItemSuggestions={this.props.reusableItemSuggestions}
								newReusableItem={newReusableItem}
								reusableItem={reusableItem}
								topTenItemForReusableItem={topTenItem}
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
