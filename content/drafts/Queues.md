---
title: Queues
date: 2026-05-14T17:10:50+08:00
author: chinono
---

#

If you've ever stood in line at a bubble tea shop, you already understand a **queue**. That's basically the whole idea — but in code, this simple concept turns into one of the most useful data structures you'll meet. In this post we'll walk through what a queue is, how to implement one in Java, and then level it up into a **priority queue**.

This is written for someone seeing it for the first time, so I won't assume much beyond "you've written a few Java classes."

## 1. The mental model

Picture a checkout line at the supermarket:

```
  front                                 rear
   ↓                                     ↓
 [ A ] ← [ B ] ← [ C ] ← [ D ] ← (new person joins here)
   ↑
 (cashier serves whoever is here next)
```

Two rules govern this line:

* **New people join at the rear.**

* **The cashier always serves whoever is at the front.**
  That's it. That's a queue. And the rule it follows has a famous three-letter name: **FIFO — First In, First Out.** The first person in line is the first person out.

Compare this to a **stack**, which is LIFO (Last In, First Out) — like a stack of plates where you only take the top one. Same family of "linear" structures, different access rule.

## 2. Where queues live in Java

Before we build one, let's see where `Queue` sits in Java's official **Collections Framework**:

```
                  Iterable
                     │
                 Collection
                ┌────┼─────┐
              List   Queue   Set
               │      │       │
        ArrayList   PriorityQueue   HashSet
        LinkedList     Deque       LinkedHashSet
        Vector       ArrayDeque    TreeSet
        Stack
```

A few takeaways:

* `Queue` is a sibling of `List` and `Set` — they're all `Collection`s.

* `Queue` is an **interface**, not a concrete class. You don't `new Queue()`. You use an implementation like `LinkedList` or `PriorityQueue`.

* `Deque` (double-ended queue) is a more flexible cousin that allows add/remove at both ends. We won't focus on it here.

## 3. The two operations that define a queue

You only really need two:

| Operation    | What it does                       | Where it happens   |
| ------------ | ---------------------------------- | ------------------ |
| `enqueue(x)` | Add `x` to the queue               | At the **rear**    |
| `dequeue()`  | Remove and return the next element | From the **front** |

You'll often also see helpers like `peek()` (look at the front without removing), `size()`, and `isEmpty()`. But `enqueue` and `dequeue` are the heart of it.

### Try it yourself

I built a tiny visualizer — type a value, hit `ENQUEUE`, watch it appear at the rear. Hit `DEQUEUE` to pull from the front. The borders highlight which node is the front (red) and which is the rear (blue).

