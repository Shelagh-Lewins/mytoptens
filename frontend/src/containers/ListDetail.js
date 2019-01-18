import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Container, Row, Col, Label, Input } from 'reactstrap';

import * as lists from '../modules/lists';

class ListDetails extends Component {
	constructor(props) {
		super();
		this.state = {
			// find the slug of the list from the url
			'slug': props.match.params.slug,
		};
	}

	componentDidMount() {
		this.props.dispatch(lists.fetchListBySlug(this.state.slug));
	}

	///////////////

	render() {
		// there should only be one list, and that should be the one we want
		// but check anyway
		let list;
		const things = this.props.lists.things;
		const slug = this.state.slug;

		Object.keys(things).forEach(function(key) {
			if (things[key].slug ===  slug) {
				list = things[key];
			}
		});

		return(
			<Container>
				{list && (
					<div>
						<h2>{list.title}</h2>
						<p>Description {list.description}</p>
					</div>
				)}
			</Container>
		);
	}
}

ListDetails.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired,
	'lists': PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
	'auth': state.auth,
	'errors': state.errors,
	'lists': state.lists,
});

export default connect(mapStateToProps)(withRouter(ListDetails));
