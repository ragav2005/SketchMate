import { colorToCss, idToColor } from "@/lib/utils";
import { ClientEllipseLayer } from "@/types/canvas";

interface Props {
  layer: ClientEllipseLayer;
  selectedByUserIds: string[];
  isSelectedByUser: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}

const Ellipse = ({
  layer,
  selectedByUserIds,
  isSelectedByUser,
  onPointerDown,
}: Props) => {
  const { x, y, width, height, fill } = layer;

  const getStrokeColor = () => {
    if (selectedByUserIds.length > 0) {
      return idToColor(selectedByUserIds[0]);
    }
    return "transparent";
  };

  return (
    <ellipse
      className="drop-shadow-md"
      onPointerDown={(e) => onPointerDown(e, layer.id)}
      style={{ transform: `translate(${x}px , ${y}px)` }}
      cx={width / 2}
      cy={height / 2}
      rx={width / 2}
      ry={height / 2}
      fill={fill ? colorToCss(fill) : "#ccc"}
      stroke={isSelectedByUser ? "transparent" : getStrokeColor()}
      strokeWidth={2}
    ></ellipse>
  );
};

export default Ellipse;
