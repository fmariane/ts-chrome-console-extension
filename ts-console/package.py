from pathlib import Path
import shutil
import zipfile
root = Path(__file__).resolve().parent
repo = root.parent
unpacked = repo / 'typescript-console-extension'
shutil.copytree(root / 'dist', unpacked, dirs_exist_ok=True)
with zipfile.ZipFile(repo / 'typescript-console-extension.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted((root / 'dist').rglob('*')):
        if p.is_file(): z.write(p, str(p.relative_to(root / 'dist')))
with zipfile.ZipFile(repo / 'typescript-console-source.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for folder in ['src', 'tests']:
        for p in sorted((root / folder).rglob('*')):
            if p.is_file(): z.write(p, str(p.relative_to(root)))
    for name in ['README.md', 'package.json', 'package-lock.json', 'build.mjs', 'package.py']:
        z.write(root / name, name)
for name in ['typescript-console-extension.zip', 'typescript-console-source.zip']:
    with zipfile.ZipFile(repo / name) as z: assert z.testzip() is None
print('Verified repository dist, unpacked extension, and ZIPs.')
