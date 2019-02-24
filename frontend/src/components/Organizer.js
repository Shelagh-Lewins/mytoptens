// Displays the user's lists and items
// Allows the parent item of a list to be changed

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';
import ReactDOM from 'react-dom';

import * as listReducer from '../modules/list';

import OrganizerList from './OrganizerList';
import './Organizer.scss';

class Organizer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'showOrganizer': false,
			'parentItemId': props.list.parent_item,
			'parentListId': props.parentListId, // parent list and item are stored in state so a new value can be selected, with the old value still present in props if the user cancels
			'selectedItemChildListId': null,
			'selectedItemOrder': null,
		};

		this.onSelectParentItem = this.onSelectParentItem.bind(this);
		this.onClickCancel = this.onClickCancel.bind(this);
		this.onClickDone = this.onClickDone.bind(this);
		this.onClickOrganize = this.onClickOrganize.bind(this);
	}

	componentDidMount() {
	}

	componentDidUpdate = (prevProps) => {
		// data for new list have loaded
		if ((prevProps.list.parent_item !== this.props.list.parent_item) ||
		// navigated to new list
		(prevProps.listOrganizerData.length === 0 && this.props.listOrganizerData.length !== 0)) {
			this.setState({ // reset component
				'showOrganizer': false,
				'selectedItemOrder': this.selectedItemOrder(),
				'parentItemId': this.props.list.parent_item,
				'parentListId': this.props.parentListId,
			});
		}
	}

	onClickOrganize = () => {
		this.setState({
			'showOrganizer': true,
		});

		setTimeout(() => {
			const DOMNode = ReactDOM.findDOMNode(this); // component parent node
			const element = DOMNode.querySelector('.organizer-list.selected');
			if (element) {
				element.scrollIntoView();
			}
		}, 100);
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

		// Don't allow the user to select an item from the current list.
		// this shouldn't happen as the current list is not displayed in the organizer.
		if (this.state.parentListId === this.props.list.id) {
			return;
		}

		if (!this.state.parentItemId) {
			if (confirm(`'${this.props.list.name}' will become a top level list. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
				this.setParentItem();
			}
			return;
		}

		// if the new parent item already has a child list
		if (this.state.selectedItemChildListId) {
			const childList = this.props.listOrganizerData.find((list) => list.id === this.state.selectedItemChildListId);

			// no change
			if (this.state.parentItemId === this.props.list.parent_item) {
				return;
			} else { // will disconnect the existing child list
				if (confirm(`The child list '${childList.name}' will become a top level list. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
					this.setParentItem();
				}
			}
			return;
		}

		this.setParentItem();
	}

	setParentItem() {
		this.props.dispatch(listReducer.updateList(
			this.props.list.id,
			'parent_item_id',
			this.state.parentItemId));
	}

	onSelectParentItem = ({ list, order, childListId }) => {
		// if the user clicks the selected item, deselect it
		// i.e. make this a top-level list
		if (list.id === this.state.parentListId && list.item[order-1] === this.state.parentItemId) {
			this.setState({
				'parentItemId': null,
				'parentListId': null,
				'selectedItemChildListId': null,
				'selectedItemOrder': null,
			});
		} else {
			this.setState({
				'parentItemId': list.item[order-1],
				'parentListId': list.id,
				'selectedItemChildListId': childListId,
				'selectedItemOrder': order,
			});
		}
	}

	selectedItemOrder() {
		// find the order of the parent item
		let order; // there may not be a parent item, so there may not be a default selection
		if (this.props.parentListId) {
			let parentItemId = this.props.list.parent_item;
			const parentList = this.props.listOrganizerData.find(list => list.id === this.props.parentListId);

			let parentListItems = parentList.item;

			order = parentListItems.indexOf(parentItemId);

			if (order !== -1) { // item is found
				order += 1;
			}
		}

		return order;
	}

	renderLists() {
		return (
			<div className="lists">
				<div className="inner-tube">
					<span>Select a new parent item for this list: </span>
					{this.props.listOrganizerData.map(list => {
						const numberOfItems = this.props.itemOrganizerData[list.id].length;
						
						// only show lists with at least one item
						// and don't show the page list - it can't be its own parent
						if (numberOfItems > 0 && (list.id !== this.props.list.id)) {
							const showItems = (list.id === this.state.parentListId);

							return (<OrganizerList
								list={list}
								listOrganizerData={this.props.listOrganizerData}
								itemOrganizerData={this.props.itemOrganizerData}
								key={list.id}
								selectedListId={this.state.parentListId}
								selectedItemOrder={this.state.selectedItemOrder}
								onSelectItem={this.onSelectParentItem}
								showItems={showItems}
							/>);
						} else {
							return; // eslint-disable-line array-callback-return
						}
					}
					)}
				</div>
			</div>
		);
	}

	render() {
		let controls;

		if (this.state.showOrganizer) {
			controls = (
				<Row>
					<Col>
						<div className="controls">
							<button className="btn btn-secondary" onClick={this.onClickCancel}>Cancel</button>
							<button className="btn btn-primary" onClick={this.onClickDone}>Done</button>
						</div>
					</Col>
				</Row>);
		} else {
			controls = (
				<Row>
					<Col>
						<div className="controls">
							<button className="btn btn-default organize" onClick={this.onClickOrganize}>...</button>
						</div>
					</Col>
				</Row>);
		}

		return (
			<div className={`organizer ${this.state.showOrganizer ? 'open' : ''}`}>
				{controls}
				{this.state.showOrganizer && this.renderLists()}
			</div>
		);
	}
}

export default connect()(Organizer);
