function toggleTile(evt){
  //console.debug(evt);
  
  let tile = evt.target.closest(".fliese");
  
  window.editorSample.remove();
  window.editorSample = 
    copySamples(
      document.getElementById("editor"), 
      tile.id);
  
}
function rotateTile(evt){
  let tile = evt.target.closest(".fliese");
  //console.debug(tile);
  let parent = tile.parentNode;
  let c = [...parent.children].indexOf(tile);
  let r = [...parent.parentNode.children].indexOf(parent);
  
  //console.debug(tile.id, r, c);
  window.tilepattern[r][c] = (window.tilepattern[r][c]+1)%4;
  //console.debug(window.workcopy[r][c]);
  
  updateSinglePattern(tile.closest('.spiegel'), window.tilepattern);
  updateSinglePattern(window.editorSample, window.tilepattern);
  
  
  output.textContent = '"newpattern":\n  [';
  let raw = window.tilepattern.flat();
  var line='';
  raw.forEach((r,i)=>{
    line+=
         (i>0?', ':'')
        +(i%8==0?'\n    ':'')
        +(i%4==0?'[':'')
        +r
        +(i%4==3?']':'')
  })
  output.textContent += line+'\n  ]';
}
function createMirrors(pattern){
  let editor = 
    copySamples(
      document.getElementById("editor"), 
      "arrow");
  editor.classList.add("tilehover");
  [...editor.querySelectorAll(".fliese")]
    .forEach(f=>f.onclick=rotateTile);

  window.editorSample = 
    copySamples(
      document.getElementById("editor"), 
      pattern);
}
function initEditor(data){
  //console.debug("alles fertig",data[0],data[1]);
  if(!("tilepattern" in window) && tilepatterns)
    window.tilepattern = Object.values(tilepatterns)[0];
  let raw = window.tilepattern.flat();
  let workcopy = [];
  for(let i=0;i<raw.length;i+=4){
    workcopy.push(raw.slice(i,i+4));
  }
  window.tilepattern = workcopy;
  //console.log(workcopy);
  
  createMirrors(data[1][0]);
}
function createCustom(pattern){

  pattern["custom"] = []
  for(var j=0;j<8;j++){
    let row = [];
    for(var i=0;i<4;i++){
      row[i] = Math.floor(Math.random()*4);
    }
    pattern["custom"][j] = row;
  }

  let selector = document.getElementById("patternType");
  let o=document.createElement("option");
  o.textContent="custom";
  selector.insertAdjacentElement("afterbegin", o);
  selector.value = "custom";
  window.tilepattern = pattern["custom"];
  console.log("custom pattern selected");
  
  return pattern;
}

function createBackground(){
  let source = document.querySelector('#editor .spiegel:nth-child(2)');
  let merged = mergeSvg(source);
  let target = document.getElementById('merged');
  
  fetch('tiles/fliesenlack.css')
    .then(r=>r.ok?r.text():'')
    .then(css=>{
      merged.setAttribute('xmlns', SVGNS);
      
      //console.log(css);
      
      let style = document.createElementNS(SVGNS, 'style');
      style.textContent = css;
      merged.insertAdjacentElement('afterbegin', style);

      //console.debug(merged.outerHTML);
      
      //let img = document.createElement('img');
      //img.alt = 'tile mirror '+source.dataset.type+'';
        //+window.btoa(unescape(encodeURIComponent(merged.outerHTML)));
      svgdata = 'data:image/svg+xml;base64,'
        +btoa(unescape(encodeURIComponent(merged.outerHTML)));
      //img.style.backgroundColor = 'white';
      //target.replaceChildren(img);
      
      document.body.style.backgroundImage = 'url('+svgdata+')';
    })
    .catch(console.warn);
  
}
