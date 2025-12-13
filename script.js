// script.js - ADVANCED CUSTOM CONTROLS & SHAPES & SERVER-SIDE SECURITY

// --- 1. GLOBAL STATE & HISTORY ---
let currentTemplate = 0;
let historyStack = [];
let redoStack = [];
let isHistoryLocked = false;
let selectedElement = null;

// Expanded State
let editorState = { 
    // Global
    scale: 1, rotate: 0, boxW: 700, boxH: 350, font: 'Poppins, sans-serif',
    
    // Home Team Controls
    homeSize: 120, homeX: 0, homeY: 0, homeNameSize: 20, homeNameY: 0,
    homeLogoSrc: TEAM_DATABASE[0].logo, homeName: "Liverpool", homeScore: "2",
    
    // Away Team Controls
    awaySize: 120, awayX: 0, awayY: 0, awayNameSize: 20, awayNameY: 0,
    awayLogoSrc: TEAM_DATABASE[1].logo, awayName: "West Ham", awayScore: "0",

    // Score/Separator Controls
    sepX: 0, sepY: 0, sepSize: 1,
    scoreSize: 120, scoreGap: 20, 
    
    // Template Specific
    t1SplitPos: 50, t2Overlap: 0
};

// Drag Drop Vars
let isDrag = false, dragItem = null, startX, startY, initX, initY;

// --- 2. HISTORY SYSTEM ---
function saveStateToHistory() {
    if(isHistoryLocked) return;
    const currentState = {
        state: JSON.parse(JSON.stringify(editorState)), 
        html: document.getElementById('canvas-area').innerHTML 
    };
    historyStack.push(currentState);
    if(historyStack.length > 20) historyStack.shift(); 
    redoStack = []; 
}

function undo() {
    if(historyStack.length === 0) return;
    redoStack.push({
        state: JSON.parse(JSON.stringify(editorState)),
        html: document.getElementById('canvas-area').innerHTML
    });
    const prev = historyStack.pop();
    applyHistoryState(prev);
}

function redo() {
    if(redoStack.length === 0) return;
    historyStack.push({
        state: JSON.parse(JSON.stringify(editorState)),
        html: document.getElementById('canvas-area').innerHTML
    });
    const next = redoStack.pop();
    applyHistoryState(next);
}

function applyHistoryState(record) {
    isHistoryLocked = true;
    editorState = record.state;
    document.getElementById('canvas-area').innerHTML = record.html;
    setupControls(currentTemplate);
    bindInputs(); 
    applyAllUpdates();
    // Re-attach listeners to custom elements
    if(currentTemplate === 4) {
        document.querySelectorAll('.draggable').forEach(el => {
            el.onclick = (e) => { e.stopPropagation(); selectElement(el); };
        });
        initDrag();
    }
    isHistoryLocked = false;
}

// --- 3. NAVIGATION ---
function navigate(pageId) {
    document.querySelectorAll('.section').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    const target = document.getElementById(pageId);
    if (target) {
        target.style.display = 'flex';
        setTimeout(() => target.classList.add('active'), 10);
    }
    if(pageId === 'template-selection') loadSavedSlots();
}

// --- 4. EDITOR INITIALIZATION ---
function startEditor(id, customHTML = null) {
    currentTemplate = id;
    navigate('editor-interface');
    const canvas = document.getElementById('canvas-area');
    canvas.innerHTML = '';
    canvas.className = 'relative transition-all duration-200 select-none origin-center';

    const tb = document.getElementById('vertical-toolbar');
    const customTools = document.getElementById('custom-tools-area');
    
    if(id === 4) {
        if(tb) tb.classList.remove('hidden');
        if(customTools) customTools.classList.remove('hidden');
    } else {
        if(tb) tb.classList.add('hidden');
        if(customTools) customTools.classList.add('hidden');
    }

    if(!customHTML) {
        resetState(id);
        if (id === 1) renderT1(canvas);
        if (id === 2) renderT2(canvas);
        if (id === 3) renderT3(canvas);
        if (id === 4) renderCustom(canvas);
    } else {
        renderCustom(canvas, customHTML);
    }

    setupControls(id);
    bindInputs();
    applyAllUpdates();
    bindAdvancedProperties(); 
    
    historyStack = []; 
    saveStateToHistory();
}

function resetState(id) {
    editorState.scale = 1; editorState.rotate = 0; editorState.boxW = 700; editorState.boxH = 350;
    editorState.homeSize = 120; editorState.homeX = 0; editorState.homeY = 0;
    editorState.awaySize = 120; editorState.awayX = 0; editorState.awayY = 0;
    editorState.sepX = 0; editorState.sepY = 0; editorState.scoreGap = 20;
    
    if(id === 1) { editorState.scoreSize = 120; }
    if(id === 2) { editorState.scoreSize = 140; editorState.scoreGap = 40; }
    if(id === 4) { editorState.boxH = 400; }
}

