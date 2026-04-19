---
title: A Top-Level View of Computer Function and Interconnection
date: 2026-04-19T03:15
edited_at: 2026-04-19T03:17:15.140Z
author: chinono
path: /blog/A-Top-Level-View-of-Computer-Function-and-Interconnection
---

So you've heard that computers are made of a processor, memory, and I/O devices — but how do they actually *work together*? This post walks through the big picture: how a computer fetches and runs instructions, how it deals with interruptions, and how all its components talk to each other through buses and point-to-point links.

If you're new to computer architecture, this is a great starting point. Let's dive in.

## 1. The Von Neumann Architecture

Almost every modern computer traces its design back to ideas developed by **John von Neumann** at the Institute for Advanced Studies in Princeton. The architecture rests on three core principles:

1. **Unified memory** — Both data and instructions live in the same read-write memory. There isn't one memory for programs and another for data; they share the same space.
2. **Address-based access** — Memory contents are referenced by their *location* (address), regardless of whether the content is an integer, a character, or a machine instruction.
3. **Sequential execution** — The processor works through instructions one after another, in order, unless an instruction explicitly tells it to jump somewhere else.
   This might sound obvious today, but the alternative — a **hardwired program**, where you physically rewire components to change what the computer does — was once the norm. The von Neumann model gave us the power of *software*: change the program in memory, and the same hardware does something completely different.

### The Three Core Components

At the highest level, a computer is built from three types of modules:

* **Processor (CPU)** — Reads instructions and data, performs computation, writes results, and coordinates everything via control signals. It also receives interrupt signals (more on that soon).

* **Memory** — A collection of *N* words, each with a unique numerical address (0, 1, …, N−1). The processor can read from or write to any address.

* **I/O Modules** — From the computer's internal perspective, I/O works a lot like memory — there are read and write operations. A single I/O module may control multiple external devices (keyboard, display, disk, etc.).
  Two special registers sit between the processor and memory:

* **MAR (Memory Address Register)** — Holds the address of the memory location the processor wants to access.

* **MBR (Memory Buffer Register)** — Holds the data being written to or read from that address.

## 2. The Instruction Cycle

The fundamental rhythm of a processor is the **instruction cycle**: fetch an instruction, then execute it. Over and over again. Let's break that down.

### The Fetch Phase

1. The **Program Counter (PC)** holds the address of the *next* instruction to fetch.
2. The processor reads the instruction at that address from memory.
3. The PC is incremented so it points to the following instruction.
4. The fetched instruction is loaded into the **Instruction Register (IR)**.
5. The processor decodes the instruction and figures out what to do.

### The Execute Phase

Once the processor knows what the instruction says, the action falls into one of four categories:

* **Processor–Memory** — Transfer data between the CPU and main memory (load/store).

* **Processor–I/O** — Transfer data between the CPU and an I/O module.

* **Data processing** — Perform arithmetic or logical operations on data.

* **Control** — Change the sequence of execution (e.g., jump to a different address).

### A Simple Example

Imagine we want to add the contents of memory location **940** to the contents of location **941**. With a simple instruction set, this might take three instruction cycles:

1. **LOAD 940** — Fetch the value at address 940 into the accumulator.
2. **ADD 941** — Fetch the value at address 941 and add it to the accumulator.
3. **STORE 941** — Write the result from the accumulator back to address 941.
   Each of these is one fetch + one execute. Three cycles total.

Now, some processors have more powerful instructions. Consider the PDP-11 instruction `ADD B, A`, which does all of this in a *single* instruction cycle — but that single execute phase is more complex:

1. Fetch the ADD instruction.
2. Read memory location A into the processor.
3. Read memory location B into the processor (the CPU needs two internal registers to hold both values).
4. Add the two values.
5. Write the result back to location A.
   The takeaway: richer instructions can reduce the number of cycles, but each cycle does more work.

## 3. Interrupts

Here's a problem. External devices like printers and disks are *much* slower than the processor. If the CPU sends data to a printer and then just waits for the printer to finish, it wastes thousands of instruction cycles doing nothing. That's terrible for performance.

**Interrupts** solve this by letting other modules (I/O controllers, timers, etc.) signal the processor that something needs attention — *without* forcing the CPU to sit idle.

