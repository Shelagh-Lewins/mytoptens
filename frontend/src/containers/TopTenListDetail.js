// Full detail view of a toptenlist

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import SetTopTenListIsPublic from '../components/SetTopTenListIsPublic';
import EditableTextField from '../components/EditableTextField.js';
import TopTenItemsPage from '../components/TopTenItemsPage';
import Organizer from '../components/Organizer';
import Loading from '../components/Loading';

import * as toptenlistReducer from '../modules/toptenlist';
import * as toptenitemReducer from '../modules/toptenitem';
import * as permissions from '../modules/permissions';
import findObjectByProperty from '../modules/findObjectByProperty';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';

import './TopTenListDetail.scss';


class TopTenListDetails extends Component {
	constructor(props) {
		super();

		// load the toptenlist and any parent / children
		this.getTopTenListData = this.getTopTenListData.bind(this);
		const id = this.getTopTenListData(props);

		this.state = {
			id,
			'showOrganizer': false,
		};

		this.onDeleteTopTenList = this.onDeleteTopTenList.bind(this);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.isLoading && !this.props.isLoading) {
			// just finished loading; need to check if user should view this toptenlist
			const canEditTopTenList = permissions.canEditTopTenList(this.state.id);
			const canViewTopTenList = permissions.canViewTopTenList(this.state.id);

			if (!canViewTopTenList) {
				this.props.history.push('/');
			}

			this.getOrganizerData();

			this.setState({
				'canView': canViewTopTenList,
				'canEdit': canEditTopTenList,
			});

			if(canViewTopTenList) {
				this.setState({
					'toptenlist_name': this.props.toptenlist.name,
					'toptenlist_description': this.props.toptenlist.description,
				});
			}
		}

		// user has navigated to a different toptenlist
		if (prevProps.match.params.id !== this.props.match.params.id) {
			const id = this.getTopTenListData(this.props);
			this.setState({
				id,
			});
		}

