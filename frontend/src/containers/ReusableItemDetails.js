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
	}

	componentDidUpdate(prevProps) {
		const {
			isLoading,
			match,
			auth,
			reusableItem,
			history
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

		// if (id !== match.params.id) {
		console.log('id from state', id);
		console.log('id from props', match.params.id);
		/* if (reusableItem) {
			console.log('targetId', reusableItem.targetId);
			history.push(`/reusableitem/${currentReusableItem.id}`);
		} */
		// }
		// the reusableItem has been replaced by a new one
		// probably because the user made a popular reusableItem private
		// so all their topTenItems now reference a new, private reusableItem
		// we need to show this one so navigate to it
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

		let text = 'This is a private Reusable Item; only you can see it. If you make it public, other people will be able to use it in their lists and suggest modifications to it. Are you sure you want to continue?';

		if (currentIsPublic) {
			text = 'This is a public Reusable Item. Are you sure you want to make it private? If other people have lists which use this Reusable Item, the public Reusable Item will still exist, but your lists will reference a new private copy of it.';
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
					<PopoverBody>A Reusable Item is a shared Top Ten Item name that can be used by anybody. Although the Reusable Item can be seen by anybody, nobody will see your list unless you make the list public.</PopoverBody>
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

		if (reusableItem.proposed_modification && reusableItem.proposed_modification.length === 0) {
			if (showProposeModificationForm) {
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
			} else {
				modification = (
					<Row>
						<Col className="modification-button">
							<Button id="show-propose-modification-form" type="button" color="primary" className="name-icon btn" onClick={this.toggleProposeModificationForm} title="Edit this Reusable Item">
								<FontAwesomeIcon icon={['fas', 'edit']} style={{ 'color': COLORS.BUTTONSECONDARY }} size="1x" />
							</Button>
						</Col>
					</Row>
				);
			}
		} else {
			modification = (<span>TODO show proposed modification and voting if appropriate, see TODO in comments</span>);
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
									targetId={reusableItem.id}
									isPublic={reusableItem.is_public}
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
			content = <p>This Reusable Item does not exist</p>;
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
