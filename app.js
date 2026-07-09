/* MBTI 应用 v2 — 学习 / 自测 / 交叉验证 / 分析他人 */
(function () {
  'use strict';
  const M = window.MBTI;
  if (!M) { console.error('MBTI data not loaded'); return; }
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const dimName = { EI: '能量态度 E / I', SN: '信息接收 S / N', TF: '决策方式 T / F', JP: '生活节奏 J / P' };
  const flips = { E: 'I', I: 'E', S: 'N', N: 'S', T: 'F', F: 'T', J: 'P', P: 'J' };

  const obsv = (t) => t.replace(/我的/g, 'TA的').replace(/我/g, 'TA');

  const state = {
    learnSec: 'origin',
    quiz: { i: 0, answers: {}, score: 0 },
    routeA: null,     // { key, i, ans, onDone, container }
    crossB: null,     // { i, ans }
    otherGuide: {},
    lastSelf: null
  };

  /* ---------- 视图切换 ---------- */
  function showView(name) {
    $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
    $$('nav.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    if (window.scrollTo) window.scrollTo(0, 0);
  }

  /* ---------- 学习中心 ---------- */
  function setLearn(sec) {
    state.learnSec = sec;
    $$('.learn-nav button').forEach((b) => b.classList.toggle('active', b.dataset.sec === sec));
    const root = $('#learn-root');
    if (sec === 'origin') return renderOrigin(root);
    if (sec === 'dims') return renderDims(root);
    if (sec === 'funcs') return renderFuncs(root);
    if (sec === 'dynamics') return renderDynamics(root);
    if (sec === 'types') return renderTypeGrid(root);
    if (sec === 'logic') return renderLogic(root);
    if (sec === 'quiz') return renderQuiz();
  }

  function renderOrigin(root) {
    const o = M.origins;
    root.innerHTML = `<h2>${o.title}</h2>` + o.blocks.map((b) =>
      `<div class="card"><h3>${b.h}</h3><p>${b.p}</p></div>`).join('');
  }

  function renderDims(root) {
    let h = '<h2>四个维度（深度）</h2>';
    ['EI', 'SN', 'TF', 'JP'].forEach((k) => {
      const d = M.dimensions[k];
      h += `<div class="card"><h3>${d.name}</h3>`;
      ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'].forEach((pole) => {
        if (!d.poles[pole]) return;
        const p = d.poles[pole];
        h += `<div class="pole"><div class="pole-name">${p.name}</div>`;
        h += `<div class="pole-line"><b>官方框架：</b>${p.desc}</div>`;
        h += `<div class="pole-line"><b>荣格原意：</b>${p.jung}</div>`;
        h += `<div class="myths">` + p.myths.map((m) =>
          `<div class="myth"><b>误区：${m.m}</b><br>正解：${m.t}</div>`).join('') + `</div>`;
        h += `</div>`;
      });
      h += `<div class="crossref"><b>交叉引用：</b>${d.crossRef.join('；')}</div>`;
      h += `<div class="note">${d.note}</div></div>`;
    });
    root.innerHTML = h;
  }

  function renderFuncs(root) {
    let h = '<h2>八个认知功能（深度）</h2><p class="note">功能分「感知（接收信息）」与「判断（做决定）」两类，各有外倾/内倾两种态度。类型动力学认为每个类型由「主导–辅助–第三–劣势」四个功能组成。</p>';
    ['Si', 'Se', 'Ni', 'Ne', 'Ti', 'Te', 'Fi', 'Fe'].forEach((k) => {
      const f = M.functions[k];
      h += `<div class="card"><h3>${f.name} <span class="tag">${f.axis} · ${f.attitude === 'E' ? '外倾' : '内倾'}</span></h3>`;
      h += `<div class="pole-line"><b>是什么：</b>${f.desc}</div>`;
      h += `<div class="pole-line"><b>荣格原意：</b>${f.jung}</div>`;
      h += `<div class="myths"><div class="myth"><b>误区：${f.myths[0].m}</b><br>正解：${f.myths[0].t}</div></div>`;
      h += `<div class="crossref"><b>成对关系：</b>${f.pair}</div>`;
      h += `<div class="crossref"><b>常见于：</b>${f.crossRef.join('；')}</div></div>`;
    });
    root.innerHTML = h;
  }

  function renderTypeGrid(root) {
    let h = '<h2>16 型图谱</h2><p class="note">点任一类型查看功能栈、深度分析（优势 / 成长盲区 / 沟通 / 关系 / 工作 / 压力 / 发展建议）、常见误解与配套案例。</p><div class="type-grid">';
    M.typeOrder.forEach((code) => {
      const t = M.types[code];
      h += `<button class="type-card" data-action="type" data-code="${code}">
        <span class="tc-code">${code}</span>
        <span class="tc-nick">${t.nickZh}</span>
        <span class="tc-stack">${t.stack.join(' · ')}</span>
      </button>`;
    });
    h += '</div>';
    root.innerHTML = h;
  }

  function renderLogic(root) {
    const m = M.methodology;
    root.innerHTML = `<h2>${m.title}</h2>` + m.blocks.map((b) =>
      `<div class="card"><h3>${b.h}</h3><p>${b.p}</p></div>`).join('');
  }

  function renderDynamics(root) {
    const d = M.typeDynamics;
    let h = `<h2>${d.title}</h2><p class="note">${d.intro}</p>`;

    // 1) 功能速览
    const p = d.primer;
    h += `<div class="card"><h3>${p.title}</h3>`;
    h += `<div class="prim-grid">`;
    [p.perceiving, p.judging].forEach((grp) => {
      h += `<div class="prim-col"><div class="prim-h">${grp.title}</div>`;
      h += grp.items.map((it) => `<div class="prim"><b>${it.f}</b> ${it.t}：${it.d}</div>`).join('');
      h += `</div>`;
    });
    h += `</div><p class="prim-note">${p.note}</p></div>`;

    // 2) 字母映射
    const lm = d.letterMap;
    h += `<div class="card"><h3>${lm.title}</h3>`;
    h += lm.items.map((it) => `<div class="lm-row"><span class="lm-letter">${it.letter}</span><span class="lm-mean">${it.meaning}</span></div>`).join('');
    h += `<div class="keybox">${lm.key}</div></div>`;

    // 3) 四个功能位
    h += `<div class="card"><h3>四个功能位（角色）</h3><div class="roles">` +
      d.roles.map((r, i) => `<div class="role role${i}"><div class="role-h">${r.label} <span class="role-fn">${r.fn}</span></div><div class="role-d">${r.desc}</div><div class="role-daily">日常：${r.daily}</div></div>`).join('') +
      `</div></div>`;

    // 4) 对跖点规则
    const fr = d.flipRule;
    h += `<div class="card"><h3>${fr.title}</h3><p>${fr.body}</p>` +
      `<p><b>劣势 = 主导的对跖点</b>：${fr.dominant}</p>` +
      `<p><b>第三 = 辅助的对跖点</b>：${fr.aux}</p>` +
      `<ul class="left">${fr.examples.map((x) => `<li>${x}</li>`).join('')}</ul></div>`;

    // 5) 功能地图（可视化网格）
    const fg = d.flipGrid;
    h += `<div class="card"><h3>${fg.title}</h3><table class="fgrid"><thead><tr><th></th>${fg.cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
    fg.rows.forEach((row) => {
      h += `<tr><th>${row.axis}</th>${row.cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    });
    h += `</tbody></table><p class="prim-note">${fg.note}</p></div>`;

    // 6) 推导规则
    h += `<div class="card"><h3>推导规则（速查）</h3><ul class="left">` + d.rules.map((r) => `<li><b>${r.h}</b>：${r.t}</li>`).join('') + `</ul></div>`;

    // 7) 符号说明
    h += `<div class="card"><h3>符号说明</h3><p>${d.symbolNote}</p></div>`;

    // 8) 怎么推
    h += `<div class="card"><h3>怎么从 4 个字母推出功能栈</h3><ol class="left">` + d.howTo.map((s) => `<li>${s}</li>`).join('') + `</ol></div>`;

    // 9) 动手算例子
    h += `<div class="card"><h3>动手算四个例子（覆盖 E/I × J/P 四种组合）</h3>` +
      d.examples.map((e) =>
        `<div class="ex"><div class="ex-head"><span class="ex-code">${e.code}</span><span class="ex-letters">${e.letters}</span></div>` +
        `<div class="ex-walk"><ol class="left">${e.walk.map((w) => `<li>${w}</li>`).join('')}</ol></div>` +
        stackHTML(e.stack) +
        `<div class="ex-map">字母去向：${e.map}</div></div>`).join('') + `</div>`;

    // 10) 日常表现
    const ev = d.everyday;
    h += `<div class="card"><h3>${ev.title}</h3>` +
      ev.items.map((it) => `<div class="ev-row"><b>${it.role}</b>：${it.d}</div>`).join('') + `</div>`;

    // 11) 交互推导器
    const dv = d.deriver;
    const dimDefs = [
      { dim: 'att', label: 'E / I', vals: ['E', 'I'] },
      { dim: 'sn', label: 'S / N', vals: ['S', 'N'] },
      { dim: 'tf', label: 'T / F', vals: ['T', 'F'] },
      { dim: 'jp', label: 'J / P', vals: ['J', 'P'] }
    ];
    h += `<div class="card dyn"><h3>${dv.title}</h3><p class="note">${dv.hint}</p>`;
    h += `<div class="dyn-pick">`;
    dimDefs.forEach((dd) => {
      h += `<div class="dyn-row"><span class="dyn-label">${dd.label}</span>`;
      dd.vals.forEach((v) => {
        const on = deriverState[dd.dim] === v ? ' on' : '';
        h += `<button class="dyn-btn${on}" data-action="dyn-pick" data-dim="${dd.dim}" data-val="${v}">${v}</button>`;
      });
      h += `</div>`;
    });
    h += `</div><div id="dyn-result"></div></div>`;

    root.innerHTML = h;
    updateDeriver();
  }

  /* ---------- 自测检验卡 ---------- */
  function renderQuiz() {
    const q = M.quiz[state.quiz.i];
    const answered = state.quiz.answers[state.quiz.i] !== undefined;
    const chosen = state.quiz.answers[state.quiz.i];
    let html = `<div class="quiz"><div class="qmeta">自测检验卡 · 第 ${state.quiz.i + 1} / ${M.quiz.length} 题 · 标签：${q.tag}</div>`;
    html += `<div class="qtext">${q.q}</div><div class="qopts">`;
    q.opts.forEach((o, idx) => {
      let cls = 'opt';
      if (answered) {
        if (idx === q.ans) cls += ' correct';
        else if (idx === chosen) cls += ' wrong';
        cls += ' locked';
      }
      html += `<button class="${cls}" data-action="quiz-pick" data-i="${idx}" ${answered ? 'disabled' : ''}>${o}</button>`;
    });
    html += '</div>';
    if (answered) {
      const ok = chosen === q.ans;
      html += `<div class="exp ${ok ? 'ok' : 'no'}">${ok ? '✓ 答对了。' : '✗ 正确答案：' + q.opts[q.ans] + '。'}<br>${q.exp}</div>`;
      html += state.quiz.i < M.quiz.length - 1
        ? `<button class="btn primary" data-action="quiz-next">下一题 →</button>`
        : `<button class="btn primary" data-action="quiz-result">查看结果</button>`;
    } else {
      html += '<div class="hint">选择一项后显示解析。</div>';
    }
    html += '</div>';
    $('#learn-root').innerHTML = html;
  }

  /* ---------- 类型深度档案（复用） ---------- */
  function section(title, lis) { return `<div class="sec"><h4>${title}</h4><ul>${lis}</ul></div>`; }
  function kv(k, v) { return `<div class="sec"><h4>${k}</h4><p>${v}</p></div>`; }

  function typeProfileHTML(code, opts) {
    opts = opts || {};
    const t = M.types[code];
    let h = `<div class="type-head"><div class="type-code">${code}</div>
      <div><div class="type-nick">${t.nickZh} · ${t.nickEn}</div><div class="type-tag">${t.tagline}</div></div></div>`;
    h += `<div class="stack-block"><div class="k">功能栈</div>${stackHTML(t.stack)}</div>`;
    h += `<p class="over">${t.overview}</p>`;
    h += section('优势', t.strengths.map((x) => `<li>${x}</li>`).join(''));
    h += section('成长盲区', t.growth.map((x) => `<li>${x}</li>`).join(''));
    h += kv('沟通风格', t.communication);
    h += kv('关系与亲密', t.relationships);
    h += kv('工作适配', t.work);
    h += kv('压力与劣势功能', t.stress);
    h += kv('发展建议', t.development);
    h += section('常见误解', t.myths.map((m) => `<li><b>${m.m}</b> —— ${m.t}</li>`).join(''));
    h += `<div class="case"><div class="case-h">案例 · ${t.case.title}</div><div class="case-b">${t.case.body}</div></div>`;
    if (opts.withMarkers) {
      h += `<div class="markers-h">可观察行为标志物（勾选符合项以印证）</div><div class="markers" id="behav-markers">` +
        t.markers.map((m) => `<label class="mk"><input type="checkbox" class="mkbox" value="${m}"> ${m}</label>`).join('') + `</div>`;
    }
    return h;
  }

  /* ---------- 弹层 ---------- */
  function openTypeModal(code) {
    $('#modal').innerHTML = typeProfileHTML(code, { withMarkers: false });
    $('#modal-mask').classList.add('show');
  }
  function closeModal() { $('#modal-mask').classList.remove('show'); }

  /* 功能栈渲染：带角色标签 + 图例，消除"大于号"误读 */
  const STACK_ROLES = ['主导', '辅助', '第三', '劣势'];
  function stackHTML(stack, compact) {
    let h = '<div class="stack">';
    stack.forEach((f, i) => {
      h += `<span class="fn fn${i}"><b>${STACK_ROLES[i]}</b> ${f}</span>`;
      if (i < 3) h += '<span class="arr"> › </span>';
    });
    h += '</div>';
    if (!compact) h += '<div class="stack-legend">符号 › 表示功能使用的优先级与成熟度（主导 › 辅助 › 第三 › 劣势），是层级顺序，<b>不是"大于号"</b>。</div>';
    return h;
  }

  /* ---------- Route A 通用答题流 ---------- */
  function startRouteA(key, container, onDone) {
    state.routeA = { key, i: 0, ans: {}, onDone, container };
    renderRouteA();
  }
  function renderRouteA() {
    const r = state.routeA;
    const q = M.questions[r.i];
    const sel = r.ans[q.id];
    const obs = r.key === 'other';
    const label = { self: '测评中心 · 自陈', crossA: '交叉验证 · Route A（二分维度）', other: '分析他人 · 观察式问卷' }[r.key];
    let html = `<div class="aprog">${label} · 第 ${r.i + 1} / 32 题</div>`;
    html += `<div class="qmeta">${dimName[q.dim]}</div>`;
    const aT = obs ? obsv(q.a.t) : q.a.t;
    const bT = obs ? obsv(q.b.t) : q.b.t;
    html += `<div class="qtext">${obs ? '你观察到 TA：<br>' : ''}${aT} <span class="vs">—— 还是 ——</span> ${bT}</div>`;
    html += `<div class="qopts">`;
    html += `<button class="opt ${sel === 'A' ? 'sel' : ''}" data-action="ra-pick" data-v="A">${aT}</button>`;
    html += `<button class="opt ${sel === 'B' ? 'sel' : ''}" data-action="ra-pick" data-v="B">${bT}</button>`;
    html += `</div>`;
    html += `<div class="qnav"><button class="btn" data-action="ra-prev" ${r.i === 0 ? 'disabled' : ''}>← 上一题</button>`;
    html += `<button class="btn primary" data-action="ra-next" ${sel ? '' : 'disabled'}>${r.i === 31 ? '查看结果 →' : '下一题 →'}</button></div>`;
    if (obs) html += `<div class="note">说明：题目中的「TA」请代入你观察的对象；你是基于外在行为推断，结果仅为「可能类型」，请勿贴标签。</div>`;
    $(r.container).innerHTML = html;
  }

  function scoreRouteA(ans) {
    const cnt = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    M.questions.forEach((q) => {
      const v = ans[q.id];
      if (!v) return;
      cnt[v === 'A' ? q.a.p : q.b.p]++;
    });
    const code = [cnt.E >= cnt.I ? 'E' : 'I', cnt.S >= cnt.N ? 'S' : 'N', cnt.T >= cnt.F ? 'T' : 'F', cnt.J >= cnt.P ? 'J' : 'P'].join('');
    const clarity = {
      EI: Math.round((Math.max(cnt.E, cnt.I) / (cnt.E + cnt.I || 1)) * 100),
      SN: Math.round((Math.max(cnt.S, cnt.N) / (cnt.S + cnt.N || 1)) * 100),
      TF: Math.round((Math.max(cnt.T, cnt.F) / (cnt.T + cnt.F || 1)) * 100),
      JP: Math.round((Math.max(cnt.J, cnt.P) / (cnt.J + cnt.P || 1)) * 100)
    };
    return { code, clarity, cnt };
  }

  /* ---------- 测评中心（自陈） ---------- */
  function renderSelfIntro() {
    $('#assess-intro').style.display = '';
    $('#assess-quiz').style.display = 'none';
    $('#assess-result').style.display = 'none';
    $('#assess-intro').innerHTML = `<div class="card center">
      <h2>测评中心 · 自陈测评</h2>
      <p>32 道迫选题，覆盖四个维度。完成后给出你的类型、各维度偏好清晰度、功能栈与深度分析。</p>
      <p class="note">题目依官方四个维度构念自编，非认证测评。</p>
      <button class="btn primary" data-action="self-start">开始测评</button></div>`;
  }
  function showSelfResult(ans) {
    const { code, clarity } = scoreRouteA(ans);
    state.lastSelf = code;
    $('#assess-intro').style.display = 'none';
    $('#assess-quiz').style.display = 'none';
    $('#assess-result').style.display = '';
    let html = `<div class="result-head"><div class="big-code">${code}</div>
      <div><div class="type-nick">${M.types[code].nickZh} · ${M.types[code].nickEn}</div>
      <div class="type-tag">${M.types[code].tagline}</div></div></div>`;
    html += `<div class="clarity">`;
    [['EI', '外倾/内倾'], ['SN', '实感/直觉'], ['TF', '思考/情感'], ['JP', '判断/感知']].forEach(([k, nm]) => {
      const v = clarity[k];
      html += `<div class="clar"><span>${nm}</span>
        <div class="bar"><div class="fill" style="width:${v}%"></div></div>
        <span>${v}% 清晰</span></div>`;
    });
    html += `</div>`;
    html += typeProfileHTML(code, { withMarkers: false });
    html += `<div class="row-btns"><button class="btn" data-action="self-restart">重新测评</button>
      <button class="btn primary" data-action="tab" data-view="cross">去做交叉验证 →</button></div>`;
    $('#assess-result').innerHTML = html;
  }

  /* ---------- 交叉验证 ---------- */
  function renderCrossIntro() {
    showCrossPanel('intro');
    $('#cross-intro').innerHTML = `<div class="card center">
      <h2>交叉验证 · 双通道比对</h2>
      <p>用两条<strong>独立通道</strong>得出你的类型并互相印证：</p>
      <ul class="left">
        <li><b>Route A（二分维度）</b>：32 题测四个二元偏好，对应官方 MBTI® 的维度计分思路。</li>
        <li><b>Route B（功能态度）</b>：32 题探测你更自然使用的认知功能，再依类型动力学推导功能栈与类型。</li>
      </ul>
      <p class="note">两路一致 → 自我认知自洽、可信度高；不一致 → 工具会指出分歧维度与可能原因。</p>
      <button class="btn primary" data-action="cross-startA">开始 Route A</button></div>`;
  }
  function showCrossPanel(which) {
    ['intro', 'a', 'b', 'report'].forEach((p) => {
      const elp = $('#cross-' + p);
      if (elp) elp.style.display = (p === which) ? '' : 'none';
    });
  }
  function renderCrossBIntro() {
    showCrossPanel('b');
    $('#cross-b').innerHTML = `<div class="card center">
      <h2>Route B · 功能态度量表</h2>
      <p>32 题，探测你更自然使用的认知功能（Si/Se/Ni/Ne/Ti/Te/Fi/Fe）与态度。</p>
      <p class="note">本量表为基于类型动力学的推导演练，用于与 Route A 交叉验证，非官方计分。</p>
      <button class="btn primary" data-action="cross-startB">开始 Route B</button></div>`;
  }
  function renderCrossB() {
    showCrossPanel('b');
    const r = state.crossB;
    const item = M.funcItems[r.i];
    const sel = r.ans[item.id];
    let html = `<div class="aprog">Route B · 功能态度 · 第 ${r.i + 1} / ${M.funcItems.length} 题</div>`;
    html += `<div class="qtext">${item.prompt}</div><div class="qopts">`;
    item.opts.forEach((o) => {
      html += `<button class="opt ${sel === o.f ? 'sel' : ''}" data-action="func-pick" data-f="${o.f}">${o.t}</button>`;
    });
    html += `</div>`;
    html += `<div class="qnav"><button class="btn" data-action="cb-prev" ${r.i === 0 ? 'disabled' : ''}>← 上一题</button>`;
    html += `<button class="btn primary" data-action="cb-next" ${sel ? '' : 'disabled'}>${r.i === M.funcItems.length - 1 ? '生成比对报告 →' : '下一题 →'}</button></div>`;
    $('#cross-b').innerHTML = html;
  }

  const funAtt = (f) => (f[1] === 'e' ? 'E' : 'I');
  // 类型动力学翻转（跨轴）：主导↔劣势走 直觉⇄感觉 轴，辅助↔第三走 思考⇄情感 轴
  const flipF = (f) => ({ Ni: 'Se', Se: 'Ni', Ne: 'Si', Si: 'Ne', Te: 'Fi', Fi: 'Te', Ti: 'Fe', Fe: 'Ti' }[f]);
  function argmax(obj) {
    let best = null, bv = -1;
    Object.keys(obj).forEach((k) => { if (obj[k] > bv) { bv = obj[k]; best = k; } });
    return best;
  }
  function deriveStack(att, sn, tf, jp) {
    let dom, aux;
    if (jp === 'J') {
      const ext = tf + 'e';                 // J 型：判断功能外倾
      if (att === 'E') { dom = ext; aux = sn + 'i'; }
      else { dom = sn + 'i'; aux = ext; }   // I 型主导必为内倾
    } else {
      const ext = sn + 'e';                 // P 型：感知功能外倾
      if (att === 'E') { dom = ext; aux = tf + 'i'; }
      else { dom = tf + 'i'; aux = ext; }   // I 型主导必为内倾
    }
    return [dom, aux, flipF(aux), flipF(dom)];
  }
  // 逐步推导说明（与 deriveStack 同逻辑）
  function deriveSteps(att, sn, tf, jp) {
    const domIsJudging = (att === 'E') ? (jp === 'J') : (jp === 'P');
    const steps = [];
    steps.push(`${att} → 主导朝${att === 'E' ? '外(e)' : '内(i)'}。`);
    steps.push(`${att}+${jp} → 主导是<b>${domIsJudging ? '判断类' : '感知类'}</b>${att === 'I' ? '（因外倾的是辅助）' : ''}。`);
    let dom, aux;
    if (jp === 'J') { const ext = tf + 'e'; if (att === 'E') { dom = ext; aux = sn + 'i'; } else { dom = sn + 'i'; aux = ext; } }
    else { const ext = sn + 'e'; if (att === 'E') { dom = ext; aux = tf + 'i'; } else { dom = tf + 'i'; aux = ext; } }
    steps.push(`主导 = <b>${dom}</b>（${domIsJudging ? '判断' : '感知'}+${att === 'E' ? '外倾' : '内倾'}，取${domIsJudging ? '第3字母 ' + tf : '第2字母 ' + sn}）。`);
    steps.push(`辅助 = <b>${aux}</b>（另一类 + 相反态度）。`);
    const tert = flipF(aux), inf = flipF(dom);
    steps.push(`第三 = ${aux} 的对跖点 → <b>${tert}</b>；劣势 = ${dom} 的对跖点 → <b>${inf}</b>。`);
    return steps;
  }
  let deriverState = { att: 'I', sn: 'N', tf: 'T', jp: 'J' };
  function updateDeriver() {
    const { att, sn, tf, jp } = deriverState;
    const stack = deriveStack(att, sn, tf, jp);
    const steps = deriveSteps(att, sn, tf, jp);
    const labels = ['主导', '辅助', '第三', '劣势'];
    $('#dyn-result').innerHTML =
      `<div class="dyn-steps"><ol class="left">${steps.map((s) => `<li>${s}</li>`).join('')}</ol></div>` +
      `<div class="dyn-stack">${stack.map((f, i) => `<span class="fn fn${i}"><b>${labels[i]}</b> ${f}</span>`).join('<span class="arr"> › </span>')}</div>` +
      `<div class="note">对应类型：<b>${att}${sn}${tf}${jp}</b>。可在「16 型图谱」查看该型深度分析。</div>`;
  }

  function inferFromFuncs(ans) {
    const tally = { Si:0, Se:0, Ni:0, Ne:0, Ti:0, Te:0, Fi:0, Fe:0, E:0, I:0, J:0, P:0 };
    M.funcItems.forEach((it) => {
      const f = ans[it.id];
      if (!f) return;
      tally[f] = (tally[f] || 0) + 1;
    });
    const perc = { S: tally.Si + tally.Se, N: tally.Ni + tally.Ne };
    const judg = { T: tally.Ti + tally.Te, F: tally.Fi + tally.Fe };
    const att = tally.E >= tally.I ? 'E' : 'I';
    const sn = perc.S >= perc.N ? 'S' : 'N';
    const tf = judg.T >= judg.F ? 'T' : 'F';
    const jp = tally.J >= tally.P ? 'J' : 'P';
    const stack = deriveStack(att, sn, tf, jp);
    const margins = [
      Math.abs(tally.E - tally.I) / Math.max(1, tally.E + tally.I),
      Math.abs(perc.S - perc.N) / Math.max(1, perc.S + perc.N),
      Math.abs(judg.T - judg.F) / Math.max(1, judg.T + judg.F),
      Math.abs(tally.J - tally.P) / Math.max(1, tally.J + tally.P)
    ];
    const clarity = Math.round(margins.reduce((a, b) => a + b, 0) / margins.length * 100);
    return { code: att + sn + tf + jp, stack, clarity };
  }

  function compareTypes(a, b) {
    const dims = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
    const names = { EI: '外倾/内倾', SN: '实感/直觉', TF: '思考/情感', JP: '判断/感知' };
    let match = 0; const diffs = [];
    ['EI', 'SN', 'TF', 'JP'].forEach((d, k) => {
      const [x, y] = dims[k];
      const la = a.includes(x) ? x : y, lb = b.includes(x) ? x : y;
      if (la === lb) match++; else diffs.push({ d, la, lb, nm: names[d] });
    });
    return { match, diffs };
  }
  const diffHint = {
    EI: '你在「能量来源/内外倾」上两路不一致：可能受社交情境或角色期待影响，或功能取向与表层能量不同。',
    SN: '你在「信息接收」上两路不一致：职业或训练可能强化了另一取向。',
    TF: '你在「决策方式」上两路不一致：理性与价值在你身上可能随情境切换。',
    JP: '你在「生活节奏」上两路不一致：外部要求与你内在节奏可能不同。'
  };

  function renderCrossReport() {
    showCrossPanel('report');
    const ra = scoreRouteA(state.routeA.ans).code;
    const rb = inferFromFuncs(state.crossB.ans);
    const cmp = compareTypes(ra, rb.code);
    let html = `<h2>比对报告</h2>`;
    html += `<div class="compare"><div class="cmp-box"><div class="cmp-h">Route A（二分维度）</div>
      <div class="cmp-code">${ra}</div><div class="cmp-stack">${stackHTML(M.types[ra].stack, true)}</div></div>
      <div class="cmp-vs">VS</div>
      <div class="cmp-box"><div class="cmp-h">Route B（功能态度）</div>
      <div class="cmp-code">${rb.code}</div><div class="cmp-stack">${stackHTML(rb.stack, true)}</div></div></div>`;
    html += `<div class="clarity-note">Route B 置信度：<b>${rb.clarity}%</b>（四个维度"胜方票差"的平均占比；越高表示倾向越清晰）。若偏低，请结合行为印证、重测或考虑相近类型。</div>`;
    if (cmp.match === 4) {
      html += `<div class="verdict ok">✓ 两路完全一致（4/4 维度吻合）——你的自我认知在「表层偏好」与「深层功能」上高度自洽，可信度高。</div>`;
    } else {
      html += `<div class="verdict no">⚠ 两路在 ${4 - cmp.match} 个维度上不一致（${cmp.match}/4 吻合）。这很常见，不一定代表"测错"，往往揭示值得深思的张力：</div>`;
      html += `<ul class="left">` + cmp.diffs.map((d) =>
        `<li><b>${d.nm}</b>：Route A=${d.la}，Route B=${d.lb}<br>${diffHint[d.d]}</li>`).join('') + `</ul>`;
    }
    // 行为印证
    html += `<div class="behav"><h3>行为印证清单</h3>
      <p class="note">任何自评都有盲点。选择你想印证的主类型，勾选符合的行为，看印证度。</p>
      <select id="behav-type" class="sel-type">
        <option value="${ra}">Route A：${ra}（${M.types[ra].nickZh}）</option>
        <option value="${rb.code}">Route B：${rb.code}（${M.types[rb.code].nickZh}）</option>
      </select>
      <div id="behav-markers"></div>
      <button class="btn primary" data-action="behav-load">载入该型标志物</button>
      <div id="behav-out"></div></div>`;
    $('#cross-report').innerHTML = html;
  }

  function behavLoad() {
    const code = $('#behav-type').value;
    const t = M.types[code];
    $('#behav-markers').innerHTML = t.markers.map((m) =>
      `<label class="mk"><input type="checkbox" class="mkbox" value="${m}"> ${m}</label>`).join('');
  }
  function behavCompute() {
    const code = $('#behav-type').value;
    const boxes = $$('#behav-markers .mkbox');
    const total = boxes.length;
    const checked = boxes.filter((b) => b.checked).length;
    const pct = total ? Math.round((checked / total) * 100) : 0;
    let html = `<div class="behav-out"><div class="clar"><span>行为印证度</span>
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div><span>${pct}%</span></div>`;
    if (pct >= 70) html += `<div class="verdict ok">✓ 印证度较高，该型与你的可观察行为较吻合。</div>`;
    else if (pct >= 40) html += `<div class="verdict">△ 印证度中等，可结合两条通道的结论综合判断。</div>`;
    else {
      html += `<div class="verdict no">⚠ 印证度偏低。建议重测，或考虑相近类型：`;
      html += nearby(code).map((c) => `<code class="near">${c}</code>`).join(' ');
      html += `（分别翻转一个维度）。</div>`;
    }
    html += `</div>`;
    $('#behav-out').innerHTML = html;
  }
  function nearby(code) {
    return code.split('').map((c, i) => code.slice(0, i) + flips[c] + code.slice(i + 1));
  }

  /* ---------- 分析他人 ---------- */
  function renderOtherIntro() {
    showOtherPanel('intro');
    $('#other-intro').innerHTML = `<div class="card center">
      <h2>分析他人</h2>
      <p>两种方式，皆用于「理解」而非「贴标签」：</p>
      <div class="two-tools">
        <button class="tool-btn" data-action="other-mode" data-mode="quiz"><div class="tool-t">观察式问卷</div>
          <div class="tool-d">把 32 题改成「你观察到 TA 通常…」，替他人作答得出可能类型。</div></button>
        <button class="tool-btn" data-action="other-mode" data-mode="guide"><div class="tool-t">自由拆解引导</div>
          <div class="tool-d">按四个维度写观察笔记、逐维推断，导出可能类型。</div></button>
      </div>
      <p class="note">从外在行为推断他人类型天然含不确定性：多个类型可呈现相似行为，且你无法确知他人内在偏好。</p></div>`;
  }
  function showOtherPanel(which) {
    ['intro', 'quiz', 'guide', 'result'].forEach((p) => {
      const elp = $('#other-' + p);
      if (elp) elp.style.display = (p === which) ? '' : 'none';
    });
  }
  function showOtherResult(code, title) {
    showOtherPanel('result');
    let html = `<div class="result-head"><div class="big-code">${code}</div>
      <div><div class="type-nick">${M.types[code].nickZh} · ${M.types[code].nickEn}</div>
      <div class="type-tag">${title}</div></div></div>`;
    html += `<div class="caveat">⚠ 这是基于<strong>外在行为观察</strong>推导的「可能类型」，不是对 TA 内在偏好的定论。` +
      `相近类型也可能呈现相似行为：` + nearby(code).map((c) => `<code class="near">${c}</code>`).join(' ') +
      `。请用于理解与同理，避免贴标签。</div>`;
    html += typeProfileHTML(code, { withMarkers: true });
    html += `<div class="row-btns"><button class="btn" data-action="other-restart">返回</button></div>`;
    $('#other-result').innerHTML = html;
  }

  function renderOtherGuide() {
    showOtherPanel('guide');
    let html = `<h2>自由拆解引导</h2><p class="note">对每个维度，先读引导问题、在笔记里写下观察，再凭你的判断选 TA 更偏哪一侧。</p>`;
    ['EI', 'SN', 'TF', 'JP'].forEach((k) => {
      const d = M.dimensions[k];
      const poles = Object.keys(d.poles);
      html += `<div class="guide-dim"><h3>${d.name}</h3>
        <div class="gd-q">引导：你观察到 TA 在「${d.note}」上更常怎样？</div>
        <div class="gd-opts">
          <label class="gd-opt"><input type="radio" name="gd-${k}" value="${poles[0]}"> <b>${d.poles[poles[0]].name}</b>：${shorten(d.poles[poles[0]].desc)}</label>
          <label class="gd-opt"><input type="radio" name="gd-${k}" value="${poles[1]}"> <b>${d.poles[poles[1]].name}</b>：${shorten(d.poles[poles[1]].desc)}</label>
        </div>
        <textarea class="gd-note" data-dim="${k}" placeholder="写下你对 TA 在这一维度的观察笔记…"></textarea></div>`;
    });
    html += `<div class="row-btns"><button class="btn" data-action="other-restart">返回</button>
      <button class="btn primary" data-action="guide-infer">推断类型 →</button></div>`;
    $('#other-guide').innerHTML = html;
  }
  function shorten(s) { return s.length > 46 ? s.slice(0, 46) + '…' : s; }

  function guideInfer() {
    let code = '';
    ['EI', 'SN', 'TF', 'JP'].forEach((k) => {
      const v = (document.querySelector(`input[name="gd-${k}"]:checked`) || {}).value;
      code += v || '?';
    });
    if (code.includes('?')) {
      $('#other-guide').insertAdjacentHTML('beforeend', '<div class="verdict no">请先为每个维度各选一项。</div>');
      return;
    }
    // 保存笔记
    $$('.gd-note').forEach((ta) => { state.otherGuide[ta.dataset.dim] = ta.value; });
    showOtherResult(code, '自由拆解推断 · 可能类型');
  }

  /* ---------- 统一事件委托 ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const a = t.dataset.action;
    switch (a) {
      case 'tab': showView(t.dataset.view); break;
      case 'learn': setLearn(t.dataset.sec); break;
      case 'type': openTypeModal(t.dataset.code); break;
      case 'close-modal': closeModal(); break;

      case 'quiz-pick': {
        const i = +t.dataset.i;
        if (state.quiz.answers[i] === undefined) {
          state.quiz.answers[i] = i;
          if (i === M.quiz[i].ans) state.quiz.score++;
        }
        renderQuiz();
        break;
      }
      case 'quiz-next': state.quiz.i++; renderQuiz(); break;
      case 'quiz-result': {
        const tot = M.quiz.length, sc = state.quiz.score;
        $('#learn-root').innerHTML = `<div class="quiz result"><h2>自测结果</h2>
          <div class="big-score">${sc} / ${tot}</div>
          <p>${sc >= tot * 0.8 ? '掌握扎实！' : sc >= tot * 0.6 ? '基础不错，可回看薄弱标签。' : '建议重读相关维度/功能再测。'}</p>
          <button class="btn primary" data-action="quiz-reset">重做</button></div>`;
        break;
      }
      case 'quiz-reset': state.quiz = { i: 0, answers: {}, score: 0 }; renderQuiz(); break;

      case 'self-start':
        $('#assess-intro').style.display = 'none';
        $('#assess-result').style.display = 'none';
        $('#assess-quiz').style.display = '';
        startRouteA('self', '#assess-quiz', () => showSelfResult(state.routeA.ans));
        break;
      case 'ra-pick': state.routeA.ans[M.questions[state.routeA.i].id] = t.dataset.v; renderRouteA(); break;
      case 'ra-next':
        if (state.routeA.i === 31) state.routeA.onDone();
        else { state.routeA.i++; renderRouteA(); }
        break;
      case 'ra-prev': if (state.routeA.i > 0) { state.routeA.i--; renderRouteA(); } break;
      case 'self-restart': renderSelfIntro(); break;

      case 'cross-startA':
        showCrossPanel('a');
        startRouteA('crossA', '#cross-a', () => renderCrossBIntro());
        break;
      case 'cross-startB': state.crossB = { i: 0, ans: {} }; renderCrossB(); break;
      case 'func-pick': state.crossB.ans[M.funcItems[state.crossB.i].id] = t.dataset.f; renderCrossB(); break;
      case 'cb-next':
        if (state.crossB.i === M.funcItems.length - 1) renderCrossReport();
        else { state.crossB.i++; renderCrossB(); }
        break;
      case 'cb-prev': if (state.crossB.i > 0) { state.crossB.i--; renderCrossB(); } break;
      case 'behav-load': behavLoad(); break;
      case 'behav-compute': behavCompute(); break;

      case 'dyn-pick':
        deriverState[t.dataset.dim] = t.dataset.val;
        // 仅高亮当前行
        document.querySelectorAll('.dyn-row').forEach((row) => {
          const dim = row.querySelector('.dyn-btn')?.dataset.dim;
          if (dim === t.dataset.dim) {
            row.querySelectorAll('.dyn-btn').forEach((b) => b.classList.toggle('on', b.dataset.val === t.dataset.val));
          }
        });
        updateDeriver();
        break;

      case 'other-mode':
        if (t.dataset.mode === 'quiz') {
          showOtherPanel('quiz');
          startRouteA('other', '#other-quiz', () => showOtherResult(scoreRouteA(state.routeA.ans).code, '观察式问卷 · 可能类型'));
        } else { renderOtherGuide(); }
        break;
      case 'guide-infer': guideInfer(); break;
      case 'other-restart': renderOtherIntro(); break;
    }
  });

  /* ---------- 初始化 ---------- */
  function init() {
    // 顶部 tab
    $$('nav.tabs button').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
    // 学习子导航
    $$('.learn-nav button').forEach((b) => b.addEventListener('click', () => setLearn(b.dataset.sec)));
    // 弹层关闭
    $('#modal-mask').addEventListener('click', (e) => { if (e.target.id === 'modal-mask') closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    showView('learn');
    setLearn('origin');
    renderSelfIntro();
    renderCrossIntro();
    renderOtherIntro();
    window.MBTIApp = { showView, setLearn, openTypeModal, closeModal, startRouteA, scoreRouteA, inferFromFuncs, compareTypes, deriveStack, deriveSteps };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
