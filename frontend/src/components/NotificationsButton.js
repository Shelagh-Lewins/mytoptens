import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import * as notificationReducer from '../modules/notification';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import NotificationsList from './NotificationsList';
import Notification from './Notification';

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
		this.onClickNotification = this.onClickNotification.bind(this);
	}

	componentDidUpdate = (prevProps) => {
		console.log('Notifications ***');
		console.log('notifications button old pathname', prevProps.pathname);
		console.log('notifications button pathname', this.props.pathname);

		if (prevProps.pathname !== this.props.pathname) {
			console.log('change');
			this.setState({
				'showNotificationsList': false,
			});
		}
	}

	onClickButton = () => {
		const { dispatch, notifications } = this.props;
		const { showNotificationsList } = this.state;

		this.setState({
			'showNotificationsList': !showNotificationsList,
		});

		dispatch(notificationReducer.setNew(notifications, false));
	}

	onClickNotification = (id) => {
		const { dispatch } = this.props;

		this.setState({
			'showNotificationsList': false,
		});

		dispatch(notificationReducer.updateNotification(id, 'unread', false));
	}

	render() {
		const { notifications, reusableItems, newNotificationsCount } = this.props;
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

				{newNotificationsCount > 0
					&& (
						<span className="badge new">{newNotificationsCount}</span>
					)}

				{showNotificationsList
					&& (
						<NotificationsList>
							{notifications.length > 0
								&& notifications.map(notification => (
									<Notification
										notification={notification}
										key={notification.id}
										onClickNotification={this.onClickNotification}
										reusableItem={reusableItems[notification.reusableItem]}
									/>
								))}
							{notifications.length === 0
								&& (
									<li>You have no notifications</li>
								)
							}
						</NotificationsList>
					)
				}
			</span>
		);
	}
}

NotificationsButton.defaultProps = {
	'reusableItems': {},
};

NotificationsButton.propTypes = {
	'dispatch': PropTypes.func.isRequired,
	'history': PropTypes.objectOf(PropTypes.any).isRequired,
	'newNotificationsCount': PropTypes.number.isRequired,
	'notifications': PropTypes.arrayOf(PropTypes.any).isRequired,
	'reusableItems': PropTypes.objectOf(PropTypes.any),
};

export default NotificationsButton;
