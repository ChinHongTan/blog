---
title: Layers 1 & 2: Physical Media, Ethernet, and Switching
date: 2026-04-13T10:29
edited_at: 2026-04-19T03:12:45.938Z
author: chinono
path: /blog/Network-Communication,-Chapter-3
---

## The Physical Layer — Where Bits Meet the Real World

Everything on a network ultimately boils down to **bits** — 1s and 0s. But bits are abstract; they need to be physically represented somehow in order to travel from one machine to another. That's the job of the **physical layer** (Layer 1 in the OSI model).

The physical layer takes a complete frame from the data link layer above it and converts it into **signals** that can be sent over the actual transmission medium. What those signals look like depends entirely on the medium:

* **Copper cable** → patterns of electrical pulses

* **Fiber-optic cable** → patterns of light

* **Wireless** → patterns of microwave/radio transmissions

### Three Functional Areas

The physical layer standards cover three key areas:

**1. Physical Components** — This is all the tangible hardware: NICs (network interface cards), connectors, cables, and their specifications. Think of the RJ-45 jack you plug an Ethernet cable into — that's a physical layer component.

**2. Encoding** — Before bits are sent as signals, they're first *encoded*. Encoding converts raw data bits into a predefined code — a pattern that both the sender and receiver agree on. This helps with things like identifying where a frame begins and ends. Two common encoding schemes are:

* **Manchester Encoding**: A `0` is represented by a high-to-low voltage transition, and a `1` by a low-to-high transition. The beauty of this scheme is that there's always a transition in the middle of each bit period, which helps the receiver stay synchronized.

* **Non-Return to Zero (NRZ)**: Simpler — one voltage level means `0`, another means `1`. No guaranteed transition in every bit period, which can cause synchronization issues over long runs.

**3. Signaling** — This defines how the encoded bits are physically represented. For example, a long pulse might represent a `1` and a short pulse a `0`. The standard must be agreed upon so both ends interpret the signals the same way.

### Bandwidth, Throughput, and Goodput

These three terms are related but distinct, and confusing them is a classic beginner mistake:

* **Bandwidth** is the *theoretical maximum* capacity of a medium — how much data it *could* carry. Measured in kbps, Mbps, or Gbps.

* **Throughput** is the *actual* rate of data transfer over a period of time. It's always affected by real-world factors: traffic volume, type of traffic, network congestion, and the number of devices the data passes through.

* **Goodput** is the *usable* data transferred — throughput minus all the overhead (session setup, acknowledgments, retransmissions, encapsulation headers). This is what you actually care about as an end user.

The relationship is always: **Goodput ≤ Throughput ≤ Bandwidth**.

And then there's **latency** — the total time (including delays) for data to travel from point A to point B. Low latency matters a lot for real-time applications like video calls or online gaming.

## Network Media — Copper, Fiber, and Wireless

Now that we know the physical layer's job, let's look at the actual media that carry our signals.

### Copper Cabling

Copper is the workhorse of networking — cheap, easy to install, and widely available. The trade-off is that it's limited in distance and susceptible to electromagnetic interference (EMI). There are three main types:

**Unshielded Twisted-Pair (UTP)** is by far the most common. It uses pairs of wires twisted together (the twisting helps cancel out interference) and terminates with the familiar RJ-45 connector. You've almost certainly used a UTP cable before.

**Shielded Twisted-Pair (STP)** adds metallic shielding around the wire pairs for better noise protection. The downside? It's more expensive and harder to install. It also uses RJ-45 connectors.

**Coaxial cable** has a single copper conductor at its center, surrounded by insulation and a braided shield. It's used to carry radio frequency (RF) energy for things like cable internet and connecting antennas to wireless devices.

### Cable Wiring Conventions

Not all Ethernet cables are wired the same way:

* **Straight-through cable**: The most common. Used to connect *different* types of devices — e.g., a host to a switch, or a switch to a router.

* **Crossover cable**: Used to connect *similar* devices — switch to switch, host to host, router to router. Less common today because most modern devices support **Auto-MDIX**, which automatically detects and adjusts for the cable type.

* **Rollover cable**: A Cisco proprietary cable used specifically for connecting to a router or switch's console port for management.

### Fiber-Optic Cabling

Fiber uses pulses of light instead of electrical signals, which gives it some major advantages: much longer distances, higher bandwidth, and immunity to electromagnetic interference. It's used across several domains:

* **Enterprise networks** for high-speed backbones

* **FTTH (Fiber-to-the-Home)** for residential broadband

* **Long-haul networks** spanning hundreds or thousands of kilometers

