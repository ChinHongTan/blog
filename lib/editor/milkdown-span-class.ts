/**
 * Milkdown custom mark: span with class (e.g. [text]{.red} for coloured labels).
 * Renders as <span class="...">, round-trips to/from markdown as [content]{.className}.
 * Matches rehype-span-attributes pattern so blog pipeline keeps working.
 * 
 * Enforces only one spanClass mark per node with merged classes:
 * - Text colors (text-*), background colors (bg-*), and highlights are kept separate
 * - Applying a class toggles it (removes if present, adds if absent within its category)
 */
import type { Ctx, MilkdownPlugin } from "@milkdown/ctx";
import { createTimer } from "@milkdown/ctx";
import { initTimerCtx, remarkPluginsCtx, remarkStringifyOptionsCtx } from "@milkdown/kit/core";
import { $command, $markSchema } from "@milkdown/utils";
import { visit, SKIP } from "unist-util-visit";

const SPAN_CLASS_MARK_ID = "spanClass";

/** Timer so init waits for our stringify handler before building remark. */
const SpanClassStringifyReady = createTimer("SpanClassStringifyReady");

/** Pattern matching [text]{.className} — same as rehype-span-attributes. */
const PATTERN = /\[([^\]]*)\]\s*\{((?:\s*\.[a-z][a-z0-9-]*)+)\}/g;

/**
 * Categorize a class into: text color, background color, or highlight.
 * - text-* classes are text colors
 * - bg-* classes are background colors
 * - everything else is a highlight
 */
function classifyClass(className: string): "textColor" | "bgColor" | "highlight" {
  if (className.startsWith("text-")) return "textColor";
  if (className.startsWith("bg-")) return "bgColor";
  if (className === "underline" || className === "highlight") return "highlight";
  return "textColor"; // fallback to text color if just red-3 etc.
}

/**
 * Parse a span class attribute (space-separated classes) into an array.
 */
function parseMarkClasses(classAttr: string): string[] {
  return classAttr.split(/\s+/).filter((c) => c.length > 0);
}

/**
 * Merge classes, toggling the newClass and keeping categories separate.
 */
function mergeClasses(existingClasses: string[], newClass: string): string[] {
  const existing = parseMarkClasses(existingClasses.join(" "));
  const newCategory = classifyClass(newClass);

  const kept = existing.filter((c) => classifyClass(c) !== newCategory);
  const hasNewClass = existing.includes(newClass);

  if (hasNewClass) {
    return kept;
  } else {
    return [...kept, newClass];
  }
}

/** Extract class names from regex match */
function extractClassNames(classSection: string): string {
  return classSection
    .split(/\s+/)
    .map((c) => c.replace(/^\./, ""))
    .filter((c) => c.length > 0)
    .join(" ");
}

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
      const n = node as {
        type: string;
        className?: string;
        data?: { className?: string };
        children?: unknown[];
      };
      const className = n.className ?? n.data?.className ?? "red";
      state.openMark(markType, { class: className });
      state.next((n.children ?? []) as unknown as import("@milkdown/transformer").MarkdownNode[]);
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
    const classes = extractClassNames(m[2]);
    parts.push({
      type: "spanClass",
      className: classes,
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
        return [SKIP, index + replacement.length];
      }
    });
  };
}

/** Add remark parse plugin and stringify handler for spanClass. Init must wait for our handler. */
function spanClassRemarkPlugin(): MilkdownPlugin {
  const parsePlugin = remarkSpanClassParse();
  const remarkEntry = {
    plugin: parsePlugin as unknown as import("@milkdown/transformer").RemarkPlugin["plugin"],
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
          const classMarkup = className
            .split(/\s+/)
            .filter((c) => c.length > 0)
            .map((c) => `.${c}`)
            .join(" ");
          return `[${inner}]{${classMarkup}}`;
        },
      },
    }));
    return async () => {
      ctx.done(SpanClassStringifyReady);
      return () => {
        ctx.update(remarkPluginsCtx, (plugs) => plugs.filter((p) => p !== remarkEntry));
        ctx.update(remarkStringifyOptionsCtx, (opts) => {
          const handlers = (opts.handlers ?? {}) as Record<string, unknown>;
          const { spanClass: _, ...rest } = handlers;
          return { ...opts, handlers: rest };
        });
        ctx.clearTimer(SpanClassStringifyReady);
      };
    };
  };
}

