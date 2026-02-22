---
title: 紀錄一次Discord機器人的開發過程
description: 閒著沒事幹當作練習～
date: 2026-02-22T09:31:22.018Z
author: chinono
path: /blog/紀錄一次Discord機器人的開發過程
featured_image: /images/uploads/1771752251524-108199050_p0.jpg
---

###### ~~每次都要找些好看的封面圖還挺麻煩的，就當是美圖分享吧~~

最近假期在家閒著沒事做。家裡父母管得嚴，加上妹妹正在準備升學考試，所以我在家也不怎麼玩遊戲，唯一的娛樂活動反而成了寫程式。正好我把部落格翻新之後，也沒有什麼別的事要做了，便決定要來試著重新寫一次 Discord 音樂機器人。

寫音樂機器人這件事我在中學時就開始做過了，當時花了我好幾個月的時間寫了一個能24/7在線的音樂機器人，所以這一次不是簡單的做一個會播歌機器人就好。我想要來寫點好玩的：給我的機器人加一個可以互動的網頁介面。

:::warning
請注意：本文並非一篇詳細的機器人搭建教學。筆者只想在這裡紀錄開發歷程，並且盡我所能解釋其背後的工作原理。
:::

## 1. 介紹

如果你在 2026 年還想弄一個能在 Discord 語音頻道裡播歌的機器人，馬上就會意識到這是一件苦差事。自從 Groovy 和 Rythm 在 2021 年被 YouTube 官方強制下線後，開發音樂機器人就成了一場開發者與YouTube 的軍備競賽。我曾經用的 \*\*[`node-ytdl-core`](https://github.com/fent/node-ytdl-core)**已在2024年8月正式停止開發，而其他的 package ：**[`play-dl`](https://github.com/play-dl/play-dl)**和**[`ytdl-core`](https://github.com/distubejs/ytdl-core)\*\*也紛紛停止開發了。

想用以前的老套路，下載仍然有在更新的 package 直接抓去 YouTube 音源放到 Discord 裡播放，也有許多缺點：

* **極度脆弱：** YouTube 現在會主動打擊爬蟲。他們會頻繁更改客戶端、加密演算法，甚至對資料中心的 IP 進行嚴格的限流。這意味著機器人可能昨天還好好的，今天早上起來就滿地報錯。

* **效能問題：** Node.js 是一個單執行緒（Single-threaded）的執行環境，不是設計來做繁重媒體處理的。讓它一邊下載音訊、解碼，還要重新編碼並即時推送到 Discord，只要同時服務幾個不同的伺服器，CPU 就要撐不住開始哀嚎了。Java 比 JavaScript 效能要好得多。

* **職責過載：** 機器人要負責監聽 Discord 訊息事件、爬取 YouTube、處理音軌，還要維持語音頻道的串流。只要其中一個環節崩潰，整個機器人就會直接斷線。

## 2. Lavalink

如果 Node.js 處理音訊這麼痛苦，那答案很簡單：**不要讓你的機器人碰音訊。**

解決這個問題的其中一個方法就是使用 **[`Lavalink`](https://github.com/lavalink-devs/Lavalink)**。Lavalink是一個專門為 Discord 機器人打造的獨立 Java 音訊伺服器。機器人只負責接收使用者的指令（例如 `/play`），Lavalink 則扛下所有髒活：解析 YouTube 網址、繞過限制、解碼音訊，並直接把串流送到 Discord 的語音頻道裡。兩者之間只透過 WebSocket 和 REST API 進行溝通。

這樣一來，如果機器人因為某些 Bug 當機重啟了，Lavalink 依然會在背景繼續播歌，完全不影響正在聽音樂的使用者。

## 3. 代碼結構

所以說了這麼多，機器人應該長什麼樣？

在這裡我會以自己在寫的機器人為例子，提供一個大概的框架，以及機器人背後的運行邏輯，方便讀者理解。我這裡選用的是Deno + Svelte + Lavalink的框架，你可以根據自己的喜好選擇。

```
Music-bot/
├── deno.json                  # 配置文件
├── .gitignore
├── bot-backend/
│   ├── deno.json
│   ├── deno.d.ts              # Deno 自己生成的宣告檔案
│   ├── main.ts                # 機器人代碼
│   ├── deploy-commands.ts     # 註冊斜槓指令用
│   ├── .env
│   └── .env.example
├── lavalink-engine/
│   ├── Lavalink.jar           # Lavalink 伺服器（要去GitHub上自己下載）
│   ├── application.yml        # Lavalink 配置文件，可以在Lavalink官網找到
│   └── plugins/               # Lavalink 自動下載的插件
│       └── youtube-plugin-1.17.0.jar
└── web-dashboard/             # SvelteKit 網頁
```

這個專案裡包含了三個伺服器：網頁後端，Lavalink伺服器和機器人。

運行邏輯大約是這樣的：

![0.97](blob\:https://blog.chinono.dev/2b162400-31c0-4fe4-bebd-9cc8ca080af7)

機器人代碼意外的非常簡單。你需要安裝的 package 只有`Shoukaku`和`discord.js`，就可以直接開寫了。Shoukaku 負責機器人和語音頻道、Lavalink之間的溝通。discord.js 負責機器人和discord之間的溝通。

一個最基本的機器人代碼（只有`/play` 和 `/stop`指令）：

```JavaScript
import {
  Client,
  GatewayIntentBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { Shoukaku, Connectors, LoadType } from "shoukaku";
import "@std/dotenv/load";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Shoukaku 初始化

const nodes = [
  {
    name: "main",
    url: `${Deno.env.get("LAVALINK_HOST")}:${Deno.env.get("LAVALINK_PORT")}`,
    auth: Deno.env.get("LAVALINK_PASSWORD")!,
  },
];

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
  reconnectTries: 10,
  reconnectInterval: 3000,
});

shoukaku.on("error", (_, error) => console.error("Shoukaku error:", error));
shoukaku.on("ready", (name) => console.log(`Lavalink node "${name}" connected`));
shoukaku.on("disconnect", (name, reason) =>
  console.warn(`Lavalink node "${name}" disconnected — ${reason ?? "unknown reason"}. Reconnecting...`)
);

// ====================

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case "play":
      await handlePlay(interaction);
      break;
    case "stop":
      await handleStop(interaction);
      break;
  }
});

async function handlePlay(interaction: ChatInputCommandInteraction) {
  const member = await interaction.guild?.members.fetch(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      content: "需要加入語音頻道才能播放音樂。",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const query = interaction.options.getString("query", true);
  const node = shoukaku.options.nodeResolver(shoukaku.nodes);

  if (!node) {
    await interaction.editReply("找不到Lavalink節點。");
    return;
  }

  const isUrl = query.startsWith("http://") || query.startsWith("https://");
  const result = await node.rest.resolve(isUrl ? query : `ytsearch:${query}`);

  if (!result || result.loadType === LoadType.EMPTY || result.loadType === LoadType.ERROR) {
    await interaction.editReply("找不到任何結果。");
    return;
  }

  const track = result.loadType === LoadType.SEARCH || result.loadType === LoadType.PLAYLIST
    ? result.data[0]
    : result.data;

  let player = shoukaku.players.get(interaction.guildId!);
  if (!player) {
    player = await shoukaku.joinVoiceChannel({
      guildId: interaction.guildId!,
      channelId: voiceChannel.id,
      shardId: 0,
    });
  }

  await player.playTrack({ track: { encoded: track.encoded } });

  await interaction.editReply(`Now playing: **${track.info.title}**`);
}

async function handleStop(interaction: ChatInputCommandInteraction) {
  const player = shoukaku.players.get(interaction.guildId!);

  if (!player) {
    await interaction.reply({
      content: "目前沒有播放音樂。",
      ephemeral: true,
    });
    return;
  }

  await shoukaku.leaveVoiceChannel(interaction.guildId!);
  await interaction.reply("停止播放並退出語音頻道。");
}

client.login(Deno.env.get("DISCORD_TOKEN"));
```

如你所見，複雜的處理音頻 / 連接語音頻道代碼都被外包給了 Shoukaku 和 Lavalink。整個機器人的代碼非常簡潔，只有一百多行。當然，這仍不包含更複雜的其他音樂控制指令。但是，有了這個基本框架，想要繼續擴展控制指令就很方便了。

而關於網頁控制頁面，目前我也還沒有開發完成前端，也不知道具體會長什麼樣。~~不如就把它留到下一篇文章再聊吧（挖坑~~

感謝您看到這裡！趁著假期我想多用部落格練練手，多寫點文章紀錄學習過程，順便練習一下如何把問題給講解清楚。如果您有任何問題，或者是文中有出錯的地方，都歡迎留言/聯繫我！
