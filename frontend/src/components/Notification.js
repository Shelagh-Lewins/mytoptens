import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { COLORS } from '../constants';

const Notification = (props) => {
	console.log('notification props', props);
	const { notification, reusableItem } = props;

	let content;

	switch (notification.context) {
		case 'reusableItem':
			switch (notification.event) {
				case 'changeRequestCreated':
					content = (
						<React.Fragment>
							<span>
								Please vote on a proposed change to <Link to={`/reusableitem/${reusableItem.id}`}><FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" />{reusableItem.name}</Link>
							</span>
						</React.Fragment>
					);
					break;

				case 'changeRequestRejected':
					content = (
						<React.Fragment>
							<span>
								A proposed change to <Link to={`/reusableitem/${reusableItem.id}`}><FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" />{reusableItem.name}</Link> was rejected
							</span>
						</React.Fragment>
					);
					break;

				case 'changeRequestAccepted':
					content = (
						<React.Fragment>
							<span>
								A proposed change to <Link to={`/reusableitem/${reusableItem.id}`}><FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" />{reusableItem.name}</Link> was accepted
							</span>
						</React.Fragment>
					);
					break;

				case 'changeRequestCancelled':
					content = (
						<React.Fragment>
							<span>
								A proposed change to <Link to={`/reusableitem/${reusableItem.id}`}><FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" />{reusableItem.name}</Link> was cancelled
							</span>
						</React.Fragment>
					);
					break;

				default:
					break;
			}
			break;

		default:
			break;
	}

	return (
		<li className={`notification ${notification.unread ? 'unread' : ''}`}>
			{content}
		</li>
	);
};

Notification.defaultProps = {
	'reusableItem': [],
};

Notification.propTypes = {
	'notification': PropTypes.objectOf(PropTypes.any).isRequired,
	'reusableItem': PropTypes.objectOf(PropTypes.any),
	// 'topTenItem': PropTypes.objectOf(PropTypes.any), // not using this yet but if we add notifications for a top ten item, it will be wanted
};

export default Notification;
