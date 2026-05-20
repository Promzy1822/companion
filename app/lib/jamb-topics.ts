// Real JAMB UTME topics — based on official scheme of work
// Used by study plan generator and practice sessions

export interface JAMBTopic {
  topic: string;
  subtopics: string[];
  difficulty: 'foundation' | 'medium' | 'advanced';
  weight: number; // 1-5, higher = more likely in exams
}

export const JAMB_TOPICS: Record<string, JAMBTopic[]> = {
  "Mathematics": [
    { topic:"Number & Numeration", subtopics:["Surds & Indices","Logarithms","Fractions & Decimals","Number Bases","Sets Theory"], difficulty:"foundation", weight:5 },
    { topic:"Polynomials & Equations", subtopics:["Quadratic Equations","Simultaneous Equations","Polynomial Division","Remainder & Factor Theorem"], difficulty:"medium", weight:5 },
    { topic:"Inequalities & Linear Programming", subtopics:["Solving Inequalities","Graphical Method","Feasible Region"], difficulty:"medium", weight:3 },
    { topic:"Sequences & Series", subtopics:["Arithmetic Progression","Geometric Progression","Sum to Infinity","Binomial Theorem"], difficulty:"medium", weight:4 },
    { topic:"Matrices & Determinants", subtopics:["Matrix Operations","Inverse of a Matrix","Solving Equations with Matrices"], difficulty:"medium", weight:3 },
    { topic:"Coordinate Geometry", subtopics:["Straight Lines","Circle Equation","Distance & Midpoint","Gradient & Intercepts"], difficulty:"medium", weight:4 },
    { topic:"Trigonometry", subtopics:["SOHCAHTOA","Sine & Cosine Rules","Bearings","Angles of Elevation & Depression","Trigonometric Identities"], difficulty:"medium", weight:5 },
    { topic:"Differentiation", subtopics:["First Principles","Product & Quotient Rules","Chain Rule","Maxima & Minima"], difficulty:"advanced", weight:4 },
    { topic:"Integration", subtopics:["Indefinite Integrals","Definite Integrals","Area Under Curve","Integration by Substitution"], difficulty:"advanced", weight:3 },
    { topic:"Statistics & Probability", subtopics:["Mean, Median, Mode","Frequency Distribution","Standard Deviation","Probability Trees","Permutations & Combinations"], difficulty:"medium", weight:5 },
    { topic:"Mensuration", subtopics:["Areas of Plane Figures","Surface Area of Solids","Volume of Solids","Sectors & Segments"], difficulty:"foundation", weight:4 },
    { topic:"Variation & Proportion", subtopics:["Direct Variation","Inverse Variation","Joint Variation","Partial Variation"], difficulty:"foundation", weight:3 },
  ],
  "English Language": [
    { topic:"Comprehension Passages", subtopics:["Inferential Questions","Vocabulary in Context","Author's Purpose & Attitude","Summary Skills"], difficulty:"medium", weight:5 },
    { topic:"Lexis & Structure", subtopics:["Word Classes (Parts of Speech)","Sentence Construction","Idiomatic Expressions","Figurative Language","Concord/Agreement"], difficulty:"foundation", weight:5 },
    { topic:"Oral English (Phonology)", subtopics:["Vowel Sounds (Pure & Diphthongs)","Consonant Sounds","Stress Patterns","Intonation","Silent Letters"], difficulty:"medium", weight:5 },
    { topic:"Register & Usage", subtopics:["Formal vs Informal English","Technical Language","Contextual Usage","Synonyms & Antonyms"], difficulty:"foundation", weight:4 },
    { topic:"Sentence & Clause Analysis", subtopics:["Types of Clauses","Phrases","Transformation of Sentences","Voice (Active/Passive)","Direct & Indirect Speech"], difficulty:"medium", weight:5 },
    { topic:"Tenses & Verb Forms", subtopics:["Present Tenses","Past Tenses","Future Forms","Conditional Sentences","Modal Verbs"], difficulty:"foundation", weight:4 },
    { topic:"Essay & Continuous Writing", subtopics:["Narrative Essay","Descriptive Essay","Argumentative Essay","Letter Writing (Formal/Informal)","Report Writing"], difficulty:"advanced", weight:3 },
  ],
  "Physics": [
    { topic:"Measurements & Units", subtopics:["SI Units","Significant Figures","Vectors & Scalars","Error Analysis"], difficulty:"foundation", weight:4 },
    { topic:"Kinematics & Dynamics", subtopics:["SUVAT Equations","Projectile Motion","Newton's Laws","Momentum & Impulse","Circular Motion"], difficulty:"medium", weight:5 },
    { topic:"Work, Energy & Power", subtopics:["Work-Energy Theorem","Conservation of Energy","Kinetic & Potential Energy","Power","Simple Machines"], difficulty:"medium", weight:5 },
    { topic:"Waves & Oscillations", subtopics:["Wave Properties","Sound Waves","Resonance","Doppler Effect","Stationary Waves"], difficulty:"medium", weight:4 },
    { topic:"Optics & Light", subtopics:["Laws of Reflection","Refraction & Snell's Law","Lenses (Converging/Diverging)","Optical Instruments","Dispersion"], difficulty:"medium", weight:4 },
    { topic:"Heat & Thermodynamics", subtopics:["Temperature Scales","Heat Transfer","Specific Heat Capacity","Latent Heat","Gas Laws (Boyle's, Charles's, Combined)"], difficulty:"foundation", weight:5 },
    { topic:"Electricity & Circuits", subtopics:["Ohm's Law","Series & Parallel Circuits","Resistivity","Capacitors","Electromotive Force (EMF)"], difficulty:"advanced", weight:5 },
    { topic:"Electromagnetic Induction", subtopics:["Faraday's Law","Lenz's Law","Transformers","AC & DC Generators","Motors"], difficulty:"advanced", weight:3 },
    { topic:"Atomic & Nuclear Physics", subtopics:["Atomic Models","Radioactivity (Alpha, Beta, Gamma)","Half-Life","Nuclear Fission & Fusion","Photoelectric Effect"], difficulty:"advanced", weight:4 },
    { topic:"Magnetism", subtopics:["Magnetic Fields","Force on Conductors","Electromagnetic Spectrum","Earth's Magnetic Field"], difficulty:"medium", weight:3 },
  ],
  "Chemistry": [
    { topic:"Atomic Structure & Bonding", subtopics:["Sub-atomic Particles","Electronic Configuration","Ionic Bonding","Covalent Bonding","Metallic Bonding","Hybridization (sp, sp², sp³)"], difficulty:"foundation", weight:5 },
    { topic:"States of Matter", subtopics:["Gas Laws (Boyle's, Charles's, Ideal Gas)","Kinetic Theory","Properties of Solids, Liquids, Gases","Mole Concept"], difficulty:"foundation", weight:5 },
    { topic:"Periodic Table & Trends", subtopics:["Periods & Groups","Atomic Radius Trends","Ionization Energy","Electronegativity","Group Properties (1, 2, 7, Noble Gases)"], difficulty:"medium", weight:4 },
    { topic:"Acids, Bases & Salts", subtopics:["pH Scale","Arrhenius, Brønsted-Lowry Theory","Neutralization","Types of Salts","Titration Calculations"], difficulty:"medium", weight:5 },
    { topic:"Redox & Electrochemistry", subtopics:["Oxidation & Reduction","Balancing Redox Equations","Electrolysis","Electrochemical Series","Corrosion"], difficulty:"medium", weight:4 },
    { topic:"Organic Chemistry", subtopics:["Homologous Series (Alkanes, Alkenes, Alkynes)","Functional Groups","Isomerism","Substitution & Addition Reactions","Polymers","Fermentation"], difficulty:"advanced", weight:5 },
    { topic:"Chemical Kinetics & Equilibrium", subtopics:["Rate of Reaction Factors","Le Chatelier's Principle","Haber Process","Contact Process","Equilibrium Constants"], difficulty:"advanced", weight:3 },
    { topic:"Energy in Chemical Reactions", subtopics:["Exothermic & Endothermic Reactions","Enthalpy Changes","Bond Energy","Hess's Law"], difficulty:"medium", weight:3 },
    { topic:"Metals & Non-Metals", subtopics:["Extraction of Metals","Reactivity Series","Properties of Transition Metals","Alloys","Nitrogen & Oxygen Chemistry"], difficulty:"medium", weight:4 },
  ],
  "Biology": [
    { topic:"Cell Biology", subtopics:["Cell Structure & Organelles","Prokaryotic vs Eukaryotic","Cell Division (Mitosis & Meiosis)","Osmosis, Diffusion, Active Transport"], difficulty:"foundation", weight:5 },
    { topic:"Nutrition & Digestion", subtopics:["Classes of Food","Digestive Enzymes","Digestion in Humans","Photosynthesis (Light & Dark Reactions)","Mineral Nutrition in Plants"], difficulty:"foundation", weight:5 },
    { topic:"Transport Systems", subtopics:["Blood Composition & Functions","Heart Structure & Double Circulation","Blood Groups (ABO & Rhesus)","Transpiration in Plants","Xylem & Phloem"], difficulty:"medium", weight:5 },
    { topic:"Excretion & Homeostasis", subtopics:["Kidney Structure & Nephron","Osmoregulation","Temperature Regulation","Excretion in Plants"], difficulty:"medium", weight:4 },
    { topic:"Reproduction", subtopics:["Asexual Reproduction","Human Reproductive System","Fertilization & Development","Plant Reproduction (Pollination, Fertilization)","Contraception"], difficulty:"medium", weight:4 },
    { topic:"Genetics & Heredity", subtopics:["Mendelian Genetics (Monohybrid, Dihybrid)","DNA Structure & Replication","Protein Synthesis (Transcription, Translation)","Mutations","Genetic Diseases","Sex-linked Traits"], difficulty:"advanced", weight:5 },
    { topic:"Evolution & Classification", subtopics:["Darwin's Theory of Natural Selection","Evidence for Evolution","Taxonomy (Kingdom to Species)","Adaptation"], difficulty:"medium", weight:3 },
    { topic:"Ecology", subtopics:["Food Chains & Webs","Energy Flow","Carbon & Nitrogen Cycles","Population Dynamics","Conservation & Biodiversity"], difficulty:"medium", weight:4 },
    { topic:"Nervous & Hormonal Systems", subtopics:["Neurone Structure","Reflex Arc","Sense Organs","Hormones & Their Functions","Homeostasis"], difficulty:"advanced", weight:4 },
  ],
  "Government": [
    { topic:"Political Concepts", subtopics:["Democracy","Sovereignty","Separation of Powers","Rule of Law","Citizenship","Legitimacy & Authority"], difficulty:"foundation", weight:5 },
    { topic:"Federalism", subtopics:["Features of Federalism","Fiscal Federalism","Concurrent & Exclusive Lists","Revenue Allocation in Nigeria"], difficulty:"medium", weight:5 },
    { topic:"Nigerian Government Structure", subtopics:["Executive (President, Governors, LGA Chairmen)","Legislature (Senate, House of Reps)","Judiciary (Courts)","1999 Constitution","INEC"], difficulty:"foundation", weight:5 },
    { topic:"Nigerian Political History", subtopics:["Pre-colonial Political Systems","Colonial Rule (1900-1960)","Independence & First Republic","Military Coups","Second to Fourth Republics"], difficulty:"medium", weight:5 },
    { topic:"Electoral Systems", subtopics:["Types of Elections","Electoral Systems (PR, FPTP)","Political Parties in Nigeria","Party Manifestoes","Electoral Process"], difficulty:"medium", weight:4 },
    { topic:"International Relations", subtopics:["UN Structure & Functions","African Union (AU)","ECOWAS","Commonwealth","World Bank & IMF","Foreign Policy"], difficulty:"medium", weight:3 },
    { topic:"Public Administration", subtopics:["Civil Service","Bureaucracy","Pressure Groups","Public Corporations","Local Government Administration"], difficulty:"advanced", weight:3 },
  ],
  "Economics": [
    { topic:"Demand & Supply", subtopics:["Law of Demand","Law of Supply","Elasticity of Demand & Supply","Market Equilibrium","Price Mechanism"], difficulty:"foundation", weight:5 },
    { topic:"Market Structures", subtopics:["Perfect Competition","Monopoly","Oligopoly","Monopolistic Competition","Price Discrimination"], difficulty:"medium", weight:4 },
    { topic:"Production & Costs", subtopics:["Factors of Production","Law of Diminishing Returns","Short & Long Run Costs","Economies of Scale","Types of Costs (Fixed, Variable, Marginal)"], difficulty:"medium", weight:4 },
    { topic:"National Income Accounting", subtopics:["GDP, GNP, NNP","Methods of Calculation (Output, Income, Expenditure)","Business Cycle","Economic Growth & Development"], difficulty:"advanced", weight:4 },
    { topic:"Money, Banking & Finance", subtopics:["Functions & Characteristics of Money","Types of Money","Central Bank (CBN) Functions","Commercial Banks","Credit Creation"], difficulty:"medium", weight:5 },
    { topic:"Inflation & Unemployment", subtopics:["Types of Inflation","Causes & Effects","Anti-inflation Policies","Types of Unemployment","Full Employment"], difficulty:"medium", weight:4 },
    { topic:"International Trade", subtopics:["Absolute & Comparative Advantage","Balance of Trade & Payments","Exchange Rates","Trade Barriers","WTO & GATT"], difficulty:"advanced", weight:3 },
    { topic:"Public Finance", subtopics:["Government Revenue (Taxes, Non-tax)","Government Expenditure","National Budget","Public Debt","Fiscal Policy"], difficulty:"medium", weight:3 },
    { topic:"Economic Development", subtopics:["Developed vs Developing Economies","Agriculture in Nigeria","Industrialisation","Poverty & Inequality","ECOWAS Economic Integration"], difficulty:"medium", weight:3 },
  ],
};

