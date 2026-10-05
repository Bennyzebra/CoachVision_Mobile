
DO $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN
    SELECT value
    FROM jsonb_array_elements($catalog$
[
{"name":"Pull-Up Series — 1-Dribble","focus":"offense","duration":10,"description":"Rip-through into one-dribble pull-ups from top/wings; stick the landing.","cues":["Shot prep: feet set, hands ready","Finish high off glass","Land on balance; hold follow-through","Change pace, then burst"],"tags":["shooting","finishing"],"level":"intermediate","intensity":3,"rating":4.5,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Step-Back Series","focus":"offense","duration":8,"description":"Create space with a controlled step-back; load inside leg and square shoulders.","cues":["Finish high off glass","Land on balance; hold follow-through","Change pace, then burst","Shot prep: feet set, hands ready"],"tags":["shooting","finishing"],"level":"intermediate","intensity":3,"rating":4.3,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Two-Ball Pound","focus":"offense","duration":6,"description":"Simultaneous high/low pounds with eyes up; posture and control.","cues":["See help early; make the extra pass","Shot prep: feet set, hands ready","Land on balance; hold follow-through","Finish high off glass"],"tags":["shooting","finishing"],"level":"intermediate","intensity":3,"rating":4.2,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Two-Ball Alternating","focus":"offense","duration":8,"description":"Alternate rhythm with varying height/speed to challenge coordination.","cues":["Finish high off glass","Land on balance; hold follow-through","Change pace, then burst","See help early; make the extra pass"],"tags":["shooting","finishing"],"level":"intermediate","intensity":3,"rating":4.4,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.5,"C":0.2},"media_url":null},
{"name":"Cone Weave Handle","focus":"offense","duration":8,"description":"Weave through cones at speed; tight footwork and ball protection.","cues":["Change pace, then burst","Finish high off glass","See help early; make the extra pass","Shot prep: feet set, hands ready"],"tags":["shooting","finishing","fast-break"],"level":"intermediate","intensity":3,"rating":4.6,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"In-Out to Cross Combo","focus":"offense","duration":10,"description":"Change of pace into a hard cross; accelerate after the move.","cues":["Land on balance; hold follow-through","Finish high off glass","Change pace, then burst","Shot prep: feet set, hands ready"],"tags":["shooting","finishing"],"level":"beginner","intensity":2,"rating":4.3,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Behind-the-Back Series","focus":"offense","duration":6,"description":"Wrap dribble to change angle without exposing the ball; hips low.","cues":["See help early; make the extra pass","Land on balance; hold follow-through","Change pace, then burst","Shot prep: feet set, hands ready"],"tags":["shooting","finishing"],"level":"intermediate","intensity":3,"rating":4.5,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Hesitation Series","focus":"offense","duration":8,"description":"Freeze defender with eyes/shoulders, then burst through the gap.","cues":["Land on balance; hold follow-through","Finish high off glass","See help early; make the extra pass","Change pace, then burst"],"tags":["shooting","finishing"],"level":"advanced","intensity":4,"rating":4.1,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.5,"C":0.2},"media_url":null},
{"name":"Weak-Hand Only","focus":"offense","duration":8,"description":"All dribbles and finishes off-hand to close gaps in ability.","cues":["Finish high off glass","Land on balance; hold follow-through","See help early; make the extra pass","Shot prep: feet set, hands ready"],"tags":["shooting","finishing"],"level":"beginner","intensity":2,"rating":4,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Euro-Step Finishes","focus":"offense","duration":8,"description":"Two-step lateral finish vs contact; protect the ball and finish high.","cues":["Shot prep: feet set, hands ready","Land on balance; hold follow-through","Finish high off glass","See help early; make the extra pass"],"tags":["shooting","finishing"],"level":"advanced","intensity":4,"rating":4.5,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Floater Series","focus":"offense","duration":12,"description":"High-arc runners from lane lines; soft touch off one or two feet.","cues":["Change pace, then burst","Finish high off glass","Shot prep: feet set, hands ready","See help early; make the extra pass"],"tags":["shooting","finishing"],"level":"intermediate","intensity":3,"rating":4.2,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Spin Move Finish","focus":"offense","duration":10,"description":"Controlled spin counter at help; chin on shoulder, tight footwork.","cues":["Shot prep: feet set, hands ready","Change pace, then burst","Land on balance; hold follow-through","See help early; make the extra pass"],"tags":["shooting","finishing"],"level":"intermediate","intensity":3,"rating":4.4,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.5,"C":0.2},"media_url":null},
{"name":"3-Man Weave","focus":"passing","duration":6,"description":"Classic fast-break passing without dribbles; sprint and pass ahead.","cues":["Move with purpose after you pass","Lead the receiver to space","Show hands early on the catch","Call names and actions"],"tags":["fundamentals","movement","fast-break"],"level":"advanced","intensity":3,"rating":4.2,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.5,"C":0.2},"media_url":null},
{"name":"4-Corners Passing","focus":"passing","duration":10,"description":"Pivot, cut, and continue passing around four corners.","cues":["Step into pass; thumbs down finish","Show hands early on the catch","Lead the receiver to space","Move with purpose after you pass"],"tags":["fundamentals","movement"],"level":"intermediate","intensity":2,"rating":4.2,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Partner Chest Pass","focus":"passing","duration":8,"description":"Snap chest passes to target; step into pass and thumbs down follow-through.","cues":["Lead the receiver to space","Call names and actions","Step into pass; thumbs down finish","Move with purpose after you pass"],"tags":["fundamentals","movement"],"level":"intermediate","intensity":2,"rating":4.2,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Partner Bounce Pass","focus":"passing","duration":10,"description":"Bounce to knee height; quick release and accuracy.","cues":["Step into pass; thumbs down finish","Call names and actions","Lead the receiver to space","Show hands early on the catch"],"tags":["fundamentals","movement"],"level":"intermediate","intensity":2,"rating":4.4,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Skip Pass Reads","focus":"passing","duration":10,"description":"Drive-and-kick skip vs help; feet set on catch; shoot or extra pass.","cues":["Show hands early on the catch","Step into pass; thumbs down finish","Lead the receiver to space","Move with purpose after you pass"],"tags":["fundamentals","movement"],"level":"advanced","intensity":3,"rating":4.3,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Paint Touch Kicks","focus":"passing","duration":6,"description":"Two feet in the paint then pitch; create advantage and spray the ball.","cues":["Lead the receiver to space","Call names and actions","Move with purpose after you pass","Step into pass; thumbs down finish"],"tags":["fundamentals","movement"],"level":"advanced","intensity":3,"rating":4.2,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.5,"C":0.2},"media_url":null},
{"name":"Shell Defense 4v4","focus":"defense","duration":6,"description":"Positioning, closeouts, help/recover on every pass and drive.","cues":["Talk: ball, help, screen","Hit-find-seal on shot","Low stance, active hands","High-hand closeout; choppy steps"],"tags":["closeout","help","competitive"],"level":"intermediate","intensity":3,"rating":4.6,"verified":true,"is_template":true,"min_players":8,"max_players":15,"optimal_group_size":4,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Help & Recover","focus":"defense","duration":6,"description":"Dig to the nail then sprint-to-recover; show hands, no reach.","cues":["Talk: ball, help, screen","Low stance, active hands","Hit-find-seal on shot","Sprint to help; recover on airtime"],"tags":["closeout","help"],"level":"intermediate","intensity":3,"rating":4.3,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":4,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Closeout & Contest","focus":"defense","duration":6,"description":"High-hand closeout, short choppy steps, contain the drive.","cues":["Low stance, active hands","Sprint to help; recover on airtime","Hit-find-seal on shot","High-hand closeout; choppy steps"],"tags":["closeout","help"],"level":"intermediate","intensity":3,"rating":4.5,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":4,"requires_full_court":false,"positions_emphasis":{"G":0.2,"F":0.3,"C":0.5},"media_url":null},
{"name":"Zig-Zag Defense","focus":"defense","duration":10,"description":"Slide, drop step, cut off angles; finish with wall-up.","cues":["Sprint to help; recover on airtime","Low stance, active hands","High-hand closeout; choppy steps","Talk: ball, help, screen"],"tags":["closeout","help"],"level":"intermediate","intensity":3,"rating":4.5,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":4,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Box-Out Gauntlet","focus":"defense","duration":10,"description":"Hit-find-seal on shot; fight for space and pursue the ball.","cues":["Sprint to help; recover on airtime","Low stance, active hands","Talk: ball, help, screen","High-hand closeout; choppy steps"],"tags":["closeout","help"],"level":"intermediate","intensity":3,"rating":4.5,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":4,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Outlet & Fill","focus":"defense","duration":8,"description":"Rebound to outlet; wings sprint wide and fill lanes.","cues":["Hit-find-seal on shot","Talk: ball, help, screen","Low stance, active hands","High-hand closeout; choppy steps"],"tags":["closeout","help"],"level":"beginner","intensity":2,"rating":4.1,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":4,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Baseline Sprints","focus":"conditioning","duration":10,"description":"Intervals with target HR zones; recover on the jog back.","cues":["Touch every line—no shortcuts","Compete to beat your time","Explode on each direction change","Finish through the line"],"tags":["stamina","speed"],"level":"intermediate","intensity":4,"rating":4.3,"verified":true,"is_template":false,"min_players":1,"max_players":20,"optimal_group_size":5,"requires_full_court":false,"positions_emphasis":{"G":0.2,"F":0.3,"C":0.5},"media_url":null},
{"name":"Suicides (Line Runs)","focus":"conditioning","duration":8,"description":"Baseline to FT, half, opposite FT, opposite baseline; touch lines.","cues":["Control breathing and form","Explode on each direction change","Touch every line—no shortcuts","Finish through the line"],"tags":["stamina","speed"],"level":"intermediate","intensity":4,"rating":4.5,"verified":true,"is_template":false,"min_players":1,"max_players":20,"optimal_group_size":5,"requires_full_court":false,"positions_emphasis":{"G":0.2,"F":0.3,"C":0.5},"media_url":null},
{"name":"Lane Agility Test","focus":"conditioning","duration":10,"description":"Pro lane pattern for foot speed and change of direction.","cues":["Finish through the line","Explode on each direction change","Control breathing and form","Compete to beat your time"],"tags":["stamina","speed"],"level":"intermediate","intensity":4,"rating":4.4,"verified":true,"is_template":false,"min_players":1,"max_players":20,"optimal_group_size":5,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Baseline-to-Baseline Repeats","focus":"conditioning","duration":10,"description":"Down-and-back intervals on whistle; time each rep.","cues":["Explode on each direction change","Touch every line—no shortcuts","Control breathing and form","Finish through the line"],"tags":["stamina","speed"],"level":"beginner","intensity":3,"rating":4.2,"verified":true,"is_template":false,"min_players":1,"max_players":20,"optimal_group_size":5,"requires_full_court":true,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Ball Screen Pull-Up","focus":"offense","duration":6,"description":"Use screen; rise into mid; read under/over/ice coverage.","cues":["See help early; make the extra pass","Shot prep: feet set, hands ready","Land on balance; hold follow-through","Finish high off glass"],"tags":["shooting","finishing","screening"],"level":"beginner","intensity":2,"rating":4.3,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Pistol Action (DHO)","focus":"offense","duration":8,"description":"Pindown into DHO; reject or turn the corner on the read.","cues":["Finish high off glass","Change pace, then burst","Shot prep: feet set, hands ready","Land on balance; hold follow-through"],"tags":["shooting","finishing"],"level":"beginner","intensity":2,"rating":4.1,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Hammer Action","focus":"offense","duration":8,"description":"Baseline drive into weakside hammer screen for the corner 3.","cues":["See help early; make the extra pass","Shot prep: feet set, hands ready","Land on balance; hold follow-through","Change pace, then burst"],"tags":["shooting","finishing"],"level":"intermediate","intensity":3,"rating":4.5,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Star Shooting (5-Spot)","focus":"offense","duration":6,"description":"Five-spot arc/corners; track makes and add end pressure.","cues":["Finish high off glass","See help early; make the extra pass","Shot prep: feet set, hands ready","Change pace, then burst"],"tags":["shooting","finishing"],"level":"advanced","intensity":4,"rating":4.2,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.5,"C":0.2},"media_url":null},
{"name":"Chair Shooting — Curls & Fades","focus":"offense","duration":10,"description":"Use a chair as screener; curl/fade with quick squares.","cues":["See help early; make the extra pass","Finish high off glass","Shot prep: feet set, hands ready","Land on balance; hold follow-through"],"tags":["shooting","finishing"],"level":"beginner","intensity":2,"rating":4.3,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Drive-Kick-Swing 3s","focus":"offense","duration":8,"description":"Paint touch to corner; one-more swing to top; shot ready.","cues":["Finish high off glass","Shot prep: feet set, hands ready","Land on balance; hold follow-through","Change pace, then burst"],"tags":["shooting","finishing"],"level":"advanced","intensity":4,"rating":4.2,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"PnR Reads — Drop Coverage","focus":"offense","duration":6,"description":"Reject/use; pocket pass, snake dribble, or pull-up vs drop.","cues":["Finish high off glass","Shot prep: feet set, hands ready","Change pace, then burst","See help early; make the extra pass"],"tags":["shooting","finishing","screening"],"level":"intermediate","intensity":3,"rating":4.3,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"PnR Reads — Switch & Slip","focus":"offense","duration":8,"description":"Read the switch; hit slip or attack mismatch.","cues":["Shot prep: feet set, hands ready","See help early; make the extra pass","Finish high off glass","Land on balance; hold follow-through"],"tags":["shooting","finishing","screening"],"level":"intermediate","intensity":3,"rating":4.4,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Post Entry & 45 Cut","focus":"offense","duration":10,"description":"Feed post, slice cut; finish or relocate for return pass.","cues":["Land on balance; hold follow-through","Change pace, then burst","Finish high off glass","See help early; make the extra pass"],"tags":["shooting","finishing","post"],"level":"beginner","intensity":2,"rating":4.3,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Relocation Shooting","focus":"offense","duration":6,"description":"Drive from wing; passer relocates on arc for catch-and-shoot.","cues":["Change pace, then burst","Land on balance; hold follow-through","Shot prep: feet set, hands ready","Finish high off glass"],"tags":["shooting","finishing"],"level":"beginner","intensity":2,"rating":4.4,"verified":true,"is_template":true,"min_players":1,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"Nail Help Scramble (2v2+Coach)","focus":"defense","duration":8,"description":"Stunt from nail and recover on pass; coach drives/kicks.","cues":["Low stance, active hands","Talk: ball, help, screen","High-hand closeout; choppy steps","Hit-find-seal on shot"],"tags":["closeout","help"],"level":"advanced","intensity":4,"rating":4.5,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":4,"requires_full_court":false,"positions_emphasis":{"G":0.2,"F":0.3,"C":0.5},"media_url":null},
{"name":"Baseline Drift Coverage","focus":"defense","duration":8,"description":"Low man tags roller; weak side covers drift; rotate on airtime.","cues":["Hit-find-seal on shot","Sprint to help; recover on airtime","Low stance, active hands","High-hand closeout; choppy steps"],"tags":["closeout","help"],"level":"intermediate","intensity":3,"rating":4.3,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":4,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"Corner Closeouts","focus":"defense","duration":8,"description":"Long closeout to corner; take away middle; contest under control.","cues":["Talk: ball, help, screen","Hit-find-seal on shot","Low stance, active hands","High-hand closeout; choppy steps"],"tags":["closeout","help"],"level":"advanced","intensity":4,"rating":4.3,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":4,"requires_full_court":false,"positions_emphasis":{"G":0.2,"F":0.3,"C":0.5},"media_url":null},
{"name":"Shell + Ball Screen Layer","focus":"defense","duration":12,"description":"Add on-ball coverage to shell; communicate tags and rotations.","cues":["Talk: ball, help, screen","Low stance, active hands","Sprint to help; recover on airtime","Hit-find-seal on shot"],"tags":["closeout","help","screening"],"level":"advanced","intensity":4,"rating":4.2,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":4,"requires_full_court":false,"positions_emphasis":{"G":0.6,"F":0.3,"C":0.1},"media_url":null},
{"name":"3-Man Weave into 3v2","focus":"passing","duration":6,"description":"Weave to half, break to 3v2; pass ahead to finish.","cues":["Show hands early on the catch","Lead the receiver to space","Call names and actions","Move with purpose after you pass"],"tags":["fundamentals","movement","fast-break"],"level":"intermediate","intensity":2,"rating":4.2,"verified":true,"is_template":true,"min_players":5,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null},
{"name":"4-Man Weave into 2v1","focus":"passing","duration":8,"description":"Weave to far arc, then 2v1; finish with wide runner.","cues":["Show hands early on the catch","Call names and actions","Step into pass; thumbs down finish","Lead the receiver to space"],"tags":["fundamentals","movement","fast-break"],"level":"beginner","intensity":1,"rating":4.1,"verified":true,"is_template":true,"min_players":3,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.5,"C":0.2},"media_url":null},
{"name":"Skip to Extra","focus":"passing","duration":10,"description":"Skip forces closeout; one-more to corner/top for a great shot.","cues":["Show hands early on the catch","Lead the receiver to space","Call names and actions","Step into pass; thumbs down finish"],"tags":["fundamentals","movement"],"level":"beginner","intensity":1,"rating":4.1,"verified":true,"is_template":true,"min_players":4,"max_players":15,"optimal_group_size":3,"requires_full_court":false,"positions_emphasis":{"G":0.3,"F":0.3,"C":0.4},"media_url":null}
]
$catalog$::JSONB)
  LOOP
    UPDATE public.drills
    SET
      focus = item->>'focus',
      duration = (item->>'duration')::INTEGER,
      description = item->>'description',
      cues = ARRAY(
        SELECT jsonb_array_elements_text(
          COALESCE(item->'cues', '[]'::JSONB)
        )
      ),
      tags = ARRAY(
        SELECT jsonb_array_elements_text(
          COALESCE(item->'tags', '[]'::JSONB)
        )
      ),
      level = item->>'level',
      intensity = (item->>'intensity')::INTEGER,
      rating = (item->>'rating')::NUMERIC,
      verified = COALESCE((item->>'verified')::BOOLEAN, FALSE),
      is_template = COALESCE((item->>'is_template')::BOOLEAN, TRUE),
      min_players = (item->>'min_players')::INTEGER,
      max_players = (item->>'max_players')::INTEGER,
      optimal_group_size = ARRAY[(item->>'optimal_group_size')::INTEGER],
      requires_full_court =
        COALESCE((item->>'requires_full_court')::BOOLEAN, FALSE),
      positions_emphasis =
        COALESCE(item->'positions_emphasis', '{}'::JSONB),
      media_url = item->>'media_url'
    WHERE coach_id IS NULL
      AND name = item->>'name';

    IF NOT FOUND THEN
      INSERT INTO public.drills (
        coach_id,
        name,
        focus,
        duration,
        description,
        cues,
        tags,
        level,
        intensity,
        rating,
        verified,
        is_template,
        min_players,
        max_players,
        optimal_group_size,
        requires_full_court,
        positions_emphasis,
        media_url
      )
      VALUES (
        NULL,
        item->>'name',
        item->>'focus',
        (item->>'duration')::INTEGER,
        item->>'description',
        ARRAY(
          SELECT jsonb_array_elements_text(
            COALESCE(item->'cues', '[]'::JSONB)
          )
        ),
        ARRAY(
          SELECT jsonb_array_elements_text(
            COALESCE(item->'tags', '[]'::JSONB)
          )
        ),
        item->>'level',
        (item->>'intensity')::INTEGER,
        (item->>'rating')::NUMERIC,
        COALESCE((item->>'verified')::BOOLEAN, FALSE),
        COALESCE((item->>'is_template')::BOOLEAN, TRUE),
        (item->>'min_players')::INTEGER,
        (item->>'max_players')::INTEGER,
        ARRAY[(item->>'optimal_group_size')::INTEGER],
        COALESCE((item->>'requires_full_court')::BOOLEAN, FALSE),
        COALESCE(item->'positions_emphasis', '{}'::JSONB),
        item->>'media_url'
      );
    END IF;
  END LOOP;
END $$;

SELECT COUNT(*) AS global_drills_loaded_so_far
FROM public.drills
WHERE coach_id IS NULL;