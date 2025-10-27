import { Camera, ClientLayer, Color, XYWH } from "@/types/canvas";
import React, { memo, useCallback } from "react";
import ColorPicker from "./ColorPicker";
import { createClient } from "@/lib/supabase/client";
import Hint from "@/components/hint";
import { Button } from "@/components/ui/button";
import { BringToFront, SendToBack, Trash2 } from "lucide-react";
import { Action } from "@/store/useBoardStore";

interface Props {
  camera: Camera;
  lastUsedColor: Color;
  setLastUsedColor: (color: Color) => void;
  selectedLayers: ClientLayer[];
  selectionBounds: XYWH | null;
  getLayerById: (id: string) => ClientLayer | undefined;
  setLayers: React.Dispatch<React.SetStateAction<ClientLayer[]>>;
  addAction: (action: Action) => void;
}

const SelectionTools = memo(
  ({
    camera,
    setLastUsedColor,
    selectionBounds,
    selectedLayers,
    getLayerById,
    lastUsedColor,
    setLayers,
    addAction,
  }: Props) => {
    const supabase = createClient();

    // color change handler
    const setFill = useCallback(
      (fill: Color) => {
        setLastUsedColor(fill);
        selectedLayers.forEach(async (layer) => {
          const originalLayers = getLayerById(layer.id)!;

          const updatedLayer = {
            ...originalLayers,
            fill: fill,
          };

          setLayers((prev) =>
            prev.map((prevLayer) =>
              prevLayer.id === layer.id ? updatedLayer : prevLayer
            )
          );

          try {
            const { error } = await supabase
              .from("layers")
              .update({ fill: fill })
              .eq("id", layer.id)
              .select();

            if (error) {
              console.log("Error updating layer fill:", error);
              setLayers((prev: ClientLayer[]) =>
                prev.map((prevLayer) =>
                  prevLayer.id === layer.id ? originalLayers : prevLayer
                )
              );
            } else {
              addAction({
                type: "UPDATE",
                before: originalLayers,
                after: updatedLayer,
              });
            }
          } catch (err) {
            console.log("Error updating layer fill:", err);
            setLayers((prev: ClientLayer[]) =>
              prev.map((prevLayer) =>
                prevLayer.id === layer.id ? originalLayers : prevLayer
              )
            );
          }
        });
      },
      [
        getLayerById,
        selectedLayers,
        setLastUsedColor,
        setLayers,
        supabase,
        addAction,
      ]
    );
    // delete handler
    const handleDelete = useCallback(() => {
      selectedLayers.forEach(async (layer) => {
        try {
          setLayers((prev: ClientLayer[]) =>
            prev.filter((l) => l.id !== layer.id)
          );

          const { error } = await supabase
            .from("layers")
            .delete()
            .eq("id", layer.id);

          if (error) {
            console.log("Failed to delete layer:", error);
          } else {
            addAction({
              type: "DELETE",
              layer: layer,
            });
          }
        } catch (err) {
          console.log("Failed to delete layer:", err);
        }
      });
    }, [selectedLayers, supabase, setLayers, addAction]);

    //move to back
    const moveToBack = useCallback(() => {
      if (selectedLayers.length === 0) return;

      const newZIndexValues: Record<string, number> = {};
      const originalLayers = selectedLayers.map((layer) => ({ ...layer }));

      setLayers((prev: ClientLayer[]) => {
        const minZ = Math.min(...prev.map((l) => l.zIndex ?? 0));
        const newZIndex = minZ - selectedLayers.length;

        selectedLayers.forEach((layer, idx) => {
          newZIndexValues[layer.id] = newZIndex + idx;
        });

        const newLayers = prev.map((layer) => {
          if (newZIndexValues[layer.id] !== undefined) {
            return { ...layer, zIndex: newZIndexValues[layer.id] };
          }
          return layer;
        });

        return newLayers.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
      });

      const updatedLayers = selectedLayers.map((layer) => ({
        ...layer,
        zIndex: newZIndexValues[layer.id],
      }));

      updatedLayers.forEach((updatedLayer, idx) => {
        addAction({
          type: "UPDATE",
          before: originalLayers[idx],
          after: updatedLayer,
        });
      });

      setTimeout(() => {
        Object.entries(newZIndexValues).forEach(async ([layerId, zIndex]) => {
          try {
            await supabase
              .from("layers")
              .update({ z_index: zIndex })
              .eq("id", layerId);
          } catch (err) {
            console.log("Failed to move layer to back:", err);
          }
        });
      }, 0);
    }, [selectedLayers, setLayers, supabase, addAction]);

    // move to front
    const moveToFront = useCallback(() => {
      if (selectedLayers.length === 0) return;

      const newZIndexValues: Record<string, number> = {};
      const originalLayers = selectedLayers.map((layer) => ({ ...layer }));

      setLayers((prev: ClientLayer[]) => {
        const maxZ = Math.max(...prev.map((l) => l.zIndex ?? 0));
        const newZIndex = maxZ + 1;

        selectedLayers.forEach((layer, idx) => {
          newZIndexValues[layer.id] = newZIndex + idx;
        });

        const newLayers = prev.map((layer) => {
          if (newZIndexValues[layer.id] !== undefined) {
            return { ...layer, zIndex: newZIndexValues[layer.id] };
          }
          return layer;
        });

        return newLayers.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
      });

      const updatedLayers = selectedLayers.map((layer) => ({
        ...layer,
        zIndex: newZIndexValues[layer.id],
      }));

      updatedLayers.forEach((updatedLayer, idx) => {
        addAction({
          type: "UPDATE",
          before: originalLayers[idx],
          after: updatedLayer,
        });
      });

      setTimeout(() => {
        Object.entries(newZIndexValues).forEach(async ([layerId, zIndex]) => {
          try {
            await supabase
              .from("layers")
              .update({ z_index: zIndex })
              .eq("id", layerId);
          } catch (err) {
            console.log("Failed to move layer to front:", err);
          }
        });
      }, 0);
    }, [selectedLayers, setLayers, supabase, addAction]);

    if (!selectionBounds) return null;
    const x = selectionBounds.width / 2 + selectionBounds.x + camera.x;
    const y = selectionBounds.y + camera.y;
    return (
      <div
        className="p-3 absolute rounded-xl bg-white shadow-sm border flex select-none"
        style={{
          transform: `translate(
            calc(${x}px - 50%),
            calc(${y - 16}px - 100%)
        )`,
        }}
      >
        <ColorPicker onChange={setFill} lastUsedColor={lastUsedColor} />
        <div className="flex flex-col gap-y-0.5">
          <Hint label="Bring to front">
            <Button
              variant="board"
              size="icon"
              className="cursor-pointer"
              onClick={moveToFront}
            >
              <BringToFront />
            </Button>
          </Hint>
          <Hint label="Send to back" side="bottom">
            <Button
              variant="board"
              size="icon"
              className="cursor-pointer"
              onClick={moveToBack}
            >
              <SendToBack />
            </Button>
          </Hint>
        </div>
        <div className="flex items-center pl-2 ml-2 border-l border-neutral-200">
          <Hint label="Delete">
            <Button
              variant="board"
              size="icon"
              className="cursor-pointer"
              onClick={handleDelete}
            >
              <Trash2 />
            </Button>
          </Hint>
        </div>
      </div>
    );
  }
);

SelectionTools.displayName = "SelectionTools";
export default SelectionTools;
