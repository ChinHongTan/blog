---
title: "Internal Memory: How Your Computer Remembers Things"
date: 2026-04-19T11:38
edited_at: 2026-04-23T03:51:56.979Z
author: chinono
path: /blog/Internal-Memory-How-Your-Computer-Remembers-Things
---

## Why Should You Care About Memory?

Here's a fact that might surprise you: **your processor is way faster than your memory.**

A 3 GHz processor can execute a simple "add" operation in about 0.33 nanoseconds. But fetching data from main memory? That takes over 33 nanoseconds — roughly **100 times slower**. That means if your system naively accessed memory every time it needed data, loads and stores would bottleneck everything else.

So engineers face an impossible wish list:

* Memory that runs at processor speed

* Memory large enough for all running programs

* Memory that's cheap

You can't have all three at once. That tension is the reason we have a *memory hierarchy* — different types of memory layered together, each making a different trade-off between speed, size, and cost. In this post, we'll focus on **internal memory**: the semiconductor-based memory that lives on or near the processor, as opposed to external storage like hard drives.

## The Memory Cell: The Smallest Unit

Every piece of memory, at its most basic level, is built from **memory cells**. A single memory cell:

* Has **two stable states**: representing either a `0` or a `1`

* Can be **written to** — setting its state

* Can be **read from** — sensing its current state

When you *write* to a cell, a **select** signal activates it, a **control** signal tells it "this is a write operation," and **data in** provides the value. When you *read*, the select and control signals activate the cell, and a **sense** line outputs the stored value.

Think of it like a light switch with a lock — you can flip it on (1) or off (0), lock it in place, and later check which position it's in.

## The Big Picture: Semiconductor Memory Types

Before we dive deep, here's a roadmap of the main memory types and how they relate to each other:

| Memory Type | Category    | Erasure                   | Write Mechanism     | Volatile? |
| ----------- | ----------- | ------------------------- | ------------------- | --------- |
| **RAM**     | Read-write  | Electrically, byte-level  | Electrically        | Yes       |
| **ROM**     | Read-only   | Not possible              | Masks (at factory)  | No        |
| **PROM**    | Read-only   | Not possible              | Electrically (once) | No        |
| **EPROM**   | Read-mostly | UV light, chip-level      | Electrically        | No        |
| **EEPROM**  | Read-mostly | Electrically, byte-level  | Electrically        | No        |
| **Flash**   | Read-mostly | Electrically, block-level | Electrically        | No        |

The two big branches are **volatile** memory (loses data without power) and **nonvolatile** memory (retains data even when powered off). Let's explore each.

:::info
### Explaination

* **RAM (Random Access Memory):** The defining example of volatile memory. It is fast, allows byte-level read/writes, and is wiped when power is lost.

* **ROM (Read-Only Memory):** Hardwired at the factory. Cannot be changed.

* **PROM (Programmable ROM):** Blank from the factory, but can only be written to *once* (like burning a CD-R).

* **EPROM (Erasable Programmable ROM):** A massive leap forward, but it required pulling the chip out of the computer and exposing a little quartz window on it to strong UV light to erase it.

* **EEPROM (Electrically Erasable Programmable ROM):** Allowed memory to be erased electrically without removing the chip, but only one byte at a time (too slow for bulk storage).

* **Flash:** The defining example of modern non-volatile memory (used in SSDs, USB drives, and smartphones). You need to know that it is electrically erased at the **block-level** (which is why writing data to a nearly full SSD can slow down).

Byte-Level means the computer can target a single byte of data (usually 8 bits) and change it without affecting the data sitting right next to it. It is incredibly convenient and fast for making small changes, but building the microscopic circuitry required to target every individual byte makes the physical chip more complex and expensive to manufacture.

Block-level means the memory is divided into larger chunks called "blocks" (often thousands of bytes large). To change even a single byte of data, the computer must erase the *entire* block first, and then rewrite the whole block with the new change included. By giving up byte-level precision, engineers were able to drastically simplify the wiring inside the chip. This is exactly why Flash memory became so cheap and can hold massive amounts of data. However, it requires clever software controllers to manage the constant copying and erasing of blocks so the drive does not wear out too quickly.
:::

## RAM: The Workhorse

**RAM** (Random Access Memory) is the memory your computer uses for active work. It's called "random access" because any byte can be read or written in roughly the same amount of time, regardless of its location. The key characteristics:

* Data is read and written using **electrical signals** — fast and easy

* It's **volatile** — turn off the power, and everything disappears

* It serves as **temporary storage** for programs and data currently in use

There are two major flavors of RAM: **DRAM** and **SRAM**.

### DRAM (Dynamic RAM) — The Forgetful One

DRAM stores each bit of data as a **charge on a tiny capacitor**. A charged capacitor represents a `1`; a discharged one represents `0`. The circuit for a single DRAM cell is remarkably simple — just **one transistor and one capacitor**.

But there's a catch: capacitors *leak*. The charge slowly drains away over time, so the data would be lost if left alone. That's why DRAM needs **periodic refreshing** — the memory controller must regularly read every row and write it back to restore the charges. This is what makes it "dynamic."

**How DRAM reads and writes:**

* **Writing:** A voltage is applied to the bit line (high for 1, low for 0). Then the address line is activated, which turns on the transistor, allowing the charge to transfer to the capacitor.

* **Reading:** The address line is activated, turning on the transistor. The charge stored in the capacitor flows out through the bit line to a **sense amplifier**, which compares it against a reference voltage to determine whether it's a 0 or 1. Here's the tricky part — reading is **destructive**. The act of reading drains the capacitor, so the charge must be written back after every read.

**Refreshing in practice:**

A dedicated refresh circuit is built into the chip. It temporarily disables normal access, steps through each row, reads the data, and writes it back. This takes time and slightly reduces the apparent performance of the chip. Every few milliseconds, the entire memory array must be refreshed.

:::info
### Additional Explaination

DRAM is arranged in a massive grid, much like a spreadsheet or a city map. To read or write data, the memory controller needs a way to target specific "coordinates" on that grid.

**The Address Line** is the horizontal wire running across a row of memory cells. Think of the transistor in the DRAM cell as a door blocking access to the capacitor (where the data lives). The address line controls that door. When the memory controller sends a high voltage down the address line, it "opens the door" (turns on the transistor) for every single cell in that specific row, connecting their capacitors to the rest of the circuit.

**The Bit Line** is the vertical wire running down a column of memory cells. If the address line opens the door, the bit line is the hallway the data travels through.

* **During a Write:** The memory controller forces a high voltage (a 1) or low voltage (a 0) down the bit line. Because the address line opened the transistor door, that voltage flows from the bit line into the capacitor, charging or discharging it.

* **During a Read:** The transistor door opens, and whatever tiny bit of charge is stored in the capacitor spills out onto the bit line to be read.

The Sense Amplifier is a highly sensitive measuring circuit situated at the end of each bit line. The capacitor inside a DRAM cell is microscopic. When it dumps its charge onto the much larger bit line during a "read" operation, the resulting voltage change is incredibly weak—barely a whisper of a signal. The sense amplifier detects that tiny voltage shift and instantly **amplifies** it into a strong, clear digital 1 or 0 that the computer's processor can actually understand. Furthermore, because reading the capacitor drained it (destructive read), the sense amplifier immediately pushes that newly amplified strong signal *back* up the bit line to recharge the capacitor, saving the data from being lost forever.
:::

### SRAM (Static RAM) — The Fast One

SRAM takes a completely different approach. Instead of a capacitor, it stores each bit using a **flip-flop** circuit — a configuration of **six transistors** (typically labeled T₁ through T₆). Two pairs of transistors form cross-coupled inverters (T₁/T₃ and T₂/T₄), creating two stable states. The other two transistors (T₅ and T₆) connect the cell to the bit lines and are controlled by the address line.

* **State 1:** Point C₁ is high, C₂ is low. Transistors T₁ and T₄ are off, T₂ and T₃ are on.

* **State 0:** Point C₂ is high, C₁ is low. Transistors T₂ and T₃ are off, T₁ and T₄ are on.

The beauty of SRAM is that **as long as power is supplied, the flip-flop holds its state indefinitely** — no refresh needed. To write, you apply the desired value to bit line B and its complement to B̄, then activate the address line. To read, the value simply appears on bit line B when the address line is activated.

