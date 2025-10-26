"use client";
import { Board } from "@/app/(Dashboard)/_components/BoardList";
import Info from "./Info";
import Participants from "./Participants";
import Toolbar from "./Toolbar";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBoardStore } from "@/store/useBoardStore";
import CursorsPresence from "./CursorPresence";
import { RealtimeChannel } from "@supabase/supabase-js";
import useAuth from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { pointerEventToCanvasPoint, resizeBounds } from "@/lib/utils";
import { toast } from "sonner";
import LayerPreview from "./LayerPreview";
import { dbLayersToClientLayers, layerTypeToString } from "@/lib/layer-utils";
import { useSelectionBounds } from "@/lib/hooks/useSelectionBounds";
import SelectionBox from "./SelectionBox";
import {
  Camera,
  CanvasMode,
  CanvasState,
  Cursor,
  ClientLayer,
  DBLayer,
  LayerType,
  Point,
  Color,
  Side,
  XYWH,
} from "@/types/canvas";

interface Props {
  boardId: string;
  board: Board | null;
}

export interface PresentUser {
  id: string;
  name: string;
  avatar_url: string;
}

const MAX_LAYERS = 100;

const Canvas = ({ boardId, board }: Props) => {
  const { user } = useAuth();
  const supabase = createClient();

  // realtime states
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [presentUsers, setPresentUsers] = useState<PresentUser[]>([]);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [layers, setLayers] = useState<ClientLayer[]>([]);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [selectedLayersByUser, setSelectedLayersByUser] = useState<
    Record<string, string[]>
  >({});
  // canvas states
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const undo = useBoardStore((state) => state.undo);
  const redo = useBoardStore((state) => state.redo);
  // const addAction = useBoardStore((state) => state.addAction);
  const canUndo = useBoardStore((state) => state.undoStack.length > 0);
  const canRedo = useBoardStore((state) => state.redoStack.length > 0);
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 255,
    b: 255,
  });

  // returns selected layer -helper
  const getSelectedLayers = useCallback(() => {
    return layers.filter((layer) => selectedLayerIds.includes(layer.id));
  }, [layers, selectedLayerIds]);

  // returns selected layer with id -helper
  const getLayerById = useCallback(
    (id: string) => {
      return layers.find((layer) => layer.id === id);
    },
    [layers]
  );

  // getlayer db fetch
  const getLayers = useCallback(async () => {
    if (!user) return;

    try {
      const { data: dbLayers, error } = await supabase
        .from("layers")
        .select("*")
        .eq("board_id", boardId);

      if (error) {
        console.log("Error loading Layers", error);
        return;
      }
      if (dbLayers) {
        const clientLayers = dbLayersToClientLayers(dbLayers);
        setLayers(clientLayers);
      }
    } catch (err) {
      console.log("Error loading Layers", err);
    }
  }, [boardId, supabase, user]);

  // layers realtime effect
  useEffect(() => {
    if (!user) return;

    getLayers();

    const channel = supabase
      .channel("custom-update-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "layers",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.new?.board_id === boardId) {
            const newLayer = dbLayersToClientLayers([
              payload.new as DBLayer,
            ])[0];
            setLayers((prev) => {
              if (prev.some((l) => l.id === newLayer.id)) {
                return prev;
              }
              return [...prev, newLayer];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "layers",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.new?.board_id === boardId) {
            const updatedLayer = dbLayersToClientLayers([
              payload.new as DBLayer,
            ])[0];

            if (selectedLayerIds.includes(updatedLayer.id)) {
              return;
            }

            setLayers((prev) =>
              prev.map((l) => (l.id === updatedLayer.id ? updatedLayer : l))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "layers",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.old?.board_id === boardId) {
            const deletedLayerId = payload.old.id;
            setLayers((prev) => prev.filter((l) => l.id !== deletedLayerId));

            if (selectedLayerIds.includes(deletedLayerId)) {
              setSelectedLayerIds((prev) =>
                prev.filter((id) => id !== deletedLayerId)
              );
            }

            setSelectedLayersByUser((prev) => {
              const updated = { ...prev };
              Object.keys(updated).forEach((userId) => {
                updated[userId] = updated[userId].filter(
                  (id) => id !== deletedLayerId
                );
                if (updated[userId].length === 0) {
                  delete updated[userId];
                }
              });
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [getLayers, supabase, user, boardId, selectedLayerIds]);

  // cursors and live avatar and selection effect
  useEffect(() => {
    if (!user) return;

    // channel setup
    const channel = supabase.channel(`board-room:${boardId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });
    channelRef.current = channel;

    //present users sync
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users = Object.keys(state).map(
        (key) => state[key][0] as unknown as PresentUser
      );
      setPresentUsers(users);
    });

    //  user join logic
    channel.on("presence", { event: "join" }, ({ newPresences }) => {
      setPresentUsers((currentUsers) => {
        const newUniqueUsers = (
          newPresences as unknown as PresentUser[]
        ).filter((u) => !currentUsers.some((cu) => cu.id === u.id));
        return [...currentUsers, ...newUniqueUsers];
      });
    });

    // cursor broadcast
    channel.on("broadcast", { event: "cursor-pos" }, (data) => {
      const { userId, x, y, name } = data.payload;

      if (userId && userId !== user.id) {
        setCursors((currentCursors) => ({
          ...currentCursors,
          [userId]: {
            userId: userId,
            x: x,
            y: y,
            name: name,
          },
        }));
      }
    });

    // layer selection
    channel.on("broadcast", { event: "layers-selected" }, (data) => {
      const { userId, layerIds } = data.payload;

      if (userId && userId !== user.id) {
        setSelectedLayersByUser((prev) => ({
          ...prev,
          [userId]: layerIds,
        }));
      }
    });

    // layer deselection
    channel.on("broadcast", { event: "layers-deselected" }, (data) => {
      const { userId } = data.payload;

      if (userId && userId !== user.id) {
        setSelectedLayersByUser((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    });

    // user leave logic
    channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
      const leftUserIds = (leftPresences as unknown as PresentUser[]).map(
        (u) => u.id
      );

      setPresentUsers((currentUsers) =>
        currentUsers.filter((u) => !leftUserIds.includes(u.id))
      );

      setCursors((currentCursors) => {
        const newCursors = { ...currentCursors };
        for (const id of leftUserIds) {
          delete newCursors[id];
        }
        return newCursors;
      });

      setSelectedLayersByUser((prev) => {
        const updated = { ...prev };
        for (const id of leftUserIds) {
          delete updated[id];
        }
        return updated;
      });
    });

    // sub - actual user joins
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url:
            user.user_metadata?.avatar_url || user.user_metadata?.picture,
        });
      }
    });

    // hide cursor in sudden situations
    const handleVisibilityChange = () => {
      if (document.hidden && channel) {
        channel.send({
          type: "broadcast",
          event: "cursor-pos",
          payload: {
            userId: user.id,
            x: null,
            y: null,
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "Teammate",
          },
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // cleanup - actual user leaves
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [boardId, supabase, user]);

  // insert layer
  const inserLayer = useCallback(
    async (
      layerType:
        | LayerType.Ellipse
        | LayerType.Note
        | LayerType.Rectangle
        | LayerType.Text,
      position: Point
    ) => {
      if (!user) return;

      if (layers.length >= MAX_LAYERS) {
        toast.error(
          `Maximum layers (${MAX_LAYERS}) reached. Delete some layers first.`
        );
        return;
      }

      try {
        const { error } = await supabase
          .from("layers")
          .insert([
            {
              board_id: boardId,
              author_id: user.id,
              author_type: "user" as const,
              layer_type: layerTypeToString(layerType),
              x: position.x,
              y: position.y,
              height: 100,
              width: 100,
              fill: lastUsedColor,
            },
          ])
          .select();

        if (error) {
          toast.error("Failed to insert layer.");
          return;
        }
        setCanvasState({ mode: CanvasMode.None });
      } catch (err) {
        toast.error(`Failed to insert layer : ${err}`);
      }
    },
    [user, layers.length, supabase, boardId, lastUsedColor]
  );

  // resize layer with optimistic updates
  const resizeLayer = useCallback(
    async (point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) return;

      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point
      );

      const layerId = selectedLayerIds[0];
      if (!layerId) return;

      const updatedLayer = {
        ...getLayerById(layerId)!,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      };

      setLayers((prev) =>
        prev.map((layer) => (layer.id === layerId ? updatedLayer : layer))
      );

      try {
        const { error } = await supabase
          .from("layers")
          .update({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          })
          .eq("id", layerId);

        if (error) {
          console.error("Failed to resize layer:", error);
          setLayers((prev) =>
            prev.map((layer) =>
              layer.id === layerId ? getLayerById(layerId)! : layer
            )
          );
          toast.error("Failed to resize layer");
        }
      } catch (err) {
        console.error("Failed to resize layer:", err);
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === layerId ? getLayerById(layerId)! : layer
          )
        );
        toast.error("Failed to resize layer");
      }
    },
    [canvasState, getLayerById, selectedLayerIds, supabase]
  );

  // handle layer selection
  const onLayerPointerDown = useCallback(
    (e: React.PointerEvent, layerId: string) => {
      e.stopPropagation();

      if (
        canvasState.mode === CanvasMode.Inserting ||
        canvasState.mode === CanvasMode.Pencil
      ) {
        return;
      }
      const point = pointerEventToCanvasPoint(e, camera);

      const isAlreadySelected = selectedLayerIds.includes(layerId);
      const updatedSelection = isAlreadySelected ? [] : [layerId];

      setSelectedLayerIds(updatedSelection);

      if (user) {
        setSelectedLayersByUser((prevUsers) => ({
          ...prevUsers,
          [user.id]: updatedSelection,
        }));
      }

      // broadcast updated selection
      if (channelRef.current && user) {
        if (updatedSelection.length > 0) {
          channelRef.current.send({
            type: "broadcast",
            event: "layers-selected",
            payload: {
              userId: user.id,
              layerIds: updatedSelection,
            },
          });
        } else {
          channelRef.current.send({
            type: "broadcast",
            event: "layers-deselected",
            payload: {
              userId: user.id,
            },
          });
        }
      }

      if (!isAlreadySelected) {
        setCanvasState({ mode: CanvasMode.Translating, current: point });
      } else {
        setCanvasState({ mode: CanvasMode.None });
      }
    },
    [canvasState.mode, camera, selectedLayerIds, user]
  );

  // handle layer deselection
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const target = e.target as SVGElement;
      if (target.tagName === "svg" || target.tagName === "g") {
        if (selectedLayerIds.length > 0) {
          setSelectedLayerIds([]);

          if (user) {
            setSelectedLayersByUser((prev) => {
              const updated = { ...prev };
              delete updated[user.id];
              return updated;
            });
          }

          // broadcast deselection
          if (channelRef.current && user) {
            channelRef.current.send({
              type: "broadcast",
              event: "layers-deselected",
              payload: {
                userId: user.id,
              },
            });
          }
        }
      }
    },
    [selectedLayerIds, user]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  // cursor move event handler
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const current = pointerEventToCanvasPoint(e, camera);

      // resize
      if (canvasState.mode === CanvasMode.Resizing) resizeLayer(current);

      // cursor
      if (channelRef.current && user) {
        channelRef.current.send({
          type: "broadcast",
          event: "cursor-pos",
          payload: {
            userId: user.id,
            x: current.x,
            y: current.y,
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "Teammate",
          },
        });
      }
    },
    [camera, canvasState.mode, resizeLayer, user]
  );

  const onPointerLeave = useCallback(() => {
    if (channelRef.current && user) {
      channelRef.current.send({
        type: "broadcast",
        event: "cursor-pos",
        payload: {
          userId: user.id,
          x: null,
          y: null,
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "Teammate",
        },
      });
    }
  }, [user]);

  const onPointerup = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.Inserting) {
        inserLayer(canvasState.layerType, point);
      }
      if (canvasState.mode !== CanvasMode.Translating) {
        setCanvasState({ mode: CanvasMode.None });
      }
    },
    [camera, canvasState, inserLayer]
  );

  //resize selector click handler
  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      setCanvasState({ mode: CanvasMode.Resizing, corner, initialBounds });
    },
    []
  );

  return (
    <main className="h-screen w-full relative bg-neutral-100 touch-none">
      <Info board={board} />
      <Participants presentUsers={presentUsers} />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        undo={undo}
        canUndo={canUndo}
        redo={redo}
        canRedo={canRedo}
      />
      <svg
        className="h-[100vh] w-[100vw]"
        onPointerMove={onPointerMove}
        onWheel={onWheel}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerup}
        onClick={handleCanvasClick}
      >
        <g style={{ transform: `translate(${camera.x}px, ${camera.y}px)` }}>
          {layers.map((layer) => (
            <LayerPreview
              key={layer.id}
              layer={layer}
              isSelectedByUser={selectedLayerIds.includes(layer.id)}
              onLayerPointerDown={onLayerPointerDown}
              selectedByUserIds={Object.entries(selectedLayersByUser)
                .filter(([, layerIds]) => layerIds.includes(layer.id))
                .map(([userId]) => userId)}
            />
          ))}
          <SelectionBox
            selectedLayers={getSelectedLayers()}
            bounds={useSelectionBounds(getSelectedLayers())}
            onResizeHandlePointerDown={onResizeHandlePointerDown}
          />

          <CursorsPresence cursors={cursors} currentUserId={user?.id} />
        </g>
      </svg>
    </main>
  );
};

export default Canvas;
