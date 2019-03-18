// Displays the user's toptenlists and toptenitems
// Allows the parent toptenitem of a toptenlist to be changed

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
			'parentTopTenItemId': props.toptenlist.parent_toptenitem,
			'parentTopTenListId': props.parentTopTenListId, // parent toptenlist and toptenitem are stored in state so a new value can be selected, with the old value still present in props if the user cancels
			'selectedTopTenItemChildTopTenListId': null,
			'selectedTopTenItemOrder': null,
		};

		this.onSelectParentTopTenItem = this.onSelectParentTopTenItem.bind(this);
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
				'selectedTopTenItemOrder': this.selectedTopTenItemOrder(),
				'parentTopTenItemId': this.props.toptenlist.parent_toptenitem,
				'parentTopTenListId': this.props.parentTopTenListId,
			});
		}
		console.log('didupdate state ', this.state);
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

		// Don't allow the user to select a toptenitem from the current toptenlist.
		// this shouldn't happen as the current toptenlist is not displayed in the organizer.
		if (this.state.parentTopTenListId === this.props.toptenlist.id) {
			return;
		}

		if (!this.state.parentTopTenItemId) {
			if (confirm(`'${this.props.toptenlist.name}' will become a top level toptenlist. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
				this.setParentTopTenItem();
			}
			return;
		}

		// if the new parent toptenitem already has a child toptenlist
		if (this.state.selectedTopTenItemChildTopTenListId) {
			const childTopTenList = this.props.toptenlistOrganizerData.find((toptenlist) => toptenlist.id === this.state.selectedTopTenItemChildTopTenListId);

			// no change
			if (this.state.parentTopTenItemId === this.props.toptenlist.parent_toptenitem) {
				return;
			} else { // will disconnect the existing child toptenlist
				if (confirm(`The child Top Ten list '${childTopTenList.name}' will become a top level list. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
					this.setParentTopTenItem();
				}
			}
			return;
		}

		this.setParentTopTenItem();
	}

	setParentTopTenItem() {
		this.props.dispatch(toptenlistReducer.updateTopTenList(
			this.props.toptenlist.id,
			'parent_toptenitem_id',
			this.state.parentTopTenItemId));
	}

	onSelectParentTopTenItem = ({ toptenlist, order, childTopTenListId }) => {
		// if the user clicks the selected toptenitem, deselect it
		// i.e. make this a top-level toptenlist
		if (toptenlist.id === this.state.parentTopTenListId && toptenlist.toptenitem[order-1] === this.state.parentTopTenItemId) {
			this.setState({
				'parentTopTenItemId': null,
				'parentTopTenListId': null,
				'selectedTopTenItemChildTopTenListId': null,
				'selectedTopTenItemOrder': null,
			});
		} else {
			this.setState({
				'parentTopTenItemId': toptenlist.toptenitem[order-1],
				'parentTopTenListId': toptenlist.id,
				'selectedTopTenItemChildTopTenListId': childTopTenListId,
				'selectedTopTenItemOrder': order,
			});
		}
	}

	selectedTopTenItemOrder() {
		// find the order of the parent toptenitem
		let order; // there may not be a parent toptenitem, so there may not be a default selection
		if (this.props.parentTopTenListId) {
			let parentTopTenItemId = this.props.toptenlist.parent_toptenitem;
			const parentTopTenList = this.props.toptenlistOrganizerData.find(toptenlist => toptenlist.id === this.props.parentTopTenListId);

			let parentTopTenListTopTenItems = parentTopTenList.toptenitem;

			order = parentTopTenListTopTenItems.indexOf(parentTopTenItemId);

			if (order !== -1) { // toptenitem is found
				order += 1;
			}
		}

		return order;
	}

	renderTopTenLists() {
		return (
			<div className="toptenlists">
				<div className="inner-tube">
					<span>Select a new parent Top Ten item for this Top Ten list: </span>
					{this.props.toptenlistOrganizerData.map(toptenlist => {
						const numberOfTopTenItems = this.props.toptenitemOrganizerData[toptenlist.id].length;
						
						// only show toptenlists with at least one toptenitem
						// and don't show the page toptenlist - it can't be its own parent
						if (numberOfTopTenItems > 0 && (toptenlist.id !== this.props.toptenlist.id)) {
							const showTopTenItems = (toptenlist.id === this.state.parentListId);

							return (<OrganizerList
								toptenlist={toptenlist}
								toptenlistOrganizerData={this.props.toptenlistOrganizerData}
								toptenitemOrganizerData={this.props.toptenitemOrganizerData}
								key={toptenlist.id}
								selectedListId={this.state.parentListId}
								selectedTopTenItemOrder={this.state.selectedTopTenItemOrder}
								onSelectTopTenItem={this.onSelectParentTopTenItem}
								showTopTenItems={showTopTenItems}
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
				{this.state.showOrganizer && this.renderTopTenLists()}
			</div>
		);
	}
}

export default connect()(Organizer);
