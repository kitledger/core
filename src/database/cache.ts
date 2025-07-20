import { cacheConfig } from "../config.js";
import { Redis } from "iovalkey";

const valkey = new Redis(cacheConfig.url);

export const cache = valkey;
