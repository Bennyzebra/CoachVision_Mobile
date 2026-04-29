import { Drill, AppState } from "@/types";

export const demoDrills: Drill[] = [
  {
    id: "1",
    name: "3-Man Weave",
    focus: "passing",
    duration: 10,
    rating: 4.5,
    verified: true,
    description: "Classic fast-break passing drill that builds court awareness and precision passing. Players sprint down court exchanging passes without dribbling.",
    cues: [
      "Sprint to spots, don't drift",
      "Pass ahead of the cutter",
      "Communicate on every pass",
      "Finish with a layup"
    ],
    tags: ["fast-break", "fundamentals", "small-group", "warmup"],
    minPlayers: 3,
    maxPlayers: 15,
    optimalGroupSize: 3,
    level: "intermediate",
    intensity: 3,
    positionsEmphasis: { G: 0.7, F: 0.3, C: 0.0 }
  },
  {
    id: "2",
    name: "Shell Drill",
    focus: "defense",
    duration: 15,
    rating: 4.8,
    verified: true,
    description: "Four-on-four defensive fundamentals focusing on help position, closeouts, and rotations. Essential for teaching team defensive concepts.",
    cues: [
      "Ball pressure on every catch",
      "Help one pass away",
      "Sprint to closeouts",
      "Talk on every rotation"
    ],
    tags: ["team-defense", "fundamentals", "full-squad"],
    minPlayers: 8,
    maxPlayers: 20,
    optimalGroupSize: 4,
    level: "intermediate",
    intensity: 3
  },
  {
    id: "3",
    name: "Mikan Drill",
    focus: "offense",
    duration: 8,
    rating: 4.3,
    verified: true,
    description: "Close-range layup repetition alternating sides of the basket. Develops soft touch and ambidextrous finishing around the rim.",
    cues: [
      "Use the backboard on both sides",
      "Keep ball above shoulders",
      "Quick feet, no wasted steps",
      "Finish with opposite hand"
    ],
    tags: ["post", "finishing", "individual"],
    minPlayers: 1,
    maxPlayers: 15,
    optimalGroupSize: 1,
    level: "beginner",
    intensity: 2,
    positionsEmphasis: { C: 0.6, F: 0.4, G: 0.0 }
  },
  {
    id: "4",
    name: "Suicide Sprints",
    focus: "conditioning",
    duration: 12,
    rating: 3.9,
    description: "Line-to-line sprints touching each line on the court. Builds explosive speed and mental toughness for late-game situations.",
    cues: [
      "Touch each line with hand",
      "Push through fatigue",
      "Explosive change of direction",
      "Maintain form throughout"
    ],
    tags: ["conditioning", "full-squad", "cooldown"],
    minPlayers: 2,
    maxPlayers: 20,
    optimalGroupSize: 5,
    level: "intermediate",
    intensity: 5
  },
  {
    id: "5",
    name: "Pick and Roll Reads",
    focus: "offense",
    duration: 15,
    rating: 4.6,
    verified: true,
    description: "Two-man game teaching ball handler and roller to read defensive coverage. Covers slip, pop, and traditional roll options.",
    cues: [
      "Set a solid screen",
      "Read the hedge",
      "Roll to open space",
      "Keep eyes on the ball"
    ],
    tags: ["offense", "advanced", "ball-handler"],
    minPlayers: 4,
    maxPlayers: 12,
    optimalGroupSize: 2,
    level: "advanced",
    intensity: 4,
    positionsEmphasis: { G: 0.5, C: 0.3, F: 0.2 }
  },
  {
    id: "6",
    name: "Closeout Drill",
    focus: "defense",
    duration: 10,
    rating: 4.4,
    verified: true,
    description: "Defender sprints from help position to contest a shooter, focusing on controlled approach and proper closeout technique.",
    cues: [
      "Sprint then chop feet",
      "High hands on closeout",
      "Force baseline or sideline",
      "Contest without fouling"
    ],
    tags: ["perimeter-defense", "fundamentals"]
  },
  {
    id: "7",
    name: "Star Passing",
    focus: "passing",
    duration: 8,
    rating: 4.2,
    description: "Five players arranged in a star pattern execute skip passes and cuts. Emphasizes court spacing and quick ball movement.",
    cues: [
      "Crisp chest passes",
      "Cut to the basket after passing",
      "Fill spots immediately",
      "Keep the ball moving"
    ],
    tags: ["passing", "small-group", "fundamentals"]
  },
  {
    id: "8",
    name: "Box Out War",
    focus: "defense",
    duration: 10,
    rating: 4.1,
    description: "Competitive rebounding drill emphasizing finding your man, making contact, and securing the rebound with two hands.",
    cues: [
      "Find your man first",
      "Make contact, hold position",
      "Two hands on every rebound",
      "Chin the ball immediately"
    ],
    tags: ["rebounding", "post", "full-squad"]
  },
  {
    id: "9",
    name: "Dribble Combo Series",
    focus: "offense",
    duration: 12,
    rating: 4.5,
    description: "Ball-handling sequence combining crossovers, between-the-legs, and behind-the-back moves. Builds handle confidence under pressure.",
    cues: [
      "Keep eyes up, not on ball",
      "Stay low in athletic stance",
      "Change speeds not just directions",
      "Protect the ball with body"
    ],
    tags: ["ball-handler", "fundamentals", "guard"]
  },
  {
    id: "10",
    name: "5-on-5 Transition",
    focus: "conditioning",
    duration: 20,
    rating: 4.7,
    verified: true,
    description: "Full-court five-on-five with mandatory fast breaks. Offense becomes defense immediately on change of possession.",
    cues: [
      "Sprint in transition every time",
      "Outlet pass immediately",
      "Run lanes wide",
      "Get back on defense"
    ],
    tags: ["full-squad", "game-speed", "conditioning"],
    minPlayers: 10,
    maxPlayers: 20,
    optimalGroupSize: 5,
    level: "intermediate",
    intensity: 5,
    requiresFullCourt: true
  },
  {
    id: "11",
    name: "Spot Shooting",
    focus: "offense",
    duration: 10,
    rating: 4.3,
    description: "Players rotate through five shooting spots around the three-point arc, tracking makes and building shooting consistency.",
    cues: [
      "Same form every shot",
      "Follow through to the target",
      "Quick shot prep off the catch",
      "Reset feet between reps"
    ],
    tags: ["shooting", "individual", "perimeter"]
  },
  {
    id: "12",
    name: "Lane Slides",
    focus: "defense",
    duration: 8,
    rating: 4.0,
    description: "Defensive slides across the lane touching each line. Builds lateral quickness and defensive footwork fundamentals.",
    cues: [
      "Stay low in stance",
      "Don't cross feet",
      "Push off outside foot",
      "Keep hands active"
    ],
    tags: ["footwork", "fundamentals", "conditioning"]
  },
  {
    id: "13",
    name: "1-on-1 Zig Zag",
    focus: "defense",
    duration: 10,
    rating: 4.4,
    verified: true,
    description: "Defender works on staying in front of offensive player through multiple direction changes. Builds lateral movement and defensive positioning.",
    cues: [
      "Stay in defensive stance",
      "Mirror the offensive player",
      "Don't reach, move your feet",
      "Keep body between ball and basket"
    ],
    tags: ["perimeter-defense", "footwork", "individual"]
  },
  {
    id: "14",
    name: "Corner Shooting",
    focus: "offense",
    duration: 8,
    rating: 4.2,
    description: "Players shoot from both corners with a focus on proper mechanics. Emphasizes one of the most efficient shots in basketball.",
    cues: [
      "Square up to the basket",
      "Same form as free throws",
      "Follow through on every shot",
      "Quick shot preparation"
    ],
    tags: ["shooting", "perimeter", "individual"]
  },
  {
    id: "15",
    name: "Full Court Press Break",
    focus: "offense",
    duration: 12,
    rating: 4.5,
    verified: true,
    description: "Team works on breaking full court defensive pressure. Teaches proper spacing, passing, and decision-making under pressure.",
    cues: [
      "Meet the pass",
      "Wide spacing on wings",
      "Look ahead first",
      "Protect the ball"
    ],
    tags: ["press-break", "ball-handler", "full-squad"]
  },
  {
    id: "16",
    name: "Help and Recover",
    focus: "defense",
    duration: 12,
    rating: 4.6,
    verified: true,
    description: "Defenders practice helping on drive then recovering to their man. Essential for team defense coordination.",
    cues: [
      "Help the helper",
      "Quick recovery closeout",
      "Communicate on rotations",
      "Contest without fouling"
    ],
    tags: ["team-defense", "rotations", "full-squad"]
  },
  {
    id: "17",
    name: "Euro Step Finishing",
    focus: "offense",
    duration: 10,
    rating: 4.3,
    description: "Players practice the euro step move to finish at the rim while avoiding contact. Develops footwork and body control.",
    cues: [
      "Plant and explode laterally",
      "Two steps maximum",
      "Protect ball with body",
      "Finish with soft touch"
    ],
    tags: ["finishing", "advanced", "individual"]
  },
  {
    id: "18",
    name: "Offensive Rebounding",
    focus: "offense",
    duration: 10,
    rating: 4.1,
    description: "Players work on crashing the boards and securing offensive rebounds. Emphasizes positioning and hustle.",
    cues: [
      "Anticipate the miss",
      "Attack the weak side",
      "Go up strong with both hands",
      "Put it back up immediately"
    ],
    tags: ["rebounding", "post", "hustle"]
  },
  {
    id: "19",
    name: "Ball Screen Defense",
    focus: "defense",
    duration: 14,
    rating: 4.7,
    verified: true,
    description: "Teaching defenders various coverages on ball screens: hedge, switch, under, ice. Critical for modern basketball defense.",
    cues: [
      "Communicate coverage early",
      "Show high on hedge",
      "Quick recovery on switch",
      "Force to sideline on ice"
    ],
    tags: ["team-defense", "advanced", "ball-screen"]
  },
  {
    id: "20",
    name: "Outlet Passing",
    focus: "passing",
    duration: 8,
    rating: 4.0,
    description: "Rebounders practice quick outlet passes to start the break. Guards work on getting open and receiving the pass.",
    cues: [
      "Chin the rebound first",
      "Step to the ball",
      "Hit the target in stride",
      "Push the ball up court"
    ],
    tags: ["fast-break", "fundamentals", "full-squad"]
  },
  {
    id: "21",
    name: "Post Moves Series",
    focus: "offense",
    duration: 12,
    rating: 4.4,
    verified: true,
    description: "Big players work on drop step, up-and-under, and jump hook. Develops low post scoring repertoire.",
    cues: [
      "Seal your defender",
      "Strong first move",
      "Use the backboard",
      "Protect the ball on gather"
    ],
    tags: ["post", "advanced", "individual"]
  },
  {
    id: "22",
    name: "Charge Taking Drill",
    focus: "defense",
    duration: 8,
    rating: 3.8,
    description: "Defenders practice proper technique for drawing offensive fouls. Emphasizes positioning and timing.",
    cues: [
      "Get set early",
      "Hands up for balance",
      "Take contact on chest",
      "Fall backward safely"
    ],
    tags: ["fundamentals", "individual", "hustle"]
  },
  {
    id: "23",
    name: "Off-Ball Screen Work",
    focus: "offense",
    duration: 10,
    rating: 4.3,
    description: "Cutters work on using screens away from the ball. Emphasizes reading the defender and proper cuts.",
    cues: [
      "Set up your defender",
      "Read how they guard the screen",
      "Use the screen shoulder to shoulder",
      "Come off ready to shoot"
    ],
    tags: ["cutting", "fundamentals", "small-group"]
  },
  {
    id: "24",
    name: "Form Shooting",
    focus: "offense",
    duration: 8,
    rating: 4.1,
    description: "Close range shooting focusing solely on proper mechanics. Foundation for all other shooting drills.",
    cues: [
      "Elbow under the ball",
      "Follow through completely",
      "Balance on every shot",
      "Focus on rotation"
    ],
    tags: ["shooting", "fundamentals", "individual"]
  },
  {
    id: "25",
    name: "Defensive Rotations 4-on-4",
    focus: "defense",
    duration: 14,
    rating: 4.6,
    verified: true,
    description: "Extended shell drill with emphasis on multiple rotations. Builds team defensive communication and trust.",
    cues: [
      "First help stops the ball",
      "Next man rotates down",
      "Weak side provides help",
      "Talk through every rotation"
    ],
    tags: ["team-defense", "rotations", "full-squad"]
  },
  {
    id: "26",
    name: "Crossover Series",
    focus: "offense",
    duration: 10,
    rating: 4.2,
    description: "Guards work on various crossover moves: basic, double, hesitation. Builds ball-handling arsenal.",
    cues: [
      "Low and quick dribble",
      "Sell the first direction",
      "Accelerate out of the move",
      "Protect with off hand"
    ],
    tags: ["ball-handler", "guard", "individual"]
  },
  {
    id: "27",
    name: "Skip Pass Shooting",
    focus: "offense",
    duration: 10,
    rating: 4.4,
    description: "Players catch skip passes from across the court and shoot. Simulates game situations and ball movement.",
    cues: [
      "Be ready before catch",
      "Catch and square feet",
      "Quick release",
      "Follow shot for rebound"
    ],
    tags: ["shooting", "passing", "perimeter"]
  },
  {
    id: "28",
    name: "Deny Defense",
    focus: "defense",
    duration: 10,
    rating: 4.3,
    description: "Defender works on denying the wing pass. Offensive player works on getting open. Great competitive drill.",
    cues: [
      "Arm in passing lane",
      "See ball and man",
      "Stay on ball side",
      "No easy catches"
    ],
    tags: ["perimeter-defense", "fundamentals", "individual"]
  },
  {
    id: "29",
    name: "Baseline Drive Defense",
    focus: "defense",
    duration: 10,
    rating: 4.2,
    description: "Defenders practice preventing baseline drives and forcing middle where help is available.",
    cues: [
      "Force to middle",
      "Drop step to cut off baseline",
      "Use sideline as extra defender",
      "Contest at the rim"
    ],
    tags: ["perimeter-defense", "individual", "fundamentals"]
  },
  {
    id: "30",
    name: "Three Player Weave Shooting",
    focus: "offense",
    duration: 12,
    rating: 4.5,
    verified: true,
    description: "Extension of 3-man weave ending with perimeter shot instead of layup. Combines passing and shooting.",
    cues: [
      "Communicate on every pass",
      "Fill to three-point line",
      "Catch ready to shoot",
      "Rebound your shot"
    ],
    tags: ["shooting", "passing", "small-group"]
  },
  {
    id: "31",
    name: "Free Throw Golf",
    focus: "offense",
    duration: 12,
    rating: 3.9,
    description: "Competitive free throw shooting with golf scoring. Makes free throw practice engaging and pressure-packed.",
    cues: [
      "Same routine every time",
      "Deep breath before shot",
      "Visualize the make",
      "Follow through to target"
    ],
    tags: ["shooting", "fundamentals", "individual"]
  },
  {
    id: "32",
    name: "2-on-1 Fast Break",
    focus: "offense",
    duration: 10,
    rating: 4.4,
    description: "Two offensive players vs one defender. Teaches decision-making, spacing, and finishing in transition.",
    cues: [
      "Push the ball",
      "Force the defender to commit",
      "Make the easy play",
      "Attack the rim"
    ],
    tags: ["fast-break", "small-group", "fundamentals"]
  }
];

