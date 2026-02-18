/**
 * Milkdown plugin: Obsidian-style markdown reveal.
 * When the editor has focus and the cursor/selection is in a block,
 * show that block's markdown in grey above it. Hide when focus leaves.
 */
import type { EditorView } from "@milkdown/prose/view";
import type { Serializer } from "@milkdown/transformer";
import type { Fragment, Schema } from "@milkdown/prose/model";
import { SerializerReady, schemaCtx, serializerCtx } from "@milkdown/kit/core";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";
import { $proseAsync } from "@milkdown/kit/utils";

const REVEAL_PLUGIN_KEY = new PluginKey("MILKDOWN_MARKDOWN_REVEAL");

/** Table node type: if cursor is inside a table, skip markdown reveal (renders weirdly). */
const TABLE_NODE_NAME = "table";

function isInsideTable($from: { depth: number; node: (d: number) => { type: { name: string } } }): boolean {
  for (let d = 1; d <= $from.depth; d++) {
    if ($from.node(d).type.name === TABLE_NODE_NAME) return true;
  }
  return false;
}

function getBlockRange(
  view: EditorView
): { from: number; to: number } | null {
  const { state } = view;
  const { selection } = state;
  const $from = selection.$from;
  if (isInsideTable($from)) return null;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.isBlock) {
      return {
        from: $from.before(d),
        to: $from.after(d),
      };
    }
  }
  return null;
}

function serializeBlockRange(
  schema: Schema,
  serializer: Serializer,
  state: { doc: { slice: (from: number, to: number, b: boolean) => { content: Fragment } } },
  from: number,
  to: number
): string {
  try {
    const slice = state.doc.slice(from, to, true);
    const doc = schema.topNodeType.createAndFill(null, slice.content);
    if (!doc) return "";
    return serializer(doc);
  } catch {
    return "";
  }
}

export const markdownRevealPlugin = $proseAsync(
  async (ctx) => {
    await ctx.wait(SerializerReady);
    const schema = ctx.get(schemaCtx);
    const serializer = ctx.get(serializerCtx);

    let editorViewRef: EditorView | null = null;

    return new Plugin({
      key: REVEAL_PLUGIN_KEY,
      view: (view) => {
        editorViewRef = view;
        return {
          update() {},
          destroy() {
            editorViewRef = null;
          },
        };
      },
      props: {
        decorations: (state) => {
          if (!editorViewRef || !schema || !serializer) {
            return null;
          }
          if (document.activeElement !== editorViewRef.dom) {
            return null;
          }
          const range = getBlockRange(editorViewRef);
          if (!range) return null;
          const { from } = range;
          const markdown = serializeBlockRange(
            schema,
            serializer,
            state,
            range.from,
            range.to
          );
          if (!markdown.trim()) return null;

          const el = document.createElement("div");
          el.className = "milkdown-markdown-reveal";
          el.setAttribute("contenteditable", "false");
          el.textContent = markdown;

          return DecorationSet.create(state.doc, [
            Decoration.widget(from, el, { side: -1 }),
          ]);
        },
      },
    });
  },
  "MarkdownRevealReady"
);
