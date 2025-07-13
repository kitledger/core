import { appConfig } from "../config.ts";
import Valkey  from "iovalkey";

const valkey = new Valkey.Redis(appConfig.cache.url);

export const cache = valkey;
 