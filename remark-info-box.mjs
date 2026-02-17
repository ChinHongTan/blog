/**
 * Remark plugin: convert :::info, :::warning, :::success, :::error
 * to <div class="info-box info-box-{type}"> for blog styling.
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

      const data = node.data || (node.data = {})
      data.hName = 'div'
      data.hProperties = {
        className: ['info-box', `info-box-${name}`],
      }
    })
  }
}
