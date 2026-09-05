// === 侧边栏导航交互 ===
(function() {
  const links = document.querySelectorAll('.docs-sidebar a.sb-item');
  const sections = document.querySelectorAll('main section[id]');
  const progressBar = document.getElementById('progressBar');
  const backToTop = document.getElementById('backToTop');

  // === 右侧目录（TOC）：扫描正文 h2/h3 生成 ===
  const tocList = document.getElementById('tocList');
  const tocHeaders = [];
  if (tocList) {
    const main = document.querySelector('.docs-main');
    const hs = main ? main.querySelectorAll('section h2, section h3') : [];
    let html = '';
    hs.forEach(function(h, i) {
      const txt = h.textContent.replace(/\s+/g, ' ').replace(/^[一二三四五六七八九十]+、\s*/, '').trim();
      if (!txt) return;
      if (!h.id) h.id = 'toc-' + i;
      h.style.scrollMarginTop = 'calc(3.5rem + 14px)';
      tocHeaders.push(h);
      html += '<a class="toc-item ' + (h.tagName === 'H2' ? 'lv2' : 'lv3') + '" href="#' + h.id + '">' + txt + '</a>';
    });
    tocList.innerHTML = html;
  }

  // 滚动监听：高亮当前章节 + 进度条 + 返回顶部
  function onScroll() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';

    // 返回顶部按钮
    if (scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }

    // 高亮当前章节（左侧专栏树）
    let current = '';
    sections.forEach(function(sec) {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom >= 120) {
        current = sec.id;
      }
    });
    links.forEach(function(link) {
      link.classList.toggle('on', link.hash === '#' + current);
    });

    // 高亮当前标题（右侧目录）
    if (tocList) {
      let activeId = '';
      for (var ti = 0; ti < tocHeaders.length; ti++) {
        if (tocHeaders[ti].getBoundingClientRect().top <= 100) activeId = tocHeaders[ti].id;
      }
      const tocItems = tocList.querySelectorAll('.toc-item');
      tocItems.forEach(function(item) {
        item.classList.toggle('on', item.getAttribute('href') === '#' + activeId);
      });
    }
  }

  // 节流
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  // 初始高亮
  onScroll();

  // 移动端侧边栏抽屉统一控制：开关 class + 锁定背景滚动（触屏抽屉体验）
  window.setSidebar = function(open) {
    var sb = document.querySelector('.docs-sidebar');
    var ov = document.querySelector('.sidebar-overlay');
    if (!sb || !ov) return;
    sb.classList.toggle('open', open);
    ov.classList.toggle('show', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  window.toggleSidebar = function() {
    var sb = document.querySelector('.docs-sidebar');
    window.setSidebar(!sb || !sb.classList.contains('open'));
  };
  var navToggle = document.querySelector('.topnav-toggle');
  if (navToggle) navToggle.addEventListener('click', window.toggleSidebar);

  // 点击导航链接后关闭移动端侧边栏
  links.forEach(function(link) {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 1024) {
        window.setSidebar(false);
      }
    });
  });

  // 视口从移动端放大到桌面端时，解除可能残留的滚动锁定
  window.addEventListener('resize', function() {
    if (window.innerWidth > 1024 && document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
  });
})();

