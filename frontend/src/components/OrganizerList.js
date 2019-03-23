// a single toptenlist to be displayed in the Organizer
// can be expanded to show toptenitems
// an toptenitem can be selected

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
		this.props.onSelectTopTenItem({ 'toptenlist': this.props.toptenlist, 'order': e.target.dataset.order, 'childTopTenListId': e.target.dataset.childtoptenlistid });
	}

	renderTopTenItems() {
		const selectedTopTenItemOrder = parseInt(this.props.selectedTopTenItemOrder); // element property is a string. Order should be a number.
		const toptenlistId = this.props.toptenlist.id;
		const selectedTopTenListId = this.props.selectedTopTenListId;

		return (
			<div className="toptenitems">
				{this.props.toptenitemOrganizerData[toptenlistId].map((toptenitem) => { // eslint-disable-line array-callback-return
					const isSelectedTopTenItem = ((toptenlistId === selectedTopTenListId) && (toptenitem.order === selectedTopTenItemOrder));

					let childTopTenListElm;

					if (toptenitem.childTopTenListId) {
						const childTopTenList = this.props.toptenlistOrganizerData.find((toptenlist) => toptenlist.id === toptenitem.childTopTenListId);
						childTopTenListElm = (
							<span className="child-toptenlist">> {childTopTenList.name}</span>
						);
					}

					if (toptenitem.name) {
						return (<div key={toptenitem.id} className={`toptenitem ${isSelectedTopTenItem ? 'selected' : ''}`}>
							<span
								onClick={this.onSelectTopTenItem}
								data-order={toptenitem.order}
								data-childtoptenlistid={toptenitem.childTopTenListId}
							><span className="order">{toptenitem.order}:</span>{toptenitem.name}</span>{childTopTenListElm}
						</div>);
					}
				}
				)}
			</div>
		);
	}

	render() {
		const name = this.props.toptenlist.name;

		const isSelectedTopTenList = (this.props.toptenlist.id === this.props.selectedTopTenListId);

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
