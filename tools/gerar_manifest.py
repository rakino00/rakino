#!/usr/bin/env python3
"""Gera data/web-projects.json lendo web-projects/<pasta>/metadata.md.

Regras:
  - um projeto por pasta (o arquivo de entrada é `entry:` do metadata, padrão index.html);
  - pastas/arquivos que começam com "_" são ignorados, e `hidden: true` esconde o projeto;
  - `id` vem do metadata; se faltar, usa o nome da pasta em minúsculas (kebab-case).
Use nomes de pasta em minúsculas-com-hífen: o GitHub Pages diferencia maiúsculas de minúsculas.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOLDER = ROOT / 'web-projects'
OUT = ROOT / 'data' / 'web-projects.json'


def clean(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def parse_md(path):
    """Frontmatter YAML simples (escalares, listas `- x` e listas inline `[a, b]`)."""
    if not path.exists():
        return {}
    raw = path.read_text(encoding='utf-8-sig', errors='replace').replace('\r\n', '\n')
    m = re.match(r'\A---\s*\n(.*?)\n---\s*(?:\n|$)', raw, re.S)
    if not m:
        return {}
    out, key = {}, None
    for line in m.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        item = re.match(r'^([\w-]+):\s*(.*)$', line)
        if item:
            key, val = item.group(1), item.group(2).strip()
            if val.startswith('[') and val.endswith(']'):
                out[key] = [x.strip().strip('"\'') for x in val[1:-1].split(',') if x.strip()]
            elif val:
                out[key] = val.strip('"\'')
            else:
                out[key] = []
        elif key and line.strip().startswith('- ') and isinstance(out.get(key), list):
            out[key].append(line.strip()[2:].strip().strip('"\''))
    return out


def to_int(v, default=999):
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def main():
    items, ids = [], set()
    for folder in sorted(p for p in FOLDER.iterdir() if p.is_dir() and not p.name.startswith(('_', '.'))):
        md = parse_md(folder / 'metadata.md')
        if str(md.get('hidden', '')).lower() in ('true', 'yes', '1'):
            continue
        entry = folder / str(md.get('entry') or 'index.html')
        if not entry.is_file():
            print(f'AVISO: {folder.name} sem {entry.name} — ignorado', file=sys.stderr)
            continue
        html = entry.read_text(encoding='utf-8', errors='ignore')
        title = re.search(r'<title[^>]*>(.*?)</title>', html, re.I | re.S)
        desc = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', html, re.I | re.S)
        pid = str(md.get('id') or folder.name.lower())
        if pid in ids:
            print('ERRO: id duplicado:', pid, file=sys.stderr)
            sys.exit(1)
        ids.add(pid)
        creators = md.get('creators', [])
        if isinstance(creators, str):
            creators = [creators]
        items.append({
            'id': pid,
            'file': 'web-projects/' + entry.relative_to(FOLDER).as_posix(),
            'type': str(md.get('type') or entry.suffix.lower().lstrip('.')),
            'title': str(md.get('title') or (clean(title.group(1)) if title else folder.name)),
            'description': str(md.get('description') or (clean(desc.group(1)) if desc else '')),
            'creator': str(md.get('creator', '')) if not isinstance(md.get('creator'), list) else '',
            'creators': creators,
            'icon': str(md.get('icon') or '🌐'),
            'tags': md.get('tags', []) if isinstance(md.get('tags', []), list) else [md['tags']],
            'order': to_int(md.get('order')),
            'updated': str(md.get('updated', '')),
        })
    items.sort(key=lambda x: (x['order'], x['title'].lower()))
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(items)} projeto(s) → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