// === 全文搜索（事务码 + 关键词） ===
(function() {
  var searchInput = document.getElementById('globalSearch');
  var resultsBox = document.getElementById('searchResults');
  if (!searchInput || !resultsBox) return;

  // SAP 事务码模式：2-4个大写字母 + 1-4位数字，末尾可带字母
  var TCODE_RE = /^[A-Z]{2,4}\d{1,4}[A-Z]?$/;

  // 当前页文件名 + 全站导航索引（其他页面的标题/折叠项/事务码/表头）
  var currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  // 全站索引按需加载：首次搜索时才注入 search-index.js，不阻塞首屏渲染
  var siteIndex = [];
  var siteIndexLoading = false;
  var siteIndexLoaded = false;
  function refreshSiteIndex() {
    if (window.SITE_SEARCH_INDEX && !siteIndexLoaded) {
      siteIndex = window.SITE_SEARCH_INDEX.filter(function(e) {
        return e.p.toLowerCase() !== currentPage;
      });
      siteIndexLoaded = true;
    }
  }
  function ensureSiteIndex() {
    refreshSiteIndex();
    if (siteIndexLoaded || siteIndexLoading) return;
    siteIndexLoading = true;
    var s = document.createElement('script');
    s.src = 'assets/search-index.js?v=20260905a';
    s.onload = refreshSiteIndex;
    document.head.appendChild(s);
  }
  var PAGE_LABELS = {
    'index.html': '入门总览',
    'co-basics.html': 'CO基础',
    'monthly-ops.html': '日常与月结',
    'special-yearend.html': '特殊与年结',
    'integration.html': '排错与集成',
    'cases-resources.html': '案例与资源'
  };

  var searchIndex = [];
  var indexBuilt = false;

  function buildIndex() {
    searchIndex = [];
    var sections = document.querySelectorAll('main section[id]');
    var selectors = [
      { sel: 'h2, h3, h4', type: '标题' },
      { sel: '.accordion-header', type: '折叠项' },
      { sel: 'th, td', type: '表格' },
      { sel: '.sap-field-row, .sap-mockup-note', type: '界面' },
      { sel: 'p, li', type: '正文' }
    ];
    for (var s = 0; s < sections.length; s++) {
      var section = sections[s];
      var secId = section.id;
      var h2 = section.querySelector(':scope > h2');
      var secTitle = h2 ? h2.textContent.replace(/\s+/g, ' ').trim() : secId;
      for (var i = 0; i < selectors.length; i++) {
        var sel = selectors[i];
        var els = section.querySelectorAll(sel.sel);
        for (var j = 0; j < els.length; j++) {
          var el = els[j];
          var text = el.textContent.replace(/\s+/g, ' ').trim();
          if (!text || text.length < 2) continue;
          searchIndex.push({ text: text, el: el, sectionId: secId, sectionTitle: secTitle, type: sel.type });
        }
      }
    }
    indexBuilt = true;
  }

  function makeSnippet(text, keyword) {
    var kw = keyword.toLowerCase();
    var idx = text.toLowerCase().indexOf(kw);
    if (idx < 0) return text;
    var start = Math.max(0, idx - 40);
    var end = Math.min(text.length, idx + keyword.length + 40);
    var snippet = text.substring(start, end);
    if (start > 0) snippet = '…' + snippet;
    if (end < text.length) snippet = snippet + '…';
    var sIdx = snippet.toLowerCase().indexOf(kw);
    return snippet.substring(0, sIdx) +
      '<mark>' + snippet.substring(sIdx, sIdx + keyword.length) + '</mark>' +
      snippet.substring(sIdx + keyword.length);
  }

  function jumpTo(item) {
    // 跨页结果：跳转到目标页，hash 携带锚点与目标文本，由目标页深链逻辑展开定位
    if (item.page) {
      resultsBox.classList.remove('show');
      if (window.innerWidth <= 1024) window.setSidebar && window.setSidebar(false);
      window.location.href = item.page + '#' + item.anchor + '~' + encodeURIComponent(item.text);
      return;
    }
    var el = item.el;
    if (!el) return;
    // 向上展开所有折叠面板和折叠章节
    var node = el;
    while (node && node !== document.body) {
      if (node.classList) {
        if (node.classList.contains('accordion-item')) node.classList.add('open');
        if (node.tagName === 'SECTION' && node.classList.contains('section-collapsed')) {
          node.classList.remove('section-collapsed');
        }
      }
      node = node.parentElement;
    }
    if (typeof saveCollapseState === 'function') saveCollapseState();

    setTimeout(function() {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('search-flash');
      setTimeout(function() { el.classList.remove('search-flash'); }, 2000);
    }, 60);

    resultsBox.classList.remove('show');
    if (window.innerWidth <= 1024) {
      window.setSidebar && window.setSidebar(false);
    }
  }

  var debounceTimer;
  function doSearch(keyword) {
    var kw = keyword.trim();
    if (!kw) {
      resultsBox.classList.remove('show');
      resultsBox.innerHTML = '';
      return;
    }
    if (!indexBuilt) buildIndex();
    ensureSiteIndex();

    var kwLower = kw.toLowerCase();
    var isTcode = TCODE_RE.test(kw.toUpperCase());

    var results = [];
    var seen = new Set();
    for (var i = 0; i < searchIndex.length; i++) {
      var item = searchIndex[i];
      var textLower = item.text.toLowerCase();
      var idx = textLower.indexOf(kwLower);
      if (idx < 0) continue;
      if (seen.has(item.el)) continue;
      seen.add(item.el);

      var score = 0;
      // 事务码精确命中最高优先级
      if (isTcode) {
        var tcodes = item.text.match(/[A-Z]{2,4}\d{1,4}[A-Z]?/g) || [];
        var kwUp = kw.toUpperCase();
        for (var t = 0; t < tcodes.length; t++) {
          if (tcodes[t] === kwUp) { score += 2000; break; }
          if (tcodes[t].indexOf(kwUp) === 0) score += 1500;
        }
      }
      // 类型权重
      if (item.type === '标题') score += 100;
      else if (item.type === '折叠项') score += 80;
      else if (item.type === '界面') score += 50;
      else if (item.type === '表格') score += 40;
      else score += 10;
      // 开头匹配加分
      if (idx === 0) score += 30;
      // 短文本更精确
      if (item.text.length < 80) score += 20;

      results.push({ item: item, score: score });
    }

    // 全站索引：其他页面的标题/折叠项/事务码/表头匹配
    for (var si = 0; si < siteIndex.length; si++) {
      var sitem = siteIndex[si];
      var sText = sitem.t.toLowerCase();
      var sIdx = sText.indexOf(kwLower);
      if (sIdx < 0) continue;

      var sscore = 0;
      // 事务码精确命中最高优先级（跨页同样适用）
      if (isTcode) {
        var sTcodes = sitem.t.match(/[A-Z]{2,4}\d{1,4}[A-Z]?/g) || [];
        var kwUpSite = kw.toUpperCase();
        for (var st = 0; st < sTcodes.length; st++) {
          if (sTcodes[st] === kwUpSite) { sscore += 2000; break; }
          if (sTcodes[st].indexOf(kwUpSite) === 0) sscore += 1500;
        }
      }
      if (sitem.y === '标题') sscore += 100;
      else if (sitem.y === '折叠项') sscore += 80;
      else if (sitem.y === '事务码') sscore += 90;
      else if (sitem.y === '表格') sscore += 40;
      else sscore += 10;
      if (sIdx === 0) sscore += 30;
      if (sitem.t.length < 80) sscore += 20;

      results.push({
        item: { page: sitem.p, anchor: sitem.a, sectionTitle: sitem.s, text: sitem.t, type: sitem.y },
        score: sscore
      });
    }

    results.sort(function(a, b) { return b.score - a.score; });

    var top = results.slice(0, 30);
    if (top.length === 0) {
      resultsBox.innerHTML = '<div class="sr-empty">未找到匹配内容</div>';
    } else {
      var html = '<div class="sr-count">找到 ' + results.length + ' 条结果，显示前 ' + top.length + ' 条</div>';
      for (var r = 0; r < top.length; r++) {
        var snippet = makeSnippet(top[r].item.text, kw);
        var pageBadge = top[r].item.page
          ? '<span class="sr-page">' + (PAGE_LABELS[top[r].item.page] || top[r].item.page) + ' ↗</span>'
          : '';
        html += '<div class="search-result-item" data-i="' + r + '">' +
          '<div class="sr-section"><span>' + top[r].item.sectionTitle + '</span>' +
          '<span class="sr-type">' + top[r].item.type + '</span>' + pageBadge + '</div>' +
          '<div class="sr-text">' + snippet + '</div></div>';
      }
      resultsBox.innerHTML = html;
      var items = resultsBox.querySelectorAll('.search-result-item');
      for (var k = 0; k < items.length; k++) {
        (function(idx) {
          items[idx].addEventListener('click', function() { jumpTo(top[idx].item); });
        })(k);
      }
    }
    resultsBox.classList.add('show');
  }

  searchInput.addEventListener('input', function() {
    var val = this.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() { doSearch(val); }, 150);
  });

  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var first = resultsBox.querySelector('.search-result-item');
      if (first) first.click();
    } else if (e.key === 'Escape') {
      resultsBox.classList.remove('show');
      this.blur();
    }
  });

  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
      resultsBox.classList.remove('show');
    }
  });

  if (document.readyState === 'complete') buildIndex();
  else window.addEventListener('load', buildIndex);
})();

