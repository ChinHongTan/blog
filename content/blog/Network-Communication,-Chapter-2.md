---
title: Network Communication, Chapter 2
date: 2026-04-09T12:59
edited_at: 2026-04-10T10:12:38.381Z
author: chinono
path: /blog/Network-Communication,-Chapter-2
---

## Why Do We Need "Rules" for Communication?

Think about a regular face-to-face conversation. Even without realising it, you follow a bunch of unspoken rules — you wait for your turn to speak, you use a language both sides understand, and you expect some kind of acknowledgment that the other person heard you. Networking is exactly the same.

In networking, these rules are called **protocols**. Every time a message travels from a source to a destination — whether it's an email, a video call, or a simple ping — protocols govern how that happens.

For any communication to work, you need at least these things in place:

* **An identified sender and receiver** — both ends need to be known.

* **A common language and grammar** — otherwise the message is just noise.

* **Speed and timing of delivery** — both sides need to agree on pacing.

* **Confirmation or acknowledgment** — how do you know the message arrived?

### Common Computer Protocol Concepts

Protocols in computer networks handle several key jobs:

* **Message encoding** — Converting information into a transmittable format (and decoding it on the other end). Think of it like translating your thoughts into words before speaking.

* **Message formatting and encapsulation** — Structuring the message so the receiver knows how to read it, much like writing a letter with a proper header, body, and signature.

* **Message size** — Just like you wouldn't dump an entire essay on someone in one breath, networks break messages into manageable chunks.

* **Message timing** — This covers three things:

  * **Flow control**: How much data can be sent, and how fast.

  * **Response timeout**: How long to wait for a reply before assuming something went wrong.

  * **Access method**: Deciding *when* a device is allowed to send — you can't have everyone shouting at once.

* **Message delivery options** — Sometimes you send to one person (unicast), sometimes to a group (multicast), and sometimes to everyone nearby (broadcast).

## Network Protocols: The Common Language of Devices

A single message sent over a network usually involves **multiple protocols** working together, each handling a different part of the job. A group of these inter-related protocols is called a **protocol suite**.

The most important protocol suite you'll encounter is **TCP/IP** — it's the backbone of the Internet. TCP/IP is implemented in software, hardware, or both on every device that connects to a network.

### The Layered Model

To make sense of how all these protocols interact, we use a **layered model**. The TCP/IP model organises protocols into layers, where each layer has a specific role and communicates with the layers directly above and below it. This separation makes it easier to design, troubleshoot, and update networks — you can swap out a protocol at one layer without breaking everything else.

### Who Makes the Rules?

Network standards are developed by **standards organisations** — vendor-neutral, non-profit bodies whose job is to promote open standards so that devices from different manufacturers can all work together. You'll hear names like IEEE, IETF, and ICANN come up often in networking.

## Data Encapsulation: Wrapping Your Data for Delivery

Imagine you want to send a huge video file across the Internet. Sending it as one giant uninterrupted stream would hog the entire communication channel and create massive delays for everyone else. That's clearly not practical.

### Segmentation and Multiplexing

The solution is **segmentation** — breaking the data into smaller, more manageable pieces before sending. This has two big benefits:

1. **Reliability** — If one small piece gets lost, you only resend that piece, not the entire file.
2. **Multiplexing** — Smaller pieces from *different* conversations can be interleaved on the same network, so multiple users can share the same link simultaneously.

Each segment goes through the same process to make sure it reaches the right destination and can be reassembled into the original message.

### The Encapsulation Process

As data travels down through the protocol layers, each layer adds its own header (and sometimes trailer) information. This is the **encapsulation process**. At each layer, the data takes on a different form, called a **Protocol Data Unit (PDU)**:

| Layer                      | PDU Name    | What It Represents                               |
| :------------------------- | :---------- | :----------------------------------------------- |
| Application                | **Data**    | The raw information from the app                 |
| Transport                  | **Segment** | Data + port info for process-to-process delivery |
| Internet (Network)         | **Packet**  | Segment + IP addresses for host-to-host delivery |
| Network Access (Data Link) | **Frame**   | Packet + MAC addresses for hop-to-hop delivery   |
| Physical                   | **Bits**    | The actual 1s and 0s on the wire                 |

When the data arrives at the destination, the reverse happens — **de-encapsulation**. Each layer strips off its header, passing the remaining data up to the next layer until the application gets the original message.

:::info
### The Encapsulation Process (Packing the Box)

* **Application Layer (Data):** This is the actual birthday card and the gift you want to send. It is the raw information you care about.

* **Transport Layer (Segment):** You take the gift and put it in a small inner envelope. You write \*"To John, from Jane"\*on it. In networking, this layer adds the **port number**, which makes sure the data goes to the exact right application (John) and not someone else in the house. Because the data might be too big, this layer will also chop it up into manageable pieces (segments).

* **Internet Layer (Packet):** You put that inner envelope inside a standard cardboard shipping box. On the outside, you write the final destination address: *"123 Main St, New York, NY."* In networking, this layer adds the **IP Address**, ensuring the box can navigate the global internet to find the correct final building (host-to-host delivery).

