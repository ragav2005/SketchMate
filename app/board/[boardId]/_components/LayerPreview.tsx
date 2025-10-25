import { ClientLayer, LayerType } from "@/types/canvas";
import React, { memo } from "react";
import Rectangle from "./Rectangle";
interface Props {
  layer: ClientLayer;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectedByUserIds: string[];
}
const LayerPreview = memo(
  ({ layer, onLayerPointerDown, selectedByUserIds }: Props) => {
    if (!layer) {
      return null;
    }

    switch (layer.type) {
      case LayerType.Rectangle:
        return (
          <Rectangle
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectedByUserIds={selectedByUserIds}
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