```custom-html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Queue Visualizer</title>
<style>
  :root {
    --paper: #f6f1e8;
    --ink: #2b2a26;
    --muted: #7a7468;
    --line: #1a1916;
    --front: #c9412c;
    --rear:  #2563a8;
    --accent: #d9a441;
    --shadow: 4px 4px 0 var(--line);
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: "Georgia", "Cambria", serif;
    background: var(--paper);
    color: var(--ink);
  }
  body {
    background-image:
      radial-gradient(circle at 20% 10%, rgba(0,0,0,0.03) 0, transparent 60%),
      radial-gradient(circle at 80% 90%, rgba(0,0,0,0.03) 0, transparent 60%);
    padding: 32px 20px;
  }
  .wrap {
    max-width: 760px; margin: 0 auto;
    border: 2px solid var(--line);
    background: #fffdf7;
    padding: 28px 28px 24px;
    box-shadow: var(--shadow);
    position: relative;
  }
  .wrap::before {
    content: "FIFO";
    position: absolute; top: -14px; left: 22px;
    background: var(--accent);
    color: var(--line);
    font-family: "Courier New", monospace;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 2px;
    padding: 3px 10px;
    border: 2px solid var(--line);
  }
  h1 {
    font-family: "Georgia", serif;
    font-weight: 700;
    font-size: 26px;
    margin: 4px 0 4px;
    letter-spacing: -0.5px;
  }
  .sub {
    font-style: italic;
    color: var(--muted);
    margin: 0 0 20px;
    font-size: 14px;
  }
  .controls {
    display: flex; flex-wrap: wrap; gap: 8px;
    align-items: center;
    padding: 14px;
    background: #f1ead9;
    border: 1.5px dashed var(--line);
    margin-bottom: 22px;
  }
  .controls input[type="text"] {
    flex: 1; min-width: 120px;
    padding: 8px 10px;
    font-family: "Courier New", monospace;
    font-size: 14px;
    border: 2px solid var(--line);
    background: #fffdf7;
    outline: none;
  }
  .controls input[type="text"]:focus {
    background: #fff;
    box-shadow: 2px 2px 0 var(--line);
    transform: translate(-1px, -1px);
  }
  button {
    font-family: "Courier New", monospace;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 8px 14px;
    border: 2px solid var(--line);
    background: #fffdf7;
    color: var(--ink);
    cursor: pointer;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }
  button:hover { transform: translate(-1px, -1px); box-shadow: 2px 2px 0 var(--line); }
  button:active { transform: translate(1px, 1px); box-shadow: none; }
  .btn-enq { background: #d9eedd; }
  .btn-deq { background: #f4d3c9; }
  .btn-clr { background: #fffdf7; }
  .stage {
    position: relative;
    min-height: 180px;
    padding: 28px 12px 12px;
    border: 2px solid var(--line);
    background: #fffdf7;
    overflow: hidden;
  }
  .labels {
    position: absolute; top: 6px; left: 12px; right: 12px;
    display: flex; justify-content: space-between;
    font-family: "Courier New", monospace;
    font-size: 11px;
    letter-spacing: 1.5px;
    color: var(--muted);
  }
  .labels .front-l { color: var(--front); }
  .labels .rear-l  { color: var(--rear);  }
  .queue {
    display: flex; align-items: center; justify-content: flex-start;
    gap: 6px;
    /* FIX: Increased bottom padding so text doesn't get clipped by the scroll area */
    padding: 18px 6px 32px; 
    min-height: 110px; /* adjusted to account for new padding */
    overflow-x: auto;
  }
  .queue::-webkit-scrollbar { height: 6px; }
  .queue::-webkit-scrollbar-thumb { background: var(--muted); }
  .node {
    flex-shrink: 0;
    min-width: 60px;
    height: 56px;
    display: flex; align-items: center; justify-content: center;
    font-family: "Courier New", monospace;
    font-weight: 700;
    font-size: 16px;
    background: #fffdf7;
    border: 2px solid var(--line);
    box-shadow: 3px 3px 0 var(--line);
    position: relative;
    animation: slideIn 0.35s cubic-bezier(.2,.9,.3,1.2);
  }
  .node.first { border-color: var(--front); }
  .node.last  { border-color: var(--rear);  }
  .node.first::after,
  .node.last::after {
    position: absolute;
    /* FIX: Pushed down slightly & added nowrap to prevent overlapping */
    bottom: -28px; 
    left: 50%; transform: translateX(-50%);
    font-family: "Courier New", monospace;
    font-size: 10px;
    letter-spacing: 1px;
    white-space: nowrap; 
  }
  .node.first::after { content: "FRONT ↑"; color: var(--front); }
  .node.last::after  { content: "REAR ↑";  color: var(--rear);  }
  .node.first.last::after { content: "FRONT & REAR ↑"; color: var(--ink); }
  .node.leaving {
    animation: slideOut 0.3s ease forwards;
  }
  @keyframes slideIn {
    0%   { transform: translateX(30px) scale(0.7); opacity: 0; }
    100% { transform: translateX(0) scale(1); opacity: 1; }
  }
  @keyframes slideOut {
    0%   { transform: translateX(0) scale(1); opacity: 1; }
    100% { transform: translateX(-50px) scale(0.7); opacity: 0; }
  }
  .empty {
    color: var(--muted);
    font-style: italic;
    font-family: "Georgia", serif;
    text-align: center;
    width: 100%;
    padding: 24px 0;
  }
  .log {
    margin-top: 18px;
    font-family: "Courier New", monospace;
    font-size: 12px;
    background: var(--line);
    color: #f3e9c8;
    padding: 12px 14px;
    height: 110px;
    overflow-y: auto;
    border: 2px solid var(--line);
  }
  .log div { margin-bottom: 2px; }
  .log .ok  { color: #9be4a3; }
  .log .err { color: #f49d8e; }
  .log .info { color: #f3e9c8; }
  .stats {
    margin-top: 12px;
    display: flex; gap: 18px;
    font-family: "Courier New", monospace;
    font-size: 13px;
    color: var(--muted);
  }
  .stats b { color: var(--ink); }
</style>
</head>
<body>
<div class="wrap">
  <h1>Queue Visualizer</h1>
  <p class="sub">Watch elements line up at the rear and leave from the front.</p>
 
  <div class="controls">
    <input id="val" type="text" placeholder="Enter a value (e.g. Tom)" maxlength="10" />
    <button class="btn-enq" onclick="enqueue()">ENQUEUE</button>
    <button class="btn-deq" onclick="dequeue()">DEQUEUE</button>
    <button class="btn-clr" onclick="clearQueue()">CLEAR</button>
  </div>
 
  <div class="stage">
    <div class="labels">
      <span class="front-l">← front (remove here)</span>
      <span class="rear-l">rear (add here) →</span>
    </div>
    <div id="queue" class="queue">
      <div class="empty">— queue is empty —</div>
    </div>
  </div>
 
  <div class="stats">
    <span>size: <b id="size">0</b></span>
    <span>front: <b id="frontEl">∅</b></span>
    <span>rear: <b id="rearEl">∅</b></span>
  </div>
 
  <div class="log" id="log"></div>
</div>
 
<script>
  const queue = [];
  const queueEl = document.getElementById("queue");
  const logEl = document.getElementById("log");
  const valEl = document.getElementById("val");
  let counter = 0;
 
  function log(msg, type = "info") {
    const line = document.createElement("div");
    line.className = type;
    line.textContent = "> " + msg;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }
 
  function render() {
    queueEl.innerHTML = "";
    if (queue.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "— queue is empty —";
      queueEl.appendChild(empty);
    } else {
      queue.forEach((item, i) => {
        const node = document.createElement("div");
        node.className = "node";
        if (i === 0) node.classList.add("first");
        if (i === queue.length - 1) node.classList.add("last");
        node.textContent = item.value;
        node.dataset.id = item.id;
        queueEl.appendChild(node);
      });
    }
    document.getElementById("size").textContent = queue.length;
    document.getElementById("frontEl").textContent = queue[0]?.value ?? "∅";
    document.getElementById("rearEl").textContent = queue[queue.length - 1]?.value ?? "∅";
  }
 
  function enqueue() {
    const v = valEl.value.trim();
    if (!v) {
      log("enqueue failed — value is empty", "err");
      return;
    }
    queue.push({ value: v, id: counter++ });
    log("enqueue(\"" + v + "\")  →  added at rear", "ok");
    valEl.value = "";
    valEl.focus();
    render();
  }
 
  function dequeue() {
    if (queue.length === 0) {
      log("dequeue failed — queue is empty", "err");
      return;
    }
    const removed = queue[0];
    const firstNode = queueEl.querySelector(".node.first");
    if (firstNode) {
      firstNode.classList.add("leaving");
      setTimeout(() => {
        queue.shift();
        log("dequeue()  →  removed \"" + removed.value + "\" from front", "ok");
        render();
      }, 280);
    } else {
      queue.shift();
      render();
    }
  }
 
  function clearQueue() {
    if (queue.length === 0) { log("queue already empty", "info"); return; }
    queue.length = 0;
    log("cleared the queue", "info");
    render();
  }
 
  valEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enqueue();
  });
 
  // Seed with a small demo
  ["Tom", "Susan", "Kim"].forEach(v => queue.push({ value: v, id: counter++ }));
  render();
  log("queue initialized with 3 elements", "info");
</script>
</body>
</html>
```