### Classes of Interrupts

| Class                | What triggers it                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Program**          | A condition arising from instruction execution — arithmetic overflow, division by zero, illegal instruction, or an out-of-bounds memory access. |
| **Timer**            | A hardware timer inside the processor fires periodically, letting the OS perform housekeeping tasks on a regular schedule.                      |
| **I/O**              | An I/O controller signals that an operation has completed normally, that it needs service, or that an error occurred.                           |
| **Hardware failure** | Something physical went wrong — power failure, memory parity error, etc.                                                                        |

### How Interrupts Improve Efficiency

**Without interrupts:** The user program calls WRITE, prepares the I/O data (code segment 4), issues the I/O command, and then *waits* until the device finishes before running the completion code (segment 5). During that wait, the CPU is idle.

**With interrupts:** The program issues the I/O command and then *keeps executing other instructions*. The I/O device works concurrently in the background. When it finishes, it sends an **interrupt request signal**. The processor pauses its current work, jumps to an **interrupt handler** (a small routine, usually part of the OS, that services the device), and then resumes the original program right where it left off.

This is dramatically more efficient. The CPU stays busy doing useful work instead of waiting.

### What Happens During an Interrupt

When the processor detects an interrupt (typically checked at the end of each instruction cycle):

1. **Suspend** the current program and **save its context** (register contents, PC value, status flags) — usually onto a system stack.
2. **Set the PC** to the starting address of the appropriate interrupt handler.
3. **Fetch and execute** the interrupt handler instructions (determine the interrupt source, perform the needed action).
4. **Restore** the saved context and resume the interrupted program.
   There is some overhead — the handler must figure out what caused the interrupt and respond — but the time saved by not idling far outweighs it.

### Short I/O Wait vs. Long I/O Wait

If the I/O operation finishes before the program issues its next WRITE, everything flows smoothly. But if the program reaches a *second* WRITE before the first I/O operation completes, it has to wait — the device is still busy. This is a **long I/O wait**.

### Multiple Interrupts

What if several devices interrupt at the same time? Two strategies:

**1. Disabled (sequential) approach:**
While handling one interrupt, the processor *disables* further interrupts. Any new interrupt stays pending. Once the current handler finishes and re-enables interrupts, the processor checks for and services the next pending interrupt.

* Simple, but it ignores urgency. A time-critical interrupt might have to wait behind a low-priority one.
  **2. Priority-based (nested) approach:**
  Each interrupt source has a **priority level**. A higher-priority interrupt can preempt (interrupt) a lower-priority handler. Lower-priority interrupts must wait.

**Example:** Suppose we have three devices with these priorities — Printer: 2, Disk: 4, Communications line: 5.

* At *t = 0*, the user program starts.

* At *t = 10*, the printer interrupts. The user program's state is saved; the printer ISR (Interrupt Service Routine) begins.

* At *t = 15*, the communications line interrupts (priority 5 > 2). The printer ISR is paused and its state saved; the comm ISR begins.

* At *t = 20*, the disk interrupts (priority 4 < 5). It must wait — the comm ISR continues.

* At *t = 25*, the comm ISR finishes. The processor restores the printer ISR's state — but before it executes even one instruction, it notices the pending disk interrupt (priority 4 > 2) and services it.

* At *t = 35*, the disk ISR finishes. The printer ISR finally resumes.

* At *t = 40*, the printer ISR finishes. Control returns to the user program.
  This priority scheme ensures that urgent devices get serviced quickly, even at the cost of delaying less critical ones.

## 4. I/O Function and DMA

The processor can exchange data with I/O modules directly — reading from or writing to them using special I/O instructions (or memory-mapped I/O, where certain memory addresses correspond to device registers).

But there's a better way for large data transfers: **Direct Memory Access (DMA)**. With DMA, the processor grants an I/O module the authority to read from or write to main memory *on its own*. The I/O module handles the entire transfer, and the processor is free to do other work. The CPU only gets involved at the start (to set up the transfer) and at the end (when the I/O module signals completion via an interrupt).

## 5. Interconnection Structures

So the processor, memory, and I/O modules need to communicate. How? Through an **interconnection structure**. There are two main approaches.

### Bus Interconnection

