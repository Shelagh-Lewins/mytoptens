import React from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';

const NotificationsList = ({ children }) => (
	<Container className="notifications-list">
		<Row>
			{children}
		</Row>
	</Container>
);

NotificationsList.propTypes = {
	'children': PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default NotificationsList;
