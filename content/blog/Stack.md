---
title: Stack
date: 2026-05-14T00:27:35+08:00
edited_at: 2026-05-14T08:40:47.069Z
author: chinono
path: /blog/Stack
---

## A Quick Recap: Where Stacks Fit In

Before we get to stacks, let's place them on the map. In Java, almost every data structure lives inside something called the **Collection Framework**. It's a family tree of interfaces and classes that all share the same basic vocabulary — things like `add`, `remove`, `size`, `contains`, and so on.

Here's a simplified view of the hierarchy:

```custom-html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Java Collection Framework Hierarchy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f5efe4;
    --paper: #fbf6ec;
    --ink: #1a1612;
    --ink-soft: #6b6258;
    --rule: #d8cfc0;
    --accent: #c44536;
    --accent-soft: #e8b9b3;
    --teal: #2c5f5d;
    --gold: #b08e3c;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Fraunces', Georgia, serif;
    padding: 2rem 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .widget {
    width: 100%;
    max-width: 820px;
    background: var(--paper);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 2rem 1.5rem 2.5rem;
    position: relative;
    box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 20px 40px -20px rgba(26,22,18,0.12);
  }
  .widget::before {
    content: "FIG. 01";
    position: absolute;
    top: 1rem; right: 1.25rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    color: var(--ink-soft);
  }
  h1 {
    font-family: 'Fraunces', serif;
    font-weight: 600;
    font-size: 1.5rem;
    font-variation-settings: "opsz" 96;
    margin-bottom: 0.25rem;
    letter-spacing: -0.01em;
  }
  .subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--ink-soft);
    letter-spacing: 0.05em;
    margin-bottom: 1.5rem;
    text-transform: uppercase;
  }
  .legend {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: var(--ink-soft);
  }
  .legend-item { display: flex; align-items: center; gap: 0.4rem; }
  .legend-swatch {
    display: inline-block;
    width: 14px; height: 14px;
    border: 1.5px solid var(--ink);
  }
  .swatch-interface { background: var(--paper); }
  .swatch-class { background: var(--ink); }
  .swatch-stack { background: var(--accent); border-color: var(--accent); }
 
  svg { width: 100%; height: auto; display: block; }
  .node-bg-interface { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
  .node-bg-class { fill: var(--ink); stroke: var(--ink); stroke-width: 1.5; }
  .node-bg-stack { fill: var(--accent); stroke: var(--accent); stroke-width: 1.5; }
  .node-label-dark { fill: var(--ink); font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; }
  .node-label-light { fill: var(--paper); font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; }
  .connector { stroke: var(--ink-soft); stroke-width: 1; fill: none; }
  .connector-accent { stroke: var(--accent); stroke-width: 1.5; fill: none; }
 
  .annotation {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 13px;
    fill: var(--accent);
  }
  .caption {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--rule);
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--ink-soft);
    font-style: italic;
  }
  .caption strong { color: var(--ink); font-style: normal; font-weight: 600; }
  @keyframes pulse-stack {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  #stack-node {
    transform-origin: center;
    transform-box: fill-box;
    animation: pulse-stack 2.5s ease-in-out infinite;
  }
</style>
</head>
<body>
<div class="widget">
  <h1>Java Collection Framework</h1>
  <div class="subtitle">— Where Stack Lives —</div>
 
  <div class="legend">
    <span class="legend-item"><span class="legend-swatch swatch-interface"></span> Interface</span>
    <span class="legend-item"><span class="legend-swatch swatch-class"></span> Class</span>
    <span class="legend-item"><span class="legend-swatch swatch-stack"></span> Our subject</span>
  </div>
 
  <svg viewBox="0 0 800 560" xmlns="http://www.w3.org/2000/svg">
    <!-- Iterable -->
    <g transform="translate(340, 10)">
      <rect class="node-bg-interface" width="120" height="34" rx="2"/>
      <text class="node-label-dark" x="60" y="22" text-anchor="middle">Iterable</text>
    </g>
    <!-- arrow Iterable -> Collection -->
    <path class="connector" d="M 400 44 L 400 70"/>
    <polygon points="396,68 400,76 404,68" fill="#6b6258"/>
 
    <!-- Collection -->
    <g transform="translate(340, 76)">
      <rect class="node-bg-interface" width="120" height="34" rx="2"/>
      <text class="node-label-dark" x="60" y="22" text-anchor="middle">Collection</text>
    </g>
 
    <!-- Branches from Collection -->
    <path class="connector" d="M 400 110 L 400 130 L 160 130 L 160 150"/>
    <path class="connector" d="M 400 130 L 400 150"/>
    <path class="connector" d="M 400 130 L 640 130 L 640 150"/>
    <polygon points="156,148 160,156 164,148" fill="#6b6258"/>
    <polygon points="396,148 400,156 404,148" fill="#6b6258"/>
    <polygon points="636,148 640,156 644,148" fill="#6b6258"/>
 
    <!-- List -->
    <g transform="translate(100, 156)">
      <rect class="node-bg-interface" width="120" height="34" rx="2"/>
      <text class="node-label-dark" x="60" y="22" text-anchor="middle">List</text>
    </g>
    <!-- Queue -->
    <g transform="translate(340, 156)">
      <rect class="node-bg-interface" width="120" height="34" rx="2"/>
      <text class="node-label-dark" x="60" y="22" text-anchor="middle">Queue</text>
    </g>
    <!-- Set -->
    <g transform="translate(580, 156)">
      <rect class="node-bg-interface" width="120" height="34" rx="2"/>
      <text class="node-label-dark" x="60" y="22" text-anchor="middle">Set</text>
    </g>
 
    <!-- LIST CHILDREN -->
    <path class="connector" d="M 160 190 L 160 210"/>
    <polygon points="156,208 160,216 164,208" fill="#6b6258"/>
    <g transform="translate(100, 216)">
      <rect class="node-bg-class" width="120" height="34" rx="2"/>
      <text class="node-label-light" x="60" y="22" text-anchor="middle">ArrayList</text>
    </g>
    <path class="connector" d="M 160 250 L 160 270"/>
    <polygon points="156,268 160,276 164,268" fill="#6b6258"/>
    <g transform="translate(100, 276)">
      <rect class="node-bg-class" width="120" height="34" rx="2"/>
      <text class="node-label-light" x="60" y="22" text-anchor="middle">LinkedList</text>
    </g>
    <path class="connector" d="M 160 310 L 160 330"/>
    <polygon points="156,328 160,336 164,328" fill="#6b6258"/>
    <g transform="translate(100, 336)">
      <rect class="node-bg-class" width="120" height="34" rx="2"/>
      <text class="node-label-light" x="60" y="22" text-anchor="middle">Vector</text>
    </g>
    <!-- Vector -> Stack with accent -->
    <path class="connector-accent" d="M 160 370 L 160 396"/>
    <polygon points="155,394 160,404 165,394" fill="#c44536"/>
    
    <!-- Fix: Group handles translation, inner #stack-node handles CSS scale transform -->
    <g transform="translate(100, 404)">
      <g id="stack-node">
        <rect class="node-bg-stack" width="120" height="34" rx="2"/>
        <text class="node-label-light" x="60" y="22" text-anchor="middle">Stack</text>
      </g>
    </g>
    
    <text class="annotation" x="232" y="426">← you are here</text>
 
    <!-- QUEUE CHILDREN -->
    <path class="connector" d="M 400 190 L 400 210"/>
    <polygon points="396,208 400,216 404,208" fill="#6b6258"/>
    <g transform="translate(340, 216)">
      <rect class="node-bg-class" width="120" height="34" rx="2"/>
      <text class="node-label-light" x="60" y="22" text-anchor="middle">PriorityQueue</text>
    </g>
    <path class="connector" d="M 400 250 L 400 276"/>
    <polygon points="396,274 400,282 404,274" fill="#6b6258"/>
    <g transform="translate(340, 282)">
      <rect class="node-bg-interface" width="120" height="34" rx="2"/>
      <text class="node-label-dark" x="60" y="22" text-anchor="middle">Deque</text>
    </g>
    <path class="connector" d="M 400 316 L 400 336"/>
    <polygon points="396,334 400,342 404,334" fill="#6b6258"/>
    <g transform="translate(340, 342)">
      <rect class="node-bg-class" width="120" height="34" rx="2"/>
      <text class="node-label-light" x="60" y="22" text-anchor="middle">ArrayDeque</text>
    </g>
 
    <!-- SET CHILDREN -->
    <path class="connector" d="M 640 190 L 640 210"/>
    <polygon points="636,208 640,216 644,208" fill="#6b6258"/>
    <g transform="translate(580, 216)">
      <rect class="node-bg-class" width="120" height="34" rx="2"/>
      <text class="node-label-light" x="60" y="22" text-anchor="middle">HashSet</text>
    </g>
    <path class="connector" d="M 640 250 L 640 270"/>
    <polygon points="636,268 640,276 644,268" fill="#6b6258"/>
    <g transform="translate(580, 276)">
      <rect class="node-bg-class" width="120" height="34" rx="2"/>
      <text class="node-label-light" x="60" y="22" text-anchor="middle">LinkedHashSet</text>
    </g>
    <path class="connector" d="M 640 310 L 640 336"/>
    <polygon points="636,334 640,342 644,334" fill="#6b6258"/>
    <g transform="translate(580, 342)">
      <rect class="node-bg-interface" width="120" height="34" rx="2"/>
      <text class="node-label-dark" x="60" y="22" text-anchor="middle">SortedSet</text>
    </g>
    <path class="connector" d="M 640 376 L 640 396"/>
    <polygon points="636,394 640,402 644,394" fill="#6b6258"/>
    <g transform="translate(580, 402)">
      <rect class="node-bg-class" width="120" height="34" rx="2"/>
      <text class="node-label-light" x="60" y="22" text-anchor="middle">TreeSet</text>
    </g>
  </svg>
 
  <div class="caption">
    Notice how <strong>Stack</strong> lives under <strong>Vector</strong>, which lives under <strong>List</strong>. That's because a stack is, fundamentally, a kind of list — just one with strict rules about where you can poke at it.
  </div>
</div>
</body>
</html>
```

