import { visit } from "unist-util-visit";

/**
 * Remark plugin: preserve unknown inline directives as plain text.
 *
 * Why this exists:
 * - remark-directive parses patterns like `foo:bar` / `19:00` as textDirective.
 * - Without a handler, mdast->hast may emit empty elements and visually drop text.
 *
 * We only use container directives (:::info, etc.) intentionally in this project,
 * so converting text/leaf directives back to text is the safest behavior.
 */
export default function remarkDirectiveFallback() {
	return (tree) => {
		visit(tree, (node, index, parent) => {
			if (index == null || !parent || !Array.isArray(parent.children))
				return;

			if (node.type === "textDirective") {
				const name = typeof node.name === "string" ? node.name : "";
				parent.children[index] = { type: "text", value: `:${name}` };
				return;
			}

			if (node.type === "leafDirective") {
				const name = typeof node.name === "string" ? node.name : "";
				parent.children[index] = {
					type: "paragraph",
					children: [{ type: "text", value: `::${name}` }],
				};
			}
		});
	};
}
