import {
  RectangleLayer,
  EllipseLayer,
  PathLayer,
  TextLayer,
  NoteLayer,
} from "@/types/canvas";
import { create } from "zustand";

type Layer = RectangleLayer | EllipseLayer | PathLayer | TextLayer | NoteLayer;

type Action =
  | {
      type: "ADD";
      layer: Layer;
      layerId: string;
    }
  | {
      type: "UPDATE";
      layerId: string;
      before: Layer;
      after: Layer;
    }
  | {
      type: "DELETE";
      layer: Layer;
      layerId: string;
    };

export interface BoardState {
  undoStack: Action[];
  redoStack: Action[];
  addAction: (action: Action) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

export const useBoardStore = create<BoardState>((set) => ({
  undoStack: [],
  redoStack: [],
  addAction: (action) => {
    set((state) => ({
      undoStack: [...state.undoStack, action],
      redoStack: [],
    }));
  },
  undo: async () => {},
  redo: async () => {},
}));
