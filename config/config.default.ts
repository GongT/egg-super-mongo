'use strict';
import {ConnectionOptions} from "mongoose";

export interface ClientOption extends ConnectionOptions {
    url: string;
}

export interface SuperMongoConfig {
    client: ClientOption;
    clients: MapLike<ClientOption>,
    app: boolean;
    agent: boolean;
    allowOverwride: boolean;
}

export type MapLike<T> = {
    [id: string]: T;
}

/**
 * mongo default config
 */
export let superMongo: SuperMongoConfig = {
    client: null,
    clients: null,
    app: true,
    agent: false,
    allowOverwride: false,
};
