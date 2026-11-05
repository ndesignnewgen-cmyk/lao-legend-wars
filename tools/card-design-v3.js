/* Presentation-only seals. These never change the card's rules, rarity or summon requirements. */
window.CardDesign=(()=>{
  const symbols={
    char:'<path d="M12 3 15 8l-1 5 4 7H6l4-7-1-5z"/>',
    legend:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
    fusion:'<path d="m8 3 7 7-7 7-7-7zM16 7l7 7-7 7-7-7z"/>',
    ritual:'<path d="M9 11h6v10H9zM7 21h10M12 2c-5 5-3 7 0 7s4-3 0-7z"/>',
    spell:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
    react:'<path d="M5 7h9a6 6 0 1 1-5 10M5 7l4-4M5 7l4 4"/>',
    item:'<path d="m6 18 12-12 3-3-1 6-11 12zM4 15l5 5M3 22l4-4"/>',
    trap:'<path d="M3 9h18L12 22zM3 9l3-7M21 9l-3-7M8 9V4M16 9V4"/>',
    loc:'<path d="m2 19 7-12 4 7 3-5 6 10zM5 22h14"/>',
    transform:'<path d="M4 12a8 8 0 0 1 14-5M18 3v4h-4M20 12A8 8 0 0 1 6 17M6 21v-4h4"/>',
    token:'<path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9"/>',
    hatch:'<path d="M12 2C7 2 3 12 3 16a9 9 0 0 0 18 0c0-4-4-14-9-14zM5 11l4 3 4-5 2 5 5-2"/>',
    upgrade:'<path d="M5 21V11h14v10M8 8l4-5 4 5M12 3v12M8 18h8"/>',
    evolve:'<path d="m12 2 9 8-9 12-9-12zM3 10h18M12 2l-4 8 4 12 4-12z"/>',
    pilot:'<path d="M4 13a8 8 0 0 1 16 0v7H4zM7 11h10v5H7zM8 20v2M16 20v2"/>',
    offering:'<path d="M3 14l5 7h8l5-7M3 14l6 3M21 14l-6 3M12 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>'
  };
  const labels={char:'ຕົວລະຄອນ',legend:'ຕຳນານ',fusion:'ຮ່ວມຮ່າງ',ritual:'ພິທີອັນເຊີນ',spell:'ຄາຖາ',react:'ຄາຖາຕອບໂຕ້',item:'ຂອງສວມໃສ່',trap:'ກັບດັກ',loc:'ສະຖານທີ່',transform:'ປ່ຽນຮ່າງ',token:'ຕົວອັນເຊີນ',hatch:'ຟັກໄຂ່',upgrade:'ອັບເກຣດ',evolve:'ອິໂວລູຊັນ',pilot:'ນັກບິນ',offering:'ຖວາຍພະລັງ'};
  function method(d){
    if(d.fusion)return 'fusion';
    if(d.ritual||d.id==='phitibangfai')return 'ritual';
    if(d.type!=='char')return d.react?'react':d.type;
    if(d.tf)return 'transform';
    if(d.id.startsWith('dinoevo'))return 'evolve';
    if(d.id.startsWith('dinometa'))return 'upgrade';
    if(d.egg||d.hatch)return 'hatch';
    if(d.pilot)return 'pilot';
    if(d.token)return 'token';
    return d.legend?'legend':'char';
  }
  function decorate(card,d,override){
    const kind=d.type,m=override||method(d);
    card.dataset.kind=kind;card.dataset.method=m;
    card.querySelectorAll('.xtype').forEach(el=>el.remove());
    const seal=document.createElement('span');seal.className='xtype';
    const label=m==='ritual'&&kind==='spell'?'ຄາຖາພິທີ':labels[m];
    seal.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+symbols[m]+'</svg><span>'+label+'</span>'+(d.fusion?'<b>'+d.fusion.length+'</b>':'');
    card.querySelector('.face').append(seal);
    return card;
  }
  return {decorate,method,labels};
})();
