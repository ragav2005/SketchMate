import { Kalam } from "next/font/google";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import {
  cn,
  colorToCss,
  getContrastingTextColor,
  idToColor,
} from "@/lib/utils";
import { ClientLayer, ClientNoteLayer } from "@/types/canvas";
import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const font = Kalam({ subsets: ["latin"], weight: ["400"] });

interface Props {
  layer: ClientNoteLayer;
  selectedByUserIds: string[];
  isSelectedByUser: boolean;

  onPointerDown: (e: React.PointerEvent, id: string) => void;
  setLayers: React.Dispatch<React.SetStateAction<ClientLayer[]>>;
}

const calculateFontSize = (width: number, height: number) => {
  const maxFontSize = 96;
  const scaleFactor = 0.15;
  const fontSizeBasedOnHeight = height * scaleFactor;
  const fontSizeBasedOnWidth = width * scaleFactor;

  return Math.min(maxFontSize, fontSizeBasedOnHeight, fontSizeBasedOnWidth);
};

const Note = ({
  layer,
  selectedByUserIds,
  onPointerDown,
  setLayers,
}: Props) => {
  const supabase = createClient();
  const { x, y, width, height, fill, value } = layer;

  const getStrokeColor = () => {
    if (selectedByUserIds.length > 0) {
      return idToColor(selectedByUserIds[0]);
    }
    return null;
  };

  // update text
  const setValue = useCallback(
    (newValue: string) => {
      const originalLayer = layer;

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
            console.log("error updating note layer:", error);
            setLayers((prev) =>
              prev.map((prevLayer) =>
                prevLayer.id === layer.id ? originalLayer : prevLayer
              )
            );
          }
        });
    },
    [layer, setLayers, supabase]
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
      className="shadow-md drop-shadow-xl"
    >
      <div
        style={{
          backgroundColor: fill ? colorToCss(fill) : "#00",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          paddingInline: "8px",
        }}
      >
        <ContentEditable
          html={value ? value : "Sticky note here"}
          onChange={handleContentChange}
          className={cn(
            "h-full w-full flex items-center justify-center text-center outline-none",
            font.className
          )}
          style={{
            color: fill ? getContrastingTextColor(fill) : "#ccc",
            fontSize: calculateFontSize(width, height),
          }}
        />
      </div>
    </foreignObject>
  );
};

export default Note;
