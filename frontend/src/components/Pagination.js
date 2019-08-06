import React from 'react';
import PropTypes from 'prop-types';
import './Pagination.scss';
// adapted from http://jasonwatmore.com/post/2017/03/14/react-pagination-example-with-logic-like-google
// major changes to render only pagination controls, not data
// replaced <a> with <button> for accessibility

function getPager(totalTopTenItems, currentPage = 1, pageSize = 10) {
	// default to first page
	// currentPage = currentPage || 1;

	// default page size is 10
	// pageSize = pageSize || 10;

	// calculate total pages
	const totalPages = Math.ceil(totalTopTenItems / pageSize);

	let startPage;
	let endPage;
	if (totalPages <= 10) {
		// less than 10 total pages so show all
		startPage = 1;
		endPage = totalPages;
	} else if (currentPage <= 6) { // more than 10 total pages so calculate start and end pages
		startPage = 1;
		endPage = 10;
	} else if (currentPage + 4 >= totalPages) {
		startPage = totalPages - 9;
		endPage = totalPages;
	} else {
		startPage = currentPage - 5;
		endPage = currentPage + 4;
	}

	// calculate start and end topTenItem indexes
	const startIndex = (currentPage - 1) * pageSize;
	const endIndex = Math.min(startIndex + pageSize - 1, totalTopTenItems - 1);

	// create an array of pages to ng-repeat in the pager control
	const pages = [...Array((endPage + 1) - startPage).keys()].map(i => startPage + i);

	// return object with all pager properties required by the view
	return {
		'totalTopTenItems': totalTopTenItems,
		'currentPage': currentPage,
		'pageSize': pageSize,
		'totalPages': totalPages,
		'startPage': startPage,
		'endPage': endPage,
		'startIndex': startIndex,
		'endIndex': endIndex,
		'pages': pages,
	};
}

class Pagination extends React.Component {
	constructor(props) {
		super(props);
		this.state = { 'pager': {} };
	}

	componentDidMount() {
		// set page if there is a count
		// also check for currentPage. Parent component may re-render, causing this component to be recreated.
		const { count, currentPage, defaultPage } = this.props;

		if (count) {
			const initialPage = currentPage || defaultPage;
			this.setPage(initialPage);
		}
	}

	componentDidUpdate(prevProps) {
		// reset page if topTenItems array has changed
		const { count, defaultPage } = this.props;

		if (count !== prevProps.count) {
			this.setPage(defaultPage);
		}
	}

	setPage(pageNumber) {
		const {
			count,
			pageSize,
			onChangePage,
		} = this.props;

		// get new pager object for specified page
		const pager = getPager(count, pageNumber, pageSize);

		if (pageNumber < 1 || pageNumber > pager.totalPages) {
			return;
		}

		const newPageNumber = Math.min(pageNumber, pager.totalPages);

		// update state
		this.setState({ 'pager': pager });

		onChangePage(newPageNumber);
	}

	render() {
		const { pager } = this.state;

		if (!pager.pages || pager.pages.length <= 1) {
			// don't display pager if there is only 1 page
			return null;
		}

		return (
			<ul className="pagination">
				<li className={pager.currentPage === 1 ? 'disabled' : ''}>
					<button type="button" className="btn pagination first" onClick={() => this.setPage(1)}>First</button>
				</li>
				<li className={pager.currentPage === 1 ? 'disabled' : ''}>
					<button type="button" className="btn pagination previous" onClick={() => this.setPage(pager.currentPage - 1)}>Previous</button>
				</li>
				<li className="spacer" />
				{pager.pages.map(page => (
					<li key={`page_${page}`} className={pager.currentPage === page ? 'active' : ''}>
						<button type="button" className="btn pagination page" onClick={() => this.setPage(page)}>{page}</button>
					</li>
				))}
				<li className="spacer" />
				<li className={pager.currentPage === pager.totalPages ? 'disabled' : ''}>
					<button type="button" className="btn pagination next" onClick={() => this.setPage(pager.currentPage + 1)}>Next</button>
				</li>
				<li className={pager.currentPage === pager.totalPages ? 'disabled' : ''}>
					<button type="button" className="btn pagination last" onClick={() => this.setPage(pager.totalPages)}>Last</button>
				</li>
			</ul>
		);
	}
}

Pagination.propTypes = {
	'count': PropTypes.number,
	'currentPage': PropTypes.number,
	'onChangePage': PropTypes.func.isRequired,
	'defaultPage': PropTypes.number,
	'pageSize': PropTypes.number,
};

Pagination.defaultProps = {
	'count': 0,
	'defaultPage': 1,
	'pageSize': 10,
};

export default Pagination;
