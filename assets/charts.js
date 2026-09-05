(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // 初始化Mermaid
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#dbeafe',
        primaryTextColor: '#1e3a8a',
        primaryBorderColor: '#2563eb',
        lineColor: '#6b7a90',
        secondaryColor: '#cffafe',
        tertiaryColor: '#f1f5f9',
        fontSize: '13px'
      }
    });
  }

  // --- Chart: 学习时间分配（仅在含图表容器的页面初始化） ---
  var chartEl = document.getElementById('chart-time-allocation');
  if (chartEl && window.echarts) {
  var chartTime = echarts.init(chartEl, null, { renderer: 'svg' });
  chartTime.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      formatter: '{b}<br/>学习时间：{c}周 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: {
        color: ink,
        fontSize: 13
      },
      itemGap: 16
    },
    series: [
      {
        name: '学习时间分配',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: ink
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 2, name: 'SAP基础入门', itemStyle: { color: accent } },
          { value: 8, name: 'CO核心模块', itemStyle: { color: accent2 } },
          { value: 8, name: '产品成本控制', itemStyle: { color: '#059669' } },
          { value: 4, name: '物料分类账', itemStyle: { color: '#d97706' } },
          { value: 4, name: '月结年结实战', itemStyle: { color: '#7c3aed' } }
        ]
      }
    ]
  });

  window.addEventListener('resize', function() {
    chartTime.resize();
  });
  }
})();
