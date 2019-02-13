// Full detail view of a list

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import SetListIsPublic from '../components/SetListIsPublic';
import EditableTextField from '../components/EditableTextField.js';
import ItemsPage from '../components/ItemsPage';

import * as lists from '../modules/lists';
import * as items from '../modules/items';
import * as permissions from '../modules/permissions';
import findObjectByProperty from '../modules/findObjectByProperty';
import formatErrorMessages from '../modules/formatErrorMessages';import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';

import './ListDetail.scss';


class ListDetails extends Component {
	constructor(props) {
		super();

		// to start with all we know is the slug. We have to find the list id, and then the list details and items can be loaded
		this.state = {};
		this.getListData = this.getListData.bind(this);
		const slug = this.getListData(props);

		this.state = {
			slug,
		};
	}

	getListData = (props) => {
		const slug = props.match.params.slug;

		props.dispatch(lists.fetchListBySlug(slug));
		props.dispatch(clearErrors());
		return slug;
	}

	onIsPublicChange = ({ id, is_public }) => {
		this.props.dispatch(lists.setListIsPublic({ id, is_public }));
	}

	onDeleteList = () => {
		const id = this.props.list.id;
		const name = this.props.list.name;

		if (confirm(`Are you sure you want to delete the list ${name}`)) // eslint-disable-line no-restricted-globals
		{
		  this.props.dispatch(lists.deleteList(id));

		  // if there is a visible parent, navigate there
		  if (this.props.parentList) {
		  	if (permissions.canViewList({ 'id': this.props.parentList.id })) {
		  		this.props.history.push(`/list/${this.props.parentList.slug}`);
		  		return;
		  	}
		  }

		  // otherwise navigate home
		  this.props.history.push('/');
		}
	}

	handleInputChange = (e) => {
		this.setState({
			[e.target.dataset.state]: e.target.value
		});
	}

	handleNewValue = (element) => {
		const listId = element.dataset.entityid;

		// the list field to update is coded in the 'state' data e.g. 'list_name'
		// we want to keep item name and list name clearly separate
		const identifiers = element.dataset.state.split('_');
		const propertyName = identifiers[1];
		const value = element.value;

		this.props.dispatch(lists.updateList(listId, propertyName, value));
	}

	onCreateChildList = (itemId) => {
		this.props.history.push(`/newlist?parent-item=${itemId}`);
	}

	onMoveItemUp = (itemId) => {
		this.props.dispatch(items.moveItemUp({ itemId }));
	}

	onMoveItemDown = (itemId) => {
		this.props.dispatch(items.moveItemDown({ itemId }));
	}