// --- 5. RENDERERS ---
function renderT1(c) {
    c.innerHTML = `
        <div class="t1-box main-card-box" id="main-box">
            <div class="t1-side" id="bg-home" style="background-color: #991b1b;">
                <img id="img-home" src="${editorState.homeLogoSrc}" crossorigin="anonymous" class="team-logo relative shadow-lg">
                <div id="txt-home" class="team-name text-white font-bold uppercase relative text-center">${editorState.homeName}</div>
            </div>
            <div class="t1-center relative">
                <div id="score-container" class="flex items-center relative">
                    <span id="score-home" class="t1-score">${editorState.homeScore}</span>
                    <span id="sep-txt" class="font-black relative mx-2">-</span>
                    <span id="score-away" class="t1-score">${editorState.awayScore}</span>
                </div>
            </div>
            <div class="t1-side" id="bg-away" style="background-color: #1e3a8a;">
                <img id="img-away" src="${editorState.awayLogoSrc}" crossorigin="anonymous" class="team-logo relative shadow-lg">
                <div id="txt-away" class="team-name text-white font-bold uppercase relative text-center">${editorState.awayName}</div>
            </div>
        </div>`;
}

function renderT2(c) {
    c.innerHTML = `
        <div class="main-card-box relative" id="main-box" style="background: transparent; overflow: visible;">
            <div class="t2-container">
                <div class="t2-card-bg t2-home-bg" id="bg-home">
                     <img id="img-home" src="${editorState.homeLogoSrc}" crossorigin="anonymous" class="team-logo relative z-20 drop-shadow-2xl">
                     <div id="txt-home" class="hidden team-name">${editorState.homeName}</div>
                </div>
                <div class="t2-card-bg t2-away-bg" id="bg-away">
                     <img id="img-away" src="${editorState.awayLogoSrc}" crossorigin="anonymous" class="team-logo relative z-20 drop-shadow-2xl">
                     <div id="txt-away" class="hidden team-name">${editorState.awayName}</div>
                </div>
                <div id="score-container" class="t2-score-box">
                    <span id="score-home" class="t2-big-digit">${editorState.homeScore}</span>
                    <span id="sep-txt" class="hidden">-</span> 
                    <span id="score-away" class="t2-big-digit">${editorState.awayScore}</span>
                </div>
            </div>
        </div>`;
}

function renderT3(c) {
    c.innerHTML = `
        <div class="t3-pill main-card-box" id="bg-home" style="background-color: #1e40af;">
            <div class="t3-sq relative">
                <img id="img-home" src="${editorState.homeLogoSrc}" crossorigin="anonymous" class="team-logo relative">
            </div>
            <div id="score-container" class="flex items-center gap-2 relative">
                <span id="score-home" class="t3-txt">${editorState.homeScore}</span>
                <span id="sep-txt" class="w-8 h-2 bg-white rounded-full block relative"></span>
                <span id="score-away" class="t3-txt">${editorState.awayScore}</span>
            </div>
            <div class="t3-sq relative">
                <img id="img-away" src="${editorState.awayLogoSrc}" crossorigin="anonymous" class="team-logo relative">
            </div>
            <div id="txt-home" class="hidden team-name">${editorState.homeName}</div><div id="txt-away" class="hidden team-name">${editorState.awayName}</div>
        </div>`;
}

function renderCustom(c, savedHTML) {
    if(savedHTML) {
        c.innerHTML = savedHTML;
    } else {
        c.innerHTML = `
            <div class="custom-box main-card-box" id="main-box">
                <div class="draggable custom-shape text-white font-bold cursor-move link-score-home" style="font-size: 80px; top:120px; left:200px;">${editorState.homeScore}</div>
                <div class="draggable custom-shape text-white font-bold cursor-move" style="font-size: 60px; top:140px; left:330px;">VS</div>
                <div class="draggable custom-shape text-white font-bold cursor-move link-score-away" style="font-size: 80px; top:120px; left:450px;">${editorState.awayScore}</div>
            </div>`;
    }
    // Re-attach listeners
    document.querySelectorAll('.draggable').forEach(el => {
        el.onclick = (e) => { e.stopPropagation(); selectElement(el); };
    });
    initDrag();
}

// --- 6. INPUT BINDING & SEARCH ---

