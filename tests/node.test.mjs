import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {mkdtemp,writeFile,readFile,rm,link} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {beautify,beautifyToFile,themes} from '../node/index.mjs';
import {defaults,layout} from '../dist/core.mjs';
const run=promisify(execFile),cli=fileURLToPath(new URL('../bin/snapnest.mjs',import.meta.url));
const input=()=>sharp({create:{width:120,height:80,channels:3,background:'#eecc99'}}).png().toBuffer();

test('Node exports PNG/JPEG with the shared layout and burns solid redaction into pixels',async()=>{
  const data=await input(),mask={x:.2,y:.2,w:.3,h:.3};
  const output=await beautify(data,{scale:1,masks:[mask],caption:'<test & title>'});
  const meta=await sharp(output).metadata();assert.equal(meta.format,'png');assert.equal(meta.width,1200);assert.equal(meta.height,900);
  const l=layout(120,80,{...defaults,scale:1,caption:'<test & title>'});
  const {data:p,info}=await sharp(output).raw().toBuffer({resolveWithObject:true});
  const x=Math.round(l.x+l.imageW*.35),y=Math.round(l.y+l.bar+l.imageH*.35),offset=(y*info.width+x)*info.channels;
  assert.deepEqual([...p.subarray(offset,offset+3)],[48,56,47]);
  const jpeg=await sharp(await beautify(data,{format:'jpeg',ratio:'3:4',scale:2,theme:'midnight',browserFrame:false})).metadata();
  assert.equal(jpeg.format,'jpeg');assert.equal(jpeg.width,2400);assert.equal(jpeg.height,3200);assert.equal(themes.length,6);
});

test('Node handles EXIF orientation before determining layout',async()=>{
  const rotated=await sharp(await input()).jpeg().withMetadata({orientation:6}).toBuffer();
  const meta=await sharp(await beautify(rotated,{ratio:'auto',scale:1,browserFrame:false})).metadata();
  assert(meta.height>meta.width);
});

test('Node rejects malformed options, unsupported SVGs, and incorrect masks',async()=>{
  const data=await input();
  for(const options of [{ratio:'2:1'},{theme:'missing'},{padding:200},{scale:1.5},{colorA:'url(https://example.com)'},{masks:[{x:.8,y:0,w:.5,h:.2}]},{masks:[{x:NaN,y:0,w:.1,h:.1}]},{caption:'x'.repeat(41)},{typo:true}])await assert.rejects(beautify(data,options));
  await assert.rejects(beautify(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>')),/Only PNG/);
});

test('API and CLI protect existing files and provide working package entry points',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'snapnest-test-'));
  try{
    const src=path.join(dir,'input.png'),dest=path.join(dir,'output.png'),masksFile=path.join(dir,'masks.json');await writeFile(src,await input());await writeFile(masksFile,JSON.stringify([{x:.1,y:.1,w:.2,h:.2}]));
    const r=await beautifyToFile(src,dest,{scale:1});assert.equal(r.width,1200);const original=await readFile(dest);
    await assert.rejects(beautifyToFile(src,dest),/EEXIST/);assert.deepEqual(await readFile(dest),original);
    await assert.rejects(beautifyToFile(src,src,{overwrite:true}),/different files/);
    const alias=path.join(dir,'alias.png');await link(src,alias);await assert.rejects(beautifyToFile(src,alias,{overwrite:true}),/including links/);
    await assert.rejects(beautifyToFile(src,path.join(dir,'bad.jpg'),{format:'png'}),/does not match/);
    const result=await run(process.execPath,[cli,src,'--out',path.join(dir,'cli.jpg'),'--theme','matcha','--no-frame','--masks',masksFile,'--scale','1']);assert.match(result.stdout,/JPEG/);
    assert.equal((await sharp(await readFile(path.join(dir,'cli.jpg'))).metadata()).format,'jpeg');
    await assert.rejects(run(process.execPath,[cli,src,'--out',dest]));
    await assert.rejects(run(process.execPath,[cli,src,'--unknown']));
    assert.match((await run(process.execPath,[cli,'--help'])).stdout,/Usage/);
    assert.match((await run(process.execPath,[cli,'--version'])).stdout,/1\.2\.0/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
