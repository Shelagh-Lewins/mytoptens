import React from 'react';
import { Link } from 'react-router-dom';

const Notification = props => (
	<li className="notification">
		hello: {JSON.stringify(props)}
	</li>
);

export default Notification;
