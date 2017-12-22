import "source-map-support/register"
import {attachMongo} from './lib/mongoose.lib';

module.exports = (agent: any) => {
    if (agent.config.superMongo.agent) {
        attachMongo(agent);
    }
};
