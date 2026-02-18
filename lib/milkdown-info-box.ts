/**
 * Milkdown custom node: info-box (:::info, :::warning, :::success, :::error).
 * Renders as editable div.info-box.info-box-{kind}, round-trips to/from markdown.
 */
import type { Ctx, MilkdownPlugin } from "@milkdown/ctx";
import { createTimer } from "@milkdown/ctx";
import {
  remarkPluginsCtx,
  remarkCtx,
  commandsCtx,
  SchemaReady,
  serializerTimerCtx,
  schemaTimerCtx,
  InitReady,
} from "@milkdown/kit/core";
import {
  addBlockTypeCommand,
  clearTextInCurrentBlockCommand,
  paragraphSchema,
} from "@milkdown/kit/preset/commonmark";
import { blockConfig } from "@milkdown/kit/plugin/block";
import { InputRule } from "@milkdown/prose/inputrules";
import { TextSelection } from "@milkdown/prose/state";
import { $inputRule, $nodeAttr, $nodeSchema } from "@milkdown/utils";
import remarkDirective from "remark-directive";
import { directiveToMarkdown } from "mdast-util-directive";
import { visit } from "unist-util-visit";

/** Timer: must complete after schema so serializer gets remark with directive stringify extension. */
const RemarkDirectiveStringifyReady = createTimer("RemarkDirectiveStringifyReady");

/** Timer: schema must wait for this so remark-directive is in remarkPluginsCtx before the parser is built. */
const RemarkDirectiveParseReady = createTimer("RemarkDirectiveParseReady");

/**
 * Remark plugin: make directive-heavy trees parseable by Milkdown.
 * - textDirective / leafDirective have no parser → convert to paragraph(text)
 * - block-level "html" as direct child of containerDirective is parsed as inline html
 *   by commonmark, which breaks infoBox (content: block+) → wrap in paragraph(text)
 * Unified plugin: () => (tree) => void
 */
function remarkDirectiveTransformForMilkdown(): (options?: unknown) => (tree: import("mdast").Root) => void {
  const transform = (tree: import("mdast").Root) => {
    visit(tree, (node, index, parent) => {
      if (index == null || !parent) return;
      const p = parent as { type: string; children: unknown[] };
      const n = node as { type: string; name?: string; value?: string; children?: unknown[] };

      // Unsupported directive types: need parseable node. Times like 19:00 are parsed as
      // textDirective (":00" starts a directive), which would become a paragraph and then
      // "Cannot create node for paragraph" (paragraph can't contain block nodes).
      if (n.type === "textDirective" || n.type === "leafDirective") {
        const label = typeof n.name === "string" ? n.name : "";
        const isInsidePhrasing =
          p.type === "paragraph" ||
          p.type === "heading" ||
          p.type === "strong" ||
          p.type === "emphasis" ||
          p.type === "link" ||
          p.type === "listItem";
        if (isInsidePhrasing) {
          // Keep inline: replace with text so "19:00" stays one paragraph (e.g. "19" + ":00..."
          p.children[index] = { type: "text", value: ":" + label } as unknown;
        } else {
          p.children[index] = {
            type: "paragraph",
            children: [{ type: "text", value: ":" + label }],
          } as unknown;
        }
        return;
      }

      // Block html as direct child of containerDirective: commonmark treats html as inline,
      // so it would be pushed into infoBox as inline and break "block+". Wrap as paragraph(text).
      if (p.type === "containerDirective" && n.type === "html") {
        const value = typeof n.value === "string" ? n.value : "";
        p.children[index] = {
          type: "paragraph",
          children: [{ type: "text", value }],
        } as unknown;
      }
    });
  };
  return () => transform;
}

const INFO_BOX_KINDS = ["info", "warning", "success", "error"] as const;
export type InfoBoxKind = (typeof INFO_BOX_KINDS)[number];

function isContainerDirective(
  node: unknown
): node is { type: "containerDirective"; name: string; children?: unknown[] } {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "containerDirective" &&
    typeof (node as { name?: string }).name === "string"
  );
}

export const infoBoxAttr = $nodeAttr("infoBox");

