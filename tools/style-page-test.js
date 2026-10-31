// Customize page (ໜ້າປັບແຕ່ງ) checks. Run with tools/wk.swift on the local server, at phone and desktop size:
//   /tmp/wk "http://localhost:8123/?t=$(date +%s)" 360 800 tools/style-page-test.js /tmp/style.png
//   /tmp/wk "http://localhost:8123/?t=$(date +%s)" 1280 800 tools/style-page-test.js /tmp/style.png
// Plays as a guest; paid items use a mocked premium state (__dbg.pm). Returns JSON {pass, checks, fail, errs}.
const W = ms => new Promise(r => setTimeout(r, ms));
const checks = []; let fail = null;
const ok = (yes, name) => { if(!yes) throw Error(name); checks.push(name); };
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const click = (a, v) => { const e = $('[data-a="' + a + '"]' + (v == null ? '' : '[data-v="' + v + '"]')); if(!e) throw Error('Missing ' + a + ' ' + (v ?? '')); e.click(); };
const noOverflow = () => document.documentElement.scrollWidth <= innerWidth + 1;
try{
  await W(1500); const g = $('[data-a="lguest"]'); if(g) g.click(); await W(700);
  const D = window.__dbg; const DECKS_LEGEND = () => D.DECKS[0].legend;

  // Task 1 · entry, preview, tabs, tiles
  const nav = $('.h2nav'); ok(nav && nav.querySelectorAll('button').length === 6, 'bottom nav has 6 buttons');
  ok(!!nav.querySelector('[data-a="style"]'), 'nav has the customize button');
  ok(nav.scrollWidth <= nav.clientWidth + 1, 'nav fits without overflow');
  click('style'); await W(400);
  ok(!!$('.style-page'), 'customize page opens');
  ok($$('[data-a="stab"]').length === 6, 'six tabs');
  ok(!!$('.style-prev'), 'preview shown');
  const want = {back:4, arena:6, avatar:D.style.items('avatar').length, frame:6, title:D.style.items('title').length, pet:5};
  for(const [tab, n] of Object.entries(want)){
    click('stab', tab); await W(250);
    ok($$('.stile').length === n && n > 0, tab + ': ' + n + ' tiles');
    ok($$('.stile.on').length === 1, tab + ': one in use');
    ok(noOverflow(), tab + ': no horizontal overflow');
  }
  // Task 2 · using items, the locked sheet
  const calls = []; let pmFail = false;
  const state = {owned:['back-naga'], equipped:{arena:null, back:null}, balance:0, packs:[], orders:[], payment:{},
    products:[{id:'back-naga', kind:'back', payPrice:0}, {id:'back-sinh', kind:'back', payPrice:300}, {id:'back-stars', kind:'back', payPrice:300}, {id:'arena-meteor', kind:'arena', payPrice:500}]};
  window.__pmMock = (name, args) => { calls.push(name + ':' + (args.product_key ?? '')); if(pmFail) return {error:{code:'XX', message:'offline'}};
    state.equipped = {...state.equipped, [args.slot]:args.product_key || null}; return {data:{premium:JSON.parse(JSON.stringify(state))}}; };
  const on = () => $('.stile.on') && $('.stile.on').dataset.v;
  click('stab', 'back'); await W(200);
  ok($('[data-v="back-sinh"]').dataset.a === 'slock', 'guest: paid back is locked');
  click('slock', 'back-sinh'); await W(200);
  ok(/ເຂົ້າບັນຊີເພື່ອຊື້/.test($('.modal').textContent), 'guest: sheet asks to sign in');
  click('mmclose'); await W(150); ok(calls.length === 0, 'guest: no equip call');
  click('stab', 'arena'); await W(200); click('suse', 'himma'); await W(250);
  ok(on() === 'himma' && JSON.parse(localStorage.getItem('lao-legend-settings')).theme === 'himma', 'arena: free theme used and saved');
  click('stab', 'frame'); await W(200); ok(on() === 'none', 'frame: default in use');
  click('slock', 'royal'); await W(200); ok(/ຊະນະ 50/.test($('.modal').textContent), 'frame: sheet says how to get it'); click('mmclose'); await W(150);
  click('stab', 'title'); await W(200); click('suse', 'new'); await W(200); ok((D.style.col().title || 'new') === 'new' && on() === 'new', 'title: the one in use stays (only «new» is earned by a guest)');
  ok($$('.stile').every(t => (t.dataset.a === 'slock') === t.classList.contains('lock')), 'title: locked tiles open the sheet, earned ones are usable');
  click('stab', 'pet'); await W(200); click('suse', 'xang'); await W(200); ok(D.style.col().pet === 'xang' && on() === 'xang' && !!$('.sp-pet'), 'pet: used and shown in preview');
  click('suse', 'none'); await W(200); ok(!D.style.col().pet && !$('.sp-pet'), 'pet: removed');
  click('stab', 'avatar'); await W(200); ok($$('.stile.lock').length === $$('.stile').length, 'guest: avatars locked');
  click('slock', $('.stile').dataset.v); await W(200); ok(!!$('.modal [data-a="pedit"],.modal [data-a="prof"]'), 'guest: sheet offers to make a player'); click('mmclose'); await W(150);
  // signed-in account with the premium state loaded
  D.ACCT.user = {id:'u-test'}; D.ACCT.eco = true; D.pm(JSON.parse(JSON.stringify(state))); await W(200);
  click('stab', 'back'); await W(200);
  click('suse', 'back-naga'); await W(400); ok(calls.includes('premium_equip:back-naga') && on() === 'back-naga', 'back: owned back equipped via server');
  pmFail = true; click('suse', 'default'); await W(400);
  ok(on() === 'back-naga' && /ບັນທຶກບໍ່ສຳເລັດ/.test(($('.toast') || {}).textContent || ''), 'back: failed save keeps the old choice'); pmFail = false;
  click('slock', 'back-sinh'); await W(200); click('sshop'); await W(300);
  ok(D.ui.screen === 'shop' && D.ui.shopTab === 'cosmetics', 'locked back opens the shop cosmetics tab');
  D.ui.screen = 'style'; D.ui.styleTab = 'arena'; D.style.set({theme:'starjars', meteor:true}); D.render(); await W(200);
  ok(on() === 'starjars' && $('[data-v="meteor"]').dataset.a === 'slock', 'meteor not owned: free starjars shown, meteor locked');
  // Task 3 · old pickers become links
  D.ui.screen = 'shop'; D.ui.shopTab = 'cosmetics'; D.render(); await W(300);
  ok(!$('[data-a="pmequip"]') && !$('[data-a="pmreset"]'), 'shop: no equip or reset buttons');
  ok(!!$('.pm-tile [data-a="style"]'), 'shop: owned item links to the customize page');
  $('.pm-tile [data-a="style"]').click(); await W(300); ok(D.ui.screen === 'style' && D.ui.styleTab === 'back', 'shop: the link opens the back tab');
  D.ui.screen = null; D.ui.mmodal = null; D.render(); await W(300);
  ok(!!$('.h2minis [data-a="style"][data-v="pet"]') && !$('[data-a="pet"]'), 'home: buddy button opens the pet tab');
  click('settings'); await W(300);
  ok(!$('.setv2 .themes') && !!$('.setv2 [data-a="setgo"][data-v="style"]'), 'settings (menu): link instead of the arena picker');
  click('setclose'); await W(200);
  D.ui.mmodal = {type:'ach'}; D.render(); await W(300); ok(!!$('.modal') && !$('.modal [data-a="frame"]'), 'achievements: frames are rewards only'); click('mmclose'); await W(200);
  D.ACCT.prof = {name:'ທົດສອບ', avatar:DECKS_LEGEND()}; click('prof'); await W(300); const pe = $('[data-a="pedit"]'); if(pe){ pe.click(); await W(300); }
  ok(!$('.modal .avgrid'), 'profile edit: name only');
  D.ui.mmodal = {type:'prof'}; D.render(); await W(300); click('style', 'title'); await W(300); ok(D.ui.screen === 'style' && D.ui.styleTab === 'title' && !$('.modal'), 'profile: title button opens the title tab'); D.ui.screen = null; D.ui.mmodal = null; D.ACCT.prof = null; D.render(); await W(200);
  click('start'); await W(2500);
  for(let k = 0; k < 20 && $('.modal'); k++){ const b = $$('.modal button').find(e => /ເກັບໄວ້/.test(e.textContent)); if(b) b.click(); await W(400); }
  await W(1500); for(let k = 0; k < 5 && !$('.setv2'); k++){ click('settings'); await W(600); }   // a turn banner can swallow the first tap
  ok(!!$('.setv2 .themes'), 'settings (in a game): arena picker kept');
}catch(e){ fail = String(e && e.message || e); }
localStorage.removeItem('lao-legend-guest');
return JSON.stringify({pass:!fail, checks:checks.length, fail, errs:(window.__errs || []).slice(0, 4)});