:::info
### Visualisation

```custom-html
<h2 class="sr-only">Interactive SRAM cell showing how cross-coupled inverters store a bit, with step-through for idle, write, and read operations.</h2>
<style>
  /* Base wrapper styles */
  .sram-wrap { 
    max-width: 660px; 
    margin: 0 auto; 
    padding: 0.5rem 0; 
    font-family: var(--font-sans); 
  }
  .sram-nav { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
  .sram-btn { 
    padding: 6px 14px; 
    border-radius: var(--border-radius-md); 
    border: 1px solid var(--color-border-tertiary); 
    background: transparent; 
    color: var(--color-text-primary); 
    font-size: 13px; 
    cursor: pointer; 
    transition: all .2s; 
  }
  .sram-btn:hover {
    background: var(--color-border-tertiary);
  }
  .sram-btn.active { 
    background: #534AB7; 
    color: #fff; 
    border-color: #534AB7; 
  }
  .sram-desc { 
    font-size: 14px; 
    line-height: 1.65; 
    color: var(--color-text-primary); 
    margin-bottom: 12px; 
    min-height: 60px; 
  }

  .wire { transition: stroke .4s, opacity .4s; }
  .node-fill { transition: fill .4s; }
  .txt-anim { transition: fill .4s; }
  
  /* --- SVG Text Colors: Adapt to your site's Dark/Light mode! --- */
  svg text {
    font-family: var(--font-sans);
    font-size: 12px;
  }
  .th { 
    font-weight: bold; 
    fill: currentColor; 
  }
  .ts { 
    /* Use a solid secondary color! Do NOT use opacity here or it breaks the cutout line hiding trick! */
    fill: var(--color-text-secondary); 
  }

  /* --- The "Arrow Cutout" Trick --- */
  .bg-cutout {
    paint-order: stroke fill;
    /* Use the site's primary background color to act as an eraser */
    stroke: var(--color-bg-primary); 
    stroke-width: 6px;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 1 !important; /* Ensure it stays completely opaque */
  }
  
  @media (prefers-reduced-motion: reduce) { 
    .wire, .node-fill, .txt-anim { transition: none; } 
  }
</style>
<div class="sram-wrap">
  <div class="sram-nav" id="nav"></div>
  <div class="sram-desc" id="desc"></div>
  <svg width="100%" viewBox="0 0 680 420" role="img">
    <title>SRAM cell circuit</title>
    <desc>Cross-coupled inverters with access transistors and bit lines</desc>
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </marker>
    </defs>

    <text class="ts" x="340" y="24" text-anchor="middle" id="addr-label">Address line</text>
    <line id="addr-line" x1="40" y1="40" x2="640" y2="40" stroke-width="2.5" stroke-linecap="round" class="wire"/>

    <text class="ts" x="108" y="18" text-anchor="middle">Bit line B</text>
    <line id="bl-top" x1="108" y1="28" x2="108" y2="72" stroke-width="2" stroke-linecap="round" class="wire"/>
    <line id="bl-bot" x1="108" y1="120" x2="108" y2="400" stroke-width="2" stroke-linecap="round" class="wire"/>

    <text class="ts" x="572" y="18" text-anchor="middle">Bit line B-bar</text>
    <line id="br-top" x1="572" y1="28" x2="572" y2="72" stroke-width="2" stroke-linecap="round" class="wire"/>
    <line id="br-bot" x1="572" y1="120" x2="572" y2="400" stroke-width="2" stroke-linecap="round" class="wire"/>

    <rect id="t5-body" x="80" y="72" width="56" height="48" rx="6" stroke-width="0.5" class="node-fill"/>
    <text class="ts txt-anim" x="108" y="92" text-anchor="middle" dominant-baseline="central" id="t5-txt">T5</text>
    <text class="ts" x="108" y="108" text-anchor="middle" dominant-baseline="central" id="t5-state"></text>

    <rect id="t6-body" x="544" y="72" width="56" height="48" rx="6" stroke-width="0.5" class="node-fill"/>
    <text class="ts txt-anim" x="572" y="92" text-anchor="middle" dominant-baseline="central" id="t6-txt">T6</text>
    <text class="ts" x="572" y="108" text-anchor="middle" dominant-baseline="central" id="t6-state"></text>

    <line id="t5-to-inv1" x1="108" y1="120" x2="108" y2="180" stroke-width="1.5" stroke-linecap="round" class="wire"/>
    <path d="M108 180 L220 180" fill="none" stroke-width="1.5" stroke-linecap="round" class="wire" id="t5-conn"/>

    <line id="t6-to-inv2" x1="572" y1="120" x2="572" y2="180" stroke-width="1.5" stroke-linecap="round" class="wire"/>
    <path d="M572 180 L460 180" fill="none" stroke-width="1.5" stroke-linecap="round" class="wire" id="t6-conn"/>

    <rect id="inv1-body" x="190" y="160" width="120" height="100" rx="10" stroke-width="0.5" class="node-fill"/>
    <text class="th txt-anim" x="250" y="195" text-anchor="middle" dominant-baseline="central" id="inv1-title">Inverter A</text>
    <text class="ts txt-anim" x="250" y="215" text-anchor="middle" dominant-baseline="central" id="inv1-sub">(T1 + T3)</text>
    <text class="th txt-anim" x="250" y="245" text-anchor="middle" dominant-baseline="central" id="inv1-out"></text>

    <rect id="inv2-body" x="370" y="160" width="120" height="100" rx="10" stroke-width="0.5" class="node-fill"/>
    <text class="th txt-anim" x="430" y="195" text-anchor="middle" dominant-baseline="central" id="inv2-title">Inverter B</text>
    <text class="ts txt-anim" x="430" y="215" text-anchor="middle" dominant-baseline="central" id="inv2-sub">(T2 + T4)</text>
    <text class="th txt-anim" x="430" y="245" text-anchor="middle" dominant-baseline="central" id="inv2-out"></text>

    <path id="cross1" d="M310 200 C340 200, 340 230, 370 230" fill="none" stroke-width="1.5" marker-end="url(#arrow)" class="wire"/>
    <text class="ts bg-cutout" x="340" y="190" text-anchor="middle" id="c1-label">C1</text>

    <path id="cross2" d="M370 200 C340 200, 340 170, 310 170" fill="none" stroke-width="1.5" marker-end="url(#arrow)" class="wire"/>
    <text class="ts bg-cutout" x="340" y="166" text-anchor="middle" id="c2-label">C2</text>

    <text class="ts bg-cutout" x="250" y="290" text-anchor="middle">VDD (power)</text>
    <line x1="250" y1="260" x2="250" y2="298" stroke="var(--color-text-tertiary)" stroke-width="1" stroke-dasharray="3 3"/>
    <text class="ts bg-cutout" x="430" y="290" text-anchor="middle">VDD (power)</text>
    <line x1="430" y1="260" x2="430" y2="298" stroke="var(--color-text-tertiary)" stroke-width="1" stroke-dasharray="3 3"/>

    <rect id="sense-body" x="220" y="360" width="240" height="44" rx="8" stroke-width="0.5" class="node-fill"/>
    <text class="ts txt-anim" x="340" y="382" text-anchor="middle" dominant-baseline="central" id="sense-txt">Sense amplifier</text>

    <line x1="108" y1="382" x2="218" y2="382" stroke="var(--color-border-secondary)" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="572" y1="382" x2="462" y2="382" stroke="var(--color-border-secondary)" stroke-width="1" stroke-dasharray="3 3"/>
  </svg>
</div>
<script>
const H = '#EF9F27', L = '#378ADD', G = 'var(--color-border-secondary)', OFF_FILL = 'var(--color-background-secondary)', OFF_STROKE = 'var(--color-border-tertiary)';
const AMBER_FILL = '#FAEEDA', AMBER_STROKE = '#BA7517', AMBER_TXT = '#633806';
const BLUE_FILL = '#E6F1FB', BLUE_STROKE = '#185FA5', BLUE_TXT = '#0C447C';
const PURPLE_FILL = '#EEEDFE', PURPLE_STROKE = '#534AB7', PURPLE_TXT = '#3C3489';
const GRAY_FILL = 'var(--color-background-secondary)', GRAY_STROKE = 'var(--color-border-secondary)', GRAY_TXT = 'currentColor';
const TEAL_FILL = '#E1F5EE', TEAL_STROKE = '#0F6E56', TEAL_TXT = '#085041';

const steps = [
  {
    title: "Storing a 1",
    desc: "The cell is holding a <strong>1</strong>. Inverter A outputs HIGH (C1 = 1), which feeds into Inverter B. Inverter B does its job — inverts it — and outputs LOW (C2 = 0). That LOW feeds back into Inverter A, which inverts it to HIGH. The loop sustains itself forever, no refresh needed. The access transistors (T5, T6) are closed — the address line is off, so the cell is isolated from the bit lines.",
    addr: G, addrW: 1.5,
    bl: G, br: G,
    t5: { fill: GRAY_FILL, stroke: GRAY_STROKE, txt: GRAY_TXT, label: 'T5', state: 'closed' },
    t6: { fill: GRAY_FILL, stroke: GRAY_STROKE, txt: GRAY_TXT, label: 'T6', state: 'closed' },
    inv1: { fill: AMBER_FILL, stroke: AMBER_STROKE, txt: AMBER_TXT, out: 'OUT: 1 (HIGH)' },
    inv2: { fill: BLUE_FILL, stroke: BLUE_STROKE, txt: BLUE_TXT, out: 'OUT: 0 (LOW)' },
    cross1: H, cross2: L,
    t5conn: G, t6conn: G,
    sense: { fill: GRAY_FILL, stroke: GRAY_STROKE, txt: GRAY_TXT, label: 'Sense amplifier (idle)' }
  },
  {
    title: "Storing a 0",
    desc: "Now the cell holds a <strong>0</strong>. Everything flips: Inverter A outputs LOW (C1 = 0), Inverter B outputs HIGH (C2 = 1). The feedback loop holds this state just as stubbornly. Same circuit, opposite stable state. Still no refresh needed — the cross-coupled inverters actively hold the value.",
    addr: G, addrW: 1.5,
    bl: G, br: G,
    t5: { fill: GRAY_FILL, stroke: GRAY_STROKE, txt: GRAY_TXT, label: 'T5', state: 'closed' },
    t6: { fill: GRAY_FILL, stroke: GRAY_STROKE, txt: GRAY_TXT, label: 'T6', state: 'closed' },
    inv1: { fill: BLUE_FILL, stroke: BLUE_STROKE, txt: BLUE_TXT, out: 'OUT: 0 (LOW)' },
    inv2: { fill: AMBER_FILL, stroke: AMBER_STROKE, txt: AMBER_TXT, out: 'OUT: 1 (HIGH)' },
    cross1: L, cross2: H,
    t5conn: G, t6conn: G,
    sense: { fill: GRAY_FILL, stroke: GRAY_STROKE, txt: GRAY_TXT, label: 'Sense amplifier (idle)' }
  },
  {
    title: "Writing a 1",
    desc: "To write a <strong>1</strong>, the controller forces bit line B to HIGH and B-bar to LOW, then activates the address line. This opens both doors (T5 and T6). The strong external signals flood into the inverters and overpower whatever state they were in, forcing C1 = HIGH and C2 = LOW. When the address line deactivates, the doors close — and the loop now holds the new value on its own.",
    addr: PURPLE_STROKE, addrW: 3,
    bl: H, br: L,
    t5: { fill: PURPLE_FILL, stroke: PURPLE_STROKE, txt: PURPLE_TXT, label: 'T5', state: 'OPEN' },
    t6: { fill: PURPLE_FILL, stroke: PURPLE_STROKE, txt: PURPLE_TXT, label: 'T6', state: 'OPEN' },
    inv1: { fill: AMBER_FILL, stroke: AMBER_STROKE, txt: AMBER_TXT, out: 'OUT: 1 (HIGH)' },
    inv2: { fill: BLUE_FILL, stroke: BLUE_STROKE, txt: BLUE_TXT, out: 'OUT: 0 (LOW)' },
    cross1: H, cross2: L,
    t5conn: H, t6conn: L,
    sense: { fill: GRAY_FILL, stroke: GRAY_STROKE, txt: GRAY_TXT, label: 'Sense amplifier (idle)' }
  },
  {
    title: "Reading",
    desc: "To read, both bit lines are pre-charged to a neutral voltage. Then the address line activates, opening T5 and T6. The powered flip-flop pushes its internal voltages outward — B gets pulled slightly toward C1's value, B-bar toward C2's. The sense amplifier detects which line went up and which went down. <strong>Reading is non-destructive</strong> — the flip-flop keeps driving its state the whole time, unlike DRAM where reading drains the capacitor.",
    addr: PURPLE_STROKE, addrW: 3,
    bl: H, br: L,
    t5: { fill: PURPLE_FILL, stroke: PURPLE_STROKE, txt: PURPLE_TXT, label: 'T5', state: 'OPEN' },
    t6: { fill: PURPLE_FILL, stroke: PURPLE_STROKE, txt: PURPLE_TXT, label: 'T6', state: 'OPEN' },
    inv1: { fill: AMBER_FILL, stroke: AMBER_STROKE, txt: AMBER_TXT, out: 'OUT: 1 (HIGH)' },
    inv2: { fill: BLUE_FILL, stroke: BLUE_STROKE, txt: BLUE_TXT, out: 'OUT: 0 (LOW)' },
    cross1: H, cross2: L,
    t5conn: H, t6conn: L,
    sense: { fill: TEAL_FILL, stroke: TEAL_STROKE, txt: TEAL_TXT, label: 'Detected: 1' }
  }
];

const nav = document.getElementById('nav');
const desc = document.getElementById('desc');

steps.forEach((s, i) => {
  const b = document.createElement('button');
  b.className = 'sram-btn';
  b.textContent = s.title;
  b.onclick = () => show(i);
  nav.appendChild(b);
});

function setFill(id, fill, stroke) {
  const el = document.getElementById(id);
  el.style.fill = fill;
  el.style.stroke = stroke;
}
function setStroke(id, color) {
  document.getElementById(id).style.stroke = color;
}
function setTxt(id, val, color) {
  const el = document.getElementById(id);
  if (val) el.textContent = val;
  if (color) el.style.fill = color;
}

function show(i) {
  const s = steps[i];
  nav.querySelectorAll('.sram-btn').forEach((b,j) => b.classList.toggle('active', j===i));
  desc.innerHTML = s.desc;

  setStroke('addr-line', s.addr);
  document.getElementById('addr-line').style.strokeWidth = s.addrW + 'px';

  setStroke('bl-top', s.bl); setStroke('bl-bot', s.bl);
  setStroke('br-top', s.br); setStroke('br-bot', s.br);

  setFill('t5-body', s.t5.fill, s.t5.stroke);
  setTxt('t5-txt', s.t5.label, s.t5.txt);
  setTxt('t5-state', s.t5.state, s.t5.txt);
  setFill('t6-body', s.t6.fill, s.t6.stroke);
  setTxt('t6-txt', s.t6.label, s.t6.txt);
  setTxt('t6-state', s.t6.state, s.t6.txt);

  setFill('inv1-body', s.inv1.fill, s.inv1.stroke);
  setTxt('inv1-title', 'Inverter A', s.inv1.txt);
  
  // Dynamically color the subtitles so they pop off their backgrounds!
  setTxt('inv1-sub', '(T1 + T3)', s.inv1.txt);
  document.getElementById('inv1-sub').style.opacity = '0.65'; 
  setTxt('inv1-out', s.inv1.out, s.inv1.txt);
  
  setFill('inv2-body', s.inv2.fill, s.inv2.stroke);
  setTxt('inv2-title', 'Inverter B', s.inv2.txt);
  
  // Dynamically color the subtitles so they pop off their backgrounds!
  setTxt('inv2-sub', '(T2 + T4)', s.inv2.txt);
  document.getElementById('inv2-sub').style.opacity = '0.65';
  setTxt('inv2-out', s.inv2.out, s.inv2.txt);

  setStroke('cross1', s.cross1);
  setStroke('cross2', s.cross2);
  setStroke('t5-conn', s.t5conn);
  setStroke('t5-to-inv1', s.t5conn);
  setStroke('t6-conn', s.t6conn);
  setStroke('t6-to-inv2', s.t6conn);

  setFill('sense-body', s.sense.fill, s.sense.stroke);
  setTxt('sense-txt', s.sense.label, s.sense.txt);
}

show(0);
</script>
```

