'use strict';
// Server-side image resolver for the curated puzzle list. It never accepts arbitrary
// destination URLs from the browser, avoiding an open proxy / SSRF endpoint.
const {IMAGES}=require('./arcade');
const TITLES=new Set(IMAGES.map(x=>x[1]));
const cache=new Map();
const MAX_BYTES=2_500_000;
const REQUEST_MS=4500;
const TTL=30*60*1000;
function wikiApi(title){return 'https://en.wikipedia.org/w/api.php?'+new URLSearchParams({action:'query',prop:'pageimages',format:'json',formatversion:'2',piprop:'thumbnail',pithumbsize:'750',titles:title});}
function wikiSummary(title){return 'https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(title);}
function commonsSearch(title){return 'https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',generator:'search',gsrsearch:title+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',iiprop:'url|mime',iiurlwidth:'750',format:'json',formatversion:'2'});}
function openverseSearch(title){return 'https://api.openverse.org/v1/images/?'+new URLSearchParams({q:title,page_size:'12',license_type:'commercial',mature:'false'});}
async function json(url){const r=await fetch(url,{signal:AbortSignal.timeout(REQUEST_MS),headers:{'User-Agent':'CoupleDuels/4.2 (+https://github.com/kekodev8/CoupleDuels)','Accept':'application/json'}});if(!r.ok)throw Error('source unavailable '+r.status);return r.json();}
function candidatesFromCommons(data,title){const list=data?.query?.pages||[];return list.filter(p=>p.imageinfo?.[0]?.mime?.startsWith('image/')).sort((a,b)=>{const clean=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ');const q=clean(title).split(' ').filter(x=>x.length>2);const score=p=>q.filter(w=>clean(p.title).includes(w)).length;return score(b)-score(a);}).map(p=>p.imageinfo[0].thumburl||p.imageinfo[0].url).filter(Boolean);}
async function downloadImage(url){
 const parsed=new URL(url);
 if(parsed.protocol!=='https:')throw Error('HTTPS images only');
 // Only recognized image hosts, including Openverse image CDN, and no private hosts.
 const host=parsed.hostname.toLowerCase();
 const safe=host==='upload.wikimedia.org'||host==='commons.wikimedia.org'||host==='images.unsplash.com'||host.endsWith('.staticflickr.com')||host==='live.staticflickr.com'||host==='cdn.pixabay.com'||host==='images.pexels.com';
 if(!safe)throw Error('image host not allowlisted');
 const r=await fetch(url,{signal:AbortSignal.timeout(REQUEST_MS),redirect:'follow',headers:{'User-Agent':'CoupleDuels/4.2 (image puzzle)'}});
 if(!r.ok)throw Error('bad image HTTP status');
 const mime=(r.headers.get('content-type')||'').split(';')[0].toLowerCase();
 if(!['image/jpeg','image/png','image/webp','image/gif'].includes(mime))throw Error('not a supported image');
 const declared=Number(r.headers.get('content-length')||'0');
 if(declared>MAX_BYTES)throw Error('image too large');
 const reader=r.body.getReader();let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw Error('image too large');chunks.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});}
 if(size<400)throw Error('too small');
 return {data:Buffer.concat(chunks),mime};
}
async function loadImage(title){
 if(!TITLES.has(title))return null;
 const cached=cache.get(title);if(cached&&Date.now()-cached.at<TTL)return cached.promise;
 const promise=(async()=>{
  const candidates=[];
  // Wikimedia REST and MediaWiki are independent ways to locate thumbnails.
  try{const x=await json(wikiSummary(title));if(x.thumbnail?.source)candidates.push({url:x.thumbnail.source,source:'Wikipedia'});}catch{}
  try{const x=await json(wikiApi(title));const u=x.query?.pages?.[0]?.thumbnail?.source;if(u)candidates.push({url:u,source:'Wikipedia'});}catch{}
  try{const x=await json(commonsSearch(title));candidates.push(...candidatesFromCommons(x,title).slice(0,4).map(url=>({url,source:'Wikimedia Commons'})));}catch{}
  // Openverse indexes openly licensed image sources (including Flickr / Pexels).
  try{const x=await json(openverseSearch(title));for(const row of (x.results||[])){
   if(!row.url&&!row.thumbnail)continue;
   const label=String(row.title||'').toLowerCase();const meaningful=title.toLowerCase().replace(/\s*\([^)]*\)/g,'').split(' ').filter(w=>w.length>2);
   if(!meaningful.some(w=>label.includes(w)))continue;
   for(const u of [row.thumbnail,row.url])if(u)candidates.push({url:u,source:'Openverse'});
   if(candidates.length>16)break;
  }}catch{}
  const seen=new Set();
  for(const c of candidates){if(seen.has(c.url))continue;seen.add(c.url);try{return {...await downloadImage(c.url),source:c.source};}catch{}}
  return null;
 })();
 cache.set(title,{at:Date.now(),promise});
 if(cache.size>40){const first=cache.keys().next().value;cache.delete(first);}
 return promise;
}
module.exports={loadImage,TITLES,candidatesFromCommons};
