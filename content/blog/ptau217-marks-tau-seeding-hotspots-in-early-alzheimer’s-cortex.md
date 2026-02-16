---
title: pTau217 Marks Tau Seeding Hotspots in Early Alzheimer’s Cortex
description: 論文整理小筆記 (可能適合?對於生物醫學有興趣的人閱讀)
date: 2025-11-02T14:45:00.000+08:00
author: automata
tags:
  - Research notes
featured_image: /images/uploads/螢幕擷取畫面-2025-11-02-145011.png
---
## Introduction

阿茲海默症（Alzheimer’s disease, AD）是一種神經退行性疾病，其典型特徵包含 β-類澱粉蛋白（amyloid-β, Aβ）沉積與 tau 病理的累積。tau 病理不僅表現為神經元內神經纖維纏結（neurofibrillary tangles, NFTs），也出現為可驅動聚集的種子型 tau（seeding-competent tau），而這種 seeding activity 被認為與病理向不同腦區擴散相關。

**臨床與病理研究長期觀察到一個現象：AD 並非所有腦區同時、等量地受影響。**\
相反地，一些區域（例如 entorhinal cortex, ENT 和 inferior temporal gyrus, ITG）在疾病早期就累積 tau 病理並表現強烈的退化跡象，而其他區域（例如cerebellum, CER）相對保留較長的時間。這種「區域差異」（regional variation）可能反映了兩件事：1. 某些腦區較早、較強地承受 tau 病理壓力。2. 某些 tau 分子型態（例如特定位點的p-tau）或 seeding activity，在不同腦區中本身就不一樣。

本研究的核心目標，是同時比較多個腦區的 tau 特性，包括：

* tau 播種活性（seeding activity）
* 特定位點磷酸化 tau（例如 pTau217, pTau262, pTau396 等）
* tau 蛋白的整體含量

並將這些分子層級指標，對照這些腦區在阿茲海默症病程中所扮演的角色。

> 換句話說，問題不是單純「AD 腦有沒有 tau」，而是「哪一塊腦最早出現具播種能力的 tau？那一塊腦的 tau 長什麼生化樣態？這種 tau 樣態是否對應到可臨床量測的生物標記（例如 pTau217）？」

## Background and Rationale

> 這邊在論文架構上是不存在的，但我覺得需要補充一下資訊，以防有人看不懂 w

### 1. Tau and phosphorylated tau

Tau 是一種 microtubule-associated protein，在成熟神經元特別是 axon 中，協助穩定 microtubules ，維持細胞骨架與軸突內物質運輸的完整性（Hardy and Selkoe 2002）。在阿茲海默症中，tau 分子會發生過度磷酸化（hyperphosphorylation），使 tau 從微管上解離，並逐步聚集成高度有序的 β-摺疊纖維，最終形成 NFTs，而 NFTs 是阿茲海默症病理診斷的經典標誌之一（Hardy and Selkoe 2002）

所謂磷酸化 tau（phosphorylated tau, p-tau）指的是 tau 在特定胺基酸殘基（通常是 Ser 或 Thr）上被磷酸化後的特定構型。不同位點的磷酸化定義出不同的 p-tau ，如 pTau217（Thr217 磷酸化）、pTau181（Thr181）、pTau262（Ser262 附近）、pTau396（Ser396/Ser404 區域）等。這些位點並非可互相取代：以 pTau217 為例，它在臨床研究中被證明在 AD 患者腦部和血漿中都顯著上升，並能將 AD 與其他失智症形式區隔，甚至在臨床症狀尚不嚴重的階段亦有區辨力（Palmqvist et al. 2020）

<figure>
  <img src="/images/uploads/螢幕擷取畫面-2025-11-02-163341.png" alt="Intracellular neuronal aggregates in tauopathies">
  <figcaption>Figure1. Tau phosphorylation, detachment from microtubules, and aggregation into neurofibrillary pathology. (a) In healthy neurons, tau binds to and stabilizes axonal microtubules, which are cylindrical polymers of α- and β-tubulin. Tau contains microtubule-binding repeats and additional domains (proline-rich region, projection domain) that help maintain microtubule structure. (b) Hyperphosphorylation of tau at multiple serine/threonine sites by kinases such as GSK3β, CDK5, and ERK2 reduces tau’s affinity for microtubules, destabilizing the microtubule network. (c) Abnormally phosphorylated tau dissociates from microtubules and forms paired helical filaments (PHFs), which are heavily phosphorylated and often ubiquitinated. (d) Further processing and aggregation of tau yields oligomers and neurofibrillary tangles (NFTs), changes that are associated with neuronal dysfunction and ultimately cell death. Source: Mazanetz MP & Fischer PM, 2007, \\\\\\\\\*Nature Reviews Drug Discovery\\\\\\\\\* 6:464–479.</figcaption>
