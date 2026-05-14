---
title: Stack
date: 2026-05-14T00:27:35+08:00
edited_at: 2026-05-14T03:34:47.722Z
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

> **Quick mental model:** an array is like a row of numbered lockers — you can open locker #47 instantly, but rearranging them is a pain. A linked list is like a treasure hunt — each clue points to the next, so inserting a new clue is easy, but finding the 47th clue means following 46 others first.

## Introducing the Stack

Here's the one-sentence definition you should remember forever:

> **A stack is a list where elements are accessed, inserted, and deleted only from one end — called the** ***top***\*\*.\*\*

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

```
                  Top
                   ↓
      |  C  |
      |  B  |        Same data as ArrayList:
      |  A  |   →    [ A, B, C ]
      +-----+               ↑
       Bottom              "back"
```

The top of the stack corresponds to the *end* of the array list. The bottom is index 0.

### Two Design Choices: Inheritance vs Composition

When designing the `GenericStack` class, we have two ways to use ArrayList under the hood:

**Option 1: Inheritance** — make `GenericStack` *extend* `ArrayList`.

```
ArrayList ←─── GenericStack   (GenericStack IS-A ArrayList)
```

**Option 2: Composition** — give `GenericStack` an ArrayList as a *private field*.

```
GenericStack ◇─── ArrayList   (GenericStack HAS-A ArrayList)
```

Both work, but **composition is generally preferred** for stacks. Why? Because if we use inheritance, our stack would inherit *all* of ArrayList's methods — including things like `add(int index, Object o)` that let you insert in the middle. That breaks the whole point of a stack: you'd no longer have a guarantee that things only enter/leave from the top.

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

### Worked Example: Evaluating `4 3 5 * +`

Let me trace it step by step:

```
Token: 4         Token: 3         Token: 5
Push 4           Push 3           Push 5
 
  |   |            | 3 |            | 5 |
  | 4 |            | 4 |            | 3 |
  +---+            +---+            | 4 |
                                    +---+
 
 
Token: *                          Token: +
Pop 5 (right), Pop 3 (left)       Pop 15 (right), Pop 4 (left)
Compute 3 * 5 = 15                Compute 4 + 15 = 19
Push 15                           Push 19
 
  | 15 |                            | 19 |
  |  4 |                            +----+
  +----+
 
Final answer: 19
```

Sanity check: in infix, `4 3 5 * +` corresponds to `4 + (3 * 5) = 4 + 15 = 19`. ✓

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

