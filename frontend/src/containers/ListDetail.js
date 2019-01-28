import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

import * as lists from '../modules/lists';
//import * as items from '../modules/items';
import * as permissions from '../modules/permissions';

import FlashMessage from '../components/FlashMessage';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import ItemsPage from '../components/ItemsPage';
import { sortedItems } from '../modules/items';

class ListDetails extends Component {
	constructor(props) {
		super();

		// to start with all we know is the slug. We have to find the list id, and then the list details and items can be loaded
		const slug = props.match.params.slug;

		this.state = {
			// find the list slug from the url
			slug,
		};

		props.dispatch(lists.fetchListBySlug(slug));
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	componentDidUpdate(prevProps){
		if (prevProps.isLoading && !this.props.isLoading) {
			// just finished loading, need to check if user should view this list
			this.setState({
				'canView': permissions.canViewList({ 'slug': this.state.slug }),
				'canEdit': permissions.canUpdateList({ 'slug': this.state.slug }),
			});
		}
	}

	renderItemsPage() {
		return <div>
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
			{this.props.list && (
				<Container>
					{this.props.items && (
						<ItemsPage
							items={this.props.items}
							list={this.props.list.id}
							canEdit={this.state.canEdit}
						/>
					)}
				</Container>
			)}
		</div>;
	}

	///////////////

	render() {
		let content;

		if (this.state.canView) {
			content = this.renderItemsPage();
		} else {
			content = <p>Either this list does not exist or you do not have permission to view it</p>;
		}
		return(
			<div>
				{ content }
			</div>
		);
	}
}

ListDetails.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'lists': PropTypes.object.isRequired,
	'items': PropTypes.array.isRequired,
};

const mapStateToProps = (state, ownProps) => {
	const lists = state.lists.things;
	const list = lists[Object.keys(lists)[0]];

	return ({
		'auth': state.auth,
		'errors': state.errors,
		'isLoading': state.lists.isLoading,
		'lists': lists,
		'list': list,
		'items': sortedItems(state),
	});
};

export default connect(mapStateToProps)(withRouter(ListDetails));
