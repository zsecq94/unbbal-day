/* eslint-disable */ /* mockups/shared/lotto.js와 shared/saju/를 묶은 일반 스크립트(file://에서도 열리게). mockups/tools/build-saju.mjs가 만든다. 손으로 고치지 않는다. */
"use strict";
var Lotto = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // mockups/shared/lotto.js
  var lotto_exports = {};
  __export(lotto_exports, {
    BRANCHES: () => BRANCHES,
    BRANCHES_HANJA: () => BRANCHES_HANJA,
    DEMO: () => DEMO,
    ELEMENTS: () => ELEMENTS,
    ELEMENTS_HANJA: () => ELEMENTS_HANJA,
    ELEMENT_COLORS: () => ELEMENT_COLORS,
    GAME_LABELS: () => GAME_LABELS,
    HADO_DIGITS: () => HADO_DIGITS,
    LOTTO_SYMBOL: () => LOTTO_SYMBOL,
    MAX_EXCLUDED: () => MAX_EXCLUDED,
    MAX_FIXED: () => MAX_FIXED,
    ODDS: () => ODDS,
    PICK: () => PICK,
    PILLARS: () => PILLARS,
    POOLS: () => POOLS,
    RELATION_KO: () => RELATION_KO,
    STEMS: () => STEMS,
    STEMS_HANJA: () => STEMS_HANJA,
    TOTAL: () => TOTAL,
    ballHTML: () => ballHTML,
    ballScheme: () => ballScheme,
    cellElement: () => cellElement,
    drawRandom: () => drawRandom,
    elementColor: () => elementColor,
    fortuneDraw: () => fortuneDraw,
    ganji: () => ganji,
    ganjiHanja: () => ganjiHanja,
    localZone: () => localZone,
    nextDraw: () => nextDraw,
    orbit: () => orbit,
    pad2: () => pad2,
    rangeColor: () => rangeColor,
    relation: () => relation,
    sexagenary: () => sexagenary,
    solarOf: () => solarOf,
    ticketText: () => ticketText,
    timeOf: () => timeOf,
    todayOf: () => todayOf,
    wrap: () => wrap
  });

  // mockups/shared/saju/ganji.js
  var pillarAt = (n) => {
    const i = (n % 60 + 60) % 60;
    return { stem: i % 10, branch: i % 12 };
  };
  var stemElement = (stem) => Math.floor(stem / 2);
  var BRANCH_MAIN_STEM = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];
  var branchStem = (branch) => BRANCH_MAIN_STEM[branch];
  var branchElement = (branch) => stemElement(BRANCH_MAIN_STEM[branch]);
  var TEN_GODS = [
    "bigyeon",
    "geopjae",
    "siksin",
    "sanggwan",
    "pyeonjae",
    "jeongjae",
    "pyeongwan",
    "jeonggwan",
    "pyeonin",
    "jeongin"
  ];
  function tenGodOf(dm, stem) {
    const group = (stemElement(stem) - stemElement(dm) + 5) % 5;
    return TEN_GODS[group * 2 + (dm % 2 === stem % 2 ? 0 : 1)];
  }
  var tenGodGroup = (g) => Math.floor(TEN_GODS.indexOf(g) / 2);
  var isSixCombine = (a, b) => (a + b) % 12 === 1;
  var isClash = (a, b) => Math.abs(a - b) === 6;
  var isHalfTrine = (a, b) => a !== b && a % 4 === b % 4;
  var WONJIN = ["0-7", "1-6", "2-9", "3-8", "4-11", "5-10"];
  var isWonjin = (a, b) => WONJIN.includes(`${Math.min(a, b)}-${Math.max(a, b)}`);
  var isHarm = (a, b) => (a + b) % 12 === 7;
  var PUNISH = [
    [2, 5],
    [5, 8],
    [2, 8],
    [1, 10],
    [10, 7],
    [1, 7],
    [0, 3]
  ];
  var SELF_PUNISH = [4, 6, 9, 11];
  var isPunish = (a, b) => a === b && SELF_PUNISH.includes(a) || PUNISH.some(([x, y]) => a === x && b === y || a === y && b === x);
  var peachBlossom = (branch) => [9, 6, 3, 0][branch % 4];
  var isStemCombine = (a, b) => Math.abs(a - b) === 5;
  var isStemClash = (a, b) => Math.abs(a - b) === 6;
  function monthPillar(yearStem, branch) {
    const tigerStem = (yearStem % 5 * 2 + 2) % 10;
    return { stem: (tigerStem + (branch - 2 + 12) % 12) % 10, branch };
  }
  function hourPillar(dayStem, branch) {
    return { stem: (dayStem % 5 * 2 + branch) % 10, branch };
  }
  var dayPillarOfJdn = (jdn) => pillarAt(jdn + 49);
  var jdnOf = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 864e5) + 2440588;

  // mockups/shared/saju/solar-terms-data.js
  var TERMS_FIRST_YEAR = 1899;
  var TERMS_START = -37335583;
  var TERMS_BASE = 42e3;
  var TERMS_PACKED = "0d20o716j1rd2972is2hf25c1m811f0ki0bn0d00o616j1re2982iv2hh25e1m811f0kg0bl0cz0o716l1ri29a2iw2he25c1m811g0kj0bn0cy0o616h1re2952iq2hc25c1mb11l0kn0br0cz0o416f1rb2962iu2hf25e1mc11j0km0bq0cz0o416f1rc2962iv2hg25e1ma11h0kk0bq0d10o616g1rc2942iq2hd25d1ma11i0kl0bq0d30o816j1rd2952iq2hd25c1mb11k0km0bq0d00o416g1rb2932iq2hd25e1md11l0kn0bq0cy0o316e1ra2952it2hf25d1mb11j0km0bp0d00o416g1re2972iu2he25d1m811i0km0br0d10o616e1r82912ip2hc25d1mb11k0ko0bs0d10o516e1r72922ir2hf25h1me11k0kl0bn0cz0o316f1rb2942iu2hg25h1md11k0kk0bn0cx0o216f1rb2922iq2hd25e1me11m0kn0bq0cy0o316e1ra2942ir2he25f1mf11o0kq0br0cx0nz1691r62912is2hg25h1mg11p0kq0bs0cy0nz1691r42902is2hh25i1mf11m0ko0br0d10o316d1r82912ir2hg25h1mf11n0ko0br0d10o416c1r528x2il2hb25g1mh11r0kr0bt0d00o216c1r528z2io2hd25i1mh11r0kq0br0cx0o116c1r82932it2hf25h1me11o0kp0bs0cy0o116c1r72912iq2hc25f1md11n0kp0bu0d10o416c1r72912ir2hg25h1mf11o0kq0br0cy0o016a1r42902is2hi25l1mi11p0kp0bp0cw0ny1691r52902ir2hj25m1mi11p0ko0bo0cw0nz16a1r82922it2hi25l1mj11r0kq0bq0cw0ny1661r228y2io2he25k1ml11v0kv0bu0cx0nw1641qz28w2ip2hh25m1mm11u0kt0bt0cx0nx1661r028y2ir2hk25m1mk11s0kr0bt0cz0nz1671r128v2il2hd25j1mj11s0kt0bv0d00o21681r228v2im2hd25j1ml11v0kv0bt0cx0nx1661r228w2io2hf25k1mm11v0ku0bt0cw0nw1651r128x2io2hg25j1mj11s0ks0bt0cy0ny1671r428z2ir2hi25j1mj11r0ks0bt0d00ny1661qz28u2in2hg25k1ml11u0ku0bt0cz0nx1641qy28u2io2hi25o1mo11u0kr0bq0cu0nw1661r228y2ir2hl25q1mn11v0kr0bq0cu0nu1651r228w2in2hf25m1mo11w0kv0bt0cw0nv1631qy28w2io2hi25n1mp11z0ky0bu0cu0ns15z1qw28v2iq2hl25r1mr11z0kx0bv0cw0ns15z1qt28s2io2hj25q1mp11x0kv0bu0cy0nw1631qx28t2io2hj25q1mq11y0kw0bu0cz0nw1631qv28q2ij2he25o1ms1210l00bw0cx0nv1601qu28q2ik2hg25o1mr1210ky0bu0cw0nt1621qy28v2ip2hj25p1mp11y0kx0bu0cx0nv1621qx28s2im2he25l1mn11x0ky0bw0d00nx1621qu28s2im2hh25n1mq11y0kx0bu0cw0nu1601qv28s2ip2hl25s1ms11z0kw0bs0cu0ns15z1qv28s2in2hj25r1mr11z0kv0br0cu0ns1611qx28u2ip2hj25r1mt1210kx0bu0cu0nq15x1qt28q2im2hi25r1mu1240l20bw0cv0nq15u1qo28o2il2hj25t1mu1230kz0bw0cv0nq15w1qr28q2ip2hm25v1mu1220ky0bu0cw0ns15z1qr28o2ij2hg25q1mt1230l00bw0cy0nu15y1qr28n2ii2hg25r1mv1260l10bw0cu0np15w1qr28p2in2hk25u1mw1250l20bv0cu0no15v1qr28q2im2hi25r1mt1220l00bw0cx0nr15x1qr28r2in2hk25s1mu1220l00bw0cx0ns15v1qp28n2il2hk25u1mw1250l20bw0cw0nr15u1qo28l2ik2hk25w1my1240kz0bt0ct0np15w1qr28q2io2hn25x1n01250l00bt0cr0np15v1qr28p2il2hh25t1my1270l40bx0cu0no15t1qn28m2ik2hj25t1mz1290l60bx0cu0nl15q1ql28m2io2hn25z1n01280l50bx0cv0nn15q1ql28l2ik2hk25v1mz1250l20bx0cw0nr15u1qn28k2ij2hk25v1mz1280l30bw0cw0np15t1qm28k2ih2hi25v1n112a0l70by0cv0nn15r1qk28j2ih2hi25v1mz1280l40bx0ct0nn15r1qn28n2in2hl25w1mz1270l30bx0cu0no15s1qn28l2il2hi25t1my1260l40bz0cw0no15s1qk28i2ij2hj25w1n01280l30bw0cs0nm15p1qk28l2im2hp2621n512a0l30bu0cq0nk15p1qk28l2il2hl25z1n31290l40bu0cr0nl15p1qk28l2ik2hm25y1n412d0l60by0cs0nj15m1qh28i2ij2hm2601n612f0lb0c10ct0nj15k1qd28f2ih2hm2601n512d0l70bz0cu0nl15m1qg28h2ik2hn2621n612d0l60by0cu0nn15q1qi28g2ig2hi25y1n412e0l90c00cw0nn15p1qi28e2ie2hh25w1n512f0la0c00cs0nk15m1qh28i2ik2hm2611n612f0l90bz0cs0nj15n1qh28k2ik2hl25w1n212b0l70c00cu0nm15o1qi28i2ij2hl25y1n312a0l70c00cu0nm15m1qf28g2ij2hn2621n612e0l80bz0ct0nj15l1qf28f2ih2hn2621n712d0l60bv0cq0ni15l1qh28i2ik2hp2641n912f0l60bv0cp0ng15m1qh28h2ij2hl2611n812g0lb0c00cs0ng15i1qd28d2ih2hl2611n812i0lc0c00cr0ne15e1qa28d2ik2hq2671nc12i0la0c00cr0ng15g1qb28d2ii2hn2641n912g0l90c00ct0nj15k1qc28b2ie2hl2621n912j0lb0c00ct0nh15i1qa28b2ie2hm2631nd12m0le0c20cs0ng15h1qa28b2if2hk2621na12j0lc0c10cr0ng15h1qc28d2ii2hn2631n912i0lb0c10cs0ni15i1qd28d2ih2hm2621n812i0lc0c20cv0nj15i1qa28b2ie2hl2631na12j0lb0bz0cr0nf15g1qa28c2ij2hr2691ne12l0la0bx0cp0ne15g1qc28f2ij2hp2651nd12k0lb0by0cq0ne15g1qb28e2ig2hn2651nc12m0le0c10cr0nc15c1q628a2ih2hq2681ng12o0li0c30cs0nd15b1q42882ig2hp2681ne12m0ld0c20cr0nf15d1q62892if2hp2681nf12m0ld0c00cs0nf15g1q92892id2hl2661nf12o0lg0c30cs0ng15e1q72882ib2hj2641ne12p0lg0c20cp0nc15b1q628a2ig2ho2681nh12o0lg0c20cp0nc15b1q728c2ih2hp2651nc12m0le0c20cs0ne15d1q72892if2hm2661nc12l0lf0c20cs0ne15b1q32862ie2hq26a1ni12q0lg0c10cq0nc15b1q32872if2hp26a1ni12p0le0bz0cn0nb15b1q52892if2hp26a1nj12q0lf0c00co0na15a1q52882ie2ho2691ni12s0lk0c50cr0na1591q12852id2hn2681nh12t0lj0c50cq0n91561pz2842if2hr26d1nl12s0li0c30cq0nb1591q22862if2hq26a1nj12q0lh0c30cr0ne15b1q42852ic2hl2681nj12r0lj0c30cr0nb1591q02842ic2hn26b1nn12v0ll0c50cp0na1571q22852ie2hp26b1nj12s0li0c30cq0na1581q22872ie2hq26a1ni12r0lh0c30cq0nb1581q22862ie2hp26b1nj12s0lj0c40cs0nb1591q02842id2hp26b1nl12t0li0c10cn0n81551q02832if2hs26g1np12u0lj0bz0cl0n61551q12872ig2hs26e1nn12v0lk0c10co0n71551q02852id2hp26b1nm12w0lm0c50cp0n51501pu2802ic2hr26f1nq1300lo0c70cq0n51511pu27z2id2hs26g1np12w0ll0c40cq0n81531pw2802ia2hp26e1np12w0ll0c40cp0n91561pw2802i82hn26c1np12z0lp0c60cr0n91551px27z2i92hm26a1no12z0lp0c50co0n61521pv2812ib2hq26d1np12y0ln0c50co0n61521px2842ie2hr26d1nn12u0lm0c50cr0n91541py2822ic2hq26c1nm12v0ll0c50cp0n71521pt27z2ia2hs26i1ns1300ln0c30cn0n51511pv2812id2hu26j1nt12z0ll0c10cl0n31521pw2822id2hs26h1ns1300ln0c30cm0n21501pu27z2ic2hr26g1nu1330ls0c80co0n314y1pr27y2ib2hr26h1nt1330lr0c70co0n214w1pp27w2ia2ht26l1nv1320lq0c60co0n414y1pr27y2ib2hr26i1nu1320lp0c60cq0n61521pt27y2i82ho26f1ns1320lr0c80cp0n414x1pq27v2i72ho26h1nw1350lt0c90co0n214x1pq27y2ia2hs26i1nt1320lq0c70co0n314z1pr27z2ib2hr26g1ns12z0lp0c60cp0n514z1pq27v2i92hq26h1nt1320lr0c70cq0n514z1pq27v2i92hs26j1nv1330lp0c40cm0n114w1pq27w2ia2ht26l1ny1340lp0c40cj0n014v1pr27y2ic2ht26k1nw1350lr0c60cl0n114w1pr27x2ib2hs26i1nv1350lu0c80cn0mz14r1pk27r2i82ht26m1o01370lv0c90co0mz14s1pk27s2ia2hv26o1o01350ls0c60co0n114v1po27t2i92hs26l1nz1360ls0c60cm0n214v1pn27r2i52hp26k1nz13a0lw0c90co0n114u1pn27t2i72hr26k1nz13a0lw0c80cm0my14s1pl27u2i92hs26l1o01370lv0c80cm0mz14r1pm27v2ia2ht26l1ny1360lu0c80cp0n214w1pn27u2i92ht26l1nx1360lu0c80co0n014r1pj27q2i62ht26p1o213a0lw0c70cl0my14q1pk27s2i92hw26r1o313a0lu0c50cj0mx14s1pm27u2ia2hu26n1o213a0lw0c70cl0mw14q1pi27p2i72hr26m1o213d0m00cc0co0mx14o1pg27p2i72ht26p1o313c0ly0ca0cn0mx14o1pf27o2i72hu26q1o413b0lw0c80cm0my14q1ph27p2i52hs26o1o313b0lx0c90cn0n014s1pl27q2i52hr26m1o113c0ly0cb0cm0mw14o1pg27o2i32hr26n1o513e0m00ca0cm0mv14n1pf27q2i82hu26q1o313b0lx0c80cm0mw14p1pj27r2ia2hu26o1o213a0lv0c90cm0mx14p1pf27n2i52hs26p1o413d0ly0ca0cm0mx14o1pf27n2i62hv26s1o813e0ly0c60ci0mu14m1pf27p2i82hw26t1o913f0lz0c60ci0ms14l1pf27p2i72hu26r1o713g0m10ca0cl0mu14l1pf27o2i82hv26r1o613g0m30ce0cm0ms14i1p927j2i42hv26t1o913j0m30cd0cn0mu14i1p827j2i52hw26v1oa13h0m00ca0cm0mw14n1pe27m2i52hu26s1o813h0m00cb0cm0mw14m1pd27j2i02hp26p1o813j0m40ce0cn0mv14l1pc27l2i32hs26r1o913j0m20cc0cl0ms14k1pd27n2i62hv26s1o713h0m00cb0cl0mt14j1pc27n2i52hv26q1o613e0m00cb0cn0mw14m1pd27n2i62hv26t1o813f0m00cb0ck0mt14i1pa27j2i42hv26w1oc13j0m20c80ci0mq14g1p927k2i62hx26x1od13k0m10c80cg0mp14i1pc27n2i82hx26v1oc13l0m30ca0ci0mp14e1p727h2i32ht26u1oc13m0m70cf0cl0mq14d1p427f2i32hw26y1of13m0m60cc0ck0mq14e1p627g2i42hx26y1oe13n0m40cb0ck0mq14f1p727g2i02ht26u1od13n0m50cd0cm0mt14h1p927i2i12ht26u1od13o0m70cf0ck0mq14e1p527g2i12ht26v1of13p0m80cf0ck0mp14d1p427g2i32hw26w1oe13l0m50cd0cl0mr14g1p827j2i62hy26w1oc13l0m40cc0cm0ms14f1p627f2i02hu26v1oe13n0m60ce0cl0ms14e1p527e2i22hw26z1oi13p0m50ca0ch0mn14e1p727i2i62hy2701oi13q0m60ca0cg0mm14c1p527i2i32hv26w1og13p0m80ce0ck0mn14c1p427h2i42hx26y1og13q0m90cg0ck0mm1491p027c2i22hy2701oj13s0m90cf0ck0mn1491oz27a2i12hy2701oj13r0m70cc0cj0mo14d1p427e2i32hw2701oi13r0m80cd0cj0mo14c1p227c2hx2hs26w1oi13t0mc0cg0cl0mn1491p027a2hz2hv26y1oj13t0ma0ce0ci0mm1481p227f2i42hy2701oi13r0m80ce0cj0mn1491p127d2i12hv26x1og13p0m8";

  // mockups/shared/saju/terms.js
  var table = null;
  function terms() {
    if (table) return table;
    const out = [TERMS_START];
    for (let i = 0; i < TERMS_PACKED.length; i += 3)
      out.push(
        out[out.length - 1] + TERMS_BASE + parseInt(TERMS_PACKED.slice(i, i + 3), 36)
      );
    return table = out;
  }
  function termAt(utcMs) {
    const t = terms();
    const min = utcMs / 6e4;
    let lo = 0;
    let hi = t.length - 1;
    while (lo < hi) {
      const mid = lo + hi + 1 >> 1;
      if (t[mid] <= min) lo = mid;
      else hi = mid - 1;
    }
    const year = TERMS_FIRST_YEAR + Math.floor(lo / 12);
    const index = lo % 12;
    return {
      /** 0 소한, 1 입춘 … 11 대설 */
      index,
      /** 입춘 전이면 전해 */
      sajuYear: index >= 1 ? year : year - 1,
      /** 소한이 축월, 입춘이 인월 … 대설이 자월 */
      monthBranch: (index + 1) % 12
    };
  }
  function termBetween(fromMs, toMs) {
    const t = terms();
    return t.some((m) => m * 6e4 >= fromMs && m * 6e4 < toMs);
  }

  // mockups/shared/saju/time.js
  var SEOUL = "Asia/Seoul";
  var SEOUL_SOLAR = 510;
  var formats = /* @__PURE__ */ new Map();
  function format(timeZone) {
    let f = formats.get(timeZone);
    if (!f) {
      f = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      });
      formats.set(timeZone, f);
    }
    return f;
  }
  function parts(timeZone, utcMs) {
    const p = {};
    for (const part of format(timeZone).formatToParts(utcMs))
      if (part.type !== "literal") p[part.type] = +part.value;
    return p;
  }
  function wallAt(timeZone, utcMs) {
    const p = parts(timeZone, utcMs);
    return { y: p.year, m: p.month, d: p.day, h: p.hour, min: p.minute };
  }
  function zoneOffset(timeZone, utcMs) {
    const p = parts(timeZone, utcMs);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return (asUtc - Math.floor(utcMs / 1e3) * 1e3) / 6e4;
  }
  function wallToUtc(timeZone, w) {
    const asUtc = Date.UTC(w.y, w.m - 1, w.d, w.h, w.min);
    let utc = asUtc - zoneOffset(timeZone, asUtc) * 6e4;
    utc = asUtc - zoneOffset(timeZone, utc) * 6e4;
    return utc;
  }
  function solarOffset(timeZone, utcMs) {
    if (timeZone === SEOUL) return SEOUL_SOLAR;
    const y = new Date(utcMs).getUTCFullYear();
    return Math.min(
      zoneOffset(timeZone, Date.UTC(y, 0, 1)),
      zoneOffset(timeZone, Date.UTC(y, 6, 1))
    );
  }

  // mockups/shared/saju/chart.js
  function yearMonth(utcMs) {
    const t = termAt(utcMs);
    const year = pillarAt(t.sajuYear - 4);
    return { year, month: monthPillar(year.stem, t.monthBranch) };
  }
  function dayHour(solar) {
    const jdn = jdnOf(solar.y, solar.m, solar.d) + (solar.h >= 23 ? 1 : 0);
    const day = dayPillarOfJdn(jdn);
    return { day, hour: hourPillar(day.stem, Math.floor((solar.h + 1) / 2) % 12) };
  }
  function birthChart(date, time, timeZone) {
    const wall = { ...date, h: time?.h ?? 12, min: time?.min ?? 0 };
    const utc = wallToUtc(timeZone, wall);
    const solar = wallAt("UTC", utc + solarOffset(timeZone, utc) * 6e4);
    const { day, hour } = dayHour(solar);
    const termEdge = !time && termBetween(
      wallToUtc(timeZone, { ...date, h: 0, min: 0 }),
      wallToUtc(timeZone, { ...date, h: 23, min: 59 }) + 6e4
    );
    return { ...yearMonth(utc), day, hour: time ? hour : null, termEdge };
  }
  function todayOf(now, timeZone) {
    const w = wallAt(timeZone, now);
    const day = dayPillarOfJdn(jdnOf(w.y, w.m, w.d));
    return {
      date: { y: w.y, m: w.m, d: w.d },
      ...yearMonth(now),
      day,
      hours: Array.from({ length: 12 }, (_, b) => hourPillar(day.stem, b)),
      shift: zoneOffset(timeZone, now) - solarOffset(timeZone, now)
    };
  }

  // mockups/shared/saju/reading.js
  var DOMAIN_KEYS = ["money", "love", "health", "work", "rel"];
  function favorFor(yong) {
    const favor = [0, 0, 0, 0, 0];
    favor[yong] = 1;
    favor[(yong + 4) % 5] = 0.6;
    favor[(yong + 3) % 5] = -1;
    favor[(yong + 2) % 5] = -0.6;
    return favor;
  }
  var share = (a, b) => a + b > 0 ? a / (a + b) : 0.5;
  function favorOf(chart) {
    const count = [0, 0, 0, 0, 0];
    const pillars = [chart.year, chart.month, chart.day, chart.hour].filter(
      (p) => p !== null
    );
    for (const p of pillars) {
      if (p !== chart.day) count[stemElement(p.stem)] += 1;
      count[branchElement(p.branch)] += p === chart.month ? 2 : 1;
    }
    const me = stemElement(chart.day.stem);
    const group = (g) => count[(me + g) % 5];
    const support = group(0) + group(4);
    const drain = group(1) + group(2) + group(3);
    const strong = Math.max(
      0,
      Math.min(1, 0.5 + (share(support, drain) - 0.5) * 4)
    );
    const a = share(group(4), group(0));
    const b = share(group(2), Math.max(group(1), group(3)));
    const mix = [
      [strong * a, 2],
      [strong * (1 - a), 3],
      [(1 - strong) * b, 0],
      [(1 - strong) * (1 - b), 4]
    ];
    const favor = [0, 0, 0, 0, 0];
    for (const [w, use] of mix)
      favorFor((me + use) % 5).forEach((v, e) => favor[e] += w * v);
    return { count, favor };
  }
  var NATURE = {
    money: {
      bigyeon: -0.4,
      geopjae: -1,
      siksin: 0.5,
      sanggwan: 0.2,
      pyeonjae: 1,
      jeongjae: 0.8,
      pyeongwan: -0.2,
      jeonggwan: 0,
      pyeonin: -0.3,
      jeongin: 0
    },
    love: {
      bigyeon: -0.2,
      geopjae: -0.6,
      siksin: 0.4,
      sanggwan: 0,
      pyeonjae: 0,
      jeongjae: 0,
      pyeongwan: 0,
      jeonggwan: 0,
      pyeonin: -0.4,
      jeongin: 0.2
    },
    health: {
      bigyeon: 0.3,
      geopjae: -0.2,
      siksin: 0.6,
      sanggwan: -0.3,
      pyeonjae: -0.1,
      jeongjae: 0,
      pyeongwan: -0.8,
      jeonggwan: 0.1,
      pyeonin: -0.2,
      jeongin: 0.6
    },
    work: {
      bigyeon: 0,
      geopjae: -0.3,
      siksin: 0.4,
      sanggwan: -0.2,
      pyeonjae: 0.2,
      jeongjae: 0.3,
      pyeongwan: 0.6,
      jeonggwan: 1,
      pyeonin: 0.2,
      jeongin: 0.5
    },
    rel: {
      bigyeon: 0.4,
      geopjae: -0.2,
      siksin: 0.5,
      sanggwan: -0.6,
      pyeonjae: 0.4,
      jeongjae: 0.2,
      pyeongwan: -0.4,
      jeonggwan: 0.3,
      pyeonin: -0.3,
      jeongin: 0.5
    }
  };
  function loveNature(g, gender) {
    const spouse = { f: 3, m: 2 };
    const star = (group) => tenGodGroup(g) === group ? g.startsWith("jeong") ? 1 : 0.6 : 0;
    const base = NATURE.love[g];
    if (gender in spouse) return base + star(spouse[gender]);
    return base + (star(2) + star(3)) / 2;
  }
  var SOURCES = [
    { pick: (t) => t.day, w: [0.32, 0.28] },
    { pick: (t) => t.month, w: [0.12, 0.12] },
    { pick: (t) => t.year, w: [0.08, 0.08] }
  ];
  function relations(chart, today) {
    const b = today.day.branch;
    const out = [];
    const add = (reason, effect) => out.push({ reason, effect });
    const natal = [
      ["year", chart.year],
      ["month", chart.month],
      ["day", chart.day],
      ["hour", chart.hour]
    ];
    for (const [at, p] of natal) {
      if (!p) continue;
      if (isSixCombine(b, p.branch))
        add(
          at === "day" ? "combineDay" : "combineOther",
          at === "day" ? { love: 7, rel: 3, health: 2 } : { rel: 3, work: 2 }
        );
      if (isClash(b, p.branch))
        add(
          {
            day: "clashDay",
            month: "clashMonth",
            year: "clashYear",
            hour: "clashHour"
          }[at],
          {
            day: { love: -7, health: -5 },
            month: { work: -5, health: -3 },
            year: { rel: -4 },
            hour: { health: -3, love: -2 }
          }[at]
        );
    }
    const branches = natal.flatMap(([, p]) => p ? [p.branch] : []);
    if (branches.some((x) => isHalfTrine(b, x)))
      add("trine", { work: 2, rel: 2, money: 1, health: 1 });
    if ([chart.year.branch, chart.day.branch].some((x) => peachBlossom(x) === b))
      add("peach", { love: 6, rel: 1 });
    if ([chart.year.branch, chart.day.branch].some(
      (x) => isWonjin(b, x) || isHarm(b, x)
    ))
      add("wonjin", { love: -3, rel: -3 });
    if (branches.some((x) => isPunish(b, x)))
      add("punish", { health: -3, rel: -2 });
    if (isStemCombine(today.day.stem, chart.day.stem))
      add("stemCombine", { love: 5, rel: 2 });
    if (isStemClash(today.day.stem, chart.day.stem))
      add("stemClash", { health: -3, work: -3 });
    return out;
  }
  var clamp = (v, a, b) => Math.round(Math.max(a, Math.min(b, v)));
  function readDay(chart, today, gender) {
    const dm = chart.day.stem;
    const { count, favor } = favorOf(chart);
    const raw = (key, g) => key === "love" ? loveNature(g, gender) : NATURE[key][g];
    const mean = Object.fromEntries(
      DOMAIN_KEYS.map((key) => [
        key,
        TEN_GODS.reduce((a, g) => a + raw(key, g), 0) / TEN_GODS.length
      ])
    );
    const nature = (key, g) => raw(key, g) - mean[key];
    const flows = SOURCES.flatMap(({ pick, w }) => {
      const p = pick(today);
      return [
        { fit: favor[stemElement(p.stem)], god: tenGodOf(dm, p.stem), w: w[0] },
        {
          fit: favor[branchElement(p.branch)],
          god: tenGodOf(dm, branchStem(p.branch)),
          w: w[1]
        }
      ];
    });
    const fit = flows.reduce((a, f) => a + f.w * f.fit, 0);
    const rels = relations(chart, today);
    const domains = DOMAIN_KEYS.map((key) => {
      const natureSum = flows.reduce((a, f) => a + f.w * nature(key, f.god), 0);
      const relSum = rels.reduce((a, r) => a + (r.effect[key] ?? 0), 0);
      const causes = [
        ...rels.map((r) => ({ why: r.reason, size: r.effect[key] ?? 0 })),
        ...flows.map((f) => ({
          why: f.god,
          size: f.w * nature(key, f.god) * 14
        }))
      ].filter((c) => Math.abs(c.size) >= 1).sort((a, b) => Math.abs(b.size) - Math.abs(a.size));
      causes.push({
        why: fit >= 0 ? "favorable" : "unfavorable",
        size: fit
      });
      return {
        key,
        score: clamp(58 + fit * 30 + natureSum * 14 + relSum, 24, 97),
        up: causes.find((c) => c.size > 0)?.why ?? null,
        down: causes.find((c) => c.size < 0)?.why ?? null
      };
    });
    const total = Math.round(
      domains.reduce((a, d) => a + d.score, 0) / domains.length
    );
    const hours = today.hours.map((p) => {
      const hourFit = 0.55 * favor[stemElement(p.stem)] + 0.45 * favor[branchElement(p.branch)];
      const relTo = (natal, [combine, clash, trine]) => isSixCombine(p.branch, natal) ? combine : isClash(p.branch, natal) ? clash : isHalfTrine(p.branch, natal) ? trine : 0;
      const rel = relTo(chart.day.branch, [6, -8, 3]) + (chart.hour ? relTo(chart.hour.branch, [3, -4, 2]) : 0);
      return clamp(total + hourFit * 20 + rel, 28, 97);
    });
    const awake = hours.slice(3, 11);
    const ties = awake.flatMap(
      (v, i) => v === Math.max(...awake) ? [i + 3] : []
    );
    const best = ties[(today.day.stem + chart.day.branch) % ties.length];
    return {
      tenGod: tenGodOf(dm, today.day.stem),
      domains,
      total,
      hours,
      best,
      elements: count,
      yong: favor.indexOf(Math.max(...favor))
    };
  }

  // node_modules/korean-lunar-calendar/dist/korean-lunar-calendar.mjs
  var LUNAR_CALENDAR_DATA = {
    KOREAN_LUNAR_MIN_VALUE: 10000101,
    KOREAN_LUNAR_MAX_VALUE: 20501118,
    KOREAN_SOLAR_MIN_VALUE: 10000213,
    KOREAN_SOLAR_MAX_VALUE: 20501231,
    KOREAN_LUNAR_BASE_YEAR: 1e3,
    SOLAR_LUNAR_DAY_DIFF: 43,
    LUNAR_SMALL_MONTH_DAY: 29,
    LUNAR_BIG_MONTH_DAY: 30,
    SOLAR_SMALL_YEAR_DAY: 365,
    SOLAR_BIG_YEAR_DAY: 366,
    SOLAR_DAYS: [
      31,
      28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
      29
    ],
    KOREAN_CHEONGAN: [
      44049,
      51012,
      48337,
      51221,
      47924,
      44592,
      44221,
      49888,
      51076,
      44228
    ].map((c) => String.fromCharCode(c)),
    KOREAN_GANJI: [
      51088,
      52629,
      51064,
      47896,
      51652,
      49324,
      50724,
      48120,
      49888,
      50976,
      49696,
      54644
    ].map((c) => String.fromCharCode(c)),
    KOREAN_GAPJA_UNIT: [
      45380,
      50900,
      51068
    ].map((c) => String.fromCharCode(c)),
    CHINESE_CHEONGAN: [
      30002,
      20057,
      19993,
      19969,
      25098,
      24049,
      24218,
      36763,
      22764,
      30328
    ].map((c) => String.fromCharCode(c)),
    CHINESE_GANJI: [
      23376,
      19985,
      23493,
      21359,
      36784,
      24051,
      21320,
      26410,
      30003,
      37193,
      25100,
      20133
    ].map((c) => String.fromCharCode(c)),
    CHINESE_GAPJA_UNIT: [
      24180,
      26376,
      26085
    ].map((c) => String.fromCharCode(c)),
    INTERCALATION_STR: [50980, 38287].map((c) => String.fromCharCode(c)),
    KOREAN_LUNAR_DATA: [
      2194016855,
      2197734699,
      2193886506,
      2194017621,
      3271595437,
      2193884522,
      2194016621,
      2197837021,
      3267626157,
      2193885773,
      2197827149,
      2193885990,
      3271600982,
      2194016981,
      2193883994,
      2197842298,
      3267758427,
      2193884315,
      2197834395,
      2193885771,
      3271674533,
      2193884842,
      2194016981,
      2197852893,
      3267625653,
      2194016599,
      2197705902,
      2194017431,
      3267626571,
      2197759306,
      2194017705,
      2197857974,
      3267757677,
      2193883758,
      2197907758,
      2193885486,
      3267628182,
      2197835157,
      2193886538,
      2197867881,
      3267627864,
      2194148715,
      2197918315,
      2193883741,
      3267627307,
      2197838507,
      2193885845,
      2193886026,
      3271696043,
      2193883861,
      2197927258,
      2194015419,
      3267625563,
      2197845303,
      2193884459,
      2193884821,
      3271571285,
      2193884842,
      2198063797,
      2193883765,
      3267626166,
      2197850718,
      2193885782,
      2193886502,
      3271581350,
      2194017621,
      2193884586,
      2197822826,
      3267758445,
      2197861551,
      2193884317,
      2193885773,
      3271589165,
      2193885862,
      2194017109,
      2197833173,
      3267625818,
      2194016605,
      2197885299,
      2193884251,
      3271596623,
      2193884747,
      2193885861,
      2197842793,
      3267757749,
      2193883866,
      2197826230,
      2194016567,
      3271476375,
      2194017431,
      2193884747,
      2197718698,
      3267759525,
      2193884596,
      2198030957,
      2193883822,
      3267628641,
      2197826862,
      2193886358,
      2197855565,
      2193886538,
      2194017637,
      2197906837,
      2194015581,
      3267625581,
      2197826141,
      2193885483,
      2197858967,
      3267627669,
      2193886026,
      2197850970,
      2194016981,
      3267757403,
      2197832375,
      2193884247,
      2193884459,
      3271564587,
      2193884821,
      2197853997,
      2193884586,
      3267758773,
      2197837037,
      2193884342,
      2194016855,
      3271504974,
      2193886502,
      2197929618,
      2194017621,
      3267626410,
      2197850554,
      2194016621,
      2193884334,
      3271576221,
      2193885773,
      2193886501,
      2197827365,
      3267627860,
      2198056297,
      2193883866,
      2194016605,
      3271648411,
      2193884315,
      2193885771,
      2197834571,
      3267626661,
      2197863251,
      2193884852,
      2194016950,
      3271657814,
      2194016663,
      2193884311,
      2197833367,
      3267626315,
      2197735077,
      2194017701,
      2193884588,
      3271797429,
      2193883758,
      2193885486,
      2197843118,
      3267628182,
      2193886538,
      2197827402,
      2194017621,
      3271603563,
      2194015579,
      2193883741,
      2197846333,
      3267627303,
      2193885845,
      2197904661,
      2193886026,
      3267758933,
      2197885653,
      2194015451,
      2197721694,
      3267758679,
      2193884459,
      2197842603,
      2193884821,
      3267626666,
      2197830570,
      2194016949,
      2197861559,
      3267626158,
      2194016855,
      2197714222,
      2193886502,
      3267759763,
      2197837525,
      2193884586,
      2194016693,
      3271566701,
      2193884334,
      2197924429,
      2193885773,
      3267628326,
      2197843301,
      2193886034,
      2194017642,
      3271567066,
      2194016605,
      2197931165,
      2193884315,
      3267627595,
      2197850795,
      2193884837,
      2193886036,
      3271576500,
      2194016950,
      2194016603,
      2197824823,
      3267626135,
      2197853775,
      2193884491,
      2193884837,
      3271653061,
      2193884588,
      2194016950,
      2197895278,
      3267627310,
      2197867671,
      2193886358,
      2193886538,
      3271593386,
      2194017109,
      2193884522,
      2197969627,
      3267625565,
      2193885486,
      2197826859,
      2193885845,
      3271597389,
      2193885994,
      2194017109,
      2197845365,
      3267626202,
      2194016859,
      2197833047,
      2193884459,
      3271674515,
      2193884819,
      2193884842,
      2197850842,
      3267758821,
      2193884342,
      2197834414,
      2194016855,
      3267626279,
      2197759270,
      2194017875,
      2197857995,
      3267626410,
      2194015661,
      2197906605,
      2193884334,
      3267627598,
      2197835085,
      2193886502,
      2197863763,
      3267627858,
      2194017130,
      2197919082,
      2194015575,
      3267626141,
      2197903899,
      2193885771,
      2193885861,
      3271564965,
      2193886034,
      2197863258,
      2194016950,
      3267758427,
      2197841079,
      2193884311,
      2193884747,
      3271571275,
      2193884837,
      2197862067,
      2193884588,
      3267758774,
      2197914285,
      2193884318,
      2193885773,
      3271581003,
      2193885989,
      2193886034,
      2197892690,
      3267758938,
      2197858654,
      2194016603,
      2193884315,
      3271584343,
      2193885771,
      2193885861,
      2197834661,
      3267626708,
      2197867222,
      2194016950,
      2194016567,
      2197849247,
      2193884311,
      2193884747,
      2197706442,
      3267759525,
      2193884586,
      2197822828,
      2194016878,
      3271604527,
      2193885486,
      2193886358,
      2197847381,
      3267628362,
      2194017621,
      2197894485,
      2193884522,
      3267758701,
      2197822045,
      2193885483,
      2197850715,
      3267627669,
      2193885994,
      2197904170,
      2194016981,
      3267626202,
      2197822650,
      2194016855,
      2197853487,
      3267626279,
      2193884819,
      2197845683,
      2193884842,
      3267758773,
      2197828981,
      2193884342,
      2197867111,
      3267627566,
      2193886486,
      2197851798,
      2193886538,
      3267759530,
      2197837290,
      2194015597,
      2193884334,
      3271632989,
      2193885741,
      2197859607,
      2193885861,
      3267627858,
      2197847412,
      2194016986,
      2194015581,
      3271570747,
      2193884251,
      2193885739,
      2197887531,
      3267627685,
      2197855061,
      2193884850,
      2194016982,
      3271644470,
      2194016567,
      2193884247,
      2197830231,
      3267626283,
      2197727910,
      2194017685,
      2193884586,
      3271654060,
      2194016878,
      2193884462,
      2197830830,
      3267627606,
      2197863723,
      2193886506,
      2194017621,
      3271595437,
      2193884522,
      2194016877,
      2197837149,
      3267626283,
      2193885837,
      2197827157,
      2193885994,
      3271600982,
      2194016981,
      2193884378,
      2197842554,
      3267758679,
      2193884443,
      2197899799,
      2193884755,
      3271673513,
      2193884586,
      2194016949,
      2197852861,
      3267625654,
      2194016823,
      2197706030,
      2193886486,
      2194017867,
      2197698386,
      2194017706,
      2197927348,
      3267757421,
      2193883822,
      2197846589,
      2193885741,
      3267628309,
      2197835157,
      2193886034,
      2197867369,
      3267758810,
      2194015581,
      2197918299,
      2193884251,
      3267627563,
      2197838507,
      2193885845,
      2193886034,
      3271564970,
      2194016950,
      2197865819,
      2194015415,
      3267626071,
      2197845303,
      2193884459,
      2193884821,
      3271640725,
      2193884586,
      2197867189,
      2194016878,
      3267626158,
      2197850718,
      2193885782,
      2193886506,
      3271585450,
      2194017621,
      2193884522,
      2197891418,
      3267758429,
      2197861551,
      2193884315,
      2193885773,
      3271589165,
      2193885994,
      2194017109,
      2197833173,
      3267625690,
      2194016603,
      2197885271,
      2193884315,
      3271596623,
      2193884747,
      2193884841,
      2197842666,
      3267757749,
      2193883830,
      2197826222,
      2194016567,
      3271537814,
      2193886358,
      2194017867,
      2197714610,
      3267759530,
      2194015661,
      2197828461,
      2193883758,
      3267627310,
      2197826861,
      2193886357,
      2197855565,
      3267627850,
      2194017129,
      2197906778,
      2194015579,
      3267625565,
      2197826139,
      2193885483,
      2197858967,
      3267626645,
      2193885002,
      2197850970,
      2194016950,
      3267757371,
      2197832375,
      2193883735,
      2193884459,
      3271564587,
      2193884821,
      2197853869,
      2193884586,
      3267758773,
      2197837037,
      2193884334,
      2194016855,
      3271504974,
      2193886506,
      2197929364,
      2194017109,
      2193884522,
      2197846394,
      2194016605,
      2193884334,
      3271576219,
      2193885773,
      2193886501,
      2197887658,
      3267758933,
      2197853549,
      2193883866,
      2194016603,
      3271578807,
      2193884311,
      2193885771,
      2197834571,
      3267626665,
      2197867221,
      2194015669,
      2193883830,
      3271592286,
      2194016559,
      2193884311,
      2197702294,
      3267628362,
      2197868197,
      2194017641,
      2194015597,
      3271664309,
      2193883758,
      2193885486,
      2197843117,
      3267628181,
      2193886538,
      2197827402,
      2194017113,
      3271607661,
      2194015579,
      2193883741,
      2197846331,
      3267627307,
      2193885845,
      2197904149,
      2193884874,
      3267758805,
      2197885622,
      2194015419,
      2197852767,
      3267625559,
      2193884459,
      2197711530,
      2194017941,
      3267626666,
      2197830570,
      2194016949,
      2197861559,
      3267626158,
      2194016855,
      2197714221,
      2193886502,
      3267759509,
      2197837269,
      2193884522,
      2194016621,
      3271566685,
      2193884334,
      2197858895,
      2193885773,
      3267628325,
      2197843305,
      2194017109,
      2193883994,
      3271568058,
      2194016603,
      2197931163,
      2193884311,
      3267627595,
      2197850923,
      2193884837,
      2193884884,
      3271772853,
      2193883830,
      2194016567,
      2197824815,
      3267626135,
      2197722702,
      2193886538,
      2194017957,
      3271648937,
      2194015597,
      2193883830,
      2197895262,
      3267627310,
      2197863575,
      2193885845,
      2193886538,
      3271593386,
      2194017101,
      2194015595,
      2197832411,
      3267625565,
      2193885485,
      2197826859,
      2193885845,
      3271596877,
      2193884842,
      2194016981,
      2197841269,
      3267757243,
      2193883739,
      2197894231,
      2193884459,
      3271539348,
      2194017941,
      2193884842,
      2197850842,
      3267758517,
      2193884342,
      2197834414,
      2194016847,
      3267495206,
      2197892390,
      2194017621,
      2197923241,
      3267626346,
      2194016621,
      2197906589,
      2193884318,
      3267627597,
      2197835085,
      2193886501,
      2197863763,
      3267627860,
      2194017114,
      2197915994,
      2194016603,
      3267626139,
      2197834391,
      2193885771,
      2193885861,
      3271564965,
      2193884884,
      2197994203,
      2193883830,
      3267758391,
      2197841071,
      2193884311,
      2193884747,
      3271440202,
      2194017701,
      2197862069,
      2194015597,
      3267625646,
      2197846334,
      2193885486,
      2193886358,
      3271646485,
      2193886538,
      2194017701,
      2197894485,
      3267626346,
      2197846650,
      2194016861,
      2193885485,
      3271584427,
      2193885845,
      2193886026,
      2197834666,
      3267758805,
      2193884506,
      2197891258,
      2194016859,
      3271587127,
      2193884459,
      2193884819,
      2197903125,
      3267626666,
      2194016981,
      2197829045,
      2193884342,
      3271592542,
      2193885774,
      2193886502,
      2197843622,
      3267628370,
      2194017706,
      2197898858,
      2194015597,
      3267626158,
      2197830301,
      2193885773,
      2197847339,
      3267627813,
      2193886546,
      2197904724,
      2194017114,
      3267757405,
      2197828955,
      2193884315,
      2197845591,
      2193885771,
      2193885861,
      2197842789,
      2193884882,
      3267758810,
      2197833142,
      2194016567,
      2193884311,
      3271571095,
      2193884749,
      2197714602,
      2194017701,
      3267626410,
      2197838572,
      2194016942,
      2193885486,
      3271572782,
      2193886358,
      2197916997,
      2193886538,
      3267759445,
      2197906837,
      2193884522,
      2194016877,
      3271574877,
      2193884461,
      2193885845,
      2197896341,
      3267627850,
      2197912394,
      2194016981,
      2193884506,
      3271645754,
      2194016859,
      2193884459,
      2197899799,
      3267626643,
      2197853867,
      2193884842,
      2194016949,
      3271582965,
      2193884342,
      2194016855,
      2197701934,
      3267628310,
      2194017939,
      2197698386,
      2194017706,
      3271652778,
      2194015597,
      2193884334,
      2197903901,
      3267627565,
      2193886485,
      2197835173,
      2193886034,
      3271597418,
      2194016986,
      2194015581,
      2197906075,
      3267626075,
      2193885739,
      2197838635,
      2193885845,
      3267627858,
      2197891762,
      2194016982,
      2197910870,
      3267757367,
      2193884247,
      2197837399,
      2193884459,
      3267626645,
      2197829525,
      2193884586,
      2197858998,
      3267758701,
      2193884334,
      2197842542,
      2193885782,
      3267628330,
      2197839530,
      2194017621,
      2193884586,
      3271572330,
      2194016877,
      2197845181,
      2193884331,
      3267627661,
      2197839189,
      2193885994,
      2194017109,
      3271574997,
      2193884378,
      2194016605,
      2197824855,
      3267626139,
      2197842583,
      2193884747,
      2193884841,
      2197834666,
      2194015925,
      2193883834,
      2197826230,
      3267758391,
      2197710126,
      2193886486,
      2194017867,
      3271448274,
      2194017705,
      2194015669,
      2197828461,
      3267625646,
      2193885742,
      2197827117,
      2193886357,
      3271585109,
      2193886034,
      2194017129,
      2197833178,
      3267757405,
      2193883741,
      2197830235,
      2193885739,
      3271654027,
      2193885845,
      2193886026,
      2197904170,
      3267758805,
      2194015579,
      2197832375,
      2193883735,
      3271595311,
      2193884459,
      2193884821,
      2197841621,
      3267626410,
      2194016949,
      2197833069,
      2193884334,
      3267758679,
      2197763158,
      2193886506,
      2197913226,
      3267759445,
      2193884586,
      2197838554,
      2194016605,
      3267626158,
      2197834411,
      2193885773,
      2197851435,
      3267627817,
      2194017109,
      2197845365,
      2193883866,
      3267758429,
      2197837015,
      2193884315,
      2193885771,
      3271637579,
      2193884841,
      2197850841,
      2194015925,
      3267625654,
      2197903670,
      2194016567,
      2193884311,
      3271444118,
      2193886794,
      2197860006,
      2194017705,
      3267757485,
      2197906093,
      2193883822,
      2193885486,
      3271580845,
      2193886357,
      2193886538,
      2197896522,
      3267758953,
      2197845370,
      2194015579,
      2193883741,
      3271579995,
      2193885483,
      2193885845,
      2197835157,
      3267627850,
      2194017109,
      2197825237,
      2194015579,
      3271582327,
      2193883735,
      2193884459,
      2197707434,
      3267759765,
      2193884842,
      2197830570,
      2194016949,
      2197849277,
      2193884334,
      2194016855,
      2197706061,
      3267628326,
      2194017685,
      2197898837,
      2193884522,
      3267758509,
      2197824861,
      2193884334,
      2197842523,
      3267627597,
      2193886501,
      2197839273,
      2194017109,
      3267626346,
      2197826266,
      2194016605,
      2197845179,
      3267626139,
      2193885771,
      2197838667,
      2193884841,
      3267627732,
      2197965749,
      2193883830,
      2194016603,
      3271566647,
      2193884311,
      2197710422,
      2193886794,
      3267759781,
      2197903017,
      2194015669,
      2193883830,
      3271637166,
      2193885486,
      2197912717,
      2193886357,
      3267628362,
      2197908874,
      2194017129,
      2194015597,
      3271639643,
      2193883741,
      2193885485,
      2197826859,
      3267627669,
      2197847381,
      2193886026,
      2194017109,
      3271644501,
      2194015451,
      2193883739,
      2197895255,
      3267626283,
      2197850779,
      2193884821,
      2193884842,
      3271584490,
      2194016949,
      2193884342,
      2197834414,
      3267758679,
      2193884455,
      2197698342,
      2194017685,
      3271587509,
      2193884522,
      2194016685,
      2197837021,
      3267626158,
      2193885774,
      2197835085,
      2193886501,
      3271593305,
      2193886036,
      2194017642,
      2197907802,
      3267758427,
      2193884315,
      2197834395,
      2193885771,
      3271600935,
      2193884837,
      2193884884,
      2197973877,
      3267625654,
      2194016603,
      2197836983,
      2193884311,
      3267626571,
      2197698378,
      2194017957,
      2197849817,
      3267757485,
      2193883830,
      2197838190,
      2193885486,
      3267628182,
      2197835413,
      2193886538,
      2194017701,
      3271567189,
      2193884524,
      2197977787,
      2193883741,
      3267627309,
      2197839019,
      2193885845,
      2193886026,
      3271637834,
      2194017109,
      2197853533,
      2193884346,
      3267758683,
      2197837143,
      2193884459,
      2193885845,
      3271576469,
      2193884842,
      2194016981,
      2197825205,
      3267626166,
      2197842542,
      2194016855,
      2193884455,
      3271448230,
      2194017683,
      2193884586,
      2197830506,
      3267758445,
      2197861551,
      2193884334,
      2193885773,
      3271650573,
      2193886501,
      2193886546,
      2197839316,
      3267758954,
      2194016621,
      2197824859,
      2193884315,
      3271588439,
      2193885771,
      2193885989,
      2197904165,
      3267626708,
      2194016986,
      2197895350
    ]
  };
  var GAPJA_OFFSET = {
    YEAR_CHEONGAN: 6,
    YEAR_GANJI: 0,
    MONTH_CHEONGAN: 3,
    MONTH_GANJI: 1,
    DAY_CHEONGAN: 4,
    DAY_GANJI: 2
  };
  var KoreanLunarCalendar = class {
    constructor() {
      this.cumulativeLunarYearDays = /* @__PURE__ */ new Map();
      this.cumulativeSolarYearDays = /* @__PURE__ */ new Map();
      this.solarCalendar = {
        year: 0,
        month: 0,
        day: 0
      };
      this.lunarCalendar = {
        year: 0,
        month: 0,
        day: 0,
        intercalation: false
      };
      const today = /* @__PURE__ */ new Date();
      this.setSolarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
    }
    getLunarData(year) {
      return LUNAR_CALENDAR_DATA.KOREAN_LUNAR_DATA[year - LUNAR_CALENDAR_DATA.KOREAN_LUNAR_BASE_YEAR];
    }
    getLunarIntercalationMonth(lunarData) {
      return lunarData >> 12 & 15;
    }
    getLunarYearDays(year) {
      return this.getLunarData(year) >> 17 & 511;
    }
    getLunarMonthDays(year, month, isIntercalation) {
      const lunarData = this.getLunarData(year);
      return (isIntercalation && this.getLunarIntercalationMonth(lunarData) === month ? (lunarData >> 16 & 1) > 0 : (lunarData >> 12 - month & 1) > 0) ? LUNAR_CALENDAR_DATA.LUNAR_BIG_MONTH_DAY : LUNAR_CALENDAR_DATA.LUNAR_SMALL_MONTH_DAY;
    }
    getLunarDaysBeforeBaseYear(year) {
      return this.accumulateYearDays(year, this.cumulativeLunarYearDays, (y) => this.getLunarYearDays(y));
    }
    getLunarDaysBeforeBaseMonth(year, month, isIntercalation) {
      let days = 0;
      if (year >= LUNAR_CALENDAR_DATA.KOREAN_LUNAR_BASE_YEAR && month > 0) {
        for (let baseMonth = 1; baseMonth < month + 1; baseMonth++) days += this.getLunarMonthDays(year, baseMonth, false);
        if (isIntercalation) {
          const intercalationMonth = this.getLunarIntercalationMonth(this.getLunarData(year));
          if (intercalationMonth > 0 && intercalationMonth < month + 1) days += this.getLunarMonthDays(year, intercalationMonth, true);
        }
      }
      return days;
    }
    getLunarAbsDays(year, month, day, isIntercalation) {
      let days = this.getLunarDaysBeforeBaseYear(year - 1) + this.getLunarDaysBeforeBaseMonth(year, month - 1, true) + day;
      if (isIntercalation && this.getLunarIntercalationMonth(this.getLunarData(year)) === month) days += this.getLunarMonthDays(year, month, false);
      return days;
    }
    isSolarIntercalationYear(lunarData) {
      return (lunarData >> 30 & 1) > 0;
    }
    getSolarYearDays(year) {
      return this.isSolarIntercalationYear(this.getLunarData(year)) ? LUNAR_CALENDAR_DATA.SOLAR_BIG_YEAR_DAY : LUNAR_CALENDAR_DATA.SOLAR_SMALL_YEAR_DAY;
    }
    getSolarMonthDays(year, month) {
      if (month === 2 && this.isSolarIntercalationYear(this.getLunarData(year))) return LUNAR_CALENDAR_DATA.SOLAR_DAYS[12];
      return LUNAR_CALENDAR_DATA.SOLAR_DAYS[month - 1];
    }
    getSolarDaysBeforeBaseYear(year) {
      return this.accumulateYearDays(year, this.cumulativeSolarYearDays, (y) => this.getSolarYearDays(y));
    }
    accumulateYearDays(year, cache, perYear) {
      const cached = cache.get(year);
      if (cached !== void 0) return cached;
      const baseYear = LUNAR_CALENDAR_DATA.KOREAN_LUNAR_BASE_YEAR;
      const previous = cache.get(year - 1);
      let days = 0;
      if (previous !== void 0 && year > baseYear) days = previous + perYear(year);
      else for (let y = baseYear; y < year + 1; y++) days += perYear(y);
      cache.set(year, days);
      return days;
    }
    getSolarDaysBeforeBaseMonth(year, month) {
      let days = 0;
      for (let baseMonth = 1; baseMonth < month + 1; baseMonth++) days += this.getSolarMonthDays(year, baseMonth);
      return days;
    }
    getSolarAbsDays(year, month, day) {
      return this.getSolarDaysBeforeBaseYear(year - 1) + this.getSolarDaysBeforeBaseMonth(year, month - 1) + day - LUNAR_CALENDAR_DATA.SOLAR_LUNAR_DAY_DIFF;
    }
    setSolarDateByLunarDate(lunarYear, lunarMonth, lunarDay, isIntercalation) {
      const absDays = this.getLunarAbsDays(lunarYear, lunarMonth, lunarDay, isIntercalation);
      const solarYear = absDays < this.getSolarAbsDays(lunarYear + 1, 1, 1) ? lunarYear : lunarYear + 1;
      let solarMonth = 0;
      let solarDay = 0;
      for (let month = 12; month > 0; month--) {
        const absDaysByMonth = this.getSolarAbsDays(solarYear, month, 1);
        if (absDays >= absDaysByMonth) {
          solarMonth = month;
          solarDay = absDays - absDaysByMonth + 1;
          break;
        }
      }
      this.solarCalendar = {
        year: solarYear,
        month: solarMonth,
        day: solarDay
      };
    }
    setLunarDateBySolarDate(solarYear, solarMonth, solarDay) {
      const absDays = this.getSolarAbsDays(solarYear, solarMonth, solarDay);
      const lunarYear = absDays >= this.getLunarAbsDays(solarYear, 1, 1, false) ? solarYear : solarYear - 1;
      let lunarMonth = 0;
      let lunarDay = 0;
      let isIntercalation = false;
      for (let month = 12; month > 0; month--) if (absDays >= this.getLunarAbsDays(lunarYear, month, 1, false)) {
        lunarMonth = month;
        if (this.getLunarIntercalationMonth(this.getLunarData(lunarYear)) === month) isIntercalation = absDays >= this.getLunarAbsDays(lunarYear, month, 1, true);
        lunarDay = absDays - this.getLunarAbsDays(lunarYear, lunarMonth, 1, isIntercalation) + 1;
        break;
      }
      this.lunarCalendar = {
        year: lunarYear,
        month: lunarMonth,
        day: lunarDay,
        intercalation: isIntercalation
      };
    }
    checkValidDate(isLunar, isIntercalation, year, month, day) {
      let isValid = false;
      if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
      const dateValue = year * 1e4 + month * 100 + day;
      if ((isLunar ? LUNAR_CALENDAR_DATA.KOREAN_LUNAR_MIN_VALUE : LUNAR_CALENDAR_DATA.KOREAN_SOLAR_MIN_VALUE) <= dateValue && (isLunar ? LUNAR_CALENDAR_DATA.KOREAN_LUNAR_MAX_VALUE : LUNAR_CALENDAR_DATA.KOREAN_SOLAR_MAX_VALUE) >= dateValue) {
        if (month > 0 && month < 13 && day > 0) {
          if (isLunar && isIntercalation && this.getLunarIntercalationMonth(this.getLunarData(year)) !== month) return false;
          const dayLimit = isLunar ? this.getLunarMonthDays(year, month, isIntercalation) : this.getSolarMonthDays(year, month);
          if (!isLunar && year === 1582 && month === 10 && day > 4 && day < 15) return false;
          if (day <= dayLimit) isValid = true;
        }
      }
      return isValid;
    }
    setLunarDate(lunarYear, lunarMonth, lunarDay, isIntercalation) {
      let isValid = false;
      if (this.checkValidDate(true, isIntercalation, lunarYear, lunarMonth, lunarDay)) {
        this.lunarCalendar = {
          year: lunarYear,
          month: lunarMonth,
          day: lunarDay,
          intercalation: isIntercalation && this.getLunarIntercalationMonth(this.getLunarData(lunarYear)) === lunarMonth
        };
        this.setSolarDateByLunarDate(lunarYear, lunarMonth, lunarDay, isIntercalation);
        isValid = true;
      }
      return isValid;
    }
    setSolarDate(solarYear, solarMonth, solarDay) {
      let isValid = false;
      if (this.checkValidDate(false, false, solarYear, solarMonth, solarDay)) {
        this.solarCalendar = {
          year: solarYear,
          month: solarMonth,
          day: solarDay
        };
        this.setLunarDateBySolarDate(solarYear, solarMonth, solarDay);
        isValid = true;
      }
      return isValid;
    }
    computeGapJa() {
      const lunar = this.lunarCalendar;
      const absDays = this.getLunarAbsDays(lunar.year, lunar.month, lunar.day, !!lunar.intercalation);
      if (absDays <= 0) return {
        cheongan: {
          year: 0,
          month: 0,
          day: 0
        },
        ganji: {
          year: 0,
          month: 0,
          day: 0
        }
      };
      const baseYear = LUNAR_CALENDAR_DATA.KOREAN_LUNAR_BASE_YEAR;
      const cheonganLen = LUNAR_CALENDAR_DATA.KOREAN_CHEONGAN.length;
      const ganjiLen = LUNAR_CALENDAR_DATA.KOREAN_GANJI.length;
      const monthCount = lunar.month + 12 * (lunar.year - baseYear);
      return {
        cheongan: {
          year: (lunar.year + GAPJA_OFFSET.YEAR_CHEONGAN - baseYear) % cheonganLen,
          month: (monthCount + GAPJA_OFFSET.MONTH_CHEONGAN) % cheonganLen,
          day: (absDays + GAPJA_OFFSET.DAY_CHEONGAN) % cheonganLen
        },
        ganji: {
          year: (lunar.year + GAPJA_OFFSET.YEAR_GANJI - baseYear) % ganjiLen,
          month: (monthCount + GAPJA_OFFSET.MONTH_GANJI) % ganjiLen,
          day: (absDays + GAPJA_OFFSET.DAY_GANJI) % ganjiLen
        }
      };
    }
    getGapJaIndex() {
      return this.computeGapJa();
    }
    getGapja(isChinese) {
      const inx = this.getGapJaIndex();
      const cheongan = !isChinese ? LUNAR_CALENDAR_DATA.KOREAN_CHEONGAN : LUNAR_CALENDAR_DATA.CHINESE_CHEONGAN;
      const ganji2 = !isChinese ? LUNAR_CALENDAR_DATA.KOREAN_GANJI : LUNAR_CALENDAR_DATA.CHINESE_GANJI;
      const unit = !isChinese ? LUNAR_CALENDAR_DATA.KOREAN_GAPJA_UNIT : LUNAR_CALENDAR_DATA.CHINESE_GAPJA_UNIT;
      const intercalationStr = !isChinese ? `${LUNAR_CALENDAR_DATA.INTERCALATION_STR[0]}${LUNAR_CALENDAR_DATA.KOREAN_GAPJA_UNIT[1]}` : `${LUNAR_CALENDAR_DATA.INTERCALATION_STR[1]}${LUNAR_CALENDAR_DATA.CHINESE_GAPJA_UNIT[1]}`;
      return {
        year: `${cheongan[inx.cheongan.year]}${ganji2[inx.ganji.year]}${unit[0]}`,
        month: `${cheongan[inx.cheongan.month]}${ganji2[inx.ganji.month]}${unit[1]}`,
        day: `${cheongan[inx.cheongan.day]}${ganji2[inx.ganji.day]}${unit[2]}`,
        intercalation: this.lunarCalendar.intercalation ? intercalationStr : ""
      };
    }
    getKoreanGapja() {
      return this.getGapja();
    }
    getChineseGapja() {
      return this.getGapja(true);
    }
    getLunarCalendar() {
      return { ...this.lunarCalendar };
    }
    getSolarCalendar() {
      return { ...this.solarCalendar };
    }
  };

  // mockups/shared/saju/lunar.js
  var calendar = null;
  function lunarToSolar(y, m, d, leap) {
    calendar ??= new KoreanLunarCalendar();
    if (!calendar.setLunarDate(y, m, d, leap)) return null;
    const s = calendar.getSolarCalendar();
    return { y: s.year, m: s.month, d: s.day };
  }

  // mockups/shared/lotto.js
  var STEMS = "갑을병정무기경신임계";
  var STEMS_HANJA = "甲乙丙丁戊己庚辛壬癸";
  var BRANCHES = "자축인묘진사오미신유술해";
  var BRANCHES_HANJA = "子丑寅卯辰巳午未申酉戌亥";
  var ELEMENTS = ["목", "화", "토", "금", "수"];
  var ELEMENTS_HANJA = ["木", "火", "土", "金", "水"];
  var PILLARS = { hour: "시", year: "년", month: "월", day: "일" };
  var HADO = [2, 4, 1, 0, 3, 2, 4, 1, 0, 3];
  var cellElement = (n) => HADO[n % 10];
  var HADO_DIGITS = ["3·8", "2·7", "5·0", "4·9", "1·6"];
  var POOLS = ELEMENTS.map(
    (_, e) => Array.from({ length: 45 }, (_2, i) => i + 1).filter((n) => cellElement(n) === e)
  );
  var TOTAL = 45;
  var PICK = 6;
  var ODDS = 8145060;
  var wrap = (c) => ((c - 1) % TOTAL + TOTAL) % TOTAL + 1;
  var pad2 = (n) => String(n).padStart(2, "0");
  function relation(a, b) {
    return ["same", "gen", "clash", "clash", "gen"][(b - a + 5) % 5];
  }
  var RELATION_KO = { same: "같은 기운", gen: "상생", clash: "상극" };
  var ganji = (p) => STEMS[p.stem] + BRANCHES[p.branch];
  var ganjiHanja = (p) => STEMS_HANJA[p.stem] + BRANCHES_HANJA[p.branch];
  var sexagenary = (p) => {
    for (let n = 0; n < 60; n++) if (n % 10 === p.stem && n % 12 === p.branch) return n;
    return 0;
  };
  function orbit(chart, today, yong) {
    const gi = (yong + 3) % 5;
    const startIndex = sexagenary(today);
    let pos = startIndex % TOTAL + 1;
    const start = pos;
    const taken = /* @__PURE__ */ new Set();
    const moves = [];
    const walk = (pillar, side, plus, land) => {
      const p = chart[pillar];
      const value = side === "stem" ? p.stem + 1 : p.branch + 1;
      const el = side === "stem" ? stemElement(p.stem) : branchElement(p.branch);
      const char = side === "stem" ? STEMS[p.stem] : BRANCHES[p.branch];
      const hanja = side === "stem" ? STEMS_HANJA[p.stem] : BRANCHES_HANJA[p.branch];
      const from = pos;
      const rel = relation(cellElement(from), el);
      const dir = rel === "clash" ? -1 : 1;
      const steps = value + plus;
      const path = Array.from({ length: steps }, (_, i) => wrap(from + dir * (i + 1)));
      pos = wrap(from + dir * steps);
      const skipped = [];
      if (land) {
        while (taken.has(pos) || cellElement(pos) === gi) {
          skipped.push({ cell: pos, why: taken.has(pos) ? "taken" : "gi" });
          pos = wrap(pos + dir);
          path.push(pos);
        }
        taken.add(pos);
      }
      moves.push({
        pillar,
        side,
        char,
        hanja,
        el,
        value,
        plus,
        steps,
        from,
        to: pos,
        fromEl: cellElement(from),
        rel,
        dir,
        path,
        skipped,
        land
      });
    };
    if (chart.hour) {
      walk("hour", "stem", 0, false);
      walk("hour", "branch", 0, false);
    }
    for (const pillar of ["year", "month", "day"]) {
      walk(pillar, "stem", today.stem + 1, true);
      walk(pillar, "branch", today.branch + 1, true);
    }
    const picks = moves.filter((m) => m.land).map((m) => m.to);
    return {
      start,
      startIndex,
      gi,
      moves,
      picks,
      numbers: [...picks].sort((a, b) => a - b)
    };
  }
  var localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
  function solarOf({ y, m, d, calendar: calendar2 }) {
    if (!(y >= 1900) || !(m >= 1 && m <= 12) || !(d >= 1)) return null;
    if (calendar2 === "lunar" || calendar2 === "leap") return lunarToSolar(y, m, d, calendar2 === "leap");
    return d <= new Date(y, m, 0).getDate() ? { y, m, d } : null;
  }
  function timeOf(text) {
    const m = String(text || "").match(/^(\d{1,2})(?::?(\d{2}))?$/);
    if (!m || +m[1] > 23 || m[2] && +m[2] > 59) return null;
    return { h: +m[1], min: m[2] ? +m[2] : 0 };
  }
  function fortuneDraw(input, { now = Date.now(), zone = localZone(), birthZone = "Asia/Seoul" } = {}) {
    const solar = solarOf(input);
    if (!solar) return null;
    if (new Date(solar.y, solar.m - 1, solar.d) > new Date(now)) return null;
    const chart = birthChart(solar, timeOf(input.time), birthZone);
    const today = todayOf(now, zone);
    const reading = readDay(chart, today, "");
    const money = reading.domains.find((d) => d.key === "money");
    return {
      solar,
      chart,
      today,
      yong: reading.yong,
      hee: (reading.yong + 4) % 5,
      elements: reading.elements,
      money: money ? money.score : null,
      best: reading.best,
      orbit: orbit(chart, today.day, reading.yong)
    };
  }
  function uniform(n) {
    const limit = Math.floor(4294967296 / n) * n;
    const buf = new Uint32Array(1);
    do
      crypto.getRandomValues(buf);
    while (buf[0] >= limit);
    return buf[0] % n;
  }
  function drawRandom({ fixed = [], excluded = [] } = {}) {
    const pool = [];
    for (let n = 1; n <= TOTAL; n++) if (!fixed.includes(n) && !excluded.includes(n)) pool.push(n);
    const order = [];
    const need = PICK - fixed.length;
    for (let i = 0; i < need; i++) order.push(pool.splice(uniform(pool.length), 1)[0]);
    const all = [...order];
    for (const f of fixed) all.splice(uniform(all.length + 1), 0, f);
    return { order: all, numbers: [...all].sort((a, b) => a - b), fixed: [...fixed] };
  }
  var GAME_LABELS = ["A", "B", "C", "D", "E"];
  var MAX_FIXED = 5;
  var MAX_EXCLUDED = TOTAL - PICK;
  function nextDraw(now = Date.now()) {
    const f = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
      weekday: "short"
    });
    const parts2 = Object.fromEntries(f.formatToParts(now).map((p) => [p.type, p.value]));
    const w = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts2.weekday);
    let add = (6 - w + 7) % 7;
    if (add === 0 && +parts2.hour >= 20) add = 7;
    const d = new Date(Date.UTC(+parts2.year, +parts2.month - 1, +parts2.day + add));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), days: add };
  }
  function rangeColor(n) {
    if (n <= 10) return "yellow";
    if (n <= 20) return "blue";
    if (n <= 30) return "red";
    if (n <= 40) return "gray";
    return "green";
  }
  var ELEMENT_COLORS = ["wood", "fire", "earth", "metal", "water"];
  var elementColor = (n) => ELEMENT_COLORS[cellElement(n)];
  var DEMO = { y: 1994, m: 5, d: 12, time: "07", calendar: "solar" };
  function ballHTML(n, { cls = "", attrs = "", tag = "span" } = {}) {
    const type = tag === "button" ? ' type="button"' : "";
    return `<${tag}${type} class="ball ${cls}" data-range="${rangeColor(n)}" data-el="${elementColor(n)}" ${attrs}>${pad2(n)}</${tag}>`;
  }
  function ballScheme(initial = "lotto") {
    const html = document.documentElement;
    const q = new URLSearchParams(location.search).get("balls");
    html.dataset.balls = q || initial;
    const box = document.createElement("div");
    box.className = "ball-scheme";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML = ["lotto", "element", "mono"].map((k) => `<button type="button" tabindex="-1" data-k="${k}">${k}</button>`).join("");
    const sync = () => box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === html.dataset.balls)));
    box.addEventListener("click", (e) => {
      const k = e.target.closest("button")?.dataset.k;
      if (k) {
        html.dataset.balls = k;
        sync();
      }
    });
    sync();
    const locale = document.querySelector(".topbar .locale");
    if (locale) locale.before(box);
    else document.body.appendChild(box);
  }
  var ticketText = (games) => games.map((g, i) => `${GAME_LABELS[i]} ${g.map(pad2).join(" ")}`).join("\n");
  var LOTTO_SYMBOL = '<circle cx="24" cy="13" r="7"/><circle cx="13" cy="32" r="7"/><circle class="f" cx="35" cy="32" r="7"/><circle cx="35" cy="32" r="7"/>';
  return __toCommonJS(lotto_exports);
})();
