// --- GAME STATE ---
let coins = 0;
let runActive = false;
let runTimeLeft = 15;
let runOre = 0;
let runTimerInterval = null;

// --- SKILLS CONFIGURATION ---
const skills = {
    // Branch A: Extraction
    sharpPick: { purchased: false, cost: 50, elementId: 'node-sharp-pick', btnId: 'btn-sharp-pick' },
    dynamite: { purchased: false, cost: 250, prereq: 'sharpPick', elementId: 'node-dynamite', btnId: 'btn-dynamite' },
    
    // Branch B: Endurance
    rations: { purchased: false, cost: 75, elementId: 'node-rations', btnId: 'btn-rations' },
    adrenaline: { purchased: false, cost: 300, prereq: 'rations', elementId: 'node-adrenaline', btnId: 'btn-adrenaline' },
    
    // Branch C: Industry
    smelter: { purchased: false, cost: 120, elementId: 'node-smelter', btnId: 'btn-smelter' },
    drill: { purchased: false, cost: 500, prereq: 'smelter', elementId: 'node-drill', btnId: 'btn-drill' }
};

// --- DOM ELEMENTS ---
const coinCountEl = document.getElementById('coin-count');
const cpsCountEl = document.getElementById('cps-count');
const startRunBtn = document.getElementById('start-run-btn');
const timerDisplay = document.getElementById('timer-display');
const timeLeftEl = document.getElementById('time-left');
const miningZone = document.getElementById('mining-zone');
const nugget = document.getElementById('nugget');
const overlayText = document.getElementById('zone-overlay-text');
const runOreEl = document.getElementById('run-ore');

// --- EXPEDITION MECHANICS ---

function startExpedition() {
    if (runActive) return;

    // Reset Run Variables
    runActive = true;
    runOre = 0;
    
    // Check for "Extra Rations" skill (+5 seconds)
    runTimeLeft = skills.rations.purchased ? 20 : 15;

    // Update UI Elements
    runOreEl.innerText = runOre;
    timeLeftEl.innerText = runTimeLeft;
    startRunBtn.disabled = true;
    timerDisplay.classList.remove('hidden');
    miningZone.classList.remove('disabled');
    overlayText.classList.add('hidden');
    nugget.classList.remove('hidden');

    // Spawn first nugget
    spawnNugget();

    // Start Timer Interval
    runTimerInterval = setInterval(() => {
        runTimeLeft--;
        timeLeftEl.innerText = runTimeLeft;

        if (runTimeLeft <= 0) {
            endExpedition();
        }
    }, 1000);
}

function endExpedition() {
    clearInterval(runTimerInterval);
    runActive = false;

    // Process Ore to Coins
    coins += runOre;

    // Reset UI Elements
    startRunBtn.disabled = false;
    timerDisplay.classList.add('hidden');
    miningZone.classList.add('disabled');
    overlayText.classList.remove('hidden');
    overlayText.innerText = `Expedition Done! Earned +${runOre} Coins!`;
    nugget.classList.add('hidden');

    updateUI();
}

function spawnNugget() {
    const zoneWidth = miningZone.clientWidth;
    const zoneHeight = miningZone.clientHeight;

    // Calculate dimensions of nugget to avoid clipping off the boundaries
    const nuggetSize = skills.adrenaline.purchased ? 40 : 30; 
    
    // Apply Adrenaline scale size
    if (skills.adrenaline.purchased) {
        nugget.classList.add('super');
    } else {
        nugget.classList.remove('super');
    }

    // Determine if it spawns as a "Super Nugget" (requires Dynamite skill)
    if (skills.dynamite.purchased && Math.random() < 0.20) {
        nugget.classList.add('super'); // 5x Ore reward visual indicator
        nugget.dataset.type = 'super';
    } else {
        if (!skills.adrenaline.purchased) nugget.classList.remove('super');
        nugget.dataset.type = 'normal';
    }

    // Random coordinates inside the zone container
    const randomX = Math.floor(Math.random() * (zoneWidth - nuggetSize));
    const randomY = Math.floor(Math.random() * (zoneHeight - nuggetSize));

    nugget.style.left = `${randomX}px`;
    nugget.style.top = `${randomY}px`;
}

