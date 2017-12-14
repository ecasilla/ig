/**
 * For including *.json file as
 * `import * as <stuff> from './stuffs.json';`
 */

declare module '*.json' {
  const value: any;
  export = value;
}

declare module 'restify-routing';
declare module 'restify-cors-middleware';
declare module 'restify-errors';
declare module 'restify-jwt';
declare module 'jsonwebtoken';
declare module 'cli-table';
declare module 'composable-middleware';
