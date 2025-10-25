import { ClientRectangleLayer } from "@/types/canvas";
import React from "react";
interface Props {
  layer: ClientRectangleLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}
const Rectangle = ({ layer, onPointerDown, selectionColor }: Props) => {
  const { x, y, width, height, fill } = layer;

  return (
    <rect
      className="drop-shadow-md"
      onPointerDown={(e) => onPointerDown(e, layer.id)}
      style={{ transform: `translate(${x}px , ${y}px)` }}
      x={0}
      y={0}
      width={width}
      height={height}
      stroke="transparent"
      strokeWidth={1}
      fill={"#000"}
    ></rect>
  );
};

export default Rectangle;
