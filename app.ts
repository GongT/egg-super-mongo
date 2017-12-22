import "source-map-support/register"
import {attachMongo, SuperMongoEggApplication} from './lib/mongoose.lib';

module.exports = (app: SuperMongoEggApplication) => {
    if (app.config.superMongo.app) {
        attachMongo(app);
    }
};
