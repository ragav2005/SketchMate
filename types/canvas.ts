// enums
export type LayerTypeEnum = "Rectangle" | "Ellipse" | "Path" | "Text" | "Note";
export type AuthorTypeEnum = "user" | "ai" | "system";

export enum CanvasMode {
  None,
  Pressing,
  SelectionNet,
  Translating,
  Inserting,
  Resizing,
  Pencil,
}

export enum LayerType {
  Rectangle,
  Ellipse,
  Path,
  Text,
  Note,
}

export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

// types
export type Metadata = Record<string, unknown>;

export type Cursor = {
  userId: string;
  x: number | null;
  y: number | null;
  name: string;
};

export type LayerSelection = {
  userId: string;
  layerId: string;
};

export type Color = {
  r: number;
  g: number;
  b: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Camera = {
  x: number;
  y: number;
};

export type XYWH = {
  x: number;
  y: number;
  height: number;
  width: number;
};

// snake_case types
export type DBRectangleLayer = {
  id: string;
  board_id: string;
  author_id: string | null;
  author_type: AuthorTypeEnum;
  layer_type: "Rectangle";
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value: string | null;
  metadata: Metadata | null;
  created_at: string;
  updated_at: string;
};

export type DBEllipseLayer = {
  id: string;
  board_id: string;
  author_id: string | null;
  author_type: AuthorTypeEnum;
  layer_type: "Ellipse";
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value: string | null;
  metadata: Metadata | null;
  created_at: string;
  updated_at: string;
};

export type DBPathLayer = {
  id: string;
  board_id: string;
  author_id: string | null;
  author_type: AuthorTypeEnum;
  layer_type: "Path";
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value: string | null;
  metadata: { points: number[][] } & Metadata;
  created_at: string;
  updated_at: string;
};

export type DBTextLayer = {
  id: string;
  board_id: string;
  author_id: string | null;
  author_type: AuthorTypeEnum;
  layer_type: "Text";
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value: string | null;
  metadata: Metadata | null;
  created_at: string;
  updated_at: string;
};

export type DBNoteLayer = {
  id: string;
  board_id: string;
  author_id: string | null;
  author_type: AuthorTypeEnum;
  layer_type: "Note";
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value: string | null;
  metadata: Metadata | null;
  created_at: string;
  updated_at: string;
};

export type DBLayer =
  | DBRectangleLayer
  | DBEllipseLayer
  | DBPathLayer
  | DBTextLayer
  | DBNoteLayer;

// camelCase types
export type ClientRectangleLayer = {
  id: string;
  boardId: string;
  authorId: string | null;
  authorType: AuthorTypeEnum;
  type: LayerType.Rectangle;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string | null;
  metadata?: Metadata | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientEllipseLayer = {
  id: string;
  boardId: string;
  authorId: string | null;
  authorType: AuthorTypeEnum;
  type: LayerType.Ellipse;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string | null;
  metadata?: Metadata | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientPathLayer = {
  id: string;
  boardId: string;
  authorId: string | null;
  authorType: AuthorTypeEnum;
  type: LayerType.Path;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  points: number[][];
  value?: string | null;
  metadata?: Metadata | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientTextLayer = {
  id: string;
  boardId: string;
  authorId: string | null;
  authorType: AuthorTypeEnum;
  type: LayerType.Text;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string | null;
  metadata?: Metadata | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientNoteLayer = {
  id: string;
  boardId: string;
  authorId: string | null;
  authorType: AuthorTypeEnum;
  type: LayerType.Note;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string | null;
  metadata?: Metadata | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientLayer =
  | ClientRectangleLayer
  | ClientEllipseLayer
  | ClientPathLayer
  | ClientTextLayer
  | ClientNoteLayer;

// mutation types
export type CreateLayerInput = {
  board_id: string;
  author_id: string;
  author_type: AuthorTypeEnum;
  layer_type: LayerTypeEnum;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string | null;
  metadata?: Metadata | null;
};

export type UpdateLayerInput = Partial<
  Omit<CreateLayerInput, "board_id" | "author_id" | "author_type">
>;

// canvas states
export type CanvasState =
  | {
      mode: CanvasMode.None;
    }
  | {
      mode: CanvasMode.Pressing;
      point: Point;
    }
  | {
      mode: CanvasMode.SelectionNet;
      orgin: Point;
      current?: Point;
    }
  | {
      mode: CanvasMode.Translating;
      current: Point;
    }
  | {
      mode: CanvasMode.Inserting;
      layerType:
        | LayerType.Ellipse
        | LayerType.Note
        | LayerType.Rectangle
        | LayerType.Text;
    }
  | {
      mode: CanvasMode.Resizing;
      initialBounds: XYWH;
      corner: Side;
    }
  | {
      mode: CanvasMode.Pencil;
    };