* **Network Access Layer (Frame):** The post office takes your box and loads it into a specific local delivery truck. They stick a temporary barcode on the outside of the box that just says, *"Take this to the airport depot."* In networking, this layer adds the **MAC Address**. It doesn't care about the final destination in New York; it only cares about successfully moving the box to the very next local stop (hop-to-hop delivery).

* **Physical Layer (Bits):** The truck physically drives down the road. In networking, this is the actual physical electricity pulsing over copper wires, or light flashing down a fiber optic cable, represented as 1s and 0s.
:::

## Data Access: Two Kinds of Addresses

Getting data from point A to point B actually involves **two different addressing systems** working at different layers:

* **Network layer (IP) addresses** — These are responsible for delivering the packet from the *original source* to the *final destination*, even across different networks. Think of this as the mailing address on an envelope.

* **Data link layer (MAC) addresses** — These handle delivery between one network interface card (NIC) and the next, on the *same local network*. Think of this as the "hand it to the next person in the chain" step.

:::info
### MAC address vs IP address

**MAC Address = Who you are** (Like your DNA). It is permanently burned into your device at the factory.

**IP Address = Where you are** (Like your street address). It changes depending on where you connect. If you take your laptop from your house to a coffee shop, your MAC address stays exactly the same, but your IP address changes because you are on a new network.

### The IP Ban & VPNs (The Network Layer)

When a remote website or game server bans your IP address, they are blocking your "street address." You turn on a VPN. A VPN acts as a middleman. You send your data to the VPN server, and the VPN server forwards it to the website. The website only sees the VPN's "street address" (IP address), not yours. Because your IP is hidden, you bypass the ban.

### The MAC Ban (The Data Link Layer)

**MAC addresses never leave your local network.**

When your computer sends a packet of data to a server in another country, it hands the packet to your home router. Your router literally **strips off your computer's MAC address**, throws it in the trash, and slaps on the *router's own MAC address* before sending it to the next stop. This happens at every single "hop" across the internet.

Because of this, **a remote website cannot ban your MAC address over the internet because they literally cannot see it.** Only your local router can see your MAC address.

So, how do MAC bans actually work, and are they circumventable?

**1. Local Network MAC Bans (The Wi-Fi Ban)** If you misbehave at school or work, the IT admin can tell the local Wi-Fi router, "Do not let the MAC address belonging to John's phone connect." Since the router is on the *same local network* as your phone, it sees your MAC address and blocks you.

* **Is it circumventable? YES.** Even though the MAC address is burned into your hardware, you can use a software trick called **MAC Spoofing**. You simply tell your phone or computer's operating system to wear a "mask" and broadcast a fake, randomly generated MAC address. The router sees the new fake MAC, doesn't recognize it as banned, and lets you right back on. (In fact, modern iOS and Android phones do this automatically for privacy now!).

**2. Hardware Bans (The Anti-Cheat Ban)** If websites can't see your MAC address over the internet, how do game developers "hardware ban" cheaters?

* They don't do it over the internet; they do it locally. Games like *Valorant* or *Call of Duty* make you install aggressive Anti-Cheat software. That software runs *locally* on your actual physical machine, reads your motherboard's MAC address (and serial numbers of your CPU and hard drive), and sends a list of those numbers to the game server.

* **Is it circumventable? YES, but it's much harder.** Because the anti-cheat is looking deeply at multiple pieces of hardware, simple MAC spoofing usually isn't enough. People use complex "hardware spoofers" to trick the anti-cheat, but it is a constant game of cat-and-mouse.
:::

### Same Network vs. Different Network

When sender and receiver are on the **same network**, the frame goes directly to the destination device using its MAC address.

When they're on **different networks**, things get more interesting. The IP addresses still point to the original source and final destination, but the frame is first sent to the **router (default gateway)**. The router then re-wraps (re-encapsulates) the data in a new frame destined for the next hop, and so on, until the packet reaches the destination network.

This is a fundamental concept: **IP addresses stay the same end-to-end, but MAC addresses change at every hop.**

:::info
Let's say, you want to connect to Google (`8.8.8.8`) from your computer (`192.168.0.15`). So, it builds an IP Packet (the cardboard shipping box).

* **Source IP:** 192.168.0.15 (You)

* **Destination IP:** 8.8.8.8 (Google)

This box is now sealed. These IP addresses **will not change** for the entire journey. Your computer looks at Google's IP address (`8.8.8.8`) and realizes, *"Google is not on my local Wi-Fi network. I need to hand this box to the router so it can leave the house."*

To get the box to the router, your computer encapsulates the Packet inside a **Frame** (the local delivery truck). It puts local MAC address labels on the outside of this truck:

* **Source MAC:** Your Computer's MAC Address

* **Destination MAC:** Your Router's MAC Address *(Notice it does NOT use Google's MAC address!)*

