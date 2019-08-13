import React, { Component } from 'react';
import { Button, Label, Input, Popover, PopoverHeader, PopoverBody, Container, Row, Col } from 'reactstrap';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { withFormik, Formik, Field, Form, ErrorMessage } from 'formik';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FlashMessage from '../components/FlashMessage';
import Loading from '../components/Loading';

import * as reusableItemReducer from '../modules/reusableItem';
import * as errorsReducer from '../modules/errors';
import * as permissions from '../modules/permissions';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';

import IsPublicIndicator from '../components/IsPublicIndicator';

import './ReusableItemDetails.scss';
import { COLORS } from '../constants';


class ReusableItemDetails extends Component {
	constructor(props) {
		super();

		this.getReusableItemData = this.getReusableItemData.bind(this);
		this.renderReusableItem = this.renderReusableItem.bind(this);
		const id = this.getReusableItemData(props);

		this.state = {
			id,
			'popoverOpenreusableItemHelp': false,
			'showProposeModificationForm': false,
		};

		// each popover in the component needs an id
		this.popoverIds = {
			'reusableItemHelp': 'reusableItemHelp',
		};

		Object.keys(this.popoverIds).map((key) => {
			this.state[`popoverOpen${key}`] = false;
		});

		this.togglePopover = this.togglePopover.bind(this);
		this.toggleProposeModificationForm = this.toggleProposeModificationForm.bind(this);
		this.submitProposeModificationForm = this.submitProposeModificationForm.bind(this);
		this.VoteOnModification = this.VoteOnModification.bind(this);
	}

