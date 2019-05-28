import React, { Component } from 'react';
import { Input } from 'reactstrap';
import { Link } from 'react-router-dom';

import { COLORS } from '../constants';

import './Search.scss';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class Search extends Component {
	constructor(props) {
		super(props);
		this.state = {
			'showDropdown': false,
		};

		this.closeDropdown = this.closeDropdown.bind(this);
		this.onFocus = this.onFocus.bind(this);
	}

	componentDidMount() {
		document.addEventListener('click', this.handleClick, false);
	}

	componentWillUnmount() {
		document.removeEventListener('click', this.handleClick, false);
	}

	handleClick = e => {
		// clicked inside component
		if (this.node.contains(e.target)) {
			return;
		}

		// clicked outside component
		this.closeDropdown();
	}

	closeDropdown() {
		this.setState({
			'showDropdown': false,
		});
	}

	onFocus() {
		this.setState({
			'showDropdown': true,
		});
	}

	render() {
		let searchResults;
		
		if (this.props.searchComplete) {
			if (this.props.searchResults.length === 0) {
				searchResults = <div className="hint">{`no results found for ${this.props.searchTerm}`}</div>;
			} else {
				searchResults = <div className="results">
					<ul>
						{this.props.searchResults.map((result) => {
							let icon;
							let TopTenListId;
							let color;
							let title;

							switch(result.type) {
								case 'TopTenList':
									icon = 'list-ol';
									color = COLORS.TOPTENLIST;
									TopTenListId = result.id;
									title = 'Top Ten List';
									break;

								case 'TopTenItem':
									icon = 'sticky-note';
									color = COLORS.TOPTENITEM;
									TopTenListId = result.topTenList_id;
									title = 'Top Ten Item';
									break;

								default:
									break;
							}
							const url = `/toptenlist/${TopTenListId}`;

							return (
								<li className="result" key={result.id}>
									<Link to={url} onClick={this.closeDropdown}><span className="icon" title={title}><FontAwesomeIcon icon={['fas', icon]} style={{ 'color': color }} size="1x" /></span><span className="name">{result.name}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</div>;
			}
		}

		return(
			<div className="search" ref={node => this.node = node}>
				<Input className="form-control"
					onChange={this.props.onChange}
					onFocus={this.onFocus}
					type="text"
					placeholder={this.props.placeholder}
				/>
				{this.state.showDropdown && searchResults}
			</div>
		);
	}
};

export default Search;
