import {
  DBLayer,
  ClientLayer,
  LayerType,
  DBPathLayer,
  ClientPathLayer,
} from "@/types/canvas";

// convert snake_case to camelCase
export function dbLayerToClientLayer(dbLayer: DBLayer): ClientLayer {
  const baseLayer = {
    id: dbLayer.id,
    boardId: dbLayer.board_id,
    authorId: dbLayer.author_id,
    authorType: dbLayer.author_type,
    x: dbLayer.x,
    y: dbLayer.y,
    height: dbLayer.height,
    width: dbLayer.width,
    fill: dbLayer.fill,
    value: dbLayer.value,
    metadata: dbLayer.metadata,
    createdAt: dbLayer.created_at,
    updatedAt: dbLayer.updated_at,
  };

  switch (dbLayer.layer_type) {
    case "Rectangle":
      return {
        ...baseLayer,
        type: LayerType.Rectangle,
      } as ClientLayer;

    case "Ellipse":
      return {
        ...baseLayer,
        type: LayerType.Ellipse,
      } as ClientLayer;

    case "Path": {
      const pathLayer = dbLayer as DBPathLayer;
      const points = pathLayer.metadata?.points ?? [];
      return {
        ...baseLayer,
        type: LayerType.Path,
        points,
      } as ClientPathLayer as ClientLayer;
    }

    case "Text":
      return {
        ...baseLayer,
        type: LayerType.Text,
      } as ClientLayer;

    case "Note":
      return {
        ...baseLayer,
        type: LayerType.Note,
      } as ClientLayer;

    default: {
      const exhaustiveCheck: never = dbLayer;
      throw new Error(`Unknown layer type: ${exhaustiveCheck}`);
    }
  }
}

// converts many layers
export function dbLayersToClientLayers(dbLayers: DBLayer[]): ClientLayer[] {
  return dbLayers.map(dbLayerToClientLayer);
}

// enum to string
export function layerTypeToString(
  type: LayerType
): "Rectangle" | "Ellipse" | "Path" | "Text" | "Note" {
  const mapping = {
    [LayerType.Rectangle]: "Rectangle",
    [LayerType.Ellipse]: "Ellipse",
    [LayerType.Path]: "Path",
    [LayerType.Text]: "Text",
    [LayerType.Note]: "Note",
  } as const;

  return mapping[type];
}

// string to enum
export function stringToLayerType(str: string): LayerType | null {
  const mapping: Record<string, LayerType> = {
    Rectangle: LayerType.Rectangle,
    Ellipse: LayerType.Ellipse,
    Path: LayerType.Path,
    Text: LayerType.Text,
    Note: LayerType.Note,
  };

  return mapping[str] ?? null;
}
