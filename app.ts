import "source-map-support/register"
import {attachMongo} from './lib/mongoose.lib';

module.exports = app => {
    if (app.config.superMongo.app) {
        attachMongo(app);
    }
};
