/**
 * Remark plugin: convert :::info, :::warning, :::success, :::error
 * to <div class="info-box info-box-{type}"> for blog styling.
 *
 * If the first child of the container is a heading, the block is rendered
 * as a collapsible <details> element with that heading as the <summary>.
 * This lets authors opt into a collapsed callout by leading with a heading
 * (e.g. `### 補充説明：...`) without any extra markdown syntax.
 *
 * Use with remark-directive (must run after remark-directive).
 */
import { visit } from "unist-util-visit";

const INFO_BOX_TYPES = ["info", "warning", "success", "error"];

export default function remarkInfoBox() {
	return (tree) => {
		visit(tree, (node) => {
			if (node.type !== "containerDirective") return;
			const name = (node.name || "").toLowerCase();
			if (!INFO_BOX_TYPES.includes(name)) return;

			const firstChild = node.children?.[0];
			const collapsible = firstChild?.type === "heading";

			const data = node.data || (node.data = {});
			data.hName = collapsible ? "details" : "div";
			data.hProperties = {
				className: ["info-box", `info-box-${name}`],
			};

			visit(node, "heading", (childNode) => {
				const childData = childNode.data || (childNode.data = {});
				if (!childData.hName) {
					childData.hName = `h${childNode.depth}`;
				}
				// By changing type to 'paragraph', Nuxt Content's TOC generation will ignore it,
				// but rehype will still render it as hName (e.g. h3 or summary).
				childNode.type = "paragraph";
			});

			if (collapsible) {
				const headingData = firstChild.data || (firstChild.data = {});
				headingData.hName = "summary";

				const rest = node.children.slice(1);
				const wrapper = {
					type: "containerDirective",
					name: "info-box-content",
					children: rest,
					data: {
						hName: "div",
						hProperties: { className: ["info-box-content"] },
					},
				};
				node.children = [firstChild, wrapper];
			}
		});
	};
}