</figure>

### 2. Tau seeding activity

Tau seeding activity 為描述一種「模板驅動聚集」的行為：已經錯誤折疊、並形成聚集核心的 tau（seed），能夠促使原本可溶性的 tau 轉換為相同β-摺疊聚集構型，並往外延伸成纖維狀聚集體。這代表 tau 病理不只是「自己累積變多」，而是具有可擴散的構形訊號（Kraus et al. 2019; Orrù et al. 2017）

在實驗上，這項播種活性可用 real-time quaking-induced conversion (RT-QuIC) 測量。RT-QuIC 將可能含有播種活性的腦組織均質液（brain homogenate）與重組 tau 底物共同孵育，並在週期性震盪條件下促進聚集。如果樣本中真的含有播種活性，則聚集會加速發生，並可用螢光染劑 Thioflavin T (ThT) 的訊號上升速率、終點強度、lag time（起始延遲時間）等指標來量化。此法也可計算 SD50（引發 50% 反應孔出現陽性訊號所需的稀釋度），作為播種活性強度的功能性指標（Kraus et al. 2019; Orrù et al. 2017）

<figure>
  <img src="/images/uploads/螢幕擷取畫面-2025-11-02-164733.png" alt="The most promising techniques for the quantitation of tau seeding activity in human biofluid">
  <figcaption>Figure 2. Quantifying tau seeding activity using biosensor cells and RT-QuIC. (A) In a cell-based biosensor assay, a sample containing tau seeds is applied to a reporter cell line overexpressing tau repeat domains fused to fluorescent proteins (e.g., CFP/YFP). Seed-competent tau from the sample is taken up by the cells and induces intracellular tau aggregation. Aggregation brings the tagged tau molecules into close proximity, producing a FRET signal that can be quantified by flow cytometry as integrated FRET density (combining %FRET-positive cells and median FRET intensity). (B) In RT-QuIC, a seed-containing sample is incubated with excess recombinant tau substrate and thioflavin T (ThT) under shaking/incubation cycles. Seed-competent tau drives templated aggregation of the substrate, generating a characteristic ThT fluorescence trace: an initial lag phase followed by a rapid aggregation phase and plateau. The ThT kinetics provide a quantitative readout of tau seeding activity in biofluids such as CSF. Source: Lathuiliere A. & Hyman B.T., 2021, Frontiers in Neuroscience 15:654176.</figcaption>
</figure>

### 3. Braak staging / Thal staging

阿茲海默症病理的「空間 - 時間順序」可以用兩個常用分期系統來描述 : 

> 這邊我們著重於 Braak staging，因為它在描述 tau上與本研究比較有關連 ; \
> 有興趣可以去查另一個 Thal staging，描述 β-amyloid 沉積的範圍與分布廣度

Braak staging：描述 tau 病理（特別是 NFTs）如何在大腦中依序出現與擴散。\
典型順序是：最早在 entorhinal cortex 與內側顳葉（包括海馬相關迴路）觀察到高度 tau 病理；接著外側顳葉皮質，包括 inferior temporal gyrus (ITG)、middle temporal gyrus (MTG)、superior temporal gyrus (STG)；最後擴散到更廣泛的新皮質聯合區域。cerebellum (CER, 小腦) 在典型 AD 病程中通常相對少見明顯 tau 纖維性病變（Braak and Braak 1991; Braak and Braak 1995; Braak et al. 2006）。

