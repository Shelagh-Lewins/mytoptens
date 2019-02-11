// List of all lists

import React from 'react';
import { Container, Row, Col } from 'reactstrap';

const ListsList = ({ children, is_public, headerText }) => {
	return (
		<Container className="lists-list">
			{headerText &&
			<Row>
				<Col>
					<h3 className="lists-list-name">
						{headerText}
					</h3>
				</Col>
			</Row>}
			<Row>
				{children}
			</Row>
		</Container>
	);
};

export default ListsList;