		// user has just logged out
		// store needs to be repopulated
		if (prevProps.auth.isAuthenticated && !this.props.auth.isAuthenticated) {
			this.props.dispatch(toptenlistReducer.fetchTopTenListDetail(this.state.id));
			this.props.dispatch(clearErrors());
		}
	}

	getTopTenListData = (props) => {
		const id = props.match.params.id;

		props.dispatch(toptenlistReducer.fetchTopTenListDetail(id));
		props.dispatch(clearErrors());
		return id;
	}

	getOrganizerData = () => {
		// minimal data for all my toptenlists and toptenitems to allow parent toptenlist to be changed.
		// can't do this until the toptenlist has been loaded, to find the owner
		if (!this.props.toptenlist) { // probably the user does not have permission to view this toptenlist
			return;
		}
		this.props.dispatch(toptenlistReducer.fetchOrganizerData(this.props.toptenlist.created_by));
		this.props.dispatch(clearErrors());
	}

	onChangeIsPublic = ({ id, is_public }) => {
		this.props.dispatch(toptenlistReducer.setTopTenListIsPublic({ id, is_public }));
	}

	onDeleteTopTenList = () => {
		const id = this.props.toptenlist.id;
		const name = this.props.toptenlist.name;

		if (confirm(`Are you sure you want to delete the toptenlist ${name}?`)) // eslint-disable-line no-restricted-globals
		{
		  this.props.dispatch(toptenlistReducer.deleteTopTenList(id));

		  // if there is a visible parent, navigate there
		  if (this.props.parentTopTenList) {
		  	if (permissions.canViewTopTenList(this.props.parentTopTenList.id)) {
		  		this.props.history.push(`/toptenlist/${this.props.parentTopTenList.id}`);
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
		const toptenlistId = element.dataset.entityid;

		// the toptenlist field to update is coded in the 'state' data e.g. 'toptenlist_name'
		// we want to keep toptenitem name and toptenlist name clearly separate
		const identifiers = element.dataset.state.split('_');
		const propertyName = identifiers[1];
		const value = element.value;

		this.props.dispatch(toptenlistReducer.updateTopTenList(toptenlistId, propertyName, value));
	}

	onCreateChildTopTenList = (toptenitem) => {
		this.props.history.push(`/newtoptenlist?parent-toptenitem-id=${toptenitem.id}&parent-toptenitem-name=${toptenitem.name}&parent-toptenlist-name=${this.props.toptenlist.name}&parent-toptenlist-id=${this.props.toptenlist.id}`);
	}

	onChangeIsPublic = ({ id, is_public }) => {
		this.props.dispatch(toptenlistReducer.setTopTenListIsPublic({ id, is_public }));
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	renderPage() {
		if (!this.props.toptenlist) {
			return;
		}

		let showPrivacyWarning = false;
		let privacyWarningText = '';

		if (this.state.canEdit && this.props.parentTopTenList) {
			if (this.props.toptenlist.is_public && !this.props.parentTopTenList.is_public) {
				privacyWarningText = 'This public toptenlist has a private parent toptenlist';
				showPrivacyWarning = true;
			} else if (!this.props.toptenlist.is_public && this.props.parentTopTenList.is_public) {
				privacyWarningText = 'This private toptenlist has a public parent toptenlist';
				showPrivacyWarning = true;
			}
		}

		let breadcrumbs = <div className="breadcrumbs">Top level list</div>;

		let parentTopTenListId;
		if (this.props.parentTopTenList) {
			parentTopTenListId = this.props.parentTopTenList.id;

			breadcrumbs = <div className="breadcrumbs"><Link to={`/toptenlist/${this.props.parentTopTenList.id}`}>{this.props.parentTopTenList.name}</Link> > {this.props.parentTopTenItem.name}</div>;
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
				{this.props.toptenlist && !this.props.isLoading && (
					<div>
						<Container>
							<Row>
								<Col className="toptenlist-name">
									<EditableTextField
										canEdit={this.state.canEdit}
										required={true}
										name={'toptenlist_name'}
										placeholder="Click here to add a name for the list"
										label="Top Ten item name"
										data-state={'toptenlist_name'} // this.state property
										data-entityid={this.props.toptenlist.id} // database id of the toptenitem
										id='toptenlist_name' // id of the html element
										handleInputChange={this.handleInputChange}
										handleNewValue={this.handleNewValue}
										value={this.state.toptenlist_name}
									/>
									{this.state.canEdit && (
										<div className="toptenlist-detail-controls">
											<SetTopTenListIsPublic
												toptenlistId={this.props.toptenlist.id}
												isPublic={this.props.toptenlist.is_public}
												onChangeIsPublic={this.onChangeIsPublic}
											/>
											<button className="btn btn-danger" onClick={this.onDeleteTopTenList}>X</button>
										</div>
									)}
								</Col>
							</Row>
							<Row>
								<Col>
									{this.state.canEdit &&
									<Organizer
										toptenlist={this.props.toptenlist}
										parentTopTenListId={parentTopTenListId}
										toptenlistOrganizerData={this.props.toptenlistOrganizerData}
										toptenitemOrganizerData={this.props.toptenitemOrganizerData}
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
										textarea={true}
										canEdit={this.state.canEdit}
										name={'toptenlist_description'}
										placeholder="Click here to add a description for the toptenlist"
										label="Description"
										data-state={'toptenlist_description'} // this.state property
										data-entityid={this.props.toptenlist.id} // database id of the toptenitem
										id='toptenlist_description' // id of the html element
										handleInputChange={this.handleInputChange}
										handleNewValue={this.handleNewValue}
										value={this.state.toptenlist_description}
									/>
								</Col>
							</Row>
						</Container>
						<Container>
							{this.props.thisTopTenListTopTenItems && (
								<TopTenItemsPage
									toptenitems={this.props.thisTopTenListTopTenItems}
									toptenlist={this.props.toptenlist.id}
									canEdit={this.state.canEdit}
									onCreateChildTopTenList={this.onCreateChildTopTenList}
									onMoveTopTenItemUp={this.onMoveTopTenItemUp}
									onMoveTopTenItemDown={this.onMoveTopTenItemDown}
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
			content = <p>Either this toptenlist does not exist or you do not have permission to view it</p>;
		}
		return(
			<div className="toptenlist-detail">
				{ content }
			</div>
		);
	}
}

TopTenListDetails.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'thisTopTenListTopTenItems': PropTypes.array.isRequired, // toptenitems belonging to this toptenlist
	'toptenlistOrganizerData': PropTypes.array.isRequired, // minimal data for all toptenlists owned by the same user.
	'toptenitemOrganizerData': PropTypes.object.isRequired, // minimal data for all toptenlists owned by the same user
};

const mapStateToProps = (state, ownProps) => {
	const toptenlists = state.toptenlist.things; // details of the current toptenlist, with parent and child toptenlists if they exist

	// first find the target toptenlist
	const toptenlist = findObjectByProperty({ 'parentObject': toptenlists, 'property': 'id', 'value': ownProps.match.params.id });

	const parentTopTenItemAndTopTenList = toptenlistReducer.getParentTopTenItemAndTopTenList(state)(toptenlist);

	return ({
		'auth': state.auth,
		'errors': state.errors,
		'isLoading': state.toptenlist.isLoading,
		'toptenlist': toptenlist,
		'thisTopTenListTopTenItems': toptenlistReducer.getTopTenItemsForTopTenList(state)(toptenlist),
		'parentTopTenList': parentTopTenItemAndTopTenList.parentTopTenList,
		'parentTopTenItem': parentTopTenItemAndTopTenList.parentTopTenItem,
		'toptenlistOrganizerData': toptenlistReducer.getSortedOrganizerTopTenLists(state), // array containing limited toptenlist info: id, name, toptenitem (array of child toptenitems), parent_toptenitem
		'toptenitemOrganizerData': toptenitemReducer.groupedTopTenItems(state), // object. limited toptenitem info: id, name, toptenlist_id
	});
};

export default connect(mapStateToProps)(TopTenListDetails);
