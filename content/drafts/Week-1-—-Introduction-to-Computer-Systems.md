---
title: Week 1 — Introduction to Computer Systems
date: 2026-04-18T07:43
author: chinono
---

## Why this series exists

Computer Systems Architecture (CSA) is one of those subjects that sounds intimidating but is actually about a very simple question:

> **What is** ***inside*** **a computer, and how do those parts work together to run the software we write?**

Every time you open a browser, play a game, or send a message, billions of tiny switches are doing an enormous amount of coordinated work under the hood. CSA is the map of that hidden world. If you are a programmer, understanding the machine below your code will make you write better, faster, and more memory-friendly programs. If you are just curious, it is genuinely one of the most elegant engineering stories of the 20th century.

In this first post we will cover the **big picture**: the vocabulary, the mental model, and a short history that explains *how we got here*. Later posts will zoom in on the pieces one by one.

## 1. Computer Architecture vs. Computer Organization

The very first distinction in CSA is between two words that sound like synonyms but mean different things.

### Computer Architecture

Architecture refers to the parts of the system that are **visible to the programmer** — the things that affect how a program behaves logically. Examples include:

* The **instruction set** (what commands the CPU understands, like `ADD`, `LOAD`, `JUMP`)

* The **number of bits** used for data (8-bit, 32-bit, 64-bit)

* The **I/O mechanism** (how the CPU talks to devices)

* The **addressing technique** (how memory locations are named) If you change the architecture, programs written for the old one may no longer work. It is the *contract* between hardware and software.

### Computer Organization

Organization refers to the **operational units and how they are interconnected** — the actual hardware implementation that realises the architecture. Examples:

* **Control signals** between components

* **Interfaces** between the computer and peripherals

* **Memory technology** (DRAM, SRAM, cache levels, etc.)

### An analogy

Think of a car.

* The **architecture** is the driver's interface: steering wheel, pedals, gear stick, dashboard. Every Toyota Camry driver knows how to drive any other Camry because the architecture is the same.

* The **organization** is what is under the hood: the specific engine size, turbocharger, transmission design. Two Camrys can have the *same architecture* but *different organizations* — one is the base model, the other is the sport version. They drive the same, but one is faster and more expensive.
  This leads to a key observation from the slides:

> *Same architecture but different organization → different price and performance. Architecture tends to last a long time with only minor changes, while organization changes as technology improves. By changing the organization, the user can decide the performance they want.*

This is literally how Intel and AMD sell you ten different CPUs that all run Windows — same architecture (x86-64), different organizations.

## 2. Structure and Function: the mental model

A computer is a **complex system**. To understand complex systems, engineers use a universal trick: they break them into **hierarchical levels**, from highest to lowest, and study each level separately. The levels then combine through the interrelationships between them.

At each level, we ask two questions:

* **Structure** — How are the components inter-related? (the wiring, the shape)

* **Function** — What does each component *do* as part of the whole? (the behaviour)
  There is a classic question that comes up here: when analysing or designing a computer, do you go **top-down** (start from the whole system and decompose) or **bottom-up** (start from transistors and build up)? Both approaches have value, but in this course we will mostly go top-down: start from what a computer does, then zoom in to how it does it.

## 3. The Four Functions of a Computer

No matter how fancy a computer gets — your phone, a laptop, a supercomputer — it only ever performs **four basic functions**:

1. **Data Processing** — crunching numbers, transforming data.
2. **Data Storage** — keeping data, either briefly (RAM) or for a long time (SSD, hard drive).
3. **Data Movement** — shuffling data between the computer and the outside world.
4. **Control** — orchestrating the other three, deciding what happens when.
   Let's look at each one.

### Data Processing

The computer takes data in, transforms it somehow, and produces new data out. Adding two numbers, resizing an image, decoding a video — all data processing.

### Data Storage

Data has to live *somewhere*. Storage is split into two flavours:

* **Short-term storage** — fast but volatile (it disappears when the power goes off). This is RAM.

* **Long-term storage** — slower but persistent. This is your SSD, hard drive, or USB stick.

### Data Movement

There are two sub-categories worth knowing:

* **Data communications** — moving data over long distances or between remote devices (think: Wi-Fi, Ethernet, the internet).

* **Input/Output (I/O)** — moving data to and from peripherals directly connected to the computer (keyboard, mouse, screen, printer).

### Control

A user-defined **control algorithm** decides when each of the other three functions happens, in what order, and in response to what. Without control, the other parts are just a pile of capabilities with no coordinator.

### The four functions, visualised

