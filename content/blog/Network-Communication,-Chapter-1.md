---
title: Chapter 1: Network Components, Topologies, and Types
date: 2026-04-09T11:56
edited_at: 2026-04-19T03:07:35.675Z
author: chinono
path: /blog/Network-Communication,-Chapter-1
---

## Why Should You Care About Networks?

We live in a hyper-connected world. News travels worldwide in seconds, we store our photos and documents in the cloud, and video calls with people across the globe are just a click away. Behind all of this is one thing: **computer networks**.

The idea of the **Internet of Everything (IoE)** captures this well — it's the convergence of people, processes, data, and things, all linked together through networked connections. Understanding how networks work is the first step to understanding the digital infrastructure that powers modern life.

## Hosts, Clients, and Servers

Every device that participates directly in network communication is called a **host** (or **end device**). Your laptop, your phone, a web server — all hosts. They can send and receive messages on the network.

In modern networks, an end device can play one of three roles:

* **Client** — requests information or services (e.g. your browser asking for a web page).

* **Server** — provides information or services (e.g. a machine serving that web page). Servers run specialised software for each service they offer.

* **Both** — in a **peer-to-peer (P2P) network**, a single host can act as client and server simultaneously. Think of file-sharing applications where your computer both downloads from and uploads to other users.

## Network Components

A network's infrastructure breaks down into three broad categories:

### 1. End Devices

These are the devices at the "edges" of the network — the ones people actually interact with. Examples include laptops, smartphones, network printers, VoIP phones, security cameras, and tablets.

### 2. Intermediary Devices

These are the behind-the-scenes workhorses that make sure data gets where it needs to go:

* **Switches and wireless access points** — provide network access by connecting end devices together.

* **Routers** — connect separate networks to form an *internetwork*, directing traffic between them.

* **Firewalls** — enforce security policies by filtering unauthorised traffic.

:::info
## What's different between a Switch, Router and Modem?

1. **Modem**: Your ISP sends the internet to your house via analog signals through cables (like coax, fiber optic, or phone lines). Your computers, however, only speak in digital signals (1s and 0s). The modem acts as a translator, turning the ISP's signal into a digital signal your devices can understand, and vice versa.
2. **Router**: The router sits just inside your modem. It assigns a unique local IP address to every device in your house. When you request a webpage on your phone, the router remembers that *your phone* asked for it, sends the request out through the modem, and when the website's data comes back, the router ensures it goes to your phone and not your smart TV.
3. **Switch**: While a router connects your home to the outside world, a switch just links your home devices to each other. It gives you more ports to plug things in. When a computer plugged into port 1 wants to send a file to a printer plugged into port 4, the switch directs that data straight from port 1 to port 4 without bothering the rest of the network.
:::

### 3. Network Media

Data needs a physical (or wireless) channel to travel through. The three common types of media are:

* **Metallic wires** (e.g. copper cables like Ethernet)

* **Glass or plastic fibres** (fibre optic cables — fast and long-range)

* **Wireless transmission** (radio waves — Wi-Fi, Bluetooth, cellular)

## Network Representations and Topologies

When networks get large, we need diagrams to make sense of them. These **topology diagrams** come in two flavours:

* **Physical topology** — shows where devices are physically located, which ports are in use, and how cables are actually installed.

* **Logical topology** — shows how devices are logically connected, including their IP addresses and port assignments.

Both views are essential. The physical topology helps you troubleshoot hardware, while the logical topology helps you understand how data flows.

## Types of Networks

Networks come in every size:

| Scale                                 | Description                                                                                 |
| :------------------------------------ | :------------------------------------------------------------------------------------------ |
| **Home network**                      | A few devices sharing printers, files, and music.                                           |
| **SOHO** (Small Office / Home Office) | Supports remote work — advertising, ordering supplies, communicating with clients.          |
| **Medium to large**                   | Corporate or campus networks with hundreds to thousands of hosts across multiple locations. |
| **The Internet**                      | A network *of* networks, connecting hundreds of millions of computers worldwide.            |

### LAN vs. WAN

The two most fundamental network types are:

**Local Area Network (LAN)** — covers a small geographical area like a home, school, or office building. Usually managed by a single person or organisation, and offers high-speed connections to devices within that area.

**Wide Area Network (WAN)** — spans large geographical areas, connecting LANs across cities, countries, or even continents. Typically managed by multiple service providers, and the links between LANs tend to be slower than what you'd get inside a LAN.

### Internet, Intranet, and Extranet

These three terms often confuse beginners, so here's a simple breakdown:

* **Internet** — the global, public collection of interconnected networks using common standards.

* **Intranet** — a *private* network of LANs and WANs belonging to an organisation, accessible only to its members.

* **Extranet** — like an intranet, but with controlled access granted to specific external users (e.g. suppliers or partner hospitals).

## Internet Connection Types

### For Homes and Small Offices

