import test from 'node:test'
import assert from 'node:assert/strict'
import { BATTLE_MAP_PRESENTATION, drawBattleMapMarker, drawBattleMapDay } from '../src/game/battle-map-presentation.js'
import { FieldBattleScene } from '../src/scenes/field-battle.js'

function recorder(){
  const calls=[]
  const r=Object.fromEntries(['fillRect','line','text','clear','panel','wrapText','strokeRect'].map(name=>[name,(...args)=>calls.push([name,...args])]))
  return {r,calls}
}

test('reference-derived marker stays compact and does not fabricate unit numbers',()=>{
  const {r,calls}=recorder()
  drawBattleMapMarker(r,{x:50,y:60,color:'#123456',label:'自'})
  assert.deepEqual(calls[0],['fillRect',42,51.5,16,17,'#15140f'])
  assert.ok(calls.some(c=>c[0]==='text'&&c[1]==='自'))
  assert.equal(BATTLE_MAP_PRESENTATION.markerWidth,16)
})

test('active battle uses a fixed day plaque and scrolls only provisional markers without modifying campaign',()=>{
  const {r,calls}=recorder()
  const conflict={kind:'field',attacker:'cao',defender:'liu',attackerTroops:1200,defenderTroops:900,
    runtime:{phase:'battle',speed:'normal',day:6}}
  const scene=new FieldBattleScene({r,store:{pendingConflict:conflict},audio:{move(){}}})
  const before=structuredClone(conflict)
  scene.draw()
  const day=calls.find(c=>c[0]==='text'&&c[1]==='第6日')
  const marker=calls.find(c=>c[0]==='text'&&c[1]==='自')
  assert.ok(day&&marker)
  assert.ok(calls.some(c=>c[0]==='text'&&c[1]==='工程預覽・非部隊位置'))
  calls.length=0
  scene.update(0,{consume:()=> 'ArrowRight'})
  scene.draw()
  assert.deepEqual(calls.find(c=>c[0]==='text'&&c[1]==='第6日'),day)
  assert.notEqual(calls.find(c=>c[0]==='text'&&c[1]==='自')[2],marker[2])
  assert.deepEqual(conflict,before)
})

test('day plaque is bounded inside logical canvas',()=>{
  const {r,calls}=recorder()
  drawBattleMapDay(r,30)
  const [,x,y,w,h]=calls[0]
  assert.ok(x>=0&&y>=0&&x+w<=320&&y+h<=224)
  assert.equal(calls[1][1],'第30日')
})
