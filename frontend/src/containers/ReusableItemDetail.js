import React, { Component } from 'react';
import {
	Button,
	Label,
	Input,
	Popover,
	PopoverBody,
	Container,
	Row,
	Col,
	Dropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem,
} from 'reactstrap';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withFormik, Field } from 'formik';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FlashMessage from '../components/FlashMessage';
import Loading from '../components/Loading';

import * as reusableItemReducer from '../modules/reusableItem';
import * as topTenListReducer from '../modules/topTenList';
import * as errorsReducer from '../modules/errors';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import sortArrayByProperty from '../modules/sortArrayByProperty';

import IsPublicIndicator from '../components/IsPublicIndicator';
import TopTenListsList from '../components/TopTenListsList';
import TopTenListSummary from '../components/TopTenListSummary';

import './ReusableItemDetail.scss';
import { COLORS } from '../constants';


class ReusableItemDetail extends Component {
	constructor(props) {
		super();

		const id = this.getReusableItemData(props);

		// display text for sort by options
		this.sortByOptions = {
			'name': 'Top Ten List name',
			'user': 'Owner',
			'modified': 'Date of last edit',
		};

		this.state = {
			id,
			'myTopTenListsOnly': true, // start with minimal data on screen
			'popoverOpenreusableItemHelp': false,
			'showMoreTopTenLists': false,
			'showChangeRequestForm': false,
			'sortBy': this.sortByOptions.name,
			'sortDirection': 'ascending',
			'sortDropdownOpen': false,
		};

		// each popover in the component needs an id
		this.popoverIds = {
			'reusableItemHelp': 'reusableItemHelp',
		};

		this.defaultTopTenListsNumber = 10;

		Object.keys(this.popoverIds).map((key) => { // eslint-disable-line array-callback-return
			this.state[`popoverOpen${key}`] = false;
		});

		this.getReusableItemData = this.getReusableItemData.bind(this);
		this.renderReusableItem = this.renderReusableItem.bind(this);
		this.togglePopover = this.togglePopover.bind(this);
		this.toggleChangeRequestForm = this.toggleChangeRequestForm.bind(this);
		this.toggleSortDropdown = this.toggleSortDropdown.bind(this);
		this.changeDropdownValue = this.changeDropdownValue.bind(this);
		this.changeDirectionValue = this.changeDirectionValue.bind(this);

		this.submitChangeRequestForm = this.submitChangeRequestForm.bind(this);
		this.voteOnChangeRequest = this.voteOnChangeRequest.bind(this);
		this.cancelChangeRequest = this.cancelChangeRequest.bind(this);

		this.onChangeTopTenListIsPublic = this.onChangeTopTenListIsPublic.bind(this);
		this.onDeleteTopTenList = this.onDeleteTopTenList.bind(this);

		this.handleTopTenListsChange = this.handleTopTenListsChange.bind(this);
		this.handleShowMoreTopTenListsChange = this.handleShowMoreTopTenListsChange.bind(this);
	}

	componentDidUpdate(prevProps) {
		const {
			match,
			auth,
			reusableItem,
			history,
		} = this.props;

		let { id } = this.state;

		// navigated to a different reusableItem
		if (prevProps.match.params.id !== match.params.id) {
			id = this.getReusableItemData(this.props);

			this.setState({
				id,
			});
		}

		// user has just logged in or out
		if ((auth.user.id && (auth.user.id !== prevProps.auth.user.id))
		|| (prevProps.auth.isAuthenticated !== auth.isAuthenticated)) {
			// console.log('auth change in component');
			this.getReusableItemData(this.props);
		}

		// the reusableItem has been replaced by a new one
		// probably because the user made a popular reusableItem private
		// so all their topTenItems now reference a new, private reusableItem
		// navigate to the new one
		if (reusableItem && reusableItem.targetId) {
			if (reusableItem.targetId !== match.params.id) {
				history.push(`/reusableitem/${reusableItem.targetId}`);
			}
		}
	}

	onChangeTopTenListIsPublic({ id, is_public }) {
		const { dispatch } = this.props;

		dispatch(topTenListReducer.setTopTenListIsPublic({ id, is_public }));
	}