The core insight is that the two inverters create a self-sustaining loop. Each one's output justifies the other's output, so the state holds itself in place with zero outside help. That's the entire reason SRAM doesn't need refresh. DRAM stores a charge on a passive capacitor that slowly leaks. SRAM stores a logical state in an active circuit that continuously reinforces itself.

The price you pay is those 6 transistors per bit (versus DRAM's 1 transistor + 1 capacitor). That's why SRAM is faster but far more expensive per bit — and why it's reserved for small, speed-critical caches while DRAM handles the bulk storage.
:::

### SRAM vs. DRAM — A Quick Comparison

Both SRAM and DRAM are **volatile** — they both need power to hold their data. But beyond that, they differ in almost every way:

**DRAM** is simpler to build (1 transistor + 1 capacitor per cell), smaller per bit, higher density, and cheaper. But it needs constant refreshing.

**SRAM** is faster — no refresh delays, no destructive reads. But it uses 6 transistors per cell, so it's larger, less dense, and more expensive.

This is why **DRAM is used for main memory** (where you need lots of gigabytes at a reasonable price) and **SRAM is used for cache** (where you need blazing speed and don't mind the higher cost for smaller amounts).

## ROM: Memory That Doesn't Forget

While RAM is great for active computation, sometimes you need memory that survives a power cycle. That's where **ROM** (Read Only Memory) comes in.

ROM is **nonvolatile** — no power source is needed to maintain the stored data. It's used for things like:

* **BIOS/firmware** — the code that boots your computer before the OS loads

* **Library subroutines** — frequently used functions baked into hardware

* **Function tables** — lookup tables for common calculations

### The ROM Family

ROM comes in several varieties, each with different trade-offs between flexibility and cost:

**ROM (Mask ROM):** The data is literally wired in during the manufacturing process using photographic masks. It's permanent and cannot be changed. This makes it extremely cheap at scale, but there's absolutely no room for error — if the data is wrong, you throw away the whole chip. Best for mass-produced devices where the firmware will never change.

**PROM (Programmable ROM):** Like ROM, but the user can write data to it **once** after manufacture, using special programming equipment. It's non-erasable, so mistakes are permanent. PROM is ideal for small production runs or prototyping where mask ROM's setup costs aren't justified.

**EPROM (Erasable Programmable ROM):** A step up — EPROM can be erased by exposing the chip to **ultraviolet light** through a small quartz window on the chip package. UV exposure erases the entire chip (you can't selectively erase), and the process takes a relatively long time (minutes to hours). Once erased, it can be reprogrammed electrically.

**EEPROM (Electrically Erasable PROM):** No UV lamp needed — EEPROM can be erased and reprogrammed **electrically at the byte level**. You can update individual bytes without erasing the whole chip. The downsides: writing takes much longer than reading, and EEPROM is more expensive and less dense than EPROM.

**Flash Memory:** Flash is the sweet spot between EPROM and EEPROM. It erases **electrically** (no UV light needed) but at the **block level** rather than byte level. A section of memory cells are erased in a single fast action — that's where the name "flash" comes from. It uses only one transistor per bit (like EPROM), achieving high density, while being much faster to program than EEPROM.

## Inside a DRAM Chip: Organisation

Let's look at how a real DRAM chip is organised internally, using a **16 Mbit DRAM (4M × 4)** as an example. This chip stores 16 megabits of data, arranged as 4 million locations, each storing 4 bits.

:::info
**"4M × 4"** means there are **4 million individual lockers** (locations), and every time you open one locker, you put in or take out exactly **4 bits** of data at once.
:::

The memory array is physically laid out as a **2048 × 2048 × 4** grid. But 2048 rows × 2048 columns × 4 bits = 16,777,216 bits = 16 Mbit. To address 2048 rows, you need 11 address lines (since $2¹¹$ = 2048).

**The clever trick — address multiplexing:**

Instead of using 22 address pins (11 for rows + 11 for columns), DRAM chips **multiplex** the address: they send the row address and column address *over the same pins at different times*. First, the row address is sent and latched with the **RAS (Row Address Strobe)** signal. Then the column address is sent and latched with the **CAS (Column Address Strobe)** signal. This cuts the pin count roughly in half — a huge deal for chip packaging.

:::info
### Visualisation

```custom-html
<style>
  /* Added fallbacks for Claude CSS Variables */
  .step-container { 
    max-width: 640px; 
    margin: 0 auto; 
    padding: 1rem 0; 
    font-family: var(--font-sans); 
  }
  .step-nav { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
  .step-btn { 
    padding: 6px 14px; 
    border-radius: var(--border-radius-md); 
    border: 1px solid var(--color-border-tertiary); 
    background: var(--color-background-secondary); 
    color: var(--color-text-secondary); 
    font-size: 13px; 
    cursor: pointer; 
    transition: all .2s; 
  }
  .step-btn:hover { background: var(--color-border-tertiary); }
  .step-btn.active { background: #534AB7; color: #fff; border-color: #534AB7; }
  .step-desc { 
    font-size: 15px; 
    line-height: 1.65; 
    color: var(--color-text-primary); 
    margin-bottom: 16px; 
    min-height: 80px; 
  }
  .signal-row { 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    margin: 6px 0; 
    font-family: var(--font-mono); 
    font-size: 13px; 
  }
  .signal-label { 
    width: 110px; 
    text-align: right; 
    color: var(--color-text-secondary); 
    font-family: var(--font-sans); 
    font-size: 13px; 
  }
  .pin-group { display: flex; gap: 3px; }
  .pin { 
    width: 22px; 
    height: 26px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    border-radius: 4px; 
    font-size: 12px; 
    font-weight: 500; 
    transition: all .3s; 
  }
  .pin-off { 
    background: var(--color-background-tertiary); 
    color: var(--color-text-tertiary); 
  }
  .pin-row { background: #7F77DD; color: #fff; }
  .pin-col { background: #1D9E75; color: #fff; }
  .pin-data { background: #D85A30; color: #fff; }
  .signal-line { display: flex; align-items: center; gap: 4px; }
  .sig-block { 
    height: 24px; 
    border-radius: 3px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: 11px; 
    font-weight: 500; 
    min-width: 60px; 
    padding: 0 8px; 
    transition: all .3s; 
  }
  .sig-high { 
    background: var(--color-background-tertiary); 
    color: var(--color-text-tertiary); 
  }
  .sig-low { background: #534AB7; color: #fff; }
  .sig-label { 
    font-size: 11px; 
    color: var(--color-text-tertiary); 
  }
  .chip-state { 
    margin-top: 16px; 
    padding: 12px 16px; 
    border-radius: var(--border-radius-lg); 
    background: var(--color-background-secondary); 
    border: 1px solid var(--color-border-tertiary); 
  }
  .chip-title { 
    font-size: 13px; 
    font-weight: 500; 
    color: var(--color-text-secondary); 
    margin-bottom: 8px; 
  }
  .chip-detail { 
    font-size: 14px; 
    color: var(--color-text-primary); 
    line-height: 1.6; 
  }
  .highlight { font-weight: 500; }
  .h-purple { color: #7F77DD; }
  .h-teal { color: #1D9E75; }
  .h-coral { color: #D85A30; }
</style>

<div class="step-container">
  <div class="step-nav" id="nav"></div>
  <div class="step-desc" id="desc"></div>
  <div id="signals"></div>
  <div class="chip-state">
    <div class="chip-title">Inside the chip</div>
    <div class="chip-detail" id="chip"></div>
  </div>
</div>
<script>
const steps = [
  {
    title: "1. Idle",
    desc: "Nothing is happening. The 11 address pins are idle. RAS and CAS are both HIGH (inactive — they're active-low signals, meaning they trigger when pulled LOW). The data pins are floating.",
    pins: [0,0,0,0,0,0,0,0,0,0,0],
    pinStyle: "off",
    ras: "high", cas: "high",
    chip: "All row and column decoders are inactive. The memory array is dormant, waiting for a command."
  },
  {
    title: "2. Row address placed",
    desc: "The memory controller puts the <span class='h-purple highlight'>row address</span> (e.g. row 1042 = 10000010010 in binary) onto the 11 address pins. The pins now carry the binary digits of the row number. But the chip hasn't read them yet — it's waiting for the signal.",
    pins: [1,0,0,0,0,0,1,0,0,1,0],
    pinStyle: "row",
    ras: "high", cas: "high",
    chip: "The address pins have voltages on them representing row 1042, but the chip's row latch hasn't captured them yet. Think of it like someone holding up a sign — the chip hasn't looked yet."
  },
  {
    title: "3. RAS goes LOW",
    desc: "The memory controller pulls <span class='h-purple highlight'>RAS low</span>. This is the \"look now!\" signal. The chip reads the 11 address pins and <strong>latches</strong> (saves internally) the value as the row address. The row decoder activates row 1042, connecting all 2048 cells in that row to the sense amplifiers.",
    pins: [1,0,0,0,0,0,1,0,0,1,0],
    pinStyle: "row",
    ras: "low", cas: "high",
    chip: "Row latch captured: <span class='h-purple'>row 1042</span>. The entire row of 2048 capacitors is now dumping their tiny charges into the sense amplifiers, which boost them to readable voltage levels. This takes time — it's the biggest delay in a DRAM read."
  },
  {
    title: "4. Column address placed",
    desc: "Now the memory controller <strong>changes</strong> the values on the <em>same 11 pins</em> to the <span class='h-teal highlight'>column address</span> (e.g. column 817 = 01100110001). The row address is safe — it was already latched inside the chip in step 3.",
    pins: [0,1,1,0,0,1,1,0,0,0,1],
    pinStyle: "col",
    ras: "low", cas: "high",
    chip: "Row 1042 is still active (held by the latch). All 2048 cells in that row have been amplified. The address pins now show a new number, but the chip hasn't read it yet."
  },
  {
    title: "5. CAS goes LOW",
    desc: "The memory controller pulls <span class='h-teal highlight'>CAS low</span> — \"read the column now!\" The chip latches the column address, and the column decoder selects column 817 from the already-active row. The 4 bits at [row 1042, col 817] are routed to the output buffers.",
    pins: [0,1,1,0,0,1,1,0,0,0,1],
    pinStyle: "col",
    ras: "low", cas: "low",
    chip: "Column latch captured: <span class='h-teal'>column 817</span>. The column decoder picks 4 bits from the 2048 amplified cells. Those 4 bits are driven onto the data output pins."
  },
  {
    title: "6. Data appears",
    desc: "The 4 data bits (e.g. <span class='h-coral highlight'>1011</span>) appear on the data output pins. The memory controller reads them. The full read is complete — the CPU gets its 4 bits of data.",
    pins: [0,1,1,0,0,1,1,0,0,0,1],
    pinStyle: "col",
    ras: "low", cas: "low",
    data: [1,0,1,1],
    chip: "Data output buffers are driving <span class='h-coral'>1011</span> onto the 4 data pins. The memory controller captures these bits and forwards them to the CPU. Total time: ~60–70 nanoseconds for older DRAM."
  },
  {
    title: "7. Precharge",
    desc: "RAS and CAS return HIGH. The chip deactivates the row, recharges the sense amplifiers, and gets ready for the next access. Reading a capacitor is destructive — the charge leaked out during sensing — so the sense amplifiers also <strong>write the data back</strong> into the row.",
    pins: [0,0,0,0,0,0,0,0,0,0,0],
    pinStyle: "off",
    ras: "high", cas: "high",
    chip: "The sense amplifiers restore the charge in all 2048 cells of row 1042 (read is destructive, so this is essential). The chip returns to idle, ready for the next row+column cycle."
  }
];

const nav = document.getElementById('nav');
const desc = document.getElementById('desc');
const signals = document.getElementById('signals');
const chip = document.getElementById('chip');
let current = 0;

steps.forEach((s, i) => {
  const b = document.createElement('button');
  b.className = 'step-btn';
  b.textContent = s.title;
  b.onclick = () => show(i);
  nav.appendChild(b);
});

function show(i) {
  current = i;
  const s = steps[i];
  nav.querySelectorAll('.step-btn').forEach((b,j) => b.classList.toggle('active', j===i));
  desc.innerHTML = s.desc;
  chip.innerHTML = s.chip;

  let html = '';
  html += '<div class="signal-row"><span class="signal-label">Address pins</span><div class="pin-group">';
  s.pins.forEach((v,j) => {
    const cls = s.pinStyle === 'off' ? 'pin-off' : s.pinStyle === 'row' ? 'pin-row' : 'pin-col';
    html += `<div class="pin ${cls}">${s.pinStyle==='off'?'—':v}</div>`;
  });
  html += '</div></div>';

  html += '<div class="signal-row"><span class="signal-label">RAS signal</span>';
  html += `<div class="sig-block ${s.ras==='high'?'sig-high':'sig-low'}">${s.ras==='high'?'HIGH (idle)':'LOW (active!)'}</div>`;
  html += '</div>';

  html += '<div class="signal-row"><span class="signal-label">CAS signal</span>';
  html += `<div class="sig-block ${s.cas==='high'?'sig-high':'sig-low'}">${s.cas==='high'?'HIGH (idle)':'LOW (active!)'}</div>`;
  html += '</div>';

  if (s.data) {
    html += '<div class="signal-row"><span class="signal-label">Data out</span><div class="pin-group">';
    s.data.forEach(v => { html += `<div class="pin pin-data">${v}</div>`; });
    html += '</div></div>';
  }

  signals.innerHTML = html;
}

show(0);
</script>
```

**What multiplexing actually does**

Instead of 22 pins carrying row and column simultaneously, you use just 11 pins and send the address in two steps over those same wires. It's like having a single mailbox slot: first you slide in a card that says "row 1,042", then you slide in a second card that says "column 817." The chip remembers the first card while reading the second.

**What RAS and CAS actually are**

The chip needs to know *when* each card arrives. That's what RAS and CAS signals do — they're timing signals (active-low pulses on dedicated pins) that say "read the address pins NOW."

RAS (Row Address Strobe): "The number on the address pins right now is the **row** address — latch it." The chip captures those 11 bits and stores them in an internal register.

CAS (Column Address Strobe): "The number on the address pins right now is the **column** address — latch it." The chip captures those 11 bits into a second register.

So RAS and CAS are just "now!" signals that tell the chip which half of the address it's looking at. They're two additional pins, but you saved 11 address pins, so it's a huge net win (13 pins instead of 22).

<br />

The grid cells themselves don't "remember" any signal from the CPU. Each cell is just a tiny capacitor holding a charge (1) or not (0). All the intelligence — decoding addresses, timing the read, amplifying the faint charges — lives in the circuitry *surrounding* the grid. The capacitors are passive storage; everything else is active logic that interprets the CPU's requests and routes data to the right place.
:::

The chip also includes a **refresh counter** (to cycle through rows during refresh), a **MUX** (to select between external addresses and refresh addresses), **row and column decoders**, and **data I/O buffers**.

:::info
### Additional notes

**Row and column decoders**: these are what actually *use* the latched addresses. The row decoder takes the 11-bit row number and activates one physical wire out of 2048. The column decoder does the same for columns. They're the bridge between "the chip received address bits" and "the correct cells are now connected."

**Refresh counter**: this is just a simple counter that automatically cycles through row numbers (0, 1, 2, ... 2047, 0, 1, ...) so every row gets refreshed periodically. We already covered *why* refresh is needed in the DRAM section. The counter is just the mechanism that automates it.

**MUX (multiplexer)**: during normal operation, the row decoder receives the external address from the CPU. During refresh, it needs the address from the refresh counter instead. The MUX is a simple switch that picks between these two sources.

**Data I/O buffers**: just the circuitry that drives the data pins during a read and receives data during a write. Straightforward.
:::

### Packaging and Chip Pinouts

Memory chips come in standard packages with defined pinouts. For example, an 8 Mbit EPROM might use a 32-pin DIP (Dual In-line Package), while a 16 Mbit DRAM uses a 24-pin package. The DRAM needs fewer pins partly because of address multiplexing, a neat design win.

:::info
### Visualisation

A DIP (Dual In-line Package) is the physical chip you'd see on a circuit board — a rectangular plastic or ceramic body with metal pins sticking out in two parallel rows along the sides. Every pin has a specific job. For a memory chip, the pins fall into a few categories: address pins (to specify which location), data pins (to carry the bits in/out), control pins (like chip enable, read/write select, and for DRAM, RAS/CAS), and power pins (VCC and ground).

```custom-html
<h2 class="sr-only">Side-by-side comparison of 8 Mbit EPROM (32 pins) versus 16 Mbit DRAM (24 pins) showing how address multiplexing reduces pin count.</h2>
<style>
  /* Added fallbacks for Claude CSS Variables */
  .chip { display: inline-flex; flex-direction: column; align-items: center; }
  .chip-body { position: relative; border: 1.5px solid var(--color-text-primary); border-radius: 4px; display: flex; }
  .pin-col { display: flex; flex-direction: column; gap: 2px; padding: 4px 0; }
  .pin { height: 14px; width: 38px; display: flex; align-items: center; font-size: 11px; font-family: var(--font-mono); }
  .pin-l { justify-content: flex-end; padding-right: 4px; border-right: 1.5px solid var(--color-text-primary); }
  .pin-r { justify-content: flex-start; padding-left: 4px; border-left: 1.5px solid var(--color-text-primary); }
  .pin-addr { color: #534AB7; }
  .pin-data { color: #D85A30; }
  .pin-ctrl { color: #1D9E75; }
  .pin-pwr { color: var(--color-text-tertiary); }
  .notch { width: 20px; height: 10px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; border-bottom: 1.5px solid var(--color-text-primary); border-left: 1.5px solid var(--color-text-primary); border-right: 1.5px solid var(--color-text-primary); margin: 0 auto; position: relative; top: -1px; }
  .chip-label { font-size: 11px; color: var(--color-text-secondary); writing-mode: vertical-rl; text-orientation: mixed; padding: 0 6px; display: flex; align-items: center; justify-content: center; letter-spacing: 1px; }
  .compare { display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; padding: 0.5rem 0; }
  .section { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .section-title { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
  .section-sub { font-size: 12px; color: var(--color-text-secondary); text-align: center; }
  .legend { display: flex; gap: 16px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--color-text-secondary); }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
  .tally { margin-top: 12px; padding: 10px 14px; border-radius: var(--border-radius-md); background: var(--color-background-secondary); border: 1px solid var(--color-border-tertiary); font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; width: 100%; max-width: 220px; }
  .tally strong { color: var(--color-text-primary); font-weight: 500; }
</style>
<div class="compare">
  <div class="section">
    <div class="section-title">8 Mbit EPROM</div>
    <div class="section-sub">1M locations x 8 bits</div>
    <div class="chip">
      <div class="notch"></div>
      <div class="chip-body">
        <div class="pin-col">
          <div class="pin pin-l pin-addr">A19</div>
          <div class="pin pin-l pin-addr">A16</div>
          <div class="pin pin-l pin-addr">A15</div>
          <div class="pin pin-l pin-addr">A12</div>
          <div class="pin pin-l pin-addr">A7</div>
          <div class="pin pin-l pin-addr">A6</div>
          <div class="pin pin-l pin-addr">A5</div>
          <div class="pin pin-l pin-addr">A4</div>
          <div class="pin pin-l pin-addr">A3</div>
          <div class="pin pin-l pin-addr">A2</div>
          <div class="pin pin-l pin-addr">A1</div>
          <div class="pin pin-l pin-addr">A0</div>
          <div class="pin pin-l pin-data">D0</div>
          <div class="pin pin-l pin-data">D1</div>
          <div class="pin pin-l pin-data">D2</div>
          <div class="pin pin-l pin-pwr">GND</div>
        </div>
        <div class="chip-label">EPROM</div>
        <div class="pin-col">
          <div class="pin pin-r pin-pwr">VCC</div>
          <div class="pin pin-r pin-addr">A18</div>
          <div class="pin pin-r pin-addr">A17</div>
          <div class="pin pin-r pin-addr">A14</div>
          <div class="pin pin-r pin-addr">A13</div>
          <div class="pin pin-r pin-addr">A8</div>
          <div class="pin pin-r pin-addr">A9</div>
          <div class="pin pin-r pin-addr">A11</div>
          <div class="pin pin-r pin-ctrl">OE</div>
          <div class="pin pin-r pin-addr">A10</div>
          <div class="pin pin-r pin-ctrl">CE</div>
          <div class="pin pin-r pin-data">D7</div>
          <div class="pin pin-r pin-data">D6</div>
          <div class="pin pin-r pin-data">D5</div>
          <div class="pin pin-r pin-data">D4</div>
          <div class="pin pin-r pin-data">D3</div>
        </div>
      </div>
    </div>
    <div class="tally">
      <span class="pin-addr">20 address pins</span><br>
      <span class="pin-data">8 data pins</span><br>
      <span class="pin-ctrl">2 control pins</span><br>
      <span class="pin-pwr">2 power pins</span><br>
      <strong>= 32 pins total</strong>
    </div>
  </div>

  <div class="section">
    <div class="section-title">16 Mbit DRAM</div>
    <div class="section-sub">4M locations x 4 bits</div>
    <div class="chip">
      <div class="notch"></div>
      <div class="chip-body">
        <div class="pin-col">
          <div class="pin pin-l pin-addr">A0</div>
          <div class="pin pin-l pin-addr">A1</div>
          <div class="pin pin-l pin-addr">A2</div>
          <div class="pin pin-l pin-addr">A3</div>
          <div class="pin pin-l pin-data">DQ1</div>
          <div class="pin pin-l pin-addr">A4</div>
          <div class="pin pin-l pin-addr">A5</div>
          <div class="pin pin-l pin-addr">A6</div>
          <div class="pin pin-l pin-addr">A7</div>
          <div class="pin pin-l pin-data">DQ2</div>
          <div class="pin pin-l pin-addr">A8</div>
          <div class="pin pin-l pin-pwr">VSS</div>
        </div>
        <div class="chip-label">DRAM</div>
        <div class="pin-col">
          <div class="pin pin-r pin-pwr">VCC</div>
          <div class="pin pin-r pin-addr">A10</div>
          <div class="pin pin-r pin-addr">A9</div>
          <div class="pin pin-r pin-ctrl">RAS</div>
          <div class="pin pin-r pin-data">DQ4</div>
          <div class="pin pin-r pin-ctrl">CAS</div>
          <div class="pin pin-r pin-ctrl">WE</div>
          <div class="pin pin-r pin-ctrl">OE</div>
          <div class="pin pin-r pin-data">DQ3</div>
          <div class="pin pin-r pin-pwr">NC</div>
          <div class="pin pin-r pin-pwr">NC</div>
          <div class="pin pin-r pin-pwr">VSS</div>
        </div>
      </div>
    </div>
    <div class="tally">
      <span class="pin-addr">11 address pins</span> (multiplexed!)<br>
      <span class="pin-data">4 data pins</span><br>
      <span class="pin-ctrl">4 control pins</span> (RAS, CAS, WE, OE)<br>
      <span class="pin-pwr">3 power + 2 NC</span><br>
      <strong>= 24 pins total</strong>
    </div>
  </div>
</div>
<div class="legend">
  <div class="legend-item"><div class="legend-dot" style="background:#534AB7"></div>Address</div>
  <div class="legend-item"><div class="legend-dot" style="background:#D85A30"></div>Data</div>
  <div class="legend-item"><div class="legend-dot" style="background:#1D9E75"></div>Control</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--color-text-tertiary)"></div>Power / unused</div>
</div>
```

The DRAM stores **twice as much data** (16 Mbit vs 8 Mbit) yet uses **fewer pins** (24 vs 32). That's almost entirely because of address multiplexing.

The EPROM needs 20 address pins because it has 1M locations ($2²⁰$ = 1,048,576) and sends the full address all at once — no multiplexing. The DRAM needs to address 2048 rows and 2048 columns (22 address bits total), but because it sends them at different times over the same wires, it only needs 11 address pins. It trades two extra control pins (RAS and CAS) for saving 11 address pins
:::

### Building Bigger: Memory Modules

A single chip usually stores one bit (or a few bits) per address. To build a full **byte-wide** memory system, you combine multiple chips into a **module**.

For example, to build a **256 kByte module**, you can combine **eight** 1-bit RAM chips, each with 256k locations. All eight chips share the same address bus, and each chip contributes one bit to form an 8-bit (1-byte) data word. The Memory Address Register (MAR) feeds the address to all chips simultaneously, and the Memory Buffer Register (MBR) collects the 8 bits.

```custom-html
<h2 class="sr-only">Diagram showing 8 single-bit RAM chips wired together to form one byte-wide memory module, sharing an address bus.</h2>
<style>
  /* --- CSS to style the colored chips (MAR, Chips 0-7, MBR) --- */
  svg text {
    font-family: var(--font-sans);
  }
  
  .th { font-weight: 500; font-size: 14px; }
  .ts { font-size: 12px; fill: var(--color-text-secondary); }

  /* Purple Box (MAR) */
  .c-purple rect { 
    fill: var(--color-purple-bg); /* Dark purple */
    stroke: #534AB7; 
    stroke-width: 1.5; 
  }
  .c-purple .th { fill: #ffffff; }
  .c-purple .ts { fill: #c8c4f0; } /* Light purple text */

  /* Teal Boxes (Chips 0-7) */
  .c-teal rect { 
    fill: var(--color-teal-bg); /* Dark teal */
    stroke: #1D9E75; 
    stroke-width: 1.5; 
  }
  .c-teal .th { fill: #ffffff; }
  .c-teal .ts { fill: #a5d8c7; } /* Light teal text */

  /* Coral Box (MBR) */
  .c-coral rect { 
    fill: var(--color-coral-bg); /* Dark coral */
    stroke: #D85A30; 
    stroke-width: 1.5; 
  }
  .c-coral .th { fill: #ffffff; }
  .c-coral .ts { fill: #f3bda8; } /* Light coral text */
</style>
<svg width="100%" viewBox="0 0 680 520" role="img">
  <title>256 kByte memory module from eight 1-bit chips</title>
  <desc>Eight chips share one address bus from the MAR, each contributing one bit to form an 8-bit word collected by the MBR.</desc>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <g class="c-purple">
    <rect x="240" y="30" width="200" height="44" rx="8" stroke-width="0.5"/>
    <text class="th" x="340" y="46" text-anchor="middle" dominant-baseline="central">MAR</text>
    <text class="ts" x="340" y="62" text-anchor="middle" dominant-baseline="central">Address: row 7, col 42</text>
  </g>

  <line x1="340" y1="74" x2="340" y2="110" stroke="#534AB7" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="80" y1="120" x2="600" y2="120" stroke="#534AB7" stroke-width="2.5" stroke-linecap="round"/>
  <text class="ts" x="614" y="124" text-anchor="start" style="fill:#534AB7">Address bus</text>
  <text class="ts" x="614" y="138" text-anchor="start" style="fill:#534AB7">(shared)</text>

  <line x1="109" y1="120" x2="109" y2="160" stroke="#534AB7" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="179" y1="120" x2="179" y2="160" stroke="#534AB7" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="249" y1="120" x2="249" y2="160" stroke="#534AB7" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="319" y1="120" x2="319" y2="160" stroke="#534AB7" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="389" y1="120" x2="389" y2="160" stroke="#534AB7" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="459" y1="120" x2="459" y2="160" stroke="#534AB7" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="529" y1="120" x2="529" y2="160" stroke="#534AB7" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="599" y1="120" x2="599" y2="160" stroke="#534AB7" stroke-width="1" marker-end="url(#arrow)"/>

  <g class="c-teal"><rect x="80"  y="164" width="58" height="140" rx="6" stroke-width="0.5"/>
    <text class="th" x="109" y="200" text-anchor="middle" dominant-baseline="central" style="font-size:12px">Chip 0</text>
    <text class="ts" x="109" y="220" text-anchor="middle" dominant-baseline="central">256K</text>
    <text class="ts" x="109" y="236" text-anchor="middle" dominant-baseline="central">x 1</text>
    <text class="ts" x="109" y="280" text-anchor="middle" dominant-baseline="central">bit 0</text></g>

  <g class="c-teal"><rect x="150" y="164" width="58" height="140" rx="6" stroke-width="0.5"/>
    <text class="th" x="179" y="200" text-anchor="middle" dominant-baseline="central" style="font-size:12px">Chip 1</text>
    <text class="ts" x="179" y="220" text-anchor="middle" dominant-baseline="central">256K</text>
    <text class="ts" x="179" y="236" text-anchor="middle" dominant-baseline="central">x 1</text>
    <text class="ts" x="179" y="280" text-anchor="middle" dominant-baseline="central">bit 1</text></g>

  <g class="c-teal"><rect x="220" y="164" width="58" height="140" rx="6" stroke-width="0.5"/>
    <text class="th" x="249" y="200" text-anchor="middle" dominant-baseline="central" style="font-size:12px">Chip 2</text>
    <text class="ts" x="249" y="220" text-anchor="middle" dominant-baseline="central">256K</text>
    <text class="ts" x="249" y="236" text-anchor="middle" dominant-baseline="central">x 1</text>
    <text class="ts" x="249" y="280" text-anchor="middle" dominant-baseline="central">bit 2</text></g>

  <g class="c-teal"><rect x="290" y="164" width="58" height="140" rx="6" stroke-width="0.5"/>
    <text class="th" x="319" y="200" text-anchor="middle" dominant-baseline="central" style="font-size:12px">Chip 3</text>
    <text class="ts" x="319" y="220" text-anchor="middle" dominant-baseline="central">256K</text>
    <text class="ts" x="319" y="236" text-anchor="middle" dominant-baseline="central">x 1</text>
    <text class="ts" x="319" y="280" text-anchor="middle" dominant-baseline="central">bit 3</text></g>

  <g class="c-teal"><rect x="360" y="164" width="58" height="140" rx="6" stroke-width="0.5"/>
    <text class="th" x="389" y="200" text-anchor="middle" dominant-baseline="central" style="font-size:12px">Chip 4</text>
    <text class="ts" x="389" y="220" text-anchor="middle" dominant-baseline="central">256K</text>
    <text class="ts" x="389" y="236" text-anchor="middle" dominant-baseline="central">x 1</text>
    <text class="ts" x="389" y="280" text-anchor="middle" dominant-baseline="central">bit 4</text></g>

  <g class="c-teal"><rect x="430" y="164" width="58" height="140" rx="6" stroke-width="0.5"/>
    <text class="th" x="459" y="200" text-anchor="middle" dominant-baseline="central" style="font-size:12px">Chip 5</text>
    <text class="ts" x="459" y="220" text-anchor="middle" dominant-baseline="central">256K</text>
    <text class="ts" x="459" y="236" text-anchor="middle" dominant-baseline="central">x 1</text>
    <text class="ts" x="459" y="280" text-anchor="middle" dominant-baseline="central">bit 5</text></g>

  <g class="c-teal"><rect x="500" y="164" width="58" height="140" rx="6" stroke-width="0.5"/>
    <text class="th" x="529" y="200" text-anchor="middle" dominant-baseline="central" style="font-size:12px">Chip 6</text>
    <text class="ts" x="529" y="220" text-anchor="middle" dominant-baseline="central">256K</text>
    <text class="ts" x="529" y="236" text-anchor="middle" dominant-baseline="central">x 1</text>
    <text class="ts" x="529" y="280" text-anchor="middle" dominant-baseline="central">bit 6</text></g>

  <g class="c-teal"><rect x="570" y="164" width="58" height="140" rx="6" stroke-width="0.5"/>
    <text class="th" x="599" y="200" text-anchor="middle" dominant-baseline="central" style="font-size:12px">Chip 7</text>
    <text class="ts" x="599" y="220" text-anchor="middle" dominant-baseline="central">256K</text>
    <text class="ts" x="599" y="236" text-anchor="middle" dominant-baseline="central">x 1</text>
    <text class="ts" x="599" y="280" text-anchor="middle" dominant-baseline="central">bit 7</text></g>

  <line x1="109" y1="304" x2="109" y2="340" stroke="#D85A30" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="179" y1="304" x2="179" y2="340" stroke="#D85A30" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="249" y1="304" x2="249" y2="340" stroke="#D85A30" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="319" y1="304" x2="319" y2="340" stroke="#D85A30" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="389" y1="304" x2="389" y2="340" stroke="#D85A30" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="459" y1="304" x2="459" y2="340" stroke="#D85A30" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="529" y1="304" x2="529" y2="340" stroke="#D85A30" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="599" y1="304" x2="599" y2="340" stroke="#D85A30" stroke-width="1" marker-end="url(#arrow)"/>

  <text class="ts" x="48" y="352" text-anchor="end" style="fill:#D85A30">1 bit each</text>

  <line x1="80" y1="350" x2="628" y2="350" stroke="#D85A30" stroke-width="2.5" stroke-linecap="round"/>

  <line x1="340" y1="350" x2="340" y2="390" stroke="#D85A30" stroke-width="1.5" marker-end="url(#arrow)"/>

  <g class="c-coral">
    <rect x="220" y="396" width="240" height="44" rx="8" stroke-width="0.5"/>
    <text class="th" x="340" y="412" text-anchor="middle" dominant-baseline="central">MBR</text>
    <text class="ts" x="340" y="428" text-anchor="middle" dominant-baseline="central">Collected: 10110011</text>
  </g>

  <line x1="340" y1="440" x2="340" y2="480" stroke="#D85A30" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text class="ts" x="340" y="500" text-anchor="middle">1 full byte to CPU</text>
</svg>
```

Now suppose you want more capacity. You could use bigger chips, but that's expensive. Instead, you duplicate the whole 8-chip module multiple times and add a selection mechanism. A 1 MByte module groups chips into four groups (A, B, C, D), each being a 256 kByte module like the one above. A "chip-group-enable" signal works like a master switch, it tells one group "you're active, respond to this address" while the other three stay silent.

Think of it like four filing cabinets side by side, each with identical drawer numbering (addresses 0 through 256K). The address tells you *which drawer*, and the group-enable tells you *which cabinet*. Together they select one unique byte out of the full 1 MByte. This way you can keep adding cabinets (groups) to grow capacity without needing to redesign the individual chips or the addressing scheme within each group.

## Error Correction: Because Bits Flip

Memory isn't perfect. Errors can and do occur:

* **Hard failures** are permanent physical defects — a cell that's stuck at 0 or 1.

* **Soft errors** are random, non-destructive events. A cosmic ray or electrical noise might flip a bit, but the cell itself is fine. No permanent damage to the memory.

To detect and fix these, memory systems use **error-correcting codes (ECC)**, most commonly **Hamming codes**.

Here's the basic idea: when data (M bits) is written to memory, a function *f* generates K check bits from the data. Both the M data bits and K check bits are stored together. When the data is read back, the same function *f* is applied to the M data bits to generate a *new* set of K check bits. These are **compared** with the stored check bits. If they match, no error. If they differ, the comparison result (called a **syndrome**) identifies which bit flipped, and a **corrector** circuit fixes it. An error signal is also raised so the system knows a correction occurred.

## Advanced DRAM: SDRAM and DDR

Basic DRAM is asynchronous — the processor sends a request and waits an unpredictable amount of time for the data to arrive. As processors got faster, this "waiting around" became a serious bottleneck. Enter the advanced DRAM technologies.

### SDRAM (Synchronous DRAM)

SDRAM changed the game by **synchronizing memory access to an external clock**. In conventional DRAM, the CPU sends a request and then just... waits. With SDRAM, because data transfers happen in lockstep with the system clock, the CPU **knows exactly when the data will be ready**. This means the CPU can go do something else in the meantime instead of sitting idle.

SDRAM also supports **burst mode**: after providing a starting address, the chip can fire out a stream of consecutive data words on successive clock cycles without needing a new address for each one. For example, with a burst length of 4 and a CAS latency of 2, you issue one READ command and get four consecutive data outputs starting two clock cycles later.

### DDR SDRAM (Double Data Rate)

DDR took SDRAM further by transferring data on **both edges of the clock signal** — the rising edge *and* the falling edge. This effectively doubles the data rate without increasing the clock frequency.

But DDR's improvements go beyond that. Each successive DDR generation added a wider **prefetch buffer** — an internal buffer that reads more bits from the memory array in each access:

| Generation | Prefetch Buffer | Voltage | Data Rate        |
| ---------- | --------------- | ------- | ---------------- |
| DDR1       | 2 bits          | 2.5V    | 200–400 Mbps     |
| DDR2       | 4 bits          | 1.8V    | 400–1,066 Mbps   |
| DDR3       | 8 bits          | 1.5V    | 800–2,133 Mbps   |
| DDR4       | 8 bits          | 1.2V    | 2,133–4,266 Mbps |

Notice the pattern: each generation **lowers the voltage** (less power, less heat) while **increasing the data rate**. The internal memory array runs at roughly the same speed across generations — the speed gains come from the wider prefetch and faster I/O bus. DDR4 also introduced a two-multiplexer design with bank groups, further boosting throughput.

## Flash Memory: The Best of Both Worlds

Flash memory deserves its own section because it has become incredibly important in modern computing — from USB drives to SSDs to the storage in your phone.

First introduced in the mid-1980s, flash sits between EPROM and EEPROM in both cost and functionality. Like EEPROM, it erases electrically (no UV light). Like EPROM, it uses only one transistor per bit, achieving high density. The trade-off is that it **cannot erase individual bytes** — you must erase entire blocks at once.

### How Flash Works

A flash memory cell is a modified transistor with an extra layer: a **floating gate** sandwiched between the control gate and the transistor channel, surrounded by insulating oxide.

* **To store a 0:** Electrons are injected onto the floating gate (by applying a high voltage to the control gate). These trapped electrons raise the transistor's threshold voltage, making it harder to turn on. When read, the cell doesn't conduct — that's interpreted as 0.

* **To store a 1:** The floating gate has no trapped electrons (or they've been removed by erasure). The transistor turns on normally when read — that's interpreted as 1.

### NOR vs. NAND Flash

Flash chips come in two main architectures:

**NOR flash** connects each cell individually to the bit line (like NOR gates in parallel). This allows **random access** to any byte — great for executing code directly from flash (called XIP, "execute in place"). NOR flash is typically used for firmware storage and embedded applications.

**NAND flash** connects cells in **series** (like a chain). You can't access individual bytes randomly — you read and write in pages (typically 4 kB or larger). But NAND is **denser and cheaper** per bit because the series connection uses less chip area. NAND flash is what's inside your SSD, USB drive, and smartphone storage.

## Looking Ahead: Nonvolatile RAM (NVRAM)

The memory world is actively pursuing technologies that combine the speed of RAM with the persistence of flash. These **nonvolatile RAM** (NVRAM) technologies sit in the memory hierarchy between DRAM and flash/SSD, potentially offering both fast access and data retention without power.

Some promising NVRAM technologies include STT-RAM (Spin-Transfer Torque RAM), PCRAM (Phase-Change RAM), and ReRAM (Resistive RAM). Each uses a different physical mechanism to store data persistently while aiming for DRAM-like speeds. While these are still maturing, they could eventually blur the line between memory and storage.

## Summary: Putting It All Together

Internal memory is all about trade-offs. Here's how the pieces fit together in a typical system:

**Closest to the CPU → Fastest but smallest and most expensive:**
Registers → SRAM Cache (L1, L2, L3) → DRAM Main Memory → Flash/SSD Storage

Each layer compensates for the weaknesses of the next. SRAM cache hides the relative slowness of DRAM. DRAM provides the capacity that SRAM can't afford. Flash provides persistence that DRAM can't. And the entire hierarchy works together to give you the *illusion* of memory that's fast, big, cheap, and permanent — even though no single technology delivers all four.

Understanding this hierarchy — and the physics behind each layer — is one of the most fundamental insights in computer architecture. Every optimisation in modern computing, from CPU cache policies to SSD wear levelling, traces back to these core trade-offs.
