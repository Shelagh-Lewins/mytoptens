import React, { Component } from 'react';
import { Button, Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';

import FlashMessage from '../components/FlashMessage';
import Loading from '../components/Loading';

import * as reusableItemReducer from '../modules/reusableItem';
import * as permissions from '../modules/permissions';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';

import './ReusableItemDetails.scss';
import { COLORS } from '../constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
		};

		// each popover in the component needs an id
		this.popoverIds = {
			'reusableItemHelp': 'reusableItemHelp',
		};

		Object.keys(this.popoverIds).map((key) => {
			this.state[`popoverOpen${key}`] = false;
		});

		this.togglePopover = this.togglePopover.bind(this);
	}

	togglePopover(popoverId) {
		this.setState({
			[`popoverOpen${popoverId}`]: !this.state[`popoverOpen${popoverId}`]
		});
	}

	componentDidUpdate(prevProps) {
		if (prevProps.isLoading && !this.props.isLoading) {
			// just finished loading; need to check if user should view this reusableItem
			const canViewReusableItem = permissions.canViewReusableItem(this.state.id);

			this.setState({
				'canView': canViewReusableItem,
			});
		}

		// user has navigated to a different reusableItem
		if (prevProps.match.params.id !== this.props.match.params.id) {
			const id = this.getReusableItemData(this.props);
			this.setState({
				id,
			});
		}

		// user has just logged out
		// store needs to be repopulated
		if (prevProps.auth.isAuthenticated && !this.props.auth.isAuthenticated) {
			const id = this.getReusableItemData(this.props);
			this.setState({
				id,
			});
		}
	}

	getReusableItemData = (props) => {
		const id = props.match.params.id;

		props.dispatch(reusableItemReducer.fetchReusableItemDetail(id));
		props.dispatch(clearErrors());
		return id;
	}

	renderReusableItem() {
		const reusableItemHelpId = this.popoverIds['reusableItemHelp'];
		const reusableItemIcon = (
			<div className="help-icon">
				<Button id={reusableItemHelpId} type="button" className="name-icon btn bg-transparent">
					<FontAwesomeIcon icon={['fas', 'question-circle']} style={{ 'color': COLORS.HELP }} size="1x" />
				</Button>
				<Popover placement="bottom" isOpen={this.state[`popoverOpen${reusableItemHelpId}`]} target={reusableItemHelpId} toggle={() => this.togglePopover(reusableItemHelpId)} html="true">
					<PopoverBody>A Reusable Item is a shared Top Ten Item name that can be used by anybody in a Top Ten Item. Although the Reusable Item can be seen by anybody, nobody will see your list unless you make the list public.
					</PopoverBody>
				</Popover>
			</div>
		);

		let modifications;

		if (this.props.reusableItem.proposed_modification.length == 0) {

		}

		return (
			<Row>
				<Col className="summary">
					<h2><span className="icon"><FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" /></span>{this.props.reusableItem.name}</h2>
					<div className="about">Reusable item{reusableItemIcon}</div>
					{this.props.reusableItem.definition && (<p>{this.props.reusableItem.definition}</p>)}
					{this.props.reusableItem.link && (<p><a href={this.props.reusableItem.link} target="_blank" rel="noopener noreferrer">{this.props.reusableItem.link}</a></p>)}
				</Col>
			</Row>
		);
	}

	renderPage() {
		if (!this.props.reusableItem) {
			return;
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
				{this.renderReusableItem()}
			</div>
		);
	}

	render() {
		if (this.props.isLoading) {
			return <Loading />;
		}

		let content;

		if (this.state.canView) {
			content = this.renderPage();
		} else {
			content = <p>This Reusable Item does not exist</p>;
		}
		return(
			<div className="reusableitem-detail">
				{ content }
			</div>
		);
	}
}

ReusableItemDetails.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired,
	'isLoading': PropTypes.bool.isRequired,

};

const mapStateToProps = (state, ownProps) => {
	// first find the target topTenList
	//const reusableItem = findObjectByProperty({ 'property': 'id', 'value': ownProps.match.params.id });

	return ({
		'auth': state.auth,
		'errors': state.errors,
		'isLoading': state.reusableItem.isLoading,
		'reusableItem': state.reusableItem.things[ownProps.match.params.id],
	});
};

export default connect(mapStateToProps)(ReusableItemDetails);