## 4. Implementing a queue: why a linked list wins

Here's a subtle but important question: should I use an `ArrayList` or a `LinkedList` under the hood?

Let's think about what each operation costs.

**With an** **`ArrayList`:**

* `enqueue` (add at end) → cheap, just appends. ✅

* `dequeue` (remove from index 0) → ⚠️ expensive! Every other element has to shift left by one. That's an O(n) hit on every removal.
  **With a** **`LinkedList`:**

* `enqueue` (add at tail) → O(1). ✅

* `dequeue` (remove from head) → O(1). ✅
  Both queue operations are constant-time with a linked list. That's why the textbook recommends a linked list as the backing structure for a queue.

```
   Queue conceptually          Queue implemented as a LinkedList
 
   ┌───┬───┬───┐                ┌───┐   ┌───┐   ┌───┐
   │ A │ B │ C │                │ A │ → │ B │ → │ C │
   └───┴───┴───┘                └───┘   └───┘   └───┘
    front     rear                first           last
                                  (dequeue        (enqueue
                                   from here)      to here)
```

## 5. Two ways to wire a `GenericQueue` to a `LinkedList`

Once you've decided to use a linked list, you still have a design choice. Java's textbook author Y. Daniel Liang lays out two paths.

### Option A: Inheritance — `GenericQueue extends LinkedList`

