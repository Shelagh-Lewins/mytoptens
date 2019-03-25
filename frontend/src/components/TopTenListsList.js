// List of all topTenLists

import React from 'react';
import { Container, Row, Col } from 'reactstrap';

const TopTenListsList = ({ children, is_public, headerText }) => {
	return (
		<Container className="topTenLists-list">
			{headerText &&
			<Row>
				<Col>
					<h3 className="topTenLists-list-name">
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

export default TopTenListsList;
