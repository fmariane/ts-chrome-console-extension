from pathlib import Path
import shutil
import zipfile

root = Path(__file__).resolve().parent
# A source ZIP extracted outside the canonical extension directory builds locally.
outputs = root.parent / 'outputs' if root.name == 'extension' else root / 'outputs'
outputs.mkdir(exist_ok=True)
project = outputs / 'ts-console'
project.mkdir(exist_ok=True)
for folder in ['src', 'tests', 'dist']:
    shutil.copytree(root / folder, project / folder, dirs_exist_ok=True)
for name in ['package.json', 'package-lock.json', 'build.mjs', 'package.py', 'README.md']:
    shutil.copy2(root / name, project / name)
with zipfile.ZipFile(outputs / 'typescript-console-extension.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted((root / 'dist').rglob('*')):
        if p.is_file():
            z.write(p, str(p.relative_to(root / 'dist')))
with zipfile.ZipFile(outputs / 'typescript-console-source.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(project.rglob('*')):
        if p.is_file() and 'dist' not in p.relative_to(project).parts:
            z.write(p, str(p.relative_to(project)))
for name in ['typescript-console-extension.zip', 'typescript-console-source.zip']:
    with zipfile.ZipFile(outputs / name) as z:
        assert z.testzip() is None
print(f'Restored unpacked extension: {project / "dist"}')
print(f'Verified extension and source ZIPs: {outputs}')
