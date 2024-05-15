import * as fs from 'fs';
import * as path from 'path';
import * as Sequelize from 'sequelize';
import { Options, ReplicationOptions } from 'sequelize';
import { TRUTHY } from '../utils';
import { generateDatabaseConfig } from '../utils/helpers';
import Logger from '../utils/logger';

interface DBOpts {
    connection_string?: string;
    models_path?: string;
    read_replicas?: string[];
    options?: Options;
}

interface DBModel extends Sequelize.ModelStatic<any> {
    associate?: (models: DBModelCollection) => void;
    new (): any
}

interface DBModelCollection {
    [s:string]: DBModel;
}

export interface DBInstance {
    model: DBModelCollection;
    context: Sequelize.Sequelize;
    ORMProvider: typeof Sequelize;
    db_transaction: Sequelize.Transaction | null;
}

const opts: Options = {
    dialect: 'postgres',
    logging: process.env.LOG_SQL ? console.log : false,
    pool: {
        min: 0,
        max: 10,
        acquire: 20000,
        idle: 10000,    // will mark a connection idle after n second of not being used
        evict: 5000     // will evict idle connection every n seconds
    },
    define: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'
    }
};

export class DBModule extends Logger {
    private static instance: DBInstance;

    public static get is_initialized(): boolean {
        return !!this.instance;
    }

    private static getReplicaConnectionStringFromEnv(): string[] {
        const replicaConnectionString = process.env.DB_CONNECTION_STRING_READ;
        if (!replicaConnectionString) {
            return [];
        }
        return replicaConnectionString.split(',');
    }

    public static async initialize({ connection_string, models_path, read_replicas, options }: DBOpts = {}): Promise<void> {
        const models: DBModelCollection = {};
        let sequelize: Sequelize.Sequelize;

        const modelPath = models_path ?? './database/models';
        const connectionString = connection_string ?? process.env.DB_CONNECTION_STRING;

        const replicaEnabled = !(TRUTHY[String(process.env.DISABLE_DB_READ_REPLICATION)]);
        const replicaConnectionString = read_replicas ?? this.getReplicaConnectionStringFromEnv();

        if (!connectionString) {
            throw new Error('connection string is not found for sql database');
        }

        if (replicaEnabled && replicaConnectionString.length) {
            const replication: ReplicationOptions = {
                write: generateDatabaseConfig(connectionString),
                read: replicaConnectionString.map(generateDatabaseConfig)
            };
            const dbOptions: Options = { ...opts, ...options, replication };
            sequelize = new Sequelize.Sequelize(connectionString, dbOptions);
            this.logger.info('database read replica enabled');
        } else {
            sequelize = new Sequelize.Sequelize(connectionString, { ...opts, ...options });
        }

        this.instance = {
            ORMProvider: Sequelize,
            context: sequelize,
            model: models,
            db_transaction: null
        };

        const modelsDir = path.join(__dirname, '../../..', modelPath);
        fs.readdirSync(modelsDir)
            .filter((file) => {
                const fileExtension: string = file.slice(-3);
                const isEligible: boolean = (fileExtension === '.js' || fileExtension === '.ts');
                return !file.startsWith('.') && isEligible;
            })
            .forEach((fileName) => this.registerModel(modelsDir, fileName));

        /** initialize models relationship */
        Object.keys(models).forEach((modelName) => {
            const subModel = models[modelName];
            if (subModel?.associate) {
                subModel.associate(models);
            }
        });
    }

    public static registerModel(modelsDir: string, fileName: string): void {
        const model: DBModel = require(path.join(modelsDir, fileName));
        this.instance.model[model.name] = model;
    }

    public static getInstance(): DBInstance {
        if (!this.instance) {
            throw new Error('Not initialize');
        }
        return this.instance;
    }

    public static getContext(): Sequelize.Sequelize {
        if (!this.instance) {
            throw new Error('Not initialize');
        }
        return this.instance.context;
    }

    public static getORMProvider(): typeof Sequelize {
        if (!this.instance) {
            throw new Error('Not initialize');
        }
        return this.instance.ORMProvider;
    }

    public static getModel(modelName: string): DBModel {
        if (!this.instance) {
            throw new Error('Not initialize');
        }
        return this.instance.model[modelName];
    }

    public static async createTransaction(isolationLevel = this.instance.ORMProvider.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED): Promise<Sequelize.Transaction> {
        return this.instance.context.transaction({ isolationLevel });
    }

    public static async gracefulRollback(transaction: Sequelize.Transaction): Promise<void> {
        try {
            await transaction.rollback();
        } catch (err) {
            this.logger.error('error while rolling back transaction', err);
        }
    }

    public static async shutdown(): Promise<void> {
        this.logger.info('shutting down sql database...');
        if (this.instance) {
            await this.instance.context.close();
        }
    }
}

export default DBModule;
