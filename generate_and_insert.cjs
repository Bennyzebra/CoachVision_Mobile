const fs = require('fs');

function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function seededRandom(seed){ let s = seed; return () => (s = (s*1664525 + 1013904223) % 4294967296) / 4294967296; }
const rand = seededRandom(7);

function rndChoice(arr){ return arr[Math.floor(rand()*arr.length)]; }

const focuses = ["offense","defense","passing","conditioning"];

const baseCues = {
  offense: [
    "Shot prep: feet set, hands ready",
    "Change pace, then burst",
    "Land on balance; hold follow-through",
    "See help early; make the extra pass",
    "Finish high off glass"
  ],
  defense: [
    "Low stance, active hands",
    "High-hand closeout; choppy steps",
    "Talk: ball, help, screen",
    "Sprint to help; recover on airtime",
    "Hit-find-seal on shot"
  ],
  passing: [
    "Lead the receiver to space",
    "Step into pass; thumbs down finish",
    "Show hands early on the catch",
    "Call names and actions",
    "Move with purpose after you pass"
  ],
  conditioning: [
    "Touch every line—no shortcuts",
    "Explode on each direction change",
    "Control breathing and form",
    "Finish through the line",
    "Compete to beat your time"
  ],
};

function sampleCues(focus, n=4){
  const pool = [...baseCues[focus]];
  const out = [];
  for(let i=0;i<n && pool.length;i++){
    const idx = Math.floor(rand()*pool.length);
    out.push(pool.splice(idx,1)[0]);
  }
  return out;
}

function positionsFor(archetype){
  let G,F,C;
  if (archetype==="guards"){ G=0.6; F=0.3; C=0.1; }
  else if (archetype==="forwards"){ G=0.3; F=0.5; C=0.2; }
  else if (archetype==="centers"){ G=0.2; F=0.3; C=0.5; }
  else if (archetype==="balanced_big"){ G=0.3; F=0.3; C=0.4; }
  else { G=0.5; F=0.3; C=0.2; }
  const s = G+F+C;
  G = Math.round((G/s)*100)/100;
  F = Math.round((F/s)*100)/100;
  C = Math.round((C/s)*100)/100;
  const drift = Math.round((1 - (G+F+C))*100)/100;
  return { G: +(G+drift).toFixed(2), F, C };
}

function levelFor(focus){
  if (focus==="passing") return rndChoice(["beginner","intermediate","intermediate","advanced"]);
  return rndChoice(["beginner","intermediate","advanced","intermediate"]);
}

function intensityFor(focus, level){
  const base = { offense:3, defense:3, passing:2, conditioning:4 }[focus];
  const bump = { beginner:-1, intermediate:0, advanced:+1 }[level];
  return Math.max(1, Math.min(5, base + bump));
}

function durationFor(focus, level){
  let d = rndChoice([6,8,10,12]);
  if (focus==="conditioning") d = rndChoice([4,6,8,10]);
  if (level==="beginner" && focus!=="conditioning") d = rndChoice([6,8,10]);
  return d;
}

function ratingFor(level){
  const base = { beginner:4.2, intermediate:4.4, advanced:4.3 }[level];
  const jitter = (rand()*0.4 - 0.2);
  const val = Math.max(3.6, Math.min(4.9, base + jitter));
  return Math.round(val*10)/10;
}

function minMaxFor(focus){
  if (focus==="passing" || focus==="defense") return [4,15];
  if (focus==="conditioning") return [1,20];
  return [1,15];
}

function inferMinMaxFromName(name, focus, currentMin, currentMax) {
  const n = name.toLowerCase();
  if (/1-on-1|1v1/.test(n)) return [2, currentMax];
  if (/2-on-2|2v2/.test(n)) return [4, currentMax];
  if (/3-on-3|3v3/.test(n)) return [6, currentMax];
  if (/4-on-4|4v4/.test(n)) return [8, currentMax];
  if (/5-on-5|5v5/.test(n)) return [10, currentMax];
  if (/4v4/.test(n)) return [8, currentMax];
  if (/3v3/.test(n)) return [6, currentMax];
  if (/2v1|2-on-1/.test(n)) return [3, currentMax];
  if (/3v2|3-on-2/.test(n)) return [5, currentMax];
  return [currentMin, currentMax];
}

function optGroupFor(focus){
  return { offense:3, defense:4, passing:3, conditioning:5 }[focus];
}

function fullCourtFor(focus, name){
  const n = name.toLowerCase();
  if (/full-court/.test(n)) return true;
  if (/baseline-to-baseline|continuous transition|10-5-10s/.test(n)) return true;
  if (/gassers|17s/.test(n)) return true;
  if (/break|transition/.test(n)) return true;
  return false;
}

