---
title: "The Memory Hierarchy: Understanding Cache Memory"
date: 2026-04-19T11:34
edited_at: 2026-04-19T10:29:00.137Z
author: chinono
path: /blog/The-Memory-Hierarchy-Understanding-Cache-Memory
---

## Why Should You Care About Memory?

Imagine you're studying at the library. You have your desk, a small shelf next to you, and the massive library stacks behind you. When you're working on an essay, do you walk to the stacks every time you need to check a single sentence? Of course not — you keep the books you're actively using right on your desk.

Computers face the exact same problem. The processor (CPU) needs data to work with, and where that data lives — and how quickly it can be fetched — has a *huge* impact on performance. This is the core idea behind the **memory hierarchy** and, more specifically, **cache memory**.

## The Principle of Locality

Before we dive into cache, we need to understand *why* cache works so well. The answer lies in something called the **principle of locality** (also known as **locality of reference**).

When a program runs, it doesn't access memory randomly. Instead, memory accesses tend to **cluster** around certain locations. This clustering comes in two flavours:

**Temporal locality** — if a program accessed a piece of data recently, it's very likely to access it again soon. Think about a loop counter: the variable `i` gets read and written on every iteration, over and over. Constants, temporary variables, and working stacks all exhibit this pattern.

**Spatial locality** — if a program accessed a memory address, it's likely to access *nearby* addresses soon. When you iterate through an array, you move from element 0 to element 1 to element 2 — each one sitting right next to the previous in memory.

These two tendencies are what make caching effective. If we can predict what data will be needed next (because it was used recently or lives nearby), we can keep it in a small, fast storage area and avoid the expensive trip to main memory.

## The Memory Hierarchy

Designing a computer's memory system boils down to three competing questions: **how much?** **how fast?** and **how expensive?**

Unfortunately, you can't have it all:

* Faster memory costs more per bit.

* Larger memory is cheaper per bit, but slower.

* You always want more capacity *and* more speed, but your budget disagrees.

The solution is a **hierarchy** — multiple levels of memory, each with different speed, size, and cost characteristics:

| Level                 | Technology                | Typical Size        | Managed By         |
| --------------------- | ------------------------- | ------------------- | ------------------ |
| **Registers**         | CMOS (on-chip flip-flops) | A few hundred bytes | Compiler           |
| **Cache (L1/L2/L3)**  | SRAM / eDRAM              | KB to tens of MB    | Processor hardware |
| **Main Memory**       | DRAM                      | GB                  | Operating System   |
| **Secondary Storage** | SSD / HDD                 | TB                  | OS / User          |
| **Offline/Archival**  | Tape / Cloud              | Virtually unlimited | OS / User          |

As you move *up* the pyramid (toward registers), memory gets smaller, faster, and more expensive. As you move *down* (toward archival storage), memory gets larger, slower, and cheaper. The trick is that the principle of locality ensures you spend most of your time accessing the *top* levels.

## What Is Cache Memory?

Cache is a small, fast memory that sits between the CPU and main memory. Its job is simple: keep copies of the data the processor is most likely to need next, so the processor doesn't have to wait for the (relatively) slow main memory.

When the processor needs a piece of data, it checks the cache first:

* **Cache hit** — the data is in the cache. Great! The processor gets it almost instantly.

* **Cache miss** — the data isn't in the cache. The system has to fetch it from main memory (or a lower cache level), which takes much longer.

The **hit rate** (percentage of accesses that are hits) is the single most important measure of cache performance. A well-designed cache can achieve hit rates above 90%, meaning the processor rarely has to wait.

### Key Terminology

Before we go further, let's nail down a few terms:

* **Block** — the minimum chunk of data transferred between cache and main memory. You don't fetch a single byte; you fetch an entire block at a time (taking advantage of spatial locality).

* **Line** — a slot in the cache that can hold one block. Think of it as a shelf space.

* **Tag** — a label attached to each cache line that identifies *which* block from main memory is currently stored there.