// === 章节折叠 ===
document.querySelectorAll('main section > h2').forEach(function(h2) {
  const section = h2.closest('section');
  if (!section) return;

  // 在h2前插入折叠控制按钮
  const ctrl = document.createElement('div');
  ctrl.className = 'section-collapse-control';
  ctrl.innerHTML = '<span class="collapse-icon">▼</span>';
  ctrl.style.cssText = 'position:absolute;margin-left:-24px;margin-top:6px;cursor:pointer';
  ctrl.onclick = function(e) {
    e.stopPropagation();
    section.classList.toggle('section-collapsed');
    saveCollapseState();
  };

  h2.parentNode.insertBefore(ctrl, h2);
  h2.style.cursor = 'pointer';
  h2.addEventListener('click', function() {
    section.classList.toggle('section-collapsed');
    saveCollapseState();
  });
});

// 保存折叠状态
function saveCollapseState() {
  const states = {};
  document.querySelectorAll('main section').forEach(function(sec) {
    if (sec.id) {
      states[sec.id] = sec.classList.contains('section-collapsed');
    }
  });
  try {
    localStorage.setItem('sap-collapse-state', JSON.stringify(states));
  } catch(e) {}
}

// 恢复折叠状态
try {
  const saved = JSON.parse(localStorage.getItem('sap-collapse-state') || '{}');
  Object.keys(saved).forEach(function(id) {
    if (saved[id]) {
      const sec = document.getElementById(id);
      if (sec) sec.classList.add('section-collapsed');
    }
  });
} catch(e) {}

