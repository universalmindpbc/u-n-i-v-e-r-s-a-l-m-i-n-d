"""Reuse the exact I Am character markup and planet texture in Informatics."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
source=(root/'i  a m/realtime-voice-assistant.js').read_text()
start=source.index('  function makeMiniPlanetTexture(seed) {')
end=source.index('\n  window.IAMRealtimeVoiceAssistant',start)
function=source[start:end]
start=source.index('    <div class="iam-realtime-character"')
end=source.index('\n    <div class="iam-realtime-voice__panel"',start)
markup=source[start:end].replace('src="favicon.png?v=iam-favicon-4"','src="/vogue/iam/favicon.png?v=iam-favicon-4"')
(root/'Informatics/universal-one-character.js').write_text('// Generated from the existing I Am identity by tools/sync-universal-one-character.py.\n(()=>{\n'+function+'\nwindow.UniversalOneIdentity={texture:makeMiniPlanetTexture,character:'+json.dumps(markup)+'};\n})();\n')
