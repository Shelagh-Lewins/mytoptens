import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Container, Row, Col, Label, Input } from 'reactstrap';

class ListDetails extends Component {
	constructor(props) {
		super();
		this.state = {};

		console.log(' slug ', props.match.params.slug);
	}

	componentDidMount() {

	}

	///////////////

	render() {
		return(
			<Container>
				<h2>List detail {this.props.match.params.slug}</h2>

			</Container>
		);
	}
}

ListDetails.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired
};

const mapStateToProps = state => ({
	'auth': state.auth,
	'errors': state.errors
});

export default connect(mapStateToProps)(withRouter(ListDetails));
