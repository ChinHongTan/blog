/**
 * Milkdown custom node: custom-html block.
 *
 * Atom node storing a raw HTML string in a `code` attribute. In the editor,
 * it renders as a card with:
 *   - A header (label + Hide/Edit toggle)
 *   - A textarea to edit the HTML source
 *   - A sandboxed iframe showing live preview
 *
 * Round-trips to ```custom-html ... ``` fenced code blocks in markdown.
 * The blog-side rehype pipeline converts the same fenced block to
 * <CustomHtml> on the published page.
 */
import type { Ctx, MilkdownPlugin } from "@milkdown/ctx";
import {
	commandsCtx,
	InitReady,
	remarkPluginsCtx,
	schemaTimerCtx,
} from "@milkdown/kit/core";
import { createTimer } from "@milkdown/ctx";
import {
	addBlockTypeCommand,
	clearTextInCurrentBlockCommand,
} from "@milkdown/kit/preset/commonmark";
import { blockConfig } from "@milkdown/kit/plugin/block";
import type { Node as ProseNode } from "@milkdown/prose/model";
import type { EditorView, NodeView } from "@milkdown/prose/view";
import { $nodeAttr, $nodeSchema, $view } from "@milkdown/utils";
import { visit } from "unist-util-visit";
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView as CMEditorView } from "@codemirror/view";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";

const CUSTOM_HTML_NODE = "customHtml";
const CUSTOM_HTML_MDAST_TYPE = "customHtmlBlock";

export const customHtmlAttr = $nodeAttr(CUSTOM_HTML_NODE);

interface CustomHtmlMdastNode {
	type: string;
	value?: string;
}

function isCustomHtmlMdastNode(node: unknown): node is CustomHtmlMdastNode {
	if (typeof node !== "object" || node === null) return false;
	return (node as { type?: string }).type === CUSTOM_HTML_MDAST_TYPE;
}

/**
 * Remark plugin: rewrite `code` nodes with lang `custom-html` to our custom
 * mdast type so they don't collide with the default code-block schema.
 */
function remarkRenameCustomHtml() {
	return (tree: import("mdast").Root) => {
		visit(tree, "code", (node) => {
			const n = node as { type: string; lang?: string | null; value?: string };
			if (n.lang !== "custom-html") return;
			n.type = CUSTOM_HTML_MDAST_TYPE;
			delete n.lang;
		});
	};
}

const RemarkCustomHtmlParseReady = createTimer("RemarkCustomHtmlParseReady");

function remarkCustomHtmlParse(): MilkdownPlugin {
	const entry = {
		plugin: remarkRenameCustomHtml as unknown as import("@milkdown/transformer").RemarkPlugin["plugin"],
		options: {} as Record<string, unknown>,
	};
	return (ctx: Ctx) => {
		ctx.update(schemaTimerCtx, (timers) => [...timers, RemarkCustomHtmlParseReady]);
		ctx.record(RemarkCustomHtmlParseReady);
		return async () => {
			await ctx.wait(InitReady);
			ctx.update(remarkPluginsCtx, (plugs) => [...plugs, entry]);
			ctx.done(RemarkCustomHtmlParseReady);
			return () => {
				ctx.update(remarkPluginsCtx, (plugs) =>
					plugs.filter((p) => p.plugin !== entry.plugin),
				);
				ctx.clearTimer(RemarkCustomHtmlParseReady);
			};
		};
	};
}

