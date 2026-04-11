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
import { visit } from 'unist-util-visit'

const INFO_BOX_TYPES = ['info', 'warning', 'success', 'error']

export default function remarkInfoBox() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      const name = (node.name || '').toLowerCase()
      if (!INFO_BOX_TYPES.includes(name)) return

      const firstChild = node.children?.[0]
      const collapsible = firstChild?.type === 'heading'

      const data = node.data || (node.data = {})
      data.hName = collapsible ? 'details' : 'div'
      data.hProperties = {
        className: ['info-box', `info-box-${name}`],
      }

      if (collapsible) {
        const headingData = firstChild.data || (firstChild.data = {})
        headingData.hName = 'summary'
      }
    })
  }
}
