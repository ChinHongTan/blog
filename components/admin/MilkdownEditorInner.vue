<template>
  <Milkdown />
</template>

<script setup lang="ts">
import type { Ctx } from "@milkdown/ctx";
import { Milkdown, useEditor } from "@milkdown/vue";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { commandsCtx, editorViewCtx } from "@milkdown/kit/core";
import { imageBlockSchema } from "@milkdown/kit/component/image-block";
import { toggleLinkCommand } from "@milkdown/kit/component/link-tooltip";
import { undoCommand, redoCommand } from "@milkdown/kit/plugin/history";
import {
  addBlockTypeCommand,
  blockquoteSchema,
  bulletListSchema,
  clearTextInCurrentBlockCommand,
  codeBlockSchema,
  emphasisSchema,
  hrSchema,
  isMarkSelectedCommand,
  listItemSchema,
  orderedListSchema,
  selectTextNearPosCommand,
  setBlockTypeCommand,
  strongSchema,
  wrapInBlockTypeCommand,
  wrapInHeadingCommand,
  insertImageCommand,
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
} from "@milkdown/kit/preset/commonmark";
import { createTable, strikethroughSchema, toggleStrikethroughCommand } from "@milkdown/kit/preset/gfm";
import { replaceAll } from "@milkdown/kit/utils";
import { watch, onBeforeUnmount } from "vue";
import {
  infoBoxFeature,
  infoBoxSlashItems,
  runInsertInfoBox,
  type InfoBoxKind,
} from "~/lib/milkdown-info-box";
import {
  spanClassFeature,
  spanClassSchema,
  applySpanClassCommand,
} from "~/lib/milkdown-span-class";
import { markdownRevealPlugin } from "~/lib/milkdown-markdown-reveal";

const props = withDefaults(
  defineProps<{
    defaultValue?: string;
  }>(),
  { defaultValue: "" }
);

export type EditorToolbarApi = {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  undo: () => void;
  redo: () => void;
  wrapInHeading: (level: number) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleStrikethrough: () => void;
  toggleLink: () => void;
  toggleInlineCode: () => void;
  insertImage: (payload?: { src?: string; alt?: string; title?: string }) => void;
  insertImageBlock: () => void;
  getActiveFormatting: () => { bold: boolean; italic: boolean; strikethrough: boolean };
  wrapInBlockquote: () => void;
  insertInfoBox: (kind: InfoBoxKind) => void;
  insertTable: () => void;
  wrapInBulletList: () => void;
  wrapInOrderedList: () => void;
  wrapInTaskList: () => void;
  insertHr: () => void;
  insertCodeBlock: (language?: string) => void;
  insertMathBlock: () => void;
  applyTextColor: (className: string) => void;
  getActiveTextColor: () => string | null;
};

const emit = defineEmits<{
  ready: [api: EditorToolbarApi];
  markdownChange: [markdown: string];
}>();

const zhTWConfig = {
  [CrepeFeature.Placeholder]: { text: "請輸入內容…" },
  [CrepeFeature.CodeMirror]: {
    searchPlaceholder: "搜尋語言",
    noResultText: "無結果",
  },
  [CrepeFeature.BlockEdit]: {
    textGroup: {
      label: "文字",
      text: { label: "內文" },
      h1: { label: "標題 1" },
      h2: { label: "標題 2" },
      h3: { label: "標題 3" },
      h4: { label: "標題 4" },
      h5: { label: "標題 5" },
      h6: { label: "標題 6" },
      quote: { label: "引用" },
      divider: { label: "分隔線" },
    },
    listGroup: {
      label: "列表",
      bulletList: { label: "無序列表" },
      orderedList: { label: "有序列表" },
      taskList: { label: "待辦列表" },
    },
    advancedGroup: {
      label: "進階",
      image: { label: "圖片" },
      codeBlock: { label: "程式碼" },
      table: { label: "表格" },
      math: { label: "數學公式" },
    },
    buildMenu(
      builder: {
        getGroup(
          key: string
        ):
          | {
              addItem(
                id: string,
                item: { label: string; icon: string; onRun: (ctx: unknown) => void }
              ): void;
            }
          | undefined;
      }
    ) {
      const advanced = builder.getGroup("advanced");
      infoBoxSlashItems().forEach((item) =>
        advanced?.addItem(item.id, {
          label: item.label,
          icon: item.icon,
          onRun: (ctx: unknown) => item.onRun(ctx as Ctx),
        })
      );
    },
  },
} as const;

