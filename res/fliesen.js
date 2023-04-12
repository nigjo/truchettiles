const mirrorWidth = 12;
const mirrorHeight = 8;

function copy(type, winkel, parent) {
  let src = document.getElementById(type);
  if(src.nodeName==='OBJECT'){
    if(src.contentDocument){
      src = src.contentDocument.rootElement;
    }else{
      console.debug("skipping "+type);
      return;
    }
  }
  let cpy = src.cloneNode(true);
  // cpy.style.transform = "rotate(" + winkel + "deg)";
  cpy.setAttribute('transform', "rotate(" + winkel + ")");
  if (!parent)
    parent = document.currentScript.parentNode;
  parent.append(cpy);
}

function addSampleTo(target, type, width, height) {
  // //console.debug(type, target);
  let mirror = makeTileMirror(type, width, height);
  target.append(mirror);
  // return mirror;
}

function makeTileMirror(type, width, height) {
  if(!("tilepattern" in window) && tilepatterns)
    window.tilepattern = Object.values(tilepatterns)[0];
  if(window.tilepattern){
    return makeMirrorFromPattern(type, window.tilepattern, width, height);
  }else{
    console.warn("kein pattern definiert");
  }
}

function makeMirrorFromPattern(tile, pattern, displayWidth, displayHeight) {
  let mirror = document.createElement('div');
  mirror.className = "spiegel";
  mirror.dataset.type = tile;
  //console.debug(document.currentScript, type);
  let patternW = pattern[0].length;
  let patternH = pattern.length;
  displayWidth = displayWidth?displayWidth:patternW;
  displayHeight = displayHeight?displayHeight:patternH;
  
  for(let r=0;r<displayHeight;r++) {
    let rowdiv = document.createElement('div');
    rowdiv.className = 'sample';
    for (let c=0;c<displayWidth;c++) {
      let cell = pattern[r%patternH][c%patternW]
      copy(tile, 90 * cell, rowdiv);
    }
    mirror.append(rowdiv);
  }
  return mirror;
}

function setTiles(tiles){
  console.log("creating tiles")
  let editor = document.getElementById("tiles");
  let loaded=[];
  let tileElements=[];
  for(let tile of tiles){
    let o = document.createElement('object');
    o.className = 'fliese';
    o.id = tile.substring(tile.indexOf('/')+1);
    o.type = 'image/svg+xml';
    o.data = tile+'.svg';
    loaded.push(new Promise((ok,no)=>{
      o.onload = ()=>ok(o);
    }));
    tileElements.push(o);
  }
  editor.append(...tileElements);
  console.log("waiting for tiles to load")
  return Promise.all(loaded)
    .then(objects=>{
      console.log("tiles loaded")
      let tileIds=[]
      for(let tile of objects){
        if(tile.contentDocument){
          let svg = tile.contentDocument.rootElement.cloneNode(true);
          svg.id = tile.id;
          svg.setAttribute('class','fliese');
          svg.onclick = toggleTile;
          [...svg.querySelectorAll('link')].forEach(s=>s.remove());
          //console.log(svg);
          let wrap=document.createElement('div');
          wrap.className="fliese";
          wrap.append(svg);
          wrap.dataset.type = svg.id;
          tile.replaceWith(wrap);
          tileIds.push(tile.id);
        }else{
          console.warn("unable to load tile "+tile.id);
        }
      }
      editor.querySelectorAll(":scope>*:not(.fliese)")
        .forEach(e=>e.remove());
      console.log("tiles prepared")

      return tileIds;
    });
}

function loadTiles(){
  //let scriptSelf = current = document.currentScript;
  return fetch('fliesen.json')
    .then(e=>e.ok?e.json():[])
    .then(setTiles)
    .catch(e=>{
      //meist, wenn ohne per file:// geladen wurde.
      console.warn('loadTiles', e);
      throw e;
    });
}

function toggleTile(evt){
  let tile = evt.target;
  let viewer = document.getElementById("viewer");

}

function loadPatterns(){
  return fetch('pattern.json')
    .then(e=>{console.debug('pattern', e);return e;})
    .then(e=>e.ok?e.json():{})
    .then(p=>window.tilepatterns = p)
    .catch(e=>{
      console.warn('loadPatterns', e);
      window.tilepattern = {};
      throw e;
    });
}

