import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { Link } from 'react-router-dom';

const Notification = props => (
	<div className="notification">
		hello: {JSON.stringify(props)}
	</div>
);

export default Notification;
