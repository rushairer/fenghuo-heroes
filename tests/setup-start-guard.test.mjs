import test from 'node:test'
import assert from 'node:assert/strict'
import { SetupScene } from '../src/scenes/setup.js'

function setup({throwOnStart=false}={}){
  const events=[]
  const app={
    playerCount:1,
    store:{
      newGame(options){
        events.push({newGame:options})
        if(throwOnStart)throw new Error('Selected ruler has no opening city in this scenario.')
      },
    },
    audio:{
      confirm(){events.push('confirm')},
      alert(){events.push('alert')},
      move(){events.push('move')},
      cancel(){events.push('cancel')},
    },
    go(scene){events.push({go:scene})},
  }
  const scene=new SetupScene(app)
  scene.focus=4
  scene.rulers.add(0)
  return {scene,events}
}

test('unsupported opening state is shown as setup feedback, not an unhandled exception',()=>{
  const {scene,events}=setup({throwOnStart:true})
  assert.doesNotThrow(()=>scene.start())
  assert.match(scene.message,/no opening city/)
  assert.equal(events.filter((x)=>x==='alert').length,1)
  assert.equal(events.some((x)=>x?.go==='strategy'),false)
  assert.equal(scene.focus,4)
})

test('valid 189 campaign still initializes and enters strategy',()=>{
  const {scene,events}=setup()
  scene.start()
  const launch=events.find((x)=>x.newGame)
  assert.equal(launch.newGame.scenarioYear,189)
  assert.equal(launch.newGame.humanFactions.length,1)
  assert.ok(events.some((x)=>x.go==='strategy'))
  assert.ok(events.includes('confirm'))
})

test('200-year uncalibrated scenario blocks before mutating any save',()=>{
  const {scene,events}=setup()
  scene.scenario=1
  scene.start()
  assert.ok(events.includes('alert'))
  assert.equal(events.some((x)=>Boolean(x.newGame)),false)
  assert.equal(events.some((x)=>Boolean(x.go)),false)
})
