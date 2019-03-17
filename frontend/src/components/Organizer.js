// Displays the user's toptenlists and items
// Allows the parent item of a toptenlist to be changed

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';
import ReactDOM from 'react-dom';

import * as toptenlistReducer from '../modules/toptenlist';

import OrganizerList from './OrganizerList';
import './Organizer.scss';

class Organizer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'showOrganizer': false,
			'parentItemId': props.toptenlist.parent_toptenitem,
			'parentTopTenListId': props.parentTopTenListId, // parent toptenlist and item are stored in state so a new value can be selected, with the old value still present in props if the user cancels
			'selectedItemChildTopTenListId': null,
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
		// data for new toptenlist have loaded
		if ((prevProps.toptenlist.parent_toptenitem !== this.props.toptenlist.parent_toptenitem) ||
		// navigated to new toptenlist
		(prevProps.toptenlistOrganizerData.length === 0 && this.props.toptenlistOrganizerData.length !== 0)) {
			this.setState({ // reset component
				'showOrganizer': false,
				'selectedItemOrder': this.selectedItemOrder(),
				'parentItemId': this.props.toptenlist.parent_toptenitem,
				'parentTopTenListId': this.props.parentTopTenListId,
			});
		}
	}

	onClickOrganize = () => {
		this.setState({
			'showOrganizer': true,
		});

		setTimeout(() => {
			const DOMNode = ReactDOM.findDOMNode(this); // component parent node
			const element = DOMNode.querySelector('.organizer-toptenlist.selected');
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

		// Don't allow the user to select an item from the current toptenlist.
		// this shouldn't happen as the current toptenlist is not displayed in the organizer.
		if (this.state.parentTopTenListId === this.props.toptenlist.id) {
			return;
		}

		if (!this.state.parentItemId) {
			if (confirm(`'${this.props.toptenlist.name}' will become a top level toptenlist. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
				this.setParentItem();
			}
			return;
		}

		// if the new parent item already has a child toptenlist
		if (this.state.selectedItemChildTopTenListId) {
			const childTopTenList = this.props.toptenlistOrganizerData.find((toptenlist) => toptenlist.id === this.state.selectedItemChildTopTenListId);

			// no change
			if (this.state.parentItemId === this.props.toptenlist.parent_toptenitem) {
				return;
			} else { // will disconnect the existing child toptenlist
				if (confirm(`The child Top Ten list '${childTopTenList.name}' will become a top level list. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
					this.setParentItem();
				}
			}
			return;
		}

		this.setParentItem();
	}

	setParentItem() {
		this.props.dispatch(toptenlistReducer.updateTopTenList(
			this.props.toptenlist.id,
			'parent_toptenitem_id',
			this.state.parentItemId));
	}

	onSelectParentItem = ({ toptenlist, order, childTopTenListId }) => {
		// if the user clicks the selected item, deselect it
		// i.e. make this a top-level toptenlist
		if (toptenlist.id === this.state.parentTopTenListId && toptenlist.toptenitem[order-1] === this.state.parentItemId) {
			this.setState({
				'parentItemId': null,
				'parentTopTenListId': null,
				'selectedItemChildTopTenListId': null,
				'selectedItemOrder': null,
			});
		} else {
			this.setState({
				'parentItemId': toptenlist.toptenitem[order-1],
				'parentTopTenListId': toptenlist.id,
				'selectedItemChildTopTenListId': childTopTenListId,
				'selectedItemOrder': order,
			});
		}
	}

	selectedItemOrder() {
		// find the order of the parent item
		let order; // there may not be a parent item, so there may not be a default selection
		if (this.props.parentTopTenListId) {
			let parentItemId = this.props.toptenlist.parent_toptenitem;
			const parentTopTenList = this.props.toptenlistOrganizerData.find(toptenlist => toptenlist.id === this.props.parentTopTenListId);

			let parentTopTenListItems = parentTopTenList.toptenitem;

			order = parentTopTenListItems.indexOf(parentItemId);

			if (order !== -1) { // item is found
				order += 1;
			}
		}

		return order;
	}

	renderTopTenLists() {
		return (
			<div className="toptenlists">
				<div className="inner-tube">
					<span>Select a new parent item for this Top Ten list: </span>
					{this.props.toptenlistOrganizerData.map(toptenlist => {
						const numberOfItems = this.props.itemOrganizerData[toptenlist.id].length;
						
						// only show toptenlists with at least one item
						// and don't show the page toptenlist - it can't be its own parent
						if (numberOfItems > 0 && (toptenlist.id !== this.props.toptenlist.id)) {
							const showItems = (toptenlist.id === this.state.parentListId);

							return (<OrganizerList
								toptenlist={toptenlist}
								toptenlistOrganizerData={this.props.toptenlistOrganizerData}
								itemOrganizerData={this.props.itemOrganizerData}
								key={toptenlist.id}
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
