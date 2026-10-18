import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,layout,normalizedRect,exportDimensions,cleanSettings} from '../dist/core.mjs';
test('portrait, landscape and extreme images stay inside every canvas shape',()=>{
  for(const [w,h] of [[1080,680],[800,1400],[1,20000],[20000,1]])for(const ratio of ['auto','1:1','4:3','3:4','16:9'])for(const padding of [16,140])for(const browserFrame of [true,false]){
    const l=layout(w,h,{...defaults,ratio,padding,browserFrame,caption:'分享标题'});
    assert(l.x>=padding-.01);assert(l.y>=padding-.01);
    assert(l.x+l.imageW<=l.width-padding+.01);assert(l.y+l.imageH+l.bar<=l.height-padding-l.caption+.01);
    assert(l.width>0&&l.height>0);const out=exportDimensions(l,2);assert(Math.max(out.width,out.height)<=4096);
  }
});
test('reverse and out-of-bounds privacy drags are normalized and clamped',()=>{
  assert.deepEqual(normalizedRect({x:.8,y:.9},{x:.2,y:.3}),{x:.2,y:.3,w:.6000000000000001,h:.6000000000000001});
  assert.deepEqual(normalizedRect({x:.2,y:.3},{x:2,y:-1}),{x:.2,y:0,w:.8,h:.3});
});
test('corrupt preferences cannot inject colors or request oversized canvases; captions are never restored',()=>{
  const s=cleanSettings({padding:1e8,shadow:-50,radius:NaN,scale:100,a:'javascript:alert(1)',ratio:'garbage',caption:'private@example.com'});
  assert.equal(s.padding,140);assert.equal(s.shadow,0);assert.equal(s.radius,defaults.radius);assert.equal(s.scale,2);assert.equal(s.a,defaults.a);assert.equal(s.ratio,defaults.ratio);assert.equal(s.caption,'');
});
