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
import * as permissions from '../modules/permissions';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';

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
			'showOrganizer': false,
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
	}

	componentDidUpdate(prevProps) {
		const { isLoading, match, auth } = this.props;
		let { id } = this.state;

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
	}

	getReusableItemData = (props) => {
		const { id } = props.match.params;

		props.dispatch(reusableItemReducer.fetchReusableItemDetail(id));
		props.dispatch(clearErrors());
		return id;
	}

	togglePopover(popoverId) {
		const popoverOpen = this.state[`popoverOpen${popoverId}`];
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

	renderReusableItem() {
		const { reusableItem } = this.props;
		const { showProposeModificationForm } = this.state;

		const reusableItemHelpId = this.popoverIds.reusableItemHelp;
		const reusableItemIcon = (
			<div className="help-icon">
				<Button id={reusableItemHelpId} type="button" className="name-icon btn bg-transparent">
					<FontAwesomeIcon icon={['fas', 'question-circle']} style={{ 'color': COLORS.HELP }} size="1x" />
				</Button>
				<Popover placement="bottom" isOpen={this.state[`popoverOpen${reusableItemHelpId}`]} target={reusableItemHelpId} toggle={() => this.togglePopover(reusableItemHelpId)} html="true">
					<PopoverBody>A Reusable Item is a shared Top Ten Item name that can be used by anybody in a Top Ten Item. Although the Reusable Item can be seen by anybody, nobody will see your list unless you make the list public.</PopoverBody>
				</Popover>
			</div>
		);

		let modification;
		console.log('test', reusableItem);

		const BasicModificationForm = (props) => {
			const {
				values,
				touched,
				errors,
				handleChange,
				handleBlur,
				handleSubmit,
				isSubmitting,
				onCancel
			} = props;
			console.log('props ', props);
			return (
				<form onSubmit={handleSubmit}>
					<Label for="name">Name</Label>
					<Input
						type="text"
						name="name"
						tag={Field}
						component="input"
						value={props.data.name}
					/>
					{errors.name && touched.name && <div id="feedback">{errors.name}</div>}
					<Button type="button" color="secondary" onClick={props.onCancel}>Cancel</Button>
					<Button type="submit" disabled={isSubmitting}>Done</Button>
				</form>
			);
		};

		const EnhancedModificationForm = withFormik({
			// 'mapPropsToValues': () => ({'name': 'bob'}),

			// Custom sync validation
			'validate': (values) => {
				const errors = {};

				if (!values.name) {
					errors.name = 'Name is required';
				}

				return errors;
			},

			'handleSubmit': (values, { setSubmitting }) => {
				setTimeout(() => {
					alert(JSON.stringify(values, null, 2));
					setSubmitting(false);
				}, 1000);
			},

			'displayName': 'ModificationForm',
		})(BasicModificationForm);

		if (reusableItem.proposed_modification.length === 0) {
			if (showProposeModificationForm) {
				modification = (
					<div className="modification-form">
						<EnhancedModificationForm
							onCancel={this.toggleProposeModificationForm}
							data={reusableItem}
						/>
					</div>
				);
			} else {
				modification = (
					<Button id="show-propose-modification-form" type="button" color="secondary" className="name-icon btn" onClick={this.toggleProposeModificationForm}>
						<FontAwesomeIcon icon={['fas', 'edit']} style={{ 'color': COLORS.BUTTONSECONDARY }} size="1x" />
					</Button>
				);
			}
		}

		return (
			<React.Fragment>
				<Row>
					<Col className="summary">
						<h2>
							<span className="icon"><FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" /></span>
							{reusableItem.name}
						</h2>
						<div className="about">
							Reusable item
							{reusableItemIcon}
						</div>
						{reusableItem.definition && (<p>{reusableItem.definition}</p>)}
						{reusableItem.link && (<p><a href={reusableItem.link} target="_blank" rel="noopener noreferrer">{reusableItem.link}</a></p>)}
					</Col>
				</Row>
				<Row>
					<Col className="summary">
						{modification}
					</Col>
				</Row>
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
});

export default connect(mapStateToProps)(ReusableItemDetails);
