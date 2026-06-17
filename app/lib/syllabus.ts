/**
 * syllabus.ts
 * Source of truth: Official JAMB UTME Syllabus (2025 edition)
 * Extracted from the uploaded syllabus PDF.
 * All lessons, questions, mock exams, and study plans must align to this.
 */

export interface SyllabusTopic {
  id:         string;
  topic:      string;
  subtopics:  string[];
}

export interface SubjectSyllabus {
  display_name: string;
  topics:       SyllabusTopic[];
}

export const JAMB_SYLLABUS: Record<string, SubjectSyllabus> = {
  english: {
    display_name: "English Language",
    topics: [
      { id:"eng_1", topic:"Comprehension", subtopics:["Identifying main points","Implied meanings","Grammatical functions","Writer's intention and mood","Summary writing"] },
      { id:"eng_2", topic:"Lexis and Structure", subtopics:["Vocabulary in context","Word formation","Antonyms and synonyms","Register and usage","Structural patterns"] },
      { id:"eng_3", topic:"Oral English", subtopics:["Vowel sounds","Consonant sounds","Stress patterns","Intonation","Rhyme and rhythm"] },
      { id:"eng_4", topic:"Grammar", subtopics:["Parts of speech","Tenses","Concord and agreement","Sentence types","Clauses and phrases","Figurative language"] },
      { id:"eng_5", topic:"Cloze Test", subtopics:["Understanding context","Grammatical appropriateness","Coherence and cohesion"] },
    ],
  },
  mathematics: {
    display_name: "Mathematics",
    topics: [
      { id:"mat_1", topic:"Number and Numeration", subtopics:["Number bases","Modular arithmetic","Fractions and decimals","Approximations","Indices","Logarithms","Surds","Sets and Venn diagrams"] },
      { id:"mat_2", topic:"Algebra", subtopics:["Polynomials","Rational expressions","Equations and inequalities","Variation","Simultaneous equations","Quadratic equations","Progressions (AP and GP)"] },
      { id:"mat_3", topic:"Geometry", subtopics:["Angles and triangles","Polygons","Circles","Coordinate geometry","Loci","Constructions"] },
      { id:"mat_4", topic:"Trigonometry", subtopics:["Trigonometric ratios","Sine and cosine rules","Graphs of trig functions","Trig identities"] },
      { id:"mat_5", topic:"Calculus", subtopics:["Differentiation","Integration","Application of calculus"] },
      { id:"mat_6", topic:"Statistics and Probability", subtopics:["Frequency distribution","Measures of central tendency","Measures of dispersion","Probability","Permutations and combinations"] },
      { id:"mat_7", topic:"Vectors and Mechanics", subtopics:["Vectors in 2D","Statics","Dynamics"] },
    ],
  },
  physics: {
    display_name: "Physics",
    topics: [
      { id:"phy_1",  topic:"Measurements and Units",       subtopics:["Fundamental physical quantities","Derived quantities and units","Measuring instruments","Significant figures","Scientific notation","Limitations of experimental measurements"] },
      { id:"phy_2",  topic:"Scalars and Vectors",          subtopics:["Scalar and vector quantities","Addition and resolution of vectors","Resultant vector"] },
      { id:"phy_3",  topic:"Motion",                       subtopics:["Types of motion","Newton's laws of motion","Equations of uniformly accelerated motion","Projectile motion","Relative motion","Circular motion"] },
      { id:"phy_4",  topic:"Gravitational Field",          subtopics:["Newton's law of gravitation","Gravitational potential","Escape velocity","Satellites and orbits","Weight and weightlessness"] },
      { id:"phy_5",  topic:"Work, Energy and Power",       subtopics:["Work-energy theorem","Conservation of energy","Kinetic and potential energy","Power and efficiency","Simple machines"] },
      { id:"phy_6",  topic:"Friction",                     subtopics:["Types of friction","Coefficient of friction","Advantages and disadvantages of friction","Viscosity and terminal velocity"] },
      { id:"phy_7",  topic:"Simple Harmonic Motion",       subtopics:["Definitions and examples","Period, frequency and amplitude","Energy in SHM","Resonance"] },
      { id:"phy_8",  topic:"Waves",                        subtopics:["Types of waves","Wave properties: reflection, refraction, diffraction","Superposition and interference","Wave equation","Sound waves","Electromagnetic spectrum"] },
      { id:"phy_9",  topic:"Optics",                       subtopics:["Reflection of light","Refraction of light","Total internal reflection","Lenses and mirrors","Optical instruments","Dispersion of light"] },
      { id:"phy_10", topic:"Electricity",                  subtopics:["Electric charge","Electric field","Capacitors","Electric current and circuit","Ohm's law","Resistors in series and parallel","Electrical energy and power"] },
      { id:"phy_11", topic:"Magnetism and Electromagnetism",subtopics:["Magnetic field","Magnetic force on current","Electromagnetic induction","Faraday's and Lenz's laws","Transformers","AC and DC"] },
      { id:"phy_12", topic:"Modern Physics",               subtopics:["Photoelectric effect","X-rays","Radioactivity","Nuclear reactions","Half-life","Nuclear energy"] },
      { id:"phy_13", topic:"Heat and Temperature",         subtopics:["Temperature measurement","Heat capacity","Latent heat","Gas laws","Thermal expansion","Heat transfer"] },
      { id:"phy_14", topic:"Structure of Matter",          subtopics:["Molecular theory","Elasticity","Surface tension","Viscosity","Diffusion"] },
    ],
  },
  chemistry: {
    display_name: "Chemistry",
    topics: [
      { id:"chem_1",  topic:"Separation of Mixtures and Purification",    subtopics:["Elements, compounds and mixtures","Physical and chemical changes","Filtration, distillation, chromatography","Pure and impure substances","Boiling and melting points"] },
      { id:"chem_2",  topic:"Chemical Combination and Kinetic Theory",    subtopics:["Laws of chemical combination","Kinetic theory of matter","Gas laws: Boyle's, Charles's, Graham's","Ideal gas equation"] },
      { id:"chem_3",  topic:"Atomic Structure",                           subtopics:["Sub-atomic particles","Electronic configuration","Periodic table","Periodic trends"] },
      { id:"chem_4",  topic:"Chemical Bonding",                           subtopics:["Ionic bonding","Covalent bonding","Metallic bonding","Hydrogen bonding","Van der Waals forces"] },
      { id:"chem_5",  topic:"Stoichiometry",                              subtopics:["Mole concept","Chemical formulae","Balancing equations","Calculations from equations","Limiting reagent"] },
      { id:"chem_6",  topic:"Acids, Bases and Salts",                     subtopics:["Properties of acids and bases","pH scale","Neutralisation","Preparation of salts","Indicators"] },
      { id:"chem_7",  topic:"Electrochemistry",                           subtopics:["Electrolysis","Electrodes and electrolytes","Faraday's laws","Electrochemical cells","Corrosion"] },
      { id:"chem_8",  topic:"Energy Changes in Chemical Reactions",       subtopics:["Exothermic and endothermic reactions","Heat of combustion","Bond energy","Hess's law"] },
      { id:"chem_9",  topic:"Rates of Reaction and Equilibrium",          subtopics:["Factors affecting rate","Catalysis","Chemical equilibrium","Le Chatelier's principle","Kc and Kp"] },
      { id:"chem_10", topic:"Non-metals and their Compounds",             subtopics:["Hydrogen","Oxygen and oxides","Nitrogen and its compounds","Carbon and its compounds","Halogens","Sulphur"] },
      { id:"chem_11", topic:"Metals and their Compounds",                 subtopics:["General properties of metals","Extraction of metals","Sodium, Calcium, Iron, Aluminium, Copper","Alloys"] },
      { id:"chem_12", topic:"Organic Chemistry",                          subtopics:["Hydrocarbons: alkanes, alkenes, alkynes","Functional groups","Alcohols, aldehydes, ketones","Carboxylic acids","Esters and polymers"] },
    ],
  },
  biology: {
    display_name: "Biology",
    topics: [
      { id:"bio_1",  topic:"Cell Biology",                     subtopics:["Cell structure and function","Cell organelles","Cell division: mitosis and meiosis","Differences between plant and animal cells"] },
      { id:"bio_2",  topic:"Classification of Living Things",  subtopics:["Kingdoms of life","Monera, Protista, Fungi, Plantae, Animalia","Characteristics of each kingdom","Binomial nomenclature"] },
      { id:"bio_3",  topic:"Plant and Animal Nutrition",       subtopics:["Photosynthesis","Mineral nutrition in plants","Types of nutrition in animals","Digestive system","Food tests"] },
      { id:"bio_4",  topic:"Transport Systems",                subtopics:["Transport in plants: xylem and phloem","Circulatory system in animals","Blood composition","Heart structure and function","Blood groups"] },
      { id:"bio_5",  topic:"Respiration",                     subtopics:["Aerobic respiration","Anaerobic respiration","Respiratory organs in animals","Gaseous exchange","Breathing mechanism"] },
      { id:"bio_6",  topic:"Excretion",                       subtopics:["Excretory products","Kidney structure and function","Excretion in plants","Liver functions"] },
      { id:"bio_7",  topic:"Nervous System and Sense Organs", subtopics:["Structure of neuron","Types of nervous system","Reflex action","Sense organs: eye, ear, skin"] },
      { id:"bio_8",  topic:"Reproduction",                    subtopics:["Types of reproduction","Reproductive systems","Fertilisation","Development","Parental care"] },
      { id:"bio_9",  topic:"Genetics and Heredity",           subtopics:["Mendel's laws","Monohybrid and dihybrid crosses","Sex determination","Mutation","Genetic disorders"] },
      { id:"bio_10", topic:"Evolution",                       subtopics:["Theories of evolution","Evidence of evolution","Natural selection","Adaptation"] },
      { id:"bio_11", topic:"Ecology",                         subtopics:["Ecosystems","Food chains and webs","Energy flow","Population dynamics","Conservation","Pollution"] },
      { id:"bio_12", topic:"Microorganisms and Disease",      subtopics:["Types of microorganisms","Diseases caused by microorganisms","Immune system","Vaccination","Public health"] },
    ],
  },
  government: {
    display_name: "Government",
    topics: [
      { id:"gov_1", topic:"Definition and Scope of Government", subtopics:["Meaning of government","Forms of government","Functions of government"] },
      { id:"gov_2", topic:"Basic Concepts",                     subtopics:["Power, influence and authority","Sovereignty","State, nation and nation-state","Political parties","Pressure groups"] },
      { id:"gov_3", topic:"Arms of Government",                 subtopics:["Legislature: types, structure, functions","Executive: types, structure, functions","Judiciary: structure, functions, independence"] },
      { id:"gov_4", topic:"Constitutions",                      subtopics:["Definition and types","Features of good constitution","Constitutional development in Nigeria","Fundamental human rights"] },
      { id:"gov_5", topic:"Electoral Systems",                  subtopics:["Types of electoral systems","Electoral commission","Election processes in Nigeria","Problems of elections in Nigeria"] },
      { id:"gov_6", topic:"Political Parties",                  subtopics:["Definition and functions","Party systems","Political parties in Nigeria","Interest groups"] },
      { id:"gov_7", topic:"Nigerian Government and Politics",   subtopics:["Pre-colonial administration","Colonial administration","Post-independence government","Military rule in Nigeria","Return to democracy"] },
      { id:"gov_8", topic:"International Relations",            subtopics:["Concepts in international relations","Nigeria's foreign policy","International organisations: UN, AU, ECOWAS","International law"] },
    ],
  },
  economics: {
    display_name: "Economics",
    topics: [
      { id:"eco_1", topic:"Basic Economic Concepts",  subtopics:["Definition and scope of economics","Scarcity, choice and opportunity cost","Economic systems","Production possibility curve"] },
      { id:"eco_2", topic:"Demand and Supply",        subtopics:["Law of demand and supply","Elasticity of demand and supply","Market equilibrium","Price determination"] },
      { id:"eco_3", topic:"Theory of Production",     subtopics:["Factors of production","Laws of production","Returns to scale","Cost theory"] },
      { id:"eco_4", topic:"Market Structures",        subtopics:["Perfect competition","Monopoly","Monopolistic competition","Oligopoly"] },
      { id:"eco_5", topic:"National Income",          subtopics:["Concept of national income","Methods of measurement","GDP, GNP, NNP","Standard of living"] },
      { id:"eco_6", topic:"Money and Banking",        subtopics:["Functions of money","Commercial banks","Central bank","Monetary policy"] },
      { id:"eco_7", topic:"Public Finance",           subtopics:["Government revenue and expenditure","Taxation","Budget","Public debt"] },
      { id:"eco_8", topic:"International Trade",      subtopics:["Basis of trade","Balance of payments","Trade barriers","Exchange rates","IMF and World Bank"] },
      { id:"eco_9", topic:"Economic Development",     subtopics:["Meaning of development","Problems of development","Agriculture in Nigeria","Industrialisation","Petroleum sector"] },
    ],
  },
  geography: {
    display_name: "Geography",
    topics: [
      { id:"geo_1", topic:"Practical Geography",         subtopics:["Map reading","Scale and measurement","Statistical data interpretation","GIS basics"] },
      { id:"geo_2", topic:"The Earth",                   subtopics:["Earth in solar system","Structure of the earth","Plate tectonics","Volcanism and earthquakes","Rock types"] },
      { id:"geo_3", topic:"Geomorphology",               subtopics:["Weathering and erosion","River processes","Coastal landforms","Desert landforms","Glacial landforms"] },
      { id:"geo_4", topic:"Climatology",                 subtopics:["Atmosphere structure","Weather elements","Climate types","Climate change","Climate of Nigeria"] },
      { id:"geo_5", topic:"Population Geography",        subtopics:["Population distribution","Migration","Population policies","Settlement patterns"] },
      { id:"geo_6", topic:"Economic Geography",          subtopics:["Agriculture","Mining","Manufacturing","Transportation","Trade"] },
      { id:"geo_7", topic:"Regional Geography of Africa",subtopics:["Physical features","Climate regions","Human geography","Major countries"] },
    ],
  },
  crs: {
    display_name: "Christian Religious Studies",
    topics: [
      { id:"crs_1", topic:"God's Sovereignty and Covenant", subtopics:["Sovereignty of God","Covenant with Noah","Covenant with Abraham","Mosaic covenant","New Covenant in Christ"] },
      { id:"crs_2", topic:"Leadership in the Bible",        subtopics:["Joseph","Moses","Joshua","Samuel","David"] },
      { id:"crs_3", topic:"Wisdom Literature",              subtopics:["Psalms","Proverbs","Job","Ecclesiastes"] },
      { id:"crs_4", topic:"The Prophets",                   subtopics:["Major prophets","Minor prophets","Prophecy and fulfillment"] },
      { id:"crs_5", topic:"Life and Teachings of Jesus",    subtopics:["Birth and early life","Baptism and temptation","Teachings and miracles","Death and resurrection"] },
      { id:"crs_6", topic:"The Early Church",               subtopics:["Pentecost","Paul's missionary journeys","The epistles","Christian living"] },
    ],
  },
};