	onDeleteTopTenList({ id, name }) {
		if (confirm(`Are you sure you want to delete the topTenList ${name}`)) { // eslint-disable-line no-restricted-globals
			const { dispatch } = this.props;

			dispatch(topTenListReducer.deleteTopTenList(id));
		}
	}

	getReusableItemData = (props) => {
		// const { auth } = props;
		const { 'id': reusableItemId } = props.match.params;
		// console.log('getReusableItemData');

		props.dispatch(reusableItemReducer.fetchReusableItemDetail(reusableItemId));
		props.dispatch(errorsReducer.clearErrors());
		props.dispatch(topTenListReducer.fetchOrganizerData({ reusableItemId }));
		return reusableItemId;
	}

	onCloseFlashMessage = () => {
		const { dispatch } = this.props;
		dispatch(errorsReducer.clearErrors());
	}

	onChangeIsPublic = ({ id, is_public }) => {
		const { reusableItem } = this.props;
		const currentIsPublic = reusableItem.is_public;

		let text = 'This is a private Reusable Item; only you can see it. If you make it public, other people will be able to use it in their lists and suggest changes to it. Do you want to continue?';

		if (currentIsPublic) {
			text = 'This is a public Reusable Item. This action will make a private copy of it which your Top Ten Items will reference instead. Do you want to continue?';
		}

		if (confirm(text)) { // eslint-disable-line no-restricted-globals
			const { dispatch } = this.props;

			dispatch(reusableItemReducer.setReusableItemIsPublic({ id, is_public }));
		}
	}

	handleTopTenListsChange() {
		const { myTopTenListsOnly } = this.state;

		this.setState({
			'myTopTenListsOnly': !myTopTenListsOnly,
		});
	}

	handleShowMoreTopTenListsChange() {
		const { showMoreTopTenLists } = this.state;

		this.setState({
			'showMoreTopTenLists': !showMoreTopTenLists,
		});
	}

	togglePopover(popoverId) {
		const { [`popoverOpen${popoverId}`]: popoverOpen } = this.state;

		this.setState({
			[`popoverOpen${popoverId}`]: !popoverOpen,
		});
	}

	toggleChangeRequestForm() {
		const { showChangeRequestForm } = this.state;

		this.setState({
			'showChangeRequestForm': !showChangeRequestForm,
		});
	}

	toggleSortDropdown() {
		this.setState(prevState => ({
			'sortDropdownOpen': !prevState.sortDropdownOpen,
		}));
	}

	changeDropdownValue(e) {
		this.setState({ 'sortBy': e.currentTarget.textContent });
	}

	changeDirectionValue(e) {
		this.setState({ 'sortDirection': e.currentTarget.value });
	}

	submitChangeRequestForm(data) {
		const { id } = this.state;
		const { dispatch, reusableItem } = this.props;
		const cleanedData = {};

		// only send changed values
		Object.keys(data).map((key) => { // eslint-disable-line array-callback-return
			if (data[key] !== reusableItem[key]) {
				cleanedData[key] = data[key];
			}
		});

		if (Object.keys(cleanedData).length > 0) {
			dispatch(reusableItemReducer.updateReusableItem(id, cleanedData));
		} else {
			dispatch(errorsReducer.getErrors({ 'Reusable Item': 'No new values have been entered for this Reusable Item' }));
		}
	}

	voteOnChangeRequest(vote) {
		const { id } = this.state;
		const { dispatch } = this.props;

		dispatch(reusableItemReducer.updateReusableItem(id, { vote }));
	}

	cancelChangeRequest() {
		const { id } = this.state;
		const { dispatch } = this.props;
		const text = 'Are you sure you want to cancel the change request?';

		if (confirm(text)) { // eslint-disable-line no-restricted-globals
			// specifying 'cancel' with any value will cancel the change request
			dispatch(reusableItemReducer.updateReusableItem(id, { 'cancel': '' }));
		}
	}

