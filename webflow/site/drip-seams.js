/* Nøttanrop · drip seams (site-wide, runs after "worlds, part 2").
   A drip only looks right when the colour around its tips is the colour of the section it melts into.
   Instead of hard-coding that colour per page, read it from the neighbour:
     footer drip       → colour at the bottom edge of the last section above the footer
     hero drip dividers → colour at the top edge of the section below the hero
   (mask drips on Hjem/Produkter/product pages already default to the page background, so they're left alone)
   If the neighbour paints nothing there (transparent), the seam goes transparent too, so whatever is
   behind both (page background, Om oss' night sky) runs straight through. */
(function(){
  function opaque(c){ var m=c&&c.match(/rgba?\(([^)]+)\)/); if(!m) return false; var p=m[1].split(','); return p.length<4 || parseFloat(p[3])>0.98; }
  // the colour actually painted along one horizontal edge of `el`: the deepest full-width box touching that edge
  function edgeColour(el, edge){
    var R=el.getBoundingClientRect(), best=null, bestDepth=-1;
    (function walk(n,d){
      var r=n.getBoundingClientRect(), cs=getComputedStyle(n);
      if(cs.display==='none'||cs.visibility==='hidden'||r.width<R.width*0.9) return;
      var touches = edge==='bottom' ? Math.abs(r.bottom-R.bottom)<3 : Math.abs(r.top-R.top)<3;
      if(touches && cs.position!=='fixed'){
        if(opaque(cs.backgroundColor) && d>bestDepth){ best=cs.backgroundColor; bestDepth=d; }
        else if(cs.backgroundImage!=='none' && /gradient|url/.test(cs.backgroundImage) && !opaque(cs.backgroundColor) && d>bestDepth){ best='keep'; bestDepth=d; }
      }
      for(var i=0;i<n.children.length;i++) walk(n.children[i],d+1);
    })(el,0);
    return best; // null = transparent, 'keep' = painted by an image/gradient we can't read
  }
  function lastVisible(parent){ var k=parent.children; for(var i=k.length-1;i>=0;i--){ var e=k[i]; if(e.offsetHeight>0 && getComputedStyle(e).display!=='none' && !/w-embed|w-script/.test(e.className)) return e; } return null; }
  function nextVisible(el){ var e=el.nextElementSibling; while(e && (e.offsetHeight===0 || getComputedStyle(e).display==='none')) e=e.nextElementSibling; return e; }
  // first opaque colour painted behind `el` by its ancestors (what you'd see through a transparent el)
  function behind(el){ for(var n=el&&el.parentElement;n;n=n.parentElement){ var cs=getComputedStyle(n), c=cs.backgroundColor; if(opaque(c)||cs.backgroundImage!=='none') return {c:opaque(c)?c:null,n:n}; } return {c:null,n:null}; }
  // transparent is only honest when the drip and its neighbour share the same backdrop;
  // otherwise paint the colour that shows through the neighbour
  function paint(target, colour, neighbour){
    if(colour==='keep') return;
    if(!colour){ var a=behind(neighbour), b=behind(target); colour = (a.n===b.n||!a.c) ? 'transparent' : a.c; }
    target.style.setProperty('background-color', colour, 'important');
  }
  function run(){
    var pw=document.querySelector('.page_wrapper');
    // 1. footer drip
    var fw=document.querySelector('.footer-section_svg-wrapper'), last=pw&&lastVisible(pw);
    if(fw&&last) paint(fw, edgeColour(last,'bottom'), last);
    // 2. hero dividers that hang into the next section (Fjordnotater, FAQ, Samarbeid, Presse, Investor…)
    document.querySelectorAll('.white-background-drip-divider').forEach(function(d){
      var hero=d.closest('.section')||d.parentElement, below=hero&&nextVisible(hero);
      if(below) paint(d, edgeColour(below,'top'), below);
    });
  }
  if(document.readyState==='complete') run(); else window.addEventListener('load',run);
})();
