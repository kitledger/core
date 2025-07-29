import { cacheConfig } from "../config.ts";
import { Redis } from "iovalkey";

const valkey = new Redis(cacheConfig.url);

export const cache = valkey;
