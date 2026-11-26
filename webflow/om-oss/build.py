"""Turn prototype/om-oss.html into the pieces the Webflow page is built from.

  embed-style.html   HtmlEmbed at the top of the page: CSS, riso filters, the sky layers
  embed-mel.html     HtmlEmbed inside .oo-mel__stage: the drawn melanger + hotspots
  embed-strip.html   HtmlEmbed inside the prep chapter: the four-step strip
  embed-gauge.html   HtmlEmbed inside fact 02: the 5,9 / 6 kg gauge
  sections/*.html    native Webflow elements (inserted with the WHTML builder)
  register.css       one trivial rule per class, so the builder creates the Webflow classes
  footer.html        page footer code: the scroll clock, flips, lightbox, strikes

Every class is prefixed oo- so nothing collides with the rest of the site.
Run: python3 webflow/om-oss/build.py
"""
import re, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, '..', '..', 'prototype', 'om-oss.html'), encoding='utf-8').read()
OUT = HERE
os.makedirs(os.path.join(OUT, 'sections'), exist_ok=True)

def px(m):  # prefix a class token
    return 'oo-' + m
def prefix_class_attr(html):
    return re.sub(r'class="([^"]*)"', lambda m: 'class="' + ' '.join(px(c) for c in m.group(1).split()) + '"', html)
def prefix_css(css):
    # protect url(...) values (the grain's data URI contains "www.w3.org")
    urls = []
    css = re.sub(r'url\([^)]*\)', lambda m: urls.append(m.group(0)) or f'\x00{len(urls)-1}\x00', css)
    css = re.sub(r'(?<![\d])\.([a-z][\w-]*)', lambda m: '.' + (m.group(1) if m.group(1).startswith('oo-') else px(m.group(1))), css)
    return re.sub(r'\x00(\d+)\x00', lambda m: urls[int(m.group(1))], css)

# ---------- CSS ----------
css = re.search(r'<style>(.*?)</style>', SRC, re.S).group(1)
css = prefix_css(css)
css = css.replace('--display:"Recoleta","Fraunces",Georgia,serif;', '--display:"Recoleta",Georgia,serif;')
css = css.replace('--body:"DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif;', '--body:"Dmsans Variablefont Opsz Wght","DM Sans",system-ui,sans-serif;')
# page-level rules only touch this page (the embed lives on this page alone)
SCOPE = ['.oo-cover', '.oo-day', '.oo-sheet', '.oo-nod', '.oo-lb']  # never [class*=oo-]: the script puts oo-js on <html>
css = css.replace('img{max-width:100%;display:block}', ','.join(s + ' img' for s in SCOPE) + '{max-width:100%;display:block}')
css = css.replace('a{color:inherit}\n', '')
css = css.replace('*{box-sizing:border-box}\n', ','.join(SCOPE) + ',' + ','.join(s + ' *' for s in SCOPE) + '{box-sizing:border-box}\n')
css = css.replace('body{margin:0;background:var(--ink);color:var(--ink);font:400 1.0625rem/1.6 var(--body);-webkit-font-smoothing:antialiased;overflow-x:clip}',
                  'body{background:var(--ink)}\n.page_wrapper{background:transparent}\n' + ','.join(SCOPE) + '{font-family:var(--body)}\n' + '.oo-cover,.oo-day,.oo-sheet,.oo-nod{color:var(--ink);font-size:1.0625rem;line-height:1.6;-webkit-font-smoothing:antialiased}')
# the site nav sits on top of the cover (absolute, ~131px)
css = css.replace('.oo-cover{position:relative;color:var(--on-sky);padding-top:clamp(3rem,9vh,7rem);',
                  '.oo-cover{position:relative;color:var(--on-sky);padding-top:calc(131px + clamp(2rem,6vh,5rem));')