	onIsPublicChange = ({ id, is_public }) => {
		this.props.dispatch(lists.setListIsPublic({ id, is_public }));
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	componentDidUpdate(prevProps) {
		if (prevProps.isLoading && !this.props.isLoading) {
			// just finished loading; need to check if user should view this list
			const canEditList = permissions.canEditList({ 'slug': this.state.slug });
			const canViewList = permissions.canViewList({ 'slug': this.state.slug });

			this.setState({
				'canView': canViewList,
				'canEdit': canEditList,
			});

			if(canViewList) {
				this.setState({
					'list_name': this.props.list.name,
					'list_description': this.props.list.description,
				});
			}
		}

		// user has navigated to a different list
		if (prevProps.match.params.slug !== this.props.match.params.slug) {
			const slug = this.getListData(this.props);
			this.setState({
				slug,
			});
		}

		// user has just logged out
		// store needs to be repopulated
		if (prevProps.auth.isAuthenticated && !this.props.auth.isAuthenticated) {
			this.props.dispatch(lists.fetchListBySlug(this.state.slug));
			this.props.dispatch(clearErrors());
		}
	}

	renderPage() {
		if (!this.props.list) {
			return;
		}

		let showPrivacyWarning = false;
		let privacyWarningText = '';

		if (this.state.canEdit && this.props.parentList) {
			if (this.props.list.is_public && !this.props.parentList.is_public) {
				privacyWarningText = 'This public list has a private parent list';
				showPrivacyWarning = true;
			} else if (!this.props.list.is_public && this.props.parentList.is_public) {
				privacyWarningText = 'This private list has a public parent list';
				showPrivacyWarning = true;
			}
		}

		return <div>
			{!isEmpty(this.props.errors) && (<Container>
				<Row>
					<Col>
						<FlashMessage
							message={formatErrorMessages(this.props.errors)}
							type="error"
							onClick={this.onCloseFlashMessage}
						/>
					</Col>
				</Row>
			</Container>)}
			{this.props.list && (
				<div>
					<Container>
						{this.props.parentList && (
							<Row>
								<Col>
									<div className="breadcrumbs"><Link to={`/list/${this.props.parentList.slug}`}>{this.props.parentList.name}</Link> > {this.props.parentItem.name}
									</div>
								</Col>
							</Row>
						)}
						{this.state.canEdit && (
							<Row>
								<Col>
									<div className="list-detail-controls">
										<SetListIsPublic
											list={this.props.list}
											onIsPublicChange={this.onIsPublicChange}
										/>
										<button className="btn btn-danger" onClick={this.onDeleteList.bind(this)}>Delete</button>
									</div>
								</Col>
							</Row>
						)}
						{showPrivacyWarning && (
							<Row>
								<Col>
									<div className="privacy-warning">{privacyWarningText}</div>
								</Col>
							</Row>
						)}
						<Row>
							<Col className="list-name">
								<EditableTextField
									canEdit={this.state.canEdit}
									required={true}
									name={'list_name'}
									placeholder="Click here to add a name for the list"
									label="Item name"
									data-state={'list_name'} // this.state property
									data-entityid={this.props.list.id} // database id of the item
									id='list_name' // id of the html element
									handleInputChange={this.handleInputChange}
									handleNewValue={this.handleNewValue}
									value={this.state.list_name}
								/>
							</Col>
						</Row>
						<Row>
							<Col className="list-description">
								<EditableTextField
									textarea={true}
									canEdit={this.state.canEdit}
									name={'list_description'}
									placeholder="Click here to add a description for the list"
									label="Item description"
									data-state={'list_description'} // this.state property
									data-entityid={this.props.list.id} // database id of the item
									id='list_description' // id of the html element
									handleInputChange={this.handleInputChange}
									handleNewValue={this.handleNewValue}
									value={this.state.list_description}
								/>
							</Col>
						</Row>
					</Container>
					<Container>
						{this.props.items && (
							<ItemsPage
								items={this.props.items}
								list={this.props.list.id}
								canEdit={this.state.canEdit}
								onCreateChildList={this.onCreateChildList}
								onMoveItemUp={this.onMoveItemUp}
								onMoveItemDown={this.onMoveItemDown}
							/>
						)}
					</Container>
				</div>
			)}
		</div>;
	}

	///////////////

	render() {
		let content;

		if (this.state.canView) {
			content = this.renderPage();
		} else {
			content = <p>Either this list does not exist or you do not have permission to view it</p>;
		}
		return(
			<div className="list-detail">
				{ content }
			</div>
		);
	}
}

ListDetails.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'lists': PropTypes.object.isRequired,
	'items': PropTypes.array.isRequired,
};

const mapStateToProps = (state, ownProps) => {
	// the store should contain our target list, identified by slug
	// It may also contain the parent list, and / or any child lists
	// plus the items for all these lists
	const lists = state.lists.things;
	const items = state.items.things;

	// first find the target list
	const list = findObjectByProperty({ 'parentObject': lists, 'property': 'slug', 'value': ownProps.match.params.slug });

	let parentList; // list object
	let parentItem; // item object
	let targetListItems = []; // items for just the target list

	// find the parent item and its list
	if (list) { // avoid error while loading or if list not visible
		// find the items for the target list
		targetListItems = list.items.map((itemId) => {
			return { ...items[itemId] }; // shallow copy so item is extensible
		});

		parentItem = findObjectByProperty({ 'parentObject': items, 'property': 'id', 'value': list.parent_item });

		const keys = Object.keys(lists);

		for (let i=0; i<keys.length; i++) {
			// search lists to find the one which contains the parent item
			// item ids are an array property of the list
			const testList = lists[keys[i]];

			if (list.parent_item) {
				if (testList.items.indexOf(list.parent_item) !== -1) {
					parentList = testList;
				}
			}

			// find any list that is a child of an item in the target list
			const index = list.items.indexOf(testList.parent_item);

			if (index !== -1) {
				targetListItems[index].childList = { ...testList };
			}
		}
	}

	return ({
		'auth': state.auth,
		'errors': state.errors,
		'isLoading': state.lists.isLoading,
		'lists': lists,
		'list': list,
		'parentList': parentList,
		'items': targetListItems,
		'parentItem': parentItem,
	});
};

export default connect(mapStateToProps)(withRouter(ListDetails));