export const getDefaultState = (): AppState => ({
  drills: demoDrills,
  plan: [],
  players: [
    {
      id: "p1",
      name: "Marcus Johnson",
      position: "G",
      height: "6'2\"",
      experience: "advanced",
      attendance: [1, 1, 1, 0, 1]
    },
    {
      id: "p2",
      name: "Tyler Reed",
      position: "G",
      height: "5'11\"",
      experience: "intermediate",
      attendance: [1, 1, 1, 1, 1]
    },
    {
      id: "p3",
      name: "Jordan Davis",
      position: "F",
      height: "6'5\"",
      experience: "intermediate",
      attendance: [1, 0, 1, 1, 1]
    },
    {
      id: "p4",
      name: "Chris Williams",
      position: "C",
      height: "6'8\"",
      experience: "beginner",
      attendance: [1, 1, 0, 1, 1]
    },
    {
      id: "p5",
      name: "Brandon Lee",
      position: "F",
      height: "6'4\"",
      experience: "intermediate",
      attendance: [1, 1, 1, 1, 0]
    }
  ],
  feedback: [],
  profile: {
    sessionTarget: 60,
    experience: "intermediate",
  hideAddedByDefault: true,
    coachName: "Coach Taylor",
    email: "coach@example.com",
    sport: "Basketball",
    organization: "Varsity Hawks Program",
    defaultPracticeLength: 90,
    defaultWarmupLength: 15,
    intensityPreference: "balanced",
    focusDistribution: {
      offense: 40,
      defense: 40,
      conditioning: 20
    },
    showAdvancedDrills: true,
    showCommunityDrills: true,
    notifications: {
      practiceReminders: true,
      feedbackReminders: true,
      newSuggestions: true,
      teamUpdates: true,
      marketing: false
    },
    planName: "Free",
    renewalDate: "Jan 15, 2025"   
  },
  moderationQueue: [],
  teams: [
    {
      id: "team1",
      name: "Varsity Hawks",
      players: []
    }
  ],
  currentTeamId: "team1"
});