	renderReusableItem() {
		const {
			auth,
			reusableItem,
			'usageData': { users } = { 'users': new Set() },
		} = this.props;

		const reusableItemUsersCount = users.size;
		const { canEdit } = reusableItem;
		const { isAuthenticated, user } = auth;

		const { showChangeRequestForm } = this.state;

		const reusableItemHelpId = this.popoverIds.reusableItemHelp;
		const { [`popoverOpen${reusableItemHelpId}`]: popoverOpen } = this.state;
		const reusableItemIcon = (
			<div className="help-icon">
				<Button id={reusableItemHelpId} type="button" className="name-icon btn bg-transparent">
					<FontAwesomeIcon icon={['fas', 'question-circle']} style={{ 'color': COLORS.HELP }} size="1x" />
				</Button>
				<Popover placement="bottom" isOpen={popoverOpen} target={reusableItemHelpId} toggle={() => this.togglePopover(reusableItemHelpId)} html="true">
					<PopoverBody>
						<p>A Reusable Item is a shared Top Ten Item name that can be used in multiple Top Ten Lists.</p>
						<p>A Reusable Item is private by default, meaning that only its creator can see it.</p>
						<p>If you make a Reusable Item public, other people will be able to use it in their Top Ten Lists and suggest changes to it, even if their lists are private.</p>
						<p>You will never see another user&apos;s private Top Ten Lists, even if it includes a public Reusable Item</p>
					</PopoverBody>
				</Popover>
			</div>
		);

		let changeRequest;

		const BasicChangeRequestForm = (props) => {
			const {
				touched,
				errors,
				handleSubmit,
				isSubmitting,
			} = props;

			return (
				<form onSubmit={handleSubmit}>
					<h3>{reusableItemUsersCount === 0 ? 'Edit' : 'Create a change request'}</h3>
					{reusableItemUsersCount > 0 && (
						<p className="hint">Other users who reference this Reusable Item in their Top Ten Lists will vote on your change request.</p>
					)}
					<Label for="name">Name</Label>
					<Input
						type="text"
						name="name"
						tag={Field}
						component="input"
					/>
					{errors.name && touched.name && <div className="invalid-feedback">{errors.name}</div>}
					<Label for="definition">Definition</Label>
					<Input
						type="text"
						name="definition"
						tag={Field}
						component="input"
					/>
					<Label for="name">Link</Label>
					<Input
						type="text"
						name="link"
						tag={Field}
						component="input"
					/>
					<Button type="button" color="secondary" onClick={props.onCancel}>Cancel</Button>
					<Button type="submit" color="primary" disabled={isSubmitting}>Done</Button>
				</form>
			);
		};

		const EnhancedChangeRequestForm = withFormik({
			'mapPropsToValues': (props: Props) => ({
				'name': props.data.name, 'definition': props.data.definition, 'link': props.data.link,
			}),

			// Custom sync validation
			'validate': (values) => {
				const errors = {};

				if (!values.name || values.name === '') {
					errors.name = 'Name is required';
				}

				return errors;
			},

			// note how to upack onSubmit from props in the FormikBag parameter
			'handleSubmit': (values, { setSubmitting, 'props': { onSubmit, closeForm } }) => {
				onSubmit(values);
				setTimeout(() => {
					setSubmitting(false);
					closeForm();
				}, 1000);
			},

			'displayName': 'ChangeRequestForm',
		})(BasicChangeRequestForm);
		// if no proposed change request exists already
		if (!reusableItem.change_request) {
			if (showChangeRequestForm) { // form to propose a change request
				changeRequest = (
					<Row>
						<Col className="change-request-form">
							<EnhancedChangeRequestForm
								onCancel={this.toggleChangeRequestForm}
								onSubmit={this.submitChangeRequestForm}
								closeForm={this.toggleChangeRequestForm}
								data={reusableItem}
							/>
						</Col>
					</Row>
				);
			} else { // button to show the form
				changeRequest = (
					<div className="change-request-button">
						<Row>
							<Col>
								<Button id="show-change-request-form" type="button" color="primary" className="name-icon btn" onClick={this.toggleChangeRequestForm} title="Edit this Reusable Item">
									<FontAwesomeIcon icon={['fas', 'edit']} style={{ 'color': COLORS.BUTTONSECONDARY }} size="1x" />
								</Button>
							</Col>
						</Row>
					</div>
				);
			}
		} else { // a proposed change request exists
			changeRequest = (
				<div className="proposed-change-request">
					<Row>
						<Col className="changes">
							<h3>Proposed change</h3>
							{reusableItem.change_request.name && (
								<div>Name: {reusableItem.change_request.name}</div>
							)}
							{reusableItem.change_request.link && (
								<div>Link: {reusableItem.change_request.link}</div>
							)}
							{reusableItem.change_request.definition && (
								<div>Definition: {reusableItem.change_request.definition}</div>
							)}
						</Col>
					</Row>
					<Row>
						<Col>
							<h3>Voting</h3>
						</Col>
					</Row>
					<Row>
						<Col md="6" lg="12" className="votes">
							{reusableItem.change_request && (
								<React.Fragment>
									<span>For: {reusableItem.change_request_votes_yes_count}</span>
									<span><button type="button" color="secondary" onClick={() => this.voteOnChangeRequest('yes')}>Vote for change</button></span>
								</React.Fragment>
							)}
						</Col>
						<Col md="6" lg="12" className="votes">
							{reusableItem.change_request && (
								<React.Fragment>
									<span>Against: {reusableItem.change_request_votes_no_count}</span>
									<span><button type="button" color="secondary" onClick={() => this.voteOnChangeRequest('no')}>Vote against change</button></span>
								</React.Fragment>
							)}
						</Col>
					</Row>
					{reusableItem.change_request_my_vote && (
						<React.Fragment>
							<Row>
								<Col>
									My vote: {reusableItem.change_request_my_vote}
								</Col>
							</Row>
							<Row>
								<Col>
									<span><button type="button" color="secondary" onClick={() => this.voteOnChangeRequest('')}>Withdraw my vote</button></span>
								</Col>
							</Row>
						</React.Fragment>
					)}
					{!reusableItem.change_request_my_vote && (
						<React.Fragment>
							<Row>
								<Col>
									You have not yet voted on this change request
								</Col>
							</Row>
						</React.Fragment>
					)}
					{isAuthenticated && reusableItem.change_request_by === user.id
					&& (
						<Row>
							<Col>
								<span><button type="button" color="danger" onClick={() => this.cancelChangeRequest()}>Cancel the change request</button></span>
							</Col>
						</Row>
					)}
				</div>
			);
		}

		return (
			<div className="main">
				<Row>
					<Col className="summary">
						<h2>
							<span className="icon"><FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" /></span>
							{reusableItem.name}
						</h2>
						{canEdit && (
							<div className="reusableitem-summary-controls">
								<IsPublicIndicator
									targetId={reusableItem.id || ''} // in case reusableItem detail not yet loaded
									isPublic={reusableItem.is_public || false}
									onChangeIsPublic={this.onChangeIsPublic}
								/>
							</div>
						)}
						<span className="about">
							Reusable item referenced by {reusableItemUsersCount} users {reusableItemIcon}
						</span>
						{reusableItem.definition && (<p className="definition">{reusableItem.definition}</p>)}
						{reusableItem.link && (<p className="link"><a href={reusableItem.link} target="_blank" rel="noopener noreferrer">{reusableItem.link}</a></p>)}
					</Col>
				</Row>
				{canEdit && changeRequest}
			</div>
		);
	}

