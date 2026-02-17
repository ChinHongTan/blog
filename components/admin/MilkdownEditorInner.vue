<template>
  <Milkdown />
</template>

<script setup lang="ts">
import type { Ctx } from "@milkdown/ctx";
import { Milkdown, useEditor } from "@milkdown/vue";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { watch, onBeforeUnmount } from "vue";
import { infoBoxFeature, infoBoxSlashItems } from "~/lib/milkdown-info-box";
import { markdownRevealPlugin } from "~/lib/milkdown-markdown-reveal";

const props = withDefaults(
  defineProps<{
    defaultValue?: string;
  }>(),
  { defaultValue: "" }
);

const emit = defineEmits<{
  ready: [api: { getMarkdown: () => string }];
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
  crepe.editor.use(markdownRevealPlugin);
  builderInstance = crepe;
  return crepe;
});

watch(
  loading,
  (v) => {
    if (v === false && builderInstance) {
      emit("ready", {
        getMarkdown: () => builderInstance!.getMarkdown(),
      });
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  builderInstance?.destroy().catch(console.error);
});

defineExpose({
  getMarkdown: () => builderInstance?.getMarkdown() ?? "",
});
</script>