function bindInputs() {
    // Basic fields
    const map = {'home-name':'txt-home', 'away-name':'txt-away', 'home-score':'score-home', 'away-score':'score-away', 'separator':'sep-txt'};
    
    // Sync state to inputs
    document.getElementById('ed-home-name').value = editorState.homeName;
    document.getElementById('ed-away-name').value = editorState.awayName;
    document.getElementById('ed-home-score').value = editorState.homeScore;
    document.getElementById('ed-away-score').value = editorState.awayScore;

    // Inputs -> State & DOM
    $('#ed-home-name').on('input', function() { editorState.homeName = this.value; applyAllUpdates(); saveStateToHistory(); });
    $('#ed-away-name').on('input', function() { editorState.awayName = this.value; applyAllUpdates(); saveStateToHistory(); });
    $('#ed-home-score').on('input', function() { editorState.homeScore = this.value; applyAllUpdates(); saveStateToHistory(); });
    $('#ed-away-score').on('input', function() { editorState.awayScore = this.value; applyAllUpdates(); saveStateToHistory(); });
    
    // Bind Generated Sliders
    Object.keys(editorState).forEach(key => {
        const slider = document.querySelector(`input[type="range"][data-key="${key}"]`);
        const number = document.querySelector(`input[type="number"][data-key="${key}"]`);
        if(slider && number) {
            slider.oninput = function() { number.value = this.value; editorState[key] = parseFloat(this.value); if(key === 'scale' || key === 'rotate') applyTransform(); else applyAllUpdates(); };
            slider.onchange = () => saveStateToHistory();
            number.oninput = function() { slider.value = this.value; editorState[key] = parseFloat(this.value); if(key === 'scale' || key === 'rotate') applyTransform(); else applyAllUpdates(); };
            number.onchange = () => saveStateToHistory();
        }
    });

    // Style Bindings
    $('#ctl-font').off().on('change', function() { editorState.font = $(this).val(); applyAllUpdates(); saveStateToHistory(); });
    $(document).off('input', '#in-color-home').on('input', '#in-color-home', function() { $('#bg-home').css('background-color', $(this).val()); });
    $(document).off('input', '#in-color-away').on('input', '#in-color-away', function() { $('#bg-away').css('background-color', $(this).val()); });
    $('#ctl-bg-color').on('input', (e) => { $('#main-box').css('background-color', e.target.value); });
    $('#ctl-bg-trans').click(() => { $('#main-box').css('background-color', 'transparent'); });
    $('.download-btn').off('click').on('click', downloadImage);

    // Search Logic
    $('#db-search').off().on('input', function() {
        const val = this.value.toLowerCase();
        const resDiv = $('#db-results');
        resDiv.html('').addClass('hidden');
        
        if(val.length > 0) {
            const matches = TEAM_DATABASE.filter(t => t.name.toLowerCase().includes(val));
            if(matches.length > 0) {
                resDiv.removeClass('hidden');
                matches.forEach((team, idx) => {
                    const item = document.createElement('div');
                    item.className = 'db-result-item';
                    item.innerHTML = `
                        <div class="flex items-center gap-2">
                            <img src="${team.logo}" class="w-6 h-6 object-contain">
                            <span class="text-xs text-white">${team.name}</span>
                        </div>
                        <div class="db-actions">
                            <button class="bg-blue-600 hover:bg-blue-500 text-white" onclick="setTeam('home', ${idx}, '${val}')">Home</button>
                            <button class="bg-red-600 hover:bg-red-500 text-white" onclick="setTeam('away', ${idx}, '${val}')">Away</button>
                        </div>
                    `;
                    resDiv.append(item);
                });
            }
        }
    });
}

function setTeam(side, dbIndex, searchVal) {
    const matches = TEAM_DATABASE.filter(t => t.name.toLowerCase().includes(searchVal));
    const team = matches[dbIndex];
    if(side === 'home') {
        editorState.homeName = team.name;
        editorState.homeLogoSrc = team.logo;
    } else {
        editorState.awayName = team.name;
        editorState.awayLogoSrc = team.logo;
    }
    $('#db-search').val('');
    $('#db-results').addClass('hidden');
    bindInputs();
    applyAllUpdates();
    saveStateToHistory();
}

// --- 7. APPLY UPDATES ---
function applyTransform() {
    $('#canvas-area').css('transform', `scale(${editorState.scale}) rotate(${editorState.rotate}deg)`);
}

