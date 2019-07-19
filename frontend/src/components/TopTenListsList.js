// List of all topTenLists

import React from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';

const TopTenListsList = ({ children, is_public, headerText }) => (
	<Container className="topTenLists-list">
		{headerText
			&& (
				<Row>
					<Col>
						<h3 className="topTenLists-list-name">
							{headerText}
						</h3>
					</Col>
				</Row>
			)
		}
		<Row>
			{children}
		</Row>
	</Container>
);

TopTenListsList.propTypes = {
	'headerText': PropTypes.string.isRequired,
	'is_public': PropTypes.string.isRequired,
	'children': PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default TopTenListsList;