The slides use a neat diagram with four circles — *Movement*, *Control*, *Storage*, *Processing* — connected in a way that shows how control sits in the middle, orchestrating everything. Different patterns of the arrows highlight different *modes* of operation:

| Mode                                                | What is happening                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Data storage device**                             | Data moves between the external environment and storage (read/write).                                 |
| **Data movement device**                            | Data is transferred from one peripheral or communication line to another (no storage, no processing). |
| **Data processing, storage-only**                   | Data already in storage is processed and written back — nothing leaves the machine.                   |
| **Data processing, involving external environment** | Data comes in from outside, is processed, and results go back out. This is the full pipeline.         |

Two important notes from the slides:

1. **All four operations involve the control function.** Control is always in the loop.
2. **The functions can run simultaneously with multi-core processors.** In older single-core machines, things happened one at a time; today, your laptop is doing storage, movement, and processing all at once.

## 4. Structure: how the pieces fit together

Now that we know *what* a computer does, let's look at *how* it is built. We will zoom in level by level.

### Level 1: The computer and the world outside it

At the highest level, the computer is a single blob that interacts with the **external environment** through:

* **Peripherals** (keyboard, mouse, monitor, printer, etc.)

* **Communication lines** (network cables, Wi-Fi, Bluetooth)
  Inside that blob, the essential jobs are **Storage** and **Processing**. Everything else at this level is just "the outside world".

### Level 2: The internal structure of a computer

If we crack open the computer blob, we find four major internal components:

| Component                         | What it does                                                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Central Processing Unit (CPU)** | Controls the operation of the computer and performs data processing. *The brain.*                                                             |
| **Main memory**                   | Stores data. *The short-term workspace.*                                                                                                      |
| **I/O**                           | Moves data between the computer and its external environment. *The hands, eyes, and mouth.*                                                   |
| **System Interconnection**        | Mechanism that provides communication among CPU, main memory, and I/O. This is what we usually call the **System Bus**. *The nervous system.* |

Everything else you have heard of — hard drive, GPU, network card — is either part of these or hangs off them via I/O.

### Level 3: Inside the CPU

Crack the CPU open and we find another four components:

| Component                           | What it does                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Control Unit (CU)**               | Controls the operation of the CPU (and, by extension, the whole computer).                       |
| **Arithmetic and Logic Unit (ALU)** | Performs the computer's data processing functions — the actual adding, comparing, ANDing, ORing. |
| **Registers**                       | Provide tiny, super-fast storage *inside* the CPU.                                               |
| **CPU Interconnection**             | Provides communication between the control unit, ALU, and registers.                             |

Notice how the structure is **recursive**: at each level, we see "something that processes, something that stores, something that controls, something that connects them." This is not a coincidence — it is a reflection of the four functions from Section 3, applied at every scale.

This recursive pattern is one of the most beautiful ideas in computer architecture. We will see it again and again.

## 5. A Brief History of Computers

Now the fun part. Let us walk through the four generations of computer hardware and see how each jump unlocked what came next.

### Generation 1: Vacuum Tubes (1940s–1950s)

#### ENIAC — the first general-purpose electronic computer

ENIAC (Electronic Numerical Integrator and Computer) was the first general-purpose computer built with vacuum tubes. Some eye-watering stats:

* Weighed **30 tons**

* Occupied **1,500 square feet** of floor space

* Used **18,000 vacuum tubes**

* Consumed **140 kW** of power (enough to power \~100 modern homes)

* Was a **decimal machine**: 10 vacuum tubes were used to represent a single decimal digit

* Was programmed by **manually flipping switches**
  Imagine programming a machine the size of a tennis court by walking around flipping thousands of switches. That was software engineering in 1946.

#### EDVAC and the Von Neumann breakthrough

EDVAC (Electronic Discrete Variable Computer) was proposed by John Von Neumann and introduced the idea that still defines virtually every computer today: the **stored-program concept**.

Instead of rewiring the machine for every new program, you store the program in memory alongside the data, just as numbers. The computer then reads its own instructions one by one.

EDVAC also:

* Had the **basic internal structure of a modern CPU** — control unit, memory, ALU, I/O (sound familiar? Section 4!)

* Was a **binary system** — 1s and 0s instead of decimal digits

* Had **1,000 storage locations**, each **40 bits** wide, for both data and instructions

#### The IAS computer and its registers

The IAS machine (built at the Institute for Advanced Study, a relative of EDVAC) is often used as the textbook example of early stored-program architecture. It introduced several specialised **registers** that still exist, in one form or another, in modern CPUs:

| Register                                          | Role                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| **Memory Buffer Register (MBR)**                  | Holds a word being stored to memory or sent to I/O, and vice versa.        |
| **Memory Address Register (MAR)**                 | Specifies the memory address that will be written to or read into the MBR. |
| **Instruction Register (IR)**                     | Holds the 8-bit opcode of the current instruction.                         |
| **Instruction Buffer Register (IBR)**             | Temporarily holds an instruction.                                          |
| **Program Counter (PC)**                          | Holds the address of the next instruction pair to be fetched from memory.  |
| **Accumulator (AC) and Multiplier Quotient (MQ)** | Temporarily hold operands and results of ALU operations.                   |

You do not need to memorise these today, but notice the pattern: *every register has one specific job*. CPU design is all about having the right little box in the right place.

### Generation 2: Transistors (late 1950s–1960s)

In 1947, Bell Labs invented the transistor. It was a revolution:

* **Smaller, cheaper, and dissipated less heat** than a vacuum tube

* **Solid-state** device made from silicon — no fragile glass, no vacuum
  To appreciate the jump, picture the difference:

* A **vacuum tube** requires wires, metal plates, a glass capsule, and a vacuum inside. Picture a light bulb with extra plumbing.

* A **transistor** is a tiny chunk of silicon with three leads. That's it.
  The flagship second-generation machine was the **IBM 7094**. Over the course of the IBM 700/7000 series (see the table below), you can watch hardware improve dramatically in just 12 years:

| Model   | Year | CPU Tech       | Memory Tech         | Cycle Time (µs) | Memory (K) | Opcodes | Index Registers | Floating Point         | Speed (relative to 701) |
| ------- | ---- | -------------- | ------------------- | --------------- | ---------- | ------- | --------------- | ---------------------- | ----------------------- |
| 701     | 1952 | Vacuum tubes   | Electrostatic tubes | 30              | 2–4        | 24      | 0               | no                     | 1×                      |
| 704     | 1955 | Vacuum tubes   | Core                | 12              | 4–32       | 80      | 3               | yes                    | 2.5×                    |
| 709     | 1958 | Vacuum tubes   | Core                | 12              | 32         | 140     | 3               | yes                    | 4×                      |
| 7090    | 1960 | **Transistor** | Core                | 2.18            | 32         | 169     | 3               | yes                    | 25×                     |
| 7094 I  | 1962 | Transistor     | Core                | 2               | 32         | 185     | 7               | yes (double precision) | 30×                     |
| 7094 II | 1964 | Transistor     | Core                | 1.4             | 32         | 185     | 7               | yes (double precision) | 50×                     |

From 1× to 50× speed in twelve years, purely from hardware progress. And notice the cycle time dropping from 30 µs to 1.4 µs — that is the clock speed getting faster.

#### Data channels: giving the CPU a break

A major architectural shift with the IBM 7094 was the introduction of **data channels**. Here is the idea:

In the old IAS design, the CPU personally supervised every byte moving to or from an I/O device. That is like a CEO answering every email in the company — a terrible use of expensive brainpower.

A **data channel** is a small, specialised processor with its own instruction set, dedicated to I/O. The CPU just signals the data channel ("please read this file"), and the channel does the work on its own and reports back when done. **The burden of the CPU is reduced**, and the CPU can get on with real computing.

Alongside this was the **multiplexor**, which manages how data flows to and from the CPU or memory when there are multiple channels competing for attention.

This pattern — offloading specialised work to specialised hardware so the CPU can focus — is everywhere in modern systems. GPUs, DMA controllers, network cards… they are all descendants of that 1962 data channel.

### Generation 3: Integrated Circuits (1958 onwards)

In 1958, Jack Kilby and Robert Noyce independently invented the **integrated circuit (IC)** — multiple transistors, resistors, and capacitors fabricated together on a single silicon wafer. This started the era of **microelectronics**.

#### The two building blocks

At the heart of every integrated circuit are just two primitive elements:

* **Gates** — perform Boolean logic (AND, OR, NOT). They take inputs and produce an output when the activate signal tells them to. Gates are used for **data processing**.

* **Memory cells** — binary storage cells with a Read/Write signal. They are used for **data storage**.
  And that is it. With enough gates and enough memory cells, wired up in the right pattern, you can build anything — including the computer you are reading this on.

The paths among components handle **data movement**, and **control signals** control when gates and memory cells fire. Look at that: the **four functions again**, now implemented as physical hardware elements on silicon.

#### How ICs are made

The integrated circuit (transistors, resistors, and capacitors) is fabricated on a **silicon wafer**. A single wafer can hold many chips with the same configuration of gates, memory cells, and I/O connections, which are cut out and packaged individually. This is why chips keep getting cheaper: you make them by the wafer, not one at a time.

