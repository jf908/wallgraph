export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function rectCollision(rect1: Rect, rect2: Rect) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

export function rectInside(pos: { x: number; y: number }, rect: Rect) {
  return (
    pos.x >= rect.x &&
    pos.x < rect.x + rect.width &&
    pos.y >= rect.y &&
    pos.y < rect.y + rect.height
  );
}

export function fixNegativeRectangle({ x, y, width, height }: Rect) {
  return {
    x: width < 0 ? x + width : x,
    width: width < 0 ? -width : width,
    y: height < 0 ? y + height : y,
    height: height < 0 ? -height : height,
  };
}
