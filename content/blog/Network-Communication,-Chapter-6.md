---
title: "IPv6: Addressing, SLAAC, and NDP"
date: 2026-04-13T10:48
edited_at: 2026-04-19T03:14:21.420Z
author: chinono
path: /blog/Network-Communication,-Chapter-6
---

## Why Do We Need IPv6?

The Internet was never meant to be this big.

When IPv4 was designed, its 32-bit address space gave us roughly **4.3 billion addresses** — a number that seemed inexhaustible at the time. But the digital world had other plans. On **January 31, 2011**, the Internet Assigned Numbers Authority (IANA) allocated the last two `/8` IPv4 address blocks to the Regional Internet Registries (RIRs). In other words, we officially ran out of fresh IPv4 addresses to hand out.

And the demand is only growing. The Internet is no longer just for computers, tablets, and smartphones. We're entering the era of the **Internet of Things (IoT)** — where everything from cars and medical sensors to household appliances and environmental monitors are connecting online. Each of these devices needs an address.

IPv4 tried to cope with workarounds like **NAT (Network Address Translation)**, which lets multiple devices share a single public IP. But NAT introduces complexity, breaks certain applications, and is ultimately a band-aid, not a cure.

**IPv6** is the real solution. With a **128-bit address space**, it provides approximately **3.4 × 10³⁸ addresses** — enough for every grain of sand on Earth to have its own IP address, many times over.

## Understanding IPv6 Addresses

### The Format

An IPv6 address is **128 bits** long, written as **eight groups of four hexadecimal digits**, separated by colons. Each group (called a **hextet**) represents 16 bits.

```
Full format: X:X:X:X:X:X:X:X   (where each X = four hex digits)
 
Example:    2001:0DB8:ACAD:0001:0000:0000:0000:0100
```

That's a lot of characters. Fortunately, there are two shorthand rules to make things more manageable.

### Rule 1: Drop Leading Zeros

Within any hextet, you can omit **leading zeros** (zeros at the front). For example:

```
Full:        2001:0DB8:0000:1111:0000:0000:0000:0200
Shortened:   2001: DB8:   0:1111:   0:   0:   0: 200
```

### Rule 2: Replace Consecutive All-Zero Groups with `::`

A **double colon** (`::`) can replace one or more consecutive hextets that are all zeros. But you can only use `::` **once** per address — otherwise, it would be ambiguous how many zero groups each `::` represents.

```
Full:        2001:0DB8:0000:0000:0000:0000:0000:0100
Compressed:  2001:DB8::100
```

### Prefix Length Notation

Just like IPv4 uses a subnet mask, IPv6 uses a **prefix length** to indicate the network portion of an address. It's written with a slash followed by a number:

```
2001:0DB8:000A::/64
      ↑                  ↑
  Network portion    Prefix length (first 64 bits = network)
```

An IPv6 address is typically split into two halves: the first 64 bits identify the network (the **prefix**), and the last 64 bits identify the device on that network (the **Interface ID**).

## Types of IPv6 Addresses

IPv6 defines **three** main categories of addresses:

### 1. Unicast — "One-to-One"

A unicast address uniquely identifies **a single interface** on a device. When you send a packet to a unicast address, it goes to exactly one destination. Think of it as a direct letter to a specific mailbox.

### 2. Multicast — "One-to-Many"

A multicast address delivers a packet to **multiple destinations** simultaneously. Instead of sending separate copies, the network efficiently distributes one packet to an entire group. Think of it as a group chat message.

### 3. Anycast — "One-to-Nearest"

An anycast address can be assigned to **multiple devices**, but a packet sent to it is delivered only to the **nearest one** (determined by routing distance). Think of it as calling the closest branch of a restaurant chain — the system routes you to the nearest location.

> **Note:** Unlike IPv4, IPv6 has **no broadcast** address. The function of broadcast is handled by multicast in IPv6.

## IPv6 Unicast Addresses in Detail

There are **six** types of unicast addresses. Let's walk through each one.

### Global Unicast Address (GUA)

This is the IPv6 equivalent of a **public IPv4 address** — globally unique and routable across the Internet.

Currently, only addresses starting with the binary bits `001` (the range `2000::/3`) are being assigned as global unicast. That covers all addresses from `2000::` to `3FFF::`.

A global unicast address has three parts:

| Part                      | Bits              | Description                                                                              |
| ------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| **Global Routing Prefix** | Typically 48 bits | Assigned by the ISP or RIR; identifies the organization's network on the global Internet |
| **Subnet ID**             | Typically 16 bits | Used by the organization to create internal subnets                                      |
| **Interface ID**          | 64 bits           | Identifies the specific device interface; similar to the host portion in IPv4            |

```
|<--- 48 bits --->|<- 16 bits ->|<-------- 64 bits -------->|
  Global Routing       Subnet          Interface ID
     Prefix              ID
```

So a `/48` routing prefix + 16-bit Subnet ID gives you a `/64` prefix for each subnet.

### Link-Local Address

Link-local addresses are used for communication **within a single network segment** (link). They are **not routable** — routers will not forward packets with a link-local source or destination beyond the local link.

