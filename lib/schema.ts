import {Schema} from "mongoose";
import {SuperMongoEggApplication} from "./mongoose.lib";

export function schemaCreate(app: SuperMongoEggApplication, schema: Schema) {
    if (typeof schema === 'function' && !(schema as any).prototype) {
        // function but no prototype: () => {}
        schema = (schema as any)(app);
    }
    if (schema.constructor === Object) {
        schema = new Schema(schema);
    }
    
    const {schemaCommonSetting} = app.config.superMongo;
    if (schemaCommonSetting) {
        schemaCommonSetting(schema);
    }
    
    return schema;
}
