export type Line = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

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

export function rectCentre(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

// From https://stackoverflow.com/a/293052/5991782
export function lineRectCollision({ x1, y1, x2, y2 }: Line, rect: Rect) {
  let x = Math.min(x1, x2);
  let y = Math.min(y1, y2);
  let width = Math.max(x1, x2) - x;
  let height = Math.max(y1, y2) - y;
  if (!rectCollision({ x, y, width, height }, rect)) {
    return false;
  }

  // return true;
  const f = (x: number, y: number) =>
    (y2 - y1) * x + (x1 - x2) * y + (x2 * y1 - x1 * y2);
  let c1 = f(rect.x, rect.y);
  let c2 = f(rect.x + rect.width, rect.y);
  let c3 = f(rect.x, rect.y + rect.height);
  let c4 = f(rect.x + rect.width, rect.y + rect.height);
  return !(
    (c1 > 0 && c2 > 0 && c3 > 0 && c4 > 0) ||
    (c1 < 0 && c2 < 0 && c3 < 0 && c4 < 0)
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
