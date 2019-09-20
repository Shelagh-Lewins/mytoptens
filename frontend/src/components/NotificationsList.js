import React from 'react';
import PropTypes from 'prop-types';

const NotificationsList = ({ children }) => (
	<div className="notifications-list">
		<span className="header">Notifications</span>
		<ul>
			{children}
		</ul>
	</div>
);

NotificationsList.defaultProps = {
	'children': [],
};

NotificationsList.propTypes = {
	'children': PropTypes.arrayOf(PropTypes.any),
};

export default NotificationsList;
