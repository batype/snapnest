export const themes = [
  {name:'落日奶油',a:'#f5c6aa',b:'#f6e4bb'},
  {name:'抹茶时光',a:'#b5c5a6',b:'#e1e8cd'},
  {name:'晴空来信',a:'#a8c9dc',b:'#d6e7ed'},
  {name:'莓果气泡',a:'#ccb8ce',b:'#eddae1'},
  {name:'午夜漫游',a:'#29394c',b:'#647788'},
  {name:'纸上日常',a:'#e5dfd2',b:'#f3f0e8'},
];
export const defaults = {theme:0,a:themes[0].a,b:themes[0].b,padding:64,radius:16,shadow:40,ratio:'4:3',browserFrame:true,caption:'',format:'png',scale:2};
export function cleanSettings(raw={}){
  const s={...defaults};
  for(const key of ['padding','radius','shadow','scale']){
    const [min,max]=({padding:[16,140],radius:[0,40],shadow:[0,80],scale:[1,2]})[key];
    if(Number.isFinite(raw[key]))s[key]=Math.round(Math.max(min,Math.min(max,raw[key])));
  }
  for(const k of ['a','b'])if(/^#[0-9a-f]{6}$/i.test(raw[k]||''))s[k]=raw[k];
  if(Number.isInteger(raw.theme)&&raw.theme>=-1&&raw.theme<themes.length)s.theme=raw.theme;
  if(['auto','4:3','1:1','3:4','16:9'].includes(raw.ratio))s.ratio=raw.ratio;
  if(['png','jpeg'].includes(raw.format))s.format=raw.format;
  if(typeof raw.browserFrame==='boolean')s.browserFrame=raw.browserFrame;
  // Text is deliberately not restored or persisted; it may contain private data.
  return s;
}
export function layout(iw,ih,s){
  const padding=s.padding,bar=s.browserFrame?38:0,caption=s.caption.trim()?52:0;
  let width=1200,height;
  if(s.ratio==='auto'){
    const scale=Math.min((1200-padding*2)/iw,(1400-padding*2-bar-caption)/ih);
    width=Math.round(iw*scale+padding*2);height=Math.round(ih*scale+bar+padding*2+caption);
  }else{const [a,b]=s.ratio.split(':').map(Number);height=Math.round(width*b/a);}
  const availableW=width-padding*2,availableH=height-padding*2-bar-caption;
  const scale=Math.min(availableW/iw,availableH/ih);
  const imageW=iw*scale,imageH=ih*scale;
  const x=(width-imageW)/2,y=(height-caption-imageH-bar)/2;
  return {width,height,x,y,imageW,imageH,bar,caption};
}
export function normalizedRect(start,end){
  const clamp=n=>Math.min(1,Math.max(0,n));
  const x=clamp(Math.min(start.x,end.x)),y=clamp(Math.min(start.y,end.y));
  return {x,y,w:clamp(Math.max(start.x,end.x))-x,h:clamp(Math.max(start.y,end.y))-y};
}
export function exportDimensions(l,scale){
  // Bound allocations independently from input size.
  const factor=Math.min(scale,4096/Math.max(l.width,l.height));
  return {width:Math.round(l.width*factor),height:Math.round(l.height*factor)};
}
