#!/usr/bin/env python3
"""
gerar_manifest.py — varre a pasta web-projects/ e gera data/web-projects.json.

Uso local:   python tools/gerar_manifest.py
No GitHub:   roda sozinho a cada push (ver .github/workflows/pages.yml).

Para cada arquivo .html / .htm / .php:
  título     = <title> da página (ou o nome do arquivo)
  descrição  = <meta name="description"> (se existir)
Para ajustar título, descrição, ícone, tags, ordem ou esconder um projeto,
edite web-projects/_meta.json (chave = nome do arquivo). Nada é obrigatório.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOLDER = ROOT / "web-projects"
OUT = ROOT / "data" / "web-projects.json"
EXTS = {".html", ".htm", ".php"}


def slug(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
    return s or "projeto"


def read_head(path: Path):
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return "", ""
    t = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
    d = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', text, re.I | re.S)
    clean = lambda v: re.sub(r"\s+", " ", v).strip() if v else ""
    return clean(t.group(1)) if t else "", clean(d.group(1)) if d else ""


def main():
    meta = {}
    meta_file = FOLDER / "_meta.json"
    if meta_file.exists():
        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            sys.exit(f"Erro em web-projects/_meta.json: {e}")

    items = []
    for f in sorted(FOLDER.iterdir()):
        if not f.is_file() or f.suffix.lower() not in EXTS or f.name.startswith("_"):
            continue
        m = meta.get(f.name, {})
        if m.get("hidden"):
            continue
        title, desc = read_head(f)
        items.append({
            "id": slug(f.stem),
            "file": f"web-projects/{f.name}",
            "type": f.suffix.lower().lstrip("."),
            "title": m.get("title") or title or f.stem,
            "description": m.get("description") or desc or "",
            "icon": m.get("icon", "🌐"),
            "tags": m.get("tags", []),
            "order": m.get("order", 999),
        })

    items.sort(key=lambda i: (i["order"], i["title"].lower()))
    for i in items:
        i.pop("order")
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(items)} projeto(s) → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