let builderInstance: InstanceType<typeof Crepe> | null = null;

const { loading } = useEditor((root: HTMLElement) => {
  const crepe = new Crepe({
    root,
    defaultValue: props.defaultValue,
    featureConfigs: zhTWConfig,
  });
  crepe.addFeature(infoBoxFeature);
  crepe.addFeature(spanClassFeature);
  crepe.editor.use(markdownRevealPlugin);
  builderInstance = crepe;
  return crepe;
});

function runCommand(fn: (ctx: Ctx) => void) {
  builderInstance?.editor.action(fn);
}

watch(
  loading,
  (v) => {
    if (v === false && builderInstance) {
      builderInstance.on((listener) => {
        listener.markdownUpdated((_ctx, markdown) => {
          emit("markdownChange", markdown);
        });
      });
      const api: EditorToolbarApi = {
        getMarkdown: () => builderInstance!.getMarkdown(),
        setMarkdown: (markdown: string) => {
          if (builderInstance) {
            builderInstance.editor.action(replaceAll(markdown));
          }
        },
        undo: () =>
          runCommand((ctx) => ctx.get(commandsCtx).call(undoCommand.key)),
        redo: () =>
          runCommand((ctx) => ctx.get(commandsCtx).call(redoCommand.key)),
        wrapInHeading: (level: number) =>
          runCommand((ctx) =>
            ctx.get(commandsCtx).call(wrapInHeadingCommand.key, level)
          ),
        toggleBold: () =>
          runCommand((ctx) => ctx.get(commandsCtx).call(toggleStrongCommand.key)),
        toggleItalic: () =>
          runCommand((ctx) =>
            ctx.get(commandsCtx).call(toggleEmphasisCommand.key)
          ),
        toggleStrikethrough: () =>
          runCommand((ctx) =>
            ctx.get(commandsCtx).call(toggleStrikethroughCommand.key)
          ),
        toggleLink: () =>
          runCommand((ctx) =>
            ctx.get(commandsCtx).call(toggleLinkCommand.key)
          ),
        toggleInlineCode: () =>
          runCommand((ctx) =>
            ctx.get(commandsCtx).call(toggleInlineCodeCommand.key)
          ),
        insertImage: (payload) =>
          runCommand((ctx) =>
            ctx.get(commandsCtx).call(insertImageCommand.key, payload ?? {})
          ),
        insertImageBlock: () =>
          runCommand((ctx) => {
            const commands = ctx.get(commandsCtx);
            commands.call(clearTextInCurrentBlockCommand.key);
            commands.call(addBlockTypeCommand.key, {
              nodeType: imageBlockSchema.type(ctx),
            });
          }),
        getActiveFormatting: () => {
          const state = { bold: false, italic: false, strikethrough: false };
          builderInstance?.editor.action((ctx) => {
            const commands = ctx.get(commandsCtx);
            state.bold = !!commands.call(isMarkSelectedCommand.key, strongSchema.type(ctx));
            state.italic = !!commands.call(isMarkSelectedCommand.key, emphasisSchema.type(ctx));
            state.strikethrough = !!commands.call(isMarkSelectedCommand.key, strikethroughSchema.type(ctx));
          });
          return state;
        },
        wrapInBlockquote: () =>
          runCommand((ctx) => {
            const commands = ctx.get(commandsCtx);
            commands.call(clearTextInCurrentBlockCommand.key);
            commands.call(wrapInBlockTypeCommand.key, {
              nodeType: blockquoteSchema.type(ctx),
            });
          }),
        insertInfoBox: (kind: InfoBoxKind) =>
          runCommand((ctx) => runInsertInfoBox(ctx, kind)),
        insertTable: () =>
          runCommand((ctx) => {
            const commands = ctx.get(commandsCtx);
            const view = ctx.get(editorViewCtx);
            commands.call(clearTextInCurrentBlockCommand.key);
            const { from } = view.state.selection;
            commands.call(addBlockTypeCommand.key, {
              nodeType: createTable(ctx, 3, 3),
            });
            commands.call(selectTextNearPosCommand.key, { pos: from });
          }),
        wrapInBulletList: () =>
          runCommand((ctx) => {
            const commands = ctx.get(commandsCtx);
            commands.call(clearTextInCurrentBlockCommand.key);
            commands.call(wrapInBlockTypeCommand.key, {
              nodeType: bulletListSchema.type(ctx),
            });
          }),
        wrapInOrderedList: () =>
          runCommand((ctx) => {
            const commands = ctx.get(commandsCtx);
            commands.call(clearTextInCurrentBlockCommand.key);
            commands.call(wrapInBlockTypeCommand.key, {
              nodeType: orderedListSchema.type(ctx),
            });
          }),
        wrapInTaskList: () =>
          runCommand((ctx) => {
            const commands = ctx.get(commandsCtx);
            commands.call(clearTextInCurrentBlockCommand.key);
            commands.call(wrapInBlockTypeCommand.key, {
              nodeType: listItemSchema.type(ctx),
              attrs: { checked: false },
            });
          }),
        insertHr: () =>
          runCommand((ctx) => {
            const commands = ctx.get(commandsCtx);
            commands.call(clearTextInCurrentBlockCommand.key);
            commands.call(addBlockTypeCommand.key, {
              nodeType: hrSchema.type(ctx),
            });
          }),
        insertCodeBlock: (language) =>
          runCommand((ctx) => {
            const commands = ctx.get(commandsCtx);
            commands.call(clearTextInCurrentBlockCommand.key);
            commands.call(setBlockTypeCommand.key, {
              nodeType: codeBlockSchema.type(ctx),
              ...(language ? { attrs: { language } } : {}),
            });
          }),
        insertMathBlock: () =>
          runCommand((ctx) => {
            const commands = ctx.get(commandsCtx);
            commands.call(clearTextInCurrentBlockCommand.key);
            commands.call(addBlockTypeCommand.key, {
              nodeType: codeBlockSchema.type(ctx),
              attrs: { language: "LaTex" },
            });
          }),
        applyTextColor: (className: string) =>
          runCommand((ctx) =>
            ctx.get(commandsCtx).call(applySpanClassCommand.key, className)
          ),
        getActiveTextColor: () => {
          let result: string | null = null;
          try {
            builderInstance?.editor.action((ctx) => {
              const view = ctx.get(editorViewCtx);
              const { $from } = view.state.selection;
              const spanClassType = spanClassSchema.type(ctx);
              const mark = $from.marks().find((m) => m.type === spanClassType);
              result = (mark?.attrs?.class as string) ?? null;
            });
          } catch {
            result = null;
          }
          return result;
        },
      };
      emit("ready", api);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  builderInstance?.destroy().catch(console.error);
});

defineExpose({
  getMarkdown: () => builderInstance?.getMarkdown() ?? "",
  setMarkdown: (markdown: string) => {
    if (builderInstance) builderInstance.editor.action(replaceAll(markdown));
  },
  undo: () =>
    runCommand((ctx) => ctx.get(commandsCtx).call(undoCommand.key)),
  redo: () =>
    runCommand((ctx) => ctx.get(commandsCtx).call(redoCommand.key)),
  wrapInHeading: (level: number) =>
    runCommand((ctx) =>
      ctx.get(commandsCtx).call(wrapInHeadingCommand.key, level)
    ),
  toggleBold: () =>
    runCommand((ctx) => ctx.get(commandsCtx).call(toggleStrongCommand.key)),
  toggleItalic: () =>
    runCommand((ctx) =>
      ctx.get(commandsCtx).call(toggleEmphasisCommand.key)
    ),
  toggleStrikethrough: () =>
    runCommand((ctx) =>
      ctx.get(commandsCtx).call(toggleStrikethroughCommand.key)
    ),
  toggleLink: () =>
    runCommand((ctx) => ctx.get(commandsCtx).call(toggleLinkCommand.key)),
  toggleInlineCode: () =>
    runCommand((ctx) =>
      ctx.get(commandsCtx).call(toggleInlineCodeCommand.key)
    ),
  insertImage: (payload?: { src?: string; alt?: string; title?: string }) =>
    runCommand((ctx) =>
      ctx.get(commandsCtx).call(insertImageCommand.key, payload ?? {})
    ),
  insertImageBlock: () =>
    runCommand((ctx) => {
      const commands = ctx.get(commandsCtx);
      commands.call(clearTextInCurrentBlockCommand.key);
      commands.call(addBlockTypeCommand.key, {
        nodeType: imageBlockSchema.type(ctx),
      });
    }),
  getActiveFormatting: () => {
    const state = { bold: false, italic: false, strikethrough: false };
    builderInstance?.editor.action((ctx) => {
      const commands = ctx.get(commandsCtx);
      state.bold = !!commands.call(isMarkSelectedCommand.key, strongSchema.type(ctx));
      state.italic = !!commands.call(isMarkSelectedCommand.key, emphasisSchema.type(ctx));
      state.strikethrough = !!commands.call(isMarkSelectedCommand.key, strikethroughSchema.type(ctx));
    });
    return state;
  },
  wrapInBlockquote: () =>
    runCommand((ctx) => {
      const commands = ctx.get(commandsCtx);
      commands.call(clearTextInCurrentBlockCommand.key);
      commands.call(wrapInBlockTypeCommand.key, {
        nodeType: blockquoteSchema.type(ctx),
      });
    }),
  insertInfoBox: (kind: InfoBoxKind) =>
    runCommand((ctx) => runInsertInfoBox(ctx, kind)),
  insertTable: () =>
    runCommand((ctx) => {
      const commands = ctx.get(commandsCtx);
      const view = ctx.get(editorViewCtx);
      commands.call(clearTextInCurrentBlockCommand.key);
      const { from } = view.state.selection;
      commands.call(addBlockTypeCommand.key, {
        nodeType: createTable(ctx, 3, 3),
      });
      commands.call(selectTextNearPosCommand.key, { pos: from });
    }),
  wrapInBulletList: () =>
    runCommand((ctx) => {
      const commands = ctx.get(commandsCtx);
      commands.call(clearTextInCurrentBlockCommand.key);
      commands.call(wrapInBlockTypeCommand.key, {
        nodeType: bulletListSchema.type(ctx),
      });
    }),
  wrapInOrderedList: () =>
    runCommand((ctx) => {
      const commands = ctx.get(commandsCtx);
      commands.call(clearTextInCurrentBlockCommand.key);
      commands.call(wrapInBlockTypeCommand.key, {
        nodeType: orderedListSchema.type(ctx),
      });
    }),
  wrapInTaskList: () =>
    runCommand((ctx) => {
      const commands = ctx.get(commandsCtx);
      commands.call(clearTextInCurrentBlockCommand.key);
      commands.call(wrapInBlockTypeCommand.key, {
        nodeType: listItemSchema.type(ctx),
        attrs: { checked: false },
      });
    }),
  insertHr: () =>
    runCommand((ctx) => {
      const commands = ctx.get(commandsCtx);
      commands.call(clearTextInCurrentBlockCommand.key);
      commands.call(addBlockTypeCommand.key, {
        nodeType: hrSchema.type(ctx),
      });
    }),
  insertCodeBlock: (language?: string) =>
    runCommand((ctx) => {
      const commands = ctx.get(commandsCtx);
      commands.call(clearTextInCurrentBlockCommand.key);
      commands.call(setBlockTypeCommand.key, {
        nodeType: codeBlockSchema.type(ctx),
        ...(language ? { attrs: { language } } : {}),
      });
    }),
  insertMathBlock: () =>
    runCommand((ctx) => {
      const commands = ctx.get(commandsCtx);
      commands.call(clearTextInCurrentBlockCommand.key);
      commands.call(addBlockTypeCommand.key, {
        nodeType: codeBlockSchema.type(ctx),
        attrs: { language: "LaTex" },
      });
    }),
  applyTextColor: (className: string) =>
    runCommand((ctx) =>
      ctx.get(commandsCtx).call(applySpanClassCommand.key, className)
    ),
  getActiveTextColor: () => {
    let result: string | null = null;
    builderInstance?.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { $from } = view.state.selection;
      const spanClassType = spanClassSchema.type(ctx);
      const mark = $from.marks().find((m) => m.type === spanClassType);
      result = (mark?.attrs?.class as string) ?? null;
    });
    return result;
  },
});
</script>