function baseTags(focus){
  return {
    offense: ["shooting","finishing","ball-handling","spacing"],
    defense: ["closeout","help","gap","rebound"],
    passing: ["fundamentals","movement","vision","timing"],
    conditioning: ["stamina","speed","footwork","tempo"],
  }[focus];
}

function contextualTags(tags, name){
  const out = Array.from(new Set(tags.slice(0,2)));
  if (/PnR|Screen/i.test(name)) out.push("screening");
  if (/1-on-1|1v1/i.test(name)) out.push("small-sided");
  if (/3-on-3|4-on-4|3v3|4v4/i.test(name)) out.push("competitive");
  if (/Weave|Break|Transition/i.test(name)) out.push("fast-break");
  if (/Mikan|Post/i.test(name)) out.push("post");
  return out;
}

function descFor(name, focus){
  const base = {
    offense: "Read, space, and finish with pace; emphasize shot prep and decisions.",
    defense: "Build habits: stance, talk, help-and-recover; finish with contest/rebound.",
    passing: "Move the ball ahead of the defense; on-time, on-target with movement.",
    conditioning: "High-tempo work with clear time goals; maintain form under fatigue."
  }[focus];
  let extra = "";
  if (/PnR|Screen/i.test(name)) extra += " Focus on screen angles and reads vs common coverages.";
  if (/Closeout|Contest/i.test(name)) extra += " Prioritize controlled closeouts and high-hand contests.";
  if (/Weave|Break|Transition/i.test(name)) extra += " Encourage wide lanes and advance passes in transition.";
  if (/Sprints|Gassers|Pyramid|Ladder/i.test(name)) extra += " Track times; compete for personal bests.";
  if (/Post|Seal/i.test(name)) extra += " Establish deep position and read doubles.";
  return (base + extra).trim();
}

function makeDrill(name, focus, description, verified=false){
  const level = levelFor(focus);
  const intensity = intensityFor(focus, level);
  const duration = durationFor(focus, level);
  const rating = ratingFor(level);
  let [min_players, max_players] = minMaxFor(focus);
  [min_players, max_players] = inferMinMaxFromName(name, focus, min_players, max_players);
  const optimal_group_size = optGroupFor(focus);

  let arche;
  if (focus==="offense") arche = rndChoice(["guards","forwards","balanced_big"]);
  else if (focus==="defense") arche = rndChoice(["balanced_big","centers","guards"]);
  else if (focus==="passing") arche = rndChoice(["guards","forwards","balanced_big"]);
  else arche = rndChoice(["balanced_big","guards","centers"]);

  const positions_emphasis = positionsFor(arche);
  const tags = contextualTags(baseTags(focus), name);
  const requires_full_court = fullCourtFor(focus, name);

  return {
    name,
    focus,
    duration,
    description,
    cues: sampleCues(focus),
    tags,
    level,
    intensity,
    rating,
    verified: !!verified,
    is_template: focus!=="conditioning",
    min_players,
    max_players,
    optimal_group_size,
    requires_full_court,
    positions_emphasis,
    media_url: null
  };
}

