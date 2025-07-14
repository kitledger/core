import { appConfig } from "../config.js";
import Valkey from "iovalkey";

const valkey = new Valkey(appConfig.cache.url);

export const cache = valkey;
