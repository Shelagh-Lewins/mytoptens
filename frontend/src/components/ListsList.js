// List of all lists

import React from 'react';
import ListSummary from './ListSummary';
import { Container, Row } from 'reactstrap';

import { LIST_IS_PUBLIC_VALUES } from '../constants';
import { LIST_IS_PUBLIC_TEXTS } from '../constants';

const ListsList = props => {
	const index = LIST_IS_PUBLIC_VALUES.indexOf(props.is_public === 'true');
	const headerText = LIST_IS_PUBLIC_TEXTS[index];

	return (
		<Container className="lists-list">
			<Row>
				<h3 className="lists-list-name">
					<strong>{headerText}</strong>
				</h3>
			</Row>
			<Row>
				{props.lists.map(list => (
					<ListSummary
						key={list.id}
						list={list}
						onIsPublicChange={props.onIsPublicChange}
						onDeleteList={props.onDeleteList}
					/>
				))}
			</Row>
		</Container>
	);
};

export default ListsList;