* **Line size** — the number of data bytes in a block/line (commonly 32 or 64 bytes).

## Elements of Cache Design

Designing a cache involves several interrelated decisions. Let's walk through each one.

### 1. Cache Size

How big should the cache be? There's a sweet spot:

* **Too small** → not enough room, too many misses.

* **Too large** → more expensive, physically bigger, and paradoxically *slightly slower* because addressing a larger cache requires more gate logic.
  In practice, L1 caches are typically 32–64 KB, L2 caches are 256 KB–1 MB, and L3 caches can be several megabytes to tens of megabytes. The exact optimal size depends heavily on the workload, so there's no single "best" answer.

### 2. Mapping Function

When a block is fetched from main memory, *where* does it go in the cache? This is determined by the **mapping function**, and there are three main approaches.

#### Direct Mapping

Each block of main memory maps to **exactly one** specific cache line.

The mapping is simple — typically `cache line = block number mod number of lines`. The memory address is split into three fields:

| Tag    | Line (index) | Word (offset) |
| ------ | ------------ | ------------- |
| <br /> | <br />       | <br />        |

**How it works:** The *line* field tells the cache which slot to check. The *tag* field is compared against the tag stored in that slot. If they match, it's a hit. If not, it's a miss, and the existing block in that line gets evicted.

**Pros:** Simple, fast hardware. No searching required — go straight to the indexed line.
**Cons:** If two frequently-used blocks happen to map to the same line, they'll keep evicting each other. This is called **thrashing**, and it can destroy performance even when the cache has plenty of empty lines elsewhere.

#### Associative (Fully Associative) Mapping

Any block can go in **any** cache line.

The address is split into just two fields:

| Tag (22 bits) | Word (2 bits) |
| ------------- | ------------- |
| <br />        | <br />        |

**How it works:** When looking for a block, the cache must compare the tag against *every* line simultaneously. This requires special hardware called a **content-addressable memory (CAM)**.

**Pros:** Maximum flexibility — no thrashing from mapping conflicts.
**Cons:** Expensive and slow for large caches because every tag must be checked in parallel.

#### Set Associative Mapping

The compromise. The cache is divided into **sets**, each containing *k* lines (this is called *k-way* set associative). A block maps to a specific **set** (like direct mapping), but within that set it can go in **any** of the *k* lines (like associative mapping).

| Tag    | Set (index) | Word (offset) |
| ------ | ----------- | ------------- |
| <br /> | <br />      | <br />        |

For example, in a 2-way set associative cache, each set has 2 lines. A block hashes to one set, and the cache checks both lines in that set.

**Pros:** Much less thrashing than direct mapping, while requiring far less comparison hardware than full associativity.
**Cons:** Slightly more complex than direct mapping.

Most modern processors use set associative caches (commonly 4-way, 8-way, or even 16-way).

### 3. Replacement Algorithms

When a cache set (or the entire cache, for fully associative) is full and a new block needs to come in, which existing block gets evicted? For direct mapping there's no choice — there's only one candidate. But for associative and set-associative caches, we need a **replacement algorithm**:

* **Least Recently Used (LRU)** — evict the block that hasn't been accessed for the longest time. This aligns perfectly with temporal locality and is the most effective strategy. It's also the most popular because it's relatively simple to implement in hardware.

* **First-In-First-Out (FIFO)** — evict the block that has been in the cache the longest, regardless of how recently it was accessed. Easy to implement with a circular buffer.

* **Least Frequently Used (LFU)** — evict the block that has been accessed the fewest times. Requires a counter per line.

* **Random** — evict a random block. Surprisingly, random replacement performs only slightly worse than LRU in many workloads and is dead simple to implement.

### 4. Write Policy

When the processor *writes* data, what happens to the cache and main memory?

**Write Through** — every write updates *both* the cache and main memory immediately. This keeps memory always consistent and is simple to understand. The downside is that it generates a lot of memory traffic, which can become a bottleneck.

