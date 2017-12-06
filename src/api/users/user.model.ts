import * as crypto from 'crypto';
import { Column, CreatedAt, DeletedAt, IsUUID, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { AllowNull } from 'sequelize-typescript/lib/annotations/AllowNull';
import { Default } from 'sequelize-typescript/lib/annotations/Default';
import { BeforeBulkCreate } from 'sequelize-typescript/lib/annotations/hooks/BeforeBulkCreate';
import { BeforeCreate } from 'sequelize-typescript/lib/annotations/hooks/BeforeCreate';
import { BeforeUpdate } from 'sequelize-typescript/lib/annotations/hooks/BeforeUpdate';
import { PrimaryKey } from 'sequelize-typescript/lib/annotations/PrimaryKey';
import { Unique } from 'sequelize-typescript/lib/annotations/Unique';
import { IsEmail } from 'sequelize-typescript/lib/annotations/validation/IsEmail';
import { NotEmpty } from 'sequelize-typescript/lib/annotations/validation/NotEmpty';

export interface Itoken {
	role: string;
	id: string;
}

export interface IUser {
	name: string;
	email: string;
	role: string;
	isAdmin: boolean;
	provider: string;
	password: string;
	salt: string;
	id: string;
	accessToken: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date;
}

@Table({
	modelName: 'users',
	tableName: 'users_t',
})
export default class User extends Model<User> {

	@BeforeBulkCreate
	public static createUsers(users: User[], fields: any, fn: (e: Error | undefined) => void) {
		let totalUpdated = 0;
		users.forEach((user) => {
			user.updatePassword((err: Error) => {
				if (err) {
					return fn(err);
				}
				totalUpdated += 1;
				if (totalUpdated === users.length) {
					return fn(undefined);
				}
			});
		});
	}

	@BeforeCreate
	public static creator(user: User, fields: any, fn: (e: Error | undefined) => void) {
		user.updatePassword(fn);
	}
	@BeforeUpdate
	public static updator(user: User, fields: any, fn: (e: Error | undefined) => void) {
		if (user.changed('password')) {
			return user.updatePassword(fn);
		}
		return fn(undefined);
	}

	@IsUUID(4)
	@PrimaryKey
	@Column
	public id: string;

	@CreatedAt
	@Column
	public createdAt: Date;

	@UpdatedAt
	@Column
	public updatedAt: Date;

	@DeletedAt
	@Column
	public deletedAt: Date;

	@Column
	@AllowNull(false)
	public name: string;

	@IsEmail
	@Unique
	@Column
	@AllowNull(false)
	public email: string;

	@Column
	@Default('user')
	public role: string;

	@Column
	@Default('local')
	public provider: string;

	@Column
	@Default(false)
	public isAdmin: boolean;

	@Column
	@NotEmpty
	public password: string;

	@Column
	public salt: string;

	@Column
	public accessToken: string;

	@Column
	public get token(): Itoken {
		return {
			id: this.id,
			role: this.role,
		};
	}

	public authenticate(password: string, callback: (e: Error | null, authed: boolean) => void) {
		this.encryptPassword(password, (err, pwdGen) => {
			if (err) {
				callback(err, null);
			}

			if (this.password === pwdGen) {
				return callback(null, true);
			}
			callback(null, false);
		});
	}

	private makeSalt(...args: any[]) {
		let byteSize = 0;
		let callback: (e: Error | null, salt: string | undefined) => void;
		const defaultByteSize = 16;

		if (typeof arguments[0] === 'function') {
			callback = arguments[0];
			byteSize = defaultByteSize;
		} else if (typeof arguments[1] === 'function') {
			callback = arguments[1];
		} else {
			throw new Error('Missing Callback');
		}

		if (!byteSize) {
			byteSize = defaultByteSize;
		}

		return crypto.randomBytes(byteSize, function randomCb(err, salt) {
			if (err) {
				callback(err, undefined);
			}
			return callback(null, salt.toString('base64'));
		});
	}

	private updatePassword(fn: (e: Error | null) => void) {
		// Handle new/update passwords
		if (!this.password) {
			return fn(null);
		}

		if (!this.password && !this.password.length) {
			return fn(new Error('Invalid password'));
		}

		// Make salt with a callback
		this.makeSalt((saltErr: Error, salt: string) => {
			if (saltErr) {
				return fn(saltErr);
			}
			this.salt = salt;
			this.encryptPassword(this.password, (encryptErr: Error, hashedPassword: string) => {
				if (encryptErr) {
					fn(encryptErr);
				}
				this.password = hashedPassword;
				fn(null);
			});
		});
	}

	private encryptPassword(password: string, callback: (e: Error | null, key: string) => void) {
		if (!password || !this.salt) {
			return callback(null, null);
		}

		const defaultIterations = 10000;
		const defaultKeyLength = 64;
		const salt = new Buffer(this.salt, 'base64');

		return crypto.pbkdf2(password, salt, defaultIterations, defaultKeyLength, 'sha1',
			function pbkdf2Cb(err: Error, key: Buffer) {
				if (err) {
					callback(err, null);
				}
				return callback(null, key.toString('base64'));
			});
	}
}