# Recoleta has no italic: keep the colour change, drop the fake slant
css = css.replace('.oo-cover__display em{font-style:italic;', '.oo-cover__display em{font-style:normal;')
css = css.replace('.oo-cover__kicker{display:block;font:italic 500', '.oo-cover__kicker{display:block;letter-spacing:0;font:normal 600')
# Webflow resets headings/paragraph margins and colours; make ours win inside our sections
css += '\n.oo-cover h1,.oo-day h2,.oo-day h3,.oo-sheet h2,.oo-sheet h3,.oo-nod h2{color:inherit}\n.oo-cover h1 span,.oo-cover h1 em{color:inherit}\n.oo-cover__display em{color:var(--orange-light)}\n.oo-panel p,.oo-fact p,.oo-cover p{font-size:inherit}\n'
css += '.oo-fact__art>img{width:100%;height:100%;object-fit:cover}\n'
# site-level clashes: the floating menu button (top-left, phones) and the site's h3 letter-spacing
css += '.oo-cover p,.oo-panel p,.oo-fact p,.oo-label dd,.oo-not li span:last-child,.oo-count span{letter-spacing:normal}\n'
css += '.oo-fact h3,.oo-label__name{letter-spacing:0}\n@media (max-width: 900px){.oo-mel{top:calc(76px + env(safe-area-inset-top,0px))}}\n'
css += '.oo-label.oo-is-orange{--band:var(--orange)}.oo-label.oo-is-red{--band:var(--red)}.oo-label.oo-is-aqua{--band:var(--aqua)}\n'
# prototype-only bits
css = re.sub(r'/\* ---------- proto ribbon ---------- \*/.*?\n(?=\n/\* ---------- cover)', '', css, flags=re.S)

filters = re.search(r'(<svg width="0" height="0".*?</svg>)', SRC, re.S).group(1)
sky = '<div class="oo-sky" aria-hidden="true"></div><div class="oo-stars" aria-hidden="true"></div><div class="oo-grain" aria-hidden="true"></div>'
style_embed = ('<!-- Om oss (ny). Source: github.com/legomedved/nottanrop, prototype/om-oss.html → webflow/om-oss/build.py -->\n'
               '<style>' + css + '</style>\n' + filters + '\n' + sky)
open(os.path.join(OUT, 'embed-style.html'), 'w').write(style_embed)

# ---------- body ----------
body = re.search(r'<main>(.*?)</main>', SRC, re.S).group(1)

# melanger stage → embed (svg + real hotspot buttons)
mel = re.search(r'<div class="mel__stage">(.*?)</div>\s*<span class="mel__label', body, re.S)
mel_inner = mel.group(1).strip()
mel_inner = re.sub(r'\s*$', '', mel_inner)
open(os.path.join(OUT, 'embed-mel.html'), 'w').write(prefix_class_attr(mel_inner.rsplit('</div>',0)[0]))
body = body.replace(mel.group(0), '<div class="mel__stage" data-slot="mel"></div>\n        <span class="mel__label')

strip = re.search(r'<ol class="strip".*?</ol>', body, re.S)
open(os.path.join(OUT, 'embed-strip.html'), 'w').write(prefix_class_attr(strip.group(0)))
body = body.replace(strip.group(0), '<div class="strip-slot" data-slot="strip"></div>')

gauge = re.search(r'<svg class="gauge".*?</svg>', body, re.S)
open(os.path.join(OUT, 'embed-gauge.html'), 'w').write(prefix_class_attr(gauge.group(0)))
body = body.replace(gauge.group(0), '<div class="gauge-slot" data-slot="gauge"></div>')

# inline custom properties → combo classes (Webflow drops inline styles)
for c in ['orange','red','aqua']:
    body = body.replace(f'<article class="label" style="--band:var(--{c})">', f'<article class="label is-{c}">')

