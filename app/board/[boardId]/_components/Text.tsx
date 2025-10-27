import { Kalam } from "next/font/google";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { cn, colorToCss, idToColor } from "@/lib/utils";
import { ClientLayer, ClientTextLayer } from "@/types/canvas";
import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Action } from "@/store/useBoardStore";

const font = Kalam({ subsets: ["latin"], weight: ["400"] });

interface Props {
  layer: ClientTextLayer;
  selectedByUserIds: string[];
  isSelectedByUser: boolean;

  onPointerDown: (e: React.PointerEvent, id: string) => void;
  setLayers: React.Dispatch<React.SetStateAction<ClientLayer[]>>;
  addAction?: (action: Action) => void;
}

const calculateFontSize = (width: number, height: number) => {
  const maxFontSize = 96;
  const scaleFactor = 0.5;
  const fontSizeBasedOnHeight = height * scaleFactor;
  const fontSizeBasedOnWidth = width * scaleFactor;

  return Math.min(maxFontSize, fontSizeBasedOnHeight, fontSizeBasedOnWidth);
};

const Text = ({
  layer,
  selectedByUserIds,
  onPointerDown,
  setLayers,
  addAction,
}: Props) => {
  const supabase = createClient();
  const { x, y, width, height, fill, value } = layer;
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialValueRef = useRef<string>(value || "");

  const getStrokeColor = () => {
    if (selectedByUserIds.length > 0) {
      return idToColor(selectedByUserIds[0]);
    }
    return null;
  };

  // update text
  const setValue = useCallback(
    (newValue: string) => {
      const originalLayer = { ...layer };
      const updatedLayer = { ...layer, value: newValue };

      setLayers((prev) =>
        prev.map((prevLayer) =>
          prevLayer.id === layer.id
            ? { ...prevLayer, value: newValue }
            : prevLayer
        )
      );

      supabase
        .from("layers")
        .update({ value: newValue })
        .eq("id", layer.id)
        .then(({ error }) => {
          if (error) {
            console.log("error updating text layer:", error);
            setLayers((prev) =>
              prev.map((prevLayer) =>
                prevLayer.id === layer.id ? originalLayer : prevLayer
              )
            );
          } else {
            if (actionTimeoutRef.current) {
              clearTimeout(actionTimeoutRef.current);
            }

            actionTimeoutRef.current = setTimeout(() => {
              if (addAction && initialValueRef.current !== newValue) {
                addAction({
                  type: "UPDATE",
                  before: { ...originalLayer, value: initialValueRef.current },
                  after: updatedLayer,
                });
                initialValueRef.current = newValue;
              }
            }, 1000);
          }
        });
    },
    [layer, setLayers, supabase, addAction]
  );

  const handleContentChange = (e: ContentEditableEvent) => {
    setValue(e.target.value);
  };
  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, layer.id)}
      style={{
        outline: getStrokeColor() ? `1px solid ${getStrokeColor()}` : "none",
      }}
    >
      <ContentEditable
        html={value ? value : "Text"}
        onChange={handleContentChange}
        className={cn(
          "h-full w-full flex items-center justify-center text-center drop-shadow-md outline-none",
          font.className
        )}
        style={{
          color: fill ? colorToCss(fill) : "#ccc",
          fontSize: calculateFontSize(width, height),
        }}
      />
    </foreignObject>
  );
};

export default Text;
