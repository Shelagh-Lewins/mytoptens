// List of all toptenlists

import React from 'react';
import { Container, Row, Col } from 'reactstrap';

const TopTenListsList = ({ children, is_public, headerText }) => {
	return (
		<Container className="toptenlists-list">
			{headerText &&
			<Row>
				<Col>
					<h3 className="toptenlists-list-name">
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
