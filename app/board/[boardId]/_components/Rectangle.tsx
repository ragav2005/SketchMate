import { colorToCss, idToColor } from "@/lib/utils";
import { ClientRectangleLayer } from "@/types/canvas";
import React from "react";
interface Props {
  layer: ClientRectangleLayer;
  selectedByUserIds: string[];
  isSelectedByUser: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}
const Rectangle = ({
  layer,
  onPointerDown,
  selectedByUserIds,
  isSelectedByUser,
}: Props) => {
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
        stroke={isSelectedByUser ? "transparent" : getStrokeColor()}
        strokeWidth={2}
        fill={fill ? colorToCss(fill) : "#ccc"}
      ></rect>
    </g>
  );
};

export default Rectangle;
