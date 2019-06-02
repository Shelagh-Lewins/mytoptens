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
					this.state[`${order}_name_reusableItemId`] = topTenItems[key].reusableItem;
				}

				// when editing, to create new reusableItem
				this.state[`${order}_name_newReusableItem`] = false;
				this.state[`${order}_name_topTenItemId`] = undefined;
			}
		});

		this.handleComboboxChange = this.handleComboboxChange.bind(this);
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

	handleInputChange = (e) => {
		this.setState({
			[e.target.dataset.state]: e.target.value,
		});
	}

	handleNewValue = (element) => {
		const topTenItemId = element.dataset.entityid;


		// the topTenItem's order and the field to update are coded in the 'state' data e.g. '1_name'
		//const identifiers = elementId.split('_');
		const identifiers = element.dataset.state.split('_');
		const order = identifiers[0];
		const propertyName = identifiers[1];
		const value = element.value;

		// if name is deleted, then description will also be removed
		if (propertyName === 'name') {
			if (value === '') {
				if (confirm('Do you want to delete this item?')) {// eslint-disable-line no-restricted-globals
					const data = {
						'name': value,
						'description': '',
						'reusableItem_id': null,
					};
					this.props.dispatch(topTenItemsReducer.updateTopTenItem(topTenItemId, data));
					this.setState({
						[`${order}_description`]: '',
						[`${order}_name_reusableItem_id`]: undefined,
					});
				}
				return;
			} else {
				// const name = this.state[`${order}_name`];
				const newReusableItem = this.state[`${order}_name_newReusableItem`];
				const topTenItemForNewReusableItem = this.state[`${order}_name_topTenItemForNewReusableItem`];
				const reusableItemId = this.state[`${order}_name_reusableItemId`];
				const definition = this.state[`${order}_name_definition`];
				const link = this.state[`${order}_name_link`];

				const data = {
					'name': value,
				};

				if (reusableItemId) { // 
					data.reusableItem_id = reusableItemId;
				} else {
					data.reusableItem_id = null;

					if (newReusableItem) {
						data.newReusableItem = true;
						// base the reusableItem on an existing topTenItem
						if (topTenItemForNewReusableItem) {
							data.topTenItemForNewReusableItem = topTenItemForNewReusableItem;
							// use the topTenItem name
						} else {
							// use the entered name text
						}
						data.reusableItemDefinition = definition;
						data.reusableItemLink = link;
						// make the reusableItem from scratch from a text name
					}
				}

				this.props.dispatch(topTenItemsReducer.updateTopTenItem(topTenItemId, data));

				return;
			}
		}

		this.props.dispatch(topTenItemsReducer.updateTopTenItem(topTenItemId, { [propertyName]: value }));
	}

	// user types in an item name combobox.
	handleComboboxChange(e, widgetId) {
		clearTimeout(this.itemNameTimeout);
		this.itemNameTimeout = setTimeout(() => {
			if (typeof e === 'string') {
				// the combobox change function fires when an item is selected from the dropdown
				// and the passed event is the selected item - an object - not the entered text
				// so, only update the search string if the user has typed text
				// not if they have made a selection

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
		// we expect a widgetId like 1_name, 2_name
console.log('onSelectItemName', e, widgetId);
		this.setState({
			[`${widgetId}`]: e.name,
		});

		switch (e.type) {
			case 'newReusableItem':
				this.setState({
					[`${widgetId}_newReusableItem`]: true,
					[`${widgetId}_reusableItemId`]: undefined,
					[`${widgetId}_topTenItemForNewReusableItem`]: undefined,
				});
				break;

			case 'reusableItem':
				this.setState({
					[`${widgetId}_newReusableItem`]: undefined,
					[`${widgetId}_reusableItemId`]: e.id,
					[`${widgetId}_topTenItemForNewReusableItem`]: undefined,
				});
				break;

			case 'topTenItem':
				this.setState({
					[`${widgetId}_newReusableItem`]: true,
					[`${widgetId}_reusableItemId`]: undefined,
					[`${widgetId}_topTenItemForNewReusableItem`]: e.id,
				});
				break;

			default:
				this.setState({
					[`${widgetId}_newReusableItem`]: undefined,
					[`${widgetId}_reusableItemId`]: undefined,
					[`${widgetId}_topTenItemForNewReusableItem`]: undefined,
				});
		}
	}

	toggleForm = () => {
		this.setState({ 'showNewTopTenItemForm': !this.state.showNewTopTenItemForm });
	}

	renderTopTenItemsList() {
		let elements = [];
		for (let i=1; i<=MAX_TOPTENITEMS_IN_TOPTENLIST; i++) {
			const identifier = `${i}_name`;
			const name = this.state[`${i}_name`];

			const canEdit = this.props.canEdit;
			if (name || canEdit) {
				// has the user selected an existing topTenItem?
				const topTenItemId = this.state[`${identifier}_topTenItemForNewReusableItem`];

				let newReusableItem;
				let topTenItem;
				let reusableItem;
				const reusableItemSuggestions = this.props.reusableItemSuggestions[`${i}_name`];

				// create a new reusableItem based on the name the user typed
				if (this.state[`${identifier}_newReusableItem`]) {
					newReusableItem = { 'name': this.state[`${identifier}`] };
				} else 	if (topTenItemId) { // create a new reusableItem to share with the selected topTenItem
					topTenItem = reusableItemSuggestions.find(item => item.id === topTenItemId);
				} else {
					// use an existing reusableItem
					const reusableItemId = this.state[`${identifier}_reusableItemId`];

					if (reusableItemId) {
						if (reusableItemSuggestions) {
							reusableItem = reusableItemSuggestions.find(item => item.id === reusableItemId);
						} else {
							reusableItem = this.props.reusableItems[this.state[`${identifier}_reusableItemId`]];
						}
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
									'reusableItem': this.state[`${i}_name_reusableItemId`],
								}}
								handleInputChange={this.handleInputChange}
								handleComboboxChange={this.handleComboboxChange}
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
