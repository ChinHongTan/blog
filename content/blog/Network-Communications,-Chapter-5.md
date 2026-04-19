---
title: IPv4 Addressing, Subnetting, and VLSM
date: 2026-04-13T10:47
edited_at: 2026-04-19T03:13:55.905Z
author: chinono
path: /blog/Network-Communications,-Chapter-5
---

## What is IPv4?

Every device on a network needs an address, just like every house on a street needs a number. In networking, that address is called an **IP address**, and the most widely used version is **IPv4** (Internet Protocol version 4).

An IPv4 address is a **32-bit number**, but instead of writing out all 32 ones and zeros, we break it into four groups of 8 bits (called **octets**) and write each group as a decimal number separated by dots. This is known as **dotted decimal notation**:

```
A.B.C.D
```

Each octet ranges from **0 to 255**, so a typical IPv4 address looks like `192.168.10.10`.

### The Two Parts of an IP Address

Here's the key idea: within those 32 bits, some of them identify **which network** the device belongs to, and the rest identify **which host** (device) it is on that network.

Take the address `192.168.10.10` with a subnet mask of `255.255.255.0`:

| <br />             | Octet 1  | Octet 2  | Octet 3  | Octet 4  |
| ------------------ | -------- | -------- | -------- | -------- |
| **IPv4 Address**   | 192      | 168      | 10       | 10       |
| **Binary**         | 11000000 | 10101000 | 00001010 | 00001010 |
| **Subnet Mask**    | 255      | 255      | 255      | 0        |
| **Mask in Binary** | 11111111 | 11111111 | 11111111 | 00000000 |

The 1s in the subnet mask mark the **network portion**, and the 0s mark the **host portion**. So in this case, `192.168.10` is the network, and `.10` identifies the specific device.

### Subnet Masks and the ANDing Process

A **subnet mask** tells us exactly where the boundary lies between the network bits and the host bits. When you assign an IP address to a device, the subnet mask is used to determine the network address through a process called **ANDing** — a bitwise AND operation between the IP address and the subnet mask.

Think of it this way: ANDing is like laying the mask on top of the address and only letting through the network part.

## Three Types of Addresses in Every Network

Within any network, there are three special types of addresses you need to know:

**Network Address** — This is the "name" of the network itself. All host bits are set to 0. You can't assign this to a device; it's used to refer to the network as a whole. For example, in `192.168.1.0/24`, the `.0` means all host bits are zero.

**Broadcast Address** — This is the address used to send a message to *every* device on the network. All host bits are set to 1. For the network `192.168.1.0/24`, the broadcast address is `192.168.1.255`.

**Host Addresses** — These are all the addresses in between the network address and the broadcast address. These are the ones you actually assign to devices. In our example, the usable host range is `192.168.1.1` through `192.168.1.254`.

## Types of IPv4 Addresses

### Unicast, Multicast, and Beyond

**Unicast addresses** (0.0.0.0 to 223.255.255.255) are used for one-to-one communication — one sender, one receiver. This is the most common type.

**Multicast addresses** (224.0.0.0 to 239.255.255.255) are used for one-to-many communication. A device sends a single packet, and it gets delivered to a *group* of interested receivers. Within this range, `224.0.0.0` to `224.0.0.255` are reserved for link-local multicast, while `224.0.1.0` to `238.255.255.255` are globally scoped.

### Public vs. Private Addresses

Not every IP address is meant to be seen on the public internet. **Private addresses** (defined in RFC 1918) are reserved for use within internal networks. If your device doesn't need direct internet access, it can use a private address. The three private ranges are:

| Range                         | CIDR Notation  | Typical Use         |
| ----------------------------- | -------------- | ------------------- |
| 10.0.0.0 – 10.255.255.255     | 10.0.0.0/8     | Large enterprises   |
| 172.16.0.0 – 172.31.255.255   | 172.16.0.0/12  | Medium networks     |
| 192.168.0.0 – 192.168.255.255 | 192.168.0.0/16 | Home & small office |

**Public addresses** are everything else in the unicast range. These are globally unique and routable on the internet — they're what web servers, cloud services, and any publicly accessible host use.

One critical rule: **private addresses cannot be routed over the internet.** If a device with a private address needs to reach the internet, a router must perform Network Address Translation (NAT) to swap the private address for a public one.

In a typical network setup, devices on the intranet use private addresses, servers in the DMZ (demilitarized zone) use public addresses, and a router connects everything to the internet.

