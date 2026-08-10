/**
 * The size of one isometric floor tile.
 *
 * It lives apart from the scene so the layout arithmetic can be reasoned about
 * — and tested — without pulling in Pixi and a GPU context. PixiHotelScene
 * re-exports both, so the established import path keeps working.
 */
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
