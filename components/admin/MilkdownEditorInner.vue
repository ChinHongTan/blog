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
  headingSchema,
  hrSchema,
  isMarkSelectedCommand,
  listItemSchema,
  orderedListSchema,
  paragraphSchema,
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
import type { NodeType, Attrs } from "@milkdown/prose/model";
import { liftTarget } from "@milkdown/prose/transform";
import { watch, onBeforeUnmount } from "vue";
import {
  infoBoxFeature,
  infoBoxSchema,
  infoBoxSlashItems,
  type InfoBoxKind,
} from "~/lib/editor/milkdown-info-box";
import {
  spanClassFeature,
  spanClassSchema,
  applySpanClassCommand,
  removeSpanClassCommand,
} from "~/lib/editor/milkdown-span-class";
import {
  customHtmlFeature,
  customHtmlSlashItem,
  runInsertCustomHtml,
} from "~/lib/editor/milkdown-custom-html";

const { uploadImage } = useUploadImage();

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
  getActiveHeadingLevel: () => number;
  setBlockTypeToParagraph: () => void;
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
  insertCustomHtmlBlock: () => void;
  applyTextColor: (className: string) => void;
  removeTextColor: (className?: string) => void;
  getActiveTextColors: () => string[];
};

const emit = defineEmits<{
  ready: [api: EditorToolbarApi];
  markdownChange: [markdown: string];
}>();

async function handleImageUpload(file: File): Promise<string> {
  const path = await uploadImage(file);
  const config = useRuntimeConfig();
  const repo = config.public.githubRepo as string;
  const branch = (config.public.githubBranch as string) || "main";
  return `https://raw.githubusercontent.com/${repo}/${branch}/public${path}`;
}

const zhTWConfig = {
  [CrepeFeature.Placeholder]: { text: "請輸入內容…" },
  [CrepeFeature.ImageBlock]: {
    onUpload: handleImageUpload,
    blockOnUpload: handleImageUpload,
    inlineOnUpload: handleImageUpload,
    blockUploadButton: "上傳圖片",
    inlineUploadButton: "上傳圖片",
    blockUploadPlaceholderText: "點擊上傳或輸入圖片網址",
    inlineUploadPlaceholderText: "點擊上傳或輸入圖片網址",
  },
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
      const chtml = customHtmlSlashItem();
      advanced?.addItem(chtml.id, {
        label: chtml.label,
        icon: chtml.icon,
        onRun: (ctx: unknown) => chtml.onRun(ctx as Ctx),
      });
    },
  },
} as const;

/** Toggle a wrapping block node: if cursor is inside it, lift out; otherwise wrap. */
function toggleWrapBlock(ctx: Ctx, nodeType: NodeType, attrs?: Attrs | null) {
  const view = ctx.get(editorViewCtx);
  const { state } = view;
  const { $from, $to } = state.selection;

  // Check if already inside this node type
  const range = $from.blockRange($to, (node) => node.type === nodeType);
  if (range) {
    const target = liftTarget(range);
    if (target != null) {
      view.dispatch(state.tr.lift(range, target).scrollIntoView());
      return;
    }
  }

  // Not inside — wrap
  ctx.get(commandsCtx).call(wrapInBlockTypeCommand.key, { nodeType, attrs: attrs ?? null });
}

let builderInstance: InstanceType<typeof Crepe> | null = null;