#### IBM System/360 — the first computer *family*

When IBM built the System/360 in 1964, they did something strategically brilliant. It used integrated circuit technology and, unfortunately, was *not compatible* with the previous IBM machines — so existing customers had to rewrite their software. But in exchange, IBM offered something new: the industry's **first planned family of computers**.

A "family" meant several models with shared characteristics, so customers could upgrade without relearning everything:

1. **Similar or identical instruction set** — code written for a small model still runs on a bigger one.
2. **Similar or identical operating system** — sysadmins do not need retraining.
3. **Increasing speed** — bigger model = faster clock.
4. **Increasing number of I/O ports** — bigger model = more devices can connect.
5. **Increasing memory size** — bigger model = more data can fit.
6. **Increasing cost** — you pay for what you get.
   This is literally how every laptop lineup works today. MacBook Air → Pro → Pro Max. Same macOS, same apps, just more horsepower. IBM invented that pricing model.

### Generation 4: LSI, VLSI, ULSI (1970s and beyond)

As manufacturing improved, engineers kept cramming more components onto a single chip. The industry labelled successive milestones:

* **LSI** (Large Scale Integration)

* **VLSI** (Very Large Scale Integration)

* **ULSI** (Ultra Large Scale Integration)
  The **number of components per chip increased yearly** — the phenomenon famously captured by Moore's Law. Two major leaps happened in this era.

#### Semiconductor memory replaces core memory

In the 1950s and 1960s, memory was built from **rings of ferromagnetic material** called **cores**. Core memory was fast for its time, but had serious downsides:

* **Bulky** — imagine tiny magnetic donuts threaded on wires, by hand

* **Expensive**

* **Destructive readout** — reading a bit erased it, so the value had to be re-written immediately afterwards
  In **1970, Fairchild introduced semiconductor memory**. It was **non-destructive** (reading did not erase the bit) and **faster than core**. This is the ancestor of every DRAM and SRAM chip in use today.

To appreciate the insane scale of this transition, the slides end with one of my favourite images in the whole course:

> **8 Bytes of core memory vs. 8 Gigabytes on a microSD card.**
>
> The core memory looks like a woven sculpture the size of a brick. The microSD card is smaller than a fingernail. And the microSD holds **one billion times more data**.

#### The microprocessor: a whole CPU on one chip

In **1971, Intel released the 4004** — the first chip to contain *all* the components of a CPU on a **single chip**. This was the birth of the **microprocessor**.

Before 1971, a CPU was a large circuit board (or several boards) full of separate chips. After 1971, "the CPU" became one tiny square you could hold in tweezers. This is the innovation that made personal computers, mobile phones, and embedded systems possible.

From there, microprocessor improvements have followed a few steady trends:

* **Increase in the number of bits in the register** (4-bit → 8-bit → 16-bit → 32-bit → 64-bit)

* **Decrease in clock switching time** (faster clock = more instructions per second)

* **Other hardware improvements** (pipelining, caches, branch prediction, multiple cores…)
  The chip in your phone right now is a direct descendant of the Intel 4004 — only about **a billion times more capable**.

## Recap

Let's pull all of this together.

We started with the question: **what is inside a computer?** We answered it in three layers of zoom:

1. **Architecture vs. Organization** — the contract with the programmer vs. the hardware implementation.
2. **Structure and Function** — at every level of the computer, there are things that *process*, *store*, *move data*, and *control*. Structure is how they are connected; function is what they do.
3. **History** — vacuum tubes gave us programmable electronic computers, transistors made them practical, integrated circuits made them affordable, and LSI/VLSI put a whole computer in your pocket.
   The same four functions (processing, storage, movement, control) reappear at every level of abstraction — from a warehouse-sized ENIAC, down to the inside of a modern CPU, down to individual gates and memory cells on silicon. Once you see this pattern, the rest of CSA is a lot less intimidating.

## Where we go next

In the next post we will zoom in on **the CPU** — how the control unit and ALU cooperate to fetch, decode, and execute a single instruction. That is where the magic of stored-program computing actually happens.

Until then, a little homework to cement the ideas:

* Look at your own laptop or phone. Can you name its architecture (e.g. ARM, x86-64)?

* For each of the four functions, point at something on your desk that performs it.

* Ask yourself: in an ENIAC with 18,000 vacuum tubes, how would you debug a failure?
  See you in Week 2.

***

*Notes based on Week 1 lecture material for Computer Systems Architecture. Concepts and terminology follow the standard Stallings-style framework. Any errors or oversimplifications are mine.*
