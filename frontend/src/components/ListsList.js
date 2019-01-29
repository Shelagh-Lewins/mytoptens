// List of all lists

import React from 'react';
import { Container, Row } from 'reactstrap';

const ListsList = ({ children, is_public, headerText }) => {
	return (
		<Container className="lists-list">
			{headerText && <Row>
				<h3 className="lists-list-name">
					{headerText}
				</h3>
			</Row>}
			<Row>
				{children}
			</Row>
		</Container>
	);
};

export default ListsList;
