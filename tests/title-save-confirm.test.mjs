import test from 'node:test'
import assert from 'node:assert/strict'
import { TitleScene } from '../src/scenes/title.js'

function open(hasSave){
  const moves=[]
  const app={
    store:{load:()=>hasSave},
    audio:{confirm(){},cancel(){},move(){}},
    toggleHd(){moves.push('hd')},
    go:(name)=>moves.push(name),
  }
  const scene=new TitleScene(app)
  const send=(key)=>scene.update(16,{consume:()=>key})
  return {scene,send,moves}
}

test('a stored campaign cannot be overwritten from title by one mistaken confirm',()=>{
  const {scene,send,moves}=open(true)
  send('c')
  assert.equal(scene.phase,'menu')
  send('c')
  assert.equal(scene.phase,'overwrite-confirm')
  assert.equal(scene.overwriteChoice,1)
  assert.deepEqual(moves,[])
  send('c')
  assert.equal(scene.phase,'menu')
  assert.deepEqual(moves,[])
  send('c')
  send('x')
  assert.equal(scene.phase,'menu')
  assert.deepEqual(moves,[])
})

test('the new-campaign path requires explicit yes when a save exists',()=>{
  const {scene,send,moves}=open(true)
  send('Enter')
  send('c')
  assert.equal(scene.phase,'overwrite-confirm')
  send('ArrowUp')
  assert.equal(scene.overwriteChoice,0)
  send('Enter')
  assert.deepEqual(moves,['players'])
})

test('Continue remains accessible without an overwrite prompt',()=>{
  const {scene,send,moves}=open(true)
  send('c')
  send('ArrowDown')
  assert.equal(scene.selection,1)
  send('c')
  assert.deepEqual(moves,['strategy'])
  assert.equal(scene.phase,'menu')
})

test('without an existing save, title launches setup directly',()=>{
  const {scene,send,moves}=open(false)
  send('c')
  send('Enter')
  assert.deepEqual(moves,['players'])
  assert.notEqual(scene.phase,'overwrite-confirm')
})

test('B/Escape at title does not start or reset a saved campaign',()=>{
  const {scene,send,moves}=open(true)
  send('x')
  assert.equal(scene.phase,'splash')
  send('c')
  send('x')
  assert.equal(scene.phase,'splash')
  assert.deepEqual(moves,[])
})
