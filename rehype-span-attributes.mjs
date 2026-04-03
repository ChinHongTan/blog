/**
 * Rehype plugin: turn [text]{.className} in text nodes into <span class="className">text</span>.
 * Handles pattern split across sibling text nodes.
 */
import { visit } from "unist-util-visit";

const PATTERN = /\[([^\]]*)\]\s*\{((?:\s*\.[a-z][a-z0-9-]*)+)\}/g;

function extractClassNames(classSection) {
	return classSection
		.split(/\s+/)
		.map((c) => c.replace(/^\./, ""))
		.filter((c) => c.length > 0)
		.join(" ");
}

function replaceTextWithSpans(value) {
	const parts = [];
	let lastIndex = 0;
	let m;
	PATTERN.lastIndex = 0;
	while ((m = PATTERN.exec(value)) !== null) {
		if (m.index > lastIndex) {
			parts.push({
				type: "text",
				value: value.slice(lastIndex, m.index),
			});
		}
		const classes = extractClassNames(m[2]);
		parts.push({
			type: "element",
			tagName: "span",
			properties: { className: classes.split(" ") },
			children: [{ type: "text", value: m[1] }],
		});
		lastIndex = PATTERN.lastIndex;
	}
	if (lastIndex === 0 && parts.length === 0) return null;
	if (lastIndex < value.length) {
		parts.push({ type: "text", value: value.slice(lastIndex) });
	}
	return parts;
}

export default function rehypeSpanAttributes() {
	return (tree) => {
		visit(tree, (node) => {
			if (!node.children?.length) return;
			const newChildren = [];
			let run = [];

			const processRun = () => {
				if (run.length === 0) return;
				const combined = run.map((n) => n.value).join("");
				const replacement = replaceTextWithSpans(combined);
				if (replacement && replacement.length > 0) {
					newChildren.push(...replacement);
				} else {
					newChildren.push(...run);
				}
				run = [];
			};

			for (const child of node.children) {
				if (child.type === "text") {
					run.push(child);
				} else {
					processRun();
					newChildren.push(child);
				}
			}
			processRun();

			node.children = newChildren;
		});
	};
}
