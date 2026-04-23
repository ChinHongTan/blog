<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		code?: string;
		height?: string | number;
		title?: string;
	}>(),
	{
		code: "",
		height: undefined,
		title: "Interactive content",
	},
);

const iframeRef = ref<HTMLIFrameElement | null>(null);
const srcdoc = ref("");
const autoHeight = ref(400);
const hasError = ref(false);
const errorMsg = ref("");

function buildSrcdoc(code: string): string {
	if (!import.meta.client) return "";

	const rootStyle = getComputedStyle(document.documentElement);
	const bodyStyle = getComputedStyle(document.body);
	const names: string[] = [];
	for (const sheet of Array.from(document.styleSheets)) {
		let rules: CSSRuleList | null = null;
		try {
			rules = sheet.cssRules;
		} catch {
			continue;
		}
		if (!rules) continue;
		for (const rule of Array.from(rules)) {
			if (!(rule instanceof CSSStyleRule)) continue;
			for (let i = 0; i < rule.style.length; i++) {
				const prop = rule.style[i];
				if (prop && prop.startsWith("--") && !names.includes(prop)) {
					names.push(prop);
				}
			}
		}
	}
	const varDecls = names
		.map((n) => {
			const v = rootStyle.getPropertyValue(n) || bodyStyle.getPropertyValue(n);
			return v ? `${n}: ${v.trim()};` : "";
		})
		.filter(Boolean)
		.join("\n");

	const isDark = document.documentElement.classList.contains("dark");
	const bgColor = rootStyle.getPropertyValue("--color-bg-primary") || (isDark ? "#0b0b0b" : "#fff");
	const textColor = rootStyle.getPropertyValue("--color-text-primary") || (isDark ? "#eaeaea" : "#111");
	const fontStack = rootStyle.getPropertyValue("--font-sans") || "system-ui, -apple-system, sans-serif";

	return `<!DOCTYPE html>
<html lang="en"${isDark ? ' class="dark"' : ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root { ${varDecls} }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: ${bgColor.trim()}; color: ${textColor.trim()}; font-family: ${fontStack.trim()}; }
body { padding: 8px 4px; overflow-x: hidden; }
img, svg, video, canvas { max-width: 100%; height: auto; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
</style>
</head>
<body>
<div id="__sbox" style="display: flow-root;">
${code}
</div>
<script>
(function(){
  var box = document.getElementById('__sbox');
  function postHeight(){
    try {
      var h = box.getBoundingClientRect().height;
      var style = window.getComputedStyle(document.body);
      var mt = parseInt(style.marginTop, 10) || 0;
      var mb = parseInt(style.marginBottom, 10) || 0;
      var pt = parseInt(style.paddingTop, 10) || 0;
      var pb = parseInt(style.paddingBottom, 10) || 0;
      parent.postMessage({ __customHtml: true, type: 'height', height: Math.ceil(h + mt + mb + pt + pb) }, '*');
    } catch(e){}
  }
  window.addEventListener('error', function(e){
    parent.postMessage({ __customHtml: true, type: 'error', message: e.message || String(e.error) }, '*');
  });
  window.addEventListener('load', postHeight);
  var ro = new ResizeObserver(postHeight);
  ro.observe(box);
  setTimeout(postHeight, 50);
  setTimeout(postHeight, 250);
  setTimeout(postHeight, 1000);
})();
${"</" + "script>"}
</body>
</html>`;
}

function rebuild() {
	hasError.value = false;
	errorMsg.value = "";
	srcdoc.value = buildSrcdoc(props.code || "");
}

function onMessage(e: MessageEvent) {
	const data = e.data;
	if (!data || typeof data !== "object" || !data.__customHtml) return;
	if (e.source !== iframeRef.value?.contentWindow) return;
	if (data.type === "height" && typeof data.height === "number") {
		autoHeight.value = Math.max(60, Math.min(data.height + 4, 8000));
	} else if (data.type === "error") {
		hasError.value = true;
		errorMsg.value = String(data.message || "Unknown error");
	}
}

let themeObserver: MutationObserver | null = null;

onMounted(() => {
	rebuild();
	window.addEventListener("message", onMessage);
	themeObserver = new MutationObserver(() => rebuild());
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class", "data-theme"],
	});
});

onBeforeUnmount(() => {
	window.removeEventListener("message", onMessage);
	themeObserver?.disconnect();
	themeObserver = null;
});

watch(
	() => props.code,
	() => rebuild(),
);

const explicitHeight = computed(() => {
	if (props.height === undefined || props.height === "") return null;
	const n = typeof props.height === "number" ? props.height : Number(props.height);
	return Number.isFinite(n) && n > 0 ? n : null;
});

const iframeHeight = computed(() => explicitHeight.value ?? autoHeight.value);
</script>

<template>
	<div class="custom-html-block">
		<iframe
			ref="iframeRef"
			:srcdoc="srcdoc"
			:title="props.title"
			:style="{ height: iframeHeight + 'px' }"
			sandbox="allow-scripts"
			loading="lazy"
			referrerpolicy="no-referrer"
		/>
		<p v-if="hasError" class="custom-html-error" role="alert">
			<Icon name="heroicons:exclamation-triangle" size="14" />
			<span>Script error: {{ errorMsg }}</span>
		</p>
	</div>
</template>

<style scoped>
.custom-html-block {
	margin: 1.5rem 0;
}

.custom-html-block iframe {
	width: 100%;
	border: 1px solid var(--color-border-tertiary, #e5e5e5);
	border-radius: var(--border-radius-md, 8px);
	background: var(--color-bg-primary, #fff);
	display: block;
	color-scheme: normal;
}

.custom-html-error {
	margin: 0.5rem 0 0;
	padding: 8px 12px;
	font-size: 13px;
	color: var(--color-text-secondary, #666);
	background: var(--color-bg-secondary, #f6f6f6);
	border: 1px solid var(--color-border-tertiary, #e5e5e5);
	border-radius: var(--border-radius-md, 8px);
	display: flex;
	align-items: center;
	gap: 6px;
}
</style>
