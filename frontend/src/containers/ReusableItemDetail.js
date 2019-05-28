import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import Loading from '../components/Loading';

import * as reusableItemReducer from '../modules/reusableItem';
import * as permissions from '../modules/permissions';
import findObjectByProperty from '../modules/findObjectByProperty';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';

class ReusableItemDetails extends Component {
	constructor(props) {
		super();

		// load the topTenList and any parent / children
		this.getReusableItemData = this.getReusableItemData.bind(this);
		this.renderReusableItem = this.renderReusableItem.bind(this);
		const id = this.getReusableItemData(props);

		this.state = {
			id,
			'showOrganizer': false,
		};
	}

	componentDidUpdate(prevProps) {
		if (prevProps.isLoading && !this.props.isLoading) {
			// just finished loading; need to check if user should view this reusableItem
			const canViewReusableItem = permissions.canViewReusableItem(this.state.id);

			this.setState({
				'canView': canViewReusableItem,
			});
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
			this.getReusableItemData(this.props);
		}
	}

	getReusableItemData = (props) => {
		const id = props.match.params.id;

		props.dispatch(reusableItemReducer.fetchReusableItemDetail(id));
		props.dispatch(clearErrors());
		return id;
	}

	renderReusableItem() {
		return (
			<Row>
				<Col>
					<h2>{this.props.reusableItem.name}</h2>
					{this.props.reusableItem.definition && (<p>{this.props.reusableItem.definition}</p>)}
					{this.props.reusableItem.link && (<p><a href={this.props.reusableItem.link} target="_blank">{this.props.reusableItem.link}</a></p>)}
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
			content = <p>Either this Reusable Item does not exist or you do not have permission to view it</p>;
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