export const customHtmlSchema = $nodeSchema(CUSTOM_HTML_NODE, () => ({
	content: "",
	group: "block",
	atom: true,
	defining: true,
	isolating: true,
	selectable: true,
	draggable: true,
	attrs: {
		code: { default: "" },
	},
	parseDOM: [
		{
			tag: "div[data-custom-html]",
			getAttrs: (dom) => {
				const el = dom as HTMLElement;
				return { code: el.getAttribute("data-code") || "" };
			},
		},
	],
	toDOM: (node) => [
		"div",
		{
			class: "custom-html-editor-block",
			"data-custom-html": "",
			"data-code": String(node.attrs.code || ""),
		},
	],
	parseMarkdown: {
		match: (node) => isCustomHtmlMdastNode(node),
		runner: (state, node, type) => {
			const value = isCustomHtmlMdastNode(node) ? (node.value ?? "") : "";
			state.addNode(type, { code: String(value) });
		},
	},
	toMarkdown: {
		match: (node) => node.type.name === CUSTOM_HTML_NODE,
		runner: (state, node) => {
			state.addNode("code", undefined, String(node.attrs.code || ""), {
				lang: "custom-html",
			});
		},
	},
}));

/* --------------------------------- NodeView ------------------------------- */

function buildIframeSrcdoc(code: string): string {
	if (typeof document === "undefined") return "";

	const rootStyle = getComputedStyle(document.documentElement);
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
			const v = rootStyle.getPropertyValue(n);
			return v ? `${n}: ${v.trim()};` : "";
		})
		.filter(Boolean)
		.join("\n");

	const isDark = document.documentElement.classList.contains("dark");
	const bg =
		rootStyle.getPropertyValue("--color-bg-primary").trim() ||
		(isDark ? "#0b0b0b" : "#fff");
	const fg =
		rootStyle.getPropertyValue("--color-text-primary").trim() ||
		(isDark ? "#eaeaea" : "#111");
	const font =
		rootStyle.getPropertyValue("--font-sans").trim() ||
		"system-ui, -apple-system, sans-serif";

	return `<!DOCTYPE html>
<html lang="en"${isDark ? ' class="dark"' : ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root { ${varDecls} }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: ${bg}; color: ${fg}; font-family: ${font}; }
body { padding: 8px 4px; overflow-x: hidden; }
img, svg, video, canvas { max-width: 100%; height: auto; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
</style>
</head>
<body>
${code}
<script>
(function(){
  function postHeight(){
    try {
      var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      parent.postMessage({ __customHtml: true, type: 'height', height: h }, '*');
    } catch(e){}
  }
  window.addEventListener('error', function(e){
    parent.postMessage({ __customHtml: true, type: 'error', message: e.message || String(e.error) }, '*');
  });
  window.addEventListener('load', postHeight);
  try { new ResizeObserver(postHeight).observe(document.body); } catch(e){}
  setTimeout(postHeight, 50);
  setTimeout(postHeight, 250);
  setTimeout(postHeight, 1000);
})();
${"</" + "script>"}
</body>
</html>`;
}

class CustomHtmlNodeView implements NodeView {
	dom: HTMLElement;
	private iframe: HTMLIFrameElement;
	private cm: CMEditorView;
	private toggleBtn: HTMLButtonElement;
	private expandBtn: HTMLButtonElement;
	private errorEl: HTMLElement;
	private collapsed = false;
	private expanded = false;
	private rebuildTimer: ReturnType<typeof setTimeout> | null = null;
	private onMessage: (e: MessageEvent) => void;
	private themeObserver: MutationObserver | null = null;
	private node: import("@milkdown/prose/model").Node;
	private view: import("@milkdown/prose/view").EditorView;
	private getPos: () => number | undefined;

	constructor(node: import("@milkdown/prose/model").Node, view: import("@milkdown/prose/view").EditorView, getPos: () => number | undefined) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;

		this.dom = document.createElement("div");
		this.dom.className = "custom-html-editor-block";
		this.dom.setAttribute("data-custom-html", "");
		this.dom.setAttribute("contenteditable", "false");

		const header = document.createElement("div");
		header.className = "custom-html-editor-header";

		const label = document.createElement("span");
		label.className = "custom-html-editor-label";
		label.textContent = "Custom HTML";
		header.appendChild(label);

		const actions = document.createElement("div");
		actions.className = "custom-html-editor-actions";
		actions.style.display = "flex";
		actions.style.gap = "8px";

