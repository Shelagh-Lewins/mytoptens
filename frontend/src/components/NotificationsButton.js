import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import * as notificationReducer from '../modules/notification';

import NotificationsList from './NotificationsList';
import Notification from './Notification';

import { COLORS } from '../constants';
import './NotificationsButton.scss';

class NotificationsButton extends Component {
	constructor(props) {
		super();

		this.state = {
			'showNotificationsList': false,
		};

		this.fetchNotifications = this.fetchNotifications.bind(this);
		this.onClickButton = this.onClickButton.bind(this);
		this.onClickNotification = this.onClickNotification.bind(this);
		this.onDeleteNotification = this.onDeleteNotification.bind(this);
	}

	componentDidMount = () => {
		// check notifications at regular intervals
		this.fetchNotifications();

		this.queryServerInterval = setInterval(() => {
			this.fetchNotifications();
		}, 7000);
	}

	componentDidUpdate = (prevProps) => {
		// hide the notifications list if the user navigates to a different page
		const { pathname } = this.props;

		if (prevProps.pathname !== pathname) {
			this.setState({
				'showNotificationsList': false,
			});
		}
	}

	componentWillUnmount = () => {
		clearInterval(this.queryServerInterval);
	}

	fetchNotifications = () => {
		const { dispatch } = this.props;

		dispatch(notificationReducer.fetchNotifications());
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

	onDeleteNotification = (id) => {
		const { dispatch } = this.props;

		dispatch(notificationReducer.deleteNotification(id));
	}

	render() {
		const {
			dispatch,
			notifications,
			reusableItems,
			newNotificationsCount,
		} = this.props;
		const { showNotificationsList } = this.state;

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
										dispatch={dispatch}
										notification={notification}
										key={notification.id}
										onClickNotification={this.onClickNotification}
										onDeleteNotification={this.onDeleteNotification}
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
	'newNotificationsCount': PropTypes.number.isRequired,
	'notifications': PropTypes.arrayOf(PropTypes.any).isRequired,
	'pathname': PropTypes.string.isRequired,
	'reusableItems': PropTypes.objectOf(PropTypes.any),
};

export default NotificationsButton;