Your computer sends this Frame over the Wi-Fi or Ethernet cable. Because the Destination MAC belongs to your router, the router says, *"Hey, this truck is for me!"* and catches it. The router "opens" the Frame (it unloads the delivery truck). It looks at the inner IP Packet (the cardboard box) and sees the Destination IP is `8.8.8.8` (Google). The router says, *"Okay, I need to send this to the internet provider next."* The router **throws away your original Frame** (the local truck is done with its job). The router builds a **brand new Frame** (a new truck) to drive the packet to the next stop (your ISP). The new Frame has:

* **Source MAC:** Your Router's MAC Address

* **Destination MAC:** The ISP Router's MAC Address

It hides your local IP address (`192.168.0.15`), and replaces your local IP with your house's **Public IP Address** (the single address your ISP assigned to your modem, say `203.0.113.5`). To remember that *your specific computer* made this request, the router assigns a random, unique **Port Number** (let's say `#5001`) to the packet. The router then writes this in its NAT Table ledger:

&#x20;   "If any mail comes back from Google addressed to Port #5001, give it to the computer at 192.168.0.15."

Google receives the request. As far as Google is concerned, the request came from `203.0.113.5` on Port `#5001`. Google has no idea your specific computer exists, nor does it know your MAC address.

Google packages up the webpage and sends it back to your house's Public IP, specifically tagging it for Port `#5001`.

The webpage arrives at your router. The router looks at the package and says, *"Okay, this is from Google, and it's tagged for Port #5001."*

It opens up its NAT Table ledger, finds the entry for `#5001`, and sees the note it left for itself: *"Ah! Port #5001 means this belongs to 192.168.0.15."*

Now that the router knows the internal IP address (`192.168.0.15`) that the data belongs to, it needs to hand the data across the house to your computer.

The router looks up your computer's IP address in its local directory to find your **MAC Address**. It packages Google's webpage into a brand new **Local Frame**, slaps your computer's MAC address on the destination label, and pushes it out over the Wi-Fi. Your computer sees its MAC address, catches the frame, and loads the webpage!
:::

## Network Operating Systems

Now that we know how data travels across networks, how do we actually control the devices—like routers and switches—that are directing all this traffic? To do that, we need to look at the software running on the hardware. 

Routers, switches, and other infrastructure devices don't run Windows or macOS — they run specialised **network operating systems**. On Cisco devices, this is the **Cisco IOS (Internetwork Operating System)**.

A few key points about how IOS works:

* The IOS file is stored in **flash memory** (non-volatile, survives reboots).

* On boot, the IOS is copied from flash into **RAM**, where it runs while the device is operating.

* Like any OS, it has a **kernel** (talks to hardware) and a **shell** (the interface you interact with), which can be a CLI or GUI.

### Ways to Access the CLI

There are several ways to get into a device's command-line interface:

| Method      | Type        | Notes                                                                                                                              |
| :---------- | :---------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Console** | Out-of-band | Physical cable to the console port. Used for initial setup and maintenance. Works even if the network is down.                     |
| **AUX**     | Out-of-band | Older method using a modem and phone line. Also doesn't require network services.                                                  |
| **Telnet**  | In-band     | Remote access over the network via a virtual interface. Requires the network to be up. **Not secure**— data is sent in plain text. |
| **SSH**     | In-band     | Like Telnet, but with encryption and stronger authentication. **Always prefer SSH over Telnet.**                                   |

Common terminal emulator programs include PuTTY, Tera Term, SecureCRT, and the macOS Terminal.

### CLI Modes

The Cisco IOS CLI is organised in a hierarchy of modes, each with different levels of access:

1. **User EXEC mode** (`>`) — Limited monitoring commands. You land here by default.
2. **Privileged EXEC mode** (`#`) — Full access to monitoring and management commands. Enter with `enable`.
3. **Global configuration mode** (`(config)#`) — Used to make device-wide configuration changes. Enter with `configure terminal`.
4. **Specific configuration modes** — Sub-modes like interface configuration (`(config-if)#`) or line configuration (`(config-line)#`) for configuring specific components.

***

## Basic Commands: Securing Your Device

Once you're in the CLI, some of the first things you'll want to do are give your device a name and lock it down with passwords.

### Setting a Hostname

Hostnames help you identify devices on the network. A descriptive hostname (like `HQ-Router-1`) is much more useful than the default `Router`.

### Passwords You Should Know

Passwords are the first line of defence against unauthorised access:

* **Enable password** — Restricts access to privileged EXEC mode (stored in plain text — avoid using this alone).

* **Enable secret** — Same purpose as above, but the password is **encrypted**. Always use this instead of `enable password`.

* **Console password** — Protects the physical console port.

* **VTY password** — Protects remote access via Telnet/SSH.

***

## Key Takeaways

* Protocols are the rules that govern all network communication — from encoding to timing to delivery.

* The **TCP/IP model** organises protocols into layers, each with a distinct job.

* **Encapsulation** wraps data with headers at each layer; **de-encapsulation** unwraps them at the destination.

* **IP addresses** handle end-to-end delivery; **MAC addresses** handle hop-by-hop delivery.

* Network devices run specialised operating systems like **Cisco IOS**, accessed through console, Telnet, or SSH.

* Always **secure your devices** with hostnames, encrypted passwords, and SSH access.

