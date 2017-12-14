import * as restify from 'restify';
import { IUser } from '../src/api/users/user.model';

declare module 'restify' {
  export interface Request {
    user: IUser;
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    acceptsCharsets(): string[];
    acceptsCharsets(charset: string): string | false;
    acceptsCharsets(charset: string[]): string | false;
    acceptsCharsets(...charset: string[]): string | false;
  }
}