# interactive bits the script creates: photo buttons, flip buttons, strike svgs
body = re.sub(r'<button type="button">(<img [^>]*>)</button>', r'\1', body)
body = re.sub(r'\s*<button class="label__flip"[^>]*>.*?</button>', '', body)
body = re.sub(r'<svg viewBox="0 0 100 10".*?</svg>', '', body, flags=re.S)
# ids → data hooks (the builder may rewrite ids)
for i in ['clock', 'stage-mini', 'stage']:
    body = body.replace(f'id="{i}"', f'data-oo="{i}"')
body = prefix_class_attr(body)
# images point at their Webflow assets
ASSETS = json.load(open(os.path.join(HERE, 'assets.json')))
body = re.sub(r'src="img/([\w-]+)\.webp"', lambda m: 'src="https://s3.amazonaws.com/webflow-prod-assets/693eb2bc3e42b68a1bb20701/' + ASSETS[m.group(1)] + '"', body)

# split into top-level sections
parts = re.findall(r'(<(header|section)\b.*?</\2>)', body, re.S)
names = ['cover', 'day', 'labels', 'not', 'facts', 'nod']
classes = set()
for (html, _), n in zip(parts, names):
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
    html = re.sub(r'\n\s*', '\n', html).strip()
    open(os.path.join(OUT, 'sections', f'{n}.html'), 'w').write(html)
    for m in re.finditer(r'class="([^"]*)"', html):
        classes.add(tuple(m.group(1).split()))
# register: one rule per class chain (base, then combo)
rules = []
seen = set()
for chain in sorted(classes):
    for k in range(1, len(chain) + 1):
        sel = '.' + '.'.join(chain[:k])
        if sel not in seen:
            seen.add(sel); rules.append(sel + '{box-sizing:border-box}')
open(os.path.join(OUT, 'register.css'), 'w').write('\n'.join(rules))

# ---------- script ----------
js = re.search(r'<script>\n(\(function\(\)\{.*?\}\)\(\);)\n</script>', SRC, re.S).group(1)
js = js.replace('root.classList.add("js");', 'root.classList.add("oo-js");')
for sel in ['.mel__layer', '.panel, .word', '.spot button', '.label__flip', '.ph button', '.label']:
    pass
js = re.sub(r'"([^"]*)"', lambda m: '"' + prefix_css(m.group(1)) + '"' if '.' in m.group(1) and not m.group(1).startswith('#') and ' ' not in m.group(1).replace(', ',',').replace(' button','') or m.group(1).startswith('.') else m.group(0), js)
js = js.replace('classList.remove("is-waiting")', 'classList.remove("oo-is-waiting")').replace('classList.add("is-waiting")', 'classList.add("oo-is-waiting")')
js = js.replace('classList.toggle("is-flipped")', 'classList.toggle("oo-is-flipped")')
js = js.replace('closest(".label")', 'closest(".oo-label")')
js = js.replace('document.getElementById("clock")', 'document.querySelector(\'[data-oo="clock"]\')')
js = js.replace('document.getElementById("stage")', 'document.querySelector(\'[data-oo="stage"]\')')
js = js.replace('document.getElementById("stage-mini")', 'document.querySelector(\'[data-oo="stage-mini"]\')')
pre = r'''
  /* --- things Webflow can't hold natively: real buttons, the strikes, the lightbox --- */
  document.querySelectorAll(".oo-ph img").forEach(function(img){
    if(img.parentElement.tagName==="BUTTON") return;
    var b=document.createElement("button");b.type="button";img.parentNode.insertBefore(b,img);b.appendChild(img);
  });
  document.querySelectorAll(".oo-label").forEach(function(l){
    if(l.querySelector(".oo-label__flip")) return;
    var b=document.createElement("button");b.type="button";b.className="oo-label__flip";b.setAttribute("aria-pressed","false");b.textContent="Snu glasset";l.appendChild(b);
  });
  var STRIKES=["M1 6c18-3 40 2 60-1s28-2 38 1","M1 5c20 2 34-3 54 0s30 2 44-2","M1 6c14-2 36-3 52 0s32 1 46-1","M1 5c22-3 38 3 58 0s26-3 40 1","M1 6c16 1 36-4 56-1s28 1 42-1"];
  document.querySelectorAll(".oo-word").forEach(function(w,i){
    if(w.querySelector("svg")) return;
    w.insertAdjacentHTML("beforeend",'<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="'+STRIKES[i%5]+'"/></svg>');
  });
  if(!document.getElementById("lb")){
    document.body.insertAdjacentHTML("beforeend",'<dialog class="oo-lb" id="lb" aria-label="Bilde"><img id="lb-img" alt=""><div class="oo-lb__foot"><span id="lb-cap"></span><button type="button" id="lb-close">Lukk</button></div></dialog>');
  }
'''
js = js.replace('  var reduce = window.matchMedia', pre + '\n  var reduce = window.matchMedia', 1)
footer = ('<!-- Om oss (ny): scroll clock, sky, melanger, flips, lightbox.\n'
          '     Source: github.com/legomedved/nottanrop webflow/om-oss (built from prototype/om-oss.html). -->\n'
          '<script>\n' + js + '\n</script>')
