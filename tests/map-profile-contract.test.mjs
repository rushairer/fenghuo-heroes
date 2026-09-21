import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { RUNTIME_SCAFFOLD_CITIES } from '../src/game/runtime-map-scaffold.js'

function walk(dir){
  return readdirSync(dir).flatMap((name)=>{
    const path=join(dir,name)
    return statSync(path).isDirectory()?walk(path):[path]
  })
}

test('runtime consumers do not hardcode provisional scaffold city ids',()=>{
  const ids=RUNTIME_SCAFFOLD_CITIES.map((city)=>city.id)
  const failures=[]
  for(const path of [...walk('src/game'),...walk('src/scenes')]){
    if(!path.endsWith('.js'))continue
    if(path.endsWith('runtime-map-scaffold.js'))continue
    const source=readFileSync(path,'utf8')
    for(const id of ids){
      if(source.includes(`'${id}'`)||source.includes(`"${id}"`)){
        failures.push(`${path}: ${id}`)
      }
    }
  }
  assert.deepEqual(failures,[])
})


test('profile-aware runtime consumers do not read the global city dictionary',()=>{
  const paths=[
    'src/game/march.js',
    'src/game/transport-parity.js',
    'src/game/qa-fixtures.js',
    'src/scenes/strategy-parity.js',
    'src/scenes/strategy-officers.js',
    'src/scenes/strategy-info.js',
    'src/scenes/strategy-full-map.js',
    'src/scenes/siege.js',
    'src/scenes/duel.js',
  ]
  const failures=[]
  for(const path of paths){
    const source=readFileSync(path,'utf8')
    if(/\bCITY_BY_ID\b/.test(source))failures.push(path)
  }
  assert.deepEqual(failures,[])
})

test('HD strategy renderers source city collections from the current store profile',()=>{
  const strategy=readFileSync('src/scenes/strategy-info.js','utf8')
  const fullMap=readFileSync('src/scenes/strategy-full-map.js','utf8')
  assert.match(strategy,/this\.mapCities\(\)/)
  assert.match(strategy,/store\.mapProfile\?\.villages/)
  assert.match(fullMap,/this\.mapCities\(\)/)
  assert.match(fullMap,/store\.mapProfile\?\.villages/)
})


test('runtime game and scene modules do not import global CITIES or CITY_BY_ID',()=>{
  const failures=[]
  for(const path of [...walk('src/game'),...walk('src/scenes')]){
    if(!path.endsWith('.js'))continue
    if(path.endsWith('data.js'))continue
    if(path.endsWith('runtime-map-scaffold.js'))continue
    if(path.endsWith('map-parity.js'))continue
    const source=readFileSync(path,'utf8')
    if(/import\s*\{[^}]*\b(?:CITIES|CITY_BY_ID)\b[^}]*\}\s*from\s*['"][^'"]*data\.js['"]/.test(source)){
      failures.push(path)
    }
  }
  assert.deepEqual(failures,[])
})
