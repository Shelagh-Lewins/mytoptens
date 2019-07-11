// Full detail view of a topTenList

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import IsPublicIndicator from '../components/IsPublicIndicator';
import EditableTextField from '../components/EditableTextField';
import TopTenItemsPage from '../components/TopTenItemsPage';
import Organizer from '../components/Organizer';
import Loading from '../components/Loading';

import * as topTenListReducer from '../modules/topTenList';
import * as topTenItemReducer from '../modules/topTenItem';
import * as reusableItemReducer from '../modules/reusableItem';
import * as permissions from '../modules/permissions';
import findObjectByProperty from '../modules/findObjectByProperty';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';

import './TopTenListDetail.scss';


class TopTenListDetails extends Component {
	constructor(props) {
		super();

		// load the topTenList and any parent / children
		this.getTopTenListData = this.getTopTenListData.bind(this);
		const id = this.getTopTenListData(props);

		this.state = {
			id,
			// 'showOrganizer': false,
		};

		this.onDeleteTopTenList = this.onDeleteTopTenList.bind(this);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.isLoading && !this.props.isLoading) {
			// just finished loading; need to check if user should view this topTenList
			const canEditTopTenList = permissions.canEditTopTenList(this.state.id);
			const canViewTopTenList = permissions.canViewTopTenList(this.state.id);

			this.getOrganizerData();

			this.setState({
				'canView': canViewTopTenList,
				'canEdit': canEditTopTenList,
			});

			if(canViewTopTenList) {
				this.setState({
					'topTenList_name': this.props.topTenList.name,
					'topTenList_description': this.props.topTenList.description,
				});
			}
		}

		// user has navigated to a different topTenList
		if (prevProps.match.params.id !== this.props.match.params.id) {
			const id = this.getTopTenListData(this.props);
			this.setState({
				id,
			});
		}

