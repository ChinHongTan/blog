---
title: "Internal Memory: How Your Computer Remembers Things"
date: 2026-04-19T11:38
edited_at: 2026-04-20T13:43:54.932Z
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
### Additional Explaination

### **1. The Core: The Flip-Flop (T₁, T₂, T₃, T₄)**

This is where the data actually lives. These four transistors are wired together to create two "inverters." An inverter is a simple logic gate: whatever signal goes in, the exact opposite comes out (a 1 becomes a 0, and a 0 becomes a 1).

In SRAM, these two inverters are **cross-coupled**, meaning the output of the first is plugged into the input of the second, and the output of the second is plugged into the input of the first.

**The Analogy:** Imagine two people, Alice and Bob, locked in a room.

* Alice’s only rule is: "I must shout the exact opposite of whatever Bob shouts."
* Bob’s only rule is: "I must shout the exact opposite of whatever Alice shouts."

If Alice shouts "YES" (1), Bob hears it and immediately shouts "NO" (0). Alice hears Bob's "NO" and uses it to justify continuing to shout "YES".

They will hold this exact state forever, without needing any outside help, as long as they are awake (connected to power). This self-reinforcing loop is what makes SRAM **static**. It does not need to be refreshed because the circuit actively holds itself in place. Points **C₁** and **C₂** from your text represent what Alice and Bob are currently shouting.

### **2. The Doors: The Access Transistors (T₅ and T₆)**

If T₁ through T₄ are Alice and Bob locked in a room, T₅ and T₆ are two separate doors leading into that room.

* They are both controlled by the **Address Line** (the horizontal wire that selects the row).
* When the Address Line is activated, both doors open simultaneously.

### **3. The Pathways: The Bit Lines (B and B̄)**

Notice that SRAM uses *two* bit lines for a single cell: **B** and **B̄** (pronounced "B-bar" or "B-complement").

* **B** carries the actual data (e.g., a 1).
* **B̄** always carries the exact opposite (e.g., a 0).

We use two lines because the internal loop (Alice and Bob) is very stubborn. To read or write quickly and reliably, we need to interact with both sides of the loop at the same time.

### **How Reading and Writing Works**

* **Writing (Forcing a change):** Let's say the cell is currently storing a 0, but you want to write a 1. The memory controller sends a strong "1" signal down the **B** line, and a strong "0" signal down the **B̄** line. Then, it activates the Address Line, opening the doors (T₅ and T₆). The powerful signals from the outside flood into the room, overpower Alice and Bob, and force them to flip their stances. Once the doors close, the loop stabilizes in its new state.
* **Reading (A non-destructive look):** The controller pre-charges both the **B** and **B̄** lines to a neutral, middle voltage. Then it activates the Address Line to open the doors (T₅ and T₆). Because the internal loop is actively powered, it pushes its internal voltages out through the doors onto the bit lines. The Sense Amplifiers at the bottom of the bit lines detect which line went slightly up and which went slightly down to figure out if it's a 1 or a 0.

Most importantly: **reading does not destroy the data.** Because the flip-flop is constantly connected to the main power supply, looking at its state doesn't drain it the way reading a DRAM capacitor does.
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

The memory array is physically laid out as a **2048 × 2048 × 4** grid. But 2048 rows × 2048 columns × 4 bits = 16,777,216 bits = 16 Mbit. To address 2048 rows, you need 11 address lines (since 2¹¹ = 2048).

**The clever trick — address multiplexing:**

Instead of using 22 address pins (11 for rows + 11 for columns), DRAM chips **multiplex** the address: they send the row address and column address *over the same pins at different times*. First, the row address is sent and latched with the **RAS (Row Address Strobe)** signal. Then the column address is sent and latched with the **CAS (Column Address Strobe)** signal. This cuts the pin count roughly in half — a huge deal for chip packaging.

The chip also includes a **refresh counter** (to cycle through rows during refresh), a **MUX** (to select between external addresses and refresh addresses), **row and column decoders**, and **data I/O buffers**.

### Packaging and Chip Pinouts

Memory chips come in standard packages with defined pinouts. For example, an 8 Mbit EPROM might use a 32-pin DIP (Dual In-line Package), while a 16 Mbit DRAM uses a 24-pin package. The DRAM needs fewer pins partly because of address multiplexing — a neat design win.

### Building Bigger: Memory Modules

A single chip usually stores one bit (or a few bits) per address. To build a full **byte-wide** memory system, you combine multiple chips into a **module**.

For example, to build a **256 kByte module**, you can combine **eight** 1-bit RAM chips, each with 256k locations. All eight chips share the same address bus, and each chip contributes one bit to form an 8-bit (1-byte) data word. The Memory Address Register (MAR) feeds the address to all chips simultaneously, and the Memory Buffer Register (MBR) collects the 8 bits.

A **1 MByte module** scales this up further by grouping chips into four groups (A, B, C, D), with a chip-group-enable signal selecting which group is active. This approach lets you increase capacity by adding more chip groups without redesigning the chip itself.

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