const { loading } = useEditor((root: HTMLElement) => {
  const crepe = new Crepe({
    root,
    defaultValue: props.defaultValue,
    featureConfigs: zhTWConfig,
  });
  crepe.addFeature(infoBoxFeature);
  crepe.addFeature(spanClassFeature);
  crepe.addFeature(customHtmlFeature);
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
        getActiveHeadingLevel: () => {
          let level = 0;
          builderInstance?.editor.action((ctx) => {
            const view = ctx.get(editorViewCtx);
            const headingType = headingSchema.type(ctx);
            const { $from } = view.state.selection;
            for (let d = $from.depth; d > 0; d--) {
              const node = $from.node(d);
              if (node.type === headingType) {
                level = (node.attrs?.level as number) ?? 1;
                return;
              }
            }
          });
          return level;
        },
        setBlockTypeToParagraph: () =>
          runCommand((ctx) =>
            ctx.get(commandsCtx).call(setBlockTypeCommand.key, {
              nodeType: paragraphSchema.type(ctx),
            })
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
          runCommand((ctx) => toggleWrapBlock(ctx, blockquoteSchema.type(ctx))),
        insertInfoBox: (kind: InfoBoxKind) =>
          runCommand((ctx) => toggleWrapBlock(ctx, infoBoxSchema.type(ctx), { kind })),
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
          runCommand((ctx) => toggleWrapBlock(ctx, bulletListSchema.type(ctx))),
        wrapInOrderedList: () =>
          runCommand((ctx) => toggleWrapBlock(ctx, orderedListSchema.type(ctx))),
        wrapInTaskList: () =>
          runCommand((ctx) => toggleWrapBlock(ctx, listItemSchema.type(ctx), { checked: false })),
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
            const view = ctx.get(editorViewCtx);
            const { $from } = view.state.selection;
            const codeBlockType = codeBlockSchema.type(ctx);
            // Toggle: if already in code block, convert to paragraph
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type === codeBlockType) {
                ctx.get(commandsCtx).call(setBlockTypeCommand.key, {
                  nodeType: paragraphSchema.type(ctx),
                });
                return;
              }
            }
            ctx.get(commandsCtx).call(setBlockTypeCommand.key, {
              nodeType: codeBlockType,
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
        insertCustomHtmlBlock: () =>
          runCommand((ctx) => runInsertCustomHtml(ctx)),
        applyTextColor: (className: string) =>
          runCommand((ctx) =>
            ctx.get(commandsCtx).call(applySpanClassCommand.key, className)
          ),
        removeTextColor: (className?: string) =>
          runCommand((ctx) =>
            ctx.get(commandsCtx).call(removeSpanClassCommand.key, className)
          ),
        getActiveTextColors: () => {
          let result: string[] = [];
          try {
            builderInstance?.editor.action((ctx) => {
              const view = ctx.get(editorViewCtx);
              const spanClassType = spanClassSchema.type(ctx);
              const { empty, from, to } = view.state.selection;
              
              if (empty) {
                const marks = view.state.storedMarks || view.state.selection.$from.marks();
                result = marks
                  .filter((m) => m.type === spanClassType)
                  .map((m) => m.attrs?.class as string)
                  .filter(Boolean)
                  .flatMap((c) => c.split(/\s+/));
              } else {
                const classes = new Set<string>();
                view.state.doc.nodesBetween(from, to, (node) => {
                  node.marks
                    .filter((m) => m.type === spanClassType)
                    .forEach((m) => {
                      const classStr = m.attrs?.class as string;
                      if (classStr) {
                        classStr.split(/\s+/).forEach((c) => classes.add(c));
                      }
                    });
                });
                result = Array.from(classes);
              }
            });
          } catch {
            result = [];
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
  getActiveHeadingLevel: () => {
    let level = 0;
    builderInstance?.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const headingType = headingSchema.type(ctx);
      const { $from } = view.state.selection;
      for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type === headingType) {
          level = (node.attrs?.level as number) ?? 1;
          return;
        }
      }
    });
    return level;
  },
  setBlockTypeToParagraph: () =>
    runCommand((ctx) =>
      ctx.get(commandsCtx).call(setBlockTypeCommand.key, {
        nodeType: paragraphSchema.type(ctx),
      })
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
    runCommand((ctx) => toggleWrapBlock(ctx, blockquoteSchema.type(ctx))),
  insertInfoBox: (kind: InfoBoxKind) =>
    runCommand((ctx) => toggleWrapBlock(ctx, infoBoxSchema.type(ctx), { kind })),
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
    runCommand((ctx) => toggleWrapBlock(ctx, bulletListSchema.type(ctx))),
  wrapInOrderedList: () =>
    runCommand((ctx) => toggleWrapBlock(ctx, orderedListSchema.type(ctx))),
  wrapInTaskList: () =>
    runCommand((ctx) => toggleWrapBlock(ctx, listItemSchema.type(ctx), { checked: false })),
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
      const view = ctx.get(editorViewCtx);
      const { $from } = view.state.selection;
      const codeBlockType = codeBlockSchema.type(ctx);
      for (let d = $from.depth; d > 0; d--) {
        if ($from.node(d).type === codeBlockType) {
          ctx.get(commandsCtx).call(setBlockTypeCommand.key, {
            nodeType: paragraphSchema.type(ctx),
          });
          return;
        }
      }
      ctx.get(commandsCtx).call(setBlockTypeCommand.key, {
        nodeType: codeBlockType,
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
  removeTextColor: (className?: string) =>
    runCommand((ctx) =>
      ctx.get(commandsCtx).call(removeSpanClassCommand.key, className)
    ),
  getActiveTextColors: () => {
    let result: string[] = [];
    try {
      builderInstance?.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const spanClassType = spanClassSchema.type(ctx);
        const { empty, from, to } = view.state.selection;
        
        if (empty) {
          const marks = view.state.storedMarks || view.state.selection.$from.marks();
          result = marks
            .filter((m) => m.type === spanClassType)
            .map((m) => m.attrs?.class as string)
            .filter(Boolean)
            .flatMap((c) => c.split(/\s+/));
        } else {
          const classes = new Set<string>();
          view.state.doc.nodesBetween(from, to, (node) => {
            node.marks
              .filter((m) => m.type === spanClassType)
              .forEach((m) => {
                const classStr = m.attrs?.class as string;
                if (classStr) {
                  classStr.split(/\s+/).forEach((c) => classes.add(c));
                }
              });
          });
          result = Array.from(classes);
        }
      });
    } catch {
      result = [];
    }
    return result;
  },
});
</script>
