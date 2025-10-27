import { ClientLayer, LayerType } from "@/types/canvas";
import React, { memo } from "react";
import Rectangle from "./Rectangle";
import Ellipse from "./Ellipse";
import Text from "./Text";
import Note from "./Note";
import Path from "./Path";
import { colorToCss } from "@/lib/utils";
import { Action } from "@/store/useBoardStore";

interface Props {
  layer: ClientLayer;
  selectedByUserIds: string[];
  isSelectedByUser: boolean;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  setLayers: React.Dispatch<React.SetStateAction<ClientLayer[]>>;
  addAction?: (action: Action) => void;
}
const LayerPreview = memo(
  ({
    layer,
    onLayerPointerDown,
    selectedByUserIds,
    isSelectedByUser,
    setLayers,
    addAction,
  }: Props) => {
    if (!layer) {
      return null;
    }

    switch (layer.type) {
      case LayerType.Rectangle:
        return (
          <Rectangle
            layer={layer}
            isSelectedByUser={isSelectedByUser}
            onPointerDown={onLayerPointerDown}
            selectedByUserIds={selectedByUserIds}
          />
        );

      case LayerType.Ellipse:
        return (
          <Ellipse
            layer={layer}
            isSelectedByUser={isSelectedByUser}
            onPointerDown={onLayerPointerDown}
            selectedByUserIds={selectedByUserIds}
          />
        );

      case LayerType.Text:
        return (
          <Text
            setLayers={setLayers}
            layer={layer}
            isSelectedByUser={isSelectedByUser}
            onPointerDown={onLayerPointerDown}
            selectedByUserIds={selectedByUserIds}
            addAction={addAction}
          />
        );

      case LayerType.Note:
        return (
          <Note
            setLayers={setLayers}
            layer={layer}
            isSelectedByUser={isSelectedByUser}
            onPointerDown={onLayerPointerDown}
            selectedByUserIds={selectedByUserIds}
            addAction={addAction}
          />
        );

      case LayerType.Path:
        return (
          <Path
            points={layer.points}
            x={layer.x}
            y={layer.y}
            fill={layer.fill ? colorToCss(layer.fill) : "#000"}
            selectedByUserIds={selectedByUserIds}
            onPointerDown={(e) => {
              onLayerPointerDown(e, layer.id);
            }}
          />
        );

      default:
        console.warn("Invalid layer type!!");
        return null;
    }
  }
);

LayerPreview.displayName = "LayerPreview";

export default LayerPreview;