Your queue **is-a** linked list, and inherits all of its methods.

* ✅ Easy to write.

* ❌ But… your queue now exposes *every* `LinkedList` method (like `add(int index, E e)`, `get(i)`, etc.). That breaks the queue's contract — users can sneakily insert in the middle, peek at index 5, all sorts of things a real queue shouldn't allow.

### Option B: Composition — `GenericQueue` *has-a* `LinkedList`

Your queue **owns** a private linked list and only exposes `enqueue`, `dequeue`, `getSize`.

* ✅ Encapsulates the implementation. The user can only do queue things.

* ✅ You could swap the internal `LinkedList` for something else later without breaking callers.

* This is the preferred design.

```
   (a) Inheritance                    (b) Composition
 
   LinkedList ◁──── GenericQueue      GenericQueue ◆──── LinkedList
                                       (holds one privately)
```

> **Rule of thumb:** Prefer composition over inheritance unless your subclass is genuinely a more specific *kind* of the parent. A queue isn't a "kind of linked list" — it's a different abstraction that happens to use one internally.

## 6. `GenericQueue<E>` — the code

Here's the textbook implementation using composition. It's short enough to memorize:

```java
public class GenericQueue<E> {
    private java.util.LinkedList<E> list = new java.util.LinkedList<>();
 
    public void enqueue(E e) {
        list.addLast(e);          // add at rear
    }
 
    public E dequeue() {
        return list.removeFirst(); // remove from front
    }
 
    public int getSize() {
        return list.size();
    }
 
    @Override
    public String toString() {
        return "Queue: " + list.toString();
    }
}
```

A few things worth noticing:

* `<E>` is a **generic type parameter**. It lets you build `GenericQueue<String>`, `GenericQueue<Integer>`, or `GenericQueue<MyOwnClass>` from the same definition.

* `addLast` and `removeFirst` are methods Java's `LinkedList` already provides. We're just renaming them to the queue vocabulary.

* The internal `list` is `private` — outside code can't reach in and break invariants.

### Testing it

```java
GenericQueue<String> queue = new GenericQueue<>();
 
queue.enqueue("Tom");          // Queue: [Tom]
queue.enqueue("Susan");        // Queue: [Tom, Susan]
queue.enqueue("Kim");
queue.enqueue("Michael");      // Queue: [Tom, Susan, Kim, Michael]
 
System.out.println(queue.dequeue()); // Tom
System.out.println(queue.dequeue()); // Susan
System.out.println(queue);           // Queue: [Kim, Michael]
```

Notice how Tom — the **first one in** — is also the **first one out**. FIFO in action.

## 7. Priority Queues — when FIFO isn't enough

Now imagine an emergency room.

A patient with a stab wound arrives at 10:00 AM. A patient with a sprained ankle arrives at 10:05 AM. Should the ankle be treated first because they arrived first? Of course not.

That's the limitation of a plain queue: it doesn't care **how important** an element is. In real life, sometimes you need to jump the line.

> **Priority Queue:** A queue where each element has a *priority*, and the highest-priority element comes out first — regardless of insertion order.

Some people call this **"largest-in, first-out"** behavior, though as you'll see, "largest" can mean either *biggest number* or *smallest number* depending on how you set it up.

### Visualizing it

Here's the classic textbook picture: elements are dumped into a container with priorities, and removal always pulls out the highest-priority one. With `8, 3, 18, 15, 13` in the bowl (higher number = higher priority), `18` leaves first.