function applyAllUpdates() {
    $('.main-card-box').css({ width: editorState.boxW + 'px', height: editorState.boxH + 'px' });
    $('#img-home').attr('src', editorState.homeLogoSrc).css({ width: editorState.homeSize + 'px', transform: `translate(${editorState.homeX}px, ${editorState.homeY}px)` });
    $('#txt-home').text(editorState.homeName).css({ fontSize: editorState.homeNameSize + 'px', marginTop: editorState.homeNameY + 'px', transform: `translate(${editorState.homeX}px, 0)` });
    
    $('#img-away').attr('src', editorState.awayLogoSrc).css({ width: editorState.awaySize + 'px', transform: `translate(${editorState.awayX}px, ${editorState.awayY}px)` });
    $('#txt-away').text(editorState.awayName).css({ fontSize: editorState.awayNameSize + 'px', marginTop: editorState.awayNameY + 'px', transform: `translate(${editorState.awayX}px, 0)` });
    
    $('#score-home').text(editorState.homeScore);
    $('#score-away').text(editorState.awayScore);

    $('#score-container').css({ transform: `translate(${editorState.sepX}px, ${editorState.sepY}px)`, gap: editorState.scoreGap + 'px' });

    if(currentTemplate === 2) {
        $('.t2-big-digit').css('font-size', editorState.scoreSize + 'px');
    } else {
        $('.t1-score, .t3-txt').css('font-size', editorState.scoreSize + 'px');
        $('#sep-txt').css('font-size', (editorState.scoreSize * 0.6) + 'px');
    }

    $('.team-name, .t1-score, .t2-big-digit, .t3-txt, #sep-txt').css('font-family', editorState.font);
    
    if(currentTemplate === 4) {
        $('.link-score-home').text(editorState.homeScore);
        $('.link-score-away').text(editorState.awayScore);
        $('.link-logo-home').attr('src', editorState.homeLogoSrc);
        $('.link-logo-away').attr('src', editorState.awayLogoSrc);
    }
}

// --- 8. CUSTOM TEMPLATE TOOLS & SHAPES ---

function toggleShapes(e) {
    $('#shapes-menu').toggleClass('hidden');
    if(e) e.stopPropagation();
}

function addDynamic(type) {
    const box = document.getElementById('main-box');
    const el = document.createElement('div');
    el.style.left = '50%'; el.style.top = '50%'; el.style.transform = 'translate(-50%, -50%)';
    el.style.position = 'absolute';
    el.className = 'draggable custom-shape selected cursor-move';
    
    if(type === 'score-home') {
        el.innerText = editorState.homeScore;
        el.className += ' link-score-home text-white font-bold';
        el.style.fontSize = '80px';
    } else if(type === 'score-away') {
        el.innerText = editorState.awayScore;
        el.className += ' link-score-away text-white font-bold';
        el.style.fontSize = '80px';
    } else if(type === 'logo-home') {
        const img = document.createElement('img');
        img.src = editorState.homeLogoSrc;
        img.className = 'w-full h-full object-contain link-logo-home pointer-events-none';
        el.appendChild(img);
        el.style.width = '100px'; el.style.height = '100px';
    } else if(type === 'logo-away') {
        const img = document.createElement('img');
        img.src = editorState.awayLogoSrc;
        img.className = 'w-full h-full object-contain link-logo-away pointer-events-none';
        el.appendChild(img);
        el.style.width = '100px'; el.style.height = '100px';
    }
    
    el.onclick = (e) => { e.stopPropagation(); selectElement(el); };
    box.appendChild(el);
    selectElement(el);
    saveStateToHistory();
    initDrag();
}

function addShape(type) {
    $('#shapes-menu').addClass('hidden'); 
    const box = document.getElementById('main-box');
    const el = document.createElement('div');
    el.className = 'draggable custom-shape selected';
    el.style.left = '50%'; el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.backgroundColor = '#3b82f6';
    el.style.width = '100px'; el.style.height = '100px';
    
    // Simple Shapes
    if(type === 'circle') el.style.borderRadius = '50%';
    else if(type === 'rounded') el.style.borderRadius = '15px';
    else if(type === 'rect') { el.style.width = '150px'; el.style.height = '80px'; }
    // Clip Path Shapes
    else if(type === 'shield') el.classList.add('shape-shield');
    else if(type === 'badge') el.classList.add('shape-badge');
    else if(type === 'triangle') el.classList.add('shape-triangle');
    else if(type === 'star') el.classList.add('shape-star');
    else if(type === 'hexagon') el.classList.add('shape-hexagon');
    else if(type === 'pentagon') el.classList.add('shape-pentagon');
    else if(type === 'arrow') { el.classList.add('shape-arrow'); el.style.width='120px'; el.style.height='80px'; }
    else if(type === 'banner') { el.classList.add('shape-banner'); el.style.width='150px'; el.style.height='60px'; }
    
    el.onclick = (e) => { e.stopPropagation(); selectElement(el); };
    box.appendChild(el);
    selectElement(el);
    saveStateToHistory();
    initDrag();
}

