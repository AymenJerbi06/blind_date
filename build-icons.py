import concurrent.futures, json, pathlib, re, urllib.request
root = pathlib.Path(__file__).parent
names = {'heart':'heart','spark':'sparkle','home':'house','calendar':'calendar-blank','user':'user-circle','crown':'crown','shield':'shield-check','pin':'map-pin','bell':'bell','arrow':'arrow-right','chevron':'caret-right','back':'caret-left','down':'caret-down','sun':'sun','moon':'moon','leaf':'leaf','coffee':'coffee','lock':'lock-key','check':'check','close':'x','clock':'clock','settings':'sliders-horizontal','flower':'flower','people':'users','logout':'sign-out','edit':'pencil-simple','star':'star','flag':'flag','copy':'copy','mountain':'mountains','smile':'smiley','info':'info','grid':'squares-four','plus':'plus','quote':'quotes','warning':'warning-circle','seal':'seal-check','question':'question'}
def fetch(entry):
    key, name, weight = entry
    suffix = '-fill' if weight == 'fill' else ''
    url = f'https://raw.githubusercontent.com/phosphor-icons/core/main/assets/{weight}/{name}{suffix}.svg'
    text = urllib.request.urlopen(url, timeout=30).read().decode()
    return key + (':fill' if weight == 'fill' else ''), re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', text, flags=re.S)
entries = [(k,n,'regular') for k,n in names.items()] + [(k,n,'fill') for k,n in names.items() if k in ['home','heart','calendar','user','spark','clock','quote','warning','seal','star']]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    icons = dict(pool.map(fetch, entries))
(root/'dist/icons.js').write_text('// Phosphor Icons, MIT. Official SVG paths bundled locally.\nconst icons = '+json.dumps(icons)+';\nconst icon = (name, filled = false) => `<svg class="icon" viewBox="0 0 256 256" aria-hidden="true">${icons[name + (filled ? ":fill" : "")] || icons[name] || icons.info}</svg>`;\n', encoding='utf-8')
(root/'dist/assets/phosphor-LICENSE.txt').write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/phosphor-icons/core/main/LICENSE', timeout=30).read())
print(f'Bundled {len(icons)} official SVGs')
