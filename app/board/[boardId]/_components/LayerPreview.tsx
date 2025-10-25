import { ClientLayer, LayerType } from "@/types/canvas";
import React, { memo } from "react";
import Rectangle from "./Rectangle";
interface Props {
  layer: ClientLayer;
  selectionColor: string;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
}
const LayerPreview = memo(
  ({ layer, selectionColor, onLayerPointerDown }: Props) => {
    if (!layer) {
      return null;
    }

    switch (layer.type) {
      case LayerType.Rectangle:
        return (
          <Rectangle
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
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
