import * as Promise from 'bluebird';
import * as crypto from 'crypto';
import {
  AllowNull,
  BeforeBulkCreate,
  BeforeCreate,
  BeforeUpdate,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  IsEmail,
  IsUUID,
  Model,
  NotEmpty,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
export interface Itoken {
  role: string;
  id: string;
}

export interface IUserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isAdmin: boolean;
  provider: string;
  id: string;
}

export interface IUser {
  firstName: string;
  lastName: string;
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
  modelName: 'user',
  name: { singular: 'user_t', plural: 'users_t' },
  tableName: 'users_t',
})
export class User extends Model<User> {

  @BeforeBulkCreate
  public static createUsers(users: User[], fields: any): Promise<User[]> {
    return Promise.map(users, (user) => user.updatePassword());
  }

  @BeforeCreate
  public static creator(user: User, fields: any): Promise<any> {
    return user.updatePassword();
  }
  @BeforeUpdate
  public static updator(user: User, fields: any): Promise<any> {
    if (user.changed('password')) {
      return user.updatePassword();
    }
    return Promise.resolve();
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
  public firstName: string;

  @Column
  public lastName: string;

  @AllowNull(false)
  @IsEmail
  @Unique
  @Column
  public email: string;

  @Default('user')
  @Column
  public role: string;

  @Default('local')
  @Column
  public provider: string;

  @Default(false)
  @Column
  public isAdmin: boolean;

  @NotEmpty
  @Column
  public password: string;

  @Column
  public salt: string;

  @Column
  public accessToken: string;

  @Default('active')
  @Column(DataType.ENUM('active', 'inactive'))
  public status: 'active' | 'inactive';

  public get token(): Itoken {
    return {
      id: this.id,
      role: this.role,
    };
  }

  public profile(): IUserProfile {
    return {
      email: this.email,
      firstName: this.firstName,
      id: this.id,
      isAdmin: this.isAdmin,
      lastName: this.lastName,
      provider: this.provider,
      role: this.role,
    };
  }

  public authenticate(password: string): Promise<boolean> {
    return new Promise(function pHandler(resolve, reject) {
      return this.encryptPassword(password)
        .then((pwdGen: Buffer | null) => {
          if (pwdGen && this.password === pwdGen.toString('base64')) {
            return resolve(true);
          }
          return resolve(false);
        })
        .catch(reject);
    });
  }

  private makeSalt(byteSize = 16): Promise<string | null> {
    return Promise.fromCallback((cb) => {
      crypto.randomBytes(byteSize, function randomCb(err, salt) {
        if (err) {
          cb(err, null);
        }
        return cb(null, salt.toString('base64'));
      });
    });
  }

  private updatePassword(): Promise<any> {
    // Handle new/update passwords
    if (!this.password) {
      return Promise.resolve(null);
    }

    if (!this.password && !this.password.length) {
      return Promise.reject(new Error('Invalid password'));
    }

    return this.makeSalt()
      .then((salt: string) => {
        this.salt = salt;
        return this.encryptPassword(this.password)
          .then((hashedPassword: Buffer) => {
            this.password = hashedPassword.toString('base64');
            return this;
          });
      });
  }

  private encryptPassword(password: string): Promise<Buffer | null> {
    if (!password || !this.salt) {
      return Promise.resolve(null);
    }

    const defaultIterations = 10000;
    const defaultKeyLength = 64;
    const salt = new Buffer(this.salt, 'base64');

    return Promise.fromCallback((cb) => {
      crypto.pbkdf2(password, salt, defaultIterations, defaultKeyLength, 'sha1', cb);
    });
  }
}
