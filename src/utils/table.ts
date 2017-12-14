/** tslint:disable */

import * as Table from 'cli-table';
import * as restify from 'restify';

const table = new Table({ head: ['Verb', 'Path'], colWidths: [10, 70] });

function RestTableView(routes: restify.Route[]) {
  console.log('\n API for this service \n');
  console.log('*'.repeat(20));
  for (const key in routes) {
    if (routes.hasOwnProperty(key)) {
      const val: restify.Route = routes[key];
      const o: { [index: string]: string } = {};
      o[val.method] = [val.spec.path].toString();
      table.push(o);
    }
  }
  console.log(table.toString());
  console.log('*'.repeat(20), '\n');

  return table;
}
/** tslint:enable */

export default RestTableView;
