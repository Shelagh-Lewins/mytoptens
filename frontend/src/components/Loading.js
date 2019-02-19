import React, { Component } from 'react';
import { Spinner } from 'reactstrap';
import './Loading.scss';

export default class Loading extends Component {
	render() {
		return (
			<div className='loading'>
				<div className='inner-tube'>
					<Spinner color='secondary' style={{ 'width': '3rem', 'height': '3rem' }} />
				</div>
			</div>
		);
	}
}