### Special Addresses

**Loopback (127.0.0.1)** — This is the "talk to yourself" address. When a device sends traffic to 127.0.0.1, it's sending it right back to itself. It's commonly used for testing whether the TCP/IP stack on a machine is working.

**Link-Local (169.254.0.0/16)** — If a device can't get an IP address from a DHCP server, the operating system may automatically assign it an address in this range. You've probably seen this happen when your Wi-Fi connects but "has no internet" — the device falls back to a link-local address.

## Classful Addressing (Historical Context)

In the early days of the internet, IP addresses were divided into classes. While **classful addressing is largely obsolete today** (replaced by CIDR), understanding it helps you make sense of older documentation and networking exams.

| Class | 1st Octet Range | Network/Host Split  | Default Subnet Mask |
| ----- | --------------- | ------------------- | ------------------- |
| A     | 1–127           | N.H.H.H             | 255.0.0.0           |
| B     | 128–191         | N.N.H.H             | 255.255.0.0         |
| C     | 192–223         | N.N.N.H             | 255.255.255.0       |
| D     | 224–239         | Multicast (no mask) | —                   |
| E     | 240–255         | Experimental        | —                   |

The first few bits of the first octet determine the class: Class A starts with `0`, Class B with `10`, Class C with `110`, and so on.

### Who Manages IP Address Assignments?

Public IP addresses are managed by five **Regional Internet Registries (RIRs)**, each responsible for a different part of the world: ARIN (North America), RIPE NCC (Europe & Middle East), APNIC (Asia-Pacific — this covers Taiwan!), AfriNIC (Africa), and LACNIC (Latin America & Caribbean).

## Subnetting: Dividing Networks into Smaller Pieces

### Why Subnet?

Imagine a single network with thousands of devices. Every time any device sends a broadcast (and they do this often), *every other device* on the network has to process that broadcast. This creates a huge amount of unnecessary traffic, slowing everything down.

**Subnetting** is the solution. It divides one large network into smaller **subnets**, each with its own broadcast domain. Broadcasts in one subnet don't affect devices in another. The result: less congestion, better performance, and easier management.

### How Subnets Communicate

Devices on the **same subnet** can talk to each other directly. But to communicate across subnets, traffic must pass through a **router**. Each device uses the router interface on its local subnet as its **default gateway**.

For example, consider a university network with a single router (R1) connected to the internet. The network is divided into four subnets:

* **Administration** — LAN 1: `10.0.1.0/24` (via interface G0/0)

* **Students** — LAN 2: `10.0.2.0/24` (via interface G0/1)

* **Human Resources** — LAN 3: `10.0.3.0/24` (via interface G0/3)

* **Accounting** — LAN 4: `10.0.4.0/24` (via interface G0/2)

Each subnet is isolated. A student's computer can't directly broadcast to an accounting workstation — traffic between them goes through R1.

### The Math Behind Subnetting

Subnetting works by **borrowing bits** from the host portion of an address and using them as additional network bits. The key formulas are:

* **Number of subnets** = 2^(borrowed bits)

* **Number of usable hosts per subnet** = 2^(remaining host bits) − 2

We subtract 2 because every subnet reserves one address for the network address and one for the broadcast address.

### Worked Example: Subnetting a /24 Network

Let's subnet `192.168.1.0/24` by borrowing **2 bits** from the host portion.

The original last octet in binary: `00 | 000000` (after borrowing 2 bits, the first 2 become subnet bits, and 6 remain as host bits).

The new subnet mask becomes `255.255.255.192` (or /26), since those 2 extra bits in the last octet give us `11000000` = 192.

* **Number of subnets:** 2² = **4 subnets**

* **Hosts per subnet:** 2⁶ = 64 total, minus 2 = **62 usable hosts**

For the first subnet (`192.168.1.0/26`):

| Type            | Binary (last octet) | Decimal      |
| --------------- | ------------------- | ------------ |
| Network Address | 00 000000           | 192.168.1.0  |
| First Host      | 00 000001           | 192.168.1.1  |
| Last Host       | 00 111110           | 192.168.1.62 |
| Broadcast       | 00 111111           | 192.168.1.63 |

The next subnet starts at `192.168.1.64`, then `192.168.1.128`, and finally `192.168.1.192`.

### Subnetting Reference Tables

Here are quick reference tables for common subnetting scenarios.

**Subnetting a /24 Network:**