		this.expandBtn = document.createElement("button");
		this.expandBtn.type = "button";
		this.expandBtn.className = "custom-html-editor-toggle";
		this.expandBtn.textContent = "展開";
		this.expandBtn.addEventListener("click", (e) => {
			e.preventDefault();
			this.setExpanded(!this.expanded);
		});
		actions.appendChild(this.expandBtn);

		this.toggleBtn = document.createElement("button");
		this.toggleBtn.type = "button";
		this.toggleBtn.className = "custom-html-editor-toggle";
		this.toggleBtn.textContent = "隱藏";
		this.toggleBtn.addEventListener("click", (e) => {
			e.preventDefault();
			this.setCollapsed(!this.collapsed);
		});
		actions.appendChild(this.toggleBtn);
		
		header.appendChild(actions);
		this.dom.appendChild(header);

		const codeWrap = document.createElement("div");
		codeWrap.className = "custom-html-editor-code";
		
		const isDark = document.documentElement.classList.contains("dark");
		const extensions = [
			basicSetup,
			html(),
			CMEditorView.updateListener.of((update) => {
				if (update.docChanged) {
					this.onInput();
				}
			}),
			CMEditorView.domEventHandlers({
				keydown: (e) => e.stopPropagation(),
				mousedown: (e) => e.stopPropagation(),
				paste: (e) => e.stopPropagation()
			})
		];
		if (isDark) extensions.push(oneDark);

		this.cm = new CMEditorView({
			state: EditorState.create({
				doc: String(node.attrs.code || ""),
				extensions
			}),
			parent: codeWrap,
		});
		
		this.dom.appendChild(codeWrap);

		const previewWrap = document.createElement("div");
		previewWrap.className = "custom-html-editor-preview";
		this.iframe = document.createElement("iframe");
		this.iframe.setAttribute("sandbox", "allow-scripts");
		this.iframe.setAttribute("referrerpolicy", "no-referrer");
		this.iframe.setAttribute("title", "Custom HTML preview");
		this.iframe.style.width = "100%";
		this.iframe.style.height = "120px";
		this.iframe.style.border = "0";
		previewWrap.appendChild(this.iframe);
		this.dom.appendChild(previewWrap);

		this.errorEl = document.createElement("div");
		this.errorEl.className = "custom-html-editor-error";
		this.errorEl.style.display = "none";
		this.dom.appendChild(this.errorEl);

		this.onMessage = (e: MessageEvent) => {
			const data = e.data;
			if (!data || typeof data !== "object" || !data.__customHtml) return;
			if (e.source !== this.iframe.contentWindow) return;
			if (data.type === "height" && typeof data.height === "number") {
				const h = Math.max(60, Math.min(data.height + 4, 8000));
				this.iframe.style.height = h + "px";
			} else if (data.type === "error") {
				this.errorEl.textContent = "⚠ " + String(data.message || "Error");
				this.errorEl.style.display = "block";
			}
		};
		window.addEventListener("message", this.onMessage);

