# Custom markdown syntax on this blog

This blog extends standard markdown with a few custom features. You can use them in `.md` posts and in the admin editor (the rendered preview uses the same pipeline).

---

## 1. Custom heading IDs `{#id}`

**What it does:** Gives a heading a specific `id` so you can link to it (e.g. from a table of contents or inline link).

**Syntax:** Add a space and `{#your-id}` at the **end of the heading line**. Works for any heading level (`#`, `##`, `###`, `####`, etc.).

**Examples:**

```markdown
# 前言 {#前言}

## 選課列表 {#選課列表}

### 計算機程式設計 Introduction to Programming {#計算機程式設計}

#### 點名方式 {#點名方式}
```

**Linking:** Use a normal markdown link with the same id as the fragment:

```markdown
[跳到前言](#前言)
[計算機程式設計](#計算機程式設計)
```

**Rendered:** The `{#...}` part is removed from the visible text. The heading gets `<h1 id="前言">` (or the level you used).

---

## 2. Image with caption (figure + figcaption)

**What it does:** Renders the image inside a `<figure>` with a `<figcaption>` below it (styled on the blog).

**Syntax:** Standard markdown image with a **title** (the part in quotes after the URL):  
`![alt text](url "caption")`

**Examples:**

```markdown
![圖 1](/images/example.png "這是圖說文字")

![Braak stages](image.png "Figure 3. Braak stages of tau pathology.")
```

**Rendered:**  
`<figure><img src="..." alt="..." /><figcaption>caption</figcaption></figure>`

If you omit the title, the image is rendered as a normal `<img>` (no figure/caption).

---

## 3. Colored label spans `[text]{.class}`

**What it does:** Renders inline text with a color class (e.g. for labels like 每堂點名 / 不點名).

**Syntax:** `[顯示的文字]{.類別}`  

**Colour table:** One row per hue (red, orange, yellow, green, teal, blue, purple, pink, grey), 5 shades each (1 = lightest, 5 = darkest).  
Examples: `.red-1` … `.red-5`, `.orange-1` … `.orange-5`, `.green-1` … `.green-5`, `.teal-1` … `.teal-5`, `.blue-1` … `.blue-5`, `.purple-1` … `.purple-5`, `.pink-1` … `.pink-5`, `.grey-1` … `.grey-5`.  
Legacy classes (still supported): `.red`, `.red-dark`, `.green`, `.orange`, `.blue`, `.purple`, `.gray`, and `-dark` variants.

**Examples:**

```markdown
[每堂點名]{.red-3}
[不點名]{.green-3}
[偶爾點名]{.orange-3}
[備註]{.blue-4}
[標籤]{.purple-3}
```

**Rendered:**  
`<span class="red-3">每堂點名</span>` (or any `.hue-N` class).  
CSS in the blog styles these (and dark mode). You can pick a colour from the editor toolbar (Font colour) — the palette shows one row per hue, 5 shades per row.

**Note:** This must **not** look like a link: no `(url)` after the `]`.  
Use `[文字]{.red}` not `[文字](url){.red}`.

---

## 4. Callout blocks (info / warning / success / error)

**What it does:** Renders a block as a styled box (info, warning, success, or error).

**Syntax:**  
Fenced block with `:::info`, `:::warning`, `:::success`, or `:::error`. Content inside is normal markdown (including **bold**, lists, etc.).

**Examples:**

```markdown
:::info
**科號：** 11410EE 231001

開課教師：張彌彰
:::

:::warning
**範圍：** C語言 Ch 1 ~ Ch 20…
:::
```

**Rendered:**  
A `<div class="info-box info-box-info">` (or `-warning`, `-success`, `-error`) with the content inside.  
Use normal markdown inside (e.g. `**科號：**` instead of raw `<strong>`).

---

## 5. Raw HTML that’s still allowed

- **`<br>`** — Line breaks inside tables or inline are fine; no custom syntax for this.
- **`<br>` only;** `</br>` is invalid; use `<br>`.

---

## Quick reference

| Feature           | Syntax / usage                                      |
|------------------|-----------------------------------------------------|
| Custom heading ID| `## 標題 {#id}` at end of any `#`–`######` heading  |
| Image + caption  | `![alt](url "caption")`                             |
| Colored label    | `[文字]{.hue-N}` — one row per hue (red, orange, yellow, green, teal, blue, purple, pink, grey), N = 1 (light) … 5 (dark); legacy `.red` / `.red-dark` etc. still work |
| Callouts         | `:::info` / `:::warning` / `:::success` / `:::error` + content + `:::` |
| Line break       | `<br>` (raw HTML)                                  |

All of this is supported in both the **blog content** (Nuxt Content) and the **admin editor** (Milkdown) where the same markdown is used.