	renderTopTenLists() {
		const {
			reusableItem,
			'usageData': { topTenListsArray } = { 'topTenListsArray': [] },
			'usageData': { myTopTenListsArray } = { 'myTopTenListsArray': [] },
		} = this.props;

		const {
			myTopTenListsOnly,
			showMoreTopTenLists,
			sortBy,
			sortDirection,
			sortDropdownOpen,
		} = this.state;

		let TopTenLists = myTopTenListsOnly ? myTopTenListsArray : topTenListsArray;

		switch (sortBy) {
			case this.sortByOptions.name:
				TopTenLists = sortArrayByProperty(TopTenLists, 'name');
				break;

			case this.sortByOptions.user:
				TopTenLists = sortArrayByProperty(TopTenLists, 'created_by_username');
				break;

			case this.sortByOptions.modified:
				TopTenLists = sortArrayByProperty(TopTenLists, 'modified_at');
				break;

			default:
		}

		if (sortDirection === 'descending') {
			TopTenLists.reverse();
		}

		// TODO show date created on top ten item summary

		const numberOfTopTenLists = TopTenLists.length;

		const listHeaderText = myTopTenListsOnly ? `My Top Ten Lists (${TopTenLists.length})` : `All Top Ten Lists (${TopTenLists.length})`;
		if (!showMoreTopTenLists) {
			TopTenLists = TopTenLists.slice(0, this.defaultTopTenListsNumber);
		}

		const directionInputs = [['Ascending', 'ascending'], ['Descending', 'descending']];

		return (
			<div className="usage">
				<Container>
					<Row>
						<Col className="toptenlists">
							<h2>{`Top Ten Lists using ${reusableItem.name}`}</h2>
							<Label check>
								<Input
									type="checkbox"
									defaultChecked={myTopTenListsOnly}
									onChange={this.handleTopTenListsChange}
								/>
								{' '}
								Show my Top Ten lists only
							</Label>
						</Col>
					</Row>
					<Row>
						<Col className="sort-controls">
							Sort by:
							{' '}
							<Dropdown isOpen={sortDropdownOpen} toggle={this.toggleSortDropdown} className="sort-by">
								<DropdownToggle caret>
									{sortBy}
								</DropdownToggle>
								<DropdownMenu>
									<DropdownItem onClick={this.changeDropdownValue}>{this.sortByOptions.name}</DropdownItem>
									<DropdownItem onClick={this.changeDropdownValue}>{this.sortByOptions.user}</DropdownItem>
									<DropdownItem onClick={this.changeDropdownValue}>{this.sortByOptions.modified}</DropdownItem>
								</DropdownMenu>
							</Dropdown>
							<div className="sort-direction">
								{
									directionInputs.map(([text, value]) => (
										<div key={`direction-${value}`}>
											<Label>
												<Input
													type="radio"
													checked={sortDirection === value}
													onChange={this.changeDirectionValue}
													value={value}
												/>
												{text}
											</Label>
										</div>
									))
								}
							</div>
						</Col>
					</Row>
				</Container>
				<TopTenListsList headerText={listHeaderText}>
					{TopTenLists.map(topTenList => (
						<TopTenListSummary
							key={topTenList.id}
							topTenList={topTenList}
							onChangeIsPublic={this.onChangeTopTenListIsPublic}
							onDeleteTopTenList={this.onDeleteTopTenList}
							showCreatedBy={true}
						/>
					))}
				</TopTenListsList>
				{numberOfTopTenLists > this.defaultTopTenListsNumber && (
					<Row>
						<Col>
							<Button type="button" color="secondary" onClick={this.handleShowMoreTopTenListsChange}>{showMoreTopTenLists ? 'Show less' : 'Show more'}</Button>
						</Col>
					</Row>
				)}
			</div>
		);
	}

