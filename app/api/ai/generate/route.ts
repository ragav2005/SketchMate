import { NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { DBLayer } from "@/types/canvas";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const aiInstructions = `You are a whiteboard AI. Generate JSON action plans for layer operations.

LAYER SCHEMA:
{id:string, layer_type:"Rectangle"|"Ellipse"|"Path"|"Text"|"Note", x:number, y:number, height:number, width:number, fill:{r:0-255,g:0-255,b:0-255}, value:string|null, z_index:number}

For Path layers (freehand drawings):
- layer_type: "Path"
- metadata: {points: [[x1,y1,pressure1], [x2,y2,pressure2], ...]} (array of [x,y,pressure] triplets)
- x,y: top-left corner of bounding box
- width,height: bounding box dimensions
- Points are relative to canvas origin (not layer x,y)

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{"actions":[{"type":"INSERT","layer":{...}},{"type":"UPDATE","id":"...","payload":{...}},{"type":"DELETE","id":"..."}]}

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown code blocks, no explanations.
2. For INSERT: DO NOT include "id" or "z_index" fields - server generates them
3. For UPDATE/DELETE: Always include the "id" field to identify which layer
4. Colors: red={r:255,g:0,b:0}, blue={r:0,g:0,b:255}, green={r:0,g:255,b:0}, yellow={r:255,g:255,b:0}
5. Sizes: rectangles/ellipses ~150-250px, notes ~200x200px, text ~50px height, paths ~100-300px
6. Positions: spread items 50-100px apart, use x:100-700, y:100-500
7. Keep it simple: Break complex tasks into max 5-10 actions
8. Match layers by layer_type AND fill color for precision
9. For Path layers: Generate smooth curved paths with 10-20 points, pressure 0.5
10. Empty array if nothing to do: {"actions":[]}

EXAMPLES:
"Make all notes blue" → Find layer_type="Note", UPDATE each with fill={r:0,g:0,b:255}
"Delete red circle" → Find layer_type="Ellipse" with red fill, DELETE it
"Add green rectangle" → INSERT layer_type="Rectangle" with fill={r:0,g:255,b:0} (no id/z_index)
"Draw a blue line" → INSERT layer_type="Path" with metadata.points=[[x1,y1,0.5],[x2,y2,0.5],...] (no id/z_index)`;

type AIInsertAction = {
  type: "INSERT";
  layer: {
    layer_type: "Rectangle" | "Ellipse" | "Path" | "Note" | "Text";
    x: number;
    y: number;
    height: number;
    width: number;
    fill: { r: number; g: number; b: number };
    value?: string | null;
    metadata?: Record<string, unknown> | null;
  };
};

type AIUpdateAction = {
  type: "UPDATE";
  id: string;
  payload: {
    x?: number;
    y?: number;
    height?: number;
    width?: number;
    fill?: { r: number; g: number; b: number };
    value?: string;
  };
};

type AIDeleteAction = {
  type: "DELETE";
  id: string;
};

type AIAction = AIInsertAction | AIUpdateAction | AIDeleteAction;

type AIActionPlan = {
  actions: AIAction[];
};

// main post handler
export async function POST(req: Request) {
  try {
    const { prompt, boardId } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Valid prompt is required" },
        { status: 400 }
      );
    }

    if (!boardId || typeof boardId !== "string") {
      return NextResponse.json(
        { error: "Valid boardId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // pre-processing data
    const { data: currentLayers, error: fetchError } = await supabase
      .from("layers")
      .select("*")
      .eq("board_id", boardId)
      .order("z_index", { ascending: true });

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch board state" },
        { status: 500 }
      );
    }

    if (!currentLayers) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const simplifiedLayers = currentLayers.map((layer: DBLayer) => ({
      id: layer.id,
      layer_type: layer.layer_type,
      x: Math.round(layer.x),
      y: Math.round(layer.y),
      height: Math.round(layer.height),
      width: Math.round(layer.width),
      fill: layer.fill,
      value: layer.value,
      z_index: layer.z_index,
    }));

    const layersToSend =
      simplifiedLayers.length > 50
        ? simplifiedLayers.slice(-50)
        : simplifiedLayers;

    const maxRetries = 2;
    let lastError: Error | null = null;

    // api request to gemini
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
          ],
        });

        const fullPrompt = `${aiInstructions}

CURRENT BOARD (${layersToSend.length} layers):
${JSON.stringify(layersToSend)}

USER REQUEST: "${prompt}"

JSON RESPONSE:`;

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        console.log("AI Response:", responseText);

        let cleanedJson = responseText.trim();

        if (cleanedJson.includes("```")) {
          cleanedJson = cleanedJson
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
        }

        let braceCount = 0;
        let jsonStart = -1;
        let jsonEnd = -1;

        for (let i = 0; i < cleanedJson.length; i++) {
          if (cleanedJson[i] === "{") {
            if (jsonStart === -1) jsonStart = i;
            braceCount++;
          } else if (cleanedJson[i] === "}") {
            braceCount--;
            if (braceCount === 0 && jsonStart !== -1) {
              jsonEnd = i + 1;
              break;
            }
          }
        }

        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanedJson = cleanedJson.substring(jsonStart, jsonEnd);
        }

        let actionPlan: AIActionPlan;
        try {
          actionPlan = JSON.parse(cleanedJson) as AIActionPlan;

          if (!actionPlan.actions || !Array.isArray(actionPlan.actions)) {
            throw new Error("Missing or invalid actions array");
          }

          actionPlan.actions = actionPlan.actions.map((action) => {
            if (action.type === "INSERT" && "layer" in action) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { id, ...layerWithoutId } = action.layer as Record<
                string,
                unknown
              >;
              return {
                ...action,
                layer: layerWithoutId as typeof action.layer,
              };
            }
            return action;
          });

          if (actionPlan.actions.length === 0) {
            return NextResponse.json(
              {
                message: "No actions needed for this request",
                actionsPerformed: 0,
              },
              { status: 200 }
            );
          }

          const results = {
            inserted: 0,
            updated: 0,
            deleted: 0,
            errors: [] as string[],
          };

          //   db layers updates
          for (const action of actionPlan.actions) {
            try {
              switch (action.type) {
                case "INSERT": {
                  const { layer } = action;

                  const { data: maxZIndexData } = await supabase
                    .from("layers")
                    .select("z_index")
                    .eq("board_id", boardId)
                    .order("z_index", { ascending: false })
                    .limit(1);

                  const maxZIndex =
                    maxZIndexData && maxZIndexData.length > 0
                      ? maxZIndexData[0].z_index
                      : 0;

                  const { error: insertError } = await supabase
                    .from("layers")
                    .insert({
                      board_id: boardId,
                      author_id: user.id,
                      author_type: "ai" as const,
                      layer_type: layer.layer_type,
                      x: layer.x,
                      y: layer.y,
                      height: layer.height,
                      width: layer.width,
                      fill: layer.fill,
                      value: layer.value || null,
                      metadata: layer.metadata || null,
                      z_index: maxZIndex + 1,
                    });

                  if (insertError) {
                    console.error("Insert error:", insertError);
                    results.errors.push(
                      `Failed to insert ${layer.layer_type}: ${insertError.message}`
                    );
                  } else {
                    results.inserted++;
                  }
                  break;
                }

                case "UPDATE": {
                  const { id, payload } = action;

                  const { data: existingLayer } = await supabase
                    .from("layers")
                    .select("id")
                    .eq("id", id)
                    .eq("board_id", boardId)
                    .single();

                  if (!existingLayer) {
                    results.errors.push(
                      `Layer ${id} not found or access denied`
                    );
                    continue;
                  }

                  const { error: updateError } = await supabase
                    .from("layers")
                    .update(payload)
                    .eq("id", id);

                  if (updateError) {
                    console.error("Update error:", updateError);
                    results.errors.push(
                      `Failed to update layer ${id}: ${updateError.message}`
                    );
                  } else {
                    results.updated++;
                  }
                  break;
                }

                case "DELETE": {
                  const { id } = action;

                  const { data: existingLayer } = await supabase
                    .from("layers")
                    .select("id")
                    .eq("id", id)
                    .eq("board_id", boardId)
                    .single();

                  if (!existingLayer) {
                    results.errors.push(
                      `Layer ${id} not found or access denied`
                    );
                    continue;
                  }

                  const { error: deleteError } = await supabase
                    .from("layers")
                    .delete()
                    .eq("id", id);

                  if (deleteError) {
                    console.error("Delete error:", deleteError);
                    results.errors.push(
                      `Failed to delete layer ${id}: ${deleteError.message}`
                    );
                  } else {
                    results.deleted++;
                  }
                  break;
                }

                default:
                  results.errors.push(
                    `Unknown action type: ${(action as { type: string }).type}`
                  );
              }
            } catch (actionError) {
              console.error("Action execution error:", actionError);
              results.errors.push(
                `Error executing action: ${
                  actionError instanceof Error
                    ? actionError.message
                    : "Unknown error"
                }`
              );
            }
          }

          const totalActions =
            results.inserted + results.updated + results.deleted;
          const response = {
            success: totalActions > 0,
            message: `AI actions completed: ${results.inserted} inserted, ${results.updated} updated, ${results.deleted} deleted`,
            actionsPerformed: totalActions,
            details: results,
          };

          if (results.errors.length > 0) {
            console.warn("Some actions failed:", results.errors);
          }

          return NextResponse.json(response, { status: 200 });
        } catch (parseError) {
          console.error(
            `JSON Parse Error (attempt ${attempt + 1}):`,
            parseError
          );
          console.error("Raw response:", responseText);
          console.error("Cleaned JSON:", cleanedJson);

          if (attempt === maxRetries) {
            return NextResponse.json(
              {
                error:
                  "AI returned invalid JSON format. Please try a simpler request.",
                details:
                  parseError instanceof Error
                    ? parseError.message
                    : "Unknown error",
              },
              { status: 500 }
            );
          }
          lastError =
            parseError instanceof Error ? parseError : new Error("Parse error");
          continue;
        }
      } catch (error) {
        console.error(`AI Generation Error (attempt ${attempt + 1}):`, error);
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (
          error instanceof Error &&
          (error.message.includes("overloaded") ||
            error.message.includes("503") ||
            error.message.includes("rate limit"))
        ) {
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
        }

        if (attempt === maxRetries) {
          return NextResponse.json(
            {
              error:
                "AI service temporarily unavailable. Please try again in a moment.",
              details: lastError?.message,
            },
            { status: 503 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        error: "AI Failed to process request after multiple attempts",
        details: lastError?.message,
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("AI Generation Error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Internal server error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
