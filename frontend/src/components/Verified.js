// Shown after user successfully verifies email address

import React, { Component } from 'react';

import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

class Verified extends Component {
	constructor() {
		super();
		this.state = {
			'errors': {}
		};
	}

	render() {
		return(
			<Container>
				<h2>Your email address has been verified</h2>
				<Row>
					<Col>
						<Link to="/login" className="nav-link">Login</Link>
					</Col>
				</Row>
			</Container>
		);
	}
}

export default Verified;