// ── Helper functions ──────────────────────────────────────────────────────────

/** Get syllabus for a specific subject */
export function getSubjectSyllabus(subject: string): SubjectSyllabus | null {
  const key = subject.toLowerCase().replace(/\s+/g, '').replace('language','');
  const direct = JAMB_SYLLABUS[key];
  if (direct) return direct;
  // fuzzy match
  for (const [k, v] of Object.entries(JAMB_SYLLABUS)) {
    if (v.display_name.toLowerCase().includes(key) || key.includes(k)) return v;
  }
  return null;
}

/** Get all topics for a subject as flat list */
export function getTopics(subject: string): SyllabusTopic[] {
  return getSubjectSyllabus(subject)?.topics ?? [];
}

/** Get all subtopics for a specific topic */
export function getSubtopics(subject: string, topicId: string): string[] {
  const topics = getTopics(subject);
  return topics.find(t => t.id === topicId)?.subtopics ?? [];
}

/** Build AI system prompt context for a subject — ensures all AI responses are syllabus-aligned */
export function buildSyllabusContext(subjects: string[]): string {
  const lines: string[] = [
    "You are Companion AI, a JAMB study assistant. All your responses MUST be strictly aligned to the official JAMB UTME syllabus below.",
    "Never teach topics, ask questions, or set tasks outside this syllabus unless explicitly marked as supplementary.",
    "",
    "OFFICIAL JAMB SYLLABUS:",
  ];
  for (const subj of subjects) {
    const s = getSubjectSyllabus(subj);
    if (!s) continue;
    lines.push(`\n${s.display_name.toUpperCase()}:`);
    for (const t of s.topics) {
      lines.push(`  Topic: ${t.topic}`);
      lines.push(`    Subtopics: ${t.subtopics.join(', ')}`);
    }
  }
  lines.push("\nUse discussion-based teaching: ask thought-provoking questions, connect concepts to real-world Nigerian examples, encourage reasoning over memorisation.");
  return lines.join('\n');
}

