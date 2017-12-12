# @gongt/egg-super-mongo
[![NPM version][npm-image]][npm-url]
[![David deps][david-image]][david-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/@gongt/egg-super-mongo.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@gongt/egg-super-mongo
[david-image]: https://img.shields.io/david/gongt/egg-super-mongo.svg?style=flat-square
[david-url]: https://david-dm.org/gongt/egg-super-mongo
[download-image]: https://img.shields.io/npm/dm/@gongt/egg-super-mongo.svg?style=flat-square
[download-url]: https://npmjs.org/package/@gongt/egg-super-mongo

Egg's MongoDB plugin.

## Install

```bash
$ npm i @gongt/egg-super-mongo --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.superMongo = {
  enable: true,
  package: '@gongt/egg-super-mongo',
};
```

## Configuration
```js
// {app_root}/config/config.default.js
exports.mongoose = {
  client: {
    url: 'mongodb://127.0.0.1/example',
  },
  clients: {
    connection_a: {
      url: 'mongodb://172.0.0.1/a',
    },
    connection_b: {
      url: 'mongodb://192.168.1.1/b',
    }
  },
  app: true,
  agent: false,
  allowOverwride: true,
};
```

see [config/config.default.ts](config/config.default.ts) for more detail.

## Example
```js
// app/super-model/user.js
import {EggMongoose} from "@gongt/egg-super-mongo";
import {Schema} from "mongoose";

export class UserModel extends EggMongoose {
  get connection() { 
    return "connection_a";
  }
  
  get schema() {
    return new Schema({
      userName: { type: String },
      password: { type: String }
    });
  }
  
  getUserById(id){
    this.__model.findOne({ _id: id }); // ...
  }
}
```


## Example (es5)
```js
// app/super-model/user.js
module.exports = app => {
  const EggMongoose = app.SuperMongo;
  
  return class UserModel extends EggMongoose {
    /* ...... */
  };
}

// app/controller/user.js
exports.index = async function (ctx) {
  ctx.body = await ctx.model.user.getUserById("");  // you should use camel case to access mongoose model
}
```

## License

[MIT](LICENSE)
