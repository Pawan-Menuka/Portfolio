"""One-time asset handoff; run with Pillow. Original assets remain unchanged."""
from pathlib import Path
import hashlib
import json
import struct
from PIL import Image

frontend = Path(__file__).resolve().parents[1]
source = Path(r'C:\Users\Asus\Documents\Codex\2026-09-06\the\outputs')
hero = source / 'portfolio-b/hero.png'
image = Image.open(hero).convert('RGB')
original_size = image.size
image.thumbnail((1440, 1440), Image.Resampling.LANCZOS)
target = frontend / 'public/images/iceberg-b.webp'
image.save(target, 'WEBP', quality=88, method=6)

pairs = [
    ('realism-b/iceberg-realism-b.glb', 'public/models/iceberg-b.glb', 'exact copy'),
    ('portfolio-b/hero.png', 'public/images/iceberg-b.webp', 'WebP quality 88, maximum 1440 pixels per side, no crop'),
    ('camera-study/camera-path.mjs', 'src/features/iceberg/camera-path.mjs', 'exact copy'),
    ('camera-study/camera-path.test.mjs', 'tests/camera-path.test.mjs', 'adapted imports; compare immutable reference fixture instead of rewriting it'),
    ('camera-study/path-samples.json', 'tests/fixtures/iceberg/path-samples.json', 'exact copy; outside public assets'),
    ('camera-study/validation.json', 'tests/fixtures/iceberg/mesh-clearance.json', 'exact copy; outside public assets'),
]
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
assets = []
for src, dest, treatment in pairs:
    a, b = source / src, frontend / dest
    entry = dict(source=src, destination=dest, treatment=treatment,
                 source_sha256=digest(a), destination_sha256=digest(b),
                 source_bytes=a.stat().st_size, destination_bytes=b.stat().st_size)
    if treatment.startswith('exact copy'): assert entry['source_sha256'] == entry['destination_sha256']
    assets.append(entry)
raw = (frontend / 'public/models/iceberg-b.glb').read_bytes()
magic, version, length = struct.unpack_from('<III', raw)
assert magic == 0x46546c67 and version == 2 and length == len(raw)
size, kind = struct.unpack_from('<II', raw, 12)
assert kind == 0x4e4f534a
doc = json.loads(raw[20:20+size])
names = [node['name'] for node in doc['nodes'] if 'mesh' in node]
assert sorted(names) == ['ice_above', 'ice_below']
manifest = dict(source_root=str(source), selected_version='B', assets=assets,
                hero_original_dimensions=original_size, hero_dimensions=image.size,
                glb_mesh_names=names, glb_extensions=doc.get('extensionsUsed', []),
                note='GLB metadata and copy fidelity verified. Actual browser decoding/rendering is Phase 3.')
(frontend / 'docs/iceberg-assets.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
print(json.dumps(dict(hero_bytes=target.stat().st_size, hero_dimensions=image.size, glb_mesh_names=names)))
