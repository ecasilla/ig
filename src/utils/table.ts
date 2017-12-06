import Table from 'cli-table';
import restify from 'restify';

const table = new Table({ head: ['Verb', 'Path'], colWidths: [10, 70] });

/** tslint:disable */
function RestTableView(routes: restify.MountOptions) {
	console.log('\n API for this service \n');
	console.log('*'.repeat(20));
	for (const key in routes) {
		if (routes.hasOwnProperty(key)) {
			const val: restify.RouteSpec = routes[key];
			const _o = {};
			_o[val.method] = [val.spec.path];
			table.push(_o);
		}
	}
	console.log(table.toString());
	console.log('*'.repeat(20), '\n');

	return table;
}
/** tslint:enable */

export default RestTableView;
