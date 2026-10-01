#!/usr/bin/env python3
"""Gera catálogo recursivo lendo metadata.md junto ao entrypoint de cada protótipo."""
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
FOLDER=ROOT/'web-projects'; OUT=ROOT/'data/web-projects.json'
EXTS={'.html','.htm','.php'}
def clean(s): return re.sub(r'\s+',' ',s or '').strip()
def parse_md(path):
    if not path.exists(): return {}
    raw=path.read_text(encoding='utf-8',errors='replace')
    # Frontmatter YAML simples, sem dependência externa; listas inline e escalares.
    m=re.match(r'\A---\s*\n(.*?)\n---\s*(?:\n|$)',raw,re.S)
    if not m: return {}
    out={}; key=None
    for line in m.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith('#'): continue
        item=re.match(r'^([\w-]+):\s*(.*)$',line)
        if item:
            key=item.group(1); val=item.group(2).strip()
            if val.startswith('[') and val.endswith(']'):
                out[key]=[x.strip().strip('\"\'') for x in val[1:-1].split(',') if x.strip()]
            elif val: out[key]=val.strip('\"\'')
            else: out[key]=[]; 
        elif key and line.strip().startswith('- '): out[key].append(line.strip()[2:].strip('\"\''))
    return out
def slug(s): return re.sub(r'[^a-zA-Z0-9]+','-',s).strip('-').lower() or 'projeto'
def main():
    items=[]
    for f in sorted(FOLDER.rglob('*')):
        if not f.is_file() or f.suffix.lower() not in EXTS or f.name.startswith('_'): continue
        rel=f.relative_to(FOLDER); folder=f.parent
        md=parse_md(folder/'metadata.md')
        html=f.read_text(encoding='utf-8',errors='ignore')
        title=re.search(r'<title[^>]*>(.*?)</title>',html,re.I|re.S)
        desc=re.search(r'<meta[^>]+name=[\"\']description[\"\'][^>]+content=[\"\'](.*?)[\"\']',html,re.I|re.S)
        fallback=clean(title.group(1)) if title else f.stem
        if md.get('hidden') in (True,'true','yes'): continue
        items.append({'id':str(md.get('id') or slug(rel.parent.name if f.name=='index.html' else f.stem)), 'file':'web-projects/'+rel.as_posix(),'type':str(md.get('type') or f.suffix.lower().lstrip('.')),'title':str(md.get('title') or fallback),'description':str(md.get('description') or (clean(desc.group(1)) if desc else '')),'creator':md.get('creator',''),'creators':md.get('creators',[]),'icon':md.get('icon','🌐'),'tags':md.get('tags',[]),'order':int(md.get('order',999)),'updated':md.get('updated','')})
    ids=set(); unique=[]
    for x in items:
        if x['id'] in ids: print('ID duplicado:',x['id'],file=sys.stderr); sys.exit(1)
        ids.add(x['id']); x.pop('order',None) if False else None; unique.append(x)
    unique.sort(key=lambda x:(int(x.pop('order',999)),x['title'].lower()))
    OUT.parent.mkdir(exist_ok=True); OUT.write_text(json.dumps(unique,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'{len(unique)} projeto(s) → {OUT.relative_to(ROOT)}')
if __name__=='__main__': main()
