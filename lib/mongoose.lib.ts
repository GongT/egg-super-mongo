import * as assert from 'assert';
import {EggAppConfig, EggApplication, Logger} from "egg";
import * as mongoose from 'mongoose';
import {Connection, createConnection, Schema} from 'mongoose';
import {join} from 'path';
import {ClientOption, SuperMongoConfig} from "../config/config.default";
import {EggMongoose, EggMongooseConstructor} from "./mongoose.class";
import {schemaCreate} from "./schema";

Object.assign(mongoose, {
    Promise,
});

export interface SuperMongoEggApplication extends EggApplication {
    SuperMongo: typeof EggMongoose;
    config: SuperMongoAppConfig;
}

export interface SuperMongoAppConfig extends EggAppConfig {
    superMongo: SuperMongoConfig;
}

export type ConnectionRegistry = Map<string, Connection>;

const connectionRegistry: ConnectionRegistry = new Map;

export function attachMongo(app: SuperMongoEggApplication) {
    app.SuperMongo = EggMongoose;
    createMongodbInstance(app);
}

function connectDatabase(options: ClientOption) {
    assert(options.url, '[egg-super-mongo] mongodb url is required on every client.');
    return createConnection(options.url, options);
}

const createMongodbInstance = (app: SuperMongoEggApplication) => {
    assert(app.config.superMongo, '[egg-super-mongo] superMongo is required on config');
    let {client, clients} = app.config.superMongo;
    assert(client || clients, '[egg-super-mongo] at least one client is required on config');
    if (!client) {
        client = {} as any;
    }
    app.coreLogger.debug(`[egg-super-mongo] config: ${client || clients}`);
    
    const waitPs = [];
    
    const registerAndWait = (name: string, logger: Logger, db: Connection) => {
        connectionRegistry.set(name, db);
        logConnectEvents(name, logger, db);
        waitPs.push(new Promise((resolve, reject) => {
            db.once('connected', resolve);
            db.once('error', reject);
        }));
    };
    
    app.beforeStart(async () => {
        app.coreLogger.debug('[egg-super-mongo] starting...');
        
        if (Object.keys(clients).length) {
            delete client.url;
            for (const name of Object.keys(clients)) {
                const db = connectDatabase(Object.assign({}, clients[name], client));
                app.coreLogger.info('[egg-super-mongo] connecting %s', clients[name].url);
                registerAndWait(name, app.coreLogger, db);
            }
        } else {
            const db = connectDatabase(client);
            app.coreLogger.info('[egg-super-mongo] connecting %s', client.url);
            registerAndWait('client', app.coreLogger, db);
        }
        
        await Promise.all(waitPs);
        
        app.coreLogger.debug('[egg-super-mongo] load models...');
        loadModel(app);
        
        app.coreLogger.info('[egg-super-mongo] start successfully and everything is ok');
    });
};

function logConnectEvents(name, logger, db) {
    db.on('error', err => {
        err.message = `[egg-super-mongo] ${name} database error: ${err.message}`;
        logger.error(err);
    });
    db.on('disconnected', () => {
        logger.error(`[egg-super-mongo] ${name} database ${db.host}:${db.port}/${db.name} disconnected`);
    });
    db.on('connected', () => {
        logger.info(`[egg-super-mongo] ${name} database ${db.host}:${db.port}/${db.name} connected successfully`);
    });
    db.on('reconnected', () => {
        logger.warn(`[egg-super-mongo] ${name} database ${db.host}:${db.port}/${db.name} reconnected successfully`);
    });
}

function loadModel(app: SuperMongoEggApplication) {
    const {allowOverwride} = app.config.superMongo;
    
    app.loader.loadToApp(join(app.config.baseDir, 'app/schema'), 'schema', {
        inject: app,
        caseStyle: 'camel',
        override: allowOverwride,
        ignore: 'utils/**',
        initializer(schema, opt) {
            app.coreLogger.debug('[egg-super-mongo] load schema: %s', opt.path);
            return schemaCreate(app, schema);
        },
    });
    
    app.loader.loadToApp(join(app.config.baseDir, 'app/super-model'), 'model', {
        inject: app,
        caseStyle: 'camel',
        ignore: 'utils/**',
        override: allowOverwride,
        initializer(model: EggMongooseConstructor, opt) {
            app.coreLogger.debug('[egg-super-mongo] load model: %s', opt.path);
            if (typeof model === 'function' && !model.prototype) {
                model = (model as any)(app);
            }
            
            const mdl: any = new model(app, connectionRegistry);
            if (!(mdl instanceof EggMongoose)) {
                throw new TypeError(`model{${mdl.constructor.name}} not an instance of app.EggMongoose`,);
            }
            return mdl;
        },
    });
}