/** Get all topics for a subject */
export function getSubjectTopics(subject: string): JAMBTopic[] {
  return JAMB_TOPICS[subject] ?? [];
}

/** Pick N topics for a subject, weighted by exam frequency */
export function pickTopics(subject: string, count: number): JAMBTopic[] {
  const all = getSubjectTopics(subject);
  if (!all.length) return [];

  // Build weighted pool
  const pool: JAMBTopic[] = [];
  all.forEach(t => { for (let i = 0; i < t.weight; i++) pool.push(t); });

  const picked: JAMBTopic[] = [];
  const used = new Set<string>();
  const attempts = count * 10;

  for (let i = 0; i < attempts && picked.length < count; i++) {
    const t = pool[Math.floor(Math.random() * pool.length)];
    if (!used.has(t.topic)) { picked.push(t); used.add(t.topic); }
  }
  return picked;
}

/** Build a study schedule for N weeks, distributing subjects intelligently */
export function buildScheduleTopics(
  subjects: string[],
  weeks: number,
  weakSubjects: string[] = []
): Array<{ subject: string; topic: string; subtopic: string; difficulty: string; hours: number }> {
  const result = [];

  // Distribute weak subjects more in early weeks
  for (let week = 1; week <= weeks; week++) {
    const isRevision = week >= weeks - 1;
    const isFoundation = week <= 2;
    const perWeek = Math.max(2, Math.ceil(subjects.length * 1.2));

    for (let i = 0; i < perWeek; i++) {
      // Prioritize weak subjects in first half
      let subject: string;
      if (weakSubjects.length && week <= Math.ceil(weeks / 2) && i < weakSubjects.length) {
        subject = weakSubjects[i % weakSubjects.length];
      } else {
        subject = subjects[(week * perWeek + i) % subjects.length];
      }

      const allTopics = getSubjectTopics(subject);
      if (!allTopics.length) continue;

      let pool: JAMBTopic[];
      if (isRevision) {
        pool = allTopics; // any topic for revision
      } else if (isFoundation) {
        pool = allTopics.filter(t => t.difficulty === 'foundation');
        if (!pool.length) pool = allTopics;
      } else {
        pool = allTopics.filter(t => t.difficulty !== 'foundation');
        if (!pool.length) pool = allTopics;
      }

      const topic = pool[Math.floor(Math.random() * pool.length)];
      const subtopic = topic.subtopics[
        Math.floor(Math.random() * topic.subtopics.length)
      ];

      result.push({
        subject,
        topic: topic.topic,
        subtopic,
        difficulty: topic.difficulty,
        hours: isRevision ? 1 : topic.difficulty === 'advanced' ? 3 : 2,
      });
    }
  }

  return result;
}