open(os.path.join(OUT, 'footer.html'), 'w').write(footer)
print('sections', [n for n in names], 'classes', len(seen), 'css', len(style_embed), 'footer', len(footer))

# ---------- jsDelivr bundle: om-oss.css + om-oss.js ----------
# The Webflow page loads these pinned to a commit (same pattern as dist/nottekart.min.js):
#   embed at the top of the page:  <link rel="stylesheet" href=".../webflow/om-oss/om-oss.css">
#   page footer code:              <script src=".../webflow/om-oss/om-oss.js" defer></script>
import subprocess, shutil
esb = shutil.which('esbuild') or '/tmp/claude-0/node_modules/.bin/esbuild'
open(os.path.join(OUT, 'om-oss.src.css'), 'w').write(css)
mcss = subprocess.run([esb, os.path.join(OUT, 'om-oss.src.css'), '--minify'], capture_output=True, text=True, check=True).stdout
os.remove(os.path.join(OUT, 'om-oss.src.css'))
open(os.path.join(OUT, 'om-oss.css'), 'w').write('/* Nøttanrop · Om oss (ny) · built from prototype/om-oss.html by webflow/om-oss/build.py */\n' + mcss)
def squeeze(h): return re.sub(r'>\s+<', '><', re.sub(r'<!--.*?-->', '', h, flags=re.S)).strip()
inject = {
  'defs': squeeze(filters) + sky,
  'mel': squeeze(open(os.path.join(OUT, 'embed-mel.html')).read()),
  'strip': squeeze(open(os.path.join(OUT, 'embed-strip.html')).read()),
  'gauge': squeeze(open(os.path.join(OUT, 'embed-gauge.html')).read()),
}
inj_js = ('  /* --- drawings: riso filters, sky layers, melanger, prep strip, gauge (kept out of Webflow) --- */\n'
          '  var ART=' + json.dumps(inject, ensure_ascii=False) + ';\n'
          '  if(!document.querySelector(".oo-sky")) document.body.insertAdjacentHTML("afterbegin",ART.defs);\n'
          '  ["mel","strip","gauge"].forEach(function(k){document.querySelectorAll(\'[data-slot="\'+k+\'"]\').forEach(function(el){if(!el.firstElementChild) el.innerHTML=ART[k]})});\n')
bundle = js.replace(pre, inj_js + pre, 1)
open(os.path.join(OUT, 'om-oss.src.js'), 'w').write(bundle)
mjs = subprocess.run([esb, os.path.join(OUT, 'om-oss.src.js'), '--minify', '--target=es2017'], capture_output=True, text=True, check=True).stdout
os.remove(os.path.join(OUT, 'om-oss.src.js'))
open(os.path.join(OUT, 'om-oss.js'), 'w').write('/* Nøttanrop · Om oss (ny) · built by webflow/om-oss/build.py */\n' + mjs)
print('bundle css', len(mcss), 'js', len(mjs))