The piece I want you to notice: **`Stack`** **lives under** **`Vector`, which lives under** **`List`**. That's a hint about what a stack actually is.

### What's a List, Again?

A **List** is an Abstract Data Type (ADT) that stores items in a sequential order. Think of:

* a list of students in a class

* a list of available hotel rooms

* a list of books on a shelf

The common operations you can do on a list:

* **Retrieve** an element

* **Insert** a new element

* **Delete** an element

* Check how many elements it has

* Check whether some element is inside

* Check if it's empty

There are two classic ways to *implement* a list under the hood:

1. **Using an array** — fast random access by index, but inserting/removing from the middle is slow (you have to shift everything).
2. **Using a linked list** — fast insertion/deletion anywhere, but slower to jump to a specific index.

Keep this trade-off in your back pocket. It's going to come up again very soon.

:::info
**Quick mental model:** an array is like a row of numbered lockers — you can open locker #47 instantly, but rearranging them is a pain. A linked list is like a treasure hunt — each clue points to the next, so inserting a new clue is easy, but finding the 47th clue means following 46 others first.
:::

## Introducing the Stack

Here's the one-sentence definition you should remember forever:

:::info
**A stack is a list where elements are accessed, inserted, and deleted only from one end — called the** ***top***.
:::

That's it. Everything else about stacks follows from this constraint.

### The LIFO Principle

Because you can only add and remove from the top, the *last* item you put in is always the *first* item you take out. We call this **LIFO**: **Last-In, First-Out**.

Think of a stack of plates in a cafeteria:

```
        🍽️   ← top (last one placed, first one taken)
        🍽️
        🍽️
        🍽️   ← bottom
```

You don't pull a plate from the middle of the stack — you take the one on top. If you want the bottom plate, tough luck, you have to remove all the ones above it first.

Other real-world examples:

* A pile of pancakes (the one on top gets eaten first)

* The browser's back button history (last page you visited is the first one you go back to)

* The "undo" function in your text editor (your last action is the first to be undone)

### The Three Core Methods

Every stack supports three fundamental operations:

| Method                | What it does                                  |
| --------------------- | --------------------------------------------- |
| `push(x)`             | Adds element `x` to the top                   |
| `pop()`               | Removes **and returns** the top element       |
| `peek()` (or `top()`) | Returns the top element *without* removing it |

Sometimes you'll also see:

* `isEmpty()` — returns `true` if the stack has no elements

* `size()` (or `getSize()`) — returns how many elements are in the stack

That's the entire stack interface. Beautifully small.

### A Worked Example

Let's trace through what happens with the following operations:

```
1. Push A
2. Push B
3. Push C
4. Pop  (removes C)
5. Pop  (removes B)
6. Push D
```

Here's what the stack looks like after each step:

```custom-html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Stack Operations Walkthrough</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f5efe4;
    --paper: #fbf6ec;
    --ink: #1a1612;
    --ink-soft: #6b6258;
    --rule: #d8cfc0;
    --accent: #c44536;
    --accent-soft: #e8b9b3;
    --teal: #2c5f5d;
    --gold: #b08e3c;
    --green: #4a7c4d;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Fraunces', Georgia, serif;
    padding: 2rem 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .widget {
    width: 100%;
    max-width: 820px;
    background: var(--paper);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 2rem 1.5rem 2.5rem;
    position: relative;
    box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 20px 40px -20px rgba(26,22,18,0.12);
  }
  .widget::before {
    content: "FIG. 02 · INTERACTIVE";
    position: absolute;
    top: 1rem; right: 1.25rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    color: var(--ink-soft);
  }
  h1 {
    font-family: 'Fraunces', serif;
    font-weight: 600;
    font-size: 1.5rem;
    font-variation-settings: "opsz" 96;
    margin-bottom: 0.25rem;
    letter-spacing: -0.01em;
  }
  .subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--ink-soft);
    letter-spacing: 0.05em;
    margin-bottom: 1.5rem;
    text-transform: uppercase;
  }
 
  .timeline {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    margin-bottom: 1.75rem;
  }
  .step {
    padding: 0.5rem 0.4rem;
    border: 1px solid var(--rule);
    background: transparent;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    text-align: center;
    color: var(--ink-soft);
    transition: all 0.3s ease;
  }
  .step.done {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }
  .step.active {
    background: var(--accent);
    color: var(--paper);
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px -2px rgba(196,69,54,0.4);
  }
  .step-num {
    display: block;
    font-size: 0.6rem;
    opacity: 0.6;
    margin-bottom: 2px;
  }
 
  .main {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 2rem;
    align-items: center;
  }
  @media (max-width: 600px) {
    .main { grid-template-columns: 1fr; }
  }
 
  .stack-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 280px;
    justify-content: flex-end;
    position: relative;
  }
  .top-label {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 0.95rem;
    color: var(--accent);
    margin-bottom: 0.5rem;
    height: 1.5em;
    transition: opacity 0.3s;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .top-label::after {
    content: "↓";
    font-size: 1.2rem;
  }
  .top-label.hidden { opacity: 0; }
  .stack-container {
    width: 100px;
    border-left: 2px solid var(--ink);
    border-right: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    min-height: 200px;
    display: flex;
    flex-direction: column-reverse;
    padding: 4px;
    background: var(--bg);
  }
  .stack-cell {
    height: 44px;
    background: var(--ink);
    color: var(--paper);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.2rem;
    font-weight: 600;
    margin-top: 4px;
    border-radius: 2px;
    animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .stack-cell.popping {
    animation: slideOut 0.4s ease-in forwards;
  }
  .stack-cell.top-cell {
    background: var(--accent);
  }
  @keyframes slideIn {
    from { transform: translateY(-60px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideOut {
    to { transform: translateY(-60px); opacity: 0; }
  }
  .empty-msg {
    font-family: 'Fraunces', serif;
    font-style: italic;
    color: var(--ink-soft);
    align-self: center;
    margin: auto;
  }
 
  .narration {
    padding: 1.5rem;
    background: var(--bg);
    border: 1px solid var(--rule);
    border-radius: 4px;
  }
  .narration-action {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 0.75rem;
  }
  .narration-action .verb {
    color: var(--accent);
  }
  .narration-text {
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--ink-soft);
  }
  .narration-text strong { color: var(--ink); font-weight: 600; }
 
  .controls {
    display: flex;
    gap: 0.6rem;
    margin-top: 1.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--rule);
    flex-wrap: wrap;
  }
  button {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0.7rem 1.2rem;
    border: 1px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 2px;
  }
  button:hover:not(:disabled) {
    background: var(--ink);
    color: var(--paper);
  }
  button.primary {
    background: var(--ink);
    color: var(--paper);
  }
  button.primary:hover:not(:disabled) {
    background: var(--accent);
    border-color: var(--accent);
  }
  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .progress {
    margin-left: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--ink-soft);
    align-self: center;
  }
</style>
</head>
<body>
<div class="widget">
  <h1>Stack Operations, Step by Step</h1>
  <div class="subtitle">— Push A · B · C · Pop C · Pop B · Push D —</div>
 
  <div class="timeline" id="timeline"></div>
 
  <div class="main">
    <div class="stack-zone">
      <div class="top-label hidden" id="top-label">top</div>
      <div class="stack-container" id="stack"></div>
    </div>
 
    <div class="narration">
      <div class="narration-action" id="action">Ready to begin</div>
      <div class="narration-text" id="explanation">
        We'll trace through six operations on an initially empty stack. Click <strong>Next step</strong> to advance.
      </div>
    </div>
  </div>
 
  <div class="controls">
    <button id="prev-btn" disabled>← Back</button>
    <button id="next-btn" class="primary">Next step →</button>
    <button id="reset-btn">Reset</button>
    <span class="progress" id="progress">0 / 6</span>
  </div>
</div>
 
<script>
  const operations = [
    { verb: 'push', value: 'A', text: 'We push <strong>A</strong> onto an empty stack. It sits at the bottom — but for now, it\'s also the top.' },
    { verb: 'push', value: 'B', text: 'We push <strong>B</strong>. It goes on top of A. The "top" pointer now refers to B.' },
    { verb: 'push', value: 'C', text: 'We push <strong>C</strong>. The stack now reads (bottom → top): A, B, C.' },
    { verb: 'pop',  value: 'C', text: 'We pop. Out comes <strong>C</strong> — the most recent arrival. This is LIFO: the last one in is the first one out.' },
    { verb: 'pop',  value: 'B', text: 'Another pop. <strong>B</strong> leaves. A is now alone at the bottom, and also the top.' },
    { verb: 'push', value: 'D', text: 'Finally we push <strong>D</strong>. The stack now holds A at the bottom and D at the top. B and C are gone forever.' }
  ];
 
  let step = 0; // 0 = before any operation; 1-6 = after operations[step-1]
  let stack = [];
 
  const stackEl = document.getElementById('stack');
  const topLabel = document.getElementById('top-label');
  const actionEl = document.getElementById('action');
  const explainEl = document.getElementById('explanation');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const resetBtn = document.getElementById('reset-btn');
  const progressEl = document.getElementById('progress');
  const timeline = document.getElementById('timeline');
 
  // Build timeline
  operations.forEach((op, i) => {
    const div = document.createElement('div');
    div.className = 'step';
    div.dataset.index = i;
    div.innerHTML = `<span class="step-num">STEP ${i+1}</span>${op.verb === 'push' ? 'Push' : 'Pop'} ${op.value}`;
    timeline.appendChild(div);
  });
 
  function render(animate = true) {
    // Render stack
    stackEl.innerHTML = '';
    if (stack.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-msg';
      empty.textContent = '(empty)';
      stackEl.appendChild(empty);
      topLabel.classList.add('hidden');
    } else {
      stack.forEach((v, i) => {
        const cell = document.createElement('div');
        cell.className = 'stack-cell';
        if (i === stack.length - 1) cell.classList.add('top-cell');
        if (!animate) cell.style.animation = 'none';
        cell.textContent = v;
        stackEl.appendChild(cell);
      });
      topLabel.classList.remove('hidden');
    }
 
    // Narration
    if (step === 0) {
      actionEl.innerHTML = 'Ready to begin';
      explainEl.innerHTML = 'We\'ll trace through six operations on an initially empty stack. Click <strong>Next step</strong> to advance.';
    } else {
      const op = operations[step - 1];
      actionEl.innerHTML = `<span class="verb">${op.verb === 'push' ? 'PUSH' : 'POP'}</span> ${op.value}`;
      explainEl.innerHTML = op.text;
    }
 
    // Timeline
    document.querySelectorAll('.step').forEach((el, i) => {
      el.classList.remove('done', 'active');
      if (i < step - 1) el.classList.add('done');
      if (i === step - 1) el.classList.add('active');
    });
 
    // Controls
    prevBtn.disabled = step === 0;
    nextBtn.disabled = step === operations.length;
    progressEl.textContent = `${step} / ${operations.length}`;
  }
 
  function next() {
    if (step >= operations.length) return;
    const op = operations[step];
    if (op.verb === 'push') stack.push(op.value);
    else stack.pop();
    step++;
    render();
  }
 
  function prev() {
    if (step === 0) return;
    step--;
    // Replay from scratch
    stack = [];
    for (let i = 0; i < step; i++) {
      const op = operations[i];
      if (op.verb === 'push') stack.push(op.value);
      else stack.pop();
    }
    render(false);
  }
 
  function reset() {
    step = 0;
    stack = [];
    render(false);
  }
 
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  resetBtn.addEventListener('click', reset);
 
  render(false);
</script>
</body>
</html>
```

After step 6, the stack contains `A` at the bottom and `D` at the top. Notice that `B` and `C` are gone — they were popped off and are no longer in the structure.