```custom-html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Priority Queue Visualizer</title>
<style>
  :root {
    --paper: #f6f1e8;
    --ink: #2b2a26;
    --muted: #7a7468;
    --line: #1a1916;
    --hot: #c9412c;
    --cold: #5a8fbf;
    --accent: #d9a441;
    --shadow: 4px 4px 0 var(--line);
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: "Georgia", "Cambria", serif;
    background: var(--paper);
    color: var(--ink);
  }
  body {
    background-image:
      radial-gradient(circle at 20% 10%, rgba(0,0,0,0.03) 0, transparent 60%),
      radial-gradient(circle at 80% 90%, rgba(0,0,0,0.03) 0, transparent 60%);
    padding: 32px 20px;
  }
  .wrap {
    max-width: 760px; margin: 0 auto;
    border: 2px solid var(--line);
    background: #fffdf7;
    padding: 28px 28px 24px;
    box-shadow: var(--shadow);
    position: relative;
  }
  .wrap::before {
    content: "PRIORITY";
    position: absolute; top: -14px; left: 22px;
    background: var(--accent);
    color: var(--line);
    font-family: "Courier New", monospace;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 2px;
    padding: 3px 10px;
    border: 2px solid var(--line);
  }
  h1 {
    font-family: "Georgia", serif;
    font-weight: 700;
    font-size: 26px;
    margin: 4px 0 4px;
    letter-spacing: -0.5px;
  }
  .sub {
    font-style: italic;
    color: var(--muted);
    margin: 0 0 16px;
    font-size: 14px;
  }
  .mode-toggle {
    display: inline-flex;
    border: 2px solid var(--line);
    margin-bottom: 18px;
    font-family: "Courier New", monospace;
    font-size: 12px;
    font-weight: 700;
  }
  .mode-toggle button {
    background: #fffdf7;
    border: none;
    padding: 6px 14px;
    cursor: pointer;
    color: var(--muted);
    letter-spacing: 1px;
  }
  .mode-toggle button.active {
    background: var(--ink);
    color: var(--accent);
  }
  .controls {
    display: flex; flex-wrap: wrap; gap: 8px;
    align-items: center;
    padding: 14px;
    background: #f1ead9;
    border: 1.5px dashed var(--line);
    margin-bottom: 22px;
  }
  .controls input {
    padding: 8px 10px;
    font-family: "Courier New", monospace;
    font-size: 14px;
    border: 2px solid var(--line);
    background: #fffdf7;
    outline: none;
  }
  .controls input:focus {
    background: #fff;
    box-shadow: 2px 2px 0 var(--line);
    transform: translate(-1px, -1px);
  }
  .controls input.val   { flex: 2; min-width: 100px; }
  .controls input.prio  { width: 80px; }
  button {
    font-family: "Courier New", monospace;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 8px 14px;
    border: 2px solid var(--line);
    background: #fffdf7;
    color: var(--ink);
    cursor: pointer;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }
  button:hover { transform: translate(-1px, -1px); box-shadow: 2px 2px 0 var(--line); }
  button:active { transform: translate(1px, 1px); box-shadow: none; }
  .btn-add  { background: #d9eedd; }
  .btn-poll { background: #f4d3c9; }
  .btn-clr  { background: #fffdf7; }
  .stage {
    position: relative;
    min-height: 200px;
    padding: 28px 12px 36px;
    border: 2px solid var(--line);
    background: #fffdf7;
  }
  .stage-label {
    position: absolute; top: 6px; left: 12px;
    font-family: "Courier New", monospace;
    font-size: 11px;
    letter-spacing: 1.5px;
    color: var(--muted);
  }
  .stage-label b { color: var(--hot); }
  .queue {
    display: flex; flex-wrap: wrap;
    gap: 10px;
    padding: 18px 6px 6px;
    min-height: 120px;
    align-items: center;
    justify-content: center;
  }
  .node {
    min-width: 90px;
    padding: 10px 8px 6px;
    display: flex; flex-direction: column; align-items: center;
    font-family: "Courier New", monospace;
    background: #fffdf7;
    border: 2px solid var(--line);
    box-shadow: 3px 3px 0 var(--line);
    position: relative;
    transition: transform 0.4s cubic-bezier(.2,.9,.3,1.2);
    animation: pop 0.35s cubic-bezier(.2,.9,.3,1.2);
  }
  .node .value {
    font-weight: 700;
    font-size: 15px;
  }
  .node .prio {
    font-size: 11px;
    color: var(--muted);
    margin-top: 4px;
    letter-spacing: 1px;
  }
  .node.next {
    border-color: var(--hot);
    background: #fff4ef;
  }
  .node.next::after {
    content: "↑ NEXT OUT";
    position: absolute;
    bottom: -22px; left: 50%; transform: translateX(-50%);
    font-size: 10px;
    color: var(--hot);
    letter-spacing: 1px;
    white-space: nowrap;
  }
  .node.leaving {
    animation: fly 0.4s ease forwards;
  }
  @keyframes pop {
    0%   { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes fly {
    0%   { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-40px) scale(0.6); opacity: 0; }
  }
  .empty {
    color: var(--muted);
    font-style: italic;
    font-family: "Georgia", serif;
    text-align: center;
    width: 100%;
    padding: 24px 0;
  }
  .log {
    margin-top: 18px;
    font-family: "Courier New", monospace;
    font-size: 12px;
    background: var(--line);
    color: #f3e9c8;
    padding: 12px 14px;
    height: 110px;
    overflow-y: auto;
    border: 2px solid var(--line);
  }
  .log div { margin-bottom: 2px; }
  .log .ok  { color: #9be4a3; }
  .log .err { color: #f49d8e; }
  .log .info { color: #f3e9c8; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Priority Queue Visualizer</h1>
  <p class="sub">Each item has a priority. The one with the highest priority leaves first — order in doesn't matter.</p>
 
  <div class="mode-toggle">
    <button id="hiBtn" class="active" onclick="setMode('high')">HIGHER = HIGHER PRIORITY</button>
    <button id="loBtn" onclick="setMode('low')">LOWER = HIGHER PRIORITY</button>
  </div>
 
  <div class="controls">
    <input class="val"  id="val"  type="text"   placeholder="value (e.g. patient name)" maxlength="14" />
    <input class="prio" id="prio" type="number" placeholder="priority" />
    <button class="btn-add"  onclick="addItem()">OFFER</button>
    <button class="btn-poll" onclick="pollItem()">POLL</button>
    <button class="btn-clr"  onclick="clearQ()">CLEAR</button>
  </div>
 
  <div class="stage">
    <div class="stage-label">order shown by priority — <b>highlighted = poll() returns this next</b></div>
    <div id="queue" class="queue">
      <div class="empty">— priority queue is empty —</div>
    </div>
  </div>
 
  <div class="log" id="log"></div>
</div>
 
<script>
  let queue = [];
  let mode = "high"; // "high" = larger number wins, "low" = smaller number wins
  let counter = 0;
  const queueEl = document.getElementById("queue");
  const logEl = document.getElementById("log");
  const valEl = document.getElementById("val");
  const prioEl = document.getElementById("prio");
 
  function log(msg, type = "info") {
    const line = document.createElement("div");
    line.className = type;
    line.textContent = "> " + msg;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }
 
  function compare(a, b) {
    return mode === "high" ? b.priority - a.priority : a.priority - b.priority;
  }
 
  function sortedView() {
    return [...queue].sort(compare);
  }
 
  function render() {
    queueEl.innerHTML = "";
    const view = sortedView();
    if (view.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "— priority queue is empty —";
      queueEl.appendChild(empty);
      return;
    }
    view.forEach((item, i) => {
      const node = document.createElement("div");
      node.className = "node";
      if (i === 0) node.classList.add("next");
      node.dataset.id = item.id;
      node.innerHTML = `<div class="value">${escapeHtml(item.value)}</div>
                        <div class="prio">p = ${item.priority}</div>`;
      queueEl.appendChild(node);
    });
  }
 
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[c]));
  }
 
  function addItem() {
    const v = valEl.value.trim();
    const p = parseInt(prioEl.value, 10);
    if (!v) { log("offer failed — value is empty", "err"); return; }
    if (Number.isNaN(p)) { log("offer failed — priority must be a number", "err"); return; }
    queue.push({ value: v, priority: p, id: counter++ });
    log(`offer("${v}", priority=${p})`, "ok");
    valEl.value = ""; prioEl.value = "";
    valEl.focus();
    render();
  }
 
  function pollItem() {
    if (queue.length === 0) { log("poll failed — queue is empty", "err"); return; }
    const sorted = sortedView();
    const winner = sorted[0];
    // Find and animate
    const winnerNode = queueEl.querySelector(`.node[data-id="${winner.id}"]`);
    if (winnerNode) {
      winnerNode.classList.add("leaving");
      setTimeout(() => {
        queue = queue.filter(x => x.id !== winner.id);
        log(`poll() → "${winner.value}" (priority ${winner.priority})`, "ok");
        render();
      }, 380);
    } else {
      queue = queue.filter(x => x.id !== winner.id);
      render();
    }
  }
 
  function clearQ() {
    if (queue.length === 0) { log("queue already empty", "info"); return; }
    queue = [];
    log("cleared", "info");
    render();
  }
 
  function setMode(m) {
    mode = m;
    document.getElementById("hiBtn").classList.toggle("active", m === "high");
    document.getElementById("loBtn").classList.toggle("active", m === "low");
    log(`mode → ${m === "high" ? "larger number wins" : "smaller number wins"}`, "info");
    render();
  }
 
  prioEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addItem();
  });
  valEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") prioEl.focus();
  });
 
  // Seed with the hospital example
  [
    { value: "Donald", priority: 3 },
    { value: "Chong",  priority: 1 },
    { value: "Ali",    priority: 2 },
    { value: "Bala",   priority: 4 },
  ].forEach(x => queue.push({ ...x, id: counter++ }));
  render();
  log("seeded with 4 patients — Bala has highest priority", "info");
</script>
</body>
</html>
```