		// user has just logged out
		// store needs to be repopulated
		if (prevProps.auth.isAuthenticated && !this.props.auth.isAuthenticated) {
			// this.props.dispatch(topTenListReducer.fetchTopTenListDetail(this.state.id));
			// this.props.dispatch(clearErrors());
			this.getTopTenListData(this.props);
		}
	}

	getTopTenListData = (props) => {
		const id = props.match.params.id;

		props.dispatch(topTenListReducer.fetchTopTenListDetail(id));
		props.dispatch(clearErrors());
		return id;
	}

	getOrganizerData = () => {
		// minimal data for all my topTenLists and topTenItems to allow parent topTenList to be changed.
		// can't do this until the topTenList has been loaded, to find the owner
		if (!this.props.topTenList) { // probably the user does not have permission to view this topTenList
			return;
		}
		this.props.dispatch(topTenListReducer.fetchOrganizerData(this.props.topTenList.created_by));
		this.props.dispatch(clearErrors());
	}

	onChangeIsPublic = ({ id, is_public }) => {
		this.props.dispatch(topTenListReducer.setTopTenListIsPublic({ id, is_public }));
	}

	onDeleteTopTenList = () => {
		const id = this.props.topTenList.id;
		const name = this.props.topTenList.name;

		if (confirm(`Are you sure you want to delete the topTenList ${name}?`)) // eslint-disable-line no-restricted-globals
		{
		  this.props.dispatch(topTenListReducer.deleteTopTenList(id));

		  // if there is a visible parent, navigate there
		  if (this.props.parentTopTenList) {
		  	if (permissions.canViewTopTenList(this.props.parentTopTenList.id)) {
		  		this.props.history.push(`/topTenList/${this.props.parentTopTenList.id}`);
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
		const topTenListId = element.dataset.entityid;

		// the topTenList field to update is coded in the 'state' data e.g. 'topTenList_name'
		// we want to keep topTenItem name and topTenList name clearly separate
		const identifiers = element.dataset.state.split('_');
		const propertyName = identifiers[1];
		const value = element.value;

		this.props.dispatch(topTenListReducer.updateTopTenList(topTenListId, propertyName, value));
	}

	onCreateChildTopTenList = (topTenItem) => {
		this.props.history.push(`/newtopTenList?parent-topTenItem-id=${topTenItem.id}&parent-topTenItem-name=${topTenItem.name}&parent-topTenList-name=${this.props.topTenList.name}&parent-topTenList-id=${this.props.topTenList.id}`);
	}

	onChangeIsPublic = ({ id, is_public }) => {
		this.props.dispatch(topTenListReducer.setTopTenListIsPublic({ id, is_public }));
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	renderPage() {
		if (!this.props.topTenList) {
			return;
		}

		let showPrivacyWarning = false;
		let privacyWarningText = '';

		if (this.state.canEdit && this.props.parentTopTenList) {
			if (this.props.topTenList.is_public && !this.props.parentTopTenList.is_public) {
				privacyWarningText = 'This public topTenList has a private parent topTenList';
				showPrivacyWarning = true;
			} else if (!this.props.topTenList.is_public && this.props.parentTopTenList.is_public) {
				privacyWarningText = 'This private topTenList has a public parent topTenList';
				showPrivacyWarning = true;
			}
		}

		let breadcrumbs = <div className="breadcrumbs">Top level list</div>;

		let parentTopTenListId;
		if (this.props.parentTopTenList) {
			parentTopTenListId = this.props.parentTopTenList.id;

			breadcrumbs = <div className="breadcrumbs"><Link to={`/topTenList/${this.props.parentTopTenList.id}`}>{this.props.parentTopTenList.name}</Link> > {this.props.parentTopTenItem.name}</div>;
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
				{this.props.topTenList && (
					<div>
						<Container>
							<Row>
								<Col className="toptenlist-name">
									<EditableTextField
										type='input'
										canEdit={this.state.canEdit}
										required={true}
										name={'topTenList_name'}
										placeholder="Click here to add a name for the list"
										label="Top Ten item name"
										data-state={'topTenList_name'} // this.state property
										data-entityid={this.props.topTenList.id} // database id of the topTenItem
										id='topTenList_name' // id of the html element
										handleInputChange={this.handleInputChange}
										handleNewValue={this.handleNewValue}
										value={this.state.topTenList_name}
									/>
									{this.state.canEdit && (
										<div className="toptenlist-detail-controls">
											<IsPublicIndicator
												topTenListId={this.props.topTenList.id}
												isPublic={this.props.topTenList.is_public}
												onChangeIsPublic={this.onChangeIsPublic}
											/>
											<button className="btn btn-danger" onClick={this.onDeleteTopTenList}>X</button>
										</div>
									)}
								</Col>
							</Row>
							<Row>
								<Col>
									{this.state.canEdit && this.props.topTenListOrganizerData.length > 1 &&
									<Organizer
										topTenList={this.props.topTenList}
										parentTopTenListId={parentTopTenListId}
										topTenListOrganizerData={this.props.topTenListOrganizerData}
										topTenItemOrganizerData={this.props.topTenItemOrganizerData}
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
								<Col className="toptenlist-description">
									<EditableTextField
										type='textarea'
										canEdit={this.state.canEdit}
										name={'topTenList_description'}
										placeholder="Click here to add a description for the topTenList"
										label="Description"
										data-state={'topTenList_description'} // this.state property
										data-entityid={this.props.topTenList.id} // database id of the topTenItem
										id='topTenList_description' // id of the html element
										handleInputChange={this.handleInputChange}
										handleNewValue={this.handleNewValue}
										value={this.state.topTenList_description}
									/>
								</Col>
							</Row>
						</Container>
						<Container>
							{this.props.thisTopTenListTopTenItems && (
								<TopTenItemsPage
									topTenItems={this.props.thisTopTenListTopTenItems}
									topTenList={this.props.topTenList.id}
									canEdit={this.state.canEdit}
									onCreateChildTopTenList={this.onCreateChildTopTenList}
									onMoveTopTenItemUp={this.onMoveTopTenItemUp}
									onMoveTopTenItemDown={this.onMoveTopTenItemDown}
									reusableItemSuggestions={this.props.reusableItemSuggestions}
									reusableItems={this.props.reusableItems}
								/>
							)}
						</Container>
					</div>
				)}
			</div>
		);
	}

	// /////////////

	render() {
		if (this.props.isLoading) {
			return <Loading />;
		}

		let content;

		if (this.state.canView) {
			content = this.renderPage();
		} else {
			content = <p>Either this Top Ten List does not exist or you do not have permission to view it</p>;
		}
		return(
			<div className="toptenlist-detail">
				{ content }
			</div>
		);
	}
}

TopTenListDetails.propTypes = {
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'errors': PropTypes.objectOf(PropTypes.any).isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'thisTopTenListTopTenItems': PropTypes.arrayOf(PropTypes.any).isRequired, // topTenItems belonging to this topTenList
	'topTenListOrganizerData': PropTypes.arrayOf(PropTypes.any).isRequired, // minimal data for all topTenLists owned by the same user.
	'topTenItemOrganizerData': PropTypes.objectOf(PropTypes.any).isRequired, // minimal data for all topTenLists owned by the same user
};

const mapStateToProps = (state, ownProps) => {
	const topTenLists = state.topTenList.things; // details of the current topTenList, with parent and child topTenLists if they exist

	// first find the target topTenList
	const topTenList = findObjectByProperty({ 'parentObject': topTenLists, 'property': 'id', 'value': ownProps.match.params.id });

	const parentTopTenItemAndTopTenList = topTenListReducer.getParentTopTenItemAndTopTenList(state)(topTenList);

	return ({
		'auth': state.auth,
		'errors': state.errors,
		'isLoading': state.topTenList.isLoading,
		'topTenList': topTenList,
		'thisTopTenListTopTenItems': topTenListReducer.getTopTenItemsForTopTenList(state)(topTenList),
		'parentTopTenList': parentTopTenItemAndTopTenList.parentTopTenList,
		'parentTopTenItem': parentTopTenItemAndTopTenList.parentTopTenItem,
		'topTenListOrganizerData': topTenListReducer.getSortedOrganizerTopTenLists(state), // array containing limited topTenList info: id, name, topTenItem (array of child topTenItems), parent_topTenItem
		'topTenItemOrganizerData': topTenItemReducer.groupedTopTenItems(state), // object. limited topTenItem info: id, name, topTenList_id
		'reusableItemSuggestions': reusableItemReducer.getReusableItemList(state),
		'reusableItems': state.reusableItem.things,
	});
};

export default connect(mapStateToProps)(TopTenListDetails);
