/* Nøttanrop · drips (site-wide, replaces nanfix7 / drip-seams).
   One drip, one direction, everywhere: the colour ABOVE melts DOWN into what's below.

   The shape is the site's original hand-drawn template drip, turned so the drops hang,
   with the notch where its two halves were joined smoothed away. One period (a tile and its
   mirror) is seamless, and it is drawn at natural proportions (never stretched), offset per page.

   How a drip is made: the section above is masked along its bottom edge with the drip and pulled
   down over the next section by the drip height. The drops ARE the section (its gradient, grain and
   picture continue into them), and the gaps show the real section below, so there's no colour to
   match by hand and nothing can seam.
     hero → next section      every hero type (home, produkter, produkt, product, nøtteverden, om, fh, legal, faq/presse/investor…)
     last section → footer    a drip layer in the last section's colour, over the footer's own colour
     Om oss shore strip, review cards   same shape, same direction */
(function(){
  var D=document, R=D.documentElement;
  var SHAPE='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2084.6 187.5" preserveAspectRatio="none"><path d="M0 0 L0 25.5 C14.5 26.3 33.1 42.7 48.4 46.4 C60.6 49.2 73.8 49.9 85.2 43.9 C90.2 41.2 94.4 37.5 98.1 33.3 C107.8 22.9 116.4 11.1 133.5 16.7 C145.3 20.5 148.2 35.9 151.4 46.4 C153.8 54.6 155.7 63 157.5 71.5 C159.9 82 168.9 96.2 180 99.1 C198.8 104.1 201.8 81.2 202.5 68.3 C203.3 52.9 208 39.2 220.4 29.1 C233.3 18.6 248.1 14.2 264.3 19.5 C280.1 24.6 286.2 37.9 289 52.8 C291.1 63.4 290.8 74.2 290.8 85 C290.7 92.7 290.4 100.5 291.2 108.1 C291.9 114.3 294 120.9 301.7 121.5 C308.8 122 311.4 115.8 314.2 110.7 C315 109 315.4 107.1 315.6 105.4 C316.9 96.5 318 87.7 318.8 78.8 C320.5 59.8 330.9 46.5 347.4 38.1 C417.8 2.1 394.4 117.9 402.6 146.1 C409.6 169.8 422.8 159 426.1 140.3 C429.6 120.3 416.6 50.3 455.9 46.8 C475.1 45.2 471.7 66.1 471.1 78.6 C470.6 88.4 476.8 105.6 489.5 100.7 C503.9 95 500.3 60.4 502 49.3 C503.8 39.1 509.3 24.5 521.2 22.2 C538.5 18.8 555.3 35 575 31.5 C584.1 29.8 592.7 26.1 600.5 21.5 C608.4 16.9 622.7 46.3 624.1 59.2 C624.9 67.9 631.3 75.4 639.3 77.1 C647.7 78.8 654.6 75.2 659.3 66.8 C661.1 63.5 662.6 60 665.3 57.2 C668.8 53.6 673.3 52.7 677.9 54.5 C680.6 55.5 682.8 57.1 685 58.9 C697.6 69.3 705.1 82.8 709.7 97.9 C711.9 105.2 715.5 117.2 720.7 128.8 C728.8 146.4 740.8 162.9 757.3 159.8 C777.8 155.8 779.6 131 780.9 114.7 C782.7 93.7 786.4 72.9 792.5 52.6 C795.2 43.8 799 35.4 805.7 28.7 C812.9 21.8 820.3 20.9 828.7 25.9 C838.2 31.6 844.5 39.9 848.3 49.9 C856.5 71.3 857.7 93.6 854.9 116.1 C854.3 121.5 852.8 126.7 852.4 132.1 C852 139.5 856.9 145.7 863.5 146.8 C870.9 148.1 878 143.8 880.5 136.6 C881.6 133.3 881.4 129.9 880.9 126.7 C878.8 113.8 879.2 100.8 879.6 88 C880.4 58.7 900.9 40.4 925.9 28.8 C932.9 25.6 938.5 27.9 942.7 34.2 C945.7 38.7 947.1 43.8 948.1 48.9 C953.5 77.2 951 105.4 946.6 133.6 C945.1 143.3 941.7 152.7 941.6 162.7 C941.4 176.4 951.1 185.8 964.6 185.2 C977.2 184.6 986.7 173.3 985.5 160.6 C985.2 157.1 984.3 153.8 982.9 150.6 C976.9 136.2 972.9 121.4 971.6 105.9 C970.4 89.7 967.1 72.7 970.3 56.5 C976.8 23.7 995.5 51.3 1015.6 41.7 C1025.6 37 1031.8 25 1042.3 25.5 C1052.7 25 1058.9 37 1068.9 41.7 C1089 51.3 1107.8 23.7 1114.2 56.5 C1117.4 72.7 1114.2 89.7 1112.9 105.9 C1111.6 121.4 1107.7 136.2 1101.6 150.6 C1100.3 153.8 1099.4 157.1 1099 160.6 C1097.8 173.3 1107.3 184.6 1119.9 185.2 C1133.5 185.8 1143.2 176.4 1143 162.7 C1142.9 152.7 1139.4 143.3 1137.9 133.6 C1133.5 105.4 1131.1 77.2 1136.5 48.9 C1137.4 43.8 1138.8 38.7 1141.8 34.2 C1146 27.9 1151.7 25.6 1158.7 28.8 C1183.6 40.4 1204.1 58.7 1204.9 88 C1205.4 100.8 1205.7 113.8 1203.6 126.7 C1203.1 129.9 1203 133.3 1204.1 136.6 C1206.6 143.8 1213.6 148.1 1221 146.8 C1227.7 145.7 1232.6 139.5 1232.2 132.1 C1231.7 126.7 1230.3 121.5 1229.7 116.1 C1226.8 93.6 1228 71.3 1236.2 49.9 C1240 39.9 1246.4 31.6 1255.9 25.9 C1264.3 20.9 1271.7 21.8 1278.8 28.7 C1285.5 35.4 1289.4 43.8 1292 52.6 C1298.2 72.9 1301.9 93.7 1303.6 114.7 C1305 131 1306.7 155.8 1327.2 159.8 C1343.7 162.9 1355.7 146.4 1363.8 128.8 C1369.1 117.2 1372.7 105.2 1374.9 97.9 C1379.4 82.8 1386.9 69.3 1399.5 58.9 C1401.7 57.1 1403.9 55.5 1406.6 54.5 C1411.2 52.7 1415.7 53.6 1419.2 57.2 C1421.9 60 1423.4 63.5 1425.3 66.8 C1430 75.2 1436.9 78.8 1445.2 77.1 C1453.3 75.4 1459.6 67.9 1460.4 59.2 C1461.8 46.3 1476.1 16.9 1484 21.5 C1491.9 26.1 1500.4 29.8 1509.5 31.5 C1529.2 35 1546.1 18.8 1563.3 22.2 C1575.3 24.5 1580.8 39.1 1582.5 49.3 C1584.3 60.4 1580.6 95 1595.1 100.7 C1607.8 105.6 1614 88.4 1613.5 78.6 C1612.9 66.1 1609.5 45.2 1628.7 46.8 C1668 50.3 1655 120.3 1658.4 140.3 C1661.8 159 1675 169.8 1682 146.1 C1690.2 117.9 1666.7 2.1 1737.2 38.1 C1753.7 46.5 1764.1 59.8 1765.7 78.8 C1766.5 87.7 1767.7 96.5 1769 105.4 C1769.2 107.1 1769.6 109 1770.4 110.7 C1773.1 115.8 1775.7 122 1782.8 121.5 C1790.6 120.9 1792.7 114.3 1793.3 108.1 C1794.2 100.5 1793.8 92.7 1793.8 85 C1793.7 74.2 1793.5 63.4 1795.5 52.8 C1798.4 37.9 1804.5 24.6 1820.3 19.5 C1836.4 14.2 1851.2 18.6 1864.1 29.1 C1876.5 39.2 1881.3 52.9 1882.1 68.3 C1882.8 81.2 1885.7 104.1 1904.5 99.1 C1915.7 96.2 1924.6 82 1927 71.5 C1928.9 63 1930.7 54.6 1933.2 46.4 C1936.3 35.9 1939.2 20.5 1951.1 16.7 C1968.2 11.1 1976.8 22.9 1986.4 33.3 C1990.2 37.5 1994.4 41.2 1999.4 43.9 C2010.8 49.9 2024 49.2 2036.2 46.4 C2051.4 42.7 2070.1 26.3 2084.6 25.5 L2084.6 0Z"/></svg>';
  var RATIO=2084.6/187.5;
  var M='url("data:image/svg+xml,'+encodeURIComponent(SHAPE).replace(/'/g,'%27')+'")';
  var H='var(--nan-drip-h)', TW='calc('+H+' * '+RATIO.toFixed(4)+')';
  var css=
   // legal hero kicker (carried over from nanfix7, which this file replaces)
   '.legal_hero-kicker{color:var(--w-ink)!important;border-color:currentColor!important;opacity:.9}'+
   ':root{--nan-drip-h:clamp(64px,9.77vw,190px);--nan-drip:'+M+'}'+
   // retire every old drip: wave masks (pointed up), template svgs, legal wave, the rising footer drip
   '.home-hero_drip-wrapper,.products-hero_drip-wrapper,.section-produkt-hero_drip,.product-hero_drip-wrapper,'+
   '.white-background-drip-divider,.legal_hero-drip,.footer-section_svg-drip svg.nan-drip,.footer-section_svg-drip::after{display:none!important}'+
   '.nuts-hero_section::after,.section-om-hero::after,.fh-hero::after{content:none!important;display:none!important}'+
   '.section-om-hero{padding-bottom:5.6rem!important}'+
   '.home-hero_section{margin-bottom:0!important;-webkit-mask:none!important;mask:none!important}'+
   '.home-hero_section + .home-intro_section{padding-top:99px!important}'+
   '@media (max-width:767px){.home-hero_section + .home-intro_section{padding-top:40px!important}}'+
   // the drip itself
   '.nan-drips{position:relative;z-index:3!important;'+
     '-webkit-mask:linear-gradient(#000,#000) 0 0/100% calc(100% - '+H+' + 1px) no-repeat,var(--nan-drip) var(--nan-drip-x,0px) 100%/'+TW+' '+H+' repeat-x!important;'+
     'mask:linear-gradient(#000,#000) 0 0/100% calc(100% - '+H+' + 1px) no-repeat,var(--nan-drip) var(--nan-drip-x,0px) 100%/'+TW+' '+H+' repeat-x!important}'+
   // footer: the last section's colour drips down over the footer's own colour (+ grain), then the body runs mid → bottom.
   // A separate layer, not a mask on the section, so cards that hang out of the last section are never clipped.
   '.footer-section_svg-wrapper{position:relative;isolation:isolate;height:'+H+'!important;overflow:hidden;background:var(--w-mid)!important}'+
   '.footer-section_svg-wrapper::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:-1;background:var(--nan-grain) 0 0/200px 200px repeat;opacity:.28;mix-blend-mode:overlay}'+
   '.footer-section_svg-wrapper::before{content:"";position:absolute;inset:-1px 0 0;z-index:0;pointer-events:none;background:var(--nan-seam,var(--_color-schemes---body-bg));'+
     '-webkit-mask:var(--nan-drip) var(--nan-drip-x,0px) 0/'+TW+' '+H+' repeat-x;mask:var(--nan-drip) var(--nan-drip-x,0px) 0/'+TW+' '+H+' repeat-x}'+
   '.footer-section_svg-drip{height:100%}'+
   // Om oss: the fjord strip drips down into the night (fade at the top kept)
   '.oo-shore{-webkit-mask:var(--nan-drip) var(--nan-drip-x,0px) 100%/'+TW+' '+H+' repeat-x,linear-gradient(#000,#000) 0 0/100% calc(100% - '+H+' + 1px) no-repeat,linear-gradient(180deg,transparent 0,#000 22%) 0 0/100% 100% no-repeat!important;'+
     '-webkit-mask-composite:source-over,source-in!important;'+
     'mask:var(--nan-drip) var(--nan-drip-x,0px) 100%/'+TW+' '+H+' repeat-x add,linear-gradient(#000,#000) 0 0/100% calc(100% - '+H+' + 1px) no-repeat intersect,linear-gradient(180deg,transparent 0,#000 22%) 0 0/100% 100% no-repeat!important}'+
   '.oo-shore::after{display:none!important}'+
   // review cards: the frame colour drips down into the card, same shape (drawn 1.9× wider: at card size the drops otherwise read as a comb)
   '.review-rectangle-box-wrapper::before{-webkit-mask:var(--nan-drip) var(--nan-drip-x,0px) 0/calc(var(--r-drip) * '+(RATIO*1.9).toFixed(4)+') 100% repeat-x!important;mask:var(--nan-drip) var(--nan-drip-x,0px) 0/calc(var(--r-drip) * '+(RATIO*1.9).toFixed(4)+') 100% repeat-x!important}';
  var st=D.createElement('style'); st.id='nan-drips'; st.textContent=css; D.head.appendChild(st);

  var path=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  function seed(s){ var h=7; for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; h=(h*1664525+1013904223)>>>0; return h/4294967296; }
  function offset(el,key){ el.style.setProperty('--nan-drip-x','calc('+TW+' * -'+seed(path+key).toFixed(3)+')'); }
  function shown(e){ return e && e.offsetHeight>0 && getComputedStyle(e).display!=='none'; }
  function nextShown(e){ e=e.nextElementSibling; while(e && (!shown(e) || /w-embed|w-script/.test(e.className))) e=e.nextElementSibling; return e; }
  function lastShown(p){ var k=p.children; for(var i=k.length-1;i>=0;i--){ if(shown(k[i]) && !/w-embed|w-script/.test(k[i].className)) return k[i]; } return null; }
  // computed colours come as rgb(), rgba() or color(srgb … / a) (the worlds use color-mix)
  function opaque(c){ if(!c||c==='transparent'||!/^(rgb|color)/.test(c)) return false; var m=c.match(/\/\s*([\d.]+)\s*\)$/)||c.match(/^rgba\([^)]*,\s*([\d.]+)\)$/); return !m||parseFloat(m[1])>0.98; }
  // the colour painted along the bottom edge of `el`: the deepest full-width box touching it
  // (null = nothing paints there, 'keep' = an image or gradient we can't read as one colour)
  function edgeColour(el){
    var R0=el.getBoundingClientRect(), best=null, depth=-1;
    (function walk(n,d){ var r=n.getBoundingClientRect(), cs=getComputedStyle(n);
      if(cs.display==='none'||cs.visibility==='hidden'||r.width<R0.width*.9) return;
      if(Math.abs(r.bottom-R0.bottom)<3 && cs.position!=='fixed' && d>depth){
        if(opaque(cs.backgroundColor)){ best=cs.backgroundColor; depth=d; }
        else if(/gradient|url/.test(cs.backgroundImage)){ best='keep'; depth=d; } }
      for(var i=0;i<n.children.length;i++) walk(n.children[i],d+1); })(el,0);
    return best;
  }
  function behind(el){ for(var n=el.parentElement;n;n=n.parentElement){ var c=getComputedStyle(n).backgroundColor; if(opaque(c)) return c; } return getComputedStyle(D.body).backgroundColor; }

  var applied=[];
  // inline styles we touch are saved and put back on reset (Webflow writes CMS colours inline)
  function set(a,el,prop,val){ a.undo.push([el,prop,el.style.getPropertyValue(prop),el.style.getPropertyPriority(prop)]); el.style.setProperty(prop,val,'important'); }
  function reset(){ applied.forEach(function(a){ a.el.classList.remove('nan-drips');
    a.undo.reverse().forEach(function(u){ if(u[2]) u[0].style.setProperty(u[1],u[2],u[3]); else u[0].style.removeProperty(u[1]); }); }); applied=[]; }
  function drip(el,key,next){
    if(!el || applied.some(function(a){ return a.el===el; })) return;
    var cs=getComputedStyle(el), pb=cs.paddingBottom, mb=cs.marginBottom, a={el:el,undo:[]};
    if(next) set(a,next,'padding-top','calc('+getComputedStyle(next).paddingTop+' + '+H+')');
    set(a,el,'padding-bottom','calc('+pb+' + '+H+')');
    set(a,el,'margin-bottom','calc('+mb+' - '+H+')');
    set(a,el,'--nan-drip-x','calc('+TW+' * -'+seed(path+key).toFixed(3)+')');
    el.classList.add('nan-drips'); applied.push(a);
  }
  function run(){
    reset();
    var pw=D.querySelector('.page_wrapper');
    var heroes=[].slice.call(D.querySelectorAll('.home-hero_section,.products-hero_section,.section-produkt-hero,.nuts-hero_section,.section-om-hero,.fh-hero,.legal_hero'));
    D.querySelectorAll('.white-background-drip-divider,.product-hero_drip-wrapper,.products-hero_drip-wrapper,.section-produkt-hero_drip').forEach(function(d){
      var s=d.closest('section,.section'); if(s && heroes.indexOf(s)<0) heroes.push(s); });
    heroes.forEach(function(h,i){ if(shown(h)) drip(h,'#h'+i,nextShown(h)); });
    // last section melts into the footer
    var fw=D.querySelector('.footer-section_svg-wrapper'), last=pw&&lastShown(pw);
    if(fw && last){ var c=edgeColour(last); if(!c||c==='keep') c=behind(last);
      var f={el:fw,undo:[]}; set(f,fw,'--nan-seam',c); set(f,fw,'--nan-drip-x','calc('+TW+' * -'+seed(path+'#f').toFixed(3)+')'); applied.push(f); }
    var shore=D.querySelector('.oo-shore'); if(shore) offset(shore,'#s');
    D.querySelectorAll('.review-rectangle-box-wrapper').forEach(function(c,i){ offset(c,'#r'+i); });
    if(window.ScrollTrigger) try{ ScrollTrigger.refresh(); }catch(e){}
  }
  var t; function later(){ clearTimeout(t); t=setTimeout(run,150); }
  var w=innerWidth; addEventListener('resize',function(){ if(innerWidth!==w){ w=innerWidth; later(); } });
  if(D.readyState==='loading') D.addEventListener('DOMContentLoaded',run); else run();
  addEventListener('load',run);
})();