function addText() {
    $('#shapes-menu').addClass('hidden');
    const box = document.getElementById('main-box');
    const el = document.createElement('div');
    el.className = 'draggable custom-shape text-white font-bold selected';
    el.contentEditable = true;
    el.innerText = 'TEXT';
    el.style.fontSize = '40px';
    el.style.left = '50%'; el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    
    el.onkeydown = (e) => e.stopPropagation();
    el.onclick = (e) => { e.stopPropagation(); selectElement(el); };
    
    box.appendChild(el);
    selectElement(el);
    saveStateToHistory();
    initDrag();
}

// --- 9. ADVANCED PROPERTIES LOGIC ---

function selectElement(el) {
    document.querySelectorAll('.selected').forEach(e => e.classList.remove('selected'));
    selectedElement = el;
    el.classList.add('selected');
    
    const props = document.getElementById('advanced-properties');
    if(props) props.classList.remove('hidden');
    showTab('bg'); 
    
    const style = window.getComputedStyle(el);
    
    // Position
    $('#prop-x').val(Math.round(el.offsetLeft));
    $('#prop-y').val(Math.round(el.offsetTop));
    
    // Size
    $('#prop-w').val(parseInt(el.style.width || style.width));
    $('#prop-h').val(parseInt(el.style.height || style.height));
    if(el.innerText && el.children.length === 0) {
        $('#prop-w').val(parseInt(style.fontSize)); 
        $('label[for="prop-w"]').text("Font Size");
    } else {
        $('label[for="prop-w"]').text("Width");
    }

    // Color & Opacity
    $('#prop-color').val(rgbToHex(style.backgroundColor !== 'rgba(0, 0, 0, 0)' ? style.backgroundColor : style.color));
    $('#prop-opacity').val(style.opacity);

    // Font Section
    if(el.innerText && el.children.length === 0) {
        $('#group-font').removeClass('hidden');
        $('#prop-font-family').val(style.fontFamily.replace(/"/g, ''));
        $('#prop-font-weight').val(style.fontWeight);
    } else {
        $('#group-font').addClass('hidden');
    }

    // Shadow Section
    const shadowVal = el.innerText && el.children.length === 0 ? style.textShadow : style.boxShadow;
    if(shadowVal !== 'none') {
        $('#prop-shadow-toggle').prop('checked', true);
        $('#group-shadow').removeClass('hidden');
    } else {
        $('#prop-shadow-toggle').prop('checked', false);
        $('#group-shadow').addClass('hidden');
    }
}

function bindAdvancedProperties() {
    const update = (prop, val) => {
        if(selectedElement) {
            selectedElement.style[prop] = val;
            saveStateToHistory();
        }
    }

    $('#prop-x').on('input', function() { update('left', this.value + 'px'); });
    $('#prop-y').on('input', function() { update('top', this.value + 'px'); });
    
    $('#prop-w').on('input', function() { 
        if(selectedElement.innerText && selectedElement.children.length === 0) {
             selectedElement.style.fontSize = this.value + 'px'; 
        } else {
             selectedElement.style.width = this.value + 'px'; 
        }
        saveStateToHistory();
    });
    $('#prop-h').on('input', function() { update('height', this.value + 'px'); });

    $('#prop-color').on('input', function() {
        if(selectedElement) {
            if(selectedElement.innerText && selectedElement.children.length === 0) selectedElement.style.color = this.value;
            else selectedElement.style.backgroundColor = this.value;
        }
    });

    $('#prop-opacity').on('input', function() { update('opacity', this.value); });

    $('#prop-font-family').on('change', function() { update('fontFamily', this.value); });
    $('#prop-font-weight').on('change', function() { update('fontWeight', this.value); });

    // Shadow Logic
    const updateShadow = () => {
        if(!selectedElement) return;
        const isText = selectedElement.innerText && selectedElement.children.length === 0;
        const enabled = $('#prop-shadow-toggle').prop('checked');
        
        if(!enabled) {
             selectedElement.style.boxShadow = 'none';
             selectedElement.style.textShadow = 'none';
             $('#group-shadow').addClass('hidden');
             return;
        }

        $('#group-shadow').removeClass('hidden');
        const x = $('#prop-shadow-x').val() || 2;
        const y = $('#prop-shadow-y').val() || 2;
        const blur = $('#prop-shadow-blur').val() || 4;
        const color = $('#prop-shadow-color').val() || '#000000';

        if(isText) {
            selectedElement.style.textShadow = `${x}px ${y}px ${blur}px ${color}`;
        } else {
            selectedElement.style.boxShadow = `${x}px ${y}px ${blur}px ${color}`;
        }
        saveStateToHistory();
    };

    $('#prop-shadow-toggle').on('change', updateShadow);
    $('#prop-shadow-x, #prop-shadow-y, #prop-shadow-blur, #prop-shadow-color').on('input', updateShadow);
}

function changeLayer(dir) {
    if(!selectedElement) return;
    let z = parseInt(window.getComputedStyle(selectedElement).zIndex) || 5;
    selectedElement.style.zIndex = z + dir;
    saveStateToHistory();
}

function deleteSelected() {
    if(selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        document.getElementById('advanced-properties').classList.add('hidden');
        saveStateToHistory();
    }
}

function rgbToHex(col) {
    if(!col || col === 'none') return '#ffffff';
    if(col.charAt(0)=='#') return col;
    let rgb = col.match(/\d+/g);
    if(!rgb) return '#ffffff';
    return "#" + ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1);
}

// --- 10. DRAG LOGIC ---
function initDrag() {
    $('.draggable').off('mousedown');
    $('.draggable').on('mousedown', function(e) {
        if(currentTemplate !== 4) return;
        isDrag = true; 
        dragItem = $(this);
        startX = e.clientX; startY = e.clientY;
        initX = dragItem.position().left; initY = dragItem.position().top;
        selectElement(dragItem[0]);
        e.preventDefault();
    });

    $(document).on('mousemove', function(e) {
        if(!isDrag) return;
        const newL = initX + (e.clientX - startX);
        const newT = initY + (e.clientY - startY);
        dragItem.css({ top: newT, left: newL });
        
        // Live Update Inputs
        if(selectedElement === dragItem[0]) {
            $('#prop-x').val(Math.round(newL));
            $('#prop-y').val(Math.round(newT));
        }
    });

    $(document).on('mouseup', () => {
        if(isDrag) {
            isDrag = false;
            saveStateToHistory();
        }
    });
}

// --- 11. STANDARD CONTROLS ---
const mkControl = (label, key, min, max, step=1) => `
    <div class="control-row">
        <span class="control-label">${label}</span>
        <div class="control-group">
            <input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${editorState[key]}" class="control-range">
            <input type="number" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${editorState[key]}" class="input-mini">
        </div>
    </div>`;

function setupControls(id) {
    const zone = document.getElementById('dynamic-color-controls');
    const globalZone = document.getElementById('global-controls');
    
    globalZone.innerHTML = `
        ${mkControl("Zoom", "scale", 0.5, 2, 0.1)}
        ${mkControl("Rotate", "rotate", -15, 15, 1)}
    `;

    if(id === 4) {
        zone.innerHTML = `<div class="text-center text-gray-500 text-xs mt-4">Select an element to edit properties.</div>`;
        document.getElementById('btn-save-custom').classList.remove('hidden');
        return;
    }

    let html = '';
    html += `<div class="mb-4 pt-2 border-t border-gray-700"><label class="text-[10px] text-blue-400 font-bold uppercase mb-2 block">Layout Dimensions</label>`;
    html += mkControl("Width", "boxW", 300, 1000, 10);
    html += mkControl("Height", "boxH", 100, 800, 10);
    html += `</div>`;

    html += `<div class="mb-4 pt-2 border-t border-gray-700 bg-gray-800/50 p-2 rounded">
             <label class="text-[10px] text-blue-400 font-bold uppercase mb-2 block">🏠 Home Config</label>`;
    html += mkControl("Logo Size", "homeSize", 30, 300, 5);
    html += mkControl("Pos X", "homeX", -300, 300, 5);
    html += mkControl("Pos Y", "homeY", -150, 150, 5);
    html += mkControl("Text Size", "homeNameSize", 10, 80, 2);
    html += mkControl("Text Y", "homeNameY", -50, 50, 2);
    if(id !== 4) html += `<div class="mt-2 flex justify-between items-center"><span class="text-[9px] text-gray-400 uppercase">Card Color</span><input type="color" id="in-color-home" value="#1d4ed8" class="h-6 rounded cursor-pointer"></div>`;
    html += `</div>`;

    html += `<div class="mb-4 pt-2 border-t border-gray-700 bg-gray-800/50 p-2 rounded">
             <label class="text-[10px] text-red-400 font-bold uppercase mb-2 block">✈️ Away Config</label>`;
    html += mkControl("Logo Size", "awaySize", 30, 300, 5);
    html += mkControl("Pos X", "awayX", -300, 300, 5);
    html += mkControl("Pos Y", "awayY", -150, 150, 5);
    html += mkControl("Text Size", "awayNameSize", 10, 80, 2);
    html += mkControl("Text Y", "awayNameY", -50, 50, 2);
    if(id !== 3 && id !== 4) html += `<div class="mt-2 flex justify-between items-center"><span class="text-[9px] text-gray-400 uppercase">Card Color</span><input type="color" id="in-color-away" value="#dc2626" class="h-6 rounded cursor-pointer"></div>`;
    html += `</div>`;

    html += `<div class="mb-4 pt-2 border-t border-gray-700">
             <label class="text-[10px] text-green-400 font-bold uppercase mb-2 block">⚽ Score Styling</label>`;
    html += mkControl("Pos X", "sepX", -200, 200, 5);
    html += mkControl("Pos Y", "sepY", -100, 100, 5);
    html += mkControl("Font Size", "scoreSize", 20, 200, 5);
    html += mkControl("Spacing", "scoreGap", 0, 100, 5);

    html += `<div class="mt-2"><label class="text-[10px] text-gray-400 uppercase">Font Family</label>
             <select id="ctl-font" class="w-full bg-gray-900 text-white text-xs p-1 rounded border border-gray-600">
                <option value="'Poppins', sans-serif">Poppins (Modern)</option>
                <option value="'Arial Black', sans-serif">Impact / Bold</option>
                <option value="'Courier New', monospace">Courier</option>
                <option value="'Times New Roman', serif">Serif</option>
             </select></div></div>`;
    
    zone.innerHTML = html;
}

// --- 12. SAVE/LOAD SLOTS ---
function saveCustomLayout() {
    const key = sessionStorage.getItem('thumb_key');
    let slots = JSON.parse(localStorage.getItem('slots_'+key) || "[]");
    if(slots.length >= 5) return alert("Memory full. Delete a slot first.");
    document.querySelectorAll('.selected').forEach(e => e.classList.remove('selected'));
    slots.push(document.getElementById('canvas-area').innerHTML);
    localStorage.setItem('slots_'+key, JSON.stringify(slots));
    alert("Layout Saved! You can re-edit text/images later.");
    navigate('template-selection'); 
}

function loadSavedSlots() {
    const key = sessionStorage.getItem('thumb_key');
    const c = document.getElementById('saved-slots-container');
    c.innerHTML = '';
    const slots = JSON.parse(localStorage.getItem('slots_'+key) || "[]");
    if(slots.length > 0) document.getElementById('saved-layouts-area').classList.remove('hidden');
    slots.forEach((html, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = "relative group";
        wrapper.innerHTML = `
            <div class="w-24 h-24 bg-gray-800 border border-gray-600 rounded flex items-center justify-center cursor-pointer text-white font-bold text-xs hover:border-blue-500 slot-preview" onclick="loadSlot(${i})">Slot ${i+1}</div>
            <button onclick="deleteSlot(${i})" class="absolute -top-2 -right-2 bg-red-600 w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-red-500"><i class="fa-solid fa-trash"></i></button>`;
        c.appendChild(wrapper);
    });
}

function loadSlot(index) {
    const key = sessionStorage.getItem('thumb_key');
    const slots = JSON.parse(localStorage.getItem('slots_'+key) || "[]");
    startEditor(4, slots[index]);
}

function deleteSlot(index) {
    const key = sessionStorage.getItem('thumb_key');
    let slots = JSON.parse(localStorage.getItem('slots_'+key) || "[]");
    if(confirm("Delete?")) {
        slots.splice(index, 1);
        localStorage.setItem('slots_'+key, JSON.stringify(slots));
        loadSavedSlots(); 
    }
}

function showTab(t) {
    document.querySelectorAll('.editor-tab-content').forEach(e => e.classList.add('hidden'));
    document.getElementById('tab-'+t).classList.remove('hidden');
    ['teams','style','bg'].forEach(x => {
        const btn = document.getElementById('tab-btn-'+x);
        if(x===t) btn.className = "flex-1 py-3 text-center bg-blue-600 text-white";
        else btn.className = "flex-1 py-3 text-center text-gray-400 hover:text-white hover:bg-gray-700";
    });
}

function downloadImage() {
    const element = document.querySelector('.main-card-box'); 
    const canvasArea = document.getElementById('canvas-area');
    if(!element) return alert("Nothing to download!");
    const originalTransform = canvasArea.style.transform;
    canvasArea.style.transform = 'none'; 
    html2canvas(element, { backgroundColor: null, scale: 2, useCORS: true, allowTaint: true, logging: false }).then(canvas => {
        canvasArea.style.transform = originalTransform;
        const link = document.createElement('a');
        link.download = 'thumbscore-card.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
    }).catch(err => {
        console.error(err);
        canvasArea.style.transform = originalTransform;
        alert("Download error. Please check console.");
    });
}

// --- ADMIN & SECURITY SYSTEM (SERVER-SIDE INTEGRATION) ---

const API_BASE = '/api'; // Backend entry point

function getDeviceId() {
    let id = localStorage.getItem('thumb_device_id');
    if (!id) {
        id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        localStorage.setItem('thumb_device_id', id);
    }
    return id;
}

// 3. SECURE LOGIN FUNCTION (Async / Server Validated)
window.handleLogin = async function() {
    const inputKey = document.getElementById('license-key').value.trim();
    const status = document.getElementById('login-status');
    const btn = document.getElementById('login-btn');
    const deviceId = getDeviceId();

    status.innerHTML = '';
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';

    try {
        const response = await fetch(`${API_BASE}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: inputKey, deviceId: deviceId })
        });

        const data = await response.json();

        if (data.isAdmin) {
            document.getElementById('license-key').value = '';
            btn.innerHTML = 'Unlock';
            openAdminPanel(); // Function defined below
            return;
        }

        if (data.valid) {
            // Success: Store validated session
            sessionStorage.setItem('thumb_key', inputKey);
            sessionStorage.setItem('thumb_user', JSON.stringify(data.license));
            navigate('template-selection'); 
            btn.innerHTML = 'Unlock';
            document.getElementById('license-key').value = '';
        } else {
            // Error: Show specific message from backend (Expired, Max Devices, Blocked)
            status.innerHTML = `<span class="text-red-500 font-bold">${data.message}</span>`;
            btn.innerHTML = 'Unlock';
        }
    } catch (error) {
        console.error("Login Error:", error);
        status.innerHTML = '<span class="text-red-500">Connection Failed</span>';
        btn.innerHTML = 'Unlock';
    }
};

// --- ADMIN UI LOGIC (Fetches from DB) ---

async function openAdminPanel() {
    document.getElementById('admin-panel-overlay').style.display = 'flex';
    await renderAdminKeys();
}

function closeAdmin() {
    document.getElementById('admin-panel-overlay').style.display = 'none';
}

async function renderAdminKeys() {
    const tbody = document.getElementById('admin-keys-table');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500">Loading...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/admin/keys`);
        if(response.status === 403) return closeAdmin(); // Security check
        const allKeys = await response.json();

        tbody.innerHTML = '';
        Object.keys(allKeys).forEach(k => {
            const data = allKeys[k];
            const isExpired = new Date() > new Date(data.expiry);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="font-mono text-white">${k}</span></td>
                <td>${data.name}</td>
                <td><span class="badge badge-blue">${data.plan}</span></td>
                <td class="${isExpired ? 'text-red-500' : 'text-green-400'}">
                    ${new Date(data.expiry).toLocaleDateString()}
                </td>
                <td>
                    <div class="flex flex-col gap-1">
                        <span class="text-xs text-gray-400">${data.devices.length} / ${data.maxDevices} Used</span>
                        ${data.devices.map(d => 
                            `<div class="flex justify-between items-center bg-gray-800 p-1 rounded">
                                <span class="text-[10px] font-mono truncate w-16">${d}</span>
                                <button onclick="blockDevice('${k}', '${d}')" class="text-[9px] text-red-400 hover:text-white" title="Block"><i class="fa-solid fa-ban"></i></button>
                            </div>`
                        ).join('')}
                        ${data.blocked && data.blocked.length > 0 ? `<div class="text-[9px] text-red-500 font-bold mt-1">${data.blocked.length} Blocked</div>` : ''}
                    </div>
                </td>
                <td>
                    <div class="flex gap-2">
                        <button onclick="editKey('${k}')" class="admin-btn btn-blue">Edit</button>
                        <button onclick="resetKeyDevices('${k}')" class="admin-btn btn-green">Reset</button>
                        <button onclick="deleteKey('${k}')" class="admin-btn btn-red">Del</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
}

async function saveAdminKey() {
    const key = document.getElementById('adm-key').value.trim();
    if(!key) return alert("Key string required");

    const payload = {
        key: key,
        name: document.getElementById('adm-name').value || "User",
        plan: document.getElementById('adm-plan').value,
        expiry: document.getElementById('adm-expiry').value || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        maxDevices: parseInt(document.getElementById('adm-devices').value) || 1
    };

    await fetch(`${API_BASE}/admin/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    renderAdminKeys();
    alert("Key Saved Globally!");
}

async function deleteKey(key) {
    if(confirm("Delete this key permanently?")) {
        await fetch(`${API_BASE}/admin/keys/${key}`, { method: 'DELETE' });
        renderAdminKeys();
    }
}

async function resetKeyDevices(key) {
    if(confirm("Clear all devices for this key?")) {
        await fetch(`${API_BASE}/admin/device/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        renderAdminKeys();
    }
}

async function blockDevice(key, deviceId) {
    if(confirm("Block this device ID?")) {
        await fetch(`${API_BASE}/admin/device/block`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, deviceId })
        });
        renderAdminKeys();
    }
}

function editKey(key) {
    document.getElementById('adm-key').value = key;
    alert("Please re-enter details and click Save to update."); 
}
