// Displays the user's topTenLists and topTenItems
// Allows the parent topTenItem of a topTenList to be changed

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'reactstrap';
import ReactDOM from 'react-dom';

import * as topTenListReducer from '../modules/topTenList';

import OrganizerList from './OrganizerList';
import './Organizer.scss';

class Organizer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'selectedTopTenItemChildTopTenListId': null,
		};

		this.onSelectParentTopTenItem = this.onSelectParentTopTenItem.bind(this);
		this.onClickCancel = this.onClickCancel.bind(this);
		this.onClickDone = this.onClickDone.bind(this);
		this.onClickOrganize = this.onClickOrganize.bind(this);
	}

	componentDidMount() {
		this.resetOrganizer();
	}

	componentDidUpdate = (prevProps) => {
		// data for new topTenList have loaded
		if ((prevProps.topTenList.parent_topTenItem !== this.props.topTenList.parent_topTenItem) ||
		// navigated to new topTenList
		(prevProps.topTenListOrganizerData.length === 0 && this.props.topTenListOrganizerData.length !== 0)) {
			this.resetOrganizer();
		}
	}

	resetOrganizer() {
		this.setState({ // reset component
			'showOrganizer': false,
			'selectedTopTenItemOrder': this.selectedTopTenItemOrder(),
			'parentTopTenItemId': this.props.topTenList.parent_topTenItem,
			'parentTopTenListId': this.props.parentTopTenListId,
		});
	}

	onClickOrganize = () => {
		this.setState({
			'showOrganizer': true,
		});

		setTimeout(() => {
			const DOMNode = ReactDOM.findDOMNode(this); // component parent node
			const element = DOMNode.querySelector('.organizer-topTenList.selected');
			if (element) {
				element.scrollIntoView();
			}
		}, 100);
	}

	onClickCancel = () => {
		this.resetOrganizer();
	}

	onClickDone = () => {
		this.setState({
			'showOrganizer': false,
		});

		// Don't allow the user to select a topTenItem from the current topTenList.
		// this shouldn't happen as the current topTenList is not displayed in the organizer.
		if (this.state.parentTopTenListId === this.props.topTenList.id) {
			return;
		}

		if (!this.state.parentTopTenItemId) {
			if (confirm(`'${this.props.topTenList.name}' will become a top level topTenList. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
				this.setParentTopTenItem();
			}
			return;
		}

		// if the new parent topTenItem already has a child topTenList
		if (this.state.selectedTopTenItemChildTopTenListId) {
			const childTopTenList = this.props.topTenListOrganizerData.find((topTenList) => topTenList.id === this.state.selectedTopTenItemChildTopTenListId);

			// no change
			if (this.state.parentTopTenItemId === this.props.topTenList.parent_topTenItem) {
				return;
			} else { // will disconnect the existing child topTenList
				if (confirm(`The child Top Ten list '${childTopTenList.name}' will become a top level list. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
					this.setParentTopTenItem();
				}
			}
			return;
		}

		this.setParentTopTenItem();
	}

	setParentTopTenItem() {
		this.props.dispatch(topTenListReducer.updateTopTenList(
			this.props.topTenList.id,
			'parent_topTenItem_id',
			this.state.parentTopTenItemId));
	}

	onSelectParentTopTenItem = ({ topTenList, order, childTopTenListId }) => {
		// if the user clicks the selected topTenItem, deselect it
		// i.e. make this a top-level topTenList
		if (topTenList.id === this.state.parentTopTenListId && topTenList.topTenItem[order-1] === this.state.parentTopTenItemId) {
			this.setState({
				'parentTopTenItemId': null,
				'parentTopTenListId': null,
				'selectedTopTenItemChildTopTenListId': null,
				'selectedTopTenItemOrder': null,
			});
		} else {
			this.setState({
				'parentTopTenItemId': topTenList.topTenItem[order-1],
				'parentTopTenListId': topTenList.id,
				'selectedTopTenItemChildTopTenListId': childTopTenListId,
				'selectedTopTenItemOrder': order,
			});
		}
	}

	selectedTopTenItemOrder() {
		// find the order of the parent topTenItem
		let order; // there may not be a parent topTenItem, so there may not be a default selection
		if (this.props.parentTopTenListId) {
			let parentTopTenItemId = this.props.topTenList.parent_topTenItem;
			const parentTopTenList = this.props.topTenListOrganizerData.find(topTenList => topTenList.id === this.props.parentTopTenListId);

			let parentTopTenListTopTenItems = parentTopTenList.topTenItem;

			order = parentTopTenListTopTenItems.indexOf(parentTopTenItemId);

			if (order !== -1) { // topTenItem is found
				order += 1;
			}
		}

		return order;
	}

	renderTopTenLists() {
		return (
			<div className="topTenLists">
				<div className="inner-tube">
					<span>Select a new parent Top Ten item for this Top Ten list: </span>
					{this.props.topTenListOrganizerData.map(topTenList => {
						const numberOfTopTenItems = this.props.topTenItemOrganizerData[topTenList.id].length;
						
						// only show topTenLists with at least one topTenItem
						// and don't show the page topTenList - it can't be its own parent
						if (numberOfTopTenItems > 0 && (topTenList.id !== this.props.topTenList.id)) {
							const showTopTenItems = (topTenList.id === this.state.parentTopTenListId);

							return (<OrganizerList
								topTenList={topTenList}
								topTenListOrganizerData={this.props.topTenListOrganizerData}
								topTenItemOrganizerData={this.props.topTenItemOrganizerData}
								key={topTenList.id}
								selectedTopTenListId={this.state.parentTopTenListId}
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
