"""
Diagnostic script to test web interface
"""
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

print("=" * 60)
print("WEB INTERFACE DIAGNOSTICS")
print("=" * 60)

# Check paths
BASE_DIR = Path(__file__).parent
TEMPLATE_DIR = BASE_DIR / 'web' / 'templates'
STATIC_DIR = BASE_DIR / 'web' / 'static'
INDEX_FILE = TEMPLATE_DIR / 'index.html'

print(f"\n1. Base Directory: {BASE_DIR}")
print(f"   Exists: {'✅' if BASE_DIR.exists() else '❌'}")

print(f"\n2. Template Directory: {TEMPLATE_DIR}")
print(f"   Exists: {'✅' if TEMPLATE_DIR.exists() else '❌'}")

print(f"\n3. Static Directory: {STATIC_DIR}")
print(f"   Exists: {'✅' if STATIC_DIR.exists() else '❌'}")

print(f"\n4. index.html: {INDEX_FILE}")
print(f"   Exists: {'✅' if INDEX_FILE.exists() else '❌'}")

if INDEX_FILE.exists():
    print(f"   Size: {INDEX_FILE.stat().st_size} bytes")

# Check static files
css_file = STATIC_DIR / 'css' / 'style.css'
js_file = STATIC_DIR / 'js' / 'app.js'

print(f"\n5. style.css: {css_file}")
print(f"   Exists: {'✅' if css_file.exists() else '❌'}")

print(f"\n6. app.js: {js_file}")
print(f"   Exists: {'✅' if js_file.exists() else '❌'}")

# Test imports
print("\n7. Testing imports...")
try:
    from src.interfaces.web_api import app
    print("web_api imported successfully")
except Exception as e:
    print(f"Import failed: {e}")

# Test Flask app
print("\n8. Testing Flask app...")
try:
    from src.interfaces.web_api import app
    print(f"   Template folder: {app.template_folder}")
    print(f"   Static folder: {app.static_folder}")
    print("Flask app configured")
except Exception as e:
    print(f"Flask test failed: {e}")

print("\n" + "=" * 60)
print("DIAGNOSTICS COMPLETE")
print("=" * 60)