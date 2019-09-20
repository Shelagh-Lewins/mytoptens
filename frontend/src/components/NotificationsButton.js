import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import NotificationsList from './NotificationsList';
import Notification from './Notification';

import store from '../store';

import { COLORS } from '../constants';
import './NotificationsButton.scss';

class NotificationsButton extends Component {
	constructor(props) {
		super();

		// console.log('props', props);

		this.state = {
			'showNotificationsList': false,
		};

		this.onClickButton = this.onClickButton.bind(this);
	}

	onClickButton = () => {
		console.log('clicked');
		const { showNotificationsList } = this.state;
		console.log(showNotificationsList);
		this.setState({
			'showNotificationsList': !showNotificationsList,
		});
	}

	render() {
		const { notifications } = this.props;
		const { showNotificationsList } = this.state;
		// TODO show message if no notifications
		// TODO check for notifications every few seconds
		// TODO pull in reusable item data so name can be shown
		// TODO show meaningful message
		// TODO link to reusable item / top ten item
		// TODO show badge count of new notifications
		// TODO delete notifications
		// TODO limit total number of notifications shown?

		// Link is used for formatting consistency with the navbar links
		return (
			<span className="notifications-nav">
				<Link to="#" className="nav-link" onClick={this.onClickButton}><span className="icon" title="New reusable item"><FontAwesomeIcon icon={['fas', 'bell']} style={{ 'color': COLORS.BUTTONNOTIFICATIONS }} size="1x" /></span></Link>

				{showNotificationsList
					&& (
						<NotificationsList>
							{notifications.map(notification => (
								<Notification
									notification={notification}
									key={notification.id}
									reusableItem={store.getState().reusableItem.things[notification.reusableItem]}
								/>
							))}
						</NotificationsList>
					)
				}
			</span>
		);
	}
}

NotificationsButton.defaultProps = {
	'notifications': [],
};

NotificationsButton.propTypes = {
	'notifications': PropTypes.arrayOf(PropTypes.any),
};

export default NotificationsButton;