> **Try it yourself:** there's a great interactive visualization at [Daniel Liang's Stack Animation](https://yongdanielliang.github.io/animation/web/Stack.html). Highly recommended for getting an intuitive feel.

## Implementing a Stack in Java

Now for the fun part — building one ourselves.

### Why an ArrayList Works So Well

Recall the trade-off between arrays and linked lists. With a stack, we **only ever add and remove from one end**. That's exactly the operation that arrays are *fast* at. We don't need fancy middle-insertion — we just need a fast `add to end` and `remove from end`, both of which are O(1) on an ArrayList.

So for a stack, an ArrayList is the more efficient backing structure.

Conceptually:

```custom-html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Stack as ArrayList</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f5efe4;
    --paper: #fbf6ec;
    --ink: #1a1612;
    --ink-soft: #6b6258;
    --rule: #d8cfc0;
    --accent: #c44536;
    --teal: #2c5f5d;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Fraunces', Georgia, serif;
    padding: 2rem 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .widget {
    width: 100%;
    max-width: 820px;
    background: var(--paper);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 2rem 1.5rem 2.5rem;
    position: relative;
    box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 20px 40px -20px rgba(26,22,18,0.12);
  }
  .widget::before {
    content: "FIG. 03";
    position: absolute;
    top: 1rem; right: 1.25rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    color: var(--ink-soft);
  }
  h1 {
    font-family: 'Fraunces', serif;
    font-weight: 600;
    font-size: 1.5rem;
    font-variation-settings: "opsz" 96;
    margin-bottom: 0.25rem;
    letter-spacing: -0.01em;
  }
  .subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--ink-soft);
    letter-spacing: 0.05em;
    margin-bottom: 2rem;
    text-transform: uppercase;
  }
  svg { width: 100%; height: auto; display: block; }
  .label-title {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 16px;
    fill: var(--ink);
  }
  .label-small {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    fill: var(--ink-soft);
  }
  .label-cell {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 600;
    fill: var(--paper);
  }
  .label-top {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 14px;
    fill: var(--accent);
  }
  .cell { fill: var(--ink); }
  .cell-top { fill: var(--accent); }
  .border { stroke: var(--ink); stroke-width: 2; fill: none; }
  .pointer { stroke: var(--accent); stroke-width: 1.5; fill: none; }
  .pointer-dashed {
    stroke: var(--accent);
    stroke-width: 1.2;
    fill: none;
    stroke-dasharray: 4 3;
    opacity: 0.7;
  }
  .caption {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--rule);
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--ink-soft);
  }
  .caption strong { color: var(--ink); font-weight: 600; }
  .caption .accent { color: var(--accent); font-weight: 600; }
</style>
</head>
<body>
<div class="widget">
  <h1>How a Stack Maps onto an ArrayList</h1>
  <div class="subtitle">— Conceptual model · Implementation —</div>
 
  <svg viewBox="0 0 800 320" xmlns="http://www.w3.org/2000/svg">
    <!-- LEFT: Conceptual vertical stack -->
    <text class="label-title" x="120" y="30" text-anchor="middle">Conceptually</text>
    <text class="label-small" x="120" y="48" text-anchor="middle">a vertical stack</text>
 
    <text class="label-top" x="58" y="82" text-anchor="end">top →</text>
    <!-- container with open top -->
    <path class="border" d="M 70 70 L 70 220 L 170 220 L 170 70"/>
    <!-- cells: A bottom, B middle, C top -->
    <rect class="cell" x="74" y="174" width="92" height="42" rx="2"/>
    <text class="label-cell" x="120" y="201" text-anchor="middle">A</text>
    <rect class="cell" x="74" y="128" width="92" height="42" rx="2"/>
    <text class="label-cell" x="120" y="155" text-anchor="middle">B</text>
    <rect class="cell-top" x="74" y="82" width="92" height="42" rx="2"/>
    <text class="label-cell" x="120" y="109" text-anchor="middle">C</text>
    <text class="label-small" x="120" y="240" text-anchor="middle">↑ bottom</text>
 
    <!-- MIDDLE: Mapping arrow + equals -->
    <g transform="translate(260, 145)">
      <text x="0" y="0" class="label-title" style="font-size:20px;">≡</text>
      <text class="label-small" x="0" y="22">same data,</text>
      <text class="label-small" x="0" y="36">rotated 90°</text>
    </g>
 
    <!-- RIGHT: Horizontal ArrayList -->
    <text class="label-title" x="540" y="30" text-anchor="middle">In Java</text>
    <text class="label-small" x="540" y="48" text-anchor="middle">a horizontal ArrayList</text>
 
    <!-- Array cells -->
    <g transform="translate(370, 120)">
      <rect class="cell" x="0" y="0" width="60" height="50" rx="2"/>
      <text class="label-cell" x="30" y="32" text-anchor="middle">A</text>
      <text class="label-small" x="30" y="68" text-anchor="middle">[0]</text>
 
      <rect class="cell" x="68" y="0" width="60" height="50" rx="2"/>
      <text class="label-cell" x="98" y="32" text-anchor="middle">B</text>
      <text class="label-small" x="98" y="68" text-anchor="middle">[1]</text>
 
      <rect class="cell-top" x="136" y="0" width="60" height="50" rx="2"/>
      <text class="label-cell" x="166" y="32" text-anchor="middle">C</text>
      <text class="label-small" x="166" y="68" text-anchor="middle">[2]</text>
 
      <rect x="204" y="0" width="60" height="50" rx="2" fill="none" stroke="#d8cfc0" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text class="label-small" x="234" y="32" text-anchor="middle" style="opacity:0.5">?</text>
      <text class="label-small" x="234" y="68" text-anchor="middle">[3]</text>
 
      <rect x="272" y="0" width="60" height="50" rx="2" fill="none" stroke="#d8cfc0" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text class="label-small" x="302" y="32" text-anchor="middle" style="opacity:0.5">?</text>
      <text class="label-small" x="302" y="68" text-anchor="middle">[4]</text>
    </g>
 
    <!-- Pointers labels for array -->
    <text class="label-small" x="400" y="206" text-anchor="middle" style="fill:var(--ink-soft)">front</text>
    <text class="label-top" x="536" y="206" text-anchor="middle">back = top</text>
 
    <!-- Curly bracket showing "size" -->
    <path d="M 370 230 Q 370 245, 380 245 L 460 245 Q 470 245, 470 255 Q 470 245, 480 245 L 560 245 Q 570 245, 570 230" class="pointer-dashed" style="opacity:0.5"/>
    <text class="label-small" x="470" y="270" text-anchor="middle" style="font-style:italic; font-family:'Fraunces',serif;">size = 3</text>
 
    <!-- Dashed correspondence lines from conceptual to array -->
    <path class="pointer-dashed" d="M 168 104 C 240 100, 320 130, 530 138"/>
    <path class="pointer-dashed" d="M 168 150 C 240 155, 320 155, 460 138"/>
    <path class="pointer-dashed" d="M 168 196 C 240 195, 320 175, 396 138"/>
  </svg>
 
  <div class="caption">
    The picture you draw in your head — a vertical pile with the newest item on top — is exactly the same data as a horizontal ArrayList. The <span class="accent">top of the stack</span> corresponds to the <span class="accent">back of the array</span>. Push appends to the end. Pop removes from the end. Both are O(1) operations, which is why an ArrayList is the natural choice for backing a stack.
  </div>
</div>
</body>
</html>
```

The top of the stack corresponds to the *end* of the array list. The bottom is index 0.

### Two Design Choices: Inheritance vs Composition

When designing the `GenericStack` class, we have two ways to use ArrayList under the hood:

<br />

```custom-html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Inheritance vs Composition</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f5efe4;
    --paper: #fbf6ec;
    --ink: #1a1612;
    --ink-soft: #6b6258;
    --rule: #d8cfc0;
    --accent: #c44536;
    --teal: #2c5f5d;
    --green: #4a7c4d;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Fraunces', Georgia, serif;
    padding: 2rem 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .widget {
    width: 100%;
    max-width: 820px;
    background: var(--paper);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 2rem 1.5rem 2.5rem;
    position: relative;
    box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 20px 40px -20px rgba(26,22,18,0.12);
  }
  .widget::before {
    content: "FIG. 04";
    position: absolute;
    top: 1rem; right: 1.25rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    color: var(--ink-soft);
  }
  h1 {
    font-family: 'Fraunces', serif;
    font-weight: 600;
    font-size: 1.5rem;
    font-variation-settings: "opsz" 96;
    margin-bottom: 0.25rem;
    letter-spacing: -0.01em;
  }
  .subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--ink-soft);
    letter-spacing: 0.05em;
    margin-bottom: 2rem;
    text-transform: uppercase;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  @media (max-width: 600px) {
    .grid { grid-template-columns: 1fr; }
  }
  .approach {
    border: 1px solid var(--rule);
    padding: 1.5rem 1.25rem;
    background: var(--bg);
    border-radius: 3px;
    display: flex;
    flex-direction: column;
  }
  .approach-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    color: var(--ink-soft);
    margin-bottom: 0.3rem;
    text-transform: uppercase;
  }
  .approach-name {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 1.3rem;
    margin-bottom: 0.2rem;
    color: var(--ink);
  }
  .approach-relation {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--ink-soft);
    margin-bottom: 1.25rem;
  }
  .approach-relation .key {
    color: var(--accent);
    font-weight: 600;
  }
  .diagram {
    background: var(--paper);
    border: 1px solid var(--rule);
    padding: 1rem 0.5rem;
    margin-bottom: 1.25rem;
  }
  .verdict {
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--ink-soft);
    margin-top: auto;
  }
  .verdict .good { color: var(--green); font-weight: 600; font-style: normal; }
  .verdict .bad { color: var(--accent); font-weight: 600; font-style: normal; }
 
  svg { width: 100%; height: auto; display: block; }
  .box { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
  .box-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    fill: var(--ink);
    font-weight: 500;
  }
  .arrow { stroke: var(--ink-soft); stroke-width: 1.2; fill: none; }
 
  .conclusion {
    margin-top: 1.5rem;
    padding: 1.25rem;
    background: var(--ink);
    color: var(--paper);
    border-radius: 3px;
    font-size: 0.95rem;
    line-height: 1.55;
  }
  .conclusion strong {
    color: var(--accent);
    font-family: 'Fraunces', serif;
    font-weight: 600;
    font-style: italic;
  }
</style>
</head>
<body>
<div class="widget">
  <h1>Two Ways to Build a Stack on Top of ArrayList</h1>
  <div class="subtitle">— Inheritance vs Composition —</div>
 
  <div class="grid">
 
    <!-- INHERITANCE -->
    <div class="approach">
      <div class="approach-tag">Approach 01</div>
      <div class="approach-name">Inheritance</div>
      <div class="approach-relation">GenericStack <span class="key">IS-A</span> ArrayList</div>
 
      <div class="diagram">
        <svg viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg">
          <rect class="box" x="10" y="30" width="100" height="40" rx="2"/>
          <text class="box-label" x="60" y="55" text-anchor="middle">ArrayList</text>
 
          <!-- empty triangle arrow (inheritance) -->
          <line class="arrow" x1="110" y1="50" x2="160" y2="50"/>
          <polygon points="160,42 160,58 175,50" fill="none" stroke="#6b6258" stroke-width="1.2"/>
 
          <rect class="box" x="175" y="30" width="100" height="40" rx="2"/>
          <text class="box-label" x="225" y="55" text-anchor="middle">GenericStack</text>
 
          <text x="143" y="22" text-anchor="middle" style="font-family:'Fraunces',serif; font-style:italic; font-size:11px; fill:#6b6258;">extends</text>
        </svg>
      </div>
 
      <div class="verdict">
        <span class="bad">×</span> Inherits <em>everything</em> from ArrayList — including <code style="font-family:'JetBrains Mono',monospace; font-size:0.85em;">add(index, o)</code> and <code style="font-family:'JetBrains Mono',monospace; font-size:0.85em;">remove(index)</code>. A user could insert in the middle and break the stack discipline.
      </div>
    </div>
 
    <!-- COMPOSITION -->
    <div class="approach">
      <div class="approach-tag">Approach 02 · Preferred</div>
      <div class="approach-name">Composition</div>
      <div class="approach-relation">GenericStack <span class="key">HAS-A</span> ArrayList</div>
 
      <div class="diagram">
        <svg viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg">
          <rect class="box" x="10" y="30" width="100" height="40" rx="2"/>
          <text class="box-label" x="60" y="55" text-anchor="middle">GenericStack</text>
 
          <!-- diamond arrow (composition) -->
          <line class="arrow" x1="110" y1="50" x2="160" y2="50"/>
          <polygon points="110,50 122,44 134,50 122,56" fill="#1a1612" stroke="#1a1612" stroke-width="1.2"/>
 
          <rect class="box" x="175" y="30" width="100" height="40" rx="2"/>
          <text class="box-label" x="225" y="55" text-anchor="middle">ArrayList</text>
 
          <text x="143" y="22" text-anchor="middle" style="font-family:'Fraunces',serif; font-style:italic; font-size:11px; fill:#6b6258;">private field</text>
        </svg>
      </div>
 
      <div class="verdict">
        <span class="good">✓</span> ArrayList is hidden inside as a private field. Only <code style="font-family:'JetBrains Mono',monospace; font-size:0.85em;">push</code>, <code style="font-family:'JetBrains Mono',monospace; font-size:0.85em;">pop</code>, <code style="font-family:'JetBrains Mono',monospace; font-size:0.85em;">peek</code> are exposed. The stack contract stays intact.
      </div>
    </div>
 
  </div>
 
  <div class="conclusion">
    The principle: <strong>composition gives encapsulation; inheritance leaks the abstraction.</strong> When the parent class has more capabilities than your subclass should expose, prefer holding it as a field instead of inheriting from it.
  </div>
</div>
</body>
</html>
```

Composition lets us hide the ArrayList completely and only expose the stack operations we want. **Composition gives us encapsulation; inheritance leaks the abstraction.**

### The GenericStack Class

Here's the full implementation using composition:

```java
public class GenericStack<E> {
    private java.util.ArrayList<E> list = new java.util.ArrayList<>();
 
    public int getSize() {
        return list.size();
    }
 
    public E peek() {
        return list.get(getSize() - 1);
    }
 
    public void push(E o) {
        list.add(o);
    }
 
    public E pop() {
        E o = list.get(getSize() - 1);
        list.remove(getSize() - 1);
        return o;
    }
 
    public boolean isEmpty() {
        return list.isEmpty();
    }
 
    @Override
    public String toString() {
        return "stack: " + list.toString();
    }
}
```

Let's read through it:

* The `<E>` makes it **generic** — you can have a `GenericStack<String>`, a `GenericStack<Integer>`, whatever you need.

* `push(o)` is literally just `list.add(o)` — adding to the end.

* `peek()` is `list.get(size - 1)` — looking at the last element.

* `pop()` reads the last element, removes it from the list, and returns it.

### Handling the Empty Case

There's a subtle problem: what if someone calls `pop()` or `peek()` on an empty stack? You'd get an `IndexOutOfBoundsException` — not very informative.

A cleaner approach is to check first and throw a meaningful exception:

```java
public E pop() {
    if (isEmpty()) {
        throw new EmptyStackException();
    }
    E o = list.get(getSize() - 1);
    list.remove(getSize() - 1);
    return o;
}
```

This is what Java's own built-in `java.util.Stack` does. When you write production code, you'd want this kind of defensive check.

### Testing It Out

```java
public class TestGenericStack {
    public static void main(String[] args) {
        GenericStack<String> stack = new GenericStack<>();
 
        stack.push("Tom");
        System.out.println("(1) " + stack);
 
        stack.push("Susan");
        System.out.println("(2) " + stack);
 
        stack.push("Kim");
        stack.push("Michael");
        System.out.println("(3) " + stack);
 
        System.out.println("(4) " + stack.pop());
        System.out.println("(5) " + stack.pop());
        System.out.println("(6) " + stack);
    }
}
```

Output:

```
(1) stack: [Tom]
(2) stack: [Tom, Susan]
(3) stack: [Tom, Susan, Kim, Michael]
(4) Michael
(5) Kim
(6) stack: [Tom, Susan]
```

Notice how `Michael` came out first (he was pushed last), then `Kim`. That's LIFO in action.

## Postfix Evaluation: A Real Use Case for Stacks

This is where stacks earn their keep. Let me show you a beautiful application.

### What Is Postfix Notation?

You've been writing math your whole life like this:

```
3 + 4
```

That's called **infix** notation — the operator (`+`) is *in between* the operands. It's how humans read math.

But there's another way to write expressions: **postfix** notation, also called **Reverse Polish Notation (RPN)**, where the operator comes *after* its operands:

```
3 4 +
```

It looks weird at first, but RPN has three wonderful properties:

1. **No precedence rules needed.** You don't have to memorize PEMDAS / BODMAS.
2. **No parentheses needed.** Ever.
3. **Faster for computers to evaluate** — fewer memory accesses.

### Infix → Postfix Examples

| Infix               | Postfix (RPN)       | Why                                                           |
| ------------------- | ------------------- | ------------------------------------------------------------- |
| `a + b * c`         | `a b c * +`         | `*` binds tighter than `+`, so it's computed first            |
| `(a + b) * c`       | `a b + c *`         | Parentheses force `+` first                                   |
| `(a*b + c) / d + e` | `a b * c + d / e +` | Inner subexpression first, then division, then final addition |

Read each postfix expression left to right and you'll notice: **every operator immediately follows its two operands**. That's the rule.

### The Stack-Based Algorithm

Here's the magical part. Evaluating a postfix expression is shockingly simple with a stack:

```
1. Scan the expression left to right, token by token.
2. If the token is an OPERAND (a number):
       → push it onto the stack.
3. If the token is an OPERATOR (+, -, *, /, ^):
       → pop two operands off the stack
         (the first pop is the right operand,
          the second pop is the left operand)
       → compute: left OPERATOR right
       → push the result back onto the stack.
4. When done, the single value left on the stack is the answer.
```

That's the whole algorithm.

### Try It Yourself

Below is a fully interactive postfix evaluator. Type any expression (with spaces between every token) or pick one of the presets, then step through it. The stack on the right updates with each step. The two red presets are intentionally malformed — see how the algorithm catches the errors.

```custom-html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Postfix Evaluator</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f5efe4;
    --paper: #fbf6ec;
    --ink: #1a1612;
    --ink-soft: #6b6258;
    --rule: #d8cfc0;
    --accent: #c44536;
    --accent-soft: #e8b9b3;
    --teal: #2c5f5d;
    --green: #4a7c4d;
    --gold: #b08e3c;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Fraunces', Georgia, serif;
    padding: 2rem 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .widget {
    width: 100%;
    max-width: 880px;
    background: var(--paper);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 2rem 1.5rem 2.5rem;
    position: relative;
    box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 20px 40px -20px rgba(26,22,18,0.12);
  }
  .widget::before {
    content: "FIG. 05 · INTERACTIVE";
    position: absolute;
    top: 1rem; right: 1.25rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    color: var(--ink-soft);
  }
  h1 {
    font-family: 'Fraunces', serif;
    font-weight: 600;
    font-size: 1.5rem;
    font-variation-settings: "opsz" 96;
    margin-bottom: 0.25rem;
    letter-spacing: -0.01em;
  }
  .subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--ink-soft);
    letter-spacing: 0.05em;
    margin-bottom: 1.5rem;
    text-transform: uppercase;
  }
 
  .input-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }
  input[type="text"] {
    flex: 1;
    min-width: 200px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 1rem;
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    border-radius: 2px;
    outline: none;
  }
  input[type="text"]:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(196,69,54,0.15);
  }
  button {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0.7rem 1.1rem;
    border: 1px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 2px;
  }
  button:hover:not(:disabled) {
    background: var(--ink);
    color: var(--paper);
  }
  button.primary {
    background: var(--ink);
    color: var(--paper);
  }
  button.primary:hover:not(:disabled) {
    background: var(--accent);
    border-color: var(--accent);
  }
  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
 
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.5rem;
    align-items: center;
  }
  .presets-label {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 0.85rem;
    color: var(--ink-soft);
    margin-right: 0.3rem;
  }
  .preset-chip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    padding: 0.35rem 0.7rem;
    background: transparent;
    border: 1px solid var(--rule);
    color: var(--ink-soft);
    border-radius: 99px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .preset-chip:hover {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }
  .preset-chip.error-preset {
    border-color: var(--accent-soft);
    color: var(--accent);
  }
  .preset-chip.error-preset:hover {
    background: var(--accent);
    color: var(--paper);
    border-color: var(--accent);
  }
 
  .stage {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 1.5rem;
    margin-top: 1rem;
  }
  @media (max-width: 640px) {
    .stage { grid-template-columns: 1fr; }
  }
 
  .left-pane {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
 
  .tokens {
    padding: 1rem;
    background: var(--bg);
    border: 1px solid var(--rule);
    border-radius: 3px;
  }
  .tokens-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    color: var(--ink-soft);
    margin-bottom: 0.6rem;
    text-transform: uppercase;
  }
  .tokens-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .token {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.05rem;
    font-weight: 600;
    padding: 0.45rem 0.75rem;
    min-width: 42px;
    text-align: center;
    border: 1.5px solid var(--rule);
    background: var(--paper);
    color: var(--ink-soft);
    border-radius: 3px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .token.done {
    border-color: var(--ink);
    color: var(--ink);
    opacity: 0.5;
  }
  .token.current {
    background: var(--accent);
    color: var(--paper);
    border-color: var(--accent);
    transform: translateY(-3px) scale(1.08);
    box-shadow: 0 6px 12px -4px rgba(196,69,54,0.4);
  }
  .token.error {
    background: var(--accent);
    color: var(--paper);
    border-color: var(--accent);
    animation: shake 0.4s ease-in-out;
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
 
  .narration {
    padding: 1rem 1.25rem;
    background: var(--bg);
    border: 1px solid var(--rule);
    border-radius: 3px;
    min-height: 90px;
  }
  .narration-action {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 0.4rem;
  }
  .narration-text {
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--ink-soft);
  }
  .narration-text .num {
    font-family: 'JetBrains Mono', monospace;
    color: var(--ink);
    font-weight: 600;
  }
  .narration-text .op {
    color: var(--accent);
    font-weight: 600;
  }
  .narration.error .narration-action { color: var(--accent); }
  .narration.success .narration-action { color: var(--green); }
 
  .result-box {
    padding: 1rem 1.25rem;
    background: var(--ink);
    color: var(--paper);
    border-radius: 3px;
    display: none;
  }
  .result-box.visible { display: block; }
  .result-box.error { background: var(--accent); }
  .result-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    opacity: 0.7;
    margin-bottom: 0.3rem;
    text-transform: uppercase;
  }
  .result-value {
    font-family: 'Fraunces', serif;
    font-size: 1.8rem;
    font-weight: 600;
    font-variation-settings: "opsz" 96;
  }
 
  .right-pane {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .stack-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    color: var(--ink-soft);
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    align-self: flex-start;
    margin-left: 0.5rem;
  }
  .top-marker {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 0.9rem;
    color: var(--accent);
    height: 1.4em;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .top-marker.visible { opacity: 1; }
  .top-marker::after { content: "↓"; }
  .stack-bucket {
    width: 120px;
    border-left: 2px solid var(--ink);
    border-right: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    min-height: 240px;
    display: flex;
    flex-direction: column-reverse;
    padding: 5px;
    background: var(--bg);
  }
  .stack-item {
    height: 42px;
    background: var(--ink);
    color: var(--paper);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 1rem;
    font-weight: 600;
    margin-top: 5px;
    border-radius: 2px;
    animation: stackIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .stack-item.is-top { background: var(--accent); }
  @keyframes stackIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .stack-empty {
    margin: auto;
    font-family: 'Fraunces', serif;
    font-style: italic;
    color: var(--ink-soft);
    font-size: 0.85rem;
  }
 
  .controls {
    display: flex;
    gap: 0.6rem;
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--rule);
    flex-wrap: wrap;
    align-items: center;
  }
  .progress {
    margin-left: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: var(--ink-soft);
  }
</style>
</head>
<body>
<div class="widget">
  <h1>Postfix Expression Evaluator</h1>
  <div class="subtitle">— Type or pick an expression, then step through it —</div>
 
  <div class="input-row">
    <input type="text" id="expr-input" value="4 3 5 * +" placeholder="e.g.  4 3 5 * +" autocomplete="off"/>
    <button id="load-btn" class="primary">Load</button>
  </div>
 
  <div class="presets">
    <span class="presets-label">Try:</span>
    <button class="preset-chip" data-expr="4 3 5 * +">4 3 5 * +</button>
    <button class="preset-chip" data-expr="2 3 + 4 * 5 -">2 3 + 4 * 5 -</button>
    <button class="preset-chip" data-expr="2 3 * 4 2 - / 5 6 * +">2 3 * 4 2 - / 5 6 * +</button>
    <button class="preset-chip" data-expr="2 4 - 3 ^ 5 +">2 4 - 3 ^ 5 +</button>
    <button class="preset-chip error-preset" data-expr="3 8 + * 9">3 8 + * 9</button>
    <button class="preset-chip error-preset" data-expr="9 8 + 7">9 8 + 7</button>
  </div>
 
  <div class="stage">
    <div class="left-pane">
      <div class="tokens">
        <div class="tokens-label">Expression tokens</div>
        <div class="tokens-row" id="tokens-row"></div>
      </div>
 
      <div class="narration" id="narration">
        <div class="narration-action">Ready</div>
        <div class="narration-text">Press <strong>Next</strong> to begin processing token by token. Operands push onto the stack; operators pop two values, compute, and push the result.</div>
      </div>
 
      <div class="result-box" id="result-box">
        <div class="result-label" id="result-label">Final result</div>
        <div class="result-value" id="result-value">—</div>
      </div>
    </div>
 
    <div class="right-pane">
      <div class="stack-label">Operand stack</div>
      <div class="top-marker" id="top-marker">top</div>
      <div class="stack-bucket" id="stack-bucket">
        <div class="stack-empty">(empty)</div>
      </div>
    </div>
  </div>
 
  <div class="controls">
    <button id="prev-btn" disabled>← Back</button>
    <button id="next-btn" class="primary">Next step →</button>
    <button id="reset-btn">Reset</button>
    <span class="progress" id="progress">0 / 0</span>
  </div>
</div>
 
<script>
  const exprInput = document.getElementById('expr-input');
  const loadBtn = document.getElementById('load-btn');
  const tokensRow = document.getElementById('tokens-row');
  const narration = document.getElementById('narration');
  const resultBox = document.getElementById('result-box');
  const resultLabel = document.getElementById('result-label');
  const resultValue = document.getElementById('result-value');
  const stackBucket = document.getElementById('stack-bucket');
  const topMarker = document.getElementById('top-marker');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const resetBtn = document.getElementById('reset-btn');
  const progressEl = document.getElementById('progress');
 
  let tokens = [];
  let step = 0;
  let stack = [];
  let error = null;
  let finished = false;
 
  function isNumeric(s) {
    if (s === undefined || s === null || s === '') return false;
    return !isNaN(parseFloat(s)) && isFinite(s);
  }
  function isOperator(s) {
    return ['+', '-', '*', '/', '^'].includes(s);
  }
  function compute(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      case '^': return Math.pow(a, b);
    }
  }
  function fmt(n) {
    if (Number.isInteger(n)) return n.toString();
    return Number(n.toFixed(4)).toString();
  }
 
  function load(expr) {
    exprInput.value = expr;
    tokens = expr.trim().split(/\s+/).filter(t => t.length > 0);
    step = 0;
    stack = [];
    error = null;
    finished = false;
    renderTokens();
    render();
  }
 
  function renderTokens() {
    tokensRow.innerHTML = '';
    tokens.forEach((t, i) => {
      const el = document.createElement('div');
      el.className = 'token';
      el.dataset.index = i;
      el.textContent = t;
      tokensRow.appendChild(el);
    });
  }
 
  function render() {
    // Update tokens
    document.querySelectorAll('.token').forEach((el, i) => {
      el.classList.remove('done', 'current', 'error');
      if (i < step) el.classList.add('done');
      if (i === step && !finished && !error) el.classList.add('current');
      if (error && error.tokenIndex === i) el.classList.add('error');
    });
 
    // Update stack
    stackBucket.innerHTML = '';
    if (stack.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'stack-empty';
      empty.textContent = '(empty)';
      stackBucket.appendChild(empty);
      topMarker.classList.remove('visible');
    } else {
      stack.forEach((v, i) => {
        const cell = document.createElement('div');
        cell.className = 'stack-item';
        if (i === stack.length - 1) cell.classList.add('is-top');
        cell.textContent = fmt(v);
        stackBucket.appendChild(cell);
      });
      topMarker.classList.add('visible');
    }
 
    // Progress
    progressEl.textContent = `${Math.min(step, tokens.length)} / ${tokens.length}`;
 
    // Controls
    prevBtn.disabled = step === 0;
    nextBtn.disabled = finished || error !== null;
 
    // Result box
    if (error) {
      resultBox.classList.add('visible', 'error');
      resultLabel.textContent = 'Error';
      resultValue.textContent = error.message;
    } else if (finished) {
      resultBox.classList.add('visible');
      resultBox.classList.remove('error');
      resultLabel.textContent = 'Final result';
      resultValue.textContent = fmt(stack[0]);
    } else {
      resultBox.classList.remove('visible', 'error');
    }
  }
 
  function nextStep() {
    if (step >= tokens.length) {
      // End of expression - check final state
      if (stack.length === 1) {
        finished = true;
        narration.className = 'narration success';
        narration.innerHTML = `
          <div class="narration-action">✓ Done</div>
          <div class="narration-text">All tokens processed. The stack holds a single value, <span class="num">${fmt(stack[0])}</span>, which is the answer.</div>
        `;
      } else if (stack.length > 1) {
        error = {
          tokenIndex: -1,
          message: 'Too many operands'
        };
        narration.className = 'narration error';
        narration.innerHTML = `
          <div class="narration-action">⚠ Too many operands</div>
          <div class="narration-text">The expression finished but the stack still contains <span class="num">${stack.length}</span> values. A valid postfix expression should reduce to exactly one. Some operand was never consumed by an operator.</div>
        `;
      } else {
        error = {
          tokenIndex: -1,
          message: 'Empty stack at end'
        };
        narration.className = 'narration error';
        narration.innerHTML = `<div class="narration-action">⚠ No result</div><div class="narration-text">The stack is empty after processing all tokens.</div>`;
      }
      render();
      return;
    }
 
    const token = tokens[step];
    if (isNumeric(token)) {
      const v = parseFloat(token);
      stack.push(v);
      step++;
      narration.className = 'narration';
      narration.innerHTML = `
        <div class="narration-action">PUSH <span style="color:var(--accent)">${token}</span></div>
        <div class="narration-text">Token <span class="num">${token}</span> is an operand. Push it onto the stack.</div>
      `;
    } else if (isOperator(token)) {
      if (stack.length < 2) {
        // Error: too few operands
        error = {
          tokenIndex: step,
          message: 'Too few operands'
        };
        narration.className = 'narration error';
        narration.innerHTML = `
          <div class="narration-action">⚠ Too few operands</div>
          <div class="narration-text">Operator <span class="op">${token}</span> needs two operands, but the stack has only <span class="num">${stack.length}</span>. The expression is malformed — likely too many operators.</div>
        `;
        render();
        return;
      }
      const right = stack.pop();
      const left = stack.pop();
      const result = compute(left, right, token);
      stack.push(result);
      step++;
      narration.className = 'narration';
      narration.innerHTML = `
        <div class="narration-action">APPLY <span style="color:var(--accent)">${token}</span></div>
        <div class="narration-text">Pop <span class="num">${fmt(right)}</span> (right operand), then pop <span class="num">${fmt(left)}</span> (left). Compute <span class="num">${fmt(left)}</span> <span class="op">${token}</span> <span class="num">${fmt(right)}</span> = <span class="num">${fmt(result)}</span>. Push the result back.</div>
      `;
    } else {
      error = {
        tokenIndex: step,
        message: 'Unknown token'
      };
      narration.className = 'narration error';
      narration.innerHTML = `<div class="narration-action">⚠ Unknown token</div><div class="narration-text">"${token}" is neither a number nor a supported operator (+ - * / ^).</div>`;
    }
    render();
  }
 
  function prevStep() {
    if (step === 0) return;
    // Replay from scratch up to step-1
    const targetStep = step - 1;
    step = 0;
    stack = [];
    error = null;
    finished = false;
    for (let i = 0; i < targetStep; i++) {
      const token = tokens[i];
      if (isNumeric(token)) {
        stack.push(parseFloat(token));
        step++;
      } else if (isOperator(token)) {
        if (stack.length < 2) {
          error = { tokenIndex: i, message: 'Too few operands' };
          break;
        }
        const right = stack.pop();
        const left = stack.pop();
        stack.push(compute(left, right, token));
        step++;
      }
    }
    narration.className = 'narration';
    if (step === 0) {
      narration.innerHTML = `<div class="narration-action">Ready</div><div class="narration-text">Press <strong>Next</strong> to begin processing token by token.</div>`;
    } else {
      narration.innerHTML = `<div class="narration-action">Rewound to step ${step}</div><div class="narration-text">Press <strong>Next</strong> to continue forward.</div>`;
    }
    render();
  }
 
  function reset() {
    load(exprInput.value);
    narration.className = 'narration';
    narration.innerHTML = `<div class="narration-action">Ready</div><div class="narration-text">Press <strong>Next</strong> to begin processing token by token. Operands push onto the stack; operators pop two values, compute, and push the result.</div>`;
  }
 
  loadBtn.addEventListener('click', () => {
    load(exprInput.value);
    narration.className = 'narration';
    narration.innerHTML = `<div class="narration-action">Loaded</div><div class="narration-text">Expression ready. Press <strong>Next</strong> to step through.</div>`;
  });
  exprInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadBtn.click();
  });
  nextBtn.addEventListener('click', nextStep);
  prevBtn.addEventListener('click', prevStep);
  resetBtn.addEventListener('click', reset);
 
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      load(chip.dataset.expr);
      narration.className = 'narration';
      narration.innerHTML = `<div class="narration-action">Loaded</div><div class="narration-text">Expression ready. Press <strong>Next</strong> to step through.</div>`;
    });
  });
 
  // Initial load
  load('4 3 5 * +');
</script>
</body>
</html>
```

### When Things Go Wrong: Error Detection

A beautiful side-effect of this algorithm: **the state of the stack tells you about errors.**

**Error case 1: Too many operators**

Expression: `3 8 + * 9`

```
Push 3, push 8   →   stack: [3, 8]
See "+", pop both, compute 3+8 = 11, push   →   stack: [11]
See "*"  →   need to pop two operands, but stack has only ONE element!
```

The moment we try to apply `*` with only one thing on the stack, we know the input is malformed.

**Error case 2: Too many operands**

Expression: `9 8 + 7`

```
Push 9, push 8   →   stack: [9, 8]
See "+", pop, compute 17, push   →   stack: [17]
Push 7   →   stack: [17, 7]
End of input — but the stack has TWO elements!
```

A valid postfix expression always ends with exactly one number on the stack. If there's more, something was left dangling.

### Java Implementation

Here's a working `PostfixEvaluation` class. I've kept it close to the lecture version but added comments:

```java
public class PostfixEvaluation {
    public static void main(String[] args) {
        System.out.println("Testing PostfixEvaluation:\n");
        System.out.println("2 3 + 4 * 5 - : "
                + evaluatePostfix("2 3 + 4 * 5 -") + "\n");
        System.out.println("2 3 * 4 2 - / 5 6 * + : "
                + evaluatePostfix("2 3 * 4 2 - / 5 6 * +") + "\n");
        System.out.println("2 4 - 3 ^ 5 + : "
                + evaluatePostfix("2 4 - 3 ^ 5 +") + "\n");
        System.out.println("Done.");
    }
 
    /** Evaluates a postfix expression and returns the result. */
    public static double evaluatePostfix(String postfix) {
        GenericStack<Double> valueStack = new GenericStack<>();
        String[] tokens = postfix.split(" ");
 
        for (String token : tokens) {
            if (isNumeric(token)) {
                valueStack.push(new Double(token));
            } else if (token.equals("+") || token.equals("-")
                    || token.equals("*") || token.equals("/")
                    || token.equals("^")) {
                Double operandTwo = valueStack.pop();   // right operand
                Double operandOne = valueStack.pop();   // left operand
                Double result = compute(operandOne, operandTwo, token);
                valueStack.push(result);
            }
        }
 
        return valueStack.peek();
    }
 
    public static boolean isNumeric(String str) {
        try {
            double d = Double.parseDouble(str);
        } catch (NumberFormatException nfe) {
            return false;
        }
        return true;
    }
 
    private static Double compute(Double operandOne, Double operandTwo,
                                  String operator) {
        double result;
        switch (operator) {
            case "+": result = operandOne + operandTwo; break;
            case "-": result = operandOne - operandTwo; break;
            case "*": result = operandOne * operandTwo; break;
            case "/": result = operandOne / operandTwo; break;
            case "^": result = Math.pow(operandOne, operandTwo); break;
            default:  result = 0; break;  // unexpected character
        }
        return result;
    }
}
```

Output:

```
Testing PostfixEvaluation:
 
2 3 + 4 * 5 - : 15.0
 
2 3 * 4 2 - / 5 6 * + : 33.0
 
2 4 - 3 ^ 5 + : -3.0
 
Done.
```

### The Critical Pop Order

One thing I want to highlight, because it's a common bug:

```java
Double operandTwo = valueStack.pop();   // FIRST pop = RIGHT operand
Double operandOne = valueStack.pop();   // SECOND pop = LEFT operand
```

Why does order matter? Because subtraction and division aren't commutative. `5 - 3 ≠ 3 - 5`.

When evaluating `5 3 -`, you push 5, then push 3. The first thing you pop is **3**, which is the *right* side of the subtraction (`5 - 3`). The second pop is **5**, the left side. Get this wrong and your calculator returns negative answers for everything.

## Wrap-Up

Let's recap what we covered:

* A **stack** is a list restricted to insertions and deletions at one end — the **top**.

* It follows the **LIFO** principle: last in, first out.

* The core operations are `push`, `pop`, and `peek`, all of which are O(1).

* We implement stacks efficiently using an **ArrayList**, preferably via **composition** rather than inheritance, so we don't accidentally expose list operations that violate the stack discipline.

* A classic application is evaluating **postfix expressions** (Reverse Polish Notation). The algorithm is short and elegant, and the stack's state at any point also helps detect malformed input.
  Stacks show up *everywhere* once you start looking:

* Function call stacks in every programming language

* Undo/redo systems

* Browser history

* Expression parsing in compilers

* Backtracking algorithms (think: solving a maze)

* Balanced parenthesis checking
  Next time you press `Ctrl+Z`, give a small nod to the stack working quietly behind the scenes.

