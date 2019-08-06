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
		};

		this.onDeleteTopTenList = this.onDeleteTopTenList.bind(this);
	}

	componentDidUpdate(prevProps) {
		const {
			auth,
			isLoading,
			topTenList,
			match,
		} = this.props;

		const { id } = this.state;

		if (prevProps.isLoading && !isLoading) {
			// just finished loading; need to check if user should view this topTenList
			const canEditTopTenList = permissions.canEditTopTenList(id);
			const canViewTopTenList = permissions.canViewTopTenList(id);

			this.getOrganizerData();

			this.setState({
				'canView': canViewTopTenList,
				'canEdit': canEditTopTenList,
			});

			if (canViewTopTenList) {
				this.setState({
					'topTenList_name': topTenList.name,
					'topTenList_description': topTenList.description,
				});
			}
		}

		// user has navigated to a different topTenList
		if (prevProps.match.params.id !== match.params.id) {
			const newId = this.getTopTenListData(this.props);
			this.setState({
				'id': newId,
			});
		}

		// user has just logged out
		// store needs to be repopulated
		if (prevProps.auth.isAuthenticated && !auth.isAuthenticated) {
			// this.props.dispatch(topTenListReducer.fetchTopTenListDetail(this.state.id));
			// this.props.dispatch(clearErrors());
			this.getTopTenListData(this.props);
		}
	}

	getTopTenListData = (props) => {
		const { id } = props.match.params;

		props.dispatch(topTenListReducer.fetchTopTenListDetail(id));
		props.dispatch(clearErrors());
		return id;
	}

	getOrganizerData = () => {
		// minimal data for all my topTenLists and topTenItems to allow parent topTenList to be changed.
		// can't do this until the topTenList has been loaded, to find the owner
		const { topTenList, dispatch} = this.props;

		if (!topTenList) { // probably the user does not have permission to view this topTenList
			return;
		}
		dispatch(topTenListReducer.fetchOrganizerData(topTenList.created_by));
		dispatch(clearErrors());
	}

	onChangeIsPublic = ({ id, is_public }) => {
		const { dispatch} = this.props;

		dispatch(topTenListReducer.setTopTenListIsPublic({ id, is_public }));
	}

	onDeleteTopTenList = () => {
		const {
			topTenList,
			dispatch,
			history,
			parentTopTenList,
		} = this.props;
		const { id, name } = topTenList;

		if (confirm(`Are you sure you want to delete the topTenList ${name}?`)) { // eslint-disable-line no-restricted-globals
			dispatch(topTenListReducer.deleteTopTenList(id));

			// if there is a visible parent, navigate there
			if (parentTopTenList) {
				if (permissions.canViewTopTenList(parentTopTenList.id)) {
					history.push(`/topTenList/${parentTopTenList.id}`);
					return;
				}
			}

			// otherwise navigate home
			history.push('/');
		}
	}

	handleInputChange = (e) => {
		this.setState({
			[e.target.dataset.state]: e.target.value,
		});
	}

	handleNewValue = (element) => {
		const topTenListId = element.dataset.entityid;

		// the topTenList field to update is coded in the 'state' data e.g. 'topTenList_name'
		// we want to keep topTenItem name and topTenList name clearly separate
		const identifiers = element.dataset.state.split('_');
		const propertyName = identifiers[1];
		const { dispatch } = this.props;
		const { value } = element;

		dispatch(topTenListReducer.updateTopTenList(topTenListId, propertyName, value));
	}

	onCreateChildTopTenList = (topTenItem) => {
		const { history, topTenList } = this.props;

		history.push(`/newtopTenList?parent-topTenItem-id=${topTenItem.id}&parent-topTenItem-name=${topTenItem.name}&parent-topTenList-name=${topTenList.name}&parent-topTenList-id=${topTenList.id}`);
	}

	onChangeIsPublic = ({ id, is_public }) => {
		const { dispatch } = this.props;

		dispatch(topTenListReducer.setTopTenListIsPublic({ id, is_public }));
	}

	onCloseFlashMessage = () => {
		const { dispatch } = this.props;

		dispatch(clearErrors());
	}

	renderPage() {
		const {
			errors,
			parentTopTenList,
			parentTopTenItem,
			reusableItems,
			reusableItemSuggestions,
			topTenList,
			topTenItemOrganizerData,
			topTenListOrganizerData,
			thisTopTenListTopTenItems,
		} = this.props;

		const {
			canEdit,
			topTenList_name,
			topTenList_description,
		} = this.state;

		if (!topTenList) {
			return;
		}

		let showPrivacyWarning = false;
		let privacyWarningText = '';

		if (canEdit && parentTopTenList) {
			if (topTenList.is_public && !parentTopTenList.is_public) {
				privacyWarningText = 'This public topTenList has a private parent topTenList';
				showPrivacyWarning = true;
			} else if (!topTenList.is_public && parentTopTenList.is_public) {
				privacyWarningText = 'This private topTenList has a public parent topTenList';
				showPrivacyWarning = true;
			}
		}

		let breadcrumbs = <div className="breadcrumbs">Top level list</div>;

		let parentTopTenListId;
		if (parentTopTenList) {
			parentTopTenListId = parentTopTenList.id;

			breadcrumbs = (
				<div className="breadcrumbs">
					<Link to={`/topTenList/${parentTopTenList.id}`}>{parentTopTenList.name}</Link> &gt; {parentTopTenItem.name}
				</div>
			);
		}
		return (
			<div>
				{!isEmpty(errors) && (
					<Container>
						<Row>
							<Col>
								<FlashMessage
									message={formatErrorMessages(errors)}
									type="error"
									onClick={this.onCloseFlashMessage}
								/>
							</Col>
						</Row>
					</Container>
				)}
				{topTenList && (
					<div>
						<Container>
							<Row>
								<Col className="toptenlist-name">
									<EditableTextField
										type="input"
										canEdit={canEdit}
										required={true}
										name="topTenList_name"
										placeholder="Click here to add a name for the list"
										label="Top Ten item name"
										data-state="topTenList_name" // this.state property
										data-entityid={topTenList.id} // database id of the topTenItem
										id="topTenList_name" // id of the html element
										handleInputChange={this.handleInputChange}
										handleNewValue={this.handleNewValue}
										value={topTenList_name}
									/>
									{canEdit && (
										<div className="toptenlist-detail-controls">
											<IsPublicIndicator
												targetId={topTenList.id}
												isPublic={topTenList.is_public}
												onChangeIsPublic={this.onChangeIsPublic}
											/>
											<button type="button" className="btn btn-danger" onClick={this.onDeleteTopTenList}>X</button>
										</div>
									)}
								</Col>
							</Row>
							<Row>
								<Col>
									{canEdit && topTenListOrganizerData.length > 1
										&& (
											<Organizer
												topTenList={topTenList}
												parentTopTenListId={parentTopTenListId}
												topTenListOrganizerData={topTenListOrganizerData}
												topTenItemOrganizerData={topTenItemOrganizerData}
											/>
										)}
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
										type="textarea"
										canEdit={canEdit}
										name="topTenList_description"
										placeholder="Click here to add a description for the topTenList"
										label="Description"
										data-state="topTenList_description" // this.state property
										data-entityid={topTenList.id} // database id of the topTenItem
										id="topTenList_description" // id of the html element
										handleInputChange={this.handleInputChange}
										handleNewValue={this.handleNewValue}
										value={topTenList_description}
									/>
								</Col>
							</Row>
						</Container>
						<Container>
							{thisTopTenListTopTenItems && (
								<TopTenItemsPage
									topTenItems={thisTopTenListTopTenItems}
									topTenList={topTenList.id}
									canEdit={canEdit}
									onCreateChildTopTenList={this.onCreateChildTopTenList}
									onMoveTopTenItemUp={this.onMoveTopTenItemUp}
									onMoveTopTenItemDown={this.onMoveTopTenItemDown}
									reusableItemSuggestions={reusableItemSuggestions}
									reusableItems={reusableItems}
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
		const { isLoading } = this.props;
		const { canView } = this.state;

		if (isLoading) {
			return <Loading />;
		}

		let content;

		if (canView) {
			content = this.renderPage();
		} else {
			content = <p>Either this Top Ten List does not exist or you do not have permission to view it</p>;
		}
		return (
			<div className="toptenlist-detail">
				{ content }
			</div>
		);
	}
}

TopTenListDetails.propTypes = {
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'dispatch': PropTypes.func.isRequired,
	'errors': PropTypes.objectOf(PropTypes.any).isRequired,
	'history': PropTypes.objectOf(PropTypes.any).isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'match': PropTypes.objectOf(PropTypes.any).isRequired,
	'parentTopTenItem': PropTypes.objectOf(PropTypes.any),
	'parentTopTenList': PropTypes.objectOf(PropTypes.any),
	'reusableItems': PropTypes.objectOf(PropTypes.any).isRequired,
	'reusableItemSuggestions': PropTypes.objectOf(PropTypes.any).isRequired,
	'thisTopTenListTopTenItems': PropTypes.arrayOf(PropTypes.any).isRequired, // topTenItems belonging to this topTenList
	'topTenListOrganizerData': PropTypes.arrayOf(PropTypes.any).isRequired, // minimal data for all topTenLists owned by the same user.
	'topTenItemOrganizerData': PropTypes.objectOf(PropTypes.any).isRequired, // minimal data for all topTenLists owned by the same user
	'topTenList': PropTypes.objectOf(PropTypes.any), // may take a while to load
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
