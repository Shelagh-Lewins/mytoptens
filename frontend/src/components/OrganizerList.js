// a single topTenList to be displayed in the Organizer
// can be expanded to show topTenItems
// an topTenItem can be selected

import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';

class OrganizerList extends Component {
	constructor(props) {
		super();

		this.state = {
			'showTopTenItems': props.showTopTenItems,
		};

		this.onSelectTopTenItem = this.onSelectTopTenItem.bind(this);
		this.onShowTopTenItems = this.onShowTopTenItems.bind(this);
	}

	onShowTopTenItems() {
		this.setState({
			'showTopTenItems': !this.state.showTopTenItems,
		});
	}

	onSelectTopTenItem (e) {
		this.props.onSelectTopTenItem({ 'topTenList': this.props.topTenList, 'order': e.target.dataset.order, 'childTopTenListId': e.target.dataset.childtoptenlistid });
	}

	renderTopTenItems() {
		const selectedTopTenItemOrder = parseInt(this.props.selectedTopTenItemOrder); // element property is a string. Order should be a number.
		const topTenListId = this.props.topTenList.id;
		const selectedTopTenListId = this.props.selectedTopTenListId;

		return (
			<div className="toptenitems">
				{this.props.topTenItemOrganizerData[topTenListId].map((topTenItem) => { // eslint-disable-line array-callback-return
					const isSelectedTopTenItem = ((topTenListId === selectedTopTenListId) && (topTenItem.order === selectedTopTenItemOrder));

					let childTopTenListElm;

					if (topTenItem.childTopTenListId) {
						const childTopTenList = this.props.topTenListOrganizerData.find((topTenList) => topTenList.id === topTenItem.childTopTenListId);
						childTopTenListElm = (
							<span className="child-toptenlist">> {childTopTenList.name}</span>
						);
					}

					if (topTenItem.name) {
						return (<div key={topTenItem.id} className={`toptenitem ${isSelectedTopTenItem ? 'selected' : ''}`}>
							<span
								onClick={this.onSelectTopTenItem}
								data-order={topTenItem.order}
								data-childtoptenlistid={topTenItem.childTopTenListId}
							><span className="order">{topTenItem.order}:</span>{topTenItem.name}</span>{childTopTenListElm}
						</div>);
					}
				}
				)}
			</div>
		);
	}

	render() {
		const name = this.props.topTenList.name;
		//console.log('render. Props', this.props);

		const isSelectedTopTenList = (this.props.topTenList.id === this.props.selectedTopTenListId);
		//console.log('render isSelectedTopTenList', isSelectedTopTenList);

		let showTopTenItemsButtonText = '+';

		if (this.state.showTopTenItems) {
			showTopTenItemsButtonText = '-';
		}

		return (
			<Row className={`organizer-list ${isSelectedTopTenList ? 'selected' : ''}`}>
				<Col>
					<button className="btn btn-light show-toptenitems" onClick={this.onShowTopTenItems}>{showTopTenItemsButtonText}</button>
					<div className="name">{name}</div>
					{this.state.showTopTenItems && this.renderTopTenItems()}
				</Col>
			</Row>
		);
	}
}

export default OrganizerList;
