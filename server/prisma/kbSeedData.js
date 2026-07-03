/**
 * The 10 seed KB entries (spec Section 6.3), fully bilingual.
 * RULE (spec 6.1): psychoeducation only — "this pattern…", never diagnostic checklists
 * presented as verdicts about the user. body_ar is مصري-friendly clear Arabic.
 * Sources are free/legal references (spec 6.5) for attribution and further reading.
 */

const WHO_STRESS = { name: 'WHO — Doing What Matters in Times of Stress (official Arabic edition available)', url: 'https://www.who.int/publications/i/item/9789240003927' };
const NHS_SELF_HELP = { name: 'NHS self-help guides (Open Government Licence)', url: 'https://www.nhs.uk/mental-health/self-help/' };
const CCI = { name: 'Centre for Clinical Interventions (CCI) — CBT workbooks', url: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself' };
const NIMH = { name: 'NIMH publications (US public domain)', url: 'https://www.nimh.nih.gov/health/publications' };

export const KB_SEED = [
  {
    slug: 'rumination',
    category: 'thinking-patterns',
    name_en: 'Rumination',
    name_ar: 'الاجترار الفكري',
    body_en:
      'Rumination is replaying the same events, worries, or "what ifs" in loops that produce no decision and no action. It feels like problem-solving, but the key difference is output: problem-solving ends with a choice or a step; rumination just circles. Psychology links sustained rumination to lower mood and worse sleep — the loop keeps the stress response active without resolving anything. It often spikes at night or after criticism. The way out is not "stop thinking about it" (that usually backfires) but redirecting the loop into a bounded, concrete channel: a fixed worry window, structured writing that must end in one step, or a physical activity that interrupts the cycle.',
    body_ar:
      'الاجترار الفكري معناه إنك بتلف في نفس الموقف أو نفس القلق مية مرة من غير ما توصل لقرار أو خطوة. بيحسسك إنك "بتفكر في حل"، بس الفرق الحقيقي في النتيجة: التفكير المنتج بيخلص بقرار أو خطوة — الاجترار بيلف بس. علم النفس بيربط الاجترار المستمر بمزاج أوحش ونوم أصعب، لأن اللفة دي بتسيب جهاز التوتر شغال طول الوقت من غير ما تحل حاجة. وغالبًا بيزيد بالليل أو بعد أي انتقاد. الحل مش "بطّل تفكير" — دي عادة بتيجي بنتيجة عكسية — الحل إنك تحط اللفة دي في قناة محدودة وملموسة: وقت قلق ثابت، كتابة لازم تخلص بخطوة واحدة، أو حركة جسدية تقطع الدايرة.',
    techniques: {
      techniques: [
        {
          name_en: 'Worry postponement',
          name_ar: 'تأجيل القلق',
          how_en: "Set a fixed daily 15-minute 'worry window'. Outside it, write the worry down in one line and defer it to the window. Most deferred worries lose their charge before the window arrives.",
          how_ar: 'حدد "وقت قلق" ثابت ١٥ دقيقة كل يوم. أي قلق يجي بره الوقت ده، اكتبه في سطر واحد وأجّله للميعاد. أغلب الهموم المؤجلة بتفقد قوتها قبل ما الميعاد ييجي.',
        },
        {
          name_en: 'Written problem-solving',
          name_ar: 'حل المشكلة كتابيًا',
          how_en: '15 minutes on paper: define the problem in one sentence → list 3 options → pick one → write the first concrete step. If there is no output, it was rumination, not thinking.',
          how_ar: '١٥ دقيقة على ورق: عرّف المشكلة في جملة → اكتب ٣ اختيارات → اختار واحد → اكتب أول خطوة عملية. لو مطلعش ناتج، ده كان اجترار مش تفكير.',
        },
        {
          name_en: 'Behavioral redirection',
          name_ar: 'كسر اللفة بالحركة',
          how_en: 'When you catch the loop, switch to a short physical task that occupies attention: a 10-minute walk, a shower, tidying one shelf. The goal is interrupting the cycle, not distraction forever.',
          how_ar: 'أول ما تلاحظ اللفة، اقطعها بحاجة جسدية قصيرة بتاخد انتباهك: مشي ١٠ دقايق، دُش، ترتيب رف واحد. الهدف قطع الدايرة مش الهروب على طول.',
        },
      ],
    },
    refer_when_en: 'If the loops are impairing sleep or daily functioning for weeks, a professional can help — this is very treatable.',
    refer_when_ar: 'لو اللف ده بقاله أسابيع بيبوّظ نومك أو يومك، يستاهل تتكلم مع مختص — الموضوع ده بيتحسن كويس جدًا مع العلاج.',
    sources: [WHO_STRESS, CCI, NHS_SELF_HELP],
  },
  {
    slug: 'contingent-self-worth',
    category: 'self-worth',
    name_en: 'Contingent Self-Worth',
    name_ar: 'تقدير الذات المشروط',
    body_en:
      "Contingent self-worth is when your sense of value is tied to achievement or approval: a productive day means 'I'm good', a quiet day or absent praise reads as personal failure. The pattern makes mood swing with external results you don't fully control, and it fuels overwork followed by crashes. Research on self-worth suggests stability comes from diversification — anchoring value in several domains (relationships, values, curiosity, health) rather than one — and from self-compassion, which is not self-pity: it's treating yourself with the same factual kindness you'd offer a friend who had a bad week.",
    body_ar:
      'تقدير الذات المشروط معناه إن إحساسك بقيمتك مربوط بالإنجاز أو برأي الناس: يوم منتج يبقى "أنا كويس"، ويوم هادي أو من غير مدح يتقري كأنه فشل شخصي. النمط ده بيخلي مزاجك يتأرجح مع نتايج خارجية مش في إيدك بالكامل، وبيولّد شغل زيادة عن اللزوم وبعده انهيار. الأبحاث بتقول إن الثبات بييجي من التنويع — إنك تربط قيمتك بأكتر من حتة (علاقات، قيم، فضول، صحة) مش بحتة واحدة — ومن التعاطف مع النفس، واللي مش معناه الشفقة: معناه إنك تعامل نفسك بنفس العدل اللي هتعامل بيه صاحبك لو جاله أسبوع وحش.',
    techniques: {
      techniques: [
        {
          name_en: 'Self-worth diversification',
          name_ar: 'تنويع مصادر القيمة',
          how_en: 'List the domains that matter to you beyond work (relationships, health, learning, faith, play). Schedule one small weekly action in two of them — value needs deposits in more than one account.',
          how_ar: 'اكتب الحاجات اللي ليها قيمة عندك غير الشغل (علاقات، صحة، تعلم، دين، هوايات). حط حاجة صغيرة أسبوعيًا في اتنين منهم — القيمة محتاجة رصيد في أكتر من حساب.',
        },
        {
          name_en: 'Values clarification',
          name_ar: 'توضيح القيم',
          how_en: "Write what you want to stand for in one line per life area. When a day feels 'worthless', check it against your values, not your output: did you act like the person you want to be?",
          how_ar: 'اكتب سطر واحد عن الشخص اللي عايز تكونه في كل جانب من حياتك. لما يوم يحسسك إنه "بلا قيمة"، قيسه على قيمك مش على إنتاجك: عملت زي الشخص اللي عايز تكونه ولا لأ؟',
        },
        {
          name_en: 'Self-compassion break (Neff)',
          name_ar: 'وقفة تعاطف مع النفس (نيف)',
          how_en: "Three sentences when you're harsh on yourself: 'This is a hard moment' (mindfulness) → 'Hard moments are part of being human' (common humanity) → 'May I be kind to myself right now' (kindness).",
          how_ar: 'تلات جمل لما تلاقي نفسك قاسي على نفسك: "دي لحظة صعبة" (وعي) → "اللحظات الصعبة جزء من إننا بشر" (إنسانية مشتركة) → "خليني ألطف بنفسي دلوقتي" (لطف).',
        },
      ],
    },
    refer_when_en: 'If worthlessness feels persistent regardless of context, or burnout signs are stacking up, that deserves professional support.',
    refer_when_ar: 'لو إحساس انعدام القيمة بقى مستمر مهما كانت الظروف، أو علامات الاحتراق بتتراكم، ده يستاهل دعم مختص.',
    sources: [CCI, NHS_SELF_HELP],
  },
  {
    slug: 'cognitive-distortions',
    category: 'thinking-patterns',
    name_en: 'Cognitive Distortions',
    name_ar: 'التشوهات المعرفية',
    body_en:
      "Cognitive distortions are habitual thinking shortcuts that bend evidence: all-or-nothing ('one mistake = total failure'), catastrophizing (jumping to the worst outcome), mind-reading ('they think I'm useless'), overgeneralization ('this always happens to me'), should-statements, personalization (owning things outside your control), mental filter (only the negative registers), emotional reasoning ('I feel it, so it's true'), labeling ('I'm a loser' instead of 'I made a mistake'), and discounting positives. Everyone runs these sometimes; they matter when they dominate. CBT's core tool is the thought record: catching the automatic thought and testing it against evidence like a fair judge, then writing the balanced version.",
    body_ar:
      'التشوهات المعرفية اختصارات تفكير متعودين عليها بتلوي الحقايق: الكل-أو-لا-شيء ("غلطة واحدة يعني فشل كامل")، التهويل (تقفز لأسوأ سيناريو)، قراءة الأفكار ("أكيد شايفني فاشل")، التعميم ("ده دايمًا بيحصلي")، جُمل "المفروض"، الشخصنة (تشيل حاجات مش في إيدك)، الفلتر السلبي (السلبي بس اللي بيتسجل)، الاستدلال العاطفي ("حاسس كده يبقى ده الحقيقي")، اللزق ("أنا فاشل" بدل "أنا غلطت")، وتصفير الإيجابيات. كلنا بنعمل كده أحيانًا؛ المشكلة لما يبقى ده الأساس. أداة الـ CBT الأساسية هي سجل الأفكار: تمسك الفكرة التلقائية وتحاكمها بالدليل زي قاضي عادل، وبعدين تكتب النسخة المتوازنة.',
    techniques: {
      techniques: [
        {
          name_en: 'Thought record',
          name_ar: 'سجل الأفكار',
          how_en: 'Five columns: situation → automatic thought → evidence for → evidence against → balanced thought. Do it in writing; doing it in your head is how the distortion wins.',
          how_ar: 'خمس خانات: الموقف → الفكرة التلقائية → الدليل معاها → الدليل ضدها → الفكرة المتوازنة. اكتبها بجد — لما بتعملها في دماغك بس، التشوه هو اللي بيكسب.',
        },
        {
          name_en: 'Name the distortion',
          name_ar: 'سمّي التشوه',
          how_en: "Just labeling it ('that's catastrophizing') creates distance between you and the thought. A named pattern is a pattern, not a fact.",
          how_ar: 'مجرد ما تسميه ("ده تهويل") بتبقى في مسافة بينك وبين الفكرة. النمط اللي له اسم بيبقى نمط — مش حقيقة.',
        },
      ],
    },
    refer_when_en: 'If distorted thoughts dominate your mood most days, structured CBT with a professional is the gold standard.',
    refer_when_ar: 'لو الأفكار دي مسيطرة على مزاجك أغلب الأيام، جلسات CBT منظمة مع مختص هي أفضل حل معروف.',
    sources: [CCI, NHS_SELF_HELP, NIMH],
  },
  {
    slug: 'burnout',
    category: 'work',
    name_en: 'Burnout',
    name_ar: 'الاحتراق الوظيفي',
    body_en:
      "Burnout, in Maslach's research, has three dimensions: exhaustion that rest doesn't fix, cynicism or detachment from work you used to care about, and a sinking sense of reduced efficacy. It builds from a sustained mismatch between demands and resources — not from weakness — and one long weekend does not fix it. What helps is structural: real recovery windows (daily, weekly), an honest audit of which demands are fixed versus negotiable, and boundary scripts for the negotiable ones. Physical symptoms (sleep problems, frequent illness, chest tightness) are a sign the load has been high for too long.",
    body_ar:
      'الاحتراق الوظيفي — في أبحاث ماسلاك — ليه تلات أبعاد: إرهاق النوم مش بيصلحه، وبرود أو نفور من شغل كنت مهتم بيه، وإحساس متزايد إنك مش بتنجز. بيتبني من عدم توازن مستمر بين المطلوب منك والموارد اللي معاك — مش من ضعف فيك — وويك إند طويل واحد مش بيحله. اللي بيساعد حاجات هيكلية: فترات استشفاء حقيقية (يومية وأسبوعية)، جرد أمين لإيه من المطالب ثابت وإيه قابل للتفاوض، وجُمل جاهزة لحدودك في القابل للتفاوض. الأعراض الجسدية (مشاكل نوم، عيا متكرر، كتمة في الصدر) علامة إن الحمل عالي بقاله كتير.',
    techniques: {
      techniques: [
        {
          name_en: 'Recovery windows',
          name_ar: 'فترات استشفاء',
          how_en: 'Block non-negotiable daily recovery (30–60 min, screens off, no work talk) and one weekly half-day. Recovery is a scheduled item, not what happens if time is left over.',
          how_ar: 'احجز وقت استشفاء يومي مش قابل للنقاش (٣٠–٦٠ دقيقة، من غير شاشات ولا كلام شغل) ونص يوم أسبوعيًا. الاستشفاء بند في الجدول — مش اللي بيحصل لو فضل وقت.',
        },
        {
          name_en: 'Demand–control audit',
          name_ar: 'جرد المطالب والتحكم',
          how_en: "List every recurring demand. Mark each: can I drop it, shrink it, delegate it, or is it truly fixed? Burnout shrinks when even 20% of the 'fixed' list turns out negotiable.",
          how_ar: 'اكتب كل المطالب المتكررة عليك. علّم على كل واحدة: أقدر ألغيها، أصغّرها، أفوّضها، ولا هي ثابتة فعلًا؟ الاحتراق بيقل لما حتى ٢٠٪ من قايمة "الثابت" تطلع قابلة للتفاوض.',
        },
        {
          name_en: 'Boundary scripts',
          name_ar: 'جُمل الحدود الجاهزة',
          how_en: "Pre-write two sentences you can send under pressure: 'I can take this on X date, not before' / 'I can do A or B this week, not both — which matters more?'",
          how_ar: 'حضّر جملتين تبعتهم وانت تحت ضغط: "أقدر أستلم دي يوم كذا، مش قبلها" / "أقدر أعمل أ أو ب الأسبوع ده، مش الاتنين — أنهي أهم؟"',
        },
      ],
    },
    refer_when_en: 'If it persists beyond a month despite real changes, or physical symptoms appear, see a professional — and rule out medical causes for the fatigue.',
    refer_when_ar: 'لو استمر أكتر من شهر رغم تغييرات حقيقية، أو ظهرت أعراض جسدية، اتكلم مع مختص — واطمن طبيًا على سبب الإرهاق.',
    sources: [WHO_STRESS, NHS_SELF_HELP],
  },
  {
    slug: 'panic-cycle',
    category: 'anxiety',
    name_en: 'The Panic Cycle',
    name_ar: 'دايرة الهلع',
    body_en:
      "Panic runs on a loop: a body sensation (racing heart, tight chest, dizziness) → a catastrophic interpretation ('heart attack', 'I'm losing control') → adrenaline surge → the sensation intensifies → the interpretation feels confirmed. The sensations are real; the danger usually is not — adrenaline is uncomfortable, not harmful, and a panic wave typically peaks and passes within minutes. Breaking the cycle works at the interpretation step (relearning sensations as non-dangerous) and the physiology step (slow, paced breathing that tells the nervous system the emergency is over). Important: FIRST-TIME chest pain or unexplained physical symptoms deserve a medical check before anything else — rule the body out first.",
    body_ar:
      'الهلع بيشتغل في دايرة: إحساس جسدي (قلب بيدق بسرعة، كتمة، دوخة) → تفسير كارثي ("دي أزمة قلبية"، "بفقد السيطرة") → دفعة أدرينالين → الإحساس بيزيد → التفسير بيتأكد في دماغك. الأحاسيس حقيقية؛ الخطر غالبًا لأ — الأدرينالين مزعج بس مش مؤذي، وموجة الهلع عادة بتوصل لقمتها وتعدي في دقايق. كسر الدايرة بيشتغل عند خطوة التفسير (تتعلم من جديد إن الأحاسيس دي مش خطر) وخطوة الجسم (تنفس بطيء منظم بيقول للجهاز العصبي إن الطوارئ خلصت). مهم: أول مرة تحس بألم في الصدر أو عرض جسدي مش مفهوم — كشف طبي الأول قبل أي حاجة تانية.',
    techniques: {
      techniques: [
        {
          name_en: 'Paced breathing',
          name_ar: 'تنفس منظم',
          how_en: 'Breathe in 4 seconds, out 6 seconds, for 2–3 minutes. The longer exhale activates the calming branch of the nervous system. Practice when calm so it works under fire.',
          how_ar: 'شهيق ٤ ثواني، زفير ٦ ثواني، لمدة دقيقتين–تلاتة. الزفير الأطول بيشغّل جزء التهدئة في الجهاز العصبي. اتمرن عليه وانت هادي عشان يشتغل وقت الأزمة.',
        },
        {
          name_en: 'Reframe the sensation',
          name_ar: 'إعادة تفسير الإحساس',
          how_en: "One prepared sentence: 'This is adrenaline. It's uncomfortable, not dangerous, and it passes in minutes.' Repeating it during a wave weakens the catastrophic link over time.",
          how_ar: 'جملة جاهزة: "ده أدرينالين. مزعج بس مش خطر، وبيعدي في دقايق." تكرارها وقت الموجة بيضعّف الربط الكارثي مع الوقت.',
        },
        {
          name_en: '5-4-3-2-1 grounding',
          name_ar: 'تأريض ٥-٤-٣-٢-١',
          how_en: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. It pulls attention from internal sensations to the room.',
          how_ar: 'سمّي ٥ حاجات شايفها، ٤ تقدر تلمسها، ٣ سامعها، ٢ بتشمها، ١ بتدوقها. بيسحب الانتباه من جوة جسمك للأوضة اللي انت فيها.',
        },
      ],
    },
    refer_when_en: 'Recurrent attacks, or avoidance that is spreading (places, driving, being alone), respond very well to professional CBT — go early.',
    refer_when_ar: 'النوبات المتكررة، أو التجنب اللي بيكبر (أماكن، سواقة، إنك تبقى لوحدك)، بيستجيبوا كويس جدًا للعلاج المعرفي مع مختص — متستناش.',
    sources: [NHS_SELF_HELP, CCI, NIMH],
  },
  {
    slug: 'perfectionism-procrastination',
    category: 'work',
    name_en: 'The Perfectionism–Procrastination Loop',
    name_ar: 'حلقة الكمالية والتأجيل',
    body_en:
      "High standards → fear the output won't match them → delay starting → guilt and time pressure build → standards feel even harder to hit → more delay. The procrastination isn't laziness; it's avoidance of the feeling of producing something imperfect. The loop breaks at the 'start' step, not the 'standards' step: give yourself explicit permission to produce a deliberately bad first version, bound the work with a timer instead of a quality bar, and ship at 80% on things where 80% is genuinely enough (most things). Done teaches more than perfect-but-imaginary.",
    body_ar:
      'معايير عالية → خوف إن الناتج ميطلعش قدها → تأجيل البداية → ذنب وضغط وقت بيتراكموا → المعايير بقت أصعب → تأجيل أكتر. التأجيل هنا مش كسل؛ ده هروب من إحساس إنك تطلّع حاجة مش كاملة. الحلقة بتتكسر عند خطوة "البداية" مش خطوة "المعايير": ادّي لنفسك إذن صريح تعمل مسودة أولى وحشة بقصد («شخبطة أولى»)، حدد الشغل بتايمر بدل سقف الجودة، وسلّم عند ٨٠٪ في الحاجات اللي ٨٠٪ فيها كفاية فعلًا (وهي أغلب الحاجات). "خلصانة" بتعلمك أكتر من "مثالية بس في الخيال".',
    techniques: {
      techniques: [
        {
          name_en: 'Deliberately-bad first draft',
          name_ar: 'الشخبطة الأولى',
          how_en: "Open the file with the goal of writing a BAD version — 20 minutes, no deleting. You can't edit a blank page, and the bad version is usually 60% usable.",
          how_ar: 'افتح الملف وهدفك تعمل نسخة وحشة — ٢٠ دقيقة من غير مسح. مفيش حد يقدر يعدّل على صفحة فاضية، والنسخة الوحشة غالبًا ٦٠٪ منها بينفع.',
        },
        {
          name_en: 'Timeboxing',
          name_ar: 'صندوق الوقت',
          how_en: "Replace 'until it's good' with 'for 45 minutes'. When the timer ends, stop and assess. Time limits force decisions that quality bars postpone.",
          how_ar: 'بدّل "لحد ما تبقى كويسة" بـ "٤٥ دقيقة". لما التايمر يخلص، اقف وقيّم. حدود الوقت بتفرض قرارات سقف الجودة بيأجلها.',
        },
        {
          name_en: '80% shipping rule',
          name_ar: 'قاعدة تسليم الـ٨٠٪',
          how_en: "Before starting, decide what 80% looks like and commit to shipping it. Reserve 100% effort for the rare things that truly warrant it — name them explicitly.",
          how_ar: 'قبل ما تبدأ، حدد شكل الـ٨٠٪ والتزم تسلمها. خلّي جهد الـ١٠٠٪ للحاجات النادرة اللي فعلًا تستاهله — وسمّيها بالاسم.',
        },
      ],
    },
    refer_when_en: 'If the paralysis is affecting income or study outcomes despite trying these tools, structured help is worth it.',
    refer_when_ar: 'لو الشلل ده بقى بيأثر على دخلك أو مذاكرتك رغم إنك جربت الأدوات دي، المساعدة المنظمة تستاهل.',
    sources: [CCI, NHS_SELF_HELP],
  },
  {
    slug: 'imposter-phenomenon',
    category: 'self-worth',
    name_en: 'Imposter Phenomenon',
    name_ar: 'متلازمة المحتال',
    body_en:
      "The imposter phenomenon is attributing your successes to luck, timing, or fooling people — while fearing you'll be 'exposed' as less capable than you appear. It's strikingly common in high performers, and it survives contrary evidence because wins get discounted ('anyone could have done it') while stumbles get weaponized. Two reframes help: keep an evidence log so achievements are recorded before the discounting reflex kicks in, and redefine competence as learning speed rather than already-knowing — by that definition, feeling out of your depth while improving IS competence, not fraud.",
    body_ar:
      'متلازمة المحتال إنك تنسب نجاحك للحظ أو التوقيت أو "ضحكت عليهم" — مع خوف مستمر إنهم "يكتشفوك". منتشرة بشكل ملحوظ عند الناس الشاطرة تحديدًا، وبتعيش رغم الأدلة العكسية لأن المكاسب بتتصفّر ("أي حد كان هيعملها") والتعثرات بتتضخم. في إعادتين للصياغة بيساعدوا: سجل أدلة بتكتب فيه الإنجاز قبل ما منعكس التصفير يشتغل، وإعادة تعريف الكفاءة إنها سرعة تعلم مش معرفة مسبقة — وبالتعريف ده، إحساسك إنك أقل من الموقف وانت بتتحسن هو نفسه الكفاءة، مش الاحتيال.',
    techniques: {
      techniques: [
        {
          name_en: 'Evidence log',
          name_ar: 'سجل الأدلة',
          how_en: "A running note of wins with one line each: what happened, what YOU did that caused it. Review before evaluations. Facts written at the time resist rewriting later.",
          how_ar: 'ملف مفتوح تكتب فيه كل مكسب في سطر: إيه اللي حصل، وإيه اللي انت عملته وخلاه يحصل. راجعه قبل أي تقييم. الحقايق المكتوبة وقتها صعب تتلوي بعدين.',
        },
        {
          name_en: 'Competence = learning speed',
          name_ar: 'الكفاءة = سرعة التعلم',
          how_en: "When 'I don't belong here' appears, ask instead: 'Am I learning at a reasonable pace for someone new to this?' That is the only fair bar for new territory.",
          how_ar: 'لما فكرة "أنا مش قد المكان ده" تظهر، اسأل بدلها: "أنا بتعلم بسرعة معقولة بالنسبة لحد جديد على ده؟" ده المعيار العادل الوحيد لأي أرض جديدة.',
        },
      ],
    },
    refer_when_en: 'If anxiety stays chronic despite a solid track record and these reframes, a professional can dig into where the discounting habit started.',
    refer_when_ar: 'لو القلق فضل مزمن رغم سجل إنجازات حقيقي ورغم المحاولات دي، مختص يقدر يوصل لجذر عادة التصفير دي.',
    sources: [CCI, NIMH],
  },
  {
    slug: 'sleep-hygiene',
    category: 'sleep',
    name_en: 'Sleep Hygiene',
    name_ar: 'نظافة النوم',
    body_en:
      "Sleep runs on two systems: sleep pressure (builds with hours awake) and the body clock (anchored mostly by wake time and light). Most self-inflicted insomnia fights one of the two — irregular wake times, late caffeine (it has a 5–6 hour half-life), bright screens before bed, or lying awake in bed teaching your brain that bed = worrying. The highest-leverage habits: a fixed wake time even after a bad night, a caffeine curfew ~8 hours before bed, a wind-down window without work or bright screens, and stimulus control — bed is for sleep; if you're awake 20+ minutes, get up and do something boring until sleepy.",
    body_ar:
      'النوم شغال على نظامين: ضغط النوم (بيتبني بساعات الصحيان) والساعة البيولوجية (مربوطة أساسًا بميعاد الصحيان والضوء). أغلب الأرق اللي بنعمله في نفسنا بيحارب واحد من الاتنين — مواعيد صحيان متقلبة، كافيين متأخر (نص عمره في الجسم ٥–٦ ساعات)، شاشات ساطعة قبل النوم، أو إنك تفضل صاحي في السرير فتعلّم دماغك إن السرير = قلق. العادات الأعلى تأثيرًا: ميعاد صحيان ثابت حتى بعد ليلة وحشة، آخر كافيين قبل النوم بـ٨ ساعات تقريبًا، فترة تهدئة من غير شغل ولا شاشات ساطعة، والتحكم في المثير — السرير للنوم؛ لو فضلت صاحي ٢٠ دقيقة، قوم اعمل حاجة مملة لحد ما النعس ييجي.',
    techniques: {
      techniques: [
        {
          name_en: 'Fixed wake time',
          name_ar: 'ميعاد صحيان ثابت',
          how_en: 'Same wake time 7 days a week, alarm across the room. It anchors the body clock; bedtime follows naturally within two weeks.',
          how_ar: 'نفس ميعاد الصحيان ٧ أيام في الأسبوع، والمنبه بعيد عن السرير. ده بيثبّت الساعة البيولوجية؛ ميعاد النوم بيظبط لوحده خلال أسبوعين.',
        },
        {
          name_en: 'Stimulus control',
          name_ar: 'التحكم في المثير',
          how_en: "Bed only for sleep. Awake 20+ minutes? Leave the bed, dim light, boring activity, return when sleepy. You're retraining the bed–sleep association.",
          how_ar: 'السرير للنوم بس. صاحي أكتر من ٢٠ دقيقة؟ اطلع من السرير، نور خافت، نشاط ممل، وارجع لما تنعس. انت بتعيد تدريب دماغك على إن السرير = نوم.',
        },
        {
          name_en: 'Pre-bed worry journal',
          name_ar: 'كراسة هموم قبل النوم',
          how_en: "10 minutes, 2+ hours before bed: dump tomorrow's worries and the first step for each. Worries with a written next step stop knocking at 2am.",
          how_ar: '١٠ دقايق، قبل النوم بساعتين على الأقل: فضّي هموم بكرة وأول خطوة لكل واحد. الهم اللي له خطوة مكتوبة بيبطّل يخبط عليك الساعة ٢ بالليل.',
        },
      ],
    },
    refer_when_en: 'Chronic insomnia beyond a month — or loud snoring with daytime exhaustion — deserves a medical/professional check (CBT-I is the first-line treatment).',
    refer_when_ar: 'أرق مزمن أكتر من شهر — أو شخير عالي مع إرهاق نهاري — يستاهل كشف طبي/مختص (علاج الأرق المعرفي CBT-I هو خط العلاج الأول).',
    sources: [NHS_SELF_HELP, CCI],
  },
  {
    slug: 'boundaries-assertiveness',
    category: 'relationships',
    name_en: 'Boundaries & Saying No',
    name_ar: 'الحدود وقول لأ',
    body_en:
      "There are three broad response styles: passive (their needs win, resentment builds), aggressive (your needs win, relationships pay), and assertive (both parties' needs are stated plainly and negotiated). Assertiveness is a skill, not a personality trait — it improves with scripts and practice. A reliable formula: name the situation factually → state your limit or need in one sentence → offer what you CAN do. And a key piece of psychoeducation: guilt after saying no is normal and temporary. It is the withdrawal symptom of an old habit, not evidence you did something wrong.",
    body_ar:
      'في تلات أساليب رد أساسية: السلبي (احتياجهم يكسب، والقهر يتراكم جواك)، والعدواني (احتياجك يكسب، والعلاقات تدفع التمن)، والحازم (احتياج الطرفين يتقال بوضوح ويتفاوض عليه). الحزم مهارة مش طبع — بيتحسن بالجُمل الجاهزة والتمرين. معادلة بتنفع دايمًا: سمّي الموقف بحيادية → قول حدك أو احتياجك في جملة واحدة → اعرض اللي تقدر تعمله فعلًا. ومعلومة نفسية مهمة: الذنب بعد "لأ" طبيعي ومؤقت. ده عرَض انسحاب من عادة قديمة — مش دليل إنك غلطت.',
    techniques: {
      techniques: [
        {
          name_en: 'Three-part assertion',
          name_ar: 'جملة الحزم التلاتية',
          how_en: "'When X happens (fact) → I can't do Y / I need Z (limit) → what I can do is W (offer).' Write it before the conversation, not during.",
          how_ar: '"لما بيحصل كذا (حقيقة) → أنا مش هقدر أعمل كذا / محتاج كذا (حد) → اللي أقدر عليه هو كذا (عرض)." اكتبها قبل المكالمة مش وانت فيها.',
        },
        {
          name_en: 'The delayed no',
          name_ar: 'اللأ المؤجلة',
          how_en: "If an instant no is too hard, buy time: 'Let me check and get back to you tomorrow.' A no after reflection is easier to deliver and easier to respect.",
          how_ar: 'لو "لأ" الفورية صعبة، اكسب وقت: "خليني أشوف وأرد عليك بكرة." اللأ بعد تفكير أسهل تتقال وأسهل تتحترم.',
        },
        {
          name_en: 'Guilt surfing',
          name_ar: 'ركوب موجة الذنب',
          how_en: "After a healthy no, expect the guilt wave and let it pass WITHOUT undoing the no. Each ride shortens the next wave.",
          how_ar: 'بعد أي "لأ" صحية، استنى موجة الذنب وخليها تعدي من غير ما تلغي اللأ. كل موجة بتعديها بتقصّر اللي بعدها.',
        },
      ],
    },
    refer_when_en: 'If a relationship punishes every boundary or the pattern involves exploitation causing real harm, bring in professional support.',
    refer_when_ar: 'لو في علاقة بتعاقبك على أي حد بتحطه، أو في استغلال بيسبب ضرر حقيقي، دي حاجة تتكلم فيها مع مختص.',
    sources: [CCI, WHO_STRESS],
  },
  {
    slug: 'grief-basics',
    category: 'loss',
    name_en: 'Grief Basics',
    name_ar: 'الفقد والحزن',
    body_en:
      "Grief does not move through tidy stages; it comes in waves — ambush moments, better days that feel like betrayal, anger, numbness, longing, sometimes relief that then triggers guilt. All of it is within the normal range, and there is no timetable. What research consistently supports: telling the story of the person and the loss (to people, on paper) helps the mind integrate it; rituals — personal or religious — give the pain a shape and a time; and oscillating is healthy: switching between grieving and living is how humans cope, not avoidance. Grief is not a problem to fix. It's love with nowhere to go, learning a new route.",
    body_ar:
      'الحزن مش بيمشي في مراحل مرتبة؛ بييجي موجات — لحظات بتخطفك، أيام أحسن بتحس فيها كأنك بتخون، غضب، تنميل، اشتياق، وساعات راحة بتجيب وراها ذنب. ده كله في النطاق الطبيعي، ومفيش جدول زمني للحزن. اللي الأبحاث بتدعمه باستمرار: إنك تحكي حكاية الشخص والفقد (للناس أو على ورق) بيساعد العقل يستوعبها؛ والطقوس — الشخصية أو الدينية — بتدي للوجع شكل ووقت؛ والتأرجح صحي: التنقل بين الحزن والحياة هو طريقة البشر في التحمل، مش هروب. الحزن مش مشكلة ليها حل. ده حب مبقاش لاقي طريقه، وبيتعلم طريق جديد.',
    techniques: {
      techniques: [
        {
          name_en: 'Tell the story',
          name_ar: 'احكي الحكاية',
          how_en: 'With someone safe, or in writing: who they were, what happened, what you miss. Repetition is not wallowing — it is how the mind stitches the loss into life.',
          how_ar: 'مع حد أمين، أو كتابة: مين كان، إيه اللي حصل، بتوحشك فيه إيه. التكرار مش غرق في الحزن — دي طريقة العقل عشان يخيّط الفقد جوة الحياة.',
        },
        {
          name_en: 'Ritual anchor',
          name_ar: 'مرساة الطقوس',
          how_en: 'A small recurring ritual — a visit, a prayer, lighting something, cooking their dish on a set day — gives grief a container so it floods the rest of the week less.',
          how_ar: 'طقس صغير متكرر — زيارة، دعاء، إشعال شمعة، طبخ أكلته في يوم محدد — بيدي للحزن وعاء، فبيغرق باقي الأسبوع أقل.',
        },
        {
          name_en: 'Oscillation permission',
          name_ar: 'إذن التأرجح',
          how_en: "Explicitly allow both modes: hours for the loss, hours for life (work, friends, laughter). Laughing on a hard week is not disloyalty; it's how grieving is survivable.",
          how_ar: 'اسمح لنفسك بالوضعين: ساعات للفقد، وساعات للحياة (شغل، صحاب، ضحك). الضحك في أسبوع صعب مش خيانة؛ ده اللي بيخلي الحزن يتشال.',
        },
      ],
    },
    refer_when_en: 'If functioning stays frozen for months — can’t work, can’t care for yourself, no moments of relief — grief-focused professional support helps.',
    refer_when_ar: 'لو الحياة واقفة بقالها شهور — مش قادر تشتغل ولا تاخد بالك من نفسك ومفيش أي لحظات تنفيس — الدعم المتخصص في الفقد بيساعد.',
    sources: [WHO_STRESS, NHS_SELF_HELP],
  },
];
