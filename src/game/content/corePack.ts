import rawCorePack from "../../content/core/core-pack.json";
import { loadContentPack } from "./loadContentPack";

const loaded = loadContentPack(rawCorePack);
export const CORE_CONTENT_PACK = loaded.pack;
export const CORE_CONTENT_REGISTRY = loaded.registry;
