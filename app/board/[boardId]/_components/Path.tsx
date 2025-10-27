import { getSvgPathFromStroke, idToColor } from "@/lib/utils";
import getStroke from "perfect-freehand";

interface Props {
  x: number;
  y: number;
  points: number[][];
  fill: string;
  onPointerDown: (e: React.PointerEvent) => void;
  selectedByUserIds: string[];
}

const Path = ({
  selectedByUserIds,
  onPointerDown,
  points,
  x,
  y,
  fill,
}: Props) => {
  const getStrokeColor = () => {
    if (selectedByUserIds.length > 0) {
      return idToColor(selectedByUserIds[0]);
    }
    return "transparent";
  };
  const stroke = getStrokeColor();

  return (
    <path
      className="drop-shadow-md"
      onPointerDown={onPointerDown}
      d={getSvgPathFromStroke(
        getStroke(points, {
          size: 16,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        })
      )}
      style={{ transform: `translate(${x}px , ${y}px)` }}
      x={0}
      y={0}
      fill={fill}
      stroke={stroke}
      strokeWidth={1}
    ></path>
  );
};

export default Path;