| Type                              | How it Works                                                                                                                                  |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cable**                         | Shares the same cable as cable TV. High bandwidth, always-on.                                                                                 |
| **DSL (Digital Subscriber Line)** | Runs over copper telephone lines, with a much higher frequency than human voice. Home users typically use ADSL (faster download than upload). |
| **Cellular**                      | Connects via cell towers (3G / 4G / 5G). Great for mobile access.                                                                             |
| **Satellite**                     | Useful in remote areas, but needs a clear line of sight to the satellite.                                                                     |
| **Dial-up**                       | Uses a phone line and modem. Very slow — mostly a relic, but still exists in some areas.                                                      |

### For Businesses

Businesses often need faster, more reliable, and dedicated connections:

* **Dedicated Leased Lines** — reserved circuits rented monthly or yearly for private data/voice networking. It guarantees 100% of the bandwidth all the time.

* **Metro Ethernet** — Metro Ethernet takes that incredibly fast, highly reliable local network technology and stretches it across an entire city. Metro Ethernet allows a company to connect their downtown office to their suburban warehouse.

* **Business DSL (SDSL)** — symmetric speeds (equal upload and download), unlike consumer ADSL.

A key modern trend is **converged networks** — carrying voice, video, and data all on a single network infrastructure.

:::info
A note: In modern days, this (converged networks) is just standard behaviour. The note is talking about historical shift in how networks are built.

Imagine an office building in the 1990s. The IT and facilities teams literally had to run **three completely separate sets of cables** through the walls.

1. Copper telephone wires to every desk just for phone calls.
2. Coaxial cables to conference rooms and lobbies just for video/television.
3. Ethernet cables to the computers just for data and internet access.

   <br />

   Eventually, engineers realised that a voice call and a video stream could just be chopped up into digital 1s and 0s, exactly like an email or a webpage.

   <br />

   Once voice and video became digital data, businesses could rip out the old phone lines and TV cables. Now, they just run one single, robust Ethernet/Wi-Fi network. That single infrastructure carries the data, the video (like Zoom), and the voice (VoIP—Voice over Internet Protocol).
:::

## What Makes a Network "Reliable"?

Good network architecture addresses four fundamental characteristics:

### Fault Tolerance

A fault-tolerant network limits the damage when something breaks. The key idea is **redundancy** — having multiple paths between source and destination so that if one path fails, traffic is instantly rerouted through another.

### Scalability

A scalable network can grow — adding new users, devices, and services — without degrading performance for existing users. Following accepted standards and protocols is what makes this possible.

### Quality of Service (QoS)

When voice, video, and data all share the same network, congestion can happen. QoS is the mechanism that manages this by **prioritising** traffic. For example, a router with QoS can give voice calls priority over a large file download, so your call doesn't break up.

### Security

Network security protects both the infrastructure itself and the data flowing through it. It rests on three pillars, sometimes called the **CIA triad**:

1. **Confidentiality** — only authorised recipients can access the data.
2. **Integrity** — data hasn't been tampered with during transmission.
3. **Availability** — authorised users can access services when they need to.

## Network Trends to Watch

A few trends shaping today's networks:

* **BYOD (Bring Your Own Device)** — people use their personal devices on business and campus networks. Convenient, but raises security questions.

* **Online Collaboration** — tools for real-time messaging, video, and file sharing (think Webex, Teams, Slack, etc.).

* **Cloud Computing** — storing data and running applications on remote servers. Comes in four flavours: public, private, hybrid, and community clouds.

* **Smart Home Technology** — everyday appliances connecting to the network and becoming automated.

* **Powerline Networking** — using existing electrical wiring to carry network data, eliminating the need for extra cables.

## Network Security Threats

Finally, let's talk about the bad stuff. Common external threats include:

* **Malware** (viruses, worms, Trojans) — malicious code running on your device.

* **Spyware and adware** — secretly installed software that collects your information.

* **Zero-day attacks** — exploits that target vulnerabilities on the very day they're discovered, before patches exist.

* **Denial of Service (DoS)** — attacks that overwhelm and crash network services.

* **Data interception and theft** — capturing private information as it travels across the network.

* **Identity theft** — stealing login credentials to access private data.

### How Do We Defend Against These?

For home and small office networks, the basics are antivirus/antispyware software and **firewall filtering** to block unauthorised access.

Larger corporate networks add more layers: dedicated firewall systems, **Access Control Lists (ACLs)** for fine-grained traffic filtering, **Intrusion Prevention Systems (IPS)** to catch fast-spreading threats, and **VPNs** to give remote workers secure access.

## Wrapping Up

This chapter covered the foundations: what networks are made of, how they're classified, how we connect to the internet, what makes a network reliable, and how we keep it secure. These concepts form the bedrock for everything else in networking.

In the next chapter, we'll dive deeper into how data actually moves across these networks. Stay tuned!
