# Blog posts HTML usage audit & markdown support suggestions

Scanned all 13 blog posts in `content/blog/`. Summary of HTML usage and whether to add custom markdown support.

---

## 1. Inventory of HTML used

| HTML / pattern | Where used | Purpose |
|----------------|------------|--------|
| `<p class="indent">` | 清華大學電機系-大一雜魚修課心得-總結.md (many) | First-line indented paragraphs (Chinese typography) |
| `<br>` | Same post (tables + inline) | Line breaks in table cells and after images |
| `<div id="...">Heading</div>` | Same post (section headings) | Headings with custom anchor IDs for in-page links |
| `<strong>`, `<p>` | Same post (inside `:::info` / `:::warning`) | Bold labels and paragraphs in callout blocks |
| `<span style="color: red;">`, `green`, `orange` | Same post (點名方式) | Colored labels: 每堂點名 / 不點名 / 偶爾點名 |
| `<font color="red">` | Same post (1 place) | Red text (deprecated HTML) |
| `<figure>`, `<img>`, `<figcaption>` | 清華大學…, ptau217…, stability-instead-of-revenge… | Images with captions |
| `</br>` | Same post (typo) | Invalid; should be `<br>` |

**Posts with no HTML:** 一個漂流到地球的故事, 小紅書被封禁…, 走進、走近、走盡, latex-example, 你好世界, 根本沒人在乎你的部落格, 微積分隨筆-未完成版, 早安-午安-晚安, 2025數學回顧, 北冰洋漂流記.

---

## 2. Recommendations

### A. Add custom markdown support (high value)

1. **Indented paragraphs (`<p class="indent">`)**  
   - **Suggestion:** Add a markdown extension or block syntax that outputs `<p class="indent">...</p>`.  
   - **Example syntax (optional):**  
     - Indent block with a marker, e.g. `::indent` or a convention like “paragraph starting with `　` (full-width space) → indent”.  
     - Or a custom MDC component, e.g. `::indent{ .indent }\nParagraph text.`  
   - **Alternative:** Keep raw HTML but add CSS so the class does something:  
     ```css
     .post-content :deep(p.indent) { text-indent: 2em; }
     ```  
   - **Recommendation:** Add the CSS so existing posts render as intended; optionally add a short “indent” syntax later so new posts don’t need HTML.

2. **Headings with custom IDs (`<div id="...">...</div>`)**  
   - **Suggestion:** Prefer standard markdown headings + Nuxt Content / markdown-it anchor behavior.  
   - **Options:**  
     - Use `### 計算機程式設計 Introduction to Programming` and rely on auto-generated IDs (e.g. `#計算機程式設計` if your renderer supports it).  
     - Or use a “heading with ID” extension if your stack supports it (e.g. `### 計算機程式設計 Introduction to Programming {#計算機程式設計}`).  
   - **Recommendation:** Document the chosen approach (auto-id or extension) in the writing guide; migrate the one long post to `###` + IDs and remove `<div id="...">` wrappers if possible.

3. **Colored inline text (`<span style="color: red;">` etc.)**  
   - **Suggestion:** Add a simple markdown extension or component for “badge”/“label” styles.  
   - **Example syntax:**  
     - Inline: `[每堂點名]{.red}` or `:red[每堂點名]` (MDC-style).  
     - Or a small set of named classes: `[每堂點名]{.attendance-always}`, `[不點名]{.attendance-none}`, `[偶爾點名]{.attendance-sometimes}`.  
   - **Recommendation:** Add 2–3 predefined classes (e.g. `.attendance-always`, `.attendance-none`, `.attendance-sometimes`) and document them; optionally add a short markdown syntax so authors don’t write raw `<span style="color:...">` or `<font>`.

### B. Keep as-is or minimal change

4. **`<br>` in tables and inline**  
   - **Recommendation:** Keep HTML `<br>`. GFM tables don’t have a standard way to insert line breaks; raw HTML is the usual approach. No custom markdown needed.

5. **`<strong>` / `<p>` inside `:::info` / `:::warning`**  
   - **Recommendation:** Keep as-is. Standard markdown `**bold**` and paragraphs already work; the mix of HTML there is for structure and can stay unless you standardize callout content to pure markdown.

6. **`<figure>` / `<img>` / `<figcaption>`**  
   - **Recommendation:** Already styled in `pages/[...slug].vue`. You can:  
     - Keep raw HTML for figures, or  
     - Add a markdown “image with caption” syntax (e.g. MDC or a fenced block) that outputs `<figure>` + `<img>` + `<figcaption>` so future posts use markdown only.  
   - Optional: Document “for captioned images, use this snippet or this syntax” in the writing guide.

7. **`<font color="red">`**  
   - **Recommendation:** Replace the single occurrence with `<span style="color: red;">` or the new colored-label syntax above; then disallow `<font>` (deprecated).

---

## 3. Quick fixes (no new markdown syntax)

- **Add CSS for indented paragraphs** (so existing `class="indent"` works):
  ```css
  .post-content :deep(p.indent) {
    text-indent: 2em;
  }
  ```
- **Replace `</br>`** with `<br>` in 清華大學電機系-大一雜魚修課心得-總結.md.
- **Replace `<font color="red">`** with `<span style="color: red;">` in the same file.

---

## 4. Summary table

| Tag / pattern | Add custom markdown? | Note |
|---------------|----------------------|------|
| `<p class="indent">` | Optional (syntax) | Add CSS first; syntax later if you want to avoid HTML |
| `<div id="...">` headings | No (prefer ### + auto-id) | Unify on standard headings + IDs |
| `<span style="color: ...">` | Optional (e.g. `[text]{.red}`) | Prefer small set of classes + docs or short syntax |
| `<br>` in tables | No | Keep HTML |
| `<figure>` / `<figcaption>` | Optional | Already styled; optional “image with caption” syntax |
| `<strong>` / `<p>` in callouts | No | Keep as-is |
| `<font>` | No (remove) | Replace with `<span>` or new syntax |

---

## 5. Implemented (post-audit)

- **Heading IDs:** `remark-heading-id.mjs` — headings support `### Title {#custom-id}`; links like `[計算機程式設計](#計算機程式設計)` work.
- **Figure / figcaption:** `rehype-figure-caption.mjs` — markdown `![alt](url "caption")` is rendered as `<figure><img><figcaption>caption</figcaption></figure>` (same as Milkdown’s image-with-title).
- **Colored labels:** `rehype-span-attributes.mjs` — `[每堂點名]{.red}`, `[不點名]{.green}`, `[偶爾點名]{.orange}`; CSS in `[...slug].vue` for `.red` / `.green` / `.orange`.
- **清華 post** updated: div headings → `### Title {#id}`, span colors → `[text]{.class}`, `</br>` → `<br>`, one `<font>` → `[text]{.red}`, one callout’s `<strong>`/`<p>` → markdown (no display break).
- **Indent:** Not implemented (author not using it).
- **Callouts:** Using markdown inside `:::info` / `:::warning` (**bold**, paragraphs) works; remaining callouts can be converted the same way.

If you tell me which of these you want (e.g. “add indent CSS + fix typos + document colored spans”), I can implement the CSS and edits and suggest exact changes to the writing guide.