	renderPage() {
		const {
			reusableItem,
			errors,
		} = this.props;

		if (!reusableItem) {
			return undefined;
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
				{this.renderReusableItem()}
				{this.renderTopTenLists()}
			</div>
		);
	}

	render() {
		const { reusableItem, isLoading } = this.props;

		if (isLoading) {
			return <Loading />;
		}

		let content;

		if (reusableItem && reusableItem.canView) {
			content = this.renderPage();
		} else {
			content = <p>This Reusable Item does not exist or you do not have permission to see it.</p>;
		}
		return (
			<div className="reusableitem-detail">
				{ content }
			</div>
		);
	}
}

ReusableItemDetail.defaultProps = {
	'reusableItem': undefined,
};

ReusableItemDetail.propTypes = {
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'dispatch': PropTypes.func.isRequired,
	'errors': PropTypes.objectOf(PropTypes.any).isRequired,
	'history': PropTypes.objectOf(PropTypes.any).isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'reusableItem': PropTypes.objectOf(PropTypes.any),
	'match': PropTypes.objectOf(PropTypes.any).isRequired,
	'usageData': PropTypes.objectOf(PropTypes.any).isRequired,
};

const mapStateToProps = (state, ownProps) => {
	const reusableItemId = ownProps.match.params.id;
	const usageData = topTenListReducer.getReusableItemUsageData(state, reusableItemId);

	return {
		'auth': state.auth,
		'errors': state.errors,
		'isLoading': state.reusableItem.isLoading,
		'isLoadingOrganizerData': state.topTenList.isLoadingOrganizerData,
		'reusableItem': reusableItemReducer.getReusableItem(state, reusableItemId, usageData.myTopTenListsArray),
		'usageData': usageData,
	};
};

export default connect(mapStateToProps)(ReusableItemDetail);