const curated = [
  ["Form Shooting","offense","Close-range mechanics: stance, set point, and clean follow-through; build rhythm then step out."],
  ["Mikan Series","offense","Alternating layups under the rim; footwork and soft touch off either foot."],
  ["Reverse Mikan","offense","Reverse finishes using the rim for protection; emphasize balance and touch."],
  ["Free Throw Routine","offense","Game-like free throws with a consistent routine and pressure tracking."],
  ["Spot-Up Shooting — 5 Spots","offense","Corners, wings, top; track makes and move on a timer."],
  ["Pull-Up Series — 1-Dribble","offense","Rip-through into one-dribble pull-ups from top/wings; stick the landing."],
  ["Step-Back Series","offense","Create space with a controlled step-back; load inside leg and square shoulders."],
  ["Two-Ball Pound","offense","Simultaneous high/low pounds with eyes up; posture and control."],
  ["Two-Ball Alternating","offense","Alternate rhythm with varying height/speed to challenge coordination."],
  ["Cone Weave Handle","offense","Weave through cones at speed; tight footwork and ball protection."],
  ["In-Out to Cross Combo","offense","Change of pace into a hard cross; accelerate after the move."],
  ["Behind-the-Back Series","offense","Wrap dribble to change angle without exposing the ball; hips low."],
  ["Hesitation Series","offense","Freeze defender with eyes/shoulders, then burst through the gap."],
  ["Weak-Hand Only","offense","All dribbles and finishes off-hand to close gaps in ability."],
  ["Euro-Step Finishes","offense","Two-step lateral finish vs contact; protect the ball and finish high."],
  ["Floater Series","offense","High-arc runners from lane lines; soft touch off one or two feet."],
  ["Spin Move Finish","offense","Controlled spin counter at help; chin on shoulder, tight footwork."],
  ["3-Man Weave","passing","Classic fast-break passing without dribbles; sprint and pass ahead."],
  ["4-Corners Passing","passing","Pivot, cut, and continue passing around four corners."],
  ["Partner Chest Pass","passing","Snap chest passes to target; step into pass and thumbs down follow-through."],
  ["Partner Bounce Pass","passing","Bounce to knee height; quick release and accuracy."],
  ["Skip Pass Reads","passing","Drive-and-kick skip vs help; feet set on catch; shoot or extra pass."],
  ["Paint Touch Kicks","passing","Two feet in the paint then pitch; create advantage and spray the ball."],
  ["Shell Defense 4v4","defense","Positioning, closeouts, help/recover on every pass and drive."],
  ["Help & Recover","defense","Dig to the nail then sprint-to-recover; show hands, no reach."],
  ["Closeout & Contest","defense","High-hand closeout, short choppy steps, contain the drive."],
  ["Zig-Zag Defense","defense","Slide, drop step, cut off angles; finish with wall-up."],
  ["Box-Out Gauntlet","defense","Hit-find-seal on shot; fight for space and pursue the ball."],
  ["Outlet & Fill","defense","Rebound to outlet; wings sprint wide and fill lanes."],
  ["Baseline Sprints","conditioning","Intervals with target HR zones; recover on the jog back."],
  ["Suicides (Line Runs)","conditioning","Baseline to FT, half, opposite FT, opposite baseline; touch lines."],
  ["Lane Agility Test","conditioning","Pro lane pattern for foot speed and change of direction."],
  ["Baseline-to-Baseline Repeats","conditioning","Down-and-back intervals on whistle; time each rep."],
  ["Ball Screen Pull-Up","offense","Use screen; rise into mid; read under/over/ice coverage."],
  ["Pistol Action (DHO)","offense","Pindown into DHO; reject or turn the corner on the read."],
  ["Hammer Action","offense","Baseline drive into weakside hammer screen for the corner 3."],
  ["Star Shooting (5-Spot)","offense","Five-spot arc/corners; track makes and add end pressure."],
  ["Chair Shooting — Curls & Fades","offense","Use a chair as screener; curl/fade with quick squares."],
  ["Drive-Kick-Swing 3s","offense","Paint touch to corner; one-more swing to top; shot ready."],
  ["PnR Reads — Drop Coverage","offense","Reject/use; pocket pass, snake dribble, or pull-up vs drop."],
  ["PnR Reads — Switch & Slip","offense","Read the switch; hit slip or attack mismatch."],
  ["Post Entry & 45 Cut","offense","Feed post, slice cut; finish or relocate for return pass."],
  ["Relocation Shooting","offense","Drive from wing; passer relocates on arc for catch-and-shoot."],
  ["Nail Help Scramble (2v2+Coach)","defense","Stunt from nail and recover on pass; coach drives/kicks."],
  ["Baseline Drift Coverage","defense","Low man tags roller; weak side covers drift; rotate on airtime."],
  ["Corner Closeouts","defense","Long closeout to corner; take away middle; contest under control."],
  ["Shell + Ball Screen Layer","defense","Add on-ball coverage to shell; communicate tags and rotations."],
  ["3-Man Weave into 3v2","passing","Weave to half, break to 3v2; pass ahead to finish."],
  ["4-Man Weave into 2v1","passing","Weave to far arc, then 2v1; finish with wide runner."],
  ["Skip to Extra","passing","Skip forces closeout; one-more to corner/top for a great shot."],
  ["Numbers Advantage — 5v4","passing","Ball moves ahead; fill lanes; punish the helper."],
  ["Full-Court Conditioning — 17s","conditioning","17 sideline touches in 60s; pace management and grit."],
  ["30-30-30 Runs","conditioning","30s hard, 30s jog, 30s hard; repeat sets with HR goal."],
  ["Shuttle Sprints (Pro)","conditioning","Cones at 10/20/30; touch and go; time each rep."]
];

