// Displays the user's topTenLists and topTenItems
// Allows the parent topTenItem of a topTenList to be changed

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Row, Col } from 'reactstrap';
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
		const { topTenList, topTenListOrganizerData } = this.props;

		if ((prevProps.topTenList.parent_topTenItem !== topTenList.parent_topTenItem)
			|| (prevProps.topTenListOrganizerData.length === 0 && topTenListOrganizerData.length !== 0)) { // navigated to new topTenList
			this.resetOrganizer();
		}
	}

	onClickOrganize = () => {
		this.setState({
			'showOrganizer': true,
		});

		setTimeout(() => {
			const DOMNode = this.node; // component parent node
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
		// Don't allow the user to select a topTenItem from the current topTenList.
		// this shouldn't happen as the current topTenList is not displayed in the organizer.
		const { topTenList, topTenListOrganizerData } = this.props;
		const {
			parentTopTenListId,
			parentTopTenItemId,
			selectedTopTenItemChildTopTenListId,
		} = this.state;

		if (parentTopTenListId === topTenList.id) {
			return;
		}

		if (!parentTopTenItemId) {
			if (confirm(`'${topTenList.name}' will become a top level topTenList. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
				this.setParentTopTenItem();
			}
			return;
		}

		// if the new parent topTenItem already has a child topTenList
		if (selectedTopTenItemChildTopTenListId) {
			const childTopTenList = topTenListOrganizerData.find(topTenList => topTenList.id === selectedTopTenItemChildTopTenListId);

			// no change
			if (parentTopTenItemId === topTenList.parent_topTenItem) {
				return;
			}
			// will disconnect the existing child topTenList
			if (confirm(`The child Top Ten list '${childTopTenList.name}' will become a top level list. Are you sure you want to continue?`)) { // eslint-disable-line no-restricted-globals
				this.setParentTopTenItem();
			}
			return;
		}

		this.setParentTopTenItem();
	}

	setParentTopTenItem() {
		const { dispatch, topTenList } = this.props;
		const { parentTopTenItemId } = this.state;

		dispatch(topTenListReducer.updateTopTenList(
			topTenList.id,
			'parent_topTenItem_id',
			parentTopTenItemId,
		));
		this.resetOrganizer();
	}

	onSelectParentTopTenItem = ({ topTenList, order, childTopTenListId }) => {
		const { parentTopTenListId, parentTopTenItemId } = this.state;

		// if the user clicks the selected topTenItem, deselect it
		// i.e. make this a top-level topTenList
		if (topTenList.id === parentTopTenListId && topTenList.topTenItem[order - 1] === parentTopTenItemId) {
			this.setState({
				'parentTopTenItemId': null,
				'parentTopTenListId': null,
				'selectedTopTenItemChildTopTenListId': null,
				'selectedTopTenItemOrder': null,
			});
		} else {
			this.setState({
				'parentTopTenItemId': topTenList.topTenItem[order - 1],
				'parentTopTenListId': topTenList.id,
				'selectedTopTenItemChildTopTenListId': childTopTenListId,
				'selectedTopTenItemOrder': order,
			});
		}
	}

	resetOrganizer() {
		const { topTenList, parentTopTenListId } = this.props;

		this.setState({ // reset component
			'showOrganizer': false,
			'selectedTopTenItemOrder': this.selectedTopTenItemOrder(),
			'parentTopTenItemId': topTenList.parent_topTenItem,
			'parentTopTenListId': parentTopTenListId,
		});
	}

	selectedTopTenItemOrder() {
		// find the order of the parent topTenItem
		const { parentTopTenListId, topTenList, topTenListOrganizerData } = this.props;

		let order; // there may not be a parent topTenItem, so there may not be a default selection
		if (parentTopTenListId) {
			const parentTopTenItemId = topTenList.parent_topTenItem;
			const parentTopTenList = topTenListOrganizerData.find(topTenListInner => topTenListInner.id === parentTopTenListId);

			const parentTopTenListTopTenItems = parentTopTenList.topTenItem;

			order = parentTopTenListTopTenItems.indexOf(parentTopTenItemId);

			if (order !== -1) { // topTenItem is found
				order += 1;
			}
		}

		return order;
	}

	renderTopTenLists() {
		const { topTenListOrganizerData, topTenItemOrganizerData, topTenList } = this.props;
		const { parentTopTenListId, selectedTopTenItemOrder } = this.state;

		return (
			<div className="toptenlists">
				<div className="inner-tube">
					<span>Select a new parent Top Ten item for this Top Ten list: </span>
					{topTenListOrganizerData.map((topTenListInner) => { // eslint-disable-line array-callback-return
						const numberOfTopTenItems = topTenItemOrganizerData[topTenListInner.id].length;

						// only show topTenLists with at least one topTenItem
						// and don't show the page topTenList - it can't be its own parent
						if (numberOfTopTenItems > 0 && (topTenListInner.id !== topTenList.id)) {
							const showTopTenItems = (topTenListInner.id === parentTopTenListId);

							return (
								<OrganizerList
									topTenList={topTenListInner}
									topTenListOrganizerData={topTenListOrganizerData}
									topTenItemOrganizerData={topTenItemOrganizerData}
									key={topTenListInner.id}
									selectedTopTenListId={parentTopTenListId}
									selectedTopTenItemOrder={selectedTopTenItemOrder}
									onSelectTopTenItem={this.onSelectParentTopTenItem}
									showTopTenItems={showTopTenItems}
								/>
							);
						}
						// return; // eslint-disable-line array-callback-return
					})}
				</div>
			</div>
		);
	}

	render() {
		const { showOrganizer } = this.state;
		let controls;

		if (showOrganizer) {
			controls = (
				<Row>
					<Col>
						<div className="controls">
							<button type="button" className="btn btn-secondary" onClick={this.onClickCancel}>Cancel</button>
							<button type="button" className="btn btn-primary" onClick={this.onClickDone}>Done</button>
						</div>
					</Col>
				</Row>
			);
		} else {
			controls = (
				<Row>
					<Col>
						<div className="controls">
							<button type="button" className="btn btn-default organize" onClick={this.onClickOrganize}>...</button>
						</div>
					</Col>
				</Row>
			);
		}

		return (
			<div ref={node => this.node = node} className={`organizer ${showOrganizer ? 'open' : ''}`}>
				{controls}
				{showOrganizer && this.renderTopTenLists()}
			</div>
		);
	}
}

Organizer.propTypes = {
	'dispatch': PropTypes.func.isRequired,
	'topTenList': PropTypes.objectOf(PropTypes.any).isRequired,
	'parentTopTenListId': PropTypes.string,
	'topTenListOrganizerData': PropTypes.arrayOf(PropTypes.any).isRequired,
	'topTenItemOrganizerData': PropTypes.objectOf(PropTypes.any).isRequired,
};

export default connect()(Organizer);
