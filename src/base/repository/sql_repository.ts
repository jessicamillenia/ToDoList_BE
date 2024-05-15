import { Model, Transaction } from 'sequelize/types';
import SQLContext, { DBInstance } from '../database/sql';
import { Attributes, BaseProps, Page, QueryOptions } from '../typings';
import { ISOLATION_LEVELS } from '../utils';
import { camelToSnakeCase, offset, sorter } from '../utils/helpers';
import { NotFoundError } from '../utils/http_error';

const DEFAULT = {
    SORT: '-created_at'
};

interface SqlOptions {
    transaction?: Transaction
    includeDeleted?: boolean;
    useMaster?: boolean;
}

export class SQLRepository<Props extends BaseProps = any> extends SQLContext {
    protected modelName: string;

    public constructor(modelName: string) {
        super();
        this.modelName = modelName;
    }

    public async createTransaction(isolation = ISOLATION_LEVELS.READ_UNCOMMITTED): Promise<Transaction> {
        return SQLContext.createTransaction(isolation);
    }

    protected getInstance(): DBInstance {
        return SQLContext.getInstance();
    }

    private getAttributes(attributes: string[] | undefined): string[] | undefined {
        if (!attributes) {
            return undefined;
        }
        return attributes.length ? attributes : undefined;
    }

    public async findById(id: string | number, attributes?: Attributes, opts?: SqlOptions): Promise<Props | null> {
        const db = this.getInstance();
        return db.model[this.modelName]
            .findOne<Model<Props>>({
                where: { id } as any,
                attributes: this.getAttributes(attributes),
                transaction: opts?.transaction,
                paranoid: !opts?.includeDeleted,
                useMaster: opts?.useMaster ?? false
            })
            .then(res => res ? res.get(): null);
    }

    public async findOne(conditions: Partial<Props>, attributes?: Attributes, opts?: SqlOptions): Promise<Props | null> {
        const db = this.getInstance();
        return db.model[this.modelName]
            .findOne<Model<Props>>({
                where: conditions as any,
                attributes: this.getAttributes(attributes),
                transaction: opts?.transaction,
                paranoid: !opts?.includeDeleted,
                useMaster: opts?.useMaster ?? false
            })
            .then(res => res ? res.get() : null);
    }

    public async findOneOrFail(conditions: Partial<Props>, attributes?: Attributes, opts?: SqlOptions): Promise<Props> {
        return this.findOne(conditions, attributes, opts)
            .then((res: any): Props => {
                if (!res) {
                    throw new NotFoundError(`${camelToSnakeCase(this.modelName).toUpperCase()}_NOT_FOUND`);
                }
                return res;
            }
            );
    }

    public async findAll( conditions: Partial<Props>, queryOptions?: QueryOptions, opts?: SqlOptions): Promise<Props[]> {
        const attributes = this.getAttributes(queryOptions?.attributes);
        const sort = queryOptions?.sort ?? DEFAULT.SORT;

        const order = sorter(sort);
        const db = this.getInstance();

        return db.model[this.modelName]
            .findAll({
                where: conditions as any,
                attributes,
                order: [order as any],
                transaction: opts?.transaction,
                paranoid: !opts?.includeDeleted,
                useMaster: opts?.useMaster ?? false,
                limit: queryOptions?.per_page,
            })
            .then(rows => rows.map(row => row.get()));
    }

    public async upsert(search: Partial<Props>, data: Partial<Props>, opts?: SqlOptions): Promise<void> {
        return this.findOne(search, undefined, opts).then(
            (row): Promise<any> => {
                return row ? this.update(search, data, opts) : this.create(data, opts);
            }
        );
    }

    public async create(data: Partial<Props>, opts?: SqlOptions): Promise<Props> {
        const db = this.getInstance();
        return db.model[this.modelName]
            .create<Model<Props>>(data as any, { transaction: opts?.transaction })
            .then(res => res.get());
    }

    public async createMany(data: Partial<Props[]>, opts?: SqlOptions): Promise<Props[]> {
        const db = this.getInstance();
        return db.model[this.modelName]
            .bulkCreate<Model<Props>>(data as any, { transaction: opts?.transaction })
            .then(rows => rows.map(row => row.get()));
    }

    public async update(conditions: Partial<Props>, data: Partial<Props>, opts?: SqlOptions): Promise<[number]> {
        const db = this.getInstance();
        return db.model[this.modelName].update(data, {
            where: conditions as any,
            transaction: opts?.transaction,
            paranoid: !opts?.includeDeleted
        });
    }

    public async delete(conditions: Partial<Props>, opts?: SqlOptions): Promise<number> {
        const db = this.getInstance();
        return db.model[this.modelName].destroy({
            where: conditions as any,
            transaction: opts?.transaction
        });
    }

    public async hardDelete(conditions: Partial<Props>, opts?: SqlOptions): Promise<number> {
        const db = this.getInstance();
        return db.model[this.modelName].destroy({
            where: conditions as any,
            transaction: opts?.transaction,
            force: true
        });
    }

    public async increment(conditions: Partial<Props>, fields: { [P in keyof Props]?: number }, opts?: SqlOptions): Promise<any> {
        const db = this.getInstance();
        return db.model[this.modelName].increment(fields, {
            where: conditions as any,
            transaction: opts?.transaction
        });
    }

    public async count(conditions: Partial<Props>, opts?: SqlOptions): Promise<number> {
        const db = this.getInstance();
        return db.model[this.modelName].count({
            where: conditions as any,
            transaction: opts?.transaction,
            paranoid: !opts?.includeDeleted,
            useMaster: opts?.useMaster ?? false
        });
    }

    protected mapPaginate(page: number, perPage: number, { rows, count }: { rows: any[]; count: number }): Page<Props> {
        return {
            data: rows.map(row => row.get()),
            meta: {
                page,
                per_page: perPage,
                total_page: Math.ceil(count / perPage),
                total_data: count
            }
        };
    }

    public async paginate(conditions: Partial<Props>, { page = 1, per_page = 10, sort = DEFAULT.SORT, attributes }: QueryOptions, opts?: SqlOptions): Promise<Page<Props>> {
        const order = sorter(sort);
        const db = this.getInstance();
        return db.model[this.modelName]
            .findAndCountAll({
                where: conditions as any,
                attributes,
                limit: per_page,
                offset: offset(page, per_page),
                order: [order as any],
                transaction: opts?.transaction,
                paranoid: !opts?.includeDeleted,
                useMaster: opts?.useMaster ?? false
            })
            .then(data => this.mapPaginate(page, per_page, data));
    }

}

export default SQLRepository;
