'use strict';

function toggleTile(evt) {
  let tile = evt.target.closest(".fliese");
  replaceEditorSample(tile.id);
}

function replaceEditorSample(tile) {
  let mirror = replaceMirror(
          document.getElementById("editorSample"), tile, mirrorWidth, mirrorHeight);
}

function rotateTile(evt) {

  let tile = evt.target.closest(".fliese");
  if (!tile) {
    return;
  }

  if (!isCustom())
    setCustom();

  //console.debug(tile);
  let parent = tile.parentNode;
  let c = [...parent.children].indexOf(tile);
  let r = [...parent.parentNode.children].indexOf(parent);

  //console.debug(tile.id, r, c);
  window.tilepattern[r][c] = (window.tilepattern[r][c] + 1) % 4;
  //console.debug(window.workcopy[r][c]);

  updateSinglePattern(tile.closest('.spiegel'), window.tilepattern);
  updateSinglePattern(document.getElementById("editorSample"), window.tilepattern);

  writeOutput(window.tilepattern);
}
function writeOutput(pattern) {
  const output = document.getElementById('output');
  output.textContent = '"newpattern":\n  [';
  let raw = pattern.flat();
  let patternW = window.tilepattern[0].length;
  let patternH = raw.length / patternW;
  var line = '';
  raw.forEach((r, i) => {
    line +=
            (i > 0 ? ', ' : '')
            + (i % patternW === 0 ? '\n    ' : '')
            + (i % patternW === 0 ? '[' : '')
            + r
            + (i % patternW === (patternW - 1) ? ']' : '');
  });
  output.textContent += line + '\n  ]';
}
function createMirrors(pattern) {
  let editor = makeTileMirror("arrow");
  editor.classList.add("tilehover");
  editor.onclick = rotateTile;
  document.getElementById("editor").append(editor);
  // [...editor.querySelectorAll(".fliese")]
  // .forEach(f=>f.onclick=rotateTile);

  let editorSample = makeTileMirror(pattern);
  editorSample.id = "editorSample";
  //console.debug('createMirrors', editorSample);
  document.getElementById("editor").append(editorSample);
}
function initEditor(data) {
  //console.debug("alles fertig",data[0],data[1]);
  if (!("tilepattern" in window) && tilepatterns)
    window.tilepattern = Object.values(tilepatterns)[0];
  let raw = window.tilepattern.flat();
  let patternWidth = window.tilepattern[0].length;
  let workcopy = [];
  for (let i = 0; i < raw.length; i += patternWidth) {
    workcopy.push(raw.slice(i, i + patternWidth));
  }
  window.tilepattern = workcopy;
  //console.log(workcopy);

  createMirrors(data[1][0]);
}
function createCustom(pattern) {

  pattern["custom"] = [];
  for (var j = 0; j < mirrorHeight; j++) {
    let row = [];
    for (var i = 0; i < mirrorWidth; i++) {
      row[i] = Math.floor(Math.random() * 4);
    }
    pattern["custom"][j] = row;
  }

  let selector = document.getElementById("patternType");
  let o = document.createElement("option");
  o.textContent = "custom";
  selector.insertAdjacentElement("afterbegin", o);
  selector.value = "custom";
  window.tilepattern = pattern["custom"];
  console.log("custom pattern selected");

  return pattern;
}

function isCustom() {
  return document.getElementById("patternType").value === 'custom';
}

function setCustom() {
  console.debug('CUSTOM', 'currentPattern', window.tilepattern);
  let patternW = window.tilepattern[0].length;
  let patternH = window.tilepattern.length;
  console.debug('CUSTOM', patternW, patternH);

  if (patternW !== mirrorWidth
          || patternH !== mirrorHeight) {
    let nextCustom = [];
    for (var j = 0; j < mirrorHeight; j++) {
      let row = [];
      for (var i = 0; i < mirrorWidth; i++) {
        row[i] = window.tilepattern[j % patternH][i % patternW];
      }
      nextCustom[j] = row;
    }

    window.tilepatterns['custom'] = nextCustom;
    window.tilepattern = window.tilepatterns['custom'];
  }

  return document.getElementById("patternType").value = 'custom';
}

function createBackground() {
  let source = document.querySelector('#editor .spiegel:nth-child(2)');
  let merged = mergeSvg(source);
  let target = document.getElementById('merged');

  fetch('tiles/fliesenlack.css')
          .then(r => r.ok ? r.text() : '')
          .then(css => {
            merged.setAttribute('xmlns', SVGNS);

            //console.log(css);

            let style = document.createElementNS(SVGNS, 'style');
            style.textContent = css;
            merged.insertAdjacentElement('afterbegin', style);

            //console.debug(merged.outerHTML);

            //let img = document.createElement('img');
            //img.alt = 'tile mirror '+source.dataset.type+'';
            //+window.btoa(unescape(encodeURIComponent(merged.outerHTML)));
            let svgdata = 'data:image/svg+xml;base64,'
                    + btoa(unescape(encodeURIComponent(merged.outerHTML)));
            //img.style.backgroundColor = 'white';
            //target.replaceChildren(img);

            document.body.style.backgroundImage = 'url(' + svgdata + ')';
          })
          .catch(console.warn);

}
