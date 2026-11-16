/* Run in JavaScriptCore or the trial's browser context. Tests teaching rules, not animation internals. */
function runOnePieceTests(E){
  const checks=[];
  function ok(value,label){if(!value)throw new Error(label);checks.push(label);}
  const step=(s,a)=>E.act(s,a).state;
  let s=E.initial('OP01-001');
  s=step(s,'attach');ok(E.power(s,'ally')===6000&&E.power(s,'leader')===6000,'Zoro leader boosts Characters and DON boosts Leader');
  s=step(s,'attach');ok(E.power(s,'ally')===6000&&E.power(s,'leader')===7000,'Second DON does not double the team effect');
  s=step(s,'turn');ok(E.power(s,'ally')===5000&&E.power(s,'leader')===5000,'Your Turn effects end on opponent turn');
  s=E.initial('ST01-013');s=step(s,'attach');ok(E.power(s,'ally')===7000,'Zoro Character gets normal DON and ability bonus');
  s=step(s,'turn');ok(E.power(s,'ally')===6000,'Zoro Character ability remains on opponent turn');
  for(const id of ['ST01-001','ST01-007']){
    s=E.initial(id);s=step(s,'target-ally');s=step(s,'skill');ok(s.ally.don===1&&s.rested===0&&s.used,id+' transfers rested DON');
    const again=E.act(s,'skill');ok(!again.changed&&again.state===s,id+' cannot use skill twice');
  }
  s=E.initial('ST01-004');ok(!E.can(s,'attack'),'Cannot attack before playing Sanji');
  s=step(s,'play');ok(s.active===2&&s.rested===2&&!E.can(s,'attack'),'Playing pays cost; Sanji has no Rush yet');
  s=step(s,'attach');ok(!E.can(s,'attack'),'Sanji needs two attached DON');s=step(s,'attach');ok(E.can(s,'attack'),'Two DON enable Sanji Rush');
  s=step(s,'attack');ok(s.enemyLife===4&&!E.can(s,'attack'),'Rush attack resolves once');
  s=E.initial('ST01-012');s=step(s,'play');ok(E.can(s,'attack'),'Luffy has Rush without attached DON');
  s=step(s,'attack');ok(s.blocker.out&&s.enemyLife===5,'Blocker protects Leader when Luffy has fewer than two DON');
  s=E.initial('ST01-012');for(const a of ['play','attach','attach','attack'])s=step(s,a);
  ok(!s.blocker.out&&s.enemyLife===4,'Luffy with two DON bypasses Blocker');
  s=E.initial('ST01-006');s=step(s,'block');ok(s.ally.out&&s.ally.rested&&s.life===5&&!E.can(s,'block'),'Blocker rests, takes the hit and protects Life');
  s=E.initial('ST01-014');s=step(s,'counter');ok(E.power(s,'leader')===8000&&s.active===0,'Counter pays one DON for +3000');
  s=step(s,'resolve');ok(s.life===5&&E.power(s,'leader')===5000,'Counter prevents damage and expires after battle');
  s=E.initial('ST01-014');s=step(s,'resolve');ok(s.life===4,'Skipping Counter takes damage');
  s=E.initial('ST01-014');s=step(s,'trigger');ok(s.life===4&&s.active===1&&E.power(s,'leader')===6000&&!E.can(s,'resolve'),'Trigger follows damage, costs no DON and cannot resolve damage twice');
  s=step(s,'finish');ok(E.power(s,'leader')===5000,'Guard Point Trigger expires at turn end');
  s=E.initial('ST01-015');s=step(s,'buff');ok(!E.can(s,'ko'),'Jet Pistol cannot target current power 7000');
  const before=JSON.stringify(s);s=step(s,'ko');ok(JSON.stringify(s)===before,'Illegal target never spends DON');
  s=step(s,'buff');s=step(s,'ko');ok(s.enemy.out&&s.active===0&&s.rested===4&&s.trash===2,'Jet Pistol KOs 6000 and pays cost');
  s=E.initial('ST01-015');s=step(s,'trigger');ok(s.enemy.out&&s.active===4&&s.life===4,'Jet Pistol Trigger uses Main effect without cost');
  s=E.initial('ST01-015');s=step(s,'buff');s=step(s,'trigger');ok(!s.enemy.out&&s.active===4&&s.life===4,'Trigger still respects target restriction');
  // Explore every reachable state to catch negative resources and unrestricted repeats.
  const actions=['target-leader','target-ally','attach','skill','play','attack','turn','block','counter','resolve','trigger','finish','buff','ko'];
  let explored=0;
  for(const c of E.cards){
    const pending=[E.initial(c.id)],seen=new Set();
    while(pending.length){const current=pending.pop(),sig=JSON.stringify({...current,log:[],message:''});if(seen.has(sig))continue;seen.add(sig);explored++;
      if(seen.size>2000)throw new Error('Unbounded lesson state '+c.id);
      for(const a of actions){const next=E.act(current,a);if(!next.changed)continue;const t=next.state;
        if(t.active<0||t.rested<0||t.life<0||t.enemyLife<0)throw new Error('Negative resource '+c.id+' '+a);
        pending.push(t);
      }
    }
  }
  ok(explored>=E.cards.length,'All reachable lesson states have nonnegative resources');
  return {passed:checks.length,explored,checks};
}