> *(Try toggling the "higher = higher priority" / "lower = higher priority" mode at the top — same data, different winner.)*

## 8. Java's built-in `PriorityQueue`

Good news: Java ships one. You don't have to build it yourself.

```java
import java.util.PriorityQueue;
```

It implements the `Queue<E>` interface, so the method names look familiar:

| Method               | What it does                                          | Returns         |
| -------------------- | ----------------------------------------------------- | --------------- |
| `offer(E e)`         | Add an element                                        | `boolean`       |
| `poll()`             | Remove and return the highest-priority element        | `E` (or `null`) |
| `peek()`             | Look at the highest-priority element without removing | `E` (or `null`) |
| `remove(Object o)`   | Remove a specific object                              | `boolean`       |
| `contains(Object o)` | Check if it's in the queue                            | `boolean`       |
| `size()`             | How many elements                                     | `int`           |
| `clear()`            | Empty it                                              | `void`          |

> **A note on naming:** `offer` / `poll` / `peek` are the queue-aware versions that return `null` or `false` instead of throwing on edge cases (empty queue, capacity full). The older `add` / `remove` exist too but can throw exceptions. Prefer the new names.

### How does it know what "highest priority" means?

Two ways:

1. **Natural ordering.** If your elements implement `Comparable<E>`, `PriorityQueue` uses that. For `String`, natural order is alphabetical, so `"Georgia"` comes out before `"Texas"`.
2. **Custom** **`Comparator`.** Pass one to the constructor and you control the order.

