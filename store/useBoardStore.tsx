import { ClientLayer } from "@/types/canvas";
import { create } from "zustand";

export type Action =
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
  undo: (
    currentLayers: ClientLayer[],
    onApplyAction: (layers: ClientLayer[]) => Promise<void>
  ) => Promise<void>;
  redo: (
    currentLayers: ClientLayer[],
    onApplyAction: (layers: ClientLayer[]) => Promise<void>
  ) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  addAction: (action) => {
    set((state) => ({
      undoStack: [...state.undoStack, action],
      redoStack: [],
    }));
  },
  undo: async (currentLayers, onApplyAction) => {
    const state = get();
    if (state.undoStack.length === 0) return;

    const action = state.undoStack[state.undoStack.length - 1];

    let newLayers = [...currentLayers];

    if (action.type === "ADD") {
      // Undo ADD: remove the layer
      newLayers = newLayers.filter((layer) => layer.id !== action.layer.id);
    } else if (action.type === "UPDATE") {
      // Undo UPDATE: revert to before state
      newLayers = newLayers.map((layer) =>
        layer.id === action.before.id ? action.before : layer
      );
    } else if (action.type === "DELETE") {
      // Undo DELETE: re-add the layer
      newLayers = [...newLayers, action.layer];
    }

    // Apply the changes
    await onApplyAction(newLayers);

    // Update stacks
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, action],
    }));
  },
  redo: async (currentLayers, onApplyAction) => {
    const state = get();
    
    if (state.redoStack.length === 0) return;

    const action = state.redoStack[state.redoStack.length - 1];

    let newLayers = [...currentLayers];

    if (action.type === "ADD") {
      // Redo ADD: re-add the layer
      newLayers = [...newLayers, action.layer];
    } else if (action.type === "UPDATE") {
      // Redo UPDATE: apply after state
      newLayers = newLayers.map((layer) =>
        layer.id === action.after.id ? action.after : layer
      );
    } else if (action.type === "DELETE") {
      // Redo DELETE: remove the layer again
      newLayers = newLayers.filter((layer) => layer.id !== action.layer.id);
    }

    // Apply the changes
    await onApplyAction(newLayers);

    // Update stacks
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, action],
    }));
  },
}));