* **Submarine networks** for transoceanic links — specially engineered cables that survive harsh undersea conditions

There are two main types of fiber:

| <br />           | Single-Mode Fiber (SMF)        | Multimode Fiber (MMF)      |
| :--------------- | :----------------------------- | :------------------------- |
| **Core size**    | Very small                     | Larger                     |
| **Light source** | Laser (expensive)              | LED (cheaper)              |
| **Distance**     | Hundreds of km                 | Up to \~550 m              |
| **Use case**     | Long-haul, telephony, cable TV | LANs, short-distance links |
| **Bandwidth**    | Very high                      | Up to 10 Gbps              |

Common fiber connectors include:

* **ST (Straight-Tip)**: Older bayonet-style, commonly used with multimode fiber.

* **SC (Subscriber Connector)**: Push-pull mechanism, used with both single-mode and multimode.

* **LC (Lucent Connector)**: Smaller form factor, growing in popularity, supports both fiber types.

### Wireless Media

Wireless transmits data using radio or microwave frequencies. It offers mobility and convenience, but comes with its own set of challenges:

* **Coverage**: Building materials and terrain can limit signal range significantly.

* **Interference**: Everyday devices — cordless phones, microwaves, fluorescent lights — can disrupt wireless signals.

* **Security**: Because the signal travels through the air, wireless networks require careful security management to prevent unauthorized access.

## The Data Link Layer — Framing the Conversation

The **data link layer** (Layer 2) sits right above the physical layer. Its main jobs are:

1. Taking Layer 3 (network layer) packets and packaging them into **frames**
2. Controlling how devices access the physical media
3. Performing error detection

### Two Sublayers

The data link layer is divided into two sublayers:

**Logical Link Control (LLC)** — the upper sublayer. It provides services to the network layer protocols above, essentially acting as the interface between Layer 2 and Layer 3.

**Media Access Control (MAC)** — the lower sublayer. This is where the rubber meets the road: it handles addressing (MAC addresses), defines how data is delimited, and manages the actual access to the physical medium. The MAC sublayer's behavior varies depending on the type of network — and a single communication might cross multiple network types as it travels from source to destination.

### Anatomy of a Frame

A data link layer frame has three parts:

* **Header**: Control information like source and destination addresses. Located at the beginning.

* **Data (Payload)**: The encapsulated content — includes the IP header, transport layer header, and application data.

* **Trailer**: Error detection information (like a CRC checksum), appended at the end.

## Media Access Control — Who Gets to Talk?

When multiple devices share the same medium, there needs to be a system that determines who gets to transmit and when. The method used depends on two factors:

* **Topology**: How the connections between nodes appear to the data link layer.

* **Media sharing**: How nodes share the medium.

### Two Approaches

**Contention-based access** — All nodes compete for access to the medium. Think of it like a group conversation where anyone can start talking, but everyone has an agreed-upon plan for when two people accidentally speak at the same time. The downside is that it doesn't scale well — as more nodes are added, collisions become more frequent.

**Controlled access** — Each node is given a designated time slot to use the medium. More orderly, but adds overhead.

### CSMA Variants

Contention-based networks typically use **CSMA (Carrier Sense Multiple Access)** — devices "listen" to the medium before transmitting. There are two important variants:

**CSMA/CD (Collision Detection)** — Used in wired Ethernet. A device checks if the medium is free, then transmits. If it detects that another device transmitted at the same time (a collision), all transmitting devices stop, wait a random amount of time, and try again.

**CSMA/CA (Collision Avoidance)** — Used in wireless networks. Since wireless devices can't easily detect collisions while transmitting, they take a preventive approach: before sending data, a device first sends a notification of its *intent* to transmit. Only after receiving clearance does it actually send the data.

## Ethernet — The King of LANs

Ethernet is the most widely used LAN technology in the world. Defined by the IEEE 802.2 and 802.3 standards, it operates across both the data link layer and the physical layer.

Ethernet supports an impressive range of speeds: 10 Mbps, 100 Mbps, 1 Gbps, 10 Gbps, 40 Gbps, and 100 Gbps. The minimum frame size is **64 bytes** and the maximum is **1518 bytes**.

### MAC Addresses

Every device on an Ethernet network needs a unique identifier — this is the **MAC address**. It's a 48-bit value, typically written as 12 hexadecimal digits (e.g., `00:1A:2B:3C:4D:5E`).

MAC addresses are used for three types of communication:

* **Unicast**: One-to-one. A frame sent to a single specific device.

* **Broadcast**: One-to-all. A frame sent to every device on the local network (destination MAC: `FF:FF:FF:FF:FF:FF`).

