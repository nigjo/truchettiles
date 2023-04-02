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

function copySamples(target, type) {
  //console.debug(type, target);
  let copy = document.createElement('div');
  copy.className = "spiegel";
  copy.dataset.type = type;
  makeTileMirror(copy, type);
  target.append(copy);
  return copy;
}

function makeTileMirror(target, type) {
  if(!("tilepattern" in window) && tilepatterns)
    window.tilepattern = Object.values(tilepatterns)[0];
  if(window.tilepattern){
    //console.debug(document.currentScript, type);
    for (let row of tilepattern) {
      let rowdiv = document.createElement('div');
      rowdiv.className = 'sample';
      for (let cell of row) {
        copy(type, 90 * cell, rowdiv);
      }
      target.append(rowdiv);
    }
  }else{
    console.warn("kein pattern definiert");
  }
}


function loadTiles(){
  let editor = document.getElementById("tiles");
  //let scriptSelf = current = document.currentScript;
  return fetch('fliesen.json')
    .then(e=>e.ok?e.json():[])
    .then(tiles=>{
      console.log("creating tiles")
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
    })
    .catch(e=>{
      //meist, wenn ohne per file:// geladen wurde.
      editor.textContent = ""+e;
    });
}

function toggleTile(evt){
  let tile = evt.target;
  let viewer = document.getElementById("viewer");
  
}

function loadPatterns(){
  return fetch('pattern.json')
    .then(e=>e.ok?e.json():[])
    .then(p=>window.tilepatterns = p)
    .catch(e=>{
      console.warn(e);
      window.tilepattern = [];
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
    updateSinglePattern(spiegel, tilepattern);
  }
}

function updateSinglePattern(target, pattern){
    //console.debug(target);
    let samples = target.querySelectorAll(".sample");
    for(let r=0;r<pattern.length;r++){
      //console.debug(r,samples[r]);
      for(let c=0;c<pattern[r].length;c++){
        let winkel = 90*pattern[r][c];
        samples[r].children[c]
          // .style.transform = "rotate(" + winkel + "deg)";
          .setAttribute('transform', "rotate(" + winkel + ")");
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
  
  svg.setAttribute('version', '1.1');
  svg.setAttribute('width', (tileViewW*8)+'px');
  svg.setAttribute('height', (tileViewH*4)+'px');
  svg.setAttribute('viewBox',
      '0 0 '+(vpW*8)+' '+(vpH*4));
  svg.setAttribute('style', ''
    + 'width:'+(tileViewW*8)+'px;'
    + 'height:'+(tileViewH*4)+'px;'
  );
  
  let defs = document.createElementNS(SVGNS, 'defs');
  defs.innerHTML = ''
    +'<clipPath id="tileClip" clipPathUnits="userSpaceOnUse">'
    +'<rect x="0" y="0" width="'+(vpW)+'" height="'+(vpH)+'"/>'
    +'</clipPath>'
  svg.append(defs);
    
  let block=0;
  console.debug(spiegel);
  for(let s of spiegel.querySelectorAll('.sample')){
    console.debug(block, s);
    let tile=0;
    for(let t of s.querySelectorAll('.fliese')){
      console.debug(block, tile, t);
      
      let orgTransform = t.getAttribute('transform')||'';
      
      let pos=4*block+tile;
      let x=vpW*(pos%8);
      let y=vpH*Math.floor(pos/8);
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