// === 跨页深链定位：#锚点~目标文本 ===
// 从其他页面搜索结果跳转过来时，自动展开折叠章节/面板，滚动并高亮目标
(function() {
  function expandAround(el) {
    var node = el;
    while (node && node !== document.body) {
      if (node.classList) {
        if (node.classList.contains('accordion-item')) node.classList.add('open');
        if (node.tagName === 'SECTION' && node.classList.contains('section-collapsed')) {
          node.classList.remove('section-collapsed');
        }
      }
      node = node.parentElement;
    }
  }

  function handleDeepLink() {
    var hash = location.hash;
    if (!hash || hash.length < 2) return;
    var raw = hash.slice(1);
    var tilde = raw.indexOf('~');
    var anchor = tilde >= 0 ? raw.slice(0, tilde) : raw;
    var findText = tilde >= 0 ? decodeURIComponent(raw.slice(tilde + 1)) : '';

    var sec = document.getElementById(anchor);
    if (sec) sec.classList.remove('section-collapsed');

    var target = null;
    if (findText) {
      // 在目标章节内按文本查找最匹配元素（折叠面板优先于大容器）
      var scope = sec || document;
      var cands = scope.querySelectorAll('.accordion-header, h2, h3, h4, .tcode, th, td, p, li');
      for (var i = 0; i < cands.length; i++) {
        var txt = cands[i].textContent.replace(/\s+/g, ' ').trim();
        if (txt && txt.indexOf(findText) >= 0) { target = cands[i]; break; }
      }
    } else if (sec) {
      target = sec;
    }
    if (!target) return;

    expandAround(target);
    if (typeof saveCollapseState === 'function') saveCollapseState();
    setTimeout(function() {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('search-flash');
      setTimeout(function() { target.classList.remove('search-flash'); }, 2000);
    }, 200);
  }

  window.addEventListener('hashchange', handleDeepLink);
  if (document.readyState === 'loading') {
    window.addEventListener('load', handleDeepLink);
  } else {
    handleDeepLink();
  }
})();
