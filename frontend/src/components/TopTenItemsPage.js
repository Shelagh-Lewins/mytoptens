import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';
import PropTypes from 'prop-types';

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
		for (let i = 1; i <= MAX_TOPTENITEMS_IN_TOPTENLIST; i += 1) {
			this.state[`${i}_name`] = '';
			this.state[`${i}_description`] = '';
		}

		// build the topTenItems
		// each topTenItem's order and the field to update are coded in the 'state' data e.g. '1_name'
		const { topTenItems } = this.props;

		Object.keys(topTenItems).forEach((key) => {
			if (topTenItems[key].order && topTenItems[key].order <= MAX_TOPTENITEMS_IN_TOPTENLIST) {
				const { order } = topTenItems[key];
				console.log('constructor. topTenItem', topTenItems[key]);
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

	componentDidUpdate(prevProps) {
		const update = {};
		// console.log('topTenItemsPage update', this.props);
		const { topTenItems } = this.props;
		for (let i = 0; i < topTenItems.length; i += 1) {
			const topTenItem = topTenItems[i];
			console.log('update. topTenItem', topTenItem);

			// first the topTenList is loaded and this just gives ids
			// only when the full data are loaded and getTopTenItemsForTopTenList recalculated do we find the childTopTenList
			/* if (prevProps.topTenItems[i].reusableItem !== topTenItems[i].reusableItem) {
				console.log('new reusable item id for ', i);
			} */
			if (prevProps.topTenItems[i].id !== topTenItems[i].id
				|| prevProps.topTenItems[i].childTopTenList !== topTenItems[i].childTopTenList
				|| prevProps.topTenItems[i].reusableItem !== topTenItems[i].reusableItem) {
				const { order } = topTenItem;

				// update topTenItem properties
				update[`${order}_id`] = topTenItem.id;
				update[`${order}_name`] = topTenItem.name;
				update[`${order}_description`] = topTenItem.description;
				update[`${order}_name_reusableItemId`] = topTenItem.reusableItem;
				// update[`${order}_name_reusableItemId`] = topTenItems[topTenItem.id].reusableItem;

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

	onMoveTopTenItemUp = (topTenItemId) => {
		const { dispatch } = this.props;

		dispatch(topTenItemsReducer.moveTopTenItemUp({ topTenItemId }));
	}


	onMoveTopTenItemDown = (topTenItemId) => {
		const { dispatch } = this.props;

		dispatch(topTenItemsReducer.moveTopTenItemDown({ topTenItemId }));
	}

	// user selects an item name from a dropdown list. This can be to use text directly, or to use or create a ReusableItem
	onSelectItemName(e, widgetId) {
		// we expect a widgetId like 1_name, 2_name
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
					[`${widgetId}_newReusableItem`]: false,
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
					[`${widgetId}_newReusableItem`]: false,
					[`${widgetId}_reusableItemId`]: undefined,
					[`${widgetId}_topTenItemForNewReusableItem`]: undefined,
				});
		}
	}

	handleInputChange = (e) => {
		this.setState({
			[e.target.dataset.state]: e.target.value,
		});
	}

	handleNewValue = (element) => {
		const { dispatch } = this.props;
		const { state } = this;
		const topTenItemId = element.dataset.entityid;

		// the topTenItem's order and the field to update are coded in the 'state' data e.g. '1_name'
		const identifiers = element.dataset.state.split('_');
		const order = identifiers[0];
		const propertyName = identifiers[1];
		const { value } = element;

		// if name is deleted, then description will also be removed
		if (propertyName === 'name') {
			if (value === '') {
				if (confirm('Do you want to delete this item?')) { // eslint-disable-line no-restricted-globals
					const data = {
						'name': value,
						'description': '',
						'reusableItem_id': null,
					};
					dispatch(topTenItemsReducer.updateTopTenItem(topTenItemId, data));
					this.setState({
						[`${order}_description`]: '',
						[`${order}_name_reusableItem_id`]: undefined,
					});
				}
				return;
			}

			const newReusableItem = state[`${order}_name_newReusableItem`];
			const topTenItemForNewReusableItem = state[`${order}_name_topTenItemForNewReusableItem`];
			const reusableItemId = state[`${order}_name_reusableItemId`];
			const definition = state[`${order}_name_definition`];
			const link = state[`${order}_name_link`];

			const data = {
				'name': value,
			};

			if (reusableItemId) {
				data.reusableItem_id = reusableItemId;
			} else {
				data.reusableItem_id = null;

				if (newReusableItem) {
					data.newReusableItem = true;
					// base the reusableItem on an existing topTenItem
					if (topTenItemForNewReusableItem) {
						data.topTenItemForNewReusableItem = topTenItemForNewReusableItem;
					}
					data.reusableItemDefinition = definition;
					data.reusableItemLink = link;
					// make the reusableItem from scratch from a text name
				}
			}

			dispatch(topTenItemsReducer.updateTopTenItem(topTenItemId, data));
			return;
		}

		dispatch(topTenItemsReducer.updateTopTenItem(topTenItemId, { [propertyName]: value }));
	}

	toggleForm = () => {
		const { showNewTopTenItemForm } = this.state;

		this.setState({ 'showNewTopTenItemForm': !showNewTopTenItemForm });
	}

	// user types in an item name combobox.
	handleComboboxChange(e, widgetId) {
		const { dispatch } = this.props;

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

				dispatch(reusableItemReducer.suggestReusableItems(e, widgetId));
			}
		}, 300);
	}

	renderTopTenItemsList() {
		const elements = [];
		for (let i = 1; i <= MAX_TOPTENITEMS_IN_TOPTENLIST; i += 1) {
			const {
				dispatch,
				topTenList,
				onCreateChildTopTenList,
				reusableItems,
				reusableItemSuggestions,
				topTenItems, // top ten items direct from store
			} = this.props;

			const { state } = this;

			const identifier = `${i}_name`;
			const name = state[`${i}_name`];

			if (name || topTenList.canEdit) {
				// has the user selected an existing topTenItem?
				const topTenItemId = state[`${identifier}_topTenItemForNewReusableItem`];
				// console.log('name', name);
				// console.log('check topTenItemId', topTenItemId);


				let newReusableItem;
				let topTenItem;
				let reusableItem;
				const reusableItemSuggestionsForName = reusableItemSuggestions[`${i}_name`];

				// create a new reusableItem based on the name the user typed
				if (state[`${identifier}_newReusableItem`]) {
					// console.log('name', name);
					// console.log('new reusable item true');
					newReusableItem = { 'name': state[`${identifier}`] };

					if (topTenItemId) { // create a new reusableItem to share with the selected topTenItem
						// console.log('name', name);
						// console.log('new reusable from tti');
						topTenItem = reusableItemSuggestionsForName.find(item => item.id === topTenItemId);
					}
				} else {
					// use an existing reusableItem
					const reusableItemId = state[`${identifier}_reusableItemId`];

					if (reusableItemId) {
						if (reusableItemSuggestionsForName) {
							reusableItem = reusableItemSuggestionsForName.find(item => item.id === reusableItemId);
						} else {
							reusableItem = reusableItems[state[`${identifier}_reusableItemId`]];
						}
					}
				}

				elements.push(
					<Row key={`topTenItem${i}`}>
						<Col>
							<TopTenItem
								key={`topTenItem${i}`}
								topTenItem={{
									'id': state[`${i}_id`],
									'order': i,
									'name': name,
									'description': state[`${i}_description`],
									'childTopTenList': state[`${i}_childTopTenList`],
									'reusableItem': state[`${i}_name_reusableItemId`],
								}}
								dispatch={dispatch}
								topTenItemFromStore={topTenItems[i - 1]}
								handleInputChange={this.handleInputChange}
								handleComboboxChange={this.handleComboboxChange}
								handleNewValue={this.handleNewValue}
								onSelectItemName={this.onSelectItemName}
								topTenList={topTenList}
								canEdit={topTenList.canEdit}
								onCreateChildTopTenList={onCreateChildTopTenList}
								onMoveTopTenItemUp={this.onMoveTopTenItemUp}
								onMoveTopTenItemDown={this.onMoveTopTenItemDown}
								reusableItemSuggestions={reusableItemSuggestions}
								newReusableItem={newReusableItem}
								reusableItem={reusableItem}
								reusableItems={reusableItems}
								topTenItemForReusableItem={topTenItem}
							/>
						</Col>
					</Row>,
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

TopTenItemsPage.propTypes = {
	'dispatch': PropTypes.func.isRequired,
	'onCreateChildTopTenList': PropTypes.func.isRequired,
	'reusableItems': PropTypes.objectOf(PropTypes.any),
	'reusableItemSuggestions': PropTypes.objectOf(PropTypes.any),
	'topTenItems': PropTypes.arrayOf(PropTypes.any),
	'topTenList': PropTypes.objectOf(PropTypes.any).isRequired,
};

export default connect()(TopTenItemsPage);
