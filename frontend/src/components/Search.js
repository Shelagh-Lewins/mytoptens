import React, { Component } from 'react';
import { Input } from 'reactstrap';
import { Link } from 'react-router-dom';

import './Search.scss';

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
							let type = '';
							const url = `/topTenList/${result.id}`;

							if (result.type === 'List') {
								type = 'List';
							} else if (result.type === 'Item') {
								type = 'Item';
							}
							return (
								<li className="result" key={result.id}>
									<Link to={url} onClick={this.closeDropdown}><span className="type">{type}: </span><span className="name">{result.name}</span>
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