A **bus** is a shared communication pathway made up of multiple lines (wires). All modules connect to the same bus and share it. A bus has three types of lines:

**Data Bus:**
Carries the actual data being transferred. The *width* of the data bus — how many parallel lines it has (e.g., 32, 64, 128 bits) — directly affects how many bits can move at once and is a key factor in overall system performance.

**Address Bus:**
Specifies *where* data should go or come from. The width of the address bus determines the maximum memory the system can address. Higher-order bits select which module (memory chip, I/O port), and lower-order bits select a location within that module.

**Control Bus:**
Carries command and timing signals — things like "this is a read operation," "this is a write," and "the data on the bus is valid now." Because the data and address lines are shared by all components, the control bus coordinates who gets to use them and when.

Buses are simple and low-cost, but they become bottlenecks when many high-speed components compete for the same shared pathway.

### Point-to-Point Interconnect

Modern systems have largely moved away from shared buses toward **point-to-point interconnects**, where each pair of components has its own dedicated connection. This eliminates the arbitration overhead of shared buses and provides much higher bandwidth.

## 6. Intel QuickPath Interconnect (QPI)

Introduced by Intel in 2008, **QPI** is a point-to-point interconnect that replaced the older shared front-side bus. Its key features:

* **Multiple direct connections** — Components are linked in pairs, removing the need for bus arbitration.

* **Layered protocol architecture** — Rather than simple control signals, QPI uses a structured protocol stack (like a network protocol), which makes it more flexible and robust.

* **Packetized data transfer** — Data travels in *packets*, each containing control headers and error control codes.

### QPI Layers

| Layer        | Role                                                                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Physical** | The actual wires and electrical signaling.                                                                                                                                                                                                                         |
| **Link**     | Handles **flow control** (preventing a fast sender from overwhelming a slow receiver) and **error control** (detecting and recovering from bit errors using CRC codes). Operates on units called *flits* (flow control units): 72 bits of payload + 8 bits of CRC. |
| **Routing**  | Determines the path a packet takes through the interconnect network. Routes are defined by firmware.                                                                                                                                                               |
| **Protocol** | Defines the packet as the unit of transfer. A critical function here is the **cache coherency protocol**, which ensures that when multiple caches hold copies of the same memory location, they all stay consistent.                                               |

## 7. PCI Express (PCIe)

**PCI (Peripheral Component Interconnect)** was once the dominant I/O bus — a high-bandwidth, processor-independent shared bus. But as device speeds increased, the shared bus became a bottleneck.

**PCI Express (PCIe)** replaced it with a point-to-point interconnect scheme. Key motivations:

* **High capacity** for modern I/O devices like Gigabit Ethernet.

* **Support for time-dependent data streams** (audio, video) that need guaranteed bandwidth.

### PCIe Transaction Layer (TL)

The Transaction Layer sits at the top of the PCIe protocol stack. It receives read and write requests from software and creates **request packets** that travel down through the layers to the destination device.

Most transactions use a **split transaction** technique: the source sends a request packet, then waits for a **completion packet** in response. Some writes and messages are *posted* (fire-and-forget — no response expected).

The TL supports four address spaces:

* **Memory** — Maps to system main memory and memory-mapped I/O devices.

* **I/O** — For legacy PCI devices with reserved address ranges.

* **Configuration** — Lets the system read/write configuration registers of PCIe devices.

* **Message** — For control signals: interrupts, error handling, power management.
  The TL supports both 32-bit and extended 64-bit memory addressing.

## Summary

Here's the big picture of what we covered:

The computer's fundamental operation is a loop — **fetch** an instruction, **execute** it, check for **interrupts**, repeat. Interrupts make this cycle dramatically more efficient by letting the CPU do useful work while slow I/O devices operate in the background. When multiple interrupts compete, a priority system ensures the most urgent ones get serviced first.

All of this requires a way for the processor, memory, and I/O to communicate. Older systems used **shared buses** (simple but limited in bandwidth). Modern systems use **point-to-point interconnects** like Intel's QPI and PCIe, which offer dedicated high-speed links, layered protocols, and packetized data transfer.

Understanding this top-level view — the instruction cycle, interrupts, and interconnection — gives you the foundation for everything else in computer architecture. Each of these topics goes much deeper, but now you have the mental map to navigate them.