## 9. Example 1 — strings, two orderings

```java
import java.util.*;
 
public class PriorityQueueDemo {
  public static void main(String[] args) {
    // Default: natural ordering (alphabetical for Strings)
    PriorityQueue<String> queue1 = new PriorityQueue<>();
    queue1.offer("Oklahoma");
    queue1.offer("Indiana");
    queue1.offer("Georgia");
    queue1.offer("Texas");
 
    System.out.println("Priority queue using Comparable:");
    while (queue1.size() > 0) {
      System.out.print(queue1.poll() + " ");
    }
    // → Georgia Indiana Oklahoma Texas
 
    // Reversed order via Collections.reverseOrder()
    PriorityQueue<String> queue2 =
        new PriorityQueue<>(4, Collections.reverseOrder());
    queue2.offer("Oklahoma");
    queue2.offer("Indiana");
    queue2.offer("Georgia");
    queue2.offer("Texas");
 
    System.out.println("\nPriority queue using Comparator:");
    while (queue2.size() > 0) {
      System.out.print(queue2.poll() + " ");
    }
    // → Texas Oklahoma Indiana Georgia
  }
}
```

Same elements, opposite outputs — just by swapping in `Collections.reverseOrder()`.

## 10. Example 2 — your own objects

What if you want to queue something Java doesn't know how to compare? Like a `Customer`?