| Prefix | Subnet Mask     | # of Subnets | # of Usable Hosts |
| ------ | --------------- | ------------ | ----------------- |
| /25    | 255.255.255.128 | 2            | 126               |
| /26    | 255.255.255.192 | 4            | 62                |
| /27    | 255.255.255.224 | 8            | 30                |
| /28    | 255.255.255.240 | 16           | 14                |
| /29    | 255.255.255.248 | 32           | 6                 |
| /30    | 255.255.255.252 | 64           | 2                 |

**Subnetting a /16 Network:**

| Prefix | Subnet Mask   | # of Subnets | # of Usable Hosts |
| ------ | ------------- | ------------ | ----------------- |
| /17    | 255.255.128.0 | 2            | 32,766            |
| /18    | 255.255.192.0 | 4            | 16,382            |
| /19    | 255.255.224.0 | 8            | 8,190             |
| /20    | 255.255.240.0 | 16           | 4,094             |
| /21    | 255.255.248.0 | 32           | 2,046             |
| /22    | 255.255.252.0 | 64           | 1,022             |
| /23    | 255.255.254.0 | 128          | 510               |
| /24    | 255.255.255.0 | 256          | 254               |

### Worked Example: Subnetting a /16 Network

Consider the Class B network `172.16.0.0/16`. If we borrow **7 bits** from the host portion, the new mask becomes `255.255.254.0` (or /23).

* **Number of subnets:** 2⁷ = **128 subnets**

* **Remaining host bits:** 9

* **Hosts per subnet:** 2⁹ − 2 = **510 usable hosts**

For the first subnet (`172.16.0.0/23`):

| Type            | Address         |
| --------------- | --------------- |
| Network Address | 172.16.0.0/23   |
| First Host      | 172.16.0.1/23   |
| Last Host       | 172.16.0.254/23 |
| Broadcast       | 172.16.1.255    |

Notice how the subnet spans two values in the third octet (0 and 1) because we have 9 host bits that cross the octet boundary.

## Variable Length Subnet Mask (VLSM)

Standard subnetting gives every subnet the same size, but real-world networks rarely have equal needs. A headquarters might need 40 hosts while a small branch only needs 10. Giving both subnets the same /26 mask wastes addresses in the smaller branch.

**VLSM** (Variable Length Subnet Mask) solves this by allowing you to **subnet a subnet** — using different mask lengths for different parts of the network.

For example, with `172.16.0.0/16`, you might create seven /27 subnets (30 hosts each) for your larger offices, then take one of the remaining blocks and further divide it into eight smaller /30 subnets (2 hosts each) for point-to-point router links.

In a real enterprise topology, subnet assignments might look like: the corporate headquarters gets `172.16.0.0/26` and `172.16.0.64/26`, Branch 1 gets `172.16.0.128/26` and `172.16.0.192/26`, and so on — each sized to match the actual number of hosts needed at that site.

## Planning Your Address Scheme

When designing a network's addressing plan, there are several key decisions to make:

**Determine your needs** — How many subnets do you need? How many hosts per subnet? These two numbers will guide which private address block to use and how many bits to borrow.

**Decide on static vs. dynamic addressing** — Servers, printers, and network infrastructure should have **static (fixed) IP addresses** so they're always reachable at the same address. Regular workstations and mobile devices can use **DHCP** to receive addresses automatically.

**Prevent duplicate addresses** — Every host in the entire internetwork must have a unique address. Overlapping subnets or duplicate assignments will cause connectivity issues that are painful to debug.

**Plan for access control and monitoring** — Grouping devices by function into subnets makes it easier to apply security policies (like firewall rules) and monitor performance. For instance, putting all servers in one subnet lets you apply stricter access controls to that subnet.

## Quick Recap

* **IPv4** addresses are 32-bit numbers written in dotted decimal (e.g., `192.168.1.1`).

* Every address has a **network portion** and a **host portion**, determined by the **subnet mask**.

* Each network has a **network address**, a **broadcast address**, and **usable host addresses** in between.

* **Private addresses** (10.x.x.x, 172.16–31.x.x, 192.168.x.x) are for internal use; **public addresses** are for the internet.

* **Subnetting** divides large networks into smaller ones by borrowing host bits, reducing broadcast traffic and improving manageability.

* **VLSM** lets you create subnets of different sizes to match real-world requirements.

* Good address planning considers subnet sizing, static vs. dynamic allocation, uniqueness, and security.