const offenseNames = [
  "Zoom Action Reads","Ghost Screen 3s","Drift-Corner Series","Punch Post Seal",
  "Laker Cut Finishes","Iverson Cut Catch & Shoot","Floppy Action Var 1",
  "Floppy Action Var 2","Staggered Screens Reads","Spain PnR Finisher",
  "Chicago Action (Pin+DHO)","Zoom Flip Late Clock","Short Roll Playmaking",
  "Skip to Hammer","Nash Dribble Under","Lift & Drift Shooting",
  "Stack Inbounds Quick 3","Baseline Rip Screen","Wedge Screen Post-Up",
  "Spain Twist Variation","Double Drag Options","Drag into Throwback 3",
  "Empty-Side PnR Reads","Veer Back Read","Pitch Ahead Layups",
  "Deep Seal Duck-Ins","Punch to Split Cut","Wide Pindown to DHO",
  "Pindown Slip & Pop","Post Split to Corner 3"
];
const defenseNames = [
  "K-Slide Closeout Chain","Gap & Go Contest","Tag-The-Roller Scramble",
  "Early Shrink Then Fly","Weakside X-Out Drill","Top-Lock Denial",
  "Ice to Peel Switch","Hot-Nail Stunt Timing","Post Front & Scram",
  "Two to the Ball Blitz","Late Switch Communication","Low-Man Take & Go",
  "No Middle Contain","High-Wall on PnR","Switch-Back Drill",
  "Charger Circle (Safety)","Veer Box-Out","Hit-First Rebound",
  "Triangle Rebound War","Second Effort Closeout"
];
const passingNames = [
  "Drive & Drift Kicks","One-More Chains","High-Low Hi-Lo Reps",
  "Lob Timing Window","Baseline Skip Series","Inside-Out Post Kicks",
  "Paint Touch to Pitch","Swing-Swing Corner 3","Advance Pass Races",
  "Backdoor Read vs Deny","Touch Pass Shooting","Two-Player Keep-Away",
  "Give-and-Go Ladder","Elbow Entry Options","Middle Third Advance"
];
const conditioningNames = [
  "Full-Court 10-5-10s","Gassers on the :30","Half-Court L Builds",
  "3-6-9 Sprint Pyramid","Four-Corner Sprint Cycle","Ladder Sprints",
  "3-2-1 Tempo Runs","Continuous Transition Maker","Cone T-Agility",
  "Pro Agility 5-10-5","Mirror Footwork","Push-Pull Sprint Sets"
];

function buildFromList(list, focus){
  return list.map(n => makeDrill(n, focus, descFor(n, focus), true));
}

const tokens = {
  offense: ["Cut","Curl","Fade","Ghost","Stagger","Double Drag","Zoom","Chicago","Spain","Twist","Punch","Split","Hammer","Lift","Drift","Short Roll","Iverson","Floppy","Backdoor","Drive-Kick","Relocate","Throwback"],
  defense: ["Closeout","Scram","Blitz","Ice","Switch","X-Out","Gap","Tag","Wall","Contain","Nail","Low-Man","Peel","Shrink","Deny"],
  passing: ["Skip","Swing","Pitch","Advance","Paint Touch","One-More","Backdoor","Lob","High-Low","Inside-Out","Touch Pass"],
  conditioning: ["Sprint","Shuttle","Pyramid","Ladder","Tempo","Gasser","Agility","Mirror","Repeat","Interval"],
};
const suffix = {
  offense: ["Series","Reads","Options","Finishes","Quick","Flow"],
  defense: ["Drill","Chain","Coverage","Rotation","Discipline"],
  passing: ["Series","Chain","Window","Timing","Patterns"],
  conditioning: ["Sets","Cycle","Challenge","Test","Tempo"],
};

function synthesizeName(focus){
  const a = rndChoice(tokens[focus]);
  const b = rndChoice(suffix[focus]);
  if (focus==="offense" && /Spain|Chicago|Iverson|Floppy|Zoom/.test(a)) {
    return `${a} Action ${rndChoice(["Reads","Series","Var"])}`;
  }
  if (focus==="defense" && /Ice|Scram|X-Out|Peel/.test(a)) {
    return `${a} ${rndChoice(["Coverage","Rotation","Drill"])}`;
  }
  return `${a} ${b}`;
}

const drills = [];
for (const [n,f,d] of curated) drills.push(makeDrill(n,f,d,true));
drills.push(...buildFromList(offenseNames,"offense"));
drills.push(...buildFromList(defenseNames,"defense"));
drills.push(...buildFromList(passingNames,"passing"));
drills.push(...buildFromList(conditioningNames,"conditioning"));

const names = new Set(drills.map(d=>d.name));
while (drills.length < 200){
  const focus = rndChoice(focuses);
  let name = synthesizeName(focus);
  let tries = 0;
  while (names.has(name) && tries < 6){
    name = synthesizeName(focus);
    tries++;
  }
  if (names.has(name)) name = `${name} Var ${Math.floor(rand()*8)+2}`;
  names.add(name);
  drills.push(makeDrill(name, focus, descFor(name, focus), false));
}

fs.writeFileSync('drills_data.json', JSON.stringify(drills, null, 2));
console.log(`Generated ${drills.length} drills`);
