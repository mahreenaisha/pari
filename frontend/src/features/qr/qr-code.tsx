import { Canvas, FillType, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { encode } from 'uqr';

import { colors } from '@/theme';

type QrCodeProps = {
  value: string;
  size: number;
  color?: string;
};

/** QR code drawn as soft dots with rounded finder eyes. Needs a light quiet zone around it. */
export function QrCode({ value, size, color = colors.ink }: QrCodeProps) {
  const path = useMemo(() => buildQrPath(value, size), [value, size]);
  return (
    <Canvas style={{ width: size, height: size }}>
      <Path path={path} color={color} />
    </Canvas>
  );
}

const FINDER = 7;

function buildQrPath(value: string, size: number): SkPath {
  const qr = encode(value, { ecc: 'M', border: 0 });
  const count = qr.size;
  const cell = size / count;
  const path = Skia.PathBuilder.Make().setFillType(FillType.EvenOdd);

  const inFinder = (x: number, y: number) =>
    (x < FINDER && y < FINDER) ||
    (x >= count - FINDER && y < FINDER) ||
    (x < FINDER && y >= count - FINDER);

  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      if (qr.data[y]?.[x] && !inFinder(x, y)) {
        path.addCircle((x + 0.5) * cell, (y + 0.5) * cell, cell * 0.46);
      }
    }
  }

  const roundedSquare = (x: number, y: number, side: number, radius: number) =>
    Skia.RRectXY(Skia.XYWHRect(x * cell, y * cell, side * cell, side * cell), radius * cell, radius * cell);

  for (const [fx, fy] of [
    [0, 0],
    [count - FINDER, 0],
    [0, count - FINDER],
  ] as const) {
    path.addRRect(roundedSquare(fx, fy, 7, 2.3));
    path.addRRect(roundedSquare(fx + 1, fy + 1, 5, 1.6));
    path.addRRect(roundedSquare(fx + 2, fy + 2, 3, 1));
  }

  return path.detach();
}
