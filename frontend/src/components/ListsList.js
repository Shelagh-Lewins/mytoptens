// List of all lists

import React from 'react';
import { Container, Row } from 'reactstrap';

import { LIST_IS_PUBLIC_VALUES } from '../constants';
import { LIST_IS_PUBLIC_TEXTS } from '../constants';

const ListsList = ({ children, is_public }) => {
	const index = LIST_IS_PUBLIC_VALUES.indexOf(is_public === 'true');
	const headerText = LIST_IS_PUBLIC_TEXTS[index];

	return (
		<Container className="lists-list">
			<Row>
				<h3 className="lists-list-name">
					<strong>{headerText}</strong>
				</h3>
			</Row>
			<Row>
				{children}
			</Row>
		</Container>
	);
};

export default ListsList;
