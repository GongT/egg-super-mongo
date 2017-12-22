import {Db} from "mongodb";
import {Connection, createConnection, Document, Model, Schema} from 'mongoose';
import {ConnectionRegistry, SuperMongoEggApplication} from "./mongoose.lib";

const util = require('util');

export interface EggMongooseConstructor<T extends Document = any> {
    new (app: SuperMongoEggApplication, registry: ConnectionRegistry): EggMongoose<T>;
}

export abstract class EggMongoose<T extends Document = any> {
    protected readonly model: Model<T>;
    protected readonly db: Db;
    
    constructor(private app: SuperMongoEggApplication, protected registry: ConnectionRegistry) {
        if (this.constructor === EggMongoose) {
            throw new TypeError(`Can not create instance of abstract class EggMongoose.`);
        }
        
        this.esEnsure("connection");
        this.esEnsure("schema");
        
        const conn: Connection = registry.get(this.connection);
        if (!conn) {
            app.coreLogger.warn('registered connection:', ...registry.keys());
            throw new TypeError(`You can not use connection "${this.connection}" without declare it in config file.`);
        }
        this.db = conn.db;
        
        let modelName = this.constructor.name;
        if (!/Model$/i.test(modelName)) {
            modelName += 'Model';
        }
        const collectName = (this.collectionName || modelName).replace(/Model/g, '');
        
        const schema = this.schema;
        if (!schema) {
            throw new TypeError(`module ${modelName} do not declare any Schema.`);
        }
        this.model = conn.model(modelName, schema, collectName);
        // Promise.promisifyAll(this.model);
        app.coreLogger.debug(`created new model: ${modelName}(collection: ${this.collectionName || modelName})`);
    }
    
    protected abstract readonly connection: string;
    protected abstract readonly collectionName: string|null;
    protected abstract readonly schema: Schema;
    
    private esEnsure(name: string) {
        if (!this[name]) {
            if (!(name in this)) {
                throw new TypeError(`Non-abstract class '${this.constructor.name}' does not implement inherited abstract member '${name}' from class 'EggMongoose'`);
            } else {
                throw new TypeError(`Invalid type of '${this.constructor.name}::${name}'`);
            }
        }
    }
    
    public [util.inspect.custom](depth, options) {
        const padding = ' '.repeat(2 + depth * 2);
        return `{
${padding}SuperMongo::DataModel<${this.constructor.name}>[${this.connection}::${this.collectionName || this.connection}] }
`;
    }
    
    public toString() {
        return `[SuperMongo::DataModel ${this.constructor.name}]`;
    }
}
