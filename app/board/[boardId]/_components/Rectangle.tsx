import { colorToCss, idToColor } from "@/lib/utils";
import { ClientRectangleLayer } from "@/types/canvas";
import React from "react";
interface Props {
  layer: ClientRectangleLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectedByUserIds: string[];
}
const Rectangle = ({ layer, onPointerDown, selectedByUserIds }: Props) => {
  const { x, y, width, height, fill } = layer;

  const getStrokeColor = () => {
    if (selectedByUserIds.length > 0) {
      return idToColor(selectedByUserIds[0]);
    }
    return "transparent";
  };

  return (
    <g>
      <rect
        className="drop-shadow-md"
        onPointerDown={(e) => onPointerDown(e, layer.id)}
        style={{ transform: `translate(${x}px , ${y}px)` }}
        x={0}
        y={0}
        width={width}
        height={height}
        stroke={getStrokeColor()}
        strokeWidth={2}
        fill={fill ? colorToCss(fill) : "#ccc"}
      ></rect>
    </g>
  );
};

export default Rectangle;