function createAllPatterns(pattern){
  console.log("loaded "
    +Object.keys(pattern).length
    +" pattern");
  let selector = document.getElementById("patternType");
  selector.replaceChildren(...
    Object.keys(pattern).map(k=>{
      let o=document.createElement("option");
      o.textContent=k;
      return o;
    })
  );
  console.log("pattern viewer filled");
  selector.value = "default";
  window.tilepattern = pattern["default"];
  console.log("default pattern selected");
  return pattern;
}

function updatePattern(){
  let name = document.getElementById("patternType").value;
  window.tilepattern = tilepatterns[name];
  let viewer = document.querySelector(".spiegelsaal");
  for(let spiegel of viewer.querySelectorAll(".spiegel")){
    updateSinglePattern(spiegel, tilepattern, mirrorWidth, mirrorHeight);
  }
}

function replaceMirror(original, tile, width, height){
  let mirror = makeTileMirror(tile, width, height);
  mirror.onclick = original.onclick;
  mirror.id = original.id;
  original.replaceWith(mirror);
  return mirror;
}

function updateSinglePattern(target, pattern, displayWidth, displayHeight){
  //console.debug(target);
  let patternW = pattern[0].length;
  let patternH = pattern.length;
  displayWidth = displayWidth?displayWidth:patternW;
  displayHeight = displayHeight?displayHeight:patternH;
  //console.debug(target, displayWidth, displayHeight);
  
  let samples = target.querySelectorAll(".sample");
  if(displayHeight!==samples.length
    || displayWidth!==samples[0].children.length){
    replaceMirror(target, target.dataset.type,displayWidth,displayHeight);
  } else {
    for(let r=0;r<displayHeight;r++){
      //console.debug(r,samples[r]);
      for(let c=0;c<displayWidth;c++){
        let winkel = 90*pattern[r%patternH][c%patternW];
        samples[r].children[c]
          // .style.transform = "rotate(" + winkel + "deg)";
          .setAttribute('transform', "rotate(" + winkel + ")");
      }
    }
  }
}

const SVGNS='http://www.w3.org/2000/svg';

function mergeSvg(spiegel){
  let svg = document.createElementNS(SVGNS, 'svg');
  let tileViewW = 48;
  let tileViewH = 48;
  let tileW = 128;
  let tileH = 128;
  let vpW = 320;
  let vpH = 320;

  let rows = spiegel.querySelectorAll('.sample');
  let firstRow = rows[0].querySelectorAll('.fliese');

  let patternViewW = firstRow.length;
  let patternViewH = rows.length;
  console.debug("colsxrows", patternViewW, "x", patternViewH);

  svg.setAttribute('version', '1.1');
  svg.setAttribute('width', (tileViewW*patternViewW)+'px');
  svg.setAttribute('height', (tileViewH*patternViewH)+'px');
  svg.setAttribute('viewBox',
      '0 0 '+(vpW*patternViewW)+' '+(vpH*patternViewH));
  svg.setAttribute('style', ''
    + 'width:'+(tileViewW*patternViewW)+'px;'
    + 'height:'+(tileViewH*patternViewH)+'px;'
  );

  let defs = document.createElementNS(SVGNS, 'defs');
  defs.innerHTML = ''
    +'<clipPath id="tileClip" clipPathUnits="userSpaceOnUse">'
    +'<rect x="0" y="0" width="'+(vpW)+'" height="'+(vpH)+'"/>'
    +'</clipPath>'
  svg.append(defs);

  let block=0;
  console.debug(spiegel);
  for(let r of rows){
    //console.debug(block, r);
    let tile=0;
    for(let t of r.querySelectorAll('.fliese')){

      let orgTransform = t.getAttribute('transform')||'';

      let pos=patternViewW*block+tile;
      let x=vpW*(pos%patternViewW);
      let y=vpH*Math.floor(pos/patternViewW);
      console.debug(pos,block, tile,y,x);
      let g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('clip-path', 'url(#tileClip)');

      g.setAttribute('transform',''
         +' '+'translate('+(x+vpW/2)+','+(y+vpH/2)+')'
         +' '+orgTransform
         +' '+'translate('+(-vpW/2)+','+(-vpH/2)+')'
         );

      let dbg = document.createElementNS(SVGNS, 'rect');
      dbg.setAttribute('x', '0');
      dbg.setAttribute('y', '0');
      dbg.setAttribute('fill', 'none');
      dbg.setAttribute('stroke', 'red');
      dbg.setAttribute('width', vpW);
      dbg.setAttribute('height', vpH);
      //g.append(dbg);

      for(let c of t.children) {
        g.append(c.cloneNode(true));
      }

      svg.append(g);

      //break;
      ++tile;
    }
    //break;
    ++block;
  }

  return svg;
}
