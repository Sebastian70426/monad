# -*- mode: python ; coding: utf-8 -*-
import sys, os
from PyInstaller.utils.hooks import collect_data_files

root = os.path.dirname(os.path.abspath(SPEC))

eel_datas = collect_data_files('eel')

added_files = [
    (os.path.join(root, 'app', 'web'), 'app/web'),
    (os.path.join(root, 'app', 'prompts'), 'app/prompts'),
]
added_files.extend(eel_datas)

a = Analysis(
    [os.path.join(root, 'app', 'main.py')],
    pathex=[],
    binaries=[],
    datas=added_files,
    hiddenimports=[
        'eel', 'eel.browsers',
        'openai', 'chromadb',
        'sentence_transformers', 'fitz', 'pptx', 'groq',
        'PIL', 'numpy', 'torch', 'transformers', 'tokenizers',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter.test', 'test', 'pydoc', 'scipy', 'sklearn'],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz, a.scripts, a.binaries, a.datas, [],
    name='Monad',
    debug=False,
    console=False,
    icon=os.path.join(root, 'Monad.icns') if sys.platform == 'darwin' else os.path.join(root, 'Monad.ico'),
)

if sys.platform == 'darwin':
    app = BUNDLE(
        exe,
        name='Monad.app',
        icon=os.path.join(root, 'Monad.icns'),
        bundle_identifier='com.monad.app',
        info_plist={
            'NSPrincipalClass': 'NSApplication',
            'NSHighResolutionCapable': True,
            'CFBundleName': 'Monad',
            'CFBundleDisplayName': 'Monad',
            'CFBundleShortVersionString': '2.0.0',
            'CFBundleVersion': '2.0.0',
            'CFBundleIdentifier': 'com.monad.app',
        },
    )