* **Range:** `FE80::/10`

* Every IPv6-enabled interface **automatically** gets a link-local address

* Used for neighbor discovery, router advertisements, and as the default gateway address

* Can also be configured manually as a static address

Think of link-local as a "neighborhood-only" address — devices on the same link can talk to each other, but the conversation stays local.

### Loopback Address

```
::1
```

The loopback address is the IPv6 version of `127.0.0.1` in IPv4. A device uses it to **send a packet to itself** — useful for testing whether the IPv6 stack is working. It cannot be assigned to a physical interface.

### Unspecified Address

```
::
```

The all-zeros address is used as a **placeholder source address** when a device doesn't yet have an address assigned (for example, during the initial boot-up process). It cannot be assigned to an interface or used as a destination.

### Unique Local Address

These are the IPv6 equivalent of **private IPv4 addresses** (like `192.168.x.x` or `10.x.x.x`). They are meant for communication within a site or between a few sites, and are **not routable** on the global Internet.

* **Range:** `FC00::/7` to `FDFF::/7`

### Embedded IPv4 Address

A special unicast address format that embeds an IPv4 address within an IPv6 address, used during transition from IPv4 to IPv6.

## How Devices Get Their IPv6 Addresses

One of the powerful features of IPv6 is its flexible addressing model. There are three main ways a device can obtain its IPv6 address.

### Option 1: SLAAC (Stateless Address Auto-Configuration)

SLAAC lets a device configure its own address **without a DHCPv6 server**. The process relies on **ICMPv6 Router Advertisement (RA) messages**.

Here's how it works:

1. A device boots up and sends a **Router Solicitation (RS)** message to the all-routers multicast address (`FF02::2`), essentially asking: *"Are there any routers out there? What network am I on?"*
2. A router responds with a **Router Advertisement (RA)** containing the network prefix, prefix length, and default gateway information.
3. The device combines the prefix with its own **Interface ID** (often generated via EUI-64, more on this below) to form a complete global unicast address.

Routers also send RA messages periodically (roughly every 200 seconds), so even devices that missed the initial exchange will eventually get their information.

To enable a Cisco router for IPv6 routing, you need the command:

```
Router(config)# ipv6 unicast-routing
```

### Option 2: Stateless DHCPv6 (SLAAC + DHCPv6)

In this hybrid approach, SLAAC handles the address and prefix, while a **DHCPv6 server** provides additional information such as DNS server addresses and domain names. The DHCPv6 server doesn't track which addresses are assigned — hence "stateless."

### Option 3: Stateful DHCPv6

This is closest to traditional DHCP in IPv4. A **stateful DHCPv6 server** assigns the full addressing information, including the global unicast address, prefix length, and DNS server addresses. The server maintains a record of which addresses are assigned to which devices.

## The EUI-64 Process

When using SLAAC, a device needs to generate a 64-bit Interface ID. One common method is **EUI-64** (Extended Unique Identifier, 64-bit), which derives the Interface ID from the device's **48-bit MAC address**.

Here's the process:

1. **Split** the 48-bit MAC address into two halves (24 bits each)
2. **Insert** the hex value `FFFE` (16 bits) in the middle
3. **Flip** the 7th bit (the Universal/Local bit) of the first byte

```
MAC Address:       FC:99:47:75:CE:E0
 
Step 1 — Split:    FC:99:47  |  75:CE:E0
Step 2 — Insert:   FC:99:47:FF:FE:75:CE:E0
Step 3 — Flip 7th: FE:99:47:FF:FE:75:CE:E0
 
Interface ID:      FE99:47FF:FE75:CEE0
```

This gives each device a unique Interface ID derived from its hardware address.

## IPv6 Multicast Addresses

Since IPv6 eliminates broadcast, **multicast** takes on a bigger role. There are two key types:

### Assigned Multicast

These are reserved addresses for well-known groups:

| Address   | Group       | Purpose                                                                                                     |
| --------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `FF02::1` | All-nodes   | Every IPv6-enabled device on the link receives packets sent here — this is the closest thing to a broadcast |
| `FF02::2` | All-routers | Only IPv6 routers join this group; hosts use it to send Router Solicitations                                |

### Solicited-Node Multicast

This is a clever mechanism for efficient neighbor discovery. Instead of broadcasting to every device, IPv6 creates a special multicast address that targets only the device(s) with a matching address suffix.

A solicited-node address is formed by combining the fixed prefix `FF02:0:0:0:0:1:FF00::/104` with the **last 24 bits** of a device's unicast address. Only devices sharing those same 24 bits will process the packet — everyone else ignores it.

This means address resolution in IPv6 is far more efficient than ARP broadcasts in IPv4.

## ICMPv6 and Neighbor Discovery Protocol (NDP)

**ICMPv6** is the upgraded messaging protocol for IPv6, and it plays a much larger role than its IPv4 counterpart. A key part of ICMPv6 is the **Neighbor Discovery Protocol (NDP)**, which handles several functions that ARP and other protocols managed in IPv4.

NDP uses five message types:

| Message                | Abbreviation | Purpose                                                                                         |
| ---------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| Router Solicitation    | RS           | Hosts ask routers for network configuration info                                                |
| Router Advertisement   | RA           | Routers announce prefix, gateway, and configuration options                                     |
| Neighbor Solicitation  | NS           | Resolve IPv6 address to a MAC address (replaces ARP); also used for Duplicate Address Detection |
| Neighbor Advertisement | NA           | Response to NS, providing the requested MAC address                                             |
| Redirect               | —            | Informs a host of a better next-hop router for a destination                                    |

### Duplicate Address Detection (DAD)

Before a device starts using a new IPv6 address (whether global unicast or link-local), it should verify that no other device on the link already has the same address. This is called **Duplicate Address Detection (DAD)**.

The process:

1. The device sends a **Neighbor Solicitation (NS)** message with its own tentative IPv6 address as the target
2. If another device already uses this address, it replies with a **Neighbor Advertisement (NA)**
3. If no NA is received within a timeout period, the address is considered unique and safe to use

### Address Resolution (Replacing ARP)

When a device knows the IPv6 address of a destination on the same link but not its MAC address, it sends a **Neighbor Solicitation** to the destination's **solicited-node multicast address**. The destination responds with a **Neighbor Advertisement** containing its MAC address.

This is more efficient than IPv4's ARP, which broadcasts to every device on the network.

## Transitioning from IPv4 to IPv6

The Internet can't switch to IPv6 overnight. The migration relies on three main strategies:

### Dual Stack

Devices run **both** IPv4 and IPv6 simultaneously. They have both an IPv4 and IPv6 address and can communicate using either protocol depending on what the destination supports. This is the most common transition approach today.

### Tunneling

When an IPv6 packet needs to cross an **IPv4-only** network, it gets **encapsulated** inside an IPv4 packet for transit, then unwrapped at the other end. The IPv4 network acts as a tunnel, carrying the IPv6 traffic without needing to understand it.

### Translation (NAT64)

**NAT64** enables IPv6-only devices to communicate with IPv4-only devices by translating between the two protocols — similar in concept to how NAT works in IPv4. This is useful when dual-stack isn't an option and the two endpoints speak different protocol versions.

## IPv6 Subnetting

Subnetting in IPv6 has a fundamentally different philosophy from IPv4. In IPv4, subnetting is primarily about **conserving addresses**. In IPv6, with its enormous address space, subnetting is about **organizing your network logically and hierarchically**.

### The Standard Approach

With a typical `/48` global routing prefix, you have a **16-bit Subnet ID** to work with. That gives you:

```
2¹⁶ = 65,536 possible /64 subnets
```

And you haven't borrowed a single bit from the Interface ID. Each subnet still has a full 64-bit host portion, supporting an astronomical number of devices.

```
Address Block: 2001:0DB8:ACAD::/48
 
Subnets:
  2001:0DB8:ACAD:0000::/64
  2001:0DB8:ACAD:0001::/64
  2001:0DB8:ACAD:0002::/64
  ... (up to)
  2001:0DB8:ACAD:FFFF::/64
```

### Subnetting on a Nibble Boundary

In some cases (often for security, to limit the number of hosts per subnet), you can extend the subnet prefix beyond `/64` by borrowing bits from the Interface ID. When doing this, the best practice is to subnet on a **nibble boundary** — meaning you extend in increments of 4 bits (one hex digit).

For example, extending from `/64` to `/68` borrows 4 bits from the Interface ID, reducing it from 64 to 60 bits. This creates **16 sub-subnets** within each `/64` subnet, each supporting fewer hosts.

```
/64 prefix → extend by 4 bits → /68 prefix
  Interface ID shrinks: 64 bits → 60 bits
  Sub-subnets per /64:  2⁴ = 16
```

Nibble boundaries (`/48`, `/52`, `/56`, `/60`, `/64`, `/68`, ...) keep the math clean because each nibble corresponds to exactly one hexadecimal digit.

## Quick Reference Summary

| Concept                 | Key Detail                                                                    |
| ----------------------- | ----------------------------------------------------------------------------- |
| IPv6 address size       | 128 bits (vs. 32 bits for IPv4)                                               |
| Address notation        | 8 hextets of 4 hex digits, separated by colons                                |
| Shorthand rules         | Drop leading zeros; replace consecutive all-zero groups with `::` (once only) |
| Global Unicast          | `2000::/3` — publicly routable, similar to public IPv4 addresses              |
| Link-Local              | `FE80::/10` — local link only, auto-generated, not routable                   |
| Unique Local            | `FC00::/7` — site-private, similar to `10.x.x.x` / `192.168.x.x`              |
| Loopback                | `::1`                                                                         |
| Multicast (all-nodes)   | `FF02::1`                                                                     |
| Multicast (all-routers) | `FF02::2`                                                                     |
| SLAAC                   | Stateless auto-configuration using RA messages                                |
| EUI-64                  | Generates Interface ID from MAC address                                       |
| DAD                     | Duplicate Address Detection using NS/NA messages                              |
| Transition methods      | Dual Stack, Tunneling, NAT64                                                  |