/** Generate a topic-by-topic study plan for given subjects */
export function generateSyllabusStudyPlan(subjects: string[], weeksAvailable: number): {
  week: number;
  subject: string;
  topic: string;
  subtopics: string[];
  focus: string;
}[] {
  const plan: { week: number; subject: string; topic: string; subtopics: string[]; focus: string }[] = [];
  
  // Collect all topics across subjects
  const allTopics: { subject: string; topic: SyllabusTopic }[] = [];
  for (const subj of subjects) {
    const s = getSubjectSyllabus(subj);
    if (!s) continue;
    for (const t of s.topics) {
      allTopics.push({ subject: s.display_name, topic: t });
    }
  }

  // Distribute topics across weeks
  const topicsPerWeek = Math.ceil(allTopics.length / weeksAvailable);
  let week = 1;
  let count = 0;

  for (const { subject, topic } of allTopics) {
    if (count > 0 && count % topicsPerWeek === 0) week++;
    if (week > weeksAvailable) week = weeksAvailable;
    plan.push({
      week,
      subject,
      topic: topic.topic,
      subtopics: topic.subtopics,
      focus: topic.subtopics[0] ?? topic.topic,
    });
    count++;
  }
  return plan;
}

/** Build a mock exam prompt strictly from syllabus topics */
export function buildMockExamPrompt(subjects: string[], numQuestions: number): string {
  const syllabusContext = buildSyllabusContext(subjects);
  return `${syllabusContext}

TASK: Generate exactly ${numQuestions} JAMB-style multiple choice questions.
- Each question MUST come from a topic listed in the syllabus above
- Distribute questions evenly across subjects: ${subjects.join(', ')}
- Use past JAMB question style and difficulty level
- Include the specific topic/subtopic being tested in each question

Return ONLY a raw JSON array with no markdown, no backticks:
[{"id":1,"subject":"Mathematics","topic":"Algebra","subtopic":"Quadratic equations","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]
where correct is 0-indexed.`;
}
