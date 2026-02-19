/**
 * Milkdown custom mark: span with class (e.g. [text]{.red} for coloured labels).
 * Renders as <span class="...">, round-trips to/from markdown as [content]{.className}.
 * Matches rehype-span-attributes pattern so blog pipeline keeps working.
 */
import type { Ctx, MilkdownPlugin } from "@milkdown/ctx";
import { createTimer } from "@milkdown/ctx";
import { initTimerCtx, remarkPluginsCtx, remarkStringifyOptionsCtx } from "@milkdown/kit/core";
import { $command, $markSchema } from "@milkdown/utils";
import { visit } from "unist-util-visit";

const SPAN_CLASS_MARK_ID = "spanClass";

/** Timer so init waits for our stringify handler before building remark. */
const SpanClassStringifyReady = createTimer("SpanClassStringifyReady");

/** Pattern matching [text]{.className} — same as rehype-span-attributes. */
const PATTERN = /\[([^\]]*)\]\s*\{\.([a-z][a-z0-9-]*)\}/g;

/** Mark schema: inline span with a class attribute (e.g. red, green, orange). */
export const spanClassSchema = $markSchema(SPAN_CLASS_MARK_ID, () => ({
  attrs: {
    class: { default: "red", validate: (v) => typeof v === "string" },
  },
  parseDOM: [
    {
      tag: "span[data-span-class]",
      getAttrs: (dom) => {
        const c = (dom as HTMLElement).getAttribute("data-span-class");
        return c ? { class: c } : false;
      },
    },
  ],
  toDOM: (mark) => [
    "span",
    {
      class: mark.attrs.class,
      "data-span-class": mark.attrs.class,
    },
    0,
  ],
  parseMarkdown: {
    match: (node) => (node as { type: string }).type === "spanClass",
    runner: (state, node, markType) => {
      const n = node as { type: string; className?: string; children?: unknown[] };
      const className = n.className ?? n.data?.className ?? "red";
      state.openMark(markType, { class: className });
      state.next(n.children ?? []);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === SPAN_CLASS_MARK_ID,
    runner: (state, mark) => {
      state.withMark(mark, "spanClass", undefined, {
        className: mark.attrs.class,
      });
    },
  },
}));

function replaceTextWithSpanClassNodes(
  value: string
): { type: string; value?: string; className?: string; children?: unknown[] }[] | null {
  const parts: { type: string; value?: string; className?: string; children?: unknown[] }[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  PATTERN.lastIndex = 0;
  while ((m = PATTERN.exec(value)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: "text", value: value.slice(lastIndex, m.index) });
    }
    parts.push({
      type: "spanClass",
      className: m[2],
      children: [{ type: "text", value: m[1] }],
    });
    lastIndex = PATTERN.lastIndex;
  }
  if (parts.length === 0) return null;
  if (lastIndex < value.length) {
    parts.push({ type: "text", value: value.slice(lastIndex) });
  }
  return parts;
}

/** Remark plugin: turn text matching [x]{.y} into spanClass nodes in mdast. */
function remarkSpanClassParse(): (tree: import("mdast").Root) => void {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (index == null || !parent || !("children" in parent)) return;
      const children = (parent as { children: unknown[] }).children;
      if (!Array.isArray(children)) return;
      const textNode = node as { type?: string; value?: string };
      if (textNode.type !== "text" || typeof textNode.value !== "string") return;

      const replacement = replaceTextWithSpanClassNodes(textNode.value);
      if (replacement) {
        children.splice(index, 1, ...replacement);
      }
    });
  };
}

/** Add remark parse plugin and stringify handler for spanClass. Init must wait for our handler. */
function spanClassRemarkPlugin(): MilkdownPlugin {
  const parsePlugin = remarkSpanClassParse();
  const remarkEntry = {
    plugin: parsePlugin as import("@milkdown/transformer").RemarkPlugin["plugin"],
    options: {} as Record<string, unknown>,
  };
  return (ctx: Ctx) => {
    ctx.update(initTimerCtx, (timers) => [...timers, SpanClassStringifyReady]);
    ctx.record(SpanClassStringifyReady);
    ctx.update(remarkPluginsCtx, (plugs) => [...plugs, remarkEntry]);
    ctx.update(remarkStringifyOptionsCtx, (opts) => ({
      ...opts,
      handlers: {
        ...opts.handlers,
        spanClass: (
          node: { children?: unknown[]; className?: string },
          _parent: unknown,
          state: { containerPhrasing: (node: unknown, info: unknown) => string },
          info: unknown
        ) => {
          const inner = state.containerPhrasing(node, info);
          const className = node.className ?? "red";
          return `[${inner}]{.${className}}`;
        },
      },
    }));
    return async () => {
      ctx.done(SpanClassStringifyReady);
      return () => {
        ctx.update(remarkPluginsCtx, (plugs) => plugs.filter((p) => p !== remarkEntry));
        ctx.update(remarkStringifyOptionsCtx, (opts) => {
          const { spanClass: _, ...rest } = opts.handlers ?? {};
          return { ...opts, handlers: rest };
        });
        ctx.clearTimer(SpanClassStringifyReady);
      };
    };
  };
}

/** Command key to apply spanClass mark with given class. */
export const applySpanClassCommand = $command<string>("ApplySpanClass", (ctx) => (className = "red") => (state, dispatch) => {
  const { from, to } = state.selection;
  const markType = spanClassSchema.type(ctx);
  if (from >= to) return false;
  const tr = state.tr
    .removeMark(from, to, markType)
    .addMark(from, to, markType.create({ class: className }));
  if (dispatch) dispatch(tr);
  return true;
});

/** Command to remove spanClass mark from the current selection. */
export const removeSpanClassCommand = $command("RemoveSpanClass", (ctx) => () => (state, dispatch) => {
  const { from, to } = state.selection;
  const markType = spanClassSchema.type(ctx);
  if (from >= to) return false;
  const tr = state.tr.removeMark(from, to, markType);
  if (dispatch) dispatch(tr);
  return true;
});

/** Plugins to register: mark schema + remark parse/stringify + command. */
export function spanClassPlugins(): MilkdownPlugin[] {
  return [
    spanClassSchema.ctx,
    spanClassSchema.mark,
    spanClassRemarkPlugin(),
    applySpanClassCommand,
    removeSpanClassCommand,
  ];
}

/** Crepe-style feature: add spanClass mark and remark support. */
export function spanClassFeature(
  editor: InstanceType<typeof import("@milkdown/kit/core").Editor>,
  _config?: unknown
): void {
  spanClassPlugins().forEach((plugin) => editor.use(plugin));
}
