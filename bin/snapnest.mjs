#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {beautifyToFile,themes} from '../node/index.mjs';
import {fileURLToPath} from 'node:url';
const help=`SnapNest — local screenshot beautifier

Usage: snapnest <input.png> --out <output.png> [options]

  -o, --out <path>        Output .png / .jpg (default: <input>-snapnest.png)
      --theme <name>      sunset, matcha, sky, berry, midnight, paper
      --ratio <ratio>     auto, 4:3, 1:1, 3:4, 16:9
      --padding <16-140>  Canvas padding (default: 64)
      --radius <0-40>    Window corner radius (default: 16)
      --shadow <0-80>    Shadow strength (default: 40)
      --scale <1|2>      Export scale (default: 2)
      --caption <text>   Optional title, at most 40 characters
      --color-a <#hex>   Gradient start color
      --color-b <#hex>   Gradient end color
      --no-frame         Hide browser window frame
      --masks <file>     JSON array of normalized {x,y,w,h} redaction rectangles
      --force            Allow overwriting an existing output (never the input)
      --list-themes      List available themes
  -v, --version          Print version
  -h, --help             Show this help

No uploads, no API key. Node.js >=20.9.0. MIT license.
`;
try{
  const {values:v,positionals}=parseArgs({allowPositionals:true,strict:true,options:{out:{type:'string',short:'o'},theme:{type:'string'},ratio:{type:'string'},padding:{type:'string'},radius:{type:'string'},shadow:{type:'string'},scale:{type:'string'},caption:{type:'string'},'color-a':{type:'string'},'color-b':{type:'string'},'no-frame':{type:'boolean'},masks:{type:'string'},force:{type:'boolean'},'list-themes':{type:'boolean'},help:{type:'boolean',short:'h'},version:{type:'boolean',short:'v'}}});
  if(v.help){console.log(help);}else if(v.version){const p=JSON.parse(await readFile(fileURLToPath(new URL('../package.json',import.meta.url)),'utf8'));console.log(p.version);}else if(v['list-themes']){for(const t of themes)console.log(`${t.id.padEnd(10)} ${t.name}  ${t.a} → ${t.b}`);}else{
    if(positionals.length!==1)throw new Error('Provide exactly one input image. Use --help for examples.');
    const input=positionals[0],o={};
    for(const k of ['theme','ratio','caption'])if(v[k]!==undefined)o[k]=v[k];
    for(const k of ['padding','radius','shadow','scale'])if(v[k]!==undefined)o[k]=Number(v[k]);
    if(v['color-a']!==undefined)o.colorA=v['color-a'];if(v['color-b']!==undefined)o.colorB=v['color-b'];
    if(v['no-frame'])o.browserFrame=false;if(v.force)o.overwrite=true;
    if(v.masks)o.masks=JSON.parse(await readFile(v.masks,'utf8'));
    const ext=path.extname(input),output=v.out??input.slice(0,ext? -ext.length:undefined)+'-snapnest.png';
    const r=await beautifyToFile(input,output,o);console.log(`Saved ${r.path} (${r.width} × ${r.height} ${r.format.toUpperCase()})`);
  }
}catch(e){console.error(`snapnest: ${e.message}`);process.exitCode=1;}
