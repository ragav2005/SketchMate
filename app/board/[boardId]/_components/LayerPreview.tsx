import { ClientLayer, LayerType } from "@/types/canvas";
import React, { memo } from "react";
import Rectangle from "./Rectangle";
import Ellipse from "./Ellipse";
import Text from "./Text";
import Note from "./Note";
interface Props {
  layer: ClientLayer;
  selectedByUserIds: string[];
  isSelectedByUser: boolean;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  setLayers: React.Dispatch<React.SetStateAction<ClientLayer[]>>;
}
const LayerPreview = memo(
  ({
    layer,
    onLayerPointerDown,
    selectedByUserIds,
    isSelectedByUser,
    setLayers,
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
          />
        );

      case LayerType.Path:
      // TODO: Create Path component

      default:
        console.warn("Invalid layer type!!");
        return null;
    }
  }
);

LayerPreview.displayName = "LayerPreview";

export default LayerPreview;