	componentDidUpdate(prevProps) {
		const {
			isLoading,
			match,
			auth,
			reusableItem,
			history,
		} = this.props;
		let { id } = this.state;
		// console.log('props', this.props);
		if (prevProps.isLoading && !isLoading) {
			// just finished loading; need to check if user should view this reusableItem
			const canViewReusableItem = permissions.canViewReusableItem(id);

			this.setState({
				'canView': canViewReusableItem,
			});
		}

		// user has navigated to a different reusableItem
		if (prevProps.match.params.id !== match.params.id) {
			id = this.getReusableItemData(this.props);

			this.setState({
				id,
			});
		}

		// user has just logged out
		// store needs to be repopulated
		if (prevProps.auth.isAuthenticated && !auth.isAuthenticated) {
			id = this.getReusableItemData(this.props);
			this.setState({
				id,
			});
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

	getReusableItemData = (props) => {
		const { 'id': reusableItemId } = props.match.params;

		props.dispatch(reusableItemReducer.fetchReusableItemDetail(reusableItemId));
		props.dispatch(errorsReducer.clearErrors());
		return reusableItemId;
	}


	onCloseFlashMessage = () => {
		const { dispatch } = this.props;
		dispatch(errorsReducer.clearErrors());
	}

	onChangeIsPublic = ({ id, is_public }) => {
		const { reusableItem } = this.props;
		const currentIsPublic = reusableItem.is_public;

		let text = 'This is a private Reusable Item; only you can see it. If you make it public, other people will be able to use it in their lists and suggest modifications to it. Do you want to continue?';

		if (currentIsPublic) {
			text = 'This is a public Reusable Item. This action will make a private copy of it which your lists will reference. Do you want to continue?';
		}

		if (confirm(text)) { // eslint-disable-line no-restricted-globals
			const { dispatch } = this.props;

			dispatch(reusableItemReducer.setReusableItemIsPublic({ id, is_public }));
		}
	}

	togglePopover(popoverId) {
		const { [`popoverOpen${popoverId}`]: popoverOpen } = this.state;
		// const popoverOpen = this.state[`popoverOpen${popoverId}`];
		this.setState({
			[`popoverOpen${popoverId}`]: !popoverOpen,
		});
	}

	toggleProposeModificationForm() {
		const { showProposeModificationForm } = this.state;

		this.setState({
			'showProposeModificationForm': !showProposeModificationForm,
		});
	}

	submitProposeModificationForm(data) {
		const { id } = this.state;
		const { dispatch, reusableItem } = this.props;
		const cleanedData = {};

		// only send changed values
		Object.keys(data).map((key) => {
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

	VoteOnModification(vote) {
		const { id } = this.state;
		const { dispatch } = this.props;

		dispatch(reusableItemReducer.updateReusableItem(id, { vote }));
	}

	renderReusableItem() {
		const { reusableItem } = this.props;
		const { showProposeModificationForm } = this.state;

		const reusableItemHelpId = this.popoverIds.reusableItemHelp;
		const { [`popoverOpen${reusableItemHelpId}`]: popoverOpen } = this.state;
		const reusableItemIcon = (
			<div className="help-icon">
				<Button id={reusableItemHelpId} type="button" className="name-icon btn bg-transparent">
					<FontAwesomeIcon icon={['fas', 'question-circle']} style={{ 'color': COLORS.HELP }} size="1x" />
				</Button>
				<Popover placement="bottom" isOpen={popoverOpen} target={reusableItemHelpId} toggle={() => this.togglePopover(reusableItemHelpId)} html="true">
					<PopoverBody>
						<p>A Reusable Item is a shared Top Ten Item name that can be used in multiple lists.</p>
						<p>A Reusable Item is private by default, meaning that only its creator can see it.</p>
						<p>If you make a Reusable Item public, other people will be able to use it in their Top Ten Lists and suggest changes to it, even if their lists are private.</p>
						<p>You will never see another user&apos;s private Top Ten Lists, even if it includes a public Reusable Item</p>
					</PopoverBody>
				</Popover>
			</div>
		);

		let modification;

		// TODO if proposed modification exists, show it and allow vote if conditions met. Show votes and number required for resolution. Should this information come from the server?
		// if no proposed modification exists, and user references reusableItem, allow them to propose a modification if verified
		// props.topTenItems is array of my topTenItems that reference this reusableItem

		const BasicModificationForm = (props) => {
			const {
				touched,
				errors,
				handleSubmit,
				isSubmitting,
			} = props;

			return (
				<form onSubmit={handleSubmit}>
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

		const EnhancedModificationForm = withFormik({
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

			'displayName': 'ModificationForm',
		})(BasicModificationForm);

		// if no proposed modification exists already
		if (!reusableItem.proposed_modification || (reusableItem.proposed_modification && reusableItem.proposed_modification.length === 0)) {
			if (showProposeModificationForm) { // form to propose a modification
				modification = (
					<Row>
						<Col className="modification-form">
							<EnhancedModificationForm
								onCancel={this.toggleProposeModificationForm}
								onSubmit={this.submitProposeModificationForm}
								closeForm={this.toggleProposeModificationForm}
								data={reusableItem}
							/>
						</Col>
					</Row>
				);
			} else { // button to show the form
				modification = (
					<div className="modification-button">
						<Row>
							<Col>
								<Button id="show-propose-modification-form" type="button" color="primary" className="name-icon btn" onClick={this.toggleProposeModificationForm} title="Edit this Reusable Item">
									<FontAwesomeIcon icon={['fas', 'edit']} style={{ 'color': COLORS.BUTTONSECONDARY }} size="1x" />
								</Button>
							</Col>
						</Row>
					</div>
				);
			}
		} else if (reusableItem.proposed_modification && reusableItem.proposed_modification.length > 0) { // a proposed modification exists
			let votesYes = 0;
			let votesNo = 0;

			if (reusableItem.proposed_modification[0].votes_yes) {
				votesYes = reusableItem.proposed_modification[0].votes_yes.length();
			}

			if (reusableItem.proposed_modification[0].votes_no) {
				votesNo = reusableItem.proposed_modification[0].votes_no.length();
			}

			modification = (
				<div className="proposed-modification">
					<Row>
						<Col className="changes">
							<h3>Proposed change</h3>
							{reusableItem.proposed_modification[0].name && (
								<div>Name: {reusableItem.proposed_modification[0].name}</div>
							)}
							{reusableItem.proposed_modification[0].link && (
								<div>Link: {reusableItem.proposed_modification[0].link}</div>
							)}
							{reusableItem.proposed_modification[0].definition && (
								<div>Definition: {reusableItem.proposed_modification[0].definition}</div>
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
							{reusableItem.proposed_modification[0] && (
								<React.Fragment>
									<span>For: {votesYes}</span>
									<span><button type="button" color="secondary" onClick={() => this.VoteOnModification('yes')}>Vote for change</button></span>
								</React.Fragment>
							)}
						</Col>
						<Col md="6" lg="12" className="votes">
							{reusableItem.proposed_modification[0] && (
								<React.Fragment>
									<span>Against: {votesNo}</span>
									<span><button type="button" color="secondary" onClick={() => this.VoteOnModification('no')}>Vote against change</button></span>
								</React.Fragment>
							)}
						</Col>
					</Row>
				</div>
			);
		}

		return (
			<React.Fragment>
				<Row>
					<Col className="summary">
						<h2>
							<span className="icon"><FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" /></span>
							{reusableItem.name}
						</h2>
						{true && (
							<div className="reusableitem-summary-controls">
								<IsPublicIndicator
									targetId={reusableItem.id || ''} // in case reusableItem detail not yet loaded
									isPublic={reusableItem.is_public || false}
									onChangeIsPublic={this.onChangeIsPublic}
								/>
							</div>
						)}
						<span className="about">
							Reusable item
							{reusableItemIcon}
						</span>
						{reusableItem.definition && (<p className="definition">{reusableItem.definition}</p>)}
						{reusableItem.link && (<p className="link"><a href={reusableItem.link} target="_blank" rel="noopener noreferrer">{reusableItem.link}</a></p>)}
					</Col>
				</Row>
				{modification}
			</React.Fragment>
		);
	}

	renderPage() {
		const { reusableItem, errors } = this.props;

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
			</div>
		);
	}

	render() {
		const { isLoading } = this.props;

		if (isLoading) {
			return <Loading />;
		}

		let content;

		const { canView } = this.state;
		if (canView) {
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

ReusableItemDetails.defaultProps = {
	'reusableItem': undefined,
};

ReusableItemDetails.propTypes = {
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'dispatch': PropTypes.func.isRequired,
	'errors': PropTypes.objectOf(PropTypes.any).isRequired,
	'history': PropTypes.objectOf(PropTypes.any).isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'reusableItem': PropTypes.objectOf(PropTypes.any),
	'match': PropTypes.objectOf(PropTypes.any).isRequired,
};

const mapStateToProps = (state, ownProps) => ({
	'auth': state.auth,
	'errors': state.errors,
	'isLoading': state.reusableItem.isLoading,
	'reusableItem': state.reusableItem.things[ownProps.match.params.id],
	'topTenItems': reusableItemReducer.getMyTopTenItemsForReusableItem(state, ownProps), // topTenItems that reference this reusableItem
});

export default connect(mapStateToProps)(ReusableItemDetails);