		if (typeof MutationObserver !== "undefined") {
			this.themeObserver = new MutationObserver(() => {
                const nowDark = document.documentElement.classList.contains("dark");
                // basic handling, but ideally reconfigure CodeMirror extensions
                this.scheduleRebuild(0);
            });
			this.themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["class", "data-theme"],
			});
		}

		this.scheduleRebuild(0);
	}

	private rebuildIframe() {
		this.errorEl.style.display = "none";
		this.errorEl.textContent = "";
		this.iframe.srcdoc = buildIframeSrcdoc(this.cm.state.doc.toString());
	}

	private scheduleRebuild(delay = 300) {
		if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
		this.rebuildTimer = setTimeout(() => {
			this.rebuildTimer = null;
			this.rebuildIframe();
		}, delay);
	}

	private onInput() {
		const code = this.cm.state.doc.toString();
		this.scheduleRebuild();
		const pos = this.getPos();
		if (typeof pos !== "number") return;
		const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
			...this.node.attrs,
			code,
		});
		// setMeta addToHistory=false keeps rapid typing out of the undo stack at keystroke granularity
		tr.setMeta("addToHistory", true);
		this.view.dispatch(tr);
	}

	private setCollapsed(collapsed: boolean) {
		this.collapsed = collapsed;
		this.dom.classList.toggle("custom-html-editor-collapsed", collapsed);
		this.toggleBtn.textContent = collapsed ? "編輯" : "隱藏";
	}

	private setExpanded(expanded: boolean) {
		this.expanded = expanded;
		this.dom.classList.toggle("custom-html-editor-expanded", expanded);
		this.expandBtn.textContent = expanded ? "收合" : "展開";
	}

	update(node: import("@milkdown/prose/model").Node): boolean {
		if (node.type.name !== "customHtml") return false;
		this.node = node;
		const nextCode = String(node.attrs.code || "");
		const currentCode = this.cm.state.doc.toString();
		if (nextCode !== currentCode) {
			// external update (undo/redo, setMarkdown) — sync codemirror and rebuild
			this.cm.dispatch({
				changes: { from: 0, to: currentCode.length, insert: nextCode }
			});
			this.scheduleRebuild(0);
		}
		return true;
	}

	stopEvent(event: Event): boolean {
		// Keep all events inside CodeMirror from bubbling to ProseMirror
		return event.target instanceof Node && this.cm.dom.contains(event.target);
	}

	ignoreMutation(): boolean {
		// Don't let ProseMirror react to DOM changes inside our widget
		return true;
	}

	destroy() {
		window.removeEventListener("message", this.onMessage);
		this.themeObserver?.disconnect();
		this.themeObserver = null;
		if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
		this.rebuildTimer = null;
		this.cm.destroy();
	}
}

export const customHtmlNodeView = $view(customHtmlSchema.node, () => {
	return (node, view, getPos) =>
		new CustomHtmlNodeView(
			node,
			view as EditorView,
			getPos as () => number | undefined,
		);
});

/** Hide the block handle on customHtml (inline toggle is enough). */
function customHtmlBlockHandleFilter(): MilkdownPlugin {
	return (ctx: Ctx) => {
		ctx.update(blockConfig.key, (prev) => {
			const prevFilter = prev?.filterNodes;
			return {
				filterNodes: (pos, n) => {
					if (n.type.name === CUSTOM_HTML_NODE) return false;
					return prevFilter ? prevFilter(pos, n) : true;
				},
			};
		});
		return () => {};
	};
}

/** Crepe feature: register the customHtml node + node view. */
export function customHtmlFeature(
	editor: InstanceType<typeof import("@milkdown/kit/core").Editor>,
): void {
	editor
		.use(remarkCustomHtmlParse())
		.use(customHtmlAttr)
		.use(customHtmlSchema.ctx)
		.use(customHtmlSchema.node)
		.use(customHtmlNodeView)
		.use(customHtmlBlockHandleFilter());
}

/** Insert a new customHtml block at the current cursor. */
export function runInsertCustomHtml(ctx: Ctx, defaultCode = ""): void {
	const commands = ctx.get(commandsCtx);
	commands.call(clearTextInCurrentBlockCommand.key);
	const type = customHtmlSchema.type(ctx);
	const node = type.create({ code: defaultCode });
	commands.call(addBlockTypeCommand.key, { nodeType: node });
}

/** Slash-menu item for inserting a customHtml block. */
export function customHtmlSlashItem(): {
	id: string;
	label: string;
	icon: string;
	onRun: (ctx: Ctx) => void;
} {
	return {
		id: "customHtml",
		label: "Custom HTML",
		icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`,
		onRun: (ctx: Ctx) => runInsertCustomHtml(ctx, ""),
	};
}