You have to teach it. Implement `Comparable<Customer>` and define `compareTo`:

```java
public class Customer implements Comparable<Customer> {
  private Integer id;
  private String name;
 
  public Customer(Integer id, String name) {
    this.id = id;
    this.name = name;
  }
 
  public Integer getID() { return id; }
  public String  getName() { return name; }
 
  @Override
  public int compareTo(Customer c) {
    return this.getID().compareTo(c.getID());
  }
 
  @Override
  public String toString() {
    return "Customer [id=" + id + ", name=" + name + "]";
  }
}
```

Now you can drop `Customer` objects into a `PriorityQueue` and it'll know what to do:

```java
PriorityQueue<Customer> customerQueue =
    new PriorityQueue<>(Collections.reverseOrder());
 
customerQueue.add(new Customer(3, "Donald"));
customerQueue.add(new Customer(1, "Chong"));
customerQueue.add(new Customer(2, "Ali"));
customerQueue.add(new Customer(4, "Bala"));
 
Customer c = customerQueue.peek();
if (c != null) {
  System.out.println(c.getName() + " is in the queue");
  while ((c = customerQueue.poll()) != null) {
    System.out.println(c);
  }
}
```

Output:

```
Bala is in the queue
Customer [id=4, name=Bala]
Customer [id=3, name=Donald]
Customer [id=2, name=Ali]
Customer [id=1, name=Chong]
```

Because we used `reverseOrder()`, the **biggest id wins**. Bala (id=4) is the VIP.

> **`compareTo`** **cheat sheet:**
>
> * Returns negative → `this` is "less than" `other`
>
> * Returns zero → equal priority
>
> * Returns positive → `this` is "greater than" `other`
>
> By default, "greater" = "later out". Reverse it with a `Comparator` if you want the largest first.

## 11. Quick check — can you answer these?

Before moving on, see if you can answer these without scrolling back up.

1. Where in a queue do you insert? Where do you delete?
2. What does FIFO stand for?
3. Why is a `LinkedList` a better choice than an `ArrayList` to implement a queue?
4. What are the two preferred methods to add and remove in `java.util.PriorityQueue` (the ones that don't throw)?
5. If you put `5, 1, 8, 3` into a default `PriorityQueue<Integer>` and call `poll()` four times, what comes out and in what order?

Answers

1. Insert at the rear (back/tail). Delete from the front (head).
2. First In, First Out.
3. Removing from the front of an `ArrayList` is O(n) because every other element has to shift. With a doubly-linked list, head removal is O(1).
4. `offer(e)` to add, `poll()` to remove.
5. `1, 3, 5, 8` — natural ordering for `Integer` is ascending, so smallest comes out first.

## 12. Exercise — build your own

Want a workout? Try implementing a queue using an **array** instead of a linked list. Call it `ArrayQueue<E>`. You'll need to think about:

* Two index pointers — one for the front, one for the rear.

* What happens when `rear` reaches the end of the array? (Hint: a **circular array** wraps `rear` back to `0`.)

* How and when to `resize()` when the array fills up.
  Sketch of the API:

```java
public class ArrayQueue<E> {
    public ArrayQueue();
    public ArrayQueue(int initialCapacity);
    public void enqueue(E e);
    public E    dequeue();
    public E    getElement();   // peek
    public boolean isEmpty();
    public int  size();
    private void resize();      // grow when full
}
```

This is a classic interview-style exercise. You learn a lot by getting the circular-array bookkeeping right.

## 13. Where to go next

Queues show up everywhere once you start looking — task schedulers, BFS in graph algorithms, print spoolers, message brokers, request handling in web servers. Priority queues power Dijkstra's shortest-path algorithm and A\* search. The simple FIFO idea is doing a lot of work behind the scenes in real systems.

Coming up next in this series: **trees** — the structure that makes priority queues fast under the hood (via something called a binary heap), and a whole lot more.
