import { BAR_OPEN_MINUTE } from "./barService";
import { ROOM_SERVICE_OPEN_MINUTE } from "./roomService";

export const BREAKFAST_START = 390;
/** Dinner begins before the bar reaches its first service pulse. */
export const RESTAURANT_SERVICE_MINUTE = 1080;
export const BAR_SERVICE_MINUTE = BAR_OPEN_MINUTE + 120;
export const ROOM_SERVICE_MINUTE = ROOM_SERVICE_OPEN_MINUTE + 30;
