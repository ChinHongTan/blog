/**
 * Remark plugin: convert fenced code blocks with lang `custom-html`
 * into a <custom-html code="..."></custom-html> element.
 *
 * Authors write:
 *   ```custom-html
 *   <h2>Hello</h2>
 *   <script>console.log('hi')</script>
 *   ```
 *
 * The rendered page uses the <CustomHtml> Vue component, which sandboxes
 * the HTML in an iframe so scripts/styles cannot touch the parent page.
 */
import { visit } from "unist-util-visit";

export default function remarkCustomHtml() {
	return (tree) => {
		visit(tree, "code", (node) => {
			if (node.lang !== "custom-html") return;
			const code = node.value || "";
			node.type = "customHtmlBlock";
			node.data = {
				hName: "custom-html",
				hProperties: { code },
				hChildren: [],
			};
			delete node.lang;
			delete node.meta;
			delete node.value;
		});
	};
}