**Write Back** — writes update only the cache. The modified block is written back to main memory later, only when it gets evicted. This drastically reduces memory traffic but means main memory can be temporarily out of date. A **dirty bit** on each line tracks whether it's been modified.

#### What About Write Misses?

If the processor writes to an address that isn't in the cache, there are two options:

* **Write allocate** — fetch the block into the cache first, then perform the write there. This is typically paired with write-back.

* **No write allocate** — write directly to main memory without loading the block into the cache. This is typically paired with write-through.

### 5. Line Size

Bigger blocks take better advantage of spatial locality (you prefetch more neighbouring data), but there's a trade-off:

* Larger blocks mean fewer lines in a fixed-size cache, increasing the chance of evictions.

* Each miss takes longer to service because more data must be transferred.
  Typical line sizes are 32 or 64 bytes.

### 6. Number of Caches

Modern systems don't have just one cache — they use a **multilevel** hierarchy:

* **L1 cache** — on the same chip as the processor, tiny but extremely fast. Often **split** into separate instruction and data caches (called an I-cache and D-cache) to avoid contention between the fetch and execution units.

* **L2 cache** — larger and slightly slower. Usually **unified** (holds both instructions and data).

* **L3 cache** — even larger, often shared across multiple processor cores.
  Splitting L1 into instruction and data caches is important for **pipelining**, where the processor simultaneously fetches a new instruction while executing a previous one. If both operations need the same cache, they'd conflict. Splitting eliminates this contention.

## Cache Coherency

Things get interesting — and complicated — when multiple processors (or cores) each have their own cache but share the same main memory. If Core A writes a new value to address X in its cache, Core B's cache might still hold the *old* value of X. This is the **cache coherency** problem.

Several approaches exist:

* **Bus watching (snooping) with write-through** — each cache controller monitors the memory bus. If it sees another core writing to an address that exists in its own cache, it invalidates that entry. Simple but depends on all caches using write-through.

* **Hardware transparency (snooping protocols)** — dedicated hardware ensures that any cache update is propagated to all other caches. More complex, but works with write-back policies too.

* **Noncacheable memory** — shared memory regions are simply marked as noncacheable. Every access goes directly to main memory. Simple but sacrifices performance for shared data.
  In modern multi-core processors, sophisticated protocols like **MESI** (Modified, Exclusive, Shared, Invalid) handle coherency, but the fundamental ideas are the same.

## Inclusion Policy

When you have multiple cache levels, should a block in L1 also be kept in L2? There are three schools of thought:

**Inclusive** — if data is in L1, it's guaranteed to also be in L2 (and L3). This simplifies coherency checks in multi-core systems because you only need to search the last-level cache to know whether any core might have a copy.

**Exclusive** — if data is in L1, it is *not* in L2. No wasted space from duplicate copies, so you effectively get more total cache capacity. The trade-off is that coherency checks become harder since you may need to search multiple levels.

**Non-inclusive** — data in L1 may or may not be in L2. A flexible middle ground, but with similar coherency challenges as the exclusive policy.

## Wrapping Up

Cache memory is one of those topics that sounds simple on the surface — "just keep frequently used data nearby" — but the design decisions run deep. From choosing a mapping function to picking a write policy and managing coherency across cores, every choice involves trade-offs between speed, complexity, cost, and correctness.

The key takeaways:

The **principle of locality** is *why* caches work. Temporal and spatial locality mean that a small, fast memory can satisfy the vast majority of a processor's requests. The **memory hierarchy** gives us the best of all worlds: the speed of small memories and the capacity of large ones. **Cache design** is a web of interconnected decisions — mapping, replacement, write policy, line size, levels, and inclusion — where no single choice is optimal in isolation; each must be tuned in context.

If you remember nothing else, remember this: the goal of the entire memory system is to create the **illusion** that the processor has access to a very large, very fast memory — even though no such memory physically exists.