* **Multicast**: One-to-many. A frame sent to a group of devices that have subscribed to receive it.

> On Windows, you can check your MAC address by running `ipconfig /all` in the command prompt.

### How a Switch Uses MAC Addresses

An Ethernet switch maintains a **MAC address table** that maps MAC addresses to its physical ports. When a frame arrives:

1. The switch reads the **source MAC address** and records which port it came from — this is how the table is *dynamically built*.
2. The switch then looks up the **destination MAC address** in its table to decide which port to forward the frame to.

If the destination MAC isn't in the table yet, the switch *floods* the frame out all ports (except the one it arrived on) — essentially asking, "Who has this address?"

## Switching — Making Smart Forwarding Decisions

Switches can use different methods to forward frames, each with its own trade-off between speed and reliability:

### Store-and-Forward Switching

The switch waits until it has received the **entire frame**, stores it in a buffer, and performs an error check using a **CRC (Cyclic Redundancy Check)**. Only if the frame passes the check is it forwarded. This is the most reliable method but adds a small delay.

### Cut-Through Switching

The switch starts forwarding the frame as soon as it reads the destination address — before the entire frame has arrived. This is faster, but it forwards corrupted frames too since there's no error check. There are two variants:

* **Fast-forward switching**: Forwards immediately after reading the destination address. Lowest latency, but no error checking at all.

* **Fragment-free switching**: Waits for the first **64 bytes** before forwarding. Why 64 bytes? Because most collision-related errors occur within the first 64 bytes of a frame, so this catches the majority of bad frames while still being faster than store-and-forward.

### Frame Buffering

Switches also use buffering to handle congestion. If the destination port is busy, the switch stores the frame temporarily until the port is available. This prevents frame loss during traffic spikes.

## ARP — Translating Addresses

Here's a fundamental problem in networking: the network layer uses **IP addresses** to identify devices, but the data link layer uses **MAC addresses**. When a device wants to send data to another device on the same local network, it knows the destination's IP address but needs the MAC address to build a frame. This is where **ARP (Address Resolution Protocol)** comes in.

### How ARP Works

1. The sender checks its **ARP table** (a local cache of IP-to-MAC mappings).
2. If a mapping exists → great, use it to build the frame.
3. If no mapping exists → the sender broadcasts an **ARP request** to the entire local network (destination MAC: `FF:FF:FF:FF:FF:FF`), essentially asking: *"Who has this IP address? Tell me your MAC address."*
4. The device with the matching IP address responds with an **ARP reply** containing its MAC address.
5. The sender stores this mapping in its ARP table for future use.

### What About Remote Networks?

If the destination IP address is on a **different network**, the device doesn't ARP for the destination directly. Instead, it looks up the MAC address of its **default gateway** (the router) in the ARP table. The frame is sent to the router, which then handles forwarding it to the correct network.

If no device responds to an ARP request, the packet is simply **dropped** — because without a MAC address, a frame simply cannot be constructed.

### ARP Table Management

ARP entries don't last forever. Each entry has a **cache timer** — on Windows, entries typically expire after **15 to 45 seconds** if unused. This keeps the table fresh and prevents stale mappings.

### ARP Security Concerns

ARP has two notable issues:

**1. Overhead**: Since ARP requests are broadcasts, every device on the local network must process them. If many devices start ARP-ing at the same time (e.g., during a network boot storm), it can cause a temporary performance dip.

**2. ARP Spoofing / Poisoning**: Because ARP has no built-in authentication, a malicious actor can send fake ARP replies, claiming that *their* MAC address maps to another device's IP (like the default gateway). Victims then unknowingly send traffic to the attacker instead — a classic **man-in-the-middle attack**. This is why techniques like Dynamic ARP Inspection (DAI) and static ARP entries exist as countermeasures.

## Wrapping Up

In this chapter, we traced the journey of data from the abstract world of bits down to the physical signals on a wire (or through the air), and back up through the framing and addressing mechanisms that make local network communication possible. Here's a quick mental model:

* **Physical Layer**: Converts bits into signals (electrical, light, or radio) and defines the hardware.

* **Data Link Layer**: Packages data into frames, handles MAC addressing, and manages media access.

* **Ethernet**: The dominant LAN technology, using MAC addresses and switches to deliver frames.

* **ARP**: The bridge between IP addresses (Layer 3) and MAC addresses (Layer 2).

Understanding these layers is essential because every higher-level protocol — HTTP, DNS, SSH, you name it — ultimately relies on these mechanisms to move data across the wire. Getting comfortable with these fundamentals will make everything else in networking click.