export const infoBoxSchema = $nodeSchema("infoBox", (ctx) => ({
  content: "block+",
  group: "block",
  defining: true,
  attrs: {
    kind: {
      default: "info" as InfoBoxKind,
    },
  },
  parseDOM: [
    {
      tag: "div[data-info-box]",
      getAttrs: (dom) => {
        const el = dom as HTMLElement;
        const kind = (el.getAttribute("data-kind") || "info") as InfoBoxKind;
        return { kind: INFO_BOX_KINDS.includes(kind) ? kind : "info" };
      },
    },
  ],
  toDOM: (node) => [
    "div",
    {
      class: `info-box info-box-${node.attrs.kind}`,
      "data-info-box": "",
      "data-kind": node.attrs.kind,
    },
    0,
  ],
  parseMarkdown: {
    match: (node) =>
      isContainerDirective(node) &&
      INFO_BOX_KINDS.includes((node.name || "").toLowerCase() as InfoBoxKind),
    runner: (state, node, type) => {
      const name = isContainerDirective(node) ? node.name : "info";
      const kind = String(name || "info").toLowerCase() as InfoBoxKind;
      const safeKind = INFO_BOX_KINDS.includes(kind) ? kind : "info";
      state.openNode(type, { kind: safeKind });
      if (node.children?.length) {
        state.next(node.children);
      }
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === "infoBox",
    runner: (state, node) => {
      const kind = node.attrs.kind || "info";
      state.openNode("containerDirective", undefined, { name: kind });
      state.next(node.content);
      state.closeNode();
    },
  },
}));

/**
 * Ensures remark can stringify containerDirective (:::info ... :::).
 * Schema plugin builds the remark processor; init then overwrites remarkCtx.
 * We run after SchemaReady, set toMarkdownExtensions on that processor, and
 * make the serializer wait for us so getMarkdown() never sees unknown node.
 */
function remarkDirectiveStringify(): MilkdownPlugin {
  return (ctx: Ctx) => {
    ctx.update(serializerTimerCtx, (timers) => [
      ...timers,
      RemarkDirectiveStringifyReady,
    ]);
    ctx.record(RemarkDirectiveStringifyReady);

    return async () => {
      await ctx.wait(SchemaReady);
      const processor = ctx.get(remarkCtx);
      const existing =
        (processor as { data: (k: string) => unknown[] }).data(
          "toMarkdownExtensions"
        ) || [];
      const directiveExt = directiveToMarkdown();
      if (!existing.includes(directiveExt)) {
        (processor as { data: (key: string, value: unknown) => void }).data(
          "toMarkdownExtensions",
          [...existing, directiveExt]
        );
      }
      ctx.set(remarkCtx, processor);
      ctx.done(RemarkDirectiveStringifyReady);
      return () => {
        ctx.clearTimer(RemarkDirectiveStringifyReady);
      };
    };
  };
}

/** Input rule: typing :::info at start of line converts to an info box. */
const infoBoxInputRule = $inputRule((ctx) =>
  new InputRule(/^:::info\s*$/, (state, _match, start, end) => {
    const $start = state.doc.resolve(start);
    const blockStart = $start.start();
    const blockEnd = $start.end();
    const infoBoxType = infoBoxSchema.type(ctx);
    const paragraphType = paragraphSchema.type(ctx);
    const emptyParagraph = paragraphType.create();
    const node = infoBoxType.createAndFill(
      { kind: "info" },
      [emptyParagraph],
      undefined
    );
    if (!node) return null;
    const tr = state.tr.replaceWith(blockStart, blockEnd, node);
    const posInside = blockStart + 2;
    const sel = TextSelection.create(
      tr.doc,
      Math.min(posInside + 1, tr.doc.content.size)
    );
    return tr.setSelection(sel).scrollIntoView();
  })
);

/** Hide block handle on infoBox (like blockquote). */
function infoBoxBlockHandleFilter(): MilkdownPlugin {
  return (ctx: Ctx) => {
    ctx.update(blockConfig.key, (prev) => {
      const prevFilter = prev?.filterNodes;
      return {
        filterNodes: (pos, node) => {
          if (node.type.name === "infoBox") return false;
          return prevFilter ? prevFilter(pos, node) : true;
        },
      };
    });
    return () => {};
  };
}

/**
 * Add remark-directive to the parser so :::info ... ::: in initial markdown is parsed.
 * We run async after InitReady and make the schema wait for us, so when the schema
 * builds the remark processor it already has remark-directive (same pattern as $remark).
 */
const directiveTransformPlugin = remarkDirectiveTransformForMilkdown();

function remarkDirectiveParse(): MilkdownPlugin {
  const directiveEntry = { plugin: remarkDirective, options: {} as Record<string, unknown> };
  const transformEntry = {
    plugin: directiveTransformPlugin as import("@milkdown/transformer").RemarkPlugin["plugin"],
    options: {} as Record<string, unknown>,
  };
  return (ctx: Ctx) => {
    ctx.update(schemaTimerCtx, (timers) => [...timers, RemarkDirectiveParseReady]);
    ctx.record(RemarkDirectiveParseReady);
    return async () => {
      await ctx.wait(InitReady);
      ctx.update(remarkPluginsCtx, (plugs) => [
        ...plugs,
        directiveEntry,
        transformEntry,
      ]);
      ctx.done(RemarkDirectiveParseReady);
      return () => {
        ctx.update(remarkPluginsCtx, (plugs) =>
          plugs.filter(
            (p) => p.plugin !== remarkDirective && p.plugin !== directiveTransformPlugin
          )
        );
        ctx.clearTimer(RemarkDirectiveParseReady);
      };
    };
  };
}

/** Plugins to register: remark directive parse + stringify + infoBox node + input rule. */
function infoBoxPlugins(): MilkdownPlugin[] {
  return [
    remarkDirectiveParse(),
    remarkDirectiveStringify(),
    infoBoxBlockHandleFilter(),
    infoBoxSchema.ctx, // inject "infoBox" slice so node plugin can ctx.get(schemaCtx.key)
    infoBoxAttr,
    infoBoxSchema.node,
    infoBoxInputRule,
  ];
}

/** Slash menu: label and icon per kind. Icons use fill-only paths so they survive DOMPurify (stroke is often stripped). */
const INFO_BOX_MENU: Record<
  InfoBoxKind,
  { label: string; icon: string }
> = {
  info: {
    label: "資訊框 (Info)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
  },
  warning: {
    label: "警告框 (Warning)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V9h2v5z"/></svg>`,
  },
  success: {
    label: "成功框 (Success)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
  },
  error: {
    label: "錯誤框 (Error)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>`,
  },
};

/** Crepe feature: add info-box node. Use with addFeature(infoBoxFeature). */
export function infoBoxFeature(
  editor: InstanceType<typeof import("@milkdown/kit/core").Editor>,
  _config?: unknown
): void {
  infoBoxPlugins().forEach((plugin) => editor.use(plugin));
}

/** Create slash menu item for one info-box kind. */
function infoBoxSlashItemForKind(kind: InfoBoxKind): {
  label: string;
  icon: string;
  onRun: (ctx: Ctx) => void;
} {
  const { label, icon } = INFO_BOX_MENU[kind];
  return {
    label,
    icon,
    onRun: (ctx2: Ctx) => {
      const commands = ctx2.get(commandsCtx);
      commands.call(clearTextInCurrentBlockCommand.key);
      const infoBoxType = infoBoxSchema.type(ctx2);
      const paragraphType = paragraphSchema.type(ctx2);
      const emptyParagraph = paragraphType.create();
      const node = infoBoxType.createAndFill(
        { kind },
        [emptyParagraph],
        undefined
      );
      if (node) {
        commands.call(addBlockTypeCommand.key, { nodeType: node });
      }
    },
  };
}

/** All four info-box slash menu items (info, warning, success, error). */
export function infoBoxSlashItems(): Array<{
  id: string;
  label: string;
  icon: string;
  onRun: (ctx: Ctx) => void;
}> {
  return INFO_BOX_KINDS.map((kind) => ({
    id: `infoBox-${kind}`,
    ...infoBoxSlashItemForKind(kind),
  }));
}

/** Run insert info-box in editor context (for toolbar). */
export function runInsertInfoBox(ctx: Ctx, kind: InfoBoxKind): void {
  const commands = ctx.get(commandsCtx);
  commands.call(clearTextInCurrentBlockCommand.key);
  const infoBoxType = infoBoxSchema.type(ctx);
  const paragraphType = paragraphSchema.type(ctx);
  const emptyParagraph = paragraphType.create();
  const node = infoBoxType.createAndFill(
    { kind },
    [emptyParagraph],
    undefined
  );
  if (node) {
    commands.call(addBlockTypeCommand.key, { nodeType: node });
  }
}
