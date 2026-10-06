from pathlib import Path
import zipfile
root = Path(__file__).resolve().parent
artifacts = root / 'artifacts'
artifacts.mkdir(exist_ok=True)
with zipfile.ZipFile(artifacts / 'typescript-console-firefox.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted((root / 'dist').rglob('*')):
        if p.is_file(): z.write(p, str(p.relative_to(root / 'dist')))
with zipfile.ZipFile(artifacts / 'typescript-console-firefox-source.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(root.rglob('*')):
        if p.is_file() and not set(p.relative_to(root).parts) & {'node_modules', 'dist', 'artifacts', '.git'}:
            z.write(p, str(p.relative_to(root)))
for p in artifacts.glob('*.zip'):
    with zipfile.ZipFile(p) as z: assert z.testzip() is None
print('Verified Firefox extension and source ZIPs:', artifacts)