/** Command key to apply/toggle spanClass mark with given class. */
export const applySpanClassCommand = $command("ApplySpanClass", (ctx) => (className: string = "red") => (state, dispatch) => {
  const { empty, from, to } = state.selection;
  const markType = spanClassSchema.type(ctx);

  if (empty) {
    if (dispatch) {
      let tr = state.tr;
      const marks = state.storedMarks || state.selection.$from.marks();
      const spanClassMark = marks.find((m) => m.type === markType);

      if (spanClassMark) {
        // Mark exists, toggle the class within it
        const newClasses = mergeClasses([spanClassMark.attrs.class], className).join(" ");
        tr = tr.removeStoredMark(spanClassMark);
        if (newClasses.length > 0) {
          tr = tr.addStoredMark(markType.create({ class: newClasses }));
        }
      } else {
        // No spanClass mark yet, create one with the class
        tr = tr.addStoredMark(markType.create({ class: className }));
      }
      dispatch(tr);
    }
    return true;
  }

  if (dispatch) {
    let tr = state.tr;
    let hasExistingMark = false;

    // Check if spanClass mark exists in selection
    state.doc.nodesBetween(from, to, (node) => {
      const spanClassMark = node.marks.find((m) => m.type === markType);
      if (spanClassMark) {
        hasExistingMark = true;
      }
    });

    if (hasExistingMark) {
      // Mark exists in selection, toggle class within it
      state.doc.nodesBetween(from, to, (node, pos) => {
        const spanClassMark = node.marks.find((m) => m.type === markType);
        if (spanClassMark) {
          const newClasses = mergeClasses([spanClassMark.attrs.class], className).join(" ");
          tr = tr.removeMark(Math.max(pos, from), Math.min(pos + node.nodeSize, to), spanClassMark);
          if (newClasses.length > 0) {
            tr = tr.addMark(Math.max(pos, from), Math.min(pos + node.nodeSize, to), 
              markType.create({ class: newClasses }));
          }
        }
      });
    } else {
      // No mark yet, create one with the class
      tr = tr.addMark(from, to, markType.create({ class: className }));
    }

    dispatch(tr);
  }
  return true;
});

/** Command to remove spanClass mark from the current selection. */
export const removeSpanClassCommand = $command("RemoveSpanClass", (ctx) => (className?: string) => (state, dispatch) => {
  const { empty, from, to } = state.selection;
  const markType = spanClassSchema.type(ctx);

  if (empty) {
    if (dispatch) {
      let tr = state.tr;
      const marks = state.storedMarks || state.selection.$from.marks();
      const spanClassMark = marks.find((m) => m.type === markType);

      if (spanClassMark) {
        if (className) {
          // Remove specific class from the mark
          const newClasses = spanClassMark.attrs.class
            .split(/\s+/)
            .filter((c: string) => c !== className)
            .join(" ");

          tr = tr.removeStoredMark(spanClassMark);
          if (newClasses.length > 0) {
            tr = tr.addStoredMark(markType.create({ class: newClasses }));
          }
        } else {
          // Remove entire mark
          tr = tr.removeStoredMark(spanClassMark);
        }
      }
      dispatch(tr);
    }
    return true;
  }

  if (dispatch) {
    let tr = state.tr;
    state.doc.nodesBetween(from, to, (node, pos) => {
      const spanClassMark = node.marks.find((m) => m.type === markType);
      if (spanClassMark) {
        const markFrom = Math.max(pos, from);
        const markTo = Math.min(pos + node.nodeSize, to);

        if (className) {
          // Remove specific class from the mark
          const newClasses = spanClassMark.attrs.class
            .split(/\s+/)
            .filter((c: string) => c !== className)
            .join(" ");

          tr = tr.removeMark(markFrom, markTo, spanClassMark);
          if (newClasses.length > 0) {
            tr = tr.addMark(markFrom, markTo, markType.create({ class: newClasses }));
          }
        } else {
          // Remove entire mark
          tr = tr.removeMark(markFrom, markTo, spanClassMark);
        }
      }
    });
    dispatch(tr);
  }
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
