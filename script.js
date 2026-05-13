let gameData = null;
let currentDir = 1;
let ram = 50;
let systemHp = 100;
let activeTool = null;
let loopInterval = null;

let virusesList = [];
let defensesMap = {}; 

fetch('data.json')
  .then(res => res.json())
  .then(data => {
    gameData = data;
    startDirectory();
  });

function startDirectory() {
  document.getElementById("dir-ui").innerText = String(currentDir).padStart(2, '0');
  document.getElementById("next-btn").style.display = "none";
  virusesList = [];
  
  document.querySelectorAll('.virus').forEach(el => el.remove());

  let waveSize = 2 + Math.floor(currentDir * 0.5);
  for (let i = 0; i < waveSize; i++) {
    let template = gameData.viruses[Math.floor(Math.random() * gameData.viruses.length)];
    let lane = Math.floor(Math.random() * 3);
    
    let el = document.createElement('img');
    el.src = template.img;
    el.className = 'sprite virus';
    el.style.left = (600 + (i * 120)) + "px"; 
    document.getElementById(`lane-${lane}`).appendChild(el);

    virusesList.push({
      element: el,
      lane: lane,
      hp: template.hp,
      maxHp: template.hp,
      speed: template.speed + (currentDir * 0.1), 
      bounty: template.bounty,
      x: 600 + (i * 120)
    });

    el.addEventListener('click', (e) => {
      e.stopPropagation(); 
      let targetIndex = virusesList.reverse().findIndex(v => v.element === el);
      if(targetIndex !== -1) {
        damageVirus(virusesList[targetIndex]);
      }
      virusesList.reverse(); 
    });
  }

  if(loopInterval) clearInterval(loopInterval);
  loopInterval = setInterval(updateGame, 33);
}

function updateGame() {
  let aliveViruses = false;

  virusesList.forEach((virus) => {
    if (virus.hp <= 0) return;
    aliveViruses = true;

    let gridCol = Math.floor(virus.x / 80);
    let cellKey = `${virus.lane}-${gridCol}`;
    
    if (defensesMap[cellKey] && defensesMap[cellKey].hp > 0) {
      defensesMap[cellKey].hp -= 0.5;
      if(defensesMap[cellKey].hp <= 0) {
         defensesMap[cellKey].element.remove();
         delete defensesMap[cellKey];
      }
    } else {
      virus.x -= virus.speed;
      virus.element.style.left = virus.x + "px";
    }

    if (virus.x <= 0) {
      virus.hp = 0;
      virus.element.remove();
      systemHp -= 20;
      document.getElementById("hp-ui").innerText = Math.max(0, systemHp);
      if (systemHp <= 0) {
        clearInterval(loopInterval);
        alert("HOTES-OS CRASHED: The mysteries remain unsolved. Refresh to reboot.");
      }
    }
  });

  if (!aliveViruses && systemHp > 0) {
    clearInterval(loopInterval);
    document.getElementById("next-btn").style.display = "block";
  }
}

function damageVirus(virus) {
  if(!virus) return;
  virus.hp -= 10; 
  virus.element.style.opacity = "0.4"; 
  setTimeout(() => { if(virus.element) virus.element.style.opacity = "1"; }, 100);

  if (virus.hp <= 0) {
    virus.element.remove();
    ram += virus.bounty;
    document.getElementById("ram-ui").innerText = ram;
  }
}

function selectTool(toolId) {
  activeTool = gameData.defenses.find(d => d.id === toolId);
}

function placeDefense(laneId) {
  if (!activeTool) return;
  
  let clickX = event.clientX - document.getElementById("grid").getBoundingClientRect().left;
  let col = Math.floor(clickX / 80);
  let cellKey = `${laneId}-${col}`;

  if (ram >= activeTool.cost && !defensesMap[cellKey] && col < 5) {
    ram -= activeTool.cost;
    document.getElementById("ram-ui").innerText = ram;

    let defEl = document.createElement('img');
    defEl.src = activeTool.img;
    defEl.className = 'sprite defense';
    defEl.style.left = (col * 80 + 15) + "px";
    document.getElementById(`lane-${laneId}`).appendChild(defEl);

    defensesMap[cellKey] = {
      element: defEl,
      hp: activeTool.hp
    };
    activeTool = null; 
  }
}

function startNextDirectory() {
  currentDir++;
  startDirectory();
}
