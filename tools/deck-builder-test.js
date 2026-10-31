// Deck builder + «ເດັກຂອງຂ້ອຍ» checks. Run with tools/wk.swift on the local server:
//   /tmp/wk "http://localhost:8123/?t=$(date +%s)" 360 800 tools/deck-builder-test.js /tmp/db.png
//   /tmp/wk "http://localhost:8123/?t=$(date +%s)" 1280 800 tools/deck-builder-test.js /tmp/db.png
// Plays as a guest. Returns JSON {pass, checks, fail, errs}.
const W = ms => new Promise(r => setTimeout(r, ms));
const checks = []; let fail = null;
const ok = (yes, name) => { if(!yes) throw Error(name); checks.push(name); };
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const click = (a, v) => { const e = $('[data-a="' + a + '"]' + (v == null ? '' : '[data-v="' + v + '"]')); if(!e) throw Error('Missing ' + a + ' ' + (v ?? '')); e.click(); };
const noOverflow = () => document.documentElement.scrollWidth <= innerWidth + 1;
try{
  await W(1500); const g = $('[data-a="lguest"]'); if(g) g.click(); await W(700);
  const D = window.__dbg, K = D.deck, Cc = D.C;

  // Task 1 · deck quality helpers
  ok(K.stars({}) === 0, 'stars: empty deck is 0');
  ok(K.stars(D.DECKS[0].list) >= 4, 'stars: a ready deck scores 4+');
  const heavy = {}; let n = 0;
  const heavyIds = Object.keys(Cc).filter(id => Cc[id].cost >= 5 && !Cc[id].legend && !Cc[id].fusion && !Cc[id].ritual && !Cc[id].token).sort((x, y) => Cc[y].cost - Cc[x].cost);
  for(const id of heavyIds) if(n < 30){ const k = Math.min(3, 30 - n); heavy[id] = k; n += k; }
  ok(n === 30 && K.stars(heavy) < K.stars(D.DECKS[0].list) && K.stars(heavy) <= 3, 'stars: 30 heavy cards and no legend score lower (≤3)');
  const ht = K.tips(heavy).join(' | ');
  ok(/ກາດບຸນ 1–2/.test(ht) && /ກາດບຸນ 6 ຂຶ້ນໄປ/.test(ht), 'tips: heavy deck warns about the curve');
  ok(K.tips({})[0] === 'ຂາດອີກ 30 ໃບ', 'tips: first tip is the deck issue');
  const sug = K.suggest({});
  ok(sug.length <= 6 && sug.every(id => D.deck.owned(id) > 0 && !Cc[id].fusion && !Cc[id].ritual && !Cc[id].token), 'suggest: owned, packable cards only');
  const fu = Object.keys(Cc).find(id => Cc[id].fusion && Cc[id].fusion.every(x => D.deck.owned(x) > 0));
  if(fu){ const [a, b] = Cc[fu].fusion, h = K.half({[a]:1}); ok(h && h.b === b && h.f === fu, 'tips: finds the missing fusion half');
    // a good deck where only the fusion tip applies: the fusion line shows up
    const L = {...D.DECKS[D.DECKS.findIndex(d => d.list[a])]?.list || {}}; if(L[a]){ delete L[b]; ok(K.tips(L).some(t => t.includes(Cc[b].name)) || K.tips(L).length === 3, 'tips: fusion tip listed when there is room'); } }
  // Task 2 · «ເດັກຂອງຂ້ອຍ»
  const col = K.col(); col.decks = []; D.ui.screen = null; D.render(); await W(200);
  click('ednew'); await W(300);
  ok(!!$('.mydecks') && /0\/10/.test($('.mydecks .bhead').textContent) && !!$('[data-a="mdnew"]'), 'my decks: empty state with the new-deck tile');
  click('mdnew'); await W(250);
  ok(!!$('.modal [data-a="mdempty"]') && !!$('.modal [data-a="mdpaste"]') && $$('.modal [data-a="mdready"]').length === D.DECKS.length, 'new deck: three ways');
  click('mdready', 0); await W(400);
  ok(D.ui.screen === 'builder' && Object.entries(D.ui.ed.list).every(([id, k]) => k <= K.owned(id)), 'from a ready deck: only owned cards');
  click('edsave'); await W(200); click('edback'); await W(300);
  ok(D.ui.screen === 'mydecks' && $$('.mdk:not(.mdnew)').length === 1, 'saved deck listed');
  const tile = $('.mdk:not(.mdnew)').textContent;
  ok(['ແກ້', 'ຫຼິ້ນ', 'ກັອບ', 'ລະຫັດ', 'ລຶບ'].every(w => tile.includes(w)) && !!$('.mdk .dstars'), 'tile has stars and five buttons');
  const id0 = col.decks[0].id;
  click('mdcopy', id0); await W(200); ok($$('.mdk:not(.mdnew)').length === 2, 'copy adds a deck');
  const id1 = col.decks[1].id;
  click('mddel', id1); await W(200); ok($$('.mdk:not(.mdnew)').length === 2 && /ກົດອີກເທື່ອ/.test($('[data-a="mddel"][data-v="' + id1 + '"]').textContent), 'delete asks for a second tap');
  click('mddel', id1); await W(200); ok($$('.mdk:not(.mdnew)').length === 1, 'second tap deletes');
  click('mdcode', id0); await W(200); ok(!!$('.modal #edcodeout') && $('.modal #edcodeout').value.startsWith('LLW1.'), 'code popup shows this deck'); click('mmclose'); await W(150);
  col.decks.push({id:'bad', name:'ບໍ່ຄົບ', list:{[Object.keys(Cc).find(x => !K.owned(x) && !Cc[x].fusion)]:3}, p:0, w:0}); D.render(); await W(200);
  ok($('[data-a="mdplay"][data-v="bad"]').disabled && /⚠️/.test($('[data-a="mdplay"][data-v="bad"]').closest('.mdk').textContent), 'deck with an issue: warning and play disabled');
  while(col.decks.length < 10) col.decks.push({id:'f' + col.decks.length, name:'ເຕັມ', list:{}, p:0, w:0}); D.render(); await W(200);
  ok($('[data-a="mdnew"]').disabled && $('[data-a="mdcopy"][data-v="' + id0 + '"]').disabled, 'ten decks: new and copy disabled');
  col.decks = col.decks.slice(0, 1); D.render(); await W(150);
  ok(noOverflow(), 'my decks: no horizontal overflow');
  // Task 3 · the builder
  D.ui.screen = 'mydecks'; D.render(); await W(150); click('mdnew'); await W(200); click('mdempty'); await W(400);
  const wide = innerWidth >= 1000, phone = innerWidth < 600, L = () => D.ui.ed.list;
  ok(!!$('.ed-pool') && !!$('.ed-deck'), 'builder: pool and deck sections');
  ok((getComputedStyle($('.ed-insp')).display !== 'none') === wide, 'card info column only on wide screens');
  ok(!$('.ed-pool .nown'), 'owned-only is on by default');
  const pool = () => $$('.ed-pool .pc[data-id]').map(e => e.dataset.id);
  const pbtn = (a, id) => $('.ed-pool .pc[data-id="' + id + '"] [data-a="' + a + '"]');
  const two = pool().find(id => K.owned(id) >= 2 && !Cc[id].legend), one = pool().find(id => K.owned(id) === 1);
  pbtn('edadd', two).click(); await W(150);
  ok(L()[two] === 1 && $('.ed-pool .pc[data-id="' + two + '"] .cnt3').textContent.startsWith('1/'), 'pool ＋ adds and the badge updates');
  ok(!!$('.ed-deck .drow [data-a="edadd"][data-v="' + two + '"]'), 'deck row appears with ＋/－');
  $('.ed-deck .drow [data-a="edadd"][data-v="' + two + '"]').click(); await W(150); ok(L()[two] === 2, 'deck row ＋ adds');
  $('.ed-deck .drow [data-a="edrem"][data-v="' + two + '"]').click(); await W(150); ok(L()[two] === 1, 'deck row － removes');
  pbtn('edrem', two).click(); await W(150); ok(!L()[two] && !pbtn('edrem', two), 'pool － removes and hides at 0');
  if(one){ pbtn('edadd', one).click(); await W(150); pbtn('edadd', one).click(); await W(150);
    ok(L()[one] === 1 && pbtn('edadd', one).classList.contains('off') && !!pbtn('edadd', one).title, 'at the limit: stays, ＋ greyed with the reason'); }
  $('.ed-pool .pc[data-id="' + two + '"] [data-a="edinfo"]').click(); await W(250);
  if(wide) ok(D.ui.detail && D.ui.detail.id === two && $('.ed-insp').textContent.includes(Cc[two].name) && !!$('.ed-insp [data-a="edadd"]'), 'card info shows the card with ＋/－');
  else { ok(!!$('.modal [data-a="edadd"][data-v="' + two + '"]'), 'card info opens as a sheet with ＋/－'); $('.modal [data-a="edadd"]').click(); await W(150); ok(L()[two] === 1, 'sheet ＋ adds'); click('mmclose'); await W(150); }
  const setF = async (k, v) => { const s = $('.ed-pool [data-f="' + k + '"]'); s.value = v; s.dispatchEvent(new Event('change', {bubbles:true})); await W(200); };
  if(phone && $('[data-a="edfold"]')){ click('edfold'); await W(150); }
  await setF('type', 'spell'); ok(pool().length > 0 && pool().every(id => Cc[id].type === 'spell'), 'filter: type');
  await setF('type', ''); const tr = Cc[pool().find(id => (Cc[id].type || 'char') === 'char')].tribe; await setF('tribe', tr); ok(pool().every(id => Cc[id].tribe === tr), 'filter: tribe');
  await setF('tribe', ''); click('edf', 'cost:3'); await W(200); ok(pool().every(id => Cc[id].cost === 3), 'filter: cost');
  click('edf', 'cost:0'); await W(150);
  const q = $('#edq'); q.value = 'zzzz'; q.dispatchEvent(new Event('input', {bubbles:true})); await W(200);
  ok(/ບໍ່ພົບກາດ/.test($('.ed-pool').textContent) && !!$('[data-a="edfclear"]'), 'no match: message and clear button');
  click('edfclear'); await W(200); ok(pool().length > 5 && !D.ui.bf.q, 'clear resets the filters');
  const sg = $('.ed-deck .edsug [data-a="edadd"]'); if(sg){ const id = sg.dataset.v, k = L()[id] || 0; sg.click(); await W(150); ok((L()[id] || 0) === k + 1, 'suggested card ＋ adds'); }
  const sc = wide || !phone ? $('.ed-pool .bgrid2') : document.scrollingElement; if(sc && sc.scrollHeight > sc.clientHeight + 300){ sc.scrollTop = 300; await W(50); const top = sc.scrollTop;
    const vis = $$('.ed-pool .pc[data-id] [data-a="edadd"]:not(.off)').find(b => { const r = b.getBoundingClientRect(); return r.top > 120 && r.bottom < innerHeight - 80; });
    if(vis){ vis.click(); await W(200); ok(Math.abs(sc.scrollTop - top) < 2, 'adding keeps the scroll position'); } }
  if(phone){ click('edtabs', 'deck'); await W(200); ok($('.ed-wrap').dataset.view === 'deck' && $('.ed-deck').offsetHeight > 0 && $('.ed-pool').offsetHeight === 0, 'phone: deck tab'); click('edtabs', 'pool'); await W(150); }
  ok(noOverflow(), 'builder: no horizontal overflow');

  // special cards (fusion / summon) and special art
  if(phone && !$('.ed-fsel.open')){ click('edfold'); await W(150); }
  await setF('type', 'special');
  const specials = D.deck.specials();
  ok(pool().length === specials.length && $$('.ed-pool .spc .spneed').length === specials.length, 'special filter: every fusion and summon card with what it needs');
  const pairF = specials.find(id => Cc[id].fusion && Cc[id].fusion.every(x => K.owned(x) > 0 && !L()[x]));
  if(pairF){ click('edpair', pairF); await W(200); ok(Cc[pairF].fusion.every(x => L()[x] >= 1) && /✓/.test($('.ed-pool .pc[data-id="' + pairF + '"] .spneed').textContent), 'add pair: both halves in, card marked ✓'); }
  await setF('type', '');
  // the extra pile is always shown in the deck column
  if(phone){ click('edtabs', 'deck'); await W(150); }
  ok(!!$('.ed-deck .edextra'), 'deck column: extra pile section is always there');
  if(pairF) ok($$('.ed-deck .edextra .exc').some(e => e.dataset.insp === pairF) && /✨ ກອງພິເສດ/.test($('.ed-deck .edextra').textContent), 'extra pile lists the fusion card');
  const near = specials.find(id => Cc[id].fusion && Cc[id].fusion.some(x => K.owned(x) > 0) && !Cc[id].fusion.every(x => L()[x]));
  click('edf', 'type:special'); await W(200); ok(D.ui.bf.type === 'special' && (!phone || D.ui.edView === 'pool'), 'extra pile button opens the special cards');
  await setF('type', '');
  const altId = pool().find(id => D.deck.hasAltArt(id));
  if(altId){ K.col().altOff = {}; K.col().alts[altId] = true; D.render(); await W(200);   // start clean: earlier runs may leave a choice saved
    const tileImg = () => $('.ed-pool .pc[data-id="' + altId + '"] img') && $('.ed-pool .pc[data-id="' + altId + '"] .card').className;
    ok(!!$('.ed-pool .pc[data-id="' + altId + '"] .altb') && D.deck.wantAlt(altId), 'owned special art: ✦ badge and used by default');
    const before = tileImg(); $('.ed-pool .pc[data-id="' + altId + '"] [data-a="edinfo"]').click(); await W(250);
    ok(!!$('[data-a="edalt"][data-v="' + altId + '"]'), 'card info has the art switch');
    $('[data-a="edalt"][data-v="' + altId + '"][data-w="0"]').click(); await W(200);
    ok(!D.deck.wantAlt(altId) && K.col().altOff[altId] === true && tileImg() !== before, 'switch: normal art chosen and shown');
    if($('.modal')){ click('mmclose'); await W(150); }
    delete K.col().altOff[altId]; delete K.col().alts[altId]; D.render(); await W(150); }

  // related cards in the card info
  const R = id => D.deck.related(id).map(x => x.id);
  const fuse = Object.keys(Cc).find(id => Cc[id].fusion), [fa, fb] = Cc[fuse].fusion;
  ok(R(fa).includes(fuse) && R(fa).includes(fb) && R(fuse).includes(fa), 'related: fusion parts and result');
  const names = Object.fromEntries(Object.keys(Cc).map(id => [Cc[id].name, id]));
  const mentioner = Object.keys(Cc).find(id => [...(Cc[id].skill || '').matchAll(/«([^»]+)»/g)].some(m => names[m[1]] && names[m[1]] !== id));
  const named = names[[...Cc[mentioner].skill.matchAll(/«([^»]+)»/g)].map(m => m[1]).find(n => names[n] && names[n] !== mentioner)];
  ok(R(mentioner).includes(named) && R(named).includes(mentioner), 'related: a card named in a skill, both ways');
  ok(!R(fa).includes(fa) && R(fa).length <= 12, 'related: no self, at most 12');
  D.ui.bf = {...D.ui.bf, type:''}; D.render(); await W(150);
  $('.ed-pool .pc[data-id] [data-a="edinfo"]') && $$('.ed-pool .pc[data-id]').find(e => D.deck.related(e.dataset.id).length) ?.querySelector('[data-a="edinfo"]').click(); await W(250);
  ok(!!$((wide ? '.ed-insp' : '.modal') + ' .edrel .relc'), 'card info shows related cards');
  if(!wide && $('.modal')){ click('mmclose'); await W(150); }

  // review fix · a saved card you no longer own can still be taken out
  const gone = Object.keys(Cc).find(x => !K.owned(x) && !Cc[x].fusion && !Cc[x].ritual && !Cc[x].token);
  D.ui.mmodal = null; D.ui.screen = 'mydecks'; K.col().decks.push({id:'gone', name:'ຂາດກາດ', list:{[gone]:2}, p:0, w:0}); D.render(); await W(150);
  click('mdedit', 'gone'); await W(300); if(phone){ click('edtabs', 'deck'); await W(150); }
  ok(!!$('.ed-deck .drow [data-a="edrem"][data-v="' + gone + '"]'), 'unowned card in a saved deck has －');
  $('.ed-deck .drow [data-a="edrem"][data-v="' + gone + '"]').click(); await W(150); ok(D.ui.ed.list[gone] === 1, '－ takes one out');
  D.ui.ed.list = {...K.col().decks.find(d => d.id === 'gone').list}; K.col().decks = K.col().decks.filter(d => d.id !== 'gone'); D.ui.mmodal = null;

  // Task 4 · unsaved changes and test play
  const d0 = K.col().decks[0], tot0 = Object.values(d0.list).reduce((a, b) => a + b, 0);
  D.ui.mmodal = null; D.ui.screen = 'mydecks'; D.render(); await W(200);
  const addOne = async () => { const b = $$('.ed-pool .pc[data-id] [data-a="edadd"]:not(.off)')[0]; b.click(); await W(150); };
  click('mdedit', d0.id); await W(300); click('edback'); await W(200);
  ok(D.ui.screen === 'mydecks' && !$('.modal'), 'unchanged deck: leaves without asking');
  click('mdedit', d0.id); await W(300); await addOne(); click('edback'); await W(200);
  ok(!!$('.modal [data-a="edlsave"]') && !!$('.modal [data-a="edldrop"]') && !!$('.modal [data-a="mmclose"]'), 'changed deck: asks save / discard / cancel');
  click('edldrop'); await W(200);
  ok(D.ui.screen === 'mydecks' && Object.values(K.col().decks[0].list).reduce((a, b) => a + b, 0) === tot0, 'discard keeps the saved deck');
  click('mdedit', d0.id); await W(300); await addOne(); click('edback'); await W(200); click('edlsave'); await W(200);
  ok(Object.values(K.col().decks[0].list).reduce((a, b) => a + b, 0) === tot0 + 1, 'save keeps the change');
  // test play from a legal deck: game over offers the way back
  const legal = K.col().decks.find(d => !D.deck.tips(d.list)[0].startsWith('ຂາດ') && !/ມີ «/.test(D.deck.tips(d.list)[0]));
  if(legal){ click('mdedit', legal.id); await W(300); const pb = $('.ed-deck [data-a="edplay"]');
    if(!pb.disabled){ pb.click(); await W(2500);
      ok(!!D.S && D.S.p[1].level === 1, 'test play: a medium bot game starts');
      D.S.p[1].hp = 0; D.S.over = {winner:0}; D.S.modal = {type:'over'}; D.render(); await W(300);
      ok(!!$('[data-a="edreturn"]'), 'game over: back to the builder offered');
      click('edreturn'); await W(400);
      ok(!D.S && D.ui.screen === 'builder' && D.ui.ed.cid === legal.id, 'back in the builder on the same deck'); } }
}catch(e){ fail = String(e && e.message || e); }
localStorage.removeItem('lao-legend-guest');
return JSON.stringify({pass:!fail, checks:checks.length, fail, errs:(window.__errs || []).slice(0, 4)});
