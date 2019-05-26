import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import Loading from '../components/Loading';

import * as reusableItemReducer from '../modules/reusableItem';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';

class ReusableItemDetails extends Component {
	constructor(props) {
		super();

		// load the topTenList and any parent / children
		this.getReusableItemData = this.getReusableItemData.bind(this);
		const id = this.getReusableItemData(props);

		this.state = {
			id,
			'showOrganizer': false,
		};

		this.onDeleteTopTenList = this.onDeleteTopTenList.bind(this);
	}

	getReusableItemData = (props) => {
		const id = props.match.params.id;

		props.dispatch(reusableItemReducer.fetchReusableItemDetail(id));
		props.dispatch(clearErrors());
		return id;
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
				{this.props.isLoading && <Loading />}
				<Row>
					<Col>
					I'm a reusable item
					</Col>
				</Row>
			</div>
		);
	}

	render() {
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
	return ({
		'auth': state.auth,
		'errors': state.errors,
		'isLoading': state.topTenList.isLoading,
	});
};

export default connect(mapStateToProps)(ReusableItemDetails);
