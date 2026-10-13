"""Import the client's linked public Turkish demo, preserving its actual content."""
import concurrent.futures, html, json, re, subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

ORIGIN='https://ziyasakiryilmaz.pages.dev'
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'
RAW=ROOT/'original'
OUT.mkdir(exist_ok=True); RAW.mkdir(exist_ok=True)

class Links(HTMLParser):
    def __init__(self): super().__init__(); self.refs=[]
    def handle_starttag(self, tag, attrs):
        for k,v in attrs:
            if v and k in ('href','src','poster','data-src','srcset'):
                self.refs.append((tag,k,v.split(',')[0].split(' ')[0] if k=='srcset' else v))

def fetch(path):
    is_asset=bool(Path(path).suffix and not path.endswith('.html'))
    target=OUT/path.lstrip('/') if is_asset else RAW/(path.strip('/') or 'index')
    if not is_asset: target=target.with_suffix('.html')
    target.parent.mkdir(parents=True,exist_ok=True)
    proc=subprocess.run(['curl','-fsSL','--max-time','35',ORIGIN+path,'-o',str(target)],capture_output=True)
    if proc.returncode: return path,None,proc.stderr.decode()[-150:]
    if is_asset: return path,None,None
    return path,target.read_text(),None

pending={'/'}; seen=set(); asset_refs=set(); pages={}; failures=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    while pending and len(seen)<160:
        batch=sorted(pending-seen); pending=set(); seen.update(batch)
        for path,source,error in pool.map(fetch,batch):
            if error: failures.append([path,error]); continue
            pages[path]=source
            p=Links();p.feed(source)
            for tag,k,ref in p.refs:
                u=urlsplit(urljoin(ORIGIN+path,html.unescape(ref)))
                if u.netloc!=urlsplit(ORIGIN).netloc or not u.path: continue
                if '/assets/' in u.path:
                    asset_refs.add(u.path)
                elif tag=='a' and not Path(u.path).suffix and u.path not in seen:
                    pending.add(u.path)
            asset_refs.update(re.findall(r'(?:[.][.]/|/)?(assets/[\w./-]+)',source))
        print('Pages imported:',len(pages),'next:',len(pending),'assets:',len(asset_refs),flush=True)
    assets={('/'+a.lstrip('/')) for a in asset_refs}
    for path,_,error in pool.map(fetch,sorted(assets)):
        if error: failures.append([path,error])

for path,source in pages.items():
    def absolute(m):
        key,quote,value=m.group(1),m.group(2),m.group(3)
        if value.startswith(('#','data:','mailto:','tel:','javascript:')): return m.group(0)
        u=urlsplit(urljoin(ORIGIN+path,html.unescape(value)))
        if u.netloc!=urlsplit(ORIGIN).netloc: return m.group(0)
        return key+'='+quote+u.path+('?' + u.query if u.query else '')+('#'+u.fragment if u.fragment else '')+quote
    source=re.sub(r'\b(href|src|poster|data-src|srcset)=([\x22\x27])(.*?)\2',absolute,source)
    target=OUT/path.strip('/')/'index.html' if path!='/' else OUT/'index.html'
    target.parent.mkdir(parents=True,exist_ok=True);target.write_text(source)
(ROOT/'source-inventory.json').write_text(json.dumps({'origin':ORIGIN,'pages':sorted(pages),'assets':sorted(assets),'failures':failures},ensure_ascii=False,indent=2))
print(json.dumps({'pages':len(pages),'assets':len(assets),'failures':failures},ensure_ascii=False),flush=True)
