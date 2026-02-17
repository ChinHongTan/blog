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

/** Timer: must complete after schema so serializer gets remark with directive stringify extension. */
const RemarkDirectiveStringifyReady = createTimer("RemarkDirectiveStringifyReady");

/** Timer: schema must wait for this so remark-directive is in remarkPluginsCtx before the parser is built. */
const RemarkDirectiveParseReady = createTimer("RemarkDirectiveParseReady");

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
function remarkDirectiveParse(): MilkdownPlugin {
  const remarkPluginEntry = { plugin: remarkDirective, options: {} as Record<string, unknown> };
  return (ctx: Ctx) => {
    ctx.update(schemaTimerCtx, (timers) => [...timers, RemarkDirectiveParseReady]);
    ctx.record(RemarkDirectiveParseReady);
    return async () => {
      await ctx.wait(InitReady);
      ctx.update(remarkPluginsCtx, (plugs) => [...plugs, remarkPluginEntry]);
      ctx.done(RemarkDirectiveParseReady);
      return () => {
        ctx.update(remarkPluginsCtx, (plugs) =>
          plugs.filter((p) => p.plugin !== remarkDirective)
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

/** Slash menu: label and icon per kind. */
const INFO_BOX_MENU: Record<
  InfoBoxKind,
  { label: string; icon: string }
> = {
  info: {
    label: "資訊框 (Info)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16v-4"/><path d="M12 8h.01"/><circle cx="12" cy="12" r="10"/></svg>`,
  },
  warning: {
    label: "警告框 (Warning)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2"/><path d="M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`,
  },
  success: {
    label: "成功框 (Success)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  },
  error: {
    label: "錯誤框 (Error)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
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
