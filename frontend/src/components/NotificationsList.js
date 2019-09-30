import React from 'react';
import PropTypes from 'prop-types';

const NotificationsList = ({ children, showDeleteAllButton, onClickDeleteAll }) => (
	<div className="notifications-list">
		<span className="header">Notifications</span>
		{showDeleteAllButton && <button type="button" className="btn btn-danger delete-all" onClick={() => onClickDeleteAll()}>Delete all notifications</button>}
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
	'onClickDeleteAll': PropTypes.func.isRequired,
	'showDeleteAllButton': PropTypes.bool.isRequired,
};

export default NotificationsList;