// Click Nugget Event
nugget.addEventListener('mousedown', (e) => {
    e.stopPropagation(); // Stop general container clicks
    
    // Calculate extraction yield
    let clickValue = 1;
    if (skills.sharpPick.purchased) clickValue += 1; // +1 Power
    
    // Dynamite modifier (5x ore)
    if (nugget.dataset.type === 'super') {
        clickValue *= 5;
    }

    runOre += clickValue;
    runOreEl.innerText = runOre;

    // Relocate nugget
    spawnNugget();
});


// --- SKILL TREE SYSTEM ---

function buySkill(skillKey) {
    const skill = skills[skillKey];
    
    // Check prerequisites
    if (skill.prereq && !skills[skill.prereq].purchased) {
        alert("You must unlock the previous skill first!");
        return;
    }

    if (coins >= skill.cost && !skill.purchased) {
        coins -= skill.cost;
        skill.purchased = true;
        
        // Update Skill Visual CSS status
        const nodeEl = document.getElementById(skill.elementId);
        nodeEl.classList.add('purchased');
        nodeEl.classList.remove('locked');
        
        const btnEl = document.getElementById(skill.btnId);
        btnEl.innerText = "UNLOCKED";
        btnEl.disabled = true;

        // Check if this action unlocks a child node
        unlockChildNodes();
        updateUI();
    } else if (coins < skill.cost) {
        alert("Not enough coins!");
    }
}

function unlockChildNodes() {
    for (let key in skills) {
        const skill = skills[key];
        if (skill.prereq && skills[skill.prereq].purchased && !skill.purchased) {
            const nodeEl = document.getElementById(skill.elementId);
            nodeEl.classList.remove('locked');
            
            const btnEl = document.getElementById(skill.btnId);
            btnEl.disabled = false;
            btnEl.innerText = `Unlock (${skill.cost} Coins)`;
        }
    }
}

// Calculate Background CPS
function getPassiveCPS() {
    let cps = 0;
    if (skills.smelter.purchased) cps += 2;
    if (skills.drill.purchased) cps += 10;
    return cps;
}

// --- SYSTEM & INTERFACES ---

function updateUI() {
    coinCountEl.innerText = Math.floor(coins);
    cpsCountEl.innerText = getPassiveCPS();

    // Check affordabilities and gray out buy buttons dynamically
    for (let key in skills) {
        const skill = skills[key];
        const btnEl = document.getElementById(skill.btnId);
        
        if (!skill.purchased) {
            const isLocked = skill.prereq && !skills[skill.prereq].purchased;
            if (isLocked) {
                btnEl.disabled = true;
            } else {
                btnEl.disabled = coins < skill.cost;
            }
        }
    }
}

// --- SETUP EVENT LISTENERS ---

startRunBtn.addEventListener('click', startExpedition);

// Attach event listeners to all skill nodes dynamically
document.getElementById('btn-sharp-pick').addEventListener('click', () => buySkill('sharpPick'));
document.getElementById('btn-dynamite').addEventListener('click', () => buySkill('dynamite'));
document.getElementById('btn-rations').addEventListener('click', () => buySkill('rations'));
document.getElementById('btn-adrenaline').addEventListener('click', () => buySkill('adrenaline'));
document.getElementById('btn-smelter').addEventListener('click', () => buySkill('smelter'));
document.getElementById('btn-drill').addEventListener('click', () => buySkill('drill'));


// --- MAIN LOOP ---
// Fires 10 times a second (100ms) to update passive income
setInterval(() => {
    let passiveGain = getPassiveCPS();
    if (passiveGain > 0) {
        coins += passiveGain / 10;
        updateUI();
    }
}, 100);

// Run initial UI Sync on Page Load
updateUI();
