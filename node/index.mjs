import sharp from 'sharp';
import {readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {defaults,layout,exportDimensions,themes as webThemes} from '../dist/core.mjs';

const ids=['sunset','matcha','sky','berry','midnight','paper'];
export const themes=Object.freeze(webThemes.map((t,i)=>Object.freeze({id:ids[i],...t})));
const MAX_BYTES=25*1024*1024,MAX_PIXELS=24_000_000;
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function optionsFrom(options){
  if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('options must be an object');
  const valid=new Set(['theme','colorA','colorB','padding','radius','shadow','ratio','browserFrame','caption','format','scale','masks','overwrite']);
  for(const k of Object.keys(options))if(!valid.has(k))throw new TypeError(`Unknown option: ${k}`);
  const s={...defaults};
  if(options.theme!==undefined){const i=ids.indexOf(options.theme);if(i<0)throw new RangeError(`theme must be one of: ${ids.join(', ')}`);s.theme=i;s.a=themes[i].a;s.b=themes[i].b;}
  for(const [key,target] of [['colorA','a'],['colorB','b']])if(options[key]!==undefined){if(typeof options[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(options[key]))throw new TypeError(`${key} must be a #RRGGBB color`);s[target]=options[key];}
  for(const [key,min,max] of [['padding',16,140],['radius',0,40],['shadow',0,80],['scale',1,2]])if(options[key]!==undefined){const n=options[key];if(!Number.isInteger(n)||n<min||n>max)throw new RangeError(`${key} must be an integer from ${min} to ${max}`);s[key]=n;}
  if(options.ratio!==undefined){if(!['auto','4:3','1:1','3:4','16:9'].includes(options.ratio))throw new RangeError('Invalid ratio');s.ratio=options.ratio;}
  if(options.browserFrame!==undefined){if(typeof options.browserFrame!=='boolean')throw new TypeError('browserFrame must be boolean');s.browserFrame=options.browserFrame;}
  if(options.overwrite!==undefined&&typeof options.overwrite!=='boolean')throw new TypeError('overwrite must be boolean');
  if(options.caption!==undefined){if(typeof options.caption!=='string'||[...options.caption].length>40||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(options.caption))throw new TypeError('caption must be a string of at most 40 characters without control codes');s.caption=options.caption;}
  if(options.format!==undefined){if(!['png','jpeg'].includes(options.format))throw new RangeError('format must be png or jpeg');s.format=options.format;}
  const masks=options.masks??[];
  if(!Array.isArray(masks)||masks.length>1000)throw new TypeError('masks must be an array with at most 1000 rectangles');
  for(const m of masks)if(!m||['x','y','w','h'].some(k=>typeof m[k]!=='number'||!Number.isFinite(m[k])||m[k]<0||m[k]>1)||m.w===0||m.h===0||m.x+m.w>1+1e-9||m.y+m.h>1+1e-9)throw new RangeError('Each mask needs normalized x, y, w, h within the image (0..1)');
  return {s,masks};
}
async function inputBuffer(input){
  if(typeof input==='string'){if((await stat(input)).size>MAX_BYTES)throw new RangeError('Input exceeds 25 MB');input=await readFile(input);}
  if(!(input instanceof Uint8Array))throw new TypeError('input must be a file path, Buffer or Uint8Array');
  if(input.byteLength>MAX_BYTES)throw new RangeError('Input exceeds 25 MB');
  const data=Buffer.from(input);
  const png=data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg=data[0]===255&&data[1]===216&&data[2]===255;
  const webp=data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP';
  if(!png&&!jpeg&&!webp)throw new TypeError('Only PNG, JPEG and WebP inputs are supported');
  return data;
}
function captionText(text,width){
  const estimate=t=>[...t].reduce((n,c)=>n+(/[\u0000-\u00ff]/.test(c)?12:22),0);
  let chars=[...text.trim()];if(estimate(chars.join(''))<=width)return chars.join('');
  while(chars.length&&estimate(chars.join('')+'…')>width)chars.pop();return chars.join('')+'…';
}

/** Beautify a local image. Resolves with encoded PNG/JPEG bytes; no network or file writes. */
export async function beautify(input,options={}){
  const {s,masks}=optionsFrom(options),data=await inputBuffer(input);
  const source=sharp(data,{limitInputPixels:MAX_PIXELS,animated:false,failOn:'error'});
  const meta=await source.metadata();
  if(!['png','jpeg','webp'].includes(meta.format))throw new TypeError('Only PNG, JPEG and WebP inputs are supported');
  const rotated=[5,6,7,8].includes(meta.orientation),iw=rotated?meta.height:meta.width,ih=rotated?meta.width:meta.height;
  const l=layout(iw,ih,s),d=exportDimensions(l,s.scale),factor=d.width/l.width;
  const image=await source.rotate().resize(Math.max(1,Math.round(l.imageW*factor)),Math.max(1,Math.round(l.imageH*factor)),{fit:'fill'}).png().toBuffer();
  const {x,y,imageW:w,imageH:h,bar}=l,r=Math.min(s.radius,w/2,(h+bar)/2);
  const bars=bar?`<rect x="${x}" y="${y}" width="${w}" height="${bar}" fill="#fafbf8"/>${['#e6a19b','#e7ce92','#acc7a1'].map((c,i)=>`<circle cx="${x+19+i*15}" cy="${y+19}" r="4.2" fill="${c}"/>`).join('')}<text x="${x+w/2}" y="${y+23}" font-size="10" text-anchor="middle" fill="#aeb4a7">a little moment, well shared.</text>`:'';
  const redactions=masks.map(m=>`<rect x="${Math.floor(x+m.x*w)}" y="${Math.floor(y+bar+m.y*h)}" width="${Math.ceil(m.w*w)+1}" height="${Math.ceil(m.h*h)+1}" fill="#30382f"/>`).join('');
  const caption=l.caption?`<text x="${l.width/2}" y="${l.height-s.padding-9}" font-size="22" font-weight="500" text-anchor="middle" fill="${s.theme===4?'#ffffff':'#353b35'}">${xml(captionText(s.caption,l.width-s.padding*2))}</text>`:'';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${d.width}" height="${d.height}" viewBox="0 0 ${l.width} ${l.height}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${s.a}"/><stop offset="1" stop-color="${s.b}"/></linearGradient><radialGradient id="glow" cx=".18" cy="0" r=".85"><stop stop-color="#fff" stop-opacity=".125"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><clipPath id="window"><rect x="${x}" y="${y}" width="${w}" height="${h+bar}" rx="${r}"/></clipPath><clipPath id="image"><rect x="${x}" y="${y+bar}" width="${w}" height="${h}"/></clipPath><filter id="shadow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="${s.shadow*.42}" stdDeviation="${s.shadow*.55}" flood-color="#1e231e" flood-opacity="${s.shadow/140}"/></filter></defs><rect width="100%" height="100%" fill="url(#bg)"/><rect width="100%" height="100%" fill="url(#glow)"/><rect x="${x}" y="${y}" width="${w}" height="${h+bar}" rx="${r}" fill="#fafbf8" ${s.shadow?'filter="url(#shadow)"':''}/><g clip-path="url(#window)">${bars}<image x="${x}" y="${y+bar}" width="${w}" height="${h}" preserveAspectRatio="none" xlink:href="data:image/png;base64,${image.toString('base64')}"/><g clip-path="url(#image)">${redactions}</g></g>${caption}</svg>`;
  const output=sharp(Buffer.from(svg),{limitInputPixels:4096*4096});
  return s.format==='jpeg'?output.jpeg({quality:94}).toBuffer():output.png().toBuffer();
}

/** Write an export. Existing files are protected unless overwrite: true is explicitly passed. */
export async function beautifyToFile(input,output,options={}){
  if(typeof output!=='string'||!output)throw new TypeError('output must be a non-empty file path');
  if(typeof input==='string'&&path.resolve(input)===path.resolve(output))throw new Error('Input and output must be different files');
  if(typeof input==='string'){
    const a=await stat(input);let b;
    try{b=await stat(output);}catch(e){if(e.code!=='ENOENT')throw e;}
    if(b&&a.ino===b.ino&&a.dev===b.dev)throw new Error('Input and output must be different files (including links)');
  }
  const format=options.format??(/\.jpe?g$/i.test(output)?'jpeg':'png');
  if(!/\.(png|jpe?g)$/i.test(output))throw new TypeError('Output filename must end in .png, .jpg or .jpeg');
  if((/\.png$/i.test(output)?'png':'jpeg')!==format)throw new TypeError('Output extension does not match format');
  const result=await beautify(input,{...options,format});
  await writeFile(output,result,{flag:options.overwrite?'w':'wx'});
  const meta=await sharp(result).metadata();return {path:path.resolve(output),format:meta.format,width:meta.width,height:meta.height};
}