<figure>
  <img src="/images/uploads/tau-tracer-uptake-patterns-resemble-ex-vivo-braak-stages-a-schematic-display-of-braak.png" alt="Figure 3. Braak stages of tau pathology in Alzheimer’s disease and their in vivo PET correlates.">
  <figcaption>Figure 3. Braak stages of tau pathology in Alzheimer’s disease and their in vivo PET correlates. (A) Schematic post mortem staging of Alzheimer’s disease tau pathology (neurofibrillary tangles composed of hyperphosphorylated tau). Earliest involvement (Braak stages I/II) is localized to the transentorhinal / entorhinal cortex and adjacent medial temporal structures. Intermediate stages (III/IV) involve limbic regions, including medial temporal lobe and parts of medial parietal cortex. Late stages (V/VI) show widespread neocortical involvement. (B) Tau PET tracer uptake patterns in vivo (e.g., \\\\\\\[¹⁸F]Flortaucipir) recapitulate this hierarchical progression: signal first appears in entorhinal / medial temporal cortex, then spreads to inferior and lateral temporal cortex and medial parietal regions, and finally becomes widespread across association neocortex. These PET patterns provide living-brain support for Braak’s ex vivo staging of tau pathology. Source: Adapted from “Biomarkers for tau pathology,” Schöll M. et al., 2018, Molecular and Cellular Neuroscience.</figcaption>
</figure>

本研究特別挑選多個腦區（ENT、ITG、MTG、STG、CER 等）來比較播種活性與 tau 分子狀態，這些腦區並不是隨機抽樣，而是涵蓋：

* 典型 AD 病程中「早期高風險、最先累積 tau 病理」的區域（ENT、ITG）
* 進一步受累的外側顳葉皮質（MTG、STG）
* 以及對照用的、在典型 Braak 分期中較少 tau 聚集的小腦（CER）

> 透過橫跨這些腦區，本研究在測試「Braak staging 的時序 ≈ seeding activity 的梯度」

### 4. RT-QuIC

Real-time quaking-induced conversion (RT-QuIC) 是一個高靈敏度的體外偵測方法。\
最初用於朊毒蛋白（prion）類疾病，後來擴展至 α-synuclein、tau 等可產生 seeding activity 的錯誤折疊蛋白（Orrù et al. 2017）。本研究利用 RT-QuIC 來問：不同腦區的 AD 樣本，其播種活性是否同樣強？是否和 Braak staging 順序吻合？是否與特定 p-tau 物種（例如 pTau217）對應？

RT-QuIC 的量測重點指標包含：

* **lag time**：螢光訊號（ThT）開始上升前的延遲時間，越短代表播種引發聚集的速度越快
* **end-point ThT fluorescence**：反應終點的螢光強度，代表最終聚集程度
* **SD50**：引發 50% 反應孔出現陽性的劑量

重點是，RT-QuIC 測到的是「功能性 seeding activity」，而不是單純的「total tau 」。\
也就是說，就算兩個腦區的 tau 含量類似，它們的 seeding activity 仍可能不同。

> 如果對於 RT-QuIC 有興趣可自行上網搜尋相關步驟，這邊偷懶省略方法學

### 5. Clinical biomarker relevance of pTau217

臨床上，pTau217 已被提出為具高潛力的 AD marker，包含腦脊髓液與血漿檢測。研究顯示，血漿 pTau217 在區分典型 AD 與其他失智症型態時具高敏感度與高特異度，甚至在臨床症狀尚未完全明顯之前已可異常（Palmqvist et al. 2020；Jack et al. 2024）。

本研究將這個臨床層訊號往回對照腦內：pTau217 是否在 AD 早期最脆弱、最早受累積的皮質區域（例如 ITG、ENT）顯著集中？這些同時又是否是 seeding activity 最強的腦區？如果答案是肯定的，那麼 pTau217可能反映了特定腦區內、 tau 本身的狀態。

## Methods

對於方法學有興趣的可以去讀一下原論文，它放在 Discussion下面。\
這邊我將 Methods 提前說明，配合 Results 的實驗結果。

**超簡單版方法學 :**  

1. 使用已確診阿茲海默症病例的死後人類腦組織，切片+免疫染色後掃描
2. 將各腦區的腦漿稀釋後，加入含有 tau 的多孔板，在震盪/孵育條件下進行 RT-QuIC
3. 跑 Western blotting，採用密度分析法測定 tau protein 強度，進行定量分析
4. 將 AD 患者和非 AD 對照組的腦漿拿去跑液相層析質譜 (LC-MS) 分析

> ps. 這篇的大腦來源是北京和湖南長沙，看起來是南昌大學醫學院主導的
