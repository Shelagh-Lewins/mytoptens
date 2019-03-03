// Full detail view of a list

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import SetListIsPublic from '../components/SetListIsPublic';
import EditableTextField from '../components/EditableTextField.js';
import ItemsPage from '../components/ItemsPage';
import Organizer from '../components/Organizer';
import Loading from '../components/Loading';

import * as listReducer from '../modules/list';
import * as itemReducer from '../modules/item';
import * as permissions from '../modules/permissions';
import findObjectByProperty from '../modules/findObjectByProperty';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';

import './ListDetail.scss';


class ListDetails extends Component {
	constructor(props) {
		super();

		// load the list and any parent / children
		this.getListData = this.getListData.bind(this);
		const id = this.getListData(props);

		this.state = {
			id,
			'showOrganizer': false,
		};

		this.onDeleteList = this.onDeleteList.bind(this);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.isLoading && !this.props.isLoading) {
			// just finished loading; need to check if user should view this list
			const canEditList = permissions.canEditList(this.state.id);
			const canViewList = permissions.canViewList(this.state.id);

			if (!canViewList) {
				this.props.history.push('/');
			}

			this.getOrganizerData();

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
		if (prevProps.match.params.id !== this.props.match.params.id) {
			const id = this.getListData(this.props);
			this.setState({
				id,
			});
		}

		// user has just logged out
		// store needs to be repopulated
		if (prevProps.auth.isAuthenticated && !this.props.auth.isAuthenticated) {
			this.props.dispatch(listReducer.fetchListDetail(this.state.id));
			this.props.dispatch(clearErrors());
		}
	}

	getListData = (props) => {
		const id = props.match.params.id;

		props.dispatch(listReducer.fetchListDetail(id));
		props.dispatch(clearErrors());
		return id;
	}

	getOrganizerData = () => {
		// minimal data for all my lists and items to allow parent list to be changed.
		// can't do this until the list has been loaded, to find the owner
		if (!this.props.list) { // probably the user does not have permission to view this list
			return;
		}
		this.props.dispatch(listReducer.fetchOrganizerData(this.props.list.created_by));
		this.props.dispatch(clearErrors());
	}

	onChangeIsPublic = ({ id, is_public }) => {
		this.props.dispatch(listReducer.setListIsPublic({ id, is_public }));
	}

	onDeleteList = () => {
		const id = this.props.list.id;
		const name = this.props.list.name;

		if (confirm(`Are you sure you want to delete the list ${name}?`)) // eslint-disable-line no-restricted-globals
		{
		  this.props.dispatch(listReducer.deleteList(id));

		  // if there is a visible parent, navigate there
		  if (this.props.parentList) {
		  	if (permissions.canViewList(this.props.parentList.id)) {
		  		this.props.history.push(`/list/${this.props.parentList.id}`);
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

		this.props.dispatch(listReducer.updateList(listId, propertyName, value));
	}

	onCreateChildList = (item) => {
		this.props.history.push(`/newlist?parent-item-id=${item.id}&parent-item-name=${item.name}&parent-list-name=${this.props.list.name}&parent-list-id=${this.props.list.id}`);
	}

	onChangeIsPublic = ({ id, is_public }) => {
		this.props.dispatch(listReducer.setListIsPublic({ id, is_public }));
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
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

		let breadcrumbs = <div className="breadcrumbs">Top level list</div>;

		let parentListId;
		if (this.props.parentList) {
			parentListId = this.props.parentList.id;

			breadcrumbs = <div className="breadcrumbs"><Link to={`/list/${this.props.parentList.id}`}>{this.props.parentList.name}</Link> > {this.props.parentItem.name}</div>;
		}
		return (
			<div>
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
				{this.props.isLoading && <Loading />}
				{this.props.list && !this.props.isLoading && (
					<div>
						<Container>
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
									{this.state.canEdit && (
										<div className="list-detail-controls">
											<SetListIsPublic
												listId={this.props.list.id}
												isPublic={this.props.list.is_public}
												onChangeIsPublic={this.onChangeIsPublic}
											/>
											<button className="btn btn-danger" onClick={this.onDeleteList}>X</button>
										</div>
									)}
								</Col>
							</Row>
							<Row>
								<Col>
									{this.state.canEdit &&
									<Organizer
										list={this.props.list}
										parentListId={parentListId}
										listOrganizerData={this.props.listOrganizerData}
										itemOrganizerData={this.props.itemOrganizerData}
									/>}
									{breadcrumbs}
								</Col>
							</Row>
							{showPrivacyWarning && (
								<Row>
									<Col>
										<div className="privacy-warning">{privacyWarningText}</div>
									</Col>
								</Row>
							)}
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
							{this.props.thisListItems && (
								<ItemsPage
									items={this.props.thisListItems}
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
			</div>
		);
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
	'thisListItems': PropTypes.array.isRequired, // items belonging to this list
	'listOrganizerData': PropTypes.array.isRequired, // minimal data for all lists owned by the same user.
	'itemOrganizerData': PropTypes.object.isRequired, // minimal data for all lists owned by the same user
};

const mapStateToProps = (state, ownProps) => {
	const lists = state.list.things; // details of the current list, with parent and child lists if they exist

	// first find the target list
	const list = findObjectByProperty({ 'parentObject': lists, 'property': 'id', 'value': ownProps.match.params.id });

	const parentItemAndList = listReducer.getParentItemAndList(state)(list);

	return ({
		'auth': state.auth,
		'errors': state.errors,
		'isLoading': state.list.isLoading,
		'list': list,
		'thisListItems': listReducer.getItemsForList(state)(list),
		'parentList': parentItemAndList.parentList,
		'parentItem': parentItemAndList.parentItem,
		'listOrganizerData': listReducer.getSortedOrganizerLists(state), // array containing limited list info: id, name, item (array of child items), parent_item
		'itemOrganizerData': itemReducer.groupedItems(state), // object. limited item info: id, name, list_id
	});
};

export default connect(mapStateToProps)(ListDetails);
