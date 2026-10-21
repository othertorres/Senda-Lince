"""Comprueba que public/ coincide con la copia publicada recuperada."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'recovery/production-manifest.json').read_text())
errors = []
for item in manifest['files']:
    path = ROOT / 'public' / item['path']
    if not path.is_file():
        errors.append(f"Falta: {item['path']}")
    elif hashlib.sha256(path.read_bytes()).hexdigest() != item['sha256']:
        errors.append(f"Contenido distinto: {item['path']}")
if errors:
    raise SystemExit('\n'.join(errors))
print(f"Copia verificada: {len(manifest['files'])} archivos coinciden con sus SHA-256.")
