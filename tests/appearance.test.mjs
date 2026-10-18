import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../dist/appearance.js',import.meta.url),'utf8');
function browser({saved=null,dark=false,storageBlocked=false}={}){
  const events={},mediaEvents={},selectEvents={},windowEvents={},writes=[];
  const select={value:'system',addEventListener:(type,fn)=>{selectEvents[type]=fn;}};
  const root={dataset:{},style:{}},meta={content:''};
  const media={matches:dark,addEventListener:(type,fn)=>{mediaEvents[type]=fn;}};
  let ready=false;
  const document={documentElement:root,querySelector:()=>meta,getElementById:()=>ready?select:null,addEventListener:(type,fn)=>{events[type]=fn;}};
  const window={matchMedia:()=>media,addEventListener:(type,fn)=>{windowEvents[type]=fn;}};
  const localStorage={getItem:()=>{if(storageBlocked)throw new Error('Blocked');return saved;},setItem:(k,v)=>{if(storageBlocked)throw new Error('Blocked');writes.push([k,v]);}};
  vm.runInNewContext(source,{document,window,localStorage});
  return {root,meta,writes,ready(){ready=true;events.DOMContentLoaded();},choose(value){select.value=value;selectEvents.change();},system(dark){media.matches=dark;mediaEvents.change();},crossTab(value){windowEvents.storage({key:'snapnest-appearance-v1',newValue:value});},get selection(){return select.value;}};
}
test('appearance follows system until an explicit choice and remembers that choice',()=>{
  const b=browser({dark:true});assert.equal(b.root.dataset.appearance,'dark');assert.equal(b.meta.content,'#171c19');
  b.ready();assert.equal(b.selection,'system');b.system(false);assert.equal(b.root.dataset.appearance,'light');
  b.choose('dark');b.system(false);assert.equal(b.root.dataset.appearance,'dark');assert.equal(b.root.style.colorScheme,'dark');
  assert.deepEqual(b.writes,[['snapnest-appearance-v1','dark']]);b.choose('system');assert.equal(b.root.dataset.appearance,'light');
});
test('saved preference applies before DOMContentLoaded and synchronizes across tabs',()=>{
  const b=browser({saved:'light',dark:true});assert.equal(b.root.dataset.appearance,'light');b.ready();assert.equal(b.selection,'light');
  b.crossTab('dark');assert.equal(b.selection,'dark');assert.equal(b.root.dataset.appearance,'dark');b.crossTab(null);b.system(false);assert.equal(b.selection,'system');assert.equal(b.root.dataset.appearance,'light');
});
test('invalid preferences and blocked localStorage still allow usable theme selection',()=>{
  const invalid=browser({saved:'unexpected',dark:true});assert.equal(invalid.root.dataset.appearance,'dark');
  const blocked=browser({storageBlocked:true});blocked.ready();blocked.choose('dark');assert.equal(blocked.root.dataset.appearance,'dark');assert.equal(blocked.meta.content,'#171c19');assert.equal(blocked.writes.length,0);
});
