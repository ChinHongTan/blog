<template>
  <article class="conduct-page">
    <header class="page-header">
      <h1>行為準則</h1>
      <p class="page-subtitle">我們的社群行為準則與期望</p>
    </header>

    <div class="conduct-content">
      <section class="conduct-section">
        <h2>我們的承諾</h2>
        <p>
          為了營造一個開放且友善的環境，我們作為貢獻者和維護者承諾，無論年齡、體型、殘疾、族群、性別認同和表達、經驗水平、教育程度、社會經濟地位、國籍、個人外貌、種族、宗教或性取向如何，參與我們的社群都將是一種無騷擾的體驗。
        </p>
      </section>

      <section class="conduct-section">
        <h2>我們的標準</h2>
        <p>有助於創造正面環境的行為包括：</p>
        <ul>
          <li>使用友善和包容的語言</li>
          <li>尊重不同的觀點和經驗</li>
          <li>優雅地接受建設性批評</li>
          <li>關注對社群最有利的事情</li>
          <li>對其他社群成員表示同理心</li>
        </ul>

        <p>不可接受的行為包括：</p>
        <ul>
          <li>使用性化的語言或圖像，以及不受歡迎的性關注或挑逗</li>
          <li>惡意評論、侮辱性/貶損性評論，以及人身或政治攻擊</li>
          <li>公開或私下的騷擾</li>
          <li>未經明確許可，發布他人的私人信息，例如實體或電子地址</li>
          <li>在專業環境中可能被合理認為不適當的其他行為</li>
        </ul>
      </section>

      <section class="conduct-section">
        <h2>我們的責任</h2>
        <p>
          社群維護者有責任闡明可接受行為的標準，並應採取適當且公平的糾正措施來回應任何不可接受的行為。
        </p>
        <p>
          社群維護者有權利和責任刪除、編輯或拒絕與本行為準則不符的評論、提交、代碼、wiki 編輯、問題和其他貢獻，或暫時或永久禁止任何他們認為不適當、威脅、冒犯或有害的行為的貢獻者。
        </p>
      </section>

      <section class="conduct-section">
        <h2>適用範圍</h2>
        <p>
          本行為準則適用於所有社群空間，也適用於個人在公共空間代表社群時。代表我們社群的例子包括使用官方電子郵件地址、通過官方社交媒體帳戶發布，或在線上或線下活動中擔任指定代表。
        </p>
      </section>

      <section class="conduct-section">
        <h2>執行</h2>
        <p>
          如有辱罵、騷擾或其他不可接受的行為，可以透過聯繫社群團隊進行舉報。所有投訴都將被審查和調查，並將做出被認為必要和適當的回應。社群團隊有義務對事件報告者保密。具體執行政策的更多細節可能會另行公佈。
        </p>
        <p>
          不誠實地遵守或執行行為準則的社群維護者可能會面臨由其他社群領導成員決定的臨時或永久性後果。
        </p>
      </section>

      <section class="conduct-section">
        <h2>歸屬</h2>
        <p>
          本行為準則改編自 
          <a href="https://www.contributor-covenant.org" target="_blank" rel="noopener">Contributor Covenant</a>，
          版本 2.0，可在 
          <a href="https://www.contributor-covenant.org/version/2/0/code_of_conduct.html" target="_blank" rel="noopener">https://www.contributor-covenant.org/version/2/0/code_of_conduct.html</a> 
          獲取。
        </p>
      </section>
    </div>

    <footer class="page-footer">
      <NuxtLink to="/">
        <Icon name="heroicons:arrow-left" size="20" />
        返回首頁
      </NuxtLink>
    </footer>
  </article>
</template>

<style scoped>
.conduct-page {
  background: var(--color-bg-primary);
  border-radius: 12px;
  padding: 3rem;
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}

.page-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid var(--color-border-light);
}

.page-header h1 {
  font-size: 2.5rem;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  font-weight: 400;
}

.conduct-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.conduct-section h2 {
  font-size: 1.75rem;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border-light);
  position: relative;
}

.conduct-section h2::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: var(--color-primary);
}

.conduct-section p {
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin-bottom: 1rem;
}

.conduct-section ul {
  margin: 1rem 0 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.conduct-section li {
  color: var(--color-text-secondary);
  line-height: 1.7;
  padding-left: 0.5rem;
}

.conduct-section a {
  color: var(--color-primary-dark);
  text-decoration: underline;
  text-decoration-color: var(--color-primary-light);
  text-underline-offset: 3px;
  transition: all 0.2s ease;
}

.conduct-section a:hover {
  color: var(--color-primary);
  text-decoration-color: var(--color-primary);
}

.page-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border-light);
}

.page-footer a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary-dark);
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.page-footer a:hover {
  color: var(--color-primary);
  gap: 0.75rem;
}

/* Responsive */
@media (max-width: 768px) {
  .conduct-page {
    padding: 2rem 1.5rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .conduct-section h2 {
    font-size: 1.5rem;
  }

  .conduct-section ul {
    margin-left: 1.5rem;
  }
}
</style>
