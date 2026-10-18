import {themes,defaults,cleanSettings,layout,normalizedRect,exportDimensions} from './core.mjs';
const $=id=>document.getElementById(id);
const canvas=$('preview'),ctx=canvas.getContext('2d');
let settings={...defaults};
try{settings=cleanSettings(JSON.parse(localStorage.getItem('snapnest-style-v1')||'{}'));}catch{}
let isDemo=true;
let image=null,fileName='灵感看板 · 示例',masks=[],draft=null,start=null,redacting=false,currentLayout=null,loadId=0,toastTimer;
const gradient=t=>`linear-gradient(135deg, ${t.a}, ${t.b})`;
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
function persist(){try{const {caption,...style}=settings;localStorage.setItem('snapnest-style-v1',JSON.stringify(style));}catch{}}
function rounded(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,Math.min(r,w/2,h/2));}
function paint(target,scale=1,includeDraft=false){
  if(!image)return;
  const l=layout(image.naturalWidth,image.naturalHeight,settings),d=exportDimensions(l,scale);
  target.width=d.width;target.height=d.height;
  const c=target.getContext('2d');c.scale(d.width/l.width,d.height/l.height);
  const g=c.createLinearGradient(0,0,l.width,l.height);g.addColorStop(0,settings.a);g.addColorStop(1,settings.b);c.fillStyle=g;c.fillRect(0,0,l.width,l.height);
  // A soft, restrained light spot gives the flat gradient a little depth.
  const glow=c.createRadialGradient(l.width*.18,0,0,l.width*.18,0,l.width*.85);glow.addColorStop(0,'#ffffff20');glow.addColorStop(1,'#ffffff00');c.fillStyle=glow;c.fillRect(0,0,l.width,l.height);
  c.save();c.shadowColor=`rgba(30,35,30,${settings.shadow/140})`;c.shadowBlur=settings.shadow*1.1;c.shadowOffsetY=settings.shadow*.42;c.fillStyle='#fafbf8';rounded(c,l.x,l.y,l.imageW,l.imageH+l.bar,settings.radius);c.fill();c.restore();
  c.save();rounded(c,l.x,l.y,l.imageW,l.imageH+l.bar,settings.radius);c.clip();
  if(l.bar){c.fillStyle='#fafbf8';c.fillRect(l.x,l.y,l.imageW,l.bar);['#e6a19b','#e7ce92','#acc7a1'].forEach((color,i)=>{c.beginPath();c.fillStyle=color;c.arc(l.x+19+i*15,l.y+19,4.2,0,Math.PI*2);c.fill();});c.fillStyle='#aeb4a7';c.font='10px -apple-system, sans-serif';c.textAlign='center';c.fillText('a little moment, well shared.',l.x+l.imageW/2,l.y+23);}
  c.drawImage(image,l.x,l.y+l.bar,l.imageW,l.imageH);
  c.save();c.beginPath();c.rect(l.x,l.y+l.bar,l.imageW,l.imageH);c.clip();
  for(const m of [...masks,...(includeDraft&&draft?[draft]:[])]){c.fillStyle='#30382f';c.fillRect(Math.floor(l.x+m.x*l.imageW),Math.floor(l.y+l.bar+m.y*l.imageH),Math.ceil(m.w*l.imageW)+1,Math.ceil(m.h*l.imageH)+1);}
  c.restore();c.restore();
  if(settings.caption.trim()){
    c.fillStyle=settings.theme===4?'#ffffffdd':'#353b35';c.font='500 22px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';c.textAlign='center';
    let text=settings.caption.trim();while(c.measureText(text).width>l.width-settings.padding*2&&text.length>1)text=text.slice(0,-2)+'…';c.fillText(text,l.width/2,l.height-settings.padding-9);
  }
  return l;
}
function render(){if(!image)return;currentLayout=paint(canvas,1,true);$('canvasSize').textContent=`${currentLayout.width} × ${currentLayout.height}`;const d=exportDimensions(currentLayout,settings.scale);$('exportInfo').textContent=`${d.width} × ${d.height} px · 无水印 · 本地处理`;$('imageInfo').textContent=`${image.naturalWidth} × ${image.naturalHeight} px · ${isDemo?'示例图片':'本地图片'}`;$('fileName').textContent=fileName;$('maskCount').textContent=masks.length?`已添加 ${masks.length} 处实心遮挡`:'还没有添加遮挡';$('undoBtn').disabled=$('clearBtn').disabled=!masks.length;}
function sync(){
  ['padding','radius','shadow','ratio','caption','format','scale','colorA','colorB'].forEach(id=>{const key={colorA:'a',colorB:'b'}[id]||id;$(id).value=settings[key];});
  $('browserFrame').checked=settings.browserFrame;$('paddingValue').textContent=settings.padding+' px';$('radiusValue').textContent=settings.radius+' px';$('shadowValue').textContent=settings.shadow+'%';$('colorAText').textContent=settings.a.toUpperCase();$('colorBText').textContent=settings.b.toUpperCase();$('themeName').textContent=themes[settings.theme]?.name||'自定义';
  document.querySelectorAll('[data-theme]').forEach(el=>el.setAttribute('aria-pressed',String(+el.dataset.theme===settings.theme)));render();
}
themes.forEach((t,i)=>{
  const sw=document.createElement('button');sw.className='swatch';sw.style.background=gradient(t);sw.title=t.name;sw.setAttribute('aria-label',t.name+'背景');sw.dataset.theme=i;$('swatches').append(sw);
  const p=document.createElement('button');p.className='preset';p.dataset.theme=i;p.innerHTML=`<span class="preset-thumb" style="background:${gradient(t)}"></span><span class="preset-name">${t.name}</span>`;$('presetList').append(p);
});
document.querySelectorAll('[data-theme]').forEach(el=>el.addEventListener('click',()=>{settings.theme=+el.dataset.theme;settings.a=themes[settings.theme].a;settings.b=themes[settings.theme].b;persist();sync();}));
['padding','radius','shadow','ratio','caption','format','scale','browserFrame','colorA','colorB'].forEach(id=>$(id).addEventListener('input',()=>{const key={colorA:'a',colorB:'b'}[id]||id;settings[key]=id==='browserFrame'?$(id).checked:['padding','radius','shadow','scale'].includes(id)?+$(id).value:$(id).value;if(id.startsWith('color'))settings.theme=-1;persist();sync();}));
function setTab(tab){document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===tab;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$('panel-'+b.dataset.tab).hidden=!active;});if(tab!=='privacy')setRedacting(false);}
document.querySelectorAll('[data-tab]').forEach(b=>{b.addEventListener('click',()=>setTab(b.dataset.tab));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const all=[...document.querySelectorAll('[data-tab]')];let i=all.indexOf(b);i=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;setTab(all[i].dataset.tab);all[i].focus();});});
function setRedacting(on){redacting=on;$('redactBtn').setAttribute('aria-pressed',String(on));$('redactBtn').textContent=on?'✓ 完成遮挡':'＋ 开启遮挡模式';$('canvasHolder').classList.toggle('redacting',on);$('stageHint').innerHTML=on?'在截图内容上拖动，创建实心遮挡':'<kbd>⌘ / Ctrl</kbd> + <kbd>V</kbd> 粘贴截图 <span>或将图片拖到这里</span>';}
$('redactBtn').onclick=()=>setRedacting(!redacting);
function point(e){const r=canvas.getBoundingClientRect(),l=currentLayout;return {x:((e.clientX-r.left)/r.width*l.width-l.x)/l.imageW,y:((e.clientY-r.top)/r.height*l.height-l.y-l.bar)/l.imageH};}
canvas.addEventListener('pointerdown',e=>{if(!redacting||!currentLayout||e.button!==0)return;const p=point(e);if(p.x<0||p.x>1||p.y<0||p.y>1){toast('请在截图内容内框选');return;}e.preventDefault();start=p;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!start)return;draft=normalizedRect(start,point(e));render();});
function finish(e){if(!start)return;const m=normalizedRect(start,point(e));if(m.w>.002&&m.h>.002)masks.push(m);start=null;draft=null;render();}
canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',()=>{start=null;draft=null;render();});
$('undoBtn').onclick=()=>{masks.pop();render();};$('clearBtn').onclick=()=>{masks=[];render();};
$('resetBtn').onclick=()=>{settings={...defaults};setRedacting(false);persist();sync();toast('已恢复默认样式，图片和已有遮挡保留');};
const allowed=['image/png','image/jpeg','image/webp'];
async function loadFile(file){
  if(!file)return;if(!allowed.includes(file.type)){toast('请选择 PNG、JPG 或 WebP 图片');return;}if(file.size>25*1024*1024){toast('图片超过 25 MB，请压缩后重试');return;}
  const id=++loadId,url=URL.createObjectURL(file),next=new Image();
  try{next.src=url;await next.decode();if(next.naturalWidth*next.naturalHeight>24000000)throw new Error('图片超过 2400 万像素，请缩小后重试');if(id!==loadId)return;image=next;isDemo=false;fileName=file.name||'粘贴的截图.png';masks=[];draft=null;start=null;setRedacting(false);render();toast('图片已就位，选一个喜欢的风格吧');}
  catch(err){if(id===loadId)toast(err.message.includes('像素')?err.message:'无法读取图片，请换一张再试');}finally{URL.revokeObjectURL(url);$('fileInput').value='';}
}
$('uploadBtn').onclick=()=>$('fileInput').click();$('fileInput').onchange=e=>loadFile(e.target.files[0]);
document.addEventListener('paste',e=>{if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;const item=[...(e.clipboardData?.items||[])].find(i=>allowed.includes(i.type));if(item){e.preventDefault();loadFile(item.getAsFile());}});
let dragDepth=0;
document.addEventListener('dragover',e=>{if(e.dataTransfer?.types.includes('Files'))e.preventDefault();});
document.addEventListener('drop',e=>{if(e.dataTransfer?.files.length){e.preventDefault();dragDepth=0;$('dropZone').classList.remove('dragging');loadFile(e.dataTransfer.files[0]);}});
const zone=$('dropZone');zone.addEventListener('dragenter',e=>{if(e.dataTransfer?.types.includes('Files')){e.preventDefault();dragDepth++;zone.classList.add('dragging');}});zone.addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;zone.classList.remove('dragging');}});
function makeBlob(type='png'){
  if(!image)return Promise.reject(new Error('图片仍在加载，请稍后再试'));
  const out=document.createElement('canvas');paint(out,settings.scale,false);
  return new Promise((resolve,reject)=>out.toBlob(blob=>{out.width=out.height=1;blob?resolve(blob):reject(new Error('导出失败，请减小图片尺寸'));},'image/'+type,.94));
}
$('downloadBtn').onclick=async()=>{const b=$('downloadBtn');b.disabled=true;try{const blob=await makeBlob(settings.format),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${fileName.replace(/\.[^.]+$/,'').replace(/[^\p{L}\p{N}\-_ ]/gu,'-')||'snapnest'}-snapnest.${settings.format==='jpeg'?'jpg':'png'}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('图片已导出，分享前记得检查隐私信息');}catch(e){toast(e.message||'导出失败，请重试');}finally{b.disabled=false;}};
$('copyBtn').onclick=async()=>{if(!navigator.clipboard?.write||!window.ClipboardItem){toast('此浏览器暂不支持复制图片，请使用下载');return;}const b=$('copyBtn');b.disabled=true;try{// Pass a Promise to ClipboardItem to preserve Safari user activation.
  await navigator.clipboard.write([new ClipboardItem({'image/png':makeBlob('png')})]);toast('图片已复制，去粘贴吧');}catch{toast('浏览器未允许复制图片，请使用下载');}finally{b.disabled=false;}};
$('guideBtn').onclick=()=>$('guideDialog').showModal();$('closeGuide').onclick=()=>$('guideDialog').close();$('guideDialog').addEventListener('click',e=>{if(e.target===$('guideDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
async function loadDemo(){const id=++loadId,next=new Image();next.src='./demo.svg';try{await next.decode();if(id!==loadId)return;image=next;isDemo=true;fileName='灵感看板 · 示例';masks=[];draft=null;start=null;setRedacting(false);sync();}catch{toast('示例加载失败，请添加你的图片');}}
$('demoBtn').onclick=()=>loadDemo();sync();loadDemo();
