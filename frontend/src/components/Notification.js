import React from 'react';
import { Link } from 'react-router-dom';

const Notification = (props) => {
	console.log('notification props', props);
	const { notification } = props;

	return (
		<li className="notification">
			event: {notification.event}
		</li>
	);
};

export default Notification;
