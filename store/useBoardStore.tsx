import { ClientLayer } from "@/types/canvas";
import { create } from "zustand";

type Action =
  | {
      type: "ADD";
      layer: ClientLayer;
    }
  | {
      type: "UPDATE";
      before: ClientLayer;
      after: ClientLayer;
    }
  | {
      type: "DELETE";
      layer: ClientLayer;
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
