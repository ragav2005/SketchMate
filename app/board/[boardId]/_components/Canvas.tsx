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
import {
  findIntersectingLayersWithRectangle,
  pointerEventToCanvasPoint,
  resizeBounds,
  penPointsToPathLayer,
  colorToCss,
} from "@/lib/utils";
import { toast } from "sonner";
import LayerPreview from "./LayerPreview";
import { dbLayersToClientLayers, layerTypeToString } from "@/lib/layer-utils";
import { useSelectionBounds } from "@/lib/hooks/useSelectionBounds";
import SelectionBox from "./SelectionBox";
import Path from "./Path";
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
import SelectionTools from "./SelectionTools";
import { useDisableScrollBounce } from "@/lib/hooks/useDisableScrollBounce";

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
  const dragStartPointRef = useRef<Point | null>(null);
  const hasDraggedRef = useRef(false);
  const resizeStartLayerRef = useRef<ClientLayer | null>(null);
  const translateStartLayersRef = useRef<ClientLayer[]>([]);
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
  const addAction = useBoardStore((state) => state.addAction);
  const canUndo = useBoardStore((state) => state.undoStack.length > 0);
  const canRedo = useBoardStore((state) => state.redoStack.length > 0);
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 255,
    g: 249,
    b: 177,
  });
  const [pencilDraft, setPencilDraft] = useState<number[][]>([]);

  useEffect(() => {
    if (canvasState.mode !== CanvasMode.Pencil && pencilDraft.length > 0) {
      setPencilDraft([]);
    }
  }, [canvasState.mode, pencilDraft.length]);

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
        const sortedLayers = clientLayers.sort(
          (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
        );
        setLayers(sortedLayers);
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

              if (newLayer.authorId === user?.id) {
                const withoutTemp = prev.filter(
                  (l) => !l.id.startsWith("temp-")
                );
                const updated = [...withoutTemp, newLayer];
                return updated.sort(
                  (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
                );
              }

              const updated = [...prev, newLayer];
              return updated.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
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

            setLayers((prev) => {
              const updated = prev.map((l) =>
                l.id === updatedLayer.id ? updatedLayer : l
              );
              return updated.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "layers",
        },
        (payload) => {
          if (!payload.old) {
            return;
          }

          const deletedLayerId = payload.old.id;
          setLayers((prev) => {
            const layerToDelete = prev.find((l) => l.id === deletedLayerId);

            if (!layerToDelete) {
              return prev;
            }

            if (layerToDelete.boardId !== boardId) {
              return prev;
            }

            const updated = prev.filter((l) => l.id !== deletedLayerId);
            return updated;
          });

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
  const insertLayer = useCallback(
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

      if (canvasState.mode !== CanvasMode.Inserting) return;

      try {
        const { data, error } = await supabase
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

        if (data && data.length > 0) {
          const newLayer = dbLayersToClientLayers([data[0] as DBLayer])[0];
          addAction({
            type: "ADD",
            layer: newLayer,
          });
        }

        setCanvasState({ mode: CanvasMode.None });
      } catch (err) {
        toast.error(`Failed to insert layer : ${err}`);
      }
    },
    [
      user,
      layers,
      canvasState.mode,
      boardId,
      lastUsedColor,
      supabase,
      addAction,
    ]
  );

  // resize layer
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

      const originalLayer = getLayerById(layerId)!;

      // Store initial state on first resize call
      if (!resizeStartLayerRef.current) {
        resizeStartLayerRef.current = { ...originalLayer };
      }

      const updatedLayer = {
        ...originalLayer,
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

  // translate layers
  const translateLayers = useCallback(
    (point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) {
        return;
      }

      const selectedLayers: ClientLayer[] = getSelectedLayers();

      if (selectedLayers.length === 0) {
        return;
      }

      // Store initial state on first translate call
      if (translateStartLayersRef.current.length === 0) {
        translateStartLayersRef.current = selectedLayers.map((layer) => ({
          ...layer,
        }));
      }

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      const originalLayers = layers;

      // local state
      setLayers((prev) =>
        prev.map((layer) => {
          if (selectedLayerIds.includes(layer.id)) {
            return {
              ...layer,
              x: layer.x + offset.x,
              y: layer.y + offset.y,
            };
          }
          return layer;
        })
      );

      // db changes
      selectedLayers.forEach(async (layer: ClientLayer) => {
        try {
          const { error } = await supabase
            .from("layers")
            .update({ x: layer.x + offset.x, y: layer.y + offset.y })
            .eq("id", layer.id)
            .select();

          if (error) {
            console.log("Error in translating layer.");
            setLayers(originalLayers);
          }
        } catch (err) {
          console.log("Error in translating layer.", err);
          setLayers(originalLayers);
        }
      });

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState, getSelectedLayers, selectedLayerIds, supabase, layers]
  );

  // start multi selection
  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });
  }, []);

  // update multi selection
  const updateSelectionNet = useCallback(
    (current: Point, origin: Point) => {
      if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
        setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });
        const ids = findIntersectingLayersWithRectangle(
          layers,
          origin,
          current
        );

        // broadcast changes
        setSelectedLayerIds(ids);

        if (user) {
          setSelectedLayersByUser((prevUsers) => ({
            ...prevUsers,
            [user.id]: ids,
          }));
        }

        if (channelRef.current && user) {
          channelRef.current.send({
            type: "broadcast",
            event: "layers-selected",
            payload: {
              userId: user.id,
              layerIds: ids,
            },
          });
        }
      }
    },
    [layers, user]
  );

  // start drawing
  const startDrawing = useCallback((point: Point, pressure: number) => {
    setPencilDraft([[point.x, point.y, pressure]]);
  }, []);

  // continue drawing
  const continueDrawing = useCallback(
    (current: Point, e: React.PointerEvent) => {
      if (canvasState.mode !== CanvasMode.Pencil || e.buttons !== 1) return;

      setPencilDraft((prev) => {
        if (prev.length === 0) {
          return [[current.x, current.y, e.pressure]];
        }
        return [...prev, [current.x, current.y, e.pressure]];
      });
    },
    [canvasState.mode]
  );

  // insert path
  const inserPath = useCallback(async () => {
    if (layers.length >= MAX_LAYERS) {
      toast.error(
        `Maximum layers (${MAX_LAYERS}) reached. Delete some layers first.`
      );
      setPencilDraft([]);
      return;
    }

    if (pencilDraft.length < 2) {
      setPencilDraft([]);
      return;
    }

    if (!user) {
      setPencilDraft([]);
      return;
    }

    try {
      const partialLayer = penPointsToPathLayer(pencilDraft, lastUsedColor);

      const tempId = `temp-${Date.now()}-${Math.random()}`;

      const tempLayer: ClientLayer = {
        ...partialLayer,
        id: tempId,
        boardId: boardId,
        authorId: user.id,
        authorType: "user" as const,
        type: LayerType.Path,
        points: partialLayer.points!,
        zIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ClientLayer;

      setLayers((prev) => [...prev, tempLayer]);

      setPencilDraft([]);
      setCanvasState({ mode: CanvasMode.None });

      // db mutation
      const { data, error } = await supabase
        .from("layers")
        .insert([
          {
            board_id: boardId,
            author_id: user.id,
            author_type: "user" as const,
            layer_type: "Path",
            x: partialLayer.x,
            y: partialLayer.y,
            height: partialLayer.height,
            width: partialLayer.width,
            fill: lastUsedColor,
            metadata: { points: partialLayer.points },
          },
        ])
        .select();

      if (error) {
        console.error("Failed to insert path:", error);
        toast.error("Failed to save drawing");
        setLayers((prev) => prev.filter((l) => l.id !== tempId));
        return;
      }

      if (data && data.length > 0) {
        const realLayer = dbLayersToClientLayers([data[0] as DBLayer])[0];
        setLayers((prev) => prev.map((l) => (l.id === tempId ? realLayer : l)));

        addAction({
          type: "ADD",
          layer: realLayer,
        });
      }
    } catch (err) {
      console.error("Failed to insert path:", err);
      toast.error("Failed to create drawing");
      setPencilDraft([]);
    }
  }, [
    layers.length,
    pencilDraft,
    user,
    lastUsedColor,
    boardId,
    supabase,
    addAction,
  ]);

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

      if (!isAlreadySelected) {
        const updatedSelection = [layerId];
        setSelectedLayerIds(updatedSelection);

        if (user) {
          setSelectedLayersByUser((prevUsers) => ({
            ...prevUsers,
            [user.id]: updatedSelection,
          }));
        }

        // broadcast updated selection
        if (channelRef.current && user) {
          channelRef.current.send({
            type: "broadcast",
            event: "layers-selected",
            payload: {
              userId: user.id,
              layerIds: updatedSelection,
            },
          });
        }

        setCanvasState({ mode: CanvasMode.None });
      } else {
        // dragging
        dragStartPointRef.current = point;
        setCanvasState({
          mode: CanvasMode.Translating,
          current: point,
        });
      }
    },
    [camera, selectedLayerIds, user, canvasState.mode]
  );

  // handle layer deselection and canvas pointer down
  const handleCanvasClick = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.Inserting) return;

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      const target = e.target as SVGElement;

      // deselection
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

      setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState.mode, selectedLayerIds.length, startDrawing, user]
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

      // pressing or translate or resize
      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        if (dragStartPointRef.current) {
          const distance = Math.hypot(
            current.x - dragStartPointRef.current.x,
            current.y - dragStartPointRef.current.y
          );
          if (distance > 5) {
            hasDraggedRef.current = true;
            dragStartPointRef.current = null;
          }
        }
        translateLayers(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeLayer(current);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }
      if (channelRef.current && user) {
        // cursor
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
    [
      camera,
      canvasState,
      continueDrawing,
      resizeLayer,
      startMultiSelection,
      translateLayers,
      updateSelectionNet,
      user,
    ]
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

      if (canvasState.mode === CanvasMode.Pencil) {
        inserPath();
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertLayer(canvasState.layerType, point);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        if (resizeStartLayerRef.current && selectedLayerIds.length > 0) {
          const layerId = selectedLayerIds[0];
          const finalLayer = getLayerById(layerId);
          if (finalLayer) {
            addAction({
              type: "UPDATE",
              before: resizeStartLayerRef.current,
              after: finalLayer,
            });
          }
          resizeStartLayerRef.current = null;
        }
      } else if (
        canvasState.mode === CanvasMode.Translating &&
        hasDraggedRef.current
      ) {
        if (translateStartLayersRef.current.length > 0) {
          const selectedLayers = getSelectedLayers();
          translateStartLayersRef.current.forEach((beforeLayer) => {
            const afterLayer = selectedLayers.find(
              (l) => l.id === beforeLayer.id
            );
            if (afterLayer) {
              addAction({
                type: "UPDATE",
                before: beforeLayer,
                after: afterLayer,
              });
            }
          });
          translateStartLayersRef.current = [];
        }
      }

      if (
        canvasState.mode === CanvasMode.Translating &&
        !hasDraggedRef.current
      ) {
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

      // Reset drag tracking
      dragStartPointRef.current = null;
      hasDraggedRef.current = false;
      setCanvasState({ mode: CanvasMode.None });
    },
    [
      camera,
      canvasState,
      insertLayer,
      inserPath,
      user,
      selectedLayerIds,
      getLayerById,
      getSelectedLayers,
      addAction,
    ]
  );

  //resize selector click handler
  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      setCanvasState({ mode: CanvasMode.Resizing, corner, initialBounds });
    },
    []
  );

  // undo handler
  const handleUndo = useCallback(async () => {
    const state = useBoardStore.getState();
    if (state.undoStack.length === 0) return;

    const action = state.undoStack[state.undoStack.length - 1];
    const previousLayers = [...layers];

    await undo(layers, async (updatedLayers) => {
      const sortedLayers = [...updatedLayers].sort(
        (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
      );
      setLayers(sortedLayers);

      try {
        if (action.type === "ADD") {
          const { error } = await supabase
            .from("layers")
            .delete()
            .eq("id", action.layer.id);
          if (error) throw error;
        } else if (action.type === "UPDATE") {
          const metadata =
            "points" in action.before && action.before.points
              ? { points: action.before.points }
              : null;

          const { error } = await supabase
            .from("layers")
            .update({
              x: action.before.x,
              y: action.before.y,
              width: action.before.width,
              height: action.before.height,
              fill: action.before.fill,
              value:
                "value" in action.before ? action.before.value || null : null,
              z_index: action.before.zIndex,
              metadata: metadata,
            })
            .eq("id", action.before.id);

          if (error) throw error;
        } else if (action.type === "DELETE") {
          const layer = action.layer;
          const metadata =
            "points" in layer && layer.points ? { points: layer.points } : null;

          const { error } = await supabase.from("layers").insert({
            id: layer.id,
            board_id: layer.boardId,
            author_id: layer.authorId,
            author_type: layer.authorType,
            layer_type:
              layer.type === 0
                ? "Rectangle"
                : layer.type === 1
                ? "Ellipse"
                : layer.type === 2
                ? "Path"
                : layer.type === 3
                ? "Text"
                : "Note",
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
            fill: layer.fill,
            value: "value" in layer ? layer.value || null : null,
            z_index: layer.zIndex,
            metadata: metadata,
          });

          if (error) throw error;
        }
      } catch (error) {
        console.error("Failed to sync undo to database:", error);
        toast.error("Failed to undo. Please try again.");
        setLayers(previousLayers);
        useBoardStore.setState((state) => ({
          undoStack: [...state.undoStack, action],
          redoStack: state.redoStack.slice(0, -1),
        }));
      }
    });
  }, [undo, layers, supabase]);

  // redo handler
  const handleRedo = useCallback(async () => {
    const state = useBoardStore.getState();
    if (state.redoStack.length === 0) return;

    const action = state.redoStack[state.redoStack.length - 1];
    const previousLayers = [...layers];

    await redo(layers, async (updatedLayers) => {
      const sortedLayers = [...updatedLayers].sort(
        (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
      );
      setLayers(sortedLayers);

      try {
        if (action.type === "ADD") {
          const layer = action.layer;
          const metadata =
            "points" in layer && layer.points ? { points: layer.points } : null;

          const { error } = await supabase.from("layers").insert({
            id: layer.id,
            board_id: layer.boardId,
            author_id: layer.authorId,
            author_type: layer.authorType,
            layer_type:
              layer.type === 0
                ? "Rectangle"
                : layer.type === 1
                ? "Ellipse"
                : layer.type === 2
                ? "Path"
                : layer.type === 3
                ? "Text"
                : "Note",
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
            fill: layer.fill,
            value: "value" in layer ? layer.value || null : null,
            z_index: layer.zIndex,
            metadata: metadata,
          });

          if (error) throw error;
        } else if (action.type === "UPDATE") {
          const metadata =
            "points" in action.after && action.after.points
              ? { points: action.after.points }
              : null;

          const { error } = await supabase
            .from("layers")
            .update({
              x: action.after.x,
              y: action.after.y,
              width: action.after.width,
              height: action.after.height,
              fill: action.after.fill,
              value:
                "value" in action.after ? action.after.value || null : null,
              z_index: action.after.zIndex,
              metadata: metadata,
            })
            .eq("id", action.after.id);

          if (error) throw error;
        } else if (action.type === "DELETE") {
          const { error } = await supabase
            .from("layers")
            .delete()
            .eq("id", action.layer.id);
          if (error) throw error;
        }
      } catch (error) {
        console.error("Failed to sync redo to database:", error);
        toast.error("Failed to redo. Please try again.");
        setLayers(previousLayers);
        useBoardStore.setState((state) => ({
          redoStack: [...state.redoStack, action],
          undoStack: state.undoStack.slice(0, -1),
        }));
      }
    });
  }, [redo, layers, supabase]);

  useDisableScrollBounce();

  // undo/redo shortcuts effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.contentEditable === "true" ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (canUndo) {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        if (canRedo) {
          handleRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, canUndo, canRedo]);

  return (
    <main className="h-screen w-full relative bg-neutral-100 touch-none">
      <Info board={board} />
      <Participants presentUsers={presentUsers} />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        undo={handleUndo}
        canUndo={canUndo}
        redo={handleRedo}
        canRedo={canRedo}
      />
      <SelectionTools
        camera={camera}
        getLayerById={getLayerById}
        setLayers={setLayers}
        setLastUsedColor={setLastUsedColor}
        lastUsedColor={lastUsedColor}
        selectedLayers={getSelectedLayers()}
        selectionBounds={useSelectionBounds(getSelectedLayers())}
        addAction={addAction}
      />
      <svg
        className="h-[100vh] w-[100vw]"
        onPointerMove={onPointerMove}
        onWheel={onWheel}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerup}
        onPointerDown={handleCanvasClick}
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
              setLayers={setLayers}
              addAction={addAction}
            />
          ))}
          <SelectionBox
            selectedLayers={getSelectedLayers()}
            bounds={useSelectionBounds(getSelectedLayers())}
            onResizeHandlePointerDown={onResizeHandlePointerDown}
          />
          {canvasState.mode === CanvasMode.SelectionNet &&
            canvasState.current != null && (
              <rect
                className="fill-blue-500/5 stroke-blue-500 stroke-1"
                strokeDasharray="5,5"
                x={Math.min(canvasState.origin.x, canvasState.current.x)}
                y={Math.min(canvasState.origin.y, canvasState.current.y)}
                width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                height={Math.abs(canvasState.origin.y - canvasState.current.y)}
              />
            )}

          {/* Draft path while drawing */}
          {pencilDraft.length > 0 && canvasState.mode === CanvasMode.Pencil && (
            <Path
              x={0}
              y={0}
              points={pencilDraft}
              fill={colorToCss(lastUsedColor)}
              selectedByUserIds={[]}
              onPointerDown={() => {}}
            />
          )}

          <CursorsPresence cursors={cursors} currentUserId={user?.id} />
        </g>
      </svg>
    </main>
  );
};

export default Canvas;
