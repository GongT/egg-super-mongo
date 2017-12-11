import {Schema} from "mongoose";
import {SuperMongoEggApplication} from "./mongoose.lib";

const findOrCreate = require('mongoose-findorcreate');

function isObject(obj) {
    const type = typeof obj;
    return type === 'function' || (typeof type === 'object' && !!obj);
}

export function schemaCreate(app: SuperMongoEggApplication, schema: Schema) {
    if (typeof schema === 'function' && !(schema as any).prototype) {
        // function but no prototype: () => {}
        schema = (schema as any)(app);
    }
    if (schema.constructor === Object) {
        schema = new Schema(schema);
    }
    schema.set('timestamps', true);
    schema.plugin(findOrCreate);
    // add virtual path based on Date path
    executeVirtualPath(schema);
    return schema;
}

// add virtual path
function addVirtualPath(schema, property) {
    schema.virtual(property + 'Ms').get(function () {
        if (this[property]) {
            return this[property].getTime();
        }
        return undefined;
    });
}

// execute virtual path
function executeVirtualPath(schema) {
    if (!schema || !schema.obj) {
        return;
    }
    
    // set schema option
    schema.set('toObject', {getters: true, virtuals: true});
    schema.set('toJSON', {getters: true, virtuals: true});
    
    Object.keys(schema.obj).forEach(function (property) {
        if (schema.obj[property] === Date) {
            addVirtualPath(schema, property);
        } else if (isObject(schema.obj[property])) {
            let subObj;
            if (Array.isArray(schema.obj[property])) {
                subObj = schema.obj[property][0];
            } else {
                subObj = schema.obj[property];
            }
            // object
            if (subObj.type) {
                // type property exist, is not a sub schema
                if (subObj.type === Date) {
                    // type is Date
                    addVirtualPath(schema, property);
                }
            } else {
                // type property not exist, is a sub schema
                executeVirtualPath(subObj);
            }
        }
    });
}
