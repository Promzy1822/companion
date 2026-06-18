/**
 * syllabus.ts — Official JAMB UTME Syllabus Knowledge Base
 *
 * Source: Official JAMB UTME Syllabus (2025 edition)
 * Extracted from uploaded PDF — every subject, topic, subtopic,
 * objective and learning outcome preserved in full.
 *
 * This is the single source of truth for ALL educational content:
 * - AI chat system prompts
 * - Study plan generation
 * - Mock exam question generation
 * - Lesson recommendations
 * - Progress tracking
 * - Flashcard generation
 * - Quiz generation
 *
 * To update: replace the data below with new syllabus content.
 * No other application logic needs to change.
 */

export interface SyllabusTopic {
  id:         string;
  topic:      string;
  section?:   string;
  subtopics:  string[];
  objectives: string[];
  content_notes?: string;
  prerequisites?: string[];
  cross_subject_links?: string[];
}

export interface SubjectSyllabus {
  display_name:       string;
  code:               string;
  general_objectives: string[];
  sections?:          string[];
  topics:             SyllabusTopic[];
}

export const JAMB_SYLLABUS: Record<string, SubjectSyllabus> = {

  english: {
    display_name: "English Language",
    code: "ENG",
    general_objectives: [
      "Communicate effectively in both written and spoken English",
      "Use English Language for learning at the tertiary level"
    ],
    sections: [
      "Section A: Comprehension and Summary",
      "Section B: Lexis and Structure",
      "Section C: Oral Forms"
    ],
    topics: [
      {
        id: "eng_1",
        topic: "Comprehension and Summary",
        section: "Section A",
        subtopics: [
          "Description passages",
          "Narration passages",
          "Exposition passages",
          "Argumentation and persuasion passages",
          "Cloze test passage (one of three passages)",
          "Comprehension of whole or part of each passage",
          "Comprehension of words, phrases, clauses, sentences, figures of speech and idioms",
          "Coherence and logical reasoning: deductions and inferences",
          "Approved Reading Text",
          "Synthesis of ideas from passages"
        ],
        objectives: [
          "Identify main points and topic sentences in passages",
          "Determine implied meanings",
          "Identify grammatical functions of words, phrases, clauses and figurative/idiomatic expressions",
          "Deduce or infer the writer's intentions including mood, attitude and opinion",
          "Synthesise ideas from multiple passages"
        ],
        content_notes: "Three passages set (one cloze test), each about 200 words, reflecting various disciplines",
        cross_subject_links: ["eng_2", "eng_4"]
      },
      {
        id: "eng_2",
        topic: "Lexis and Structure",
        section: "Section B",
        subtopics: [
          "Vocabulary in context",
          "Antonyms and synonyms",
          "Sentence interpretation",
          "Affixes: prefixes and suffixes",
          "Collocations",
          "Idioms and phrasal verbs",
          "Register and appropriateness",
          "Structural patterns in sentences",
          "Word formation processes"
        ],
        objectives: [
          "Identify and use words appropriately in context",
          "Identify correct structural patterns in sentences",
          "Identify appropriate lexical and grammatical items",
          "Distinguish denotative from connotative meanings"
        ],
        cross_subject_links: ["eng_1", "eng_4"]
      },
      {
        id: "eng_3",
        topic: "Oral Forms",
        section: "Section C",
        subtopics: [
          "Vowels: monophthongs (pure vowels) — /iː/, /ɪ/, /e/, /æ/, /ɑː/, /ɒ/, /ɔː/, /ʊ/, /uː/, /ʌ/, /ɜː/, /ə/",
          "Diphthongs (gliding vowels) — /eɪ/, /aɪ/, /ɔɪ/, /əʊ/, /aʊ/, /ɪə/, /eə/, /ʊə/",
          "Consonants: voiced and voiceless — plosives, fricatives, affricates, nasals, laterals, approximants",
          "Syllable structure and word stress patterns",
          "Contrastive stress and sentence stress",
          "Intonation patterns: rising, falling, rise-fall, fall-rise",
          "Rhyme and rhythm in poetry",
          "Phonemic contrast and minimal pairs",
          "Assimilation and elision in connected speech"
        ],
        objectives: [
          "Recognise and reproduce the sounds of English correctly",
          "Identify vowels and consonants and their variants",
          "Interpret stress and intonation patterns correctly",
          "Identify rhyme and rhythm in poetry",
          "Distinguish between minimal pairs"
        ],
        cross_subject_links: ["lit_3"]
      },
      {
        id: "eng_4",
        topic: "Grammar and Usage",
        section: "Section B",
        subtopics: [
          "Parts of speech: nouns, pronouns, verbs, adjectives, adverbs, conjunctions, prepositions, interjections",
          "Tenses and time reference: simple, continuous, perfect, perfect continuous",
          "Concord / subject-verb agreement: person, number, collective nouns, indefinite pronouns",
          "Types of sentences: simple, compound, complex, compound-complex",
          "Noun clauses, adjective (relative) clauses, adverbial clauses",
          "Phrases: noun, verb, adjectival, adverbial, prepositional",
          "Figures of speech: simile, metaphor, personification, hyperbole, irony, sarcasm, oxymoron, euphemism, alliteration",
          "Punctuation: comma, semicolon, colon, apostrophe, quotation marks",
          "Direct and indirect speech",
          "Active and passive voice"
        ],
        objectives: [
          "Identify and use grammatical structures correctly",
          "Demonstrate understanding of concord rules",
          "Identify and interpret figures of speech",
          "Correctly punctuate sentences",
          "Convert between direct and indirect speech",
          "Transform active to passive and vice versa"
        ],
        cross_subject_links: ["eng_1", "eng_2"]
      }
    ]
  },

  physics: {
    display_name: "Physics",
    code: "PHY",
    general_objectives: [
      "Sustain interest in physics",
      "Develop attitudes encouraging accuracy, precision and objectivity",
      "Interpret physical phenomena, laws, definitions, concepts and theories",
      "Solve correctly physics problems using relevant theories and concepts"
    ],
    topics: [
      {
        id: "phy_1",
        topic: "Measurements and Units",
        subtopics: [
          "Fundamental units: length (metre), mass (kilogram), time (second), electric charge (coulomb), temperature (kelvin), luminous intensity (candela), amount of substance (mole)",
          "Derived units: weight, area, volume, force, speed, acceleration, density, pressure, energy, power",
          "Measuring instruments: vernier caliper, metre rule, micrometer screw gauge, measuring cylinder, stopwatch, beam balance, thermometer",
          "Significant figures and decimal places",
          "Scientific notation and standard form",
          "Dimensions of physical quantities",
          "Experimental errors: systematic and random errors",
          "Accuracy, precision and sensitivity of instruments",
          "Limitations of experimental measurements"
        ],
        objectives: [
          "Identify and state the units of fundamental and derived quantities",
          "Use measuring instruments correctly",
          "Determine lengths, surface areas and volumes of regular and irregular bodies",
          "Express results to appropriate significant figures",
          "Identify and minimise experimental errors",
          "Express physical quantities in scientific notation"
        ],
        prerequisites: [],
        cross_subject_links: ["mat_1", "chem_2"]
      },
      {
        id: "phy_2",
        topic: "Scalars and Vectors",
        subtopics: [
          "Scalar quantities: mass, speed, distance, energy, temperature, time",
          "Vector quantities: displacement, velocity, acceleration, force, momentum",
          "Vector representation: magnitude and direction",
          "Addition of vectors: triangle law, parallelogram law",
          "Resolution of vectors into perpendicular components",
          "Resultant of coplanar vectors",
          "Relative velocity: linear and circular contexts"
        ],
        objectives: [
          "Distinguish between scalar and vector quantities with examples",
          "Add and subtract vectors graphically",
          "Resolve vectors into horizontal and vertical components",
          "Calculate resultant of two or more vectors",
          "Solve problems on relative velocity"
        ],
        prerequisites: ["phy_1"],
        cross_subject_links: ["mat_11", "mat_7"]
      },
      {
        id: "phy_3",
        topic: "Motion",
        subtopics: [
          "Types of motion: translational, oscillatory, rotational, spin, random",
          "Newton's first law (law of inertia)",
          "Newton's second law: F = ma",
          "Newton's third law: action and reaction",
          "Linear motion equations: v=u+at, s=ut+½at², v²=u²+2as, s=½(u+v)t",
          "Distance-time and velocity-time graphs",
          "Projectile motion: horizontal and vertical components, range, maximum height, time of flight",
          "Circular motion: angular velocity ω, period T, frequency f, centripetal acceleration a=v²/r, centripetal force F=mv²/r",
          "Relative velocity in linear motion",
          "Conservation of linear momentum: mu + mv = m₁u₁ + m₂u₂",
          "Elastic and inelastic collisions",
          "Impulse: F×t = m(v-u)"
        ],
        objectives: [
          "Identify and describe types of motion",
          "State and apply Newton's three laws of motion",
          "Use equations of uniformly accelerated motion",
          "Analyse motion from distance-time and velocity-time graphs",
          "Solve projectile motion problems",
          "Apply conservation of momentum to collision problems"
        ],
        prerequisites: ["phy_2"],
        cross_subject_links: ["mat_12", "phy_4"]
      },
      {
        id: "phy_4",
        topic: "Gravitational Field",
        subtopics: [
          "Newton's law of universal gravitation: F = Gm₁m₂/r²",
          "Gravitational constant G = 6.67 × 10⁻¹¹ N m² kg⁻²",
          "Gravitational field strength g = GM/r²",
          "Gravitational potential: V = -GM/r",
          "Escape velocity: v = √(2gR)",
          "Satellite motion: orbital period T = 2π√(r³/GM)",
          "Geostationary satellites: period, height, uses",
          "Weight W = mg and mass distinction",
          "Weightlessness in orbit"
        ],
        objectives: [
          "State and apply Newton's law of universal gravitation",
          "Define and calculate gravitational field strength",
          "Calculate escape velocity for Earth and other planets",
          "Explain and calculate orbital parameters of satellites",
          "Distinguish weight from mass",
          "Explain weightlessness"
        ],
        prerequisites: ["phy_3"],
        cross_subject_links: ["phy_3", "mat_12"]
      },
      {
        id: "phy_5",
        topic: "Work, Energy and Power",
        subtopics: [
          "Work: W = Fs cosθ (definition and unit: joule)",
          "Work done against gravity, friction",
          "Kinetic energy: KE = ½mv²",
          "Potential energy: PE = mgh",
          "Conservation of mechanical energy",
          "Work-energy theorem: W = ΔKE",
          "Power: P = W/t = Fv (unit: watt)",
          "Forms of energy: mechanical, electrical, solar, heat, chemical, nuclear, sound",
          "Energy conversion and transformation",
          "Simple machines: inclined plane, levers (classes I, II, III), pulleys, wheel and axle, wedge, screw",
          "Mechanical advantage: MA = Load/Effort",
          "Velocity ratio: VR = distance moved by effort/distance moved by load",
          "Efficiency: η = MA/VR × 100%"
        ],
        objectives: [
          "Calculate work done in various situations",
          "Distinguish and calculate kinetic and potential energy",
          "Apply conservation of energy",
          "Calculate power",
          "Identify types of simple machines and calculate MA, VR, efficiency"
        ],
        prerequisites: ["phy_3"],
        cross_subject_links: ["phy_3", "phy_6"]
      },
      {
        id: "phy_6",
        topic: "Friction",
        subtopics: [
          "Nature of friction: static friction, kinetic (dynamic) friction",
          "Laws of solid friction",
          "Coefficient of static friction μₛ and kinetic friction μₖ",
          "Friction on inclined planes",
          "Advantages of friction: walking, braking, writing, belts",
          "Disadvantages: energy loss, wear and tear, heat generation",
          "Methods of reducing friction: lubrication, ball bearings, streamlining",
          "Viscosity: definition, Newton's law of viscosity",
          "Coefficient of viscosity η",
          "Stokes' law: F = 6πηrv",
          "Terminal velocity and its calculation"
        ],
        objectives: [
          "Distinguish static from dynamic friction",
          "State and apply laws of friction",
          "Calculate frictional force and coefficient of friction",
          "Identify advantages and disadvantages of friction",
          "Explain viscosity and derive terminal velocity expression"
        ],
        prerequisites: ["phy_3", "phy_5"],
        cross_subject_links: ["phy_3"]
      },
      {
        id: "phy_7",
        topic: "Simple Harmonic Motion (SHM)",
        subtopics: [
          "Definition: acceleration ∝ displacement, directed to equilibrium",
          "Examples: simple pendulum, loaded spring, vibrating tuning fork",
          "Period of pendulum: T = 2π√(l/g)",
          "Period of spring: T = 2π√(m/k)",
          "Frequency f = 1/T",
          "Amplitude A",
          "Angular frequency ω = 2πf",
          "Displacement: x = A sin(ωt)",
          "Velocity in SHM: v = ω√(A²-x²)",
          "Energy in SHM: total energy E = ½mω²A²",
          "KE = ½mω²(A²-x²), PE = ½mω²x²",
          "Resonance: forced vibration, natural frequency, effects (Tacoma bridge, tuning)",
          "Damped oscillations"
        ],
        objectives: [
          "Define SHM and identify examples",
          "Derive and apply expressions for period of pendulum and spring",
          "Calculate frequency, amplitude and angular frequency",
          "Apply energy equations in SHM",
          "Explain resonance and give practical examples"
        ],
        prerequisites: ["phy_3", "phy_5"],
        cross_subject_links: ["phy_8", "mat_12"]
      },
      {
        id: "phy_8",
        topic: "Waves",
        subtopics: [
          "Wave production and propagation: mechanical waves need medium, electromagnetic do not",
          "Classification: transverse waves (electromagnetic, water), longitudinal waves (sound, compression)",
          "Wave parameters: wavelength λ, frequency f, period T, velocity v, amplitude A",
          "Wave equation: v = fλ",
          "Reflection of waves: law of reflection, echoes",
          "Refraction: change of speed at boundary",
          "Diffraction: spreading around obstacles",
          "Interference: constructive and destructive",
          "Polarisation: transverse waves only",
          "Stationary (standing) waves: nodes and antinodes, harmonics",
          "Sound waves: pitch (frequency), loudness (amplitude), quality (waveform/timbre)",
          "Speed of sound in different media",
          "Musical instruments: strings, pipes",
          "Ultrasound: frequency > 20 000 Hz, uses in sonar, medical imaging",
          "Electromagnetic spectrum: radio, microwave, infrared, visible, UV, X-ray, gamma — wavelengths, frequencies, properties, uses"
        ],
        objectives: [
          "Explain wave production and propagation mechanisms",
          "Distinguish transverse from longitudinal waves",
          "Calculate wave speed, frequency and wavelength",
          "Describe reflection, refraction, diffraction and interference",
          "Explain properties and uses of electromagnetic spectrum"
        ],
        prerequisites: ["phy_7"],
        cross_subject_links: ["phy_9", "phy_7"]
      },
      {
        id: "phy_9",
        topic: "Optics",
        subtopics: [
          "Laws of reflection: angle of incidence = angle of reflection",
          "Plane mirrors: image properties (virtual, erect, same size, laterally inverted)",
          "Curved mirrors: concave and convex, principal focus, focal length, centre of curvature",
          "Mirror formula: 1/f = 1/u + 1/v, magnification m = v/u",
          "Refraction: Snell's law — n₁sinθ₁ = n₂sinθ₂",
          "Refractive index: n = sin i/sin r = c/v",
          "Total internal reflection: critical angle sinC = 1/n, conditions",
          "Applications: optical fibre, diamonds, mirages, periscope",
          "Thin lenses: converging (convex) and diverging (concave)",
          "Lens formula: 1/f = 1/u + 1/v (same as mirror formula)",
          "Power of lens: P = 1/f (dioptres)",
          "Optical instruments: simple camera, pinhole camera, human eye (accommodation, defects: myopia, hypermetropia, astigmatism, presbyopia and corrections)",
          "Simple and compound microscope",
          "Refracting telescope, Galilean telescope",
          "Dispersion: white light spectrum, prism, rainbow, pure and impure spectra",
          "Colour: primary colours (red, green, blue), secondary, mixing, colour filters"
        ],
        objectives: [
          "Apply laws of reflection to plane and curved mirrors",
          "Apply Snell's law to calculate refractive indices",
          "Explain total internal reflection and cite applications",
          "Use lens and mirror formulae to solve problems",
          "Describe structure and function of optical instruments",
          "Explain dispersion and colour mixing"
        ],
        prerequisites: ["phy_8"],
        cross_subject_links: ["phy_8", "bio_7"]
      },
      {
        id: "phy_10",
        topic: "Electricity",
        subtopics: [
          "Electric charge: types, charging by friction/induction/contact",
          "Coulomb's law: F = kq₁q₂/r², k = 9×10⁹ N m² C⁻²",
          "Electric field: E = F/q, field lines, uniform field",
          "Electric potential: V = W/q",
          "Capacitors: capacitance C = Q/V, parallel plates C = ε₀A/d",
          "Capacitors in series: 1/C = 1/C₁ + 1/C₂ + ...",
          "Capacitors in parallel: C = C₁ + C₂ + ...",
          "Energy stored in capacitor: E = ½CV²",
          "Electric current: I = Q/t",
          "Ohm's law: V = IR",
          "Resistance R and resistivity ρ: R = ρl/A",
          "Resistors in series: R = R₁ + R₂ + ...",
          "Resistors in parallel: 1/R = 1/R₁ + 1/R₂ + ...",
          "EMF and internal resistance: V = E - Ir",
          "Electrical power: P = IV = I²R = V²/R",
          "Electrical energy: E = Pt = IVt",
          "Heating effect: electric heaters, fuses",
          "Kirchhoff's laws: KCL and KVL",
          "Wheatstone bridge",
          "Potentiometer"
        ],
        objectives: [
          "Apply Coulomb's law to solve electrostatic problems",
          "Calculate capacitance and energy stored",
          "Apply Ohm's law and calculate circuit parameters",
          "Calculate total resistance in series and parallel circuits",
          "Apply Kirchhoff's laws to circuit analysis",
          "Calculate electrical energy and power"
        ],
        prerequisites: ["phy_1", "phy_3"],
        cross_subject_links: ["phy_11", "mat_5"]
      },
      {
        id: "phy_11",
        topic: "Magnetism and Electromagnetism",
        subtopics: [
          "Properties of magnets: poles, field patterns, neutral points",
          "Magnetic field of current-carrying conductor: right-hand rule",
          "Force on current-carrying conductor: F = BIl sinθ",
          "Force on moving charge: F = Bqv sinθ",
          "DC motor: principle, commutator, armature, field magnet",
          "Electromagnetic induction: Faraday's law, Lenz's law",
          "Induced EMF: ε = -dΦ/dt",
          "AC generator: principle, slip rings",
          "Mutual induction and self-induction",
          "Transformers: step-up and step-down, Ns/Np = Vs/Vp = Ip/Is",
          "Transformer efficiency: P_out/P_in × 100%",
          "Power transmission: high voltage reduces current losses",
          "Inductance in AC: reactance XL = 2πfL",
          "Capacitance in AC: reactance XC = 1/(2πfC)",
          "Resonance frequency: f₀ = 1/(2π√LC)"
        ],
        objectives: [
          "Describe magnetic field patterns",
          "Apply the motor effect to explain DC motor operation",
          "State and apply Faraday's and Lenz's laws",
          "Calculate transformer turns ratio and efficiency",
          "Explain power transmission at high voltage",
          "Calculate reactance in AC circuits"
        ],
        prerequisites: ["phy_10"],
        cross_subject_links: ["phy_10", "phy_8"]
      },
      {
        id: "phy_12",
        topic: "Modern Physics",
        subtopics: [
          "Photoelectric effect: work function φ, threshold frequency f₀, Einstein's equation: hf = φ + ½mv²",
          "Planck's constant h = 6.63 × 10⁻³⁴ J s",
          "X-rays: production in X-ray tube, properties, types (soft/hard), uses (medical, crystallography)",
          "Radioactivity: definition, natural radioactivity",
          "Alpha (α) particles: nature, properties, penetrating power",
          "Beta (β) particles: nature, properties, penetrating power",
          "Gamma (γ) rays: nature, properties, penetrating power",
          "Radioactive decay: N = N₀e^(-λt)",
          "Half-life: T₁/₂ = ln2/λ = 0.693/λ",
          "Decay constant λ",
          "Nuclear reactions: fission (²³⁵U splits) and fusion (H + H → He)",
          "Binding energy: E = mc², mass defect",
          "Binding energy per nucleon and stability",
          "Nuclear energy: fission reactors, chain reaction",
          "Radiation hazards and safety measures",
          "Applications of radioactivity: carbon dating, medical, industrial"
        ],
        objectives: [
          "Explain the photoelectric effect using Einstein's equation",
          "Describe X-ray production and applications",
          "Identify and compare properties of α, β and γ radiations",
          "Calculate half-life and remaining activity",
          "Distinguish fission from fusion",
          "Calculate binding energy using mass defect"
        ],
        prerequisites: ["phy_10", "phy_8"],
        cross_subject_links: ["chem_3", "phy_8"]
      },
      {
        id: "phy_13",
        topic: "Heat and Thermodynamics",
        subtopics: [
          "Temperature scales: Celsius, Kelvin (K = °C + 273), Fahrenheit",
          "Thermometers: liquid-in-glass, thermocouple, resistance, clinical",
          "Linear expansion: L = L₀(1 + αΔT), α = linear expansivity",
          "Area expansion: β = 2α",
          "Volume expansion: γ = 3α; real and apparent expansion of liquids",
          "Gas laws: Boyle's law PV = constant (T constant), Charles's law V/T = constant (P constant), Pressure law P/T = constant (V constant)",
          "Combined gas law: PV/T = constant",
          "Ideal gas equation: PV = nRT, R = 8.314 J mol⁻¹ K⁻¹",
          "Specific heat capacity: Q = mcΔT",
          "Latent heat of fusion: Q = mLf",
          "Latent heat of vaporisation: Q = mLv",
          "Saturated and unsaturated vapour, dew point",
          "Heat transfer: conduction (metals, Fourier's law), convection (fluids, sea/land breeze), radiation (Stefan-Boltzmann law, greenhouse effect)"
        ],
        objectives: [
          "Convert between temperature scales",
          "Apply gas laws to solve problems",
          "Calculate heat quantities using specific heat capacity and latent heat",
          "Distinguish latent heat of fusion from vaporisation",
          "Describe and compare modes of heat transfer"
        ],
        prerequisites: ["phy_1"],
        cross_subject_links: ["chem_2", "phy_14"]
      },
      {
        id: "phy_14",
        topic: "Structure of Matter",
        subtopics: [
          "Molecular theory: evidence from Brownian motion, diffusion",
          "Intermolecular forces: cohesion and adhesion",
          "States of matter and molecular spacing",
          "Elasticity: elastic and plastic deformation",
          "Hooke's law: F = ke (load-extension)",
          "Young's modulus: Y = stress/strain = (F/A)/(e/l)",
          "Surface tension: definition, examples (water droplets, capillary rise, insects on water)",
          "Surface tension coefficient T = F/l",
          "Capillarity: rise h = 2Tcosθ/(ρgr)",
          "Viscosity: laminar and turbulent flow",
          "Coefficient of viscosity η",
          "Stokes' law: F = 6πηrv (terminal velocity derivation)",
          "Diffusion: Fick's first law"
        ],
        objectives: [
          "Explain molecular theory and Brownian motion as evidence",
          "Distinguish elastic from plastic deformation",
          "Apply Hooke's law and calculate Young's modulus",
          "Explain surface tension and capillarity with examples",
          "Derive and apply terminal velocity expression using Stokes' law"
        ],
        prerequisites: ["phy_6", "phy_13"],
        cross_subject_links: ["chem_2", "phy_6"]
      }
    ]
  },

  mathematics: {
    display_name: "Mathematics",
    code: "MAT",
    general_objectives: [
      "Acquire computational and manipulative skills",
      "Develop precise, logical and formal reasoning skills",
      "Develop deductive skills in interpretation of graphs, diagrams and data",
      "Apply mathematical concepts to resolve issues in daily living"
    ],
    sections: [
      "Section I: Number and Numeration",
      "Section II: Algebra",
      "Section III: Geometry/Trigonometry",
      "Section IV: Calculus",
      "Section V: Statistics"
    ],
    topics: [
      {
        id: "mat_1",
        topic: "Number Bases and Modular Arithmetic",
        section: "Section I",
        subtopics: [
          "Operations in different bases from 2 to 10: binary (base 2), octal (base 8), decimal (base 10)",
          "Conversion from one base to another: repeated division, polynomial expansion",
          "Fractional parts in different bases",
          "Modular arithmetic: addition, subtraction, multiplication in modulo n"
        ],
        objectives: [
          "Perform the four basic operations in different bases",
          "Convert numbers from one base to another including fractional parts",
          "Solve problems in modulo arithmetic"
        ],
        prerequisites: [],
        cross_subject_links: ["phy_1"]
      },
      {
        id: "mat_2",
        topic: "Fractions, Decimals, Approximations and Percentages",
        section: "Section I",
        subtopics: [
          "Operations on fractions: addition, subtraction, multiplication, division",
          "Conversion between fractions and decimals",
          "Significant figures: rules for counting sig figs",
          "Decimal places",
          "Percentage errors: |error|/true value × 100",
          "Simple interest: SI = PRT/100",
          "Compound interest: A = P(1 + r/100)ⁿ",
          "Profit and loss percent",
          "Ratio, proportion and rate",
          "Shares and dividends",
          "Value Added Tax (VAT)"
        ],
        objectives: [
          "Perform operations on fractions and decimals",
          "Express to specified significant figures and decimal places",
          "Calculate simple and compound interest",
          "Calculate profit, loss, ratio, proportion and percentage error",
          "Solve problems involving shares and VAT"
        ],
        prerequisites: ["mat_1"],
        cross_subject_links: ["eco_3", "mat_13"]
      },
      {
        id: "mat_3",
        topic: "Indices, Logarithms and Surds",
        section: "Section I",
        subtopics: [
          "Laws of indices: aᵐ × aⁿ = aᵐ⁺ⁿ, aᵐ ÷ aⁿ = aᵐ⁻ⁿ, (aᵐ)ⁿ = aᵐⁿ, a⁰ = 1, a⁻ⁿ = 1/aⁿ",
          "Equations involving indices: aˣ = b",
          "Standard form: a × 10ⁿ where 1 ≤ a < 10",
          "Laws of logarithm: log(AB) = logA + logB, log(A/B) = logA - logB, log(Aⁿ) = n logA",
          "Common logarithm (base 10) and natural logarithm (base e)",
          "Logarithm tables: reading and using 4-figure tables",
          "Change of base: logₐb = log b / log a",
          "Relationship between indices and logarithms: if aˣ = N then x = logₐN",
          "Surds: √2, √3, √5 — simplification",
          "Operations on surds: addition, subtraction, multiplication",
          "Rationalisation of surds: multiplying by conjugate"
        ],
        objectives: [
          "Apply laws of indices to simplify expressions and solve equations",
          "Apply laws of logarithm to simplify and solve equations",
          "Use logarithm tables to evaluate expressions",
          "Change logarithm base",
          "Simplify surds and rationalise denominators"
        ],
        prerequisites: ["mat_1", "mat_2"],
        cross_subject_links: ["phy_1", "chem_5"]
      },
      {
        id: "mat_4",
        topic: "Sets",
        section: "Section I",
        subtopics: [
          "Idea of a set: definition, notation, listing and set-builder notation",
          "Types of sets: empty set ∅, universal set U, subset (A ⊆ B), proper subset",
          "Complement of a set A' (elements in U but not in A)",
          "Set operations: union A ∪ B, intersection A ∩ B, difference A \\ B",
          "Properties: commutative, associative, distributive laws",
          "Venn diagrams: two-set and three-set problems",
          "Applications: word problems using Venn diagrams"
        ],
        objectives: [
          "Define sets using listing and set-builder notation",
          "Identify subset, proper subset, complement",
          "Perform union and intersection operations",
          "Draw and interpret Venn diagrams",
          "Solve real-life problems using Venn diagrams"
        ],
        prerequisites: [],
        cross_subject_links: ["mat_13"]
      },
      {
        id: "mat_5",
        topic: "Polynomials",
        section: "Section II",
        subtopics: [
          "Definition and degree of a polynomial",
          "Addition and subtraction of polynomials",
          "Multiplication of polynomials",
          "Division of polynomials: long division",
          "Remainder theorem: if P(x) is divided by (x-a), remainder = P(a)",
          "Factor theorem: (x-a) is a factor if P(a) = 0",
          "Factorisation using factor theorem",
          "Zeros (roots) of a polynomial",
          "Graphs of polynomial functions"
        ],
        objectives: [
          "Perform arithmetic operations on polynomials",
          "Apply remainder and factor theorems",
          "Factorise polynomials using factor theorem",
          "Find zeros of polynomial functions",
          "Sketch graphs of simple polynomials"
        ],
        prerequisites: ["mat_2", "mat_3"],
        cross_subject_links: ["mat_6", "mat_12"]
      },
      {
        id: "mat_6",
        topic: "Quadratic Equations",
        section: "Section II",
        subtopics: [
          "Factorisation method: ax² + bx + c = a(x-p)(x-q)",
          "Completing the square method: (x + b/2a)² = (b/2a)² - c/a",
          "Quadratic formula: x = (-b ± √(b²-4ac)) / 2a",
          "Discriminant: b²-4ac — nature of roots",
          "Sum of roots: α+β = -b/a; product of roots: αβ = c/a",
          "Forming quadratic equations from roots",
          "Graphical solution: y = ax² + bx + c, parabola",
          "Maximum and minimum values from vertex",
          "Word problems leading to quadratic equations"
        ],
        objectives: [
          "Solve quadratic equations by factorisation, completing the square, and formula",
          "Use the discriminant to determine nature of roots",
          "Find sum and product of roots without solving",
          "Form quadratic equations given roots",
          "Solve word problems using quadratic equations"
        ],
        prerequisites: ["mat_5"],
        cross_subject_links: ["mat_5", "mat_12", "phy_3"]
      },
      {
        id: "mat_7",
        topic: "Simultaneous Equations, Variation and Inequalities",
        section: "Section II",
        subtopics: [
          "Simultaneous linear equations: substitution and elimination methods",
          "Simultaneous linear and quadratic equations",
          "Graphical solution of simultaneous equations",
          "Direct variation: y ∝ x, y = kx",
          "Inverse variation: y ∝ 1/x, y = k/x",
          "Joint variation: z ∝ xy",
          "Partial variation: y = ax + b",
          "Linear inequalities in one variable: number line representation",
          "Linear inequalities in two variables: graphical solution, feasible region",
          "Quadratic inequalities"
        ],
        objectives: [
          "Solve simultaneous linear equations by substitution and elimination",
          "Solve simultaneous linear-quadratic systems",
          "Express and solve variation problems",
          "Solve linear inequalities in one and two variables"
        ],
        prerequisites: ["mat_5", "mat_6"],
        cross_subject_links: ["eco_2", "phy_3"]
      },
      {
        id: "mat_8",
        topic: "Progressions — Sequences and Series",
        section: "Section II",
        subtopics: [
          "Arithmetic Progression (AP): nth term Tₙ = a + (n-1)d",
          "Sum of AP: Sₙ = n/2[2a + (n-1)d] = n/2(a + l)",
          "Geometric Progression (GP): nth term Tₙ = arⁿ⁻¹",
          "Sum of GP: Sₙ = a(rⁿ-1)/(r-1) for r ≠ 1",
          "Sum to infinity of GP: S∞ = a/(1-r) for |r| < 1",
          "Distinguishing AP from GP from a sequence",
          "Word problems: mortgage, population growth, compound interest as GP"
        ],
        objectives: [
          "Identify AP and GP from sequences",
          "Calculate nth term and sum of AP",
          "Calculate nth term and sum of GP",
          "Calculate sum to infinity of a convergent GP",
          "Solve real-life problems involving AP and GP"
        ],
        prerequisites: ["mat_2", "mat_3"],
        cross_subject_links: ["eco_5", "mat_2"]
      },
      {
        id: "mat_9",
        topic: "Geometry — Plane Shapes",
        section: "Section III",
        subtopics: [
          "Angles: acute, obtuse, reflex; angles on straight line, vertically opposite, corresponding, alternate",
          "Sum of angles in polygon: (n-2) × 180°",
          "Exterior angle of polygon",
          "Types of triangles: scalene, isosceles, equilateral, right-angled",
          "Congruent triangles: SSS, SAS, ASA, RHS conditions",
          "Similar triangles: ratio of sides, ratio of areas, ratio of volumes",
          "Pythagoras theorem: a² + b² = c²",
          "Quadrilaterals: square, rectangle, parallelogram, rhombus, trapezium — properties",
          "Area formulas: triangle, parallelogram, trapezium, circle",
          "Circle theorems: angle at centre, angle in semicircle, angles in same segment, cyclic quadrilateral",
          "Tangent-radius theorem, tangent from external point",
          "Construction: triangles, quadrilaterals, circles using compass and ruler",
          "Loci: equidistant from two points, equidistant from two lines"
        ],
        objectives: [
          "Apply angle properties and theorems",
          "Apply and prove Pythagoras theorem",
          "Identify and use properties of quadrilaterals",
          "Apply circle theorems to solve problems",
          "Construct geometrical figures using compass and ruler",
          "Describe and find loci"
        ],
        prerequisites: ["mat_1"],
        cross_subject_links: ["mat_10", "mat_11"]
      },
      {
        id: "mat_10",
        topic: "Coordinate Geometry",
        section: "Section III",
        subtopics: [
          "Distance between two points: d = √[(x₂-x₁)² + (y₂-y₁)²]",
          "Midpoint: M = ((x₁+x₂)/2, (y₁+y₂)/2)",
          "Gradient (slope): m = (y₂-y₁)/(x₂-x₁)",
          "Equation of a line: y = mx + c (gradient-intercept form)",
          "Equation of a line: y - y₁ = m(x - x₁) (point-gradient form)",
          "Intercepts form: x/a + y/b = 1",
          "Parallel lines: same gradient m₁ = m₂",
          "Perpendicular lines: m₁ × m₂ = -1",
          "Distance from point to line",
          "Equation of a circle: (x-a)² + (y-b)² = r²",
          "General form of circle equation: x² + y² + 2gx + 2fy + c = 0"
        ],
        objectives: [
          "Calculate distance and midpoint between two points",
          "Find gradient and equation of a straight line",
          "Identify parallel and perpendicular lines",
          "Find equation of a circle given centre and radius"
        ],
        prerequisites: ["mat_9"],
        cross_subject_links: ["mat_9", "mat_11", "phy_3"]
      },
      {
        id: "mat_11",
        topic: "Trigonometry",
        section: "Section III",
        subtopics: [
          "Trigonometric ratios: sin θ = opp/hyp, cos θ = adj/hyp, tan θ = opp/adj",
          "Special angles: sin30°=½, cos30°=√3/2, tan30°=1/√3, sin45°=cos45°=1/√2, sin60°=√3/2",
          "Trigonometric ratios in all four quadrants: CAST rule",
          "Graphs of y = sin x, y = cos x, y = tan x (period, amplitude)",
          "Sine rule: a/sinA = b/sinB = c/sinC",
          "Cosine rule: a² = b² + c² - 2bc cosA",
          "Area of triangle: Area = ½ab sinC",
          "Bearing: three-figure bearing, angles of elevation and depression",
          "Heights and distances applications",
          "Trigonometric identities: sin²x + cos²x = 1, tanx = sinx/cosx",
          "Compound angle formulae: sin(A±B), cos(A±B)"
        ],
        objectives: [
          "Apply trigonometric ratios to right-angled triangles",
          "Find trig values for special angles without calculator",
          "Use CAST rule for angles in all quadrants",
          "Apply sine and cosine rules",
          "Calculate area of triangle using trigonometry",
          "Solve bearing and elevation problems",
          "Prove and apply trigonometric identities"
        ],
        prerequisites: ["mat_9", "mat_10"],
        cross_subject_links: ["phy_2", "phy_8", "mat_12"]
      },
      {
        id: "mat_12",
        topic: "Calculus",
        section: "Section IV",
        subtopics: [
          "Limit of a function: lim(x→a) f(x)",
          "Differentiation from first principles: f'(x) = lim(h→0) [f(x+h)-f(x)]/h",
          "Rules of differentiation: power rule d/dx(xⁿ) = nxⁿ⁻¹, product rule, quotient rule, chain rule",
          "Derivatives of standard functions: sin x, cos x, eˣ, ln x",
          "Second derivative and concavity",
          "Applications of differentiation: gradient of curve, tangent and normal",
          "Maxima and minima: f'(x) = 0, second derivative test",
          "Rate of change",
          "Indefinite integration: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C",
          "Integration of standard functions",
          "Definite integrals: ∫ₐᵇ f(x) dx",
          "Area under a curve: A = ∫ₐᵇ f(x) dx",
          "Volume of solid of revolution: V = π ∫ₐᵇ [f(x)]² dx"
        ],
        objectives: [
          "Find derivatives using first principles and standard rules",
          "Apply chain, product and quotient rules",
          "Find second derivatives",
          "Apply differentiation to find tangents, normals, maxima and minima",
          "Evaluate indefinite and definite integrals",
          "Calculate areas bounded by curves"
        ],
        prerequisites: ["mat_5", "mat_11"],
        cross_subject_links: ["phy_3", "phy_4", "phy_5"]
      },
      {
        id: "mat_13",
        topic: "Statistics and Probability",
        section: "Section V",
        subtopics: [
          "Frequency distribution: class intervals, class limits, class boundaries, class width, class mark",
          "Histogram: bars represent frequency (or frequency density)",
          "Frequency polygon and frequency curve",
          "Ogive (cumulative frequency curve): reading median, quartiles, percentiles",
          "Mean of grouped data: x̄ = Σfx/Σf",
          "Median of grouped data: using ogive or interpolation formula",
          "Mode of grouped data: modal class, interpolation",
          "Mean deviation: MD = Σf|x-x̄|/Σf",
          "Variance: σ² = Σf(x-x̄)²/Σf",
          "Standard deviation: σ = √variance",
          "Classical probability: P(A) = n(A)/n(S)",
          "Empirical probability",
          "Mutually exclusive events: P(A or B) = P(A) + P(B)",
          "Independent events: P(A and B) = P(A) × P(B)",
          "Conditional probability: P(A|B) = P(A∩B)/P(B)",
          "Permutations: nPr = n!/(n-r)!",
          "Combinations: nCr = n!/[r!(n-r)!]",
          "Binomial theorem: (a+b)ⁿ"
        ],
        objectives: [
          "Construct and interpret frequency distribution tables",
          "Draw and interpret histograms, frequency polygons and ogives",
          "Calculate mean, median and mode for grouped and ungrouped data",
          "Calculate variance and standard deviation",
          "Calculate probability of events",
          "Apply permutations and combinations"
        ],
        prerequisites: ["mat_2", "mat_4"],
        cross_subject_links: ["eco_2", "bio_11", "mat_4"]
      }
    ]
  },

  chemistry: {
    display_name: "Chemistry",
    code: "CHE",
    general_objectives: [
      "Understand the basic principles and concepts in chemistry",
      "Interpret scientific data relating to chemistry",
      "Deduce the relationships between chemistry and other sciences",
      "Apply the knowledge of chemistry to industry and everyday life"
    ],
    topics: [
      { id:"chem_1", topic:"Separation of Mixtures and Purification", subtopics:["Elements, compounds and mixtures — definitions and examples","Chemical changes (new substance formed) vs physical changes (reversible)","Pure and impure substances","Boiling point, melting point, density as criteria for purity","Separation processes: evaporation, simple distillation (separating miscible liquids with very different boiling points), fractional distillation (liquids with close boiling points e.g. crude oil)","Sublimation: iodine, naphthalene, ammonium chloride","Recrystallisation: purifying solids","Paper chromatography: Rf = distance moved by spot / distance moved by solvent","Column chromatography","Magnetisation: iron filings from sand","Decantation, filtration (insoluble solid from liquid)","Centrifugation: separating suspended solids"], objectives:["Distinguish between elements, compounds and mixtures","Differentiate chemical from physical changes","Distinguish pure from impure substances","Use boiling and melting points as purity criteria","Specify the principle in each separation method","Apply separation techniques to everyday situations"], prerequisites:[], cross_subject_links:["phy_14","chem_2"] },
      { id:"chem_2", topic:"Chemical Combination and Kinetic Theory", subtopics:["Law of conservation of mass: mass of reactants = mass of products","Law of definite proportions: fixed ratio by mass","Law of multiple proportions","Law of reciprocal proportions","Chemical symbols, formulae and equations: balancing","Relative atomic mass based on ¹²C = 12","Mole concept: 1 mole = 6.02 × 10²³ particles (Avogadro's number)","Molar mass (g/mol)","Stoichiometry: mass-mass, mass-volume calculations","Empirical formula and molecular formula","Kinetic theory of matter: states of matter, pressure, temperature","Brownian motion as evidence for molecular movement","Diffusion: Graham's law — rate ∝ 1/√M","Boyle's law: PV = k (T constant)","Charles's law: V/T = k (P constant)","Pressure law: P/T = k (V constant)","Dalton's law of partial pressures","Ideal gas equation: PV = nRT"], objectives:["Apply the laws of chemical combination","Perform mole calculations","Balance equations and perform stoichiometric calculations","Determine empirical and molecular formulae","Apply kinetic theory to explain gas behaviour","Apply Boyle's, Charles's and ideal gas laws"], prerequisites:["chem_1"], cross_subject_links:["phy_13","phy_14","mat_3"] },
      { id:"chem_3", topic:"Atomic Structure and Periodic Table", subtopics:["Sub-atomic particles: proton (relative mass 1, charge +1), neutron (relative mass 1, charge 0), electron (relative mass 1/1840, charge -1)","Atomic number Z (proton number), mass number A, isotopes","Electronic configuration using shells: 2, 8, 8, 18...","Aufbau principle: filling lowest energy orbitals first","Hund's rule and Pauli exclusion principle (for HL understanding)","Periods and groups in periodic table","Trends: atomic radius (decreases across period), ionisation energy (increases across period), electronegativity (increases across period)","Properties of Group I (alkali metals): reactivity, reactions with water, air","Properties of Group II (alkaline earth metals)","Properties of Group VII (halogens): reactivity, oxidising power, displacement reactions","Properties of Period 3 elements across the period","Periodicity in physical and chemical properties"], objectives:["Describe the structure of the atom and subatomic particles","Determine electronic configuration of elements up to Z=36","Explain periodic trends across periods and down groups","Describe properties and reactions of elements in Groups I, II, VII and Period 3"], prerequisites:["chem_2"], cross_subject_links:["phy_12","chem_4"] },
      { id:"chem_4", topic:"Chemical Bonding", subtopics:["Ionic (electrovalent) bonding: transfer of electrons, formation of ions, properties (high mp/bp, conducts when molten/dissolved)","Covalent bonding: sharing of electrons, single/double/triple bonds, properties (low mp/bp generally)","Coordinate (dative) covalent bond: both electrons from one atom, e.g. NH₄⁺","Metallic bonding: sea of delocalised electrons, explains conductivity and malleability","Polar covalent bonds: electronegativity difference → dipole","Non-polar covalent bonds: same atoms or equal sharing","Hydrogen bonding: F-H, O-H, N-H; explains high bp of water, HF; DNA structure","Van der Waals (London dispersion) forces: temporary dipoles in non-polar molecules","Shapes of molecules using VSEPR: linear, trigonal planar, tetrahedral, pyramidal, bent","Bond length and bond energy: shorter bond = stronger bond"], objectives:["Explain formation of ionic, covalent and metallic bonds","Describe coordinate bonding with examples","Explain hydrogen bonding and its effect on physical properties","Apply VSEPR to predict molecular shapes","Relate bond polarity to electronegativity"], prerequisites:["chem_3"], cross_subject_links:["chem_3","phy_14"] },
      { id:"chem_5", topic:"Stoichiometry and Volumetric Analysis", subtopics:["Mole concept review: n = m/M, n = V/22.4 L (at STP), n = N/Nₐ","Percentage composition: %A = (mass of A / molar mass) × 100","Empirical formula from percentage composition","Molecular formula from empirical formula and molar mass","Balanced equations for reactions","Mass calculations from equations: mole ratios","Volume calculations: gases at STP and RTP","Limiting reagent: identifies which reagent runs out first","Theoretical yield, actual yield, percentage yield","Molarity: M = moles/volume (L)","Molarity calculations","Titration: acid-base, indicators (phenolphthalein, methyl orange)","Calculations from titration data: V₁M₁/n₁ = V₂M₂/n₂"], objectives:["Calculate moles, mass, volume, number of particles","Determine empirical and molecular formulae","Perform stoichiometric calculations from equations","Identify limiting reagent and calculate yield","Calculate molarity","Perform and interpret titration calculations"], prerequisites:["chem_2","chem_3"], cross_subject_links:["mat_2","mat_3","chem_6"] },
      { id:"chem_6", topic:"Acids, Bases and Salts", subtopics:["Arrhenius theory: acids produce H⁺, bases produce OH⁻","Brønsted-Lowry theory: acids donate protons, bases accept protons","Properties of acids: taste sour, turn litmus red, react with metals/carbonates/bases","Properties of bases: taste bitter, turn litmus blue, soapy feel","Strong acids: HCl, H₂SO₄, HNO₃ — fully dissociated","Weak acids: CH₃COOH — partially dissociated","Strong bases: NaOH, KOH; Weak bases: NH₃","pH scale: pH = -log[H⁺], neutral pH 7, acid < 7, base > 7","Common indicators: litmus, phenolphthalein, methyl orange — colour changes","Neutralisation: acid + base → salt + water","Preparation of salts: direct combination, displacement, neutralisation, double decomposition","Properties of NaCl, NaHCO₃, Na₂CO₃, CuSO₄","Hydrolysis of salts: acidic, basic, neutral salts","Buffer solutions: resist pH change"], objectives:["Define acids and bases by Arrhenius and Brønsted-Lowry theories","Calculate pH of solutions","Perform neutralisation and predict products","Prepare salts by different methods","Identify and explain hydrolysis of salts"], prerequisites:["chem_5"], cross_subject_links:["chem_5","chem_7"] },
      { id:"chem_7", topic:"Electrochemistry", subtopics:["Electrolytes: strong (fully ionised), weak (partially ionised), non-electrolytes","Electrolysis: passage of current through electrolyte causes decomposition","Electrode reactions: oxidation at anode, reduction at cathode","Products of electrolysis of: dilute H₂SO₄, dilute NaCl, concentrated NaCl, copper sulphate","Discharge of ions: selective discharge based on position in electrochemical series","Faraday's first law: mass deposited ∝ charge passed (m = Q/F × M/n)","Faraday's second law: same charge deposits equivalent masses","Faraday's constant F = 96500 C mol⁻¹","Applications of electrolysis: electroplating, electro-refining (copper), extraction of aluminium, chlor-alkali industry","Standard electrode potential E°","Electrochemical series / reactivity series","Cell EMF: E°cell = E°cathode - E°anode","Galvanic (voltaic) cells: Daniel cell, fuel cell","Corrosion of iron: rusting (requires O₂ and H₂O), electrochemical nature","Prevention of corrosion: painting, galvanising, cathodic protection, alloying"], objectives:["Explain electrolysis and predict products at electrodes","Apply Faraday's laws in calculations","Calculate cell EMF from electrode potentials","Describe applications of electrolysis","Explain corrosion and methods of prevention"], prerequisites:["chem_6","phy_10"], cross_subject_links:["phy_10","chem_11"] },
      { id:"chem_8", topic:"Energy Changes in Chemical Reactions", subtopics:["Exothermic reactions: heat released, ΔH < 0, e.g. combustion, neutralisation","Endothermic reactions: heat absorbed, ΔH > 0, e.g. thermal decomposition","Standard enthalpy of formation ΔHf°","Standard enthalpy of combustion ΔHc°","Standard enthalpy of neutralisation","Standard enthalpy of solution","Hess's law: ΔH is path-independent, energy cycle calculations","Bond energy (bond dissociation energy): energy to break one mole of bonds in gaseous state","Calculating ΔH from bond energies: ΔH = bonds broken - bonds formed","Energy profile diagrams: activation energy Eₐ, transition state","Exo vs endo profile diagrams","Effect of catalyst on activation energy (lowers Eₐ, doesn't change ΔH)"], objectives:["Distinguish exothermic from endothermic reactions","Apply Hess's law in energy cycle calculations","Calculate ΔH from bond energies","Interpret energy profile diagrams","Explain the role of catalysts in energy terms"], prerequisites:["chem_5"], cross_subject_links:["chem_9","phy_5"] },
      { id:"chem_9", topic:"Rates of Reaction and Chemical Equilibrium", subtopics:["Rate of reaction: change in concentration/time or change in volume/time","Factors affecting rate: concentration (more collisions), temperature (more energy, effective collisions), surface area (more exposed particles), catalysts (lower Eₐ), pressure (gases)","Collision theory: effective collisions need correct orientation and sufficient energy","Catalysts: homogeneous (same phase) vs heterogeneous (different phase)","Industrial catalysts: Fe in Haber process, V₂O₅ in Contact process, Pt in catalytic converters","Reversible reactions and dynamic equilibrium","Le Chatelier's principle: system opposes changes to equilibrium","Effect of concentration, temperature and pressure on equilibrium","Equilibrium constant Kc: Kc = [products]/[reactants] (using stoichiometric powers)","Kp: using partial pressures of gases","Haber process: N₂ + 3H₂ ⇌ 2NH₃, conditions (450°C, 200 atm, Fe catalyst)","Contact process: 2SO₂ + O₂ ⇌ 2SO₃, conditions (450°C, V₂O₅)"], objectives:["Identify and explain factors affecting rate","Apply collision theory","Explain catalysis and give industrial examples","Apply Le Chatelier's principle","Write Kc and Kp expressions and calculate values","Explain industrial processes using equilibrium principles"], prerequisites:["chem_8"], cross_subject_links:["chem_8","phy_13"] },
      { id:"chem_10", topic:"Non-metals and their Compounds", subtopics:["Hydrogen: isotopes (protium, deuterium, tritium), preparation (action of dilute H₂SO₄ on Zn), properties, reducing agent, uses","Oxygen: preparation (decomposition of H₂O₂ with MnO₂, heating KMnO₄), properties, oxides (acidic, basic, amphoteric, neutral)","Water: structure, anomalous expansion, hardness (temporary and permanent), water treatment (chlorination, flocculation, filtration)","Nitrogen: unreactive at room temperature, nitrogen cycle","Haber process for ammonia: N₂ + 3H₂ → 2NH₃","Ammonia: properties, test (moist red litmus → blue), uses (fertilisers, refrigerants)","Nitric acid: manufacture by Ostwald process, properties, uses","Carbon: allotropes (diamond, graphite, fullerene), CO (toxic gas), CO₂ (greenhouse gas, test: limewater)","Carbonates and hydrogencarbonates","Halogens: fluorine, chlorine, bromine, iodine — reactivity order, displacement reactions","Chlorine: preparation, properties (bleaching, disinfecting), uses","Halides: silver halide test for Cl⁻, Br⁻, I⁻","Sulphur: allotropes (rhombic, monoclinic), H₂S (rotten egg smell, test), SO₂ (acid rain), SO₃","Contact process: 2SO₂ + O₂ ⇌ 2SO₃ → H₂SO₄","Sulphuric acid: concentrated (dehydrating, oxidising) vs dilute (acid reactions)"], objectives:["Describe preparation, properties and uses of non-metals and their compounds","Explain industrial processes involving non-metals","Apply knowledge to everyday situations","Distinguish allotropes of carbon and sulphur"], prerequisites:["chem_4","chem_5"], cross_subject_links:["bio_5","bio_12","phy_8"] },
      { id:"chem_11", topic:"Metals and their Compounds", subtopics:["General properties of metals: lustre, malleability, ductility, conductivity","Reactivity series (electrochemical series): K > Ca > Na > Mg > Al > Zn > Fe > Pb > H > Cu > Hg > Ag > Au","Reactions of metals with water, dilute acids, oxygen","Extraction methods: depends on reactivity — electrolysis (Na, Ca, Al), reduction with coke (Fe, Zn), reduction with H₂ (Cu), found native (Au, Ag, Pt)","Extraction of sodium by Downs process (electrolysis of molten NaCl)","Extraction of aluminium by Hall-Héroult process (electrolysis of Al₂O₃ in cryolite)","Extraction of iron in blast furnace: Fe₂O₃ + CO → Fe, slag formation","Extraction of copper: Cu₂S → Cu (smelting), electrolytic refining","Properties and uses of Na, Ca, Al, Fe, Cu and their compounds","Alloys: brass (Cu+Zn), bronze (Cu+Sn), duralumin (Al+Cu+Mg+Mn), stainless steel (Fe+Cr+Ni), solder (Pb+Sn)","Purpose of alloying: improve hardness, corrosion resistance, appearance"], objectives:["Arrange metals in order of reactivity","Predict reactions of metals with water and acids","Explain extraction of metals based on their position in reactivity series","Describe industrial extraction of Na, Al, Fe and Cu","Identify alloys and explain their uses"], prerequisites:["chem_7","chem_3"], cross_subject_links:["chem_7","phy_10"] },
      { id:"chem_12", topic:"Organic Chemistry", subtopics:["Carbon bonding: tetravalent, forms chains and rings","Hydrocarbons: alkanes (CₙH₂ₙ₊₂), alkenes (CₙH₂ₙ), alkynes (CₙH₂ₙ₋₂)","IUPAC nomenclature: methane, ethane, propane, butane; ethene, propene; ethyne","Structural isomerism: same molecular formula, different structural formulae","Geometric (cis-trans) isomerism: around C=C double bond","Reactions of alkanes: combustion (complete/incomplete), substitution (halogenation, UV light)","Reactions of alkenes: combustion, addition (H₂, HX, H₂O, X₂), polymerisation","Test for alkenes: decolourises bromine water, decolourises acidified KMnO₄","Petroleum: crude oil, fractional distillation products (refinery gas, petrol/naphtha, kerosene, diesel, lubricating oil, bitumen)","Cracking: breaking long-chain hydrocarbons into shorter chains","Functional groups: -OH (alcohols), -CHO (aldehydes), >C=O (ketones), -COOH (carboxylic acids), -NH₂ (amines), -COOR (esters)","Ethanol: manufacture by fermentation (glucose + yeast) and hydration of ethene","Properties of ethanol: solvent, fuel, antiseptic","Carboxylic acids (ethanoic acid): preparation, properties, uses","Esters: formation (esterification: alcohol + carboxylic acid → ester + water), uses","Addition polymers: polyethene, polypropene, PVC, polystyrene","Condensation polymers: nylon (polyamide), terylene (polyester)","Carbohydrates: glucose (monosaccharide), sucrose (disaccharide), starch, cellulose (polysaccharides)","Proteins: amino acids, peptide bonds, denaturation","Fats and oils: glycerol + fatty acids → triglycerides, saturated vs unsaturated"], objectives:["Name and classify organic compounds using IUPAC nomenclature","Write structural formulae for organic compounds","Describe and explain reactions of alkanes and alkenes","Explain petroleum refining and cracking","Distinguish addition from condensation polymerisation","Describe biological molecules: carbohydrates, proteins, fats"], prerequisites:["chem_4","chem_5"], cross_subject_links:["bio_3","bio_10","chem_4"] }
    ]
  },

  biology: {
    display_name: "Biology",
    code: "BIO",
    general_objectives: [
      "Demonstrate knowledge of diversity, interdependence and unity of life",
      "Account for continuity of life through reproduction, inheritance and evolution",
      "Apply biological principles to everyday life, community health and environment"
    ],
    sections: ["Section A: Variety of Organisms","Section B: Forms and Functions of Living Organisms","Section C: Heredity and Evolution","Section D: Ecology"],
    topics: [
      { id:"bio_1", topic:"Cell Biology and Organisation of Life", section:"Section A", subtopics:["Characteristics of living organisms: nutrition, respiration, excretion, growth, movement, reproduction, sensitivity, death","Cell theory: all living things made of cells","Cell structure: cell membrane (phospholipid bilayer), cell wall (cellulose in plants), nucleus (contains DNA), cytoplasm","Cell organelles: mitochondria (ATP production), ribosomes (protein synthesis), Golgi apparatus (packaging/secretion), endoplasmic reticulum (rough/smooth), lysosomes, centrioles (animal cells), vacuoles, chloroplasts (photosynthesis)","Differences: plant cells have cell wall, chloroplasts, large central vacuole; animal cells have centrioles, smaller vacuoles","Levels of organisation: cell → tissue → organ → organ system → organism","Examples: epithelial tissue, muscle tissue, nervous tissue","Mitosis: prophase, metaphase, anaphase, telophase, cytokinesis — produces 2 identical cells for growth/repair","Meiosis: meiosis I (homologs separate) and meiosis II (sister chromatids separate) — produces 4 haploid cells for sexual reproduction","Significance of mitosis: growth, repair, asexual reproduction","Significance of meiosis: genetic variation, maintains chromosome number in sexual reproduction"], objectives:["Differentiate living from non-living things","Identify and describe cell organelles and their functions","Compare plant and animal cells","Trace levels of organisation","Describe phases of mitosis and meiosis with diagrams","State significance of mitosis and meiosis"], prerequisites:[], cross_subject_links:["bio_10","chem_12","bio_2"] },
      { id:"bio_2", topic:"Classification of Living Organisms", section:"Section A", subtopics:["Kingdom Monera: prokaryotes — bacteria (no nucleus, circular DNA), blue-green algae (cyanobacteria)","Kingdom Protista: eukaryotes — Amoeba (pseudopodia), Euglena (flagellum, photosynthesis), Paramecium (cilia)","Kingdom Fungi: cell walls of chitin, saprophytic, spore reproduction — Rhizopus (bread mould), Mucor, mushroom","Kingdom Plantae — plants","Kingdom Animalia — animals","Plant classification: Thallophyta (Spirogyra — no roots/stems/leaves), Bryophyta (mosses, Marchantia — no vascular tissue), Pteridophyta (ferns — vascular, no seeds), Gymnospermae (conifers — naked seeds), Angiospermae (flowering plants — seeds in fruit): Monocots vs Dicots","Animal classification: Porifera (sponges), Coelenterata (Hydra, jellyfish), Platyhelminthes (tapeworm — flat), Nematoda (Ascaris — round), Annelida (earthworm — segmented), Arthropoda (insects, arachnids, crustaceans), Mollusca (snail, squid), Echinodermata (starfish), Chordata (vertebrates)","Vertebrates: fish (gills, scales), amphibians (moist skin, external fertilisation), reptiles (scales, internal), birds (feathers, homeotherms), mammals (hair, mammary glands)","Binomial nomenclature: genus + species, italicised","Evolutionary relationships and phylogenetic classification"], objectives:["Identify organisms in each kingdom","Describe characteristics of each kingdom","Classify plants from Thallophyta to Angiospermae","Classify animals from Porifera to Mammals","Apply binomial nomenclature"], prerequisites:["bio_1"], cross_subject_links:["bio_1","bio_11"] },
      { id:"bio_3", topic:"Nutrition in Plants and Animals", section:"Section B", subtopics:["Photosynthesis equation: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂","Light-dependent reactions: occur in thylakoids, split water, produce ATP and NADPH","Light-independent reactions (Calvin cycle): occur in stroma, fix CO₂ into glucose","Factors affecting photosynthesis: light intensity, CO₂ concentration, temperature, water","Importance of photosynthesis: food production, O₂ release, CO₂ absorption","Mineral nutrition in plants: macronutrients (N, P, K, Ca, Mg, S), micronutrients (Fe, Mn, Cu, Zn, B, Mo)","Nitrogen: needed for protein and chlorophyll; deficiency → yellow leaves (chlorosis)","Heterotrophic nutrition types: holozoic (ingestion, digestion, absorption, assimilation, egestion), saprophytic, parasitic, symbiotic, commensalism","Human digestive system: mouth (amylase), oesophagus (peristalsis), stomach (pepsin, HCl), small intestine (duodenum with bile and pancreatic enzymes, ileum absorption with villi/microvilli), large intestine (water absorption, colon), rectum, anus","Enzymes: amylase (starch→maltose), pepsin (protein→peptides, acid), trypsin (protein→peptides, alkaline), lipase (fat→fatty acids+glycerol), maltase (maltose→glucose)","Food tests: starch → iodine → blue-black, reducing sugars → Benedict's → brick red, protein → biuret → purple, fat → ethanol emulsion → milky white"], objectives:["Write and explain the equation for photosynthesis","Describe light-dependent and light-independent reactions","Identify and state functions of mineral nutrients","Describe types of heterotrophic nutrition","Trace food through human digestive system naming enzymes and products","Perform food tests"], prerequisites:["bio_1","chem_12"], cross_subject_links:["bio_4","bio_5","chem_12"] },
      { id:"bio_4", topic:"Transport Systems", section:"Section B", subtopics:["Osmosis: movement of water from low solute concentration to high across semi-permeable membrane","Diffusion: movement from high to low concentration (passive)","Active transport: movement against concentration gradient using ATP (e.g. mineral uptake by roots)","Transport in plants: xylem (water and mineral salts upward — dead cells, lignified), phloem (organic solutes, sucrose — bidirectional, living cells)","Mechanisms: root pressure, transpiration pull (cohesion-tension theory)","Transpiration: loss of water vapour through stomata; factors: temperature, humidity, wind, light","Human heart: 4 chambers, valves (bicuspid, tricuspid, aortic semilunar, pulmonary semilunar)","Cardiac cycle: systole (contraction) and diastole (relaxation), heart rate ~70 bpm","Double circulation: pulmonary (heart-lungs-heart) and systemic (heart-body-heart)","Blood composition: plasma (water 90%, dissolved substances), erythrocytes (RBC, haemoglobin), leucocytes (WBC: neutrophils, monocytes, lymphocytes, eosinophils, basophils), platelets (thrombocytes for clotting)","Blood clotting: platelets → prothrombin → thrombin → fibrinogen → fibrin","Blood groups: ABO system (A, B, AB, O); Rhesus (Rh+ and Rh-)","Blood transfusion compatibility","Lymphatic system: lymph capillaries, lymph nodes, lymph, role in immunity"], objectives:["Explain osmosis, diffusion and active transport with examples","Describe xylem and phloem transport","Explain transpiration and factors affecting it","Describe structure and function of the human heart","Explain the cardiac cycle and double circulation","Describe blood composition and functions","Explain ABO blood groups and transfusion compatibility"], prerequisites:["bio_3"], cross_subject_links:["bio_5","bio_6","phy_14"] },
      { id:"bio_5", topic:"Respiration", section:"Section B", subtopics:["Aerobic respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38 ATP","Stages: glycolysis (cytoplasm, glucose → 2 pyruvate, 2 ATP net), Krebs cycle (mitochondrial matrix, 2 ATP, CO₂ produced), electron transport chain (inner mitochondrial membrane, 34 ATP, O₂ used)","Anaerobic respiration in yeast: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ + 2 ATP (fermentation)","Anaerobic in animals: C₆H₁₂O₆ → 2 lactic acid + 2 ATP (oxygen debt)","Human respiratory system: nasal cavity, trachea, bronchi, bronchioles, alveoli (air sacs for gaseous exchange)","Alveolar adaptations: large surface area, thin walls, moist, rich blood supply","Mechanism of breathing: inspiration (diaphragm contracts/flattens, intercostals raise ribs, volume increases, pressure decreases), expiration (reverse)","Respiratory volumes: tidal volume, vital capacity","Gaseous exchange in gills (fish), tracheal system (insects), skin (earthworm)","Respiratory quotient RQ = CO₂ produced / O₂ consumed (carbohydrate = 1, fat = 0.7, protein = 0.8)"], objectives:["Write and explain the equation for aerobic respiration","Describe the three stages of aerobic respiration and their locations","Distinguish aerobic from anaerobic respiration","Describe the human respiratory system and gaseous exchange","Explain the mechanism of breathing","Calculate and interpret respiratory quotient"], prerequisites:["bio_3","bio_4"], cross_subject_links:["bio_4","bio_6","chem_10"] },
      { id:"bio_6", topic:"Excretion and Homeostasis", section:"Section B", subtopics:["Excretory products: CO₂ (from respiration, excreted via lungs), water, urea (from deamination of excess amino acids in liver), uric acid (from nucleic acid breakdown), bile pigments (from breakdown of haemoglobin in liver)","Kidneys: structure — cortex, medulla, renal pelvis, ureter","Nephron: Bowman's capsule (glomerulus — ultrafiltration: water, glucose, urea, salts filtered), proximal convoluted tubule (glucose, amino acids, most water reabsorbed), loop of Henle (concentration of urine), distal convoluted tubule (selective reabsorption), collecting duct (water reabsorption — ADH)","Osmoregulation: kidney controls water balance; ADH (antidiuretic hormone) — more ADH → concentrated urine","Excretion in plants: CO₂ and O₂ through stomata, water vapour through stomata (transpiration), oxygen of photosynthesis","Liver functions: deamination, detoxification, bile production, glycogen storage, heat production","Homeostasis: maintenance of constant internal environment","Blood glucose regulation: insulin (lowers glucose — promotes glycogen formation), glucagon (raises glucose — promotes glycogenolysis)","Body temperature regulation: hypothalamus acts as thermostat; vasodilation, sweating (hot); vasoconstriction, shivering (cold)","Blood pressure regulation"], objectives:["Identify excretory products and organs","Describe structure of kidney and nephron","Trace filtrate from glomerulus to urine","Explain osmoregulation and role of ADH","List functions of the liver","Explain homeostasis mechanisms including blood glucose and temperature regulation"], prerequisites:["bio_4","bio_5"], cross_subject_links:["bio_7","bio_8"] },
      { id:"bio_7", topic:"Nervous System and Sense Organs", section:"Section B", subtopics:["Neuron structure: cell body (soma), axon, dendrites, myelin sheath (Schwann cells), nodes of Ranvier, synaptic terminals","Types of neurons: sensory (receptor → CNS), motor (CNS → effector), interneuron/relay (within CNS)","Transmission of nerve impulse: resting potential (-70 mV), action potential (depolarisation, repolarisation, refractory period)","Synaptic transmission: neurotransmitters (acetylcholine, adrenaline) diffuse across synaptic cleft","Central nervous system: brain (cerebrum — thinking/memory, cerebellum — balance/coordination, medulla oblongata — breathing/heart rate/reflex) and spinal cord","Peripheral nervous system: somatic (voluntary) and autonomic (sympathetic vs parasympathetic)","Reflex arc: receptor → sensory neuron → spinal cord (relay neuron) → motor neuron → effector","The eye: sclera, choroid, retina (rods-dim light/black&white, cones-colour/bright light), cornea, iris (controls pupil), lens (accommodation by ciliary muscles)","Eye defects: myopia (short-sight, concave lens), hypermetropia (long-sight, convex lens), astigmatism (cylindrical lens), presbyopia (old age, bifocals)","The ear: outer (pinna, ear canal, tympanic membrane), middle (ossicles: malleus, incus, stapes; Eustachian tube), inner (cochlea — hearing, semicircular canals — balance)","Skin as receptor: Meissner's corpuscles (touch), Pacinian corpuscles (pressure), Ruffini endings (warmth), Krause's end bulbs (cold), free nerve endings (pain)"], objectives:["Describe neuron structure and types","Explain nerve impulse transmission and synaptic transmission","Describe the reflex arc","Describe structure and function of the eye and ear","Explain accommodation and eye defects","Describe receptors in skin"], prerequisites:["bio_1"], cross_subject_links:["phy_9","bio_8"] },
      { id:"bio_8", topic:"Hormones and Endocrine System", section:"Section B", subtopics:["Endocrine system: ductless glands, secrete hormones into blood","Pituitary gland (master gland): GH (growth hormone), FSH, LH, ADH, oxytocin, TSH, ACTH","Thyroid gland: thyroxine (controls metabolic rate, needs iodine); deficiency → goitre","Adrenal gland: adrenaline (fight/flight — increases heart rate, blood glucose, pupil dilation); cortisol (stress response)","Pancreas: islets of Langerhans — insulin (β cells, lowers blood glucose), glucagon (α cells, raises blood glucose)","Gonads: ovaries (oestrogen, progesterone), testes (testosterone)","Comparison: nervous vs hormonal control — speed (nerve: fast; hormone: slow), duration (nerve: short; hormone: long), specificity","Plant hormones (phytohormones): auxins (IAA) — phototropism, gravitropism, apical dominance; gibberellins — stem elongation, germination; abscisic acid (ABA) — dormancy, stomatal closure; ethylene — fruit ripening","Applications of plant hormones: rooting powder (auxins), seedless fruit (gibberellins), weedkillers (high auxin concentration)"], objectives:["Name endocrine glands and their hormones","Describe functions of major hormones","Compare nervous and hormonal control in table form","Explain blood glucose regulation by insulin and glucagon","Describe effects and applications of plant hormones"], prerequisites:["bio_6","bio_7"], cross_subject_links:["bio_6","bio_9"] },
      { id:"bio_9", topic:"Reproduction", section:"Section B", subtopics:["Asexual reproduction: binary fission (bacteria, Amoeba), budding (yeast, Hydra), spore formation (fungi, mosses), vegetative propagation (runners-strawberry, bulbs-onion, rhizomes-ginger, suckers-banana, cuttings)","Advantages of asexual: faster, energy-efficient; disadvantages: no genetic variation","Sexual reproduction: involves fusion of gametes → zygote","Reproduction in flowering plants: pollination (wind vs insect), fertilisation (double fertilisation in angiosperms: one sperm → egg = zygote; one sperm + polar nuclei = endosperm)","Fruits and seeds: dispersal mechanisms (wind, water, animals, self)","Human male reproductive system: testes (sperm production and testosterone), epididymis, vas deferens, seminal vesicles, prostate gland, penis, urethra","Human female reproductive system: ovaries (ova production, oestrogen, progesterone), fallopian tubes, uterus (endometrium), cervix, vagina","Menstrual cycle (28 days): menstruation (days 1-5), follicular phase (FSH → follicle → oestrogen), ovulation (LH surge, day 14), luteal phase (corpus luteum → progesterone)","Fertilisation: in fallopian tube; implantation in uterus","Pregnancy: embryo, foetus, placenta (exchange of materials, hormones), amnion","Parturition: oxytocin stimulates contractions","Methods of birth control: barrier (condom, diaphragm), hormonal (pill, injection), IUD, abstinence, sterilisation"], objectives:["Compare asexual and sexual reproduction","Describe asexual reproduction methods with examples","Describe pollination and double fertilisation","Describe human reproductive systems","Trace the menstrual cycle","Explain fertilisation, implantation and pregnancy","Identify methods of birth control"], prerequisites:["bio_8"], cross_subject_links:["bio_10","bio_8"] },
      { id:"bio_10", topic:"Genetics and Heredity", section:"Section C", subtopics:["Mendelian genetics: Gregor Mendel's work on pea plants","Law of segregation: alleles separate during gamete formation","Law of independent assortment: genes on different chromosomes assort independently","Terms: gene, allele, locus, genotype, phenotype, dominant (uppercase), recessive (lowercase), homozygous (TT/tt), heterozygous (Tt)","Monohybrid cross: Tt × Tt → 3 tall : 1 short (3:1 ratio), using Punnett square","Test cross: unknown dominant phenotype × recessive → determines if TT or Tt","Dihybrid cross: TtRr × TtRr → 9:3:3:1 ratio","Codominance: both alleles expressed, e.g. roan cattle (RR × RR → RR roan), sickle cell trait","Incomplete dominance: intermediate phenotype, e.g. red × white → pink","Sex determination: females XX, males XY","Sex-linked inheritance: X-linked recessive e.g. haemophilia (X^H X^h × X^H Y), colour blindness (X^C X^c × X^C Y)","ABO blood group genetics: Iᴬ and Iᴮ codominant, i recessive","DNA structure: double helix, nucleotides (deoxyribose, phosphate, base), base pairing (A-T, G-C)","DNA replication and protein synthesis (transcription and translation) — overview","Mutation: gene mutations (point mutations, e.g. sickle cell anaemia), chromosomal mutations (extra chromosome, e.g. Down syndrome trisomy 21)","Causes of mutation: radiation (UV, X-rays), chemical mutagens, errors in replication","Genetic disorders: sickle cell disease, albinism, cystic fibrosis, Down syndrome"], objectives:["State and apply Mendel's two laws","Perform monohybrid and dihybrid crosses using Punnett squares","Distinguish dominance, codominance and incomplete dominance","Explain sex determination and sex-linked inheritance","Describe ABO blood group genetics","Describe DNA structure","Define mutations and give examples with causes"], prerequisites:["bio_1","bio_9"], cross_subject_links:["bio_1","bio_9","chem_12"] },
      { id:"bio_11", topic:"Evolution", section:"Section C", subtopics:["Lamarck's theory: use and disuse of organs; inheritance of acquired characteristics — now discredited","Darwin's theory of natural selection: variation exists in populations; resources limited → struggle; individuals with favourable variations survive and reproduce (survival of the fittest); favourable traits inherited → gradual change over generations","Evidence for evolution: fossil record (sedimentary rocks show progression), comparative anatomy (homologous structures — same origin, different function, e.g. vertebrate forelimbs; analogous structures — different origin, same function, e.g. wings of birds and insects), comparative embryology (vertebrate embryos similar at early stages), geographical distribution (biogeography), molecular biology (DNA, protein similarities)","Hardy-Weinberg equilibrium: p² + 2pq + q² = 1 (allele frequencies constant without selection)","Evolution in action: antibiotic resistance in bacteria, industrial melanism in peppered moth","Adaptation: structural, physiological, behavioural adaptations to environment","Speciation: isolation → genetic divergence → new species"], objectives:["Compare Lamarck's and Darwin's theories of evolution","Cite and interpret evidence for evolution","Explain natural selection with examples","Explain adaptations","Describe speciation process"], prerequisites:["bio_2","bio_10"], cross_subject_links:["bio_2","bio_12"] },
      { id:"bio_12", topic:"Ecology", section:"Section D", subtopics:["Ecology: study of organisms and their environment","Ecosystem: biotic (living) + abiotic (non-living: temperature, rainfall, pH, light, humidity, wind) components","Habitat, niche, population, community, ecosystem, biome","Food chains: producer → primary consumer → secondary consumer → tertiary consumer","Food webs: interconnected food chains","Trophic levels and energy transfer: only 10% energy transferred per level (10% rule)","Ecological pyramids: pyramid of numbers, biomass, energy","Carbon cycle: photosynthesis (CO₂ → organic), respiration (organic → CO₂), decomposition, combustion","Nitrogen cycle: N₂ → nitrogen fixation (Rhizobium, lightning) → nitrates → plants → animals → decomposition → denitrification → N₂","Water cycle: evaporation, transpiration, condensation, precipitation, runoff","Population growth: J-curve (exponential), S-curve (logistic), carrying capacity K","Population factors: natality, mortality, immigration, emigration","Biomes: tropical rainforest, savanna, desert, temperate, tundra, aquatic (freshwater and marine)","Ecological succession: primary (bare rock) and secondary (after disturbance) → climax community","Conservation of resources: biodiversity, forests, water, soil, wildlife","Environmental pollution: air pollution (CO, SO₂, NOₓ, particulates — smog, acid rain), water pollution (sewage, industrial waste, oil spills), soil pollution (pesticides, fertilisers)","Effects of pollution: ozone depletion (CFCs), global warming (CO₂, CH₄), eutrophication"], objectives:["Define ecology and ecosystem","Construct and interpret food webs and chains","Apply the 10% energy rule","Describe carbon, nitrogen and water cycles","Explain population growth curves","Describe major biomes","Explain ecological succession","Describe types of pollution and conservation measures"], prerequisites:["bio_2","bio_3"], cross_subject_links:["bio_11","chem_10","geo_5"] },
      { id:"bio_13", topic:"Microorganisms and Disease", section:"Section D", subtopics:["Types: bacteria (prokaryotes, various shapes: cocci, bacilli, spirilla), viruses (non-cellular, nucleic acid + protein coat), fungi (moulds and yeasts), protozoa (Plasmodium, Trypanosoma, Amoeba, Entamoeba)","Beneficial roles: decomposition (recycling), nitrogen fixation (Rhizobium), fermentation (yoghurt, bread, alcohol), antibiotic production (Penicillium → penicillin), sewage treatment","Common diseases: malaria (Plasmodium falciparum, Anopheles mosquito vector, symptoms: fever, chills), cholera (Vibrio cholerae, contaminated water, rice-water stools), typhoid (Salmonella typhi, food/water), tuberculosis TB (Mycobacterium tuberculosis, airborne), HIV/AIDS (retrovirus, attacks CD4 T-cells, transmitted sexually/blood/mother-child)","Transmission: vector, contact, airborne, contaminated food/water","Prevention: immunisation, personal hygiene, environmental sanitation, vector control","Immune response: non-specific (phagocytosis, inflammation, interferon), specific (antibody-mediated B-cells, cell-mediated T-cells)","Antigens and antibodies: antigen-antibody reaction, agglutination","Vaccination: active immunisation (weakened/dead pathogen → memory cells), passive (antibodies given directly)","Types of vaccines: live attenuated, killed, toxoid, subunit, mRNA","Public health measures: water treatment, sewage disposal, food hygiene, health education"], objectives:["Classify microorganisms with examples","Describe beneficial roles of microorganisms","Explain transmission and symptoms of malaria, cholera, typhoid, TB, HIV/AIDS","Describe immune response — non-specific and specific","Explain vaccination mechanisms","Describe public health measures"], prerequisites:["bio_2","bio_4"], cross_subject_links:["bio_11","bio_4","chem_10"] }
    ]
  },

  government: {
    display_name: "Government",
    code: "GOV",
    general_objectives: [
      "Appreciate the meaning of Government",
      "Analyse the framework and institutions of Government",
      "Appreciate democratic governance principles and their application in Nigeria",
      "Explain citizenship duties and obligations",
      "Understand the process of political development in Nigeria",
      "Evaluate political development and governance problems in Nigeria",
      "Understand determinants of foreign policy as they relate to Nigeria",
      "Assess Nigeria's role in international organisations"
    ],
    topics: [
      { id:"gov_1", topic:"Definition and Scope of Government", subtopics:["Government as an institution of the state","Characteristics: sovereignty, population, territory, government, recognition","Functions: maintenance of law and order, defence, social services, economic management, representation","Government as a process of governing","Government as academic field of study"], objectives:["Define government as an institution","State characteristics of government","Explain functions of government","Distinguish government from state"], prerequisites:[], cross_subject_links:["gov_2","gov_4"] },
      { id:"gov_2", topic:"Basic Concepts of Government", subtopics:["Power: ability to control behaviour, enforce obedience","Influence: persuasion without coercion","Authority: legitimate power, types (traditional, charismatic, legal-rational)","Legitimacy: acceptance of authority as rightful","Sovereignty: supreme power, internal and external sovereignty","Society: collection of people with shared norms","State: political organisation with government, people, territory, sovereignty","Nation: people with shared culture, history, language","Nation-state: coincidence of nation and state","Political socialisation: how individuals acquire political values","Political participation: voting, activism, campaigning","Political culture: shared values and beliefs about politics"], objectives:["Define and distinguish power, influence and authority","Explain types of authority","Define sovereignty and its forms","Distinguish society, state, nation and nation-state","Explain political socialisation and participation"], prerequisites:["gov_1"], cross_subject_links:["gov_3","gov_7"] },
      { id:"gov_3", topic:"Forms of Government", subtopics:["Monarchy: absolute monarchy (unlimited power) vs constitutional monarchy (limited by constitution)","Aristocracy: rule by noble/privileged class","Oligarchy: rule by small group (wealth/military)","Autocracy: dictatorship (one person) and totalitarianism (total state control of life)","Republicanism: head of state elected, not hereditary","Democracy: government by the people — direct (ancient Athens) vs representative/indirect","Liberal democracy: features (free elections, rule of law, civil liberties, separation of powers, independent judiciary)","Social democracy: welfare state, mixed economy","Theocracy: rule by religious law","Characteristics, merits and demerits of each form"], objectives:["Identify and define different forms of government","Distinguish absolute from constitutional monarchy","Compare democracy with autocracy","Describe features of liberal democracy","Evaluate merits and demerits of forms of government"], prerequisites:["gov_2"], cross_subject_links:["gov_4","gov_7"] },
      { id:"gov_4", topic:"Arms of Government", subtopics:["Legislature: unicameral (one chamber, e.g. Denmark) vs bicameral (two chambers, e.g. Nigeria — Senate and House of Representatives)","Legislative functions: law-making, oversight of executive, representation, financial control","Executive: presidential (head of state = head of government, e.g. Nigeria, USA) vs parliamentary (Prime Minister as head of government, ceremonial head of state, e.g. UK)","Executive functions: policy implementation, administration, treaty-making, appointment","Judiciary: courts hierarchy — Supreme Court, Court of Appeal, Federal/State High Courts, Magistrate Courts, Customary/Area Courts","Judicial functions: interpretation of law, settlement of disputes, protection of rights, constitutional review","Independence of judiciary: security of tenure, adequate remuneration, judicial immunity","Doctrine of separation of powers: Montesquieu — each arm independent","Checks and balances: legislature checks executive (oversight), executive checks legislature (veto), judiciary checks both (judicial review)"], objectives:["Describe structure and functions of legislature, executive and judiciary","Distinguish unicameral from bicameral legislature","Compare presidential and parliamentary executive","Explain independence of the judiciary","Explain separation of powers and checks and balances with Nigerian examples"], prerequisites:["gov_3"], cross_subject_links:["gov_5","gov_9"] },
      { id:"gov_5", topic:"Constitutions", subtopics:["Definition: fundamental law of the land","Written constitution: codified in a document, e.g. Nigeria 1999, USA 1787","Unwritten constitution: conventions and statutes, e.g. UK","Rigid constitution: difficult to amend, requires special majority, e.g. USA, Nigeria","Flexible constitution: easily amended, e.g. UK","Federal constitution: power divided between centre and states, e.g. Nigeria","Unitary constitution: power centralised, e.g. France","Features of a good constitution: clarity, brevity, flexibility, comprehensiveness, protection of rights","Constitutional development in Nigeria: Clifford Constitution 1922 (first elections), Richards 1946, Macpherson 1951, Lyttleton 1954 (federalism), Independence 1960, Republican 1963, 1979 (presidential), 1999 (current)","Chapter IV — Fundamental Human Rights: right to life, dignity, liberty, fair hearing, privacy, freedom of thought/expression/assembly/movement, freedom from discrimination"], objectives:["Define and classify constitutions","Distinguish written from unwritten, rigid from flexible, federal from unitary","Describe features of a good constitution","Trace constitutional development in Nigeria from 1922 to 1999","Enumerate fundamental human rights in Nigerian constitution"], prerequisites:["gov_4"], cross_subject_links:["gov_6","gov_9"] },
      { id:"gov_6", topic:"Electoral Systems and Process", subtopics:["Electoral system: method of translating votes into seats","First-past-the-post (simple plurality): candidate with most votes wins, e.g. UK, USA","Proportional representation: seats proportional to votes, e.g. Germany, Israel","Alternative vote / preferential voting","Mixed systems","INEC (Independent National Electoral Commission): establishment under 1999 constitution, Section 153","INEC functions: voter registration, organising elections, delimitation of constituencies, registration of parties","Electoral process in Nigeria: voter registration (PVC), campaigns, accreditation, voting (BVAS), collation, announcement","Electoral malpractice: rigging, ballot stuffing, violence, voter intimidation, multiple voting","Problems of elections in Nigeria: poverty, illiteracy, ethnicity, religion, violence","Electoral reforms: Uwais Commission, IEDPU, BVAS technology"], objectives:["Compare first-past-the-post with proportional representation","Describe INEC and its functions","Trace the electoral process in Nigeria","Identify types of electoral malpractice","Suggest reforms to improve elections"], prerequisites:["gov_5"], cross_subject_links:["gov_7"] },
      { id:"gov_7", topic:"Political Parties and Pressure Groups", subtopics:["Political party: organised group seeking political power through elections","Functions: aggregating interests, recruiting leaders, political socialisation, forming government","One-party system: single legal party, e.g. former USSR, North Korea","Two-party system: two dominant parties alternate, e.g. USA (Republicans/Democrats), UK (Conservative/Labour)","Multi-party system: many parties compete, e.g. Germany, France, Nigeria","History of political parties in Nigeria: NCNC (Nnamdi Azikiwe), AG (Obafemi Awolowo), NPC (Ahmadu Bello) — pre-independence; UPN, NPP, GNPP, PRP, NPN — Second Republic; SDP vs NRC — Third Republic; PDP, APC, NNPP — current Fourth Republic","Pressure groups: definition — organised group that seeks to influence government without seeking power","Types: sectional/interest groups (trade unions, professional bodies) and promotional/cause groups (Amnesty International, environmental groups)","Methods: lobbying, petitions, protest, strikes, media campaigns","Differences from political parties: don't contest elections, narrower focus"], objectives:["Define and state functions of political parties","Compare party systems with examples","Trace history of political parties in Nigeria","Define pressure groups and distinguish from political parties","Identify types and methods of pressure groups"], prerequisites:["gov_6"], cross_subject_links:["gov_8","gov_9"] },
      { id:"gov_8", topic:"Federal and Unitary Systems", subtopics:["Federalism: division of powers between central government and federating units","Features: written constitution, dual government, division of powers, independent judiciary, bicameral legislature","Merits: unity in diversity, accommodates heterogeneous society, prevents concentration of power","Demerits: expensive, slow decision-making, conflict between levels","Unitary system: power concentrated at centre, local units subordinate","Features: single legislature, local governments created and can be abolished by centre","Merits: strong central authority, uniform policy, cheaper","Demerits: ignores local differences, tyranny risk","Confederation: voluntary association, central government depends on states","Nigerian federalism: evolution from 1954, 36 states + FCT, 774 LGAs","Revenue allocation in Nigeria: derivation principle, horizontal and vertical allocation, RMAFC","Federal character principle: ensuring representation of all groups","Problems: resource control conflicts, security challenges, agitations for restructuring"], objectives:["Define federalism and list its features","Compare federal and unitary systems","Evaluate merits and demerits of federalism","Describe Nigerian federalism and revenue allocation","Identify problems of federalism in Nigeria"], prerequisites:["gov_5"], cross_subject_links:["gov_5","gov_9"] },
      { id:"gov_9", topic:"Nigerian Government and Politics — Historical Development", subtopics:["Pre-colonial government: Yoruba (Oba with council of chiefs, Ogboni society), Igbo (village assembly, acephalous), Hausa-Fulani (emirate system — Islamic, hierarchical), Benin (centralised monarchy)","Indirect rule: Lord Lugard, using existing chiefs as intermediaries, worked in north (hierarchical) but failed in south (no central authority)","Warrant chiefs as solution in Igboland","Nationalist movement: Herbert Macaulay (father of nationalism), NCNC, Anthony Enahoro's motion 1953, independence 1960","First Republic (1960-1966): parliamentary, NPC-NCNC coalition, Balewa as PM","First military coup (Jan 1966, Ironsi) and counter-coup (July 1966, Gowon)","Civil War (1967-1970): Biafra secession, federal victory, 'no victor, no vanquished'","Murtala/Obasanjo (1975-79): states creation, transition to civil rule","Second Republic (1979-1983): presidential, Shagari NPN, economic problems","Buhari/Idiagbon coup 1983, then Babangida (1985-1993)","June 12, 1993: Abiola wins election, annulled by Babangida — political crisis","Abacha (1993-1998), Abubakar transition (1998-1999)","Fourth Republic (1999-present): 1999 constitution, PDP dominance until 2015, APC since 2015"], objectives:["Describe pre-colonial political systems in Nigeria","Explain indirect rule and its successes/failures","Trace nationalist movement","Analyse First and Second Republics","Evaluate military regimes and their impact","Explain June 12 and return to democracy"], prerequisites:["gov_4","gov_5"], cross_subject_links:["gov_5","gov_10"] },
      { id:"gov_10", topic:"International Relations and Organisations", subtopics:["International relations: study of relations between states","National interest: what a state seeks to protect in foreign relations","Foreign policy: guidelines for relating with other states","Nigeria's foreign policy objectives: peace and security, economic development, African unity, promotion of democracy and human rights","Nigeria's foreign policy principles: non-interference, respect for sovereignty, peaceful settlement","Africa as centrepiece of Nigeria's foreign policy","United Nations (UN): formed 1945, 193 members, headquarters New York; organs: General Assembly, Security Council (5 permanent members with veto: USA, UK, France, Russia, China), Secretariat, ICJ, Economic and Social Council, Trusteeship Council","UN specialised agencies: WHO, UNESCO, FAO, UNICEF, ILO, IMF, World Bank","African Union (AU): formed 2002, headquarters Addis Ababa; objectives: peace, unity, development; organs: Assembly, Executive Council, Commission, PAP","ECOWAS (Economic Community of West African States): formed 1975, Lagos Treaty, 15 member states, headquarters Abuja; objectives: economic integration, free movement, peace","ECOMOG: ECOWAS military force, interventions in Liberia, Sierra Leone","Commonwealth of Nations: 54 members, voluntary, former British territories, headquarters London","International law: treaties, customary international law, ICJ rulings; binding but lacks enforcement mechanism"], objectives:["Define international relations and foreign policy","Explain Nigeria's foreign policy objectives and principles","Describe structure and functions of UN, AU and ECOWAS","Evaluate Nigeria's role in international organisations","Explain sources and limitations of international law"], prerequisites:["gov_8"], cross_subject_links:["eco_8"] }
    ]
  },

  economics: {
    display_name: "Economics",
    code: "ECO",
    general_objectives: [
      "Demonstrate knowledge of basic economic concepts and their applications",
      "Identify structures, operations and roles of economic units and institutions",
      "Describe major economic activities: production, distribution and consumption",
      "Identify and appraise basic economic problems of society",
      "Develop competence to proffer solutions to economic problems"
    ],
    topics: [
      { id:"eco_1", topic:"Economics as a Science — Basic Concepts", subtopics:["Definition of economics: allocation of scarce resources to satisfy unlimited wants (Robbins)","Wants: unlimited, material and non-material","Scarcity: resources are limited relative to wants","Choice: selecting the best alternative","Scale of preference: ranking of wants in order of priority","Opportunity cost: real cost = next best alternative forgone","Rationality: decision-making to maximise utility or profit","Production: creation of utility — land, labour, capital, entrepreneur","Distribution: allocation of income to factors of production","Consumption: utilisation of goods and services","Economic problems: what to produce, how to produce, for whom to produce","Production Possibility Frontier (PPF): maximum combinations of two goods with given resources; shows opportunity cost; points inside = inefficiency, outside = unattainable, on curve = efficient","Economic systems: free market/capitalism (private ownership, price mechanism), centrally planned/socialism (state ownership, central planning), mixed economy (elements of both)","Merits and demerits of each system"], objectives:["Define economics and key concepts","Apply concepts of scarcity, choice and opportunity cost","Interpret PPF diagrams","Compare economic systems"], prerequisites:[], cross_subject_links:["mat_7","mat_13"] },
      { id:"eco_2", topic:"Demand, Supply and Market Equilibrium", subtopics:["Demand: willingness and ability to pay; law of demand — inverse relationship between price and quantity demanded","Demand schedule and demand curve (downward sloping)","Determinants of demand: income, price of related goods, taste, population, expectations","Change in quantity demanded vs change in demand (shift of curve)","Elasticity of demand (PED): % change in Qd / % change in P","PED values: elastic (>1), inelastic (<1), unit elastic (=1), perfectly elastic (∞), perfectly inelastic (0)","Income elasticity of demand (YED): normal goods (positive), inferior goods (negative), luxury goods (>1)","Cross elasticity of demand (XED): substitutes (positive), complements (negative)","Supply: willingness and ability to supply; law of supply — direct relationship","Supply schedule and supply curve (upward sloping)","Determinants of supply: input prices, technology, number of producers, government policy, expectations","Price elasticity of supply (PES): factors: time, substitutability, spare capacity","Market equilibrium: where Qd = Qs, determined by demand and supply curves","Effects of shifts in demand/supply on equilibrium price and quantity","Price controls: maximum price (price ceiling, leads to shortage), minimum price (price floor, leads to surplus)","Applications: agricultural support prices, minimum wage, rent control"], objectives:["State and explain laws of demand and supply","Draw and interpret demand and supply curves","Calculate PED, YED and XED","Determine equilibrium price and quantity graphically","Explain effects of price controls"], prerequisites:["eco_1"], cross_subject_links:["mat_7","mat_13","eco_3"] },
      { id:"eco_3", topic:"Theory of Production and Costs", subtopics:["Factors of production: land (natural resources, reward = rent), labour (human effort, reward = wages), capital (man-made resources, reward = interest), entrepreneur (organiser/risk-taker, reward = profit)","Production function: Q = f(L, K)","Short-run: at least one fixed factor (usually capital)","Long-run: all factors variable","Law of variable proportions / diminishing returns: adding variable factor to fixed factor → total product (TP) rises at decreasing rate, marginal product (MP) eventually falls, AP falls","Three stages of production","Returns to scale (long-run): increasing returns (doubling inputs > doubles output), constant returns, decreasing/diminishing returns to scale","Economies of scale: internal (technical, managerial, financial, marketing, risk-bearing) and external","Diseconomies of scale: managerial problems, communication breakdown","Fixed costs (FC): do not vary with output — rent, insurance","Variable costs (VC): vary with output — labour, raw materials","Total cost TC = FC + VC","Average fixed cost AFC = FC/Q (falls as Q rises)","Average variable cost AVC = VC/Q (U-shaped)","Average total cost ATC = TC/Q (U-shaped)","Marginal cost MC = ΔTC/ΔQ (U-shaped, intersects AVC and ATC at minimum)","Revenue: Total Revenue TR = P × Q, Average Revenue AR = TR/Q = P, Marginal Revenue MR = ΔTR/ΔQ","Profit maximisation: MC = MR","Types of profit: normal profit (zero economic profit), supernormal profit, subnormal profit"], objectives:["Identify and describe factors of production and their rewards","Explain law of diminishing returns with numerical example","Distinguish short-run from long-run","Calculate FC, VC, TC, AFC, AVC, ATC, MC from data","Explain economies and diseconomies of scale","Explain profit maximisation condition MC = MR"], prerequisites:["eco_2"], cross_subject_links:["mat_12","eco_4"] },
      { id:"eco_4", topic:"Market Structures", subtopics:["Perfect competition: features (many buyers/sellers, homogeneous product, perfect information, free entry/exit, price takers); price = MC = MR = AR; long-run normal profit only","Monopoly: single seller, unique product, high barriers to entry; price maker; price > MC; economic profit possible long-run; sources of monopoly power (patent, economies of scale, resource ownership, government franchise)","Price discrimination in monopoly: first, second and third degree","Merits of monopoly: economies of scale, R&D investment; demerits: higher prices, restricted output, inefficiency","Monopolistic competition: many sellers, differentiated products, relatively free entry; non-price competition (branding, advertising); short-run supernormal profit, long-run normal profit","Oligopoly: few dominant firms, high barriers, interdependence; price rigidity (kinked demand curve); price leadership; cartels (e.g. OPEC)","Collusion in oligopoly: explicit (cartel) and tacit","Monopsony: single buyer of a factor (e.g. a firm in a one-company town)","Comparing market structures: price, output, efficiency, profitability"], objectives:["Describe features of each market structure","Explain price and output determination in each","Evaluate efficiency and social desirability","Distinguish price discrimination types","Explain oligopolistic behaviour and cartels"], prerequisites:["eco_3"], cross_subject_links:["eco_2","eco_3"] },
      { id:"eco_5", topic:"National Income", subtopics:["National income: total money value of goods and services produced in an economy in a year","GDP (Gross Domestic Product): total output produced within a country's borders","GNP (Gross National Product): GDP + net income from abroad","NNP (Net National Product): GNP - depreciation/capital consumption","National income at factor cost = GDP at market prices - indirect taxes + subsidies","Per capita income = National income / Population","Methods of measurement: expenditure method (C + I + G + (X-M)), income method (wages + rent + interest + profit), output/value-added method","Problems of measurement in Nigeria: subsistence sector, informal economy, unreliable data, double counting","Uses of national income statistics: standard of living comparison, economic planning, international comparisons","Standard of living indicators: GDP per capita, Human Development Index (HDI = income + education + life expectancy)","Economic growth: % change in real GDP","Economic development: structural change, improved welfare — broader than growth","Income inequality: Lorenz curve, Gini coefficient"], objectives:["Define GDP, GNP and NNP and state relationships","Describe three methods of national income measurement","Identify problems of national income measurement in Nigeria","Compare standards of living using income data","Distinguish economic growth from development"], prerequisites:["eco_3"], cross_subject_links:["eco_9","mat_13"] },
      { id:"eco_6", topic:"Money, Banking and Financial Institutions", subtopics:["Barter: limitations — double coincidence of wants, indivisibility, no store of value","Money: definition, characteristics (portability, durability, divisibility, acceptability, scarcity, uniformity, stability)","Functions of money: medium of exchange, unit of account (measure of value), store of value, standard of deferred payment","Types of money: commodity (gold, cowries), paper (notes), bank (cheques), near money","Commercial banks: accept deposits (current, savings, fixed), grant loans, create credit","Credit creation (money multiplier): 1/reserve ratio","Central Bank of Nigeria (CBN): banker to government, banker to banks, issuer of currency, lender of last resort, implements monetary policy, manages external reserves","Monetary policy: instruments — cash reserve ratio (CRR), liquidity ratio, open market operations (OMO), discount rate (MPR), selective credit controls","Expansionary monetary policy: lowers MPR, reduces CRR → more credit → stimulus","Contractionary monetary policy: raises MPR, increases CRR → less credit → combats inflation","Development banks: Bank of Industry, Bank of Agriculture, NEXIM","Insurance: risk-sharing, types (life, motor, fire, marine), premium, indemnity","Stock exchange: Nigerian Exchange Group (NGX), primary market (IPO), secondary market, functions","Capital market vs money market"], objectives:["Explain limitations of barter and advantages of money","State functions of money","Explain functions of commercial banks and credit creation","Describe functions and instruments of CBN","Distinguish monetary policy instruments","Describe other financial institutions"], prerequisites:["eco_1"], cross_subject_links:["eco_7","eco_8"] },
      { id:"eco_7", topic:"Public Finance", subtopics:["Government revenue: tax revenue (direct taxes: personal income tax, companies income tax, capital gains tax; indirect taxes: VAT, customs duty, excise duty) and non-tax revenue (rents, fees, fines, grants, borrowing)","Canons of a good tax (Adam Smith): certainty, convenience, economy, equity (fairness)","Principles of taxation: ability to pay principle, benefit principle","Types of tax: progressive (higher income, higher %), proportional (same %), regressive (lower income, higher %)","Tax incidence: statutory (on whom tax is levied) vs economic (who bears the burden)","Tax evasion (illegal) vs tax avoidance (legal minimisation)","Tax in Nigeria: FIRS (Federal Inland Revenue Service), SIRS (state)","Government expenditure: recurrent (wages, debt service) vs capital (infrastructure, schools)","Budget: planned government revenue and expenditure; balanced, surplus, deficit","Budget cycle in Nigeria: preparation, presentation to NASS, passage, assent, implementation, audit","Deficit budget: government spends more than revenue, financed by borrowing","Public debt: internal (borrowing from domestic sources) vs external (from foreign governments/IMF/World Bank)","Debt servicing and burden on Nigeria","Fiscal policy: government use of taxation and spending to influence economy — expansionary (deficit spending) or contractionary (surplus)"], objectives:["Identify and distinguish government revenue sources","State canons of a good tax","Distinguish types of taxes and their incidence","Describe types of government expenditure","Explain balanced, surplus and deficit budgets","Explain fiscal policy and its instruments"], prerequisites:["eco_6"], cross_subject_links:["eco_8","gov_4"] },
      { id:"eco_8", topic:"International Trade", subtopics:["International trade: exchange of goods and services between countries","Basis of trade: absolute advantage (one country more efficient overall) vs comparative advantage (one country relatively more efficient — still benefits from trade)","Terms of trade: ratio of export prices to import prices; improvement vs deterioration","Balance of trade: exports - imports (visible goods only)","Balance of payments: comprehensive record of all economic transactions — current account (visible trade, invisible trade, transfers), capital account, financial account","Favourable vs unfavourable balance of payments","Trade barriers: tariffs (tax on imports), quotas (quantity limits), embargoes (bans), subsidies (to domestic producers), exchange controls, administrative barriers","Arguments for protection: infant industry, employment, strategic industries, revenue, retaliation","Arguments for free trade: comparative advantage, lower prices, competition","Trade liberalisation: GATT → WTO (World Trade Organisation) 1995","Regional economic integration: ECOWAS (free trade area), AFCFTA","Exchange rate: price of one currency in terms of another","Fixed exchange rate: pegged to another currency","Floating exchange rate: determined by market forces","Managed float: central bank intervenes","Devaluation: deliberate reduction of fixed exchange rate → cheaper exports, more expensive imports","Effects of devaluation: depends on elasticity","IMF (International Monetary Fund): founded 1944, provides short-term balance of payments support, structural adjustment","World Bank: long-term development lending","Nigeria and IMF: SAP (Structural Adjustment Programme) 1986 — devaluation, deregulation, privatisation — mixed outcomes"], objectives:["Explain absolute and comparative advantage with examples","Define and distinguish balance of trade from balance of payments","Identify and evaluate trade barriers","Compare fixed and floating exchange rates","Explain devaluation and its effects","Describe functions of IMF and World Bank"], prerequisites:["eco_5","eco_6"], cross_subject_links:["gov_10","eco_9"] },
      { id:"eco_9", topic:"Economic Development and the Nigerian Economy", subtopics:["Economic development: sustained increase in living standards, structural change, reduction in poverty, inequality and unemployment","HDI: combined education (literacy + enrolment), health (life expectancy), income (GNI per capita)","Characteristics of developing countries: low income, low industrialisation, high population growth, dependence on primary commodities, capital deficiency, low human development","Problems of development in Nigeria: poverty, unemployment, inflation, corruption, inadequate infrastructure, debt, oil dependence (Dutch disease)","Poverty in Nigeria: absolute poverty (below poverty line), relative poverty; NAPEP, social investment programmes","Unemployment types: frictional, structural, cyclical, seasonal, disguised (mainly agriculture)","Inflation: persistent rise in general price level; demand-pull, cost-push; effects (redistribution, uncertainty, balance of payments); control (monetary and fiscal policy)","Agriculture in Nigeria: importance (food, employment, raw materials, forex); problems (traditional methods, land tenure, poor roads, poor storage); policies (Green Revolution, Operation Feed the Nation, ADPs)","Industrialisation: cottage industries, small-scale, large-scale; ISI (import substitution) vs export-led; NEEDS, ERGP, Economic Sustainability Plan","Petroleum sector: crude oil reserves, production by NNPC and IOCs (Shell, Chevron, TotalEnergies, ExxonMobil); role in budget (over 70% federal revenue); petrochemicals; PIB → Petroleum Industry Act 2021; OPEC membership since 1971","National development plans: 1st (1962-68), 2nd (1970-74), 3rd (1975-80), 4th (1981-85); NEEDS, Vision 2010, Vision 20:2020","Population and development: high growth rate (2.7%), dependency ratio, demographic dividend","Foreign aid and investment: benefits vs dependency; FDI in Nigeria"], objectives:["Distinguish economic growth from development","Describe characteristics of developing countries","Identify problems of development in Nigeria","Explain role of agriculture and petroleum in Nigerian economy","Evaluate Nigeria's development plans","Describe and explain unemployment and inflation types and control"], prerequisites:["eco_5","eco_6","eco_7"], cross_subject_links:["geo_7","gov_9","eco_8"] }
    ]
  },

  geography: {
    display_name: "Geography",
    code: "GEO",
    general_objectives: [
      "Handle and interpret topographical maps, photographs, statistical data and basic field survey",
      "Demonstrate knowledge of man's physical and human environment with reference to Nigeria and Africa",
      "Show understanding of the interrelationship between man and his environment",
      "Apply geographical concepts, skills and principles to solving problems"
    ],
    topics: [
      { id:"geo_1", topic:"Practical Geography — Maps and Field Techniques", subtopics:["Types of maps: topographic maps, atlas maps, sketch maps, choropleth maps, isoline maps, flow maps","Scale: statement scale (1:50,000), linear/bar scale, representative fraction","Measurement of distances: straight-line, curved (thread), area by grid squares","Map reduction and enlargement: maintaining proportions","Directions: cardinal (N,S,E,W) and intercardinal; compass bearing (0-360°)","Gradients: G = vertical interval / horizontal equivalent","Map reading: contour lines (closer = steeper), spot heights, trigonometric points","Cross profiles: drawing a cross-section from contour lines","Intervisibility: whether two points can see each other (check for obstacles)","Recognition of physical features on maps: hills, valleys, rivers, ridges, spurs, cliffs","Recognition of human features: settlements, roads, railways, land use","Statistical data: tables, bar graphs, line graphs, pie charts, scatter plots","Interpretation of photographs: oblique aerial, vertical aerial, ground level","Geographic Information System (GIS): definition (computer system for geographic data), components (hardware, software, data, people, procedure), uses (urban planning, disaster management, routing)","Elementary surveying: chain surveying, prismatic compass survey","Field work: planning, data collection, analysis, presentation, report"], objectives:["Define and use map scales","Measure distances and areas on maps","Determine bearings and directions","Draw and interpret cross-profiles","Recognise and describe physical and human features on maps","Interpret statistical graphs and photographs","Explain components and uses of GIS"], prerequisites:[], cross_subject_links:["geo_2","mat_13"] },
      { id:"geo_2", topic:"The Earth and Internal Structure", subtopics:["Earth in solar system: 3rd planet from sun, one natural satellite (moon), axis tilted 23.5°","Earth's rotation: 24 hours, causes day/night, influences wind and ocean currents (Coriolis effect)","Earth's revolution: 365¼ days, causes seasons, aphelion (July) vs perihelion (January)","Equinoxes: March 21, September 23 (equal day and night)","Solstices: June 21 (summer solstice N hemisphere) and December 21","Structure of the earth: inner core (solid iron-nickel), outer core (liquid), mantle (silicate rocks, convection currents), crust (oceanic — denser, 5-10km; continental — less dense, 25-90km)","Plate tectonics: lithosphere divided into plates; convection in mantle drives plate movement","Convergent boundaries: plates collide → mountains (Himalayas), subduction → trenches, volcanoes","Divergent boundaries: plates apart → mid-ocean ridges, rift valleys (East African)","Transform boundaries: plates slide past → earthquakes (San Andreas Fault)","Continental drift: Wegener's theory, evidence (fossil correlation, coastline fit, rock similarity)","Sea-floor spreading: Hess's theory, new crust at mid-ocean ridges","Types of folds: anticline (upfold), syncline (downfold), monocline","Types of faults: normal fault (tensional), reverse/thrust fault (compressional), strike-slip/transform fault","Landforms from folding and faulting: fold mountains, rift valleys, block mountains (horst)","Volcanism: shield volcanoes (low viscosity, effusive — Hawaii), composite/strato volcanoes (high viscosity, explosive — Mt Etna)","Intrusive features: batholiths, sills, dykes, laccoliths","Earthquakes: seismic waves (P-waves, S-waves, L-waves), epicentre, focus, Richter scale","Distribution of earthquakes and volcanoes: Pacific Ring of Fire","Rock types: igneous (granite, basalt), sedimentary (sandstone, limestone, shale), metamorphic (marble, slate, quartzite)","Rock cycle: transformation between rock types through heat, pressure, erosion, melting"], objectives:["Describe the earth's internal structure","Explain plate tectonics and types of plate boundaries","Describe folding and faulting","Describe types of volcanoes and volcanic landforms","Explain earthquake causes and measurement","Classify rock types and describe the rock cycle"], prerequisites:[], cross_subject_links:["geo_3","phy_14"] },
      { id:"geo_3", topic:"Geomorphology — Landforms and Processes", subtopics:["Weathering: breakdown of rocks in situ (not transport)","Physical/mechanical weathering: freeze-thaw (frost action), exfoliation (onion-skin), block disintegration, pressure release","Chemical weathering: carbonation (limestone + CO₂ + H₂O → soluble calcium bicarbonate), hydrolysis (feldspars → clay minerals), oxidation, hydration, solution","Biological weathering: plant roots, burrowing animals, micro-organisms","Effects of weathering: soil formation, mass movement, karst landscapes","Erosion: removal and transport of weathered material by running water, ice, wind, waves","River processes: erosion (hydraulic action, abrasion/corrasion, attrition, solution), transportation (traction, saltation, suspension, solution), deposition","River long profile: headwaters (V-shaped valleys, waterfalls), middle course (meanders, flood plain), lower course (wide valley, ox-bow lakes, delta)","River landforms: gorges (limestone), waterfalls (hard rock over soft), meanders (sinuous), ox-bow lakes (cut-off meanders), levees, flood plains, deltas (Nile, Niger)","Coastal processes: erosion (hydraulic action, abrasion, attrition, solution/corrosion), transportation (longshore drift), deposition","Coastal erosion landforms: cliffs, wave-cut platform, caves, arches, stacks, stumps","Coastal deposition landforms: beaches, spits, bars, tombolos, sand dunes","Desert processes: wind erosion (deflation, abrasion, attrition)","Desert landforms: dunes (barchans, seifs, star dunes), yardangs, zeugen, pediments, oases, wadis","Glacial processes: freeze-thaw, plucking, abrasion","Glacial erosion landforms: cirques/corries, arêtes, pyramidal peaks, U-shaped valleys (glacial troughs), hanging valleys, fjords","Glacial deposition landforms: moraines (terminal, lateral, medial, ground), drumlins, eskers, kames"], objectives:["Explain types and effects of weathering","Describe erosion, transportation and deposition processes","Identify and explain river landforms at each stage","Identify and explain coastal landforms","Describe desert processes and landforms","Describe glacial erosion and deposition landforms"], prerequisites:["geo_2"], cross_subject_links:["geo_4","geo_5"] },
      { id:"geo_4", topic:"Climatology and Meteorology", subtopics:["Atmosphere: composition (N₂ 78%, O₂ 21%, Ar 0.9%, CO₂ 0.04%), structure (troposphere 0-12km, stratosphere 12-50km, mesosphere, thermosphere, exosphere)","Weather: short-term atmospheric conditions; climate: average weather over 30+ years","Temperature: influenced by latitude, altitude, ocean currents, aspect, continentality","Diurnal range vs annual range of temperature","Humidity: absolute, relative humidity; dew point; condensation","Clouds: cumulus (fair weather), stratus (grey sheets), cirrus (high ice clouds), cumulonimbus (thunderstorms)","Precipitation types: convectional (equatorial regions, afternoon storms), relief/orographic (windward ascent, rain shadow), frontal/cyclonic (warm and cold fronts meeting)","Atmospheric pressure: anticyclones (high pressure, clear skies, outward winds), depressions (low pressure, cloudy, inward winds)","General circulation: trade winds (NE and SE), westerlies, polar easterlies; ITCZ (Inter-Tropical Convergence Zone)","Ocean currents: warm (Gulf Stream, North Atlantic Drift, Kuroshio) and cold (Labrador, Canary, Benguela, Peru/Humboldt); effects on climate","Climate types: equatorial (high temp, high rainfall, no dry season — DRC, Nigeria south), tropical savanna/Sudan (wet and dry seasons — Nigerian north), hot desert (very low rainfall, extreme temp range — Sahara), Mediterranean (hot dry summer, warm wet winter), warm temperate (mild, rain all year), cool temperate (cold winters, warm summers)","Climate of Nigeria: factors (latitude, ITCZ, Guinea winds, harmattan)","Climate regions of Nigeria: equatorial south (Port Harcourt), tropical rainforest, derived savanna, Guinea savanna, Sudan savanna, Sahel (northeast)","Climate change: greenhouse effect, causes (deforestation, fossil fuels, agriculture), effects (rising sea levels, extreme weather, desertification), mitigation (Paris Agreement 2015, renewable energy, reforestation)"], objectives:["Describe the structure of the atmosphere","Measure and interpret weather elements","Describe types of precipitation and their causes","Describe major world climate types and their characteristics","Describe climate regions of Nigeria","Explain the greenhouse effect and climate change"], prerequisites:["geo_2"], cross_subject_links:["geo_3","geo_5","bio_12"] },
      { id:"geo_5", topic:"Vegetation and Soils", subtopics:["Factors affecting vegetation: climate (most important), soil, relief, biotic (human, fire, animals)","Biomes: large vegetation zones","Tropical rainforest: equatorial region, 3 layers (canopy, understory, shrub), high biodiversity, buttress roots, epiphytes; Nigeria's Guinea Forest zone","Tropical savanna: grass with scattered trees; Guinea (Guinea grass), Sudan (shorter grass), Sahel (semi-arid); acacia trees, baobab","Mangrove: coastal swamps, salt-tolerant, prop roots; Niger Delta of Nigeria","Montane: high altitude, temperature decreases with altitude; Jos Plateau in Nigeria","Desert vegetation: sparse, xerophytic (succulents, cacti, deep roots, small leaves)","Mediterranean: sclerophyllous shrubs (tough, drought-resistant leaves); maquis, chaparral","Temperate grasslands: prairies (USA), steppes (Russia), pampas (Argentina)","Soil formation (pedogenesis): parent material, climate (most important factor), organisms (humus), relief (topography), time","Soil profile: O horizon (organic litter), A horizon (topsoil, humus), B horizon (subsoil, leaching), C horizon (weathered parent material), R horizon (bedrock)","Soil types: laterite/lateritic soils (tropical, red, iron/aluminium, low fertility), sandy soils (light, well-drained, low water retention), clay soils (heavy, poor drainage, swell), loamy soils (ideal — mixture)","Soil properties: texture, structure, pH, water-holding capacity, porosity","Soil erosion: sheet erosion, rill erosion, gully erosion, wind erosion","Causes: deforestation, overgrazing, poor farming, steep slopes","Effects: loss of topsoil, reduced fertility, flooding","Control: terracing, contour ploughing, afforestation, cover crops, check dams"], objectives:["Describe major vegetation types and their distribution","Describe vegetation zones of Nigeria","Explain soil formation and describe the soil profile","Classify soil types and their properties","Describe types and causes of soil erosion and control measures"], prerequisites:["geo_4"], cross_subject_links:["bio_12","geo_7"] },
      { id:"geo_6", topic:"Population Geography", subtopics:["World population: ~8 billion; growth from 1 billion (1800) to current due to mortality decline","Population distribution: uneven — dense in S/SE Asia, W Europe, NE USA; sparse in deserts, polar regions, rainforests","Factors affecting distribution: physical (climate, relief, water, soil), economic (industry, agriculture, trade), social (culture, history)","Population density: arithmetic (total pop/total area), physiological (pop/arable land), agricultural (farming pop/arable land)","Population structure: sex ratio, age structure, dependency ratio","Age-sex pyramid: expansive (wide base — high birth rate), constrictive (narrow base — low birth rate), stationary","Population dynamics: birth rate (CBR), death rate (CDR), natural increase rate, infant mortality rate","Migration: push factors (poverty, drought, conflict) and pull factors (jobs, education)","Types of migration: rural-urban, international, internal, forced, voluntary","Demographic transition model: 4 stages from high birth/death to low birth/death rates","Population policies: pro-natalist (France, Russia) and anti-natalist (China's one-child policy, Nigeria's 4-child)","Settlement patterns: dispersed, nucleated, linear","Site and situation of settlements","Functions of settlements: agricultural, commercial, administrative, mining, religious, tourist","Urban settlements: CBD, residential zones, industrial zones; urban models (concentric zone, sector, multiple nuclei)","Urbanisation in Nigeria: rural-urban drift, growth of Lagos, Kano, Abuja; problems: overcrowding, slums, unemployment, traffic, poor services; solutions: decentralisation, new towns (Abuja)"], objectives:["Describe world population distribution","Identify factors affecting population distribution","Construct and interpret age-sex pyramids","Explain population dynamics","Describe migration types and consequences","Describe urbanisation trends and problems in Nigeria"], prerequisites:[], cross_subject_links:["eco_9","bio_12"] },
      { id:"geo_7", topic:"Economic Geography", subtopics:["Agriculture: primary sector activity","Types: subsistence (own consumption — shifting cultivation, pastoral nomadism), commercial (profit — plantation, mixed farming, ranching, market gardening)","Factors of agricultural location: climate, soil, relief, capital, labour, transport, market","Farming systems in Africa: shifting cultivation, land rotation, bush fallowing, intensive subsistence","Green Revolution: high-yielding varieties, irrigation, fertilisers — successes and problems","Problems of agriculture in Africa: traditional methods, land tenure, poor infrastructure, pests, drought, soil erosion; solutions: cooperative farming, irrigation, mechanisation","Mining: extraction of minerals; open-cast (surface), shaft/deep, placer/alluvial","Distribution of minerals in Nigeria: petroleum (south), coal (Enugu), iron ore (Itakpe), tin (Jos), limestone (Yandev), bitumen (Ondo)","Importance of mining in Nigeria: revenue, employment, foreign exchange","Problems: environmental degradation (oil spills), capital-intensive, depletion of resources","Industry: manufacturing — converting raw materials to finished products","Types: cottage (home-based), light industry, heavy industry, high-tech","Factors of industrial location: raw materials, energy, labour, transport, market, capital, government policy","Industrial regions: Suez Canal zone, Rhine-Ruhr, Great Lakes, Rand (South Africa)","Manufacturing in Nigeria: constraints (poor infrastructure, power supply, funding); examples (Lagos, Kano industrial areas)","Energy resources: renewable (solar, wind, HEP, tidal, geothermal, biomass) and non-renewable (fossil fuels — coal, oil, gas, nuclear)","Nigeria's energy: oil, gas, HEP (Kainji, Jebba, Shiroro dams), solar potential","Transportation: modes (road, rail, water, air, pipeline)","Road transport: advantages (flexibility, door-to-door); problems in Nigeria (poor maintenance, accidents)","Rail transport: advantages (bulk goods); Nigeria's decline and rehabilitation","Water transport: navigable rivers (Niger, Benue), coastal shipping, Lagos port","Air transport: Murtala Mohammed (Lagos), Nnamdi Azikiwe (Abuja)","Trade: internal (within Nigeria) and external (exports — crude oil, cocoa, rubber; imports — machinery, food)","Nigeria's trade patterns: over-dependence on oil exports, trade deficit in manufactured goods"], objectives:["Describe types of agriculture and farming systems","Identify mineral resources and their distribution in Nigeria","Explain factors of industrial location","Describe transportation modes and their relevance in Nigeria","Analyse Nigeria's trade patterns"], prerequisites:["geo_5","geo_6"], cross_subject_links:["eco_9","eco_8"] },
      { id:"geo_8", topic:"Regional Geography — Nigeria and Africa", subtopics:["Location of Nigeria: Gulf of Guinea, 3°E-15°E longitude, 4°N-14°N latitude","Size: 923,768 km², 36 states + FCT, population ~220 million (most populous African country)","Physical features of Nigeria: Sokoto plains (NW), Niger-Benue trough (middle), Jos Plateau (central, 1,200m avg), Eastern Highlands (Adamawa, Obudu), coastal plains and Niger Delta (south)","Drainage: River Niger (4,200km, 2nd longest in Africa), River Benue (Niger's largest tributary), Lake Chad (NE)","Climate of Nigeria: see geo_4","Natural vegetation zones of Nigeria: see geo_5","Natural resources: petroleum, gas, coal, tin, columbite, iron ore, limestone, bitumen, solid minerals","Geopolitical zones: NW, NE, NC (Middle Belt), SW, SE, SS (South-South)","Africa: world's 2nd largest continent, 30.3 million km², 54 countries","Major physical features of Africa: Sahara Desert (largest hot desert), Congo Basin (tropical rainforest), Great Rift Valley (East Africa, volcanoes), Atlas Mountains (NW), Drakensberg (SE), Ethiopian Highlands","Major rivers: Nile (6,650km, longest in world), Congo (2nd discharge), Niger, Zambezi (Victoria Falls), Orange, Limpopo","Major lakes: Victoria (largest in Africa), Tanganyika (deepest), Malawi, Chad","Climate regions of Africa: equatorial, tropical (wet/dry), hot desert, Mediterranean, sub-tropical","Population distribution in Africa: concentrated in Nile Valley, West Africa coast, Great Lakes, South Africa","Major countries: Nigeria (most populous), Ethiopia, Egypt, South Africa, DRC, Kenya"], objectives:["Describe location and physical features of Nigeria","Identify geopolitical zones of Nigeria","Describe major physical features of Africa","Identify major rivers and lakes of Africa","Describe climate regions of Africa","Identify distribution of population in Africa"], prerequisites:["geo_4","geo_5","geo_6"], cross_subject_links:["gov_10","eco_9"] }
    ]
  },

  literature: {
    display_name: "Literature in English",
    code: "LIT",
    general_objectives: [
      "Generate, deepen and sustain interest in literature in English",
      "Create awareness of principles and techniques of all genres from diverse cultures",
      "Appreciate literary works of all genres",
      "Apply knowledge of literature to cultural, political and economic activities in society"
    ],
    topics: [
      { id:"lit_1", topic:"Drama", subtopics:["Types of drama: tragedy (downfall of noble protagonist — catharsis), comedy (humorous, happy ending), tragicomedy (elements of both), melodrama (exaggerated emotion), farce (absurd humour), opera (sung drama)","Dramatic techniques: characterisation (protagonist, antagonist, flat, round characters), dialogue (reveals character, advances plot), flashback (events before current action), mime, costume, music/dance, décor/scenery, acts and scenes, soliloquy (character speaks thoughts aloud), aside (character addresses audience)","Plot structure: exposition, rising action, climax, falling action, denouement/resolution","Themes in drama: love, betrayal, power, justice, identity, tradition vs change","Stage directions and their effect on the audience","Dramatic irony: audience knows more than characters","Conflict: man vs man, man vs nature, man vs society, man vs self","Setting: time and place; its symbolic significance","Style and diction of selected playwrights","Prescribed drama texts (titles vary by year — read the specific prescribed texts for your exam year)"], objectives:["Identify and describe types of drama","Analyse dramatic techniques in prescribed texts","Describe plot structure","Identify themes in dramatic works","Explain dramatic irony and conflict","Analyse style and diction of playwrights"], prerequisites:[], cross_subject_links:["lit_2","lit_3","eng_4"] },
      { id:"lit_2", topic:"Fiction (Prose)", subtopics:["Types of fiction: novel (long narrative), novella (medium length), short story (brief, focuses on single incident/character)","Narrative perspective/point of view: first-person narrator (I — subjective, limited), third-person omniscient (all-knowing narrator), third-person limited (knows one character's thoughts), second person (you — rare)","Narrative techniques: stream of consciousness, frame narrative, unreliable narrator, epistolary (letters/diary)","Plot elements: exposition, rising action, climax, falling action, resolution; sub-plots","Setting: physical (place), temporal (time), social (society/culture); its symbolic role","Characterisation: direct (author tells), indirect (shown through speech, action, thought); character development","Theme: central idea — identify and support with textual evidence","Style: diction (word choice), tone, mood, imagery, symbolism","Imagery and figures of speech in prose: simile, metaphor, personification, irony, hyperbole, allusion","Prose rhythm and sentence structure for effect","Prescribed prose texts (varies by year)"], objectives:["Identify narrative techniques and point of view","Analyse plot structure and setting","Describe characterisation methods","Identify and discuss themes","Analyse style, imagery and language in selected texts"], prerequisites:[], cross_subject_links:["lit_1","lit_3","eng_1"] },
      { id:"lit_3", topic:"Poetry", subtopics:["Types of poetry: lyric (personal emotion — ode, elegy, sonnet), narrative (tells a story — ballad, epic), dramatic monologue (speaker addresses silent listener), satirical, didactic","Sonnet: Shakespearean (3 quatrains + couplet, ABAB CDCD EFEF GG) vs Petrarchan (octave + sestet)","Ode: elaborate lyric, usually formal praise","Elegy: mourning or lamentation","Ballad: narrative song, simple language, refrain","Epic: long narrative on heroic themes","Poetic devices: rhyme (end rhyme, internal rhyme), rhythm (stressed/unstressed syllables), metre (iambic pentameter, trochee, anapest, dactyl, spondee), enjambment (run-on lines), caesura (pause within line)","Sound devices: alliteration (consonants), assonance (vowel sounds), consonance, onomatopoeia (words imitating sounds), repetition, refrain","Figurative language in poetry: simile, metaphor, extended metaphor, personification, hyperbole, understatement/litotes, oxymoron, paradox, synecdoche, metonymy","Tone and mood: speaker's attitude vs emotional atmosphere created","Imagery: visual, auditory, tactile, olfactory, gustatory","Symbolism: object/event representing abstract idea","Diction: connotation vs denotation; formal vs colloquial language","Theme: love, death, nature, war, social justice, identity in prescribed poems","African poetry: oral tradition, rhythm, communal themes, nature imagery","Non-African poetry: British and American traditions","Prescribed poetry texts (varies by year)"], objectives:["Identify and explain types of poetry","Analyse poetic devices: metre, rhyme, rhythm","Identify and explain figures of speech","Interpret imagery, symbolism and tone","Discuss themes in African and non-African poetry","Analyse and compare poems"], prerequisites:[], cross_subject_links:["lit_1","eng_3","eng_4"] }
    ]
  },

  crs: {
    display_name: "Christian Religious Studies",
    code: "CRS",
    general_objectives: [
      "Acquire knowledge of tenets of the Christian faith as contained in the Bible",
      "Interpret biblical teachings and themes",
      "Apply biblical teachings to life in society",
      "Evaluate application of biblical teachings to contemporary society"
    ],
    sections: [
      "Section A: Themes from Creation to the Division of the Kingdom",
      "Section B: Themes from Division of Kingdom to Return from Exile and the Prophets",
      "Section C: Themes from the Four Gospels and Acts of the Apostles",
      "Section D: Themes from Selected Epistles"
    ],
    topics: [
      { id:"crs_1", topic:"The Sovereignty of God", section:"Section A", subtopics:["God as Creator: Genesis 1 and 2 — six days of creation, rest on seventh","God as Controller: Amos 9:5-6, Isaiah 45:5-12","Nature of creation: Psalm 19:1-6","God's providence: Jeremiah 18:1-16, Romans 8:28","Man's role: stewardship, dominion over creation","Application: trust in God's sovereignty in daily life"], objectives:["Define sovereignty","Analyse God's process of creation in Genesis","Interpret the sequence of creation","Identify man's role in advancing God's purpose","Recognise sovereignty of God in affairs of man and nations"], prerequisites:[], cross_subject_links:["crs_2"] },
      { id:"crs_2", topic:"The Covenant", section:"Section A", subtopics:["Concept of covenant: binding agreement between God and man","The Flood and God's covenant with Noah: Genesis 6:1-22; 7:1-24; 9:1-17 — rainbow sign, never destroy earth by flood again","God's covenant with Abraham: Genesis 11:31-32; 12:1-9; 17:1-21; 21:1-13; 25:19-26 — land, descendants, blessing to nations; sign of circumcision","The Mosaic/Sinai Covenant: Exodus 19; 20; Deuteronomy 27; 28 — Ten Commandments, blessings and curses","New Covenant: Jeremiah 31:31-34; Luke 22:19-20 — written on hearts, forgiveness, through Jesus' blood","Covenantal obligations and fulfilment","Applications to modern Christian life: faithfulness, keeping promises"], objectives:["Define covenant","Analyse the Noah, Abraham and Mosaic covenants","Explain the New Covenant and its significance in Christ","Compare Old and New Covenants","Apply covenant principles to Christian living"], prerequisites:["crs_1"], cross_subject_links:["crs_5"] },
      { id:"crs_3", topic:"Leadership Qualities in the Bible", section:"Section A", subtopics:["Joseph — Genesis 37; 39:1-23; 41:1-57; 45:1-15; 50:15-21: integrity (refused Potiphar's wife), wisdom (interpretation of dreams), forgiveness (reconciled with brothers)","Moses — Exodus 1; 2; 3; 4; 5:1-9; 18:13-26; Numbers 27:12-23: call at burning bush, confronting Pharaoh, humility, intercession, delegation (Jethro's advice)","Joshua — Numbers 13; 14; Joshua 1-3; 6; 24:1-28: courage (positive report), obedience (crossing Jordan, Jericho), covenant renewal","Samuel — 1 Samuel 1-3; 7; 8; 12: dedicated from birth, prophetic call, national judge, warned against monarchy, farewell speech","David — 1 Samuel 16:1-13; 18:1-16; 2 Samuel 11:1-27; 12:1-25; 1 Kings 2:1-4: anointing, friendship with Jonathan, sin with Bathsheba, repentance, charge to Solomon","Lessons: obedience, courage, integrity, wisdom, repentance, delegation, faithfulness"], objectives:["Identify qualities of biblical leaders","Analyse how each leader handled challenges and failures","Apply leadership lessons to contemporary society","Identify consequences of poor leadership decisions"], prerequisites:[], cross_subject_links:["crs_4"] },
      { id:"crs_4", topic:"The Prophets and their Messages", section:"Section B", subtopics:["Elijah — 1 Kings 17:1-24; 18:1-46; 19:1-18; 21:1-29: drought, widow of Zarephath, contest on Mount Carmel (defeat of Baal prophets), depression and renewal (still small voice), Naboth's vineyard","Jeremiah — Jeremiah 1:1-19; 7:1-15; 18:1-12; 20:7-18; 31:31-34: call and reluctance, Temple sermon (judgment for false religion), potter and clay (God's sovereignty), Jeremiah's complaints (lamentations), New Covenant promise","Amos — Amos 2:6-8; 4:1-5; 5:1-27; 9:1-10: social justice, condemnation of exploitation of poor, oppression, empty ritual worship, judgment on Israel","Isaiah — Isaiah 1:1-20; 6:1-13; 40:1-11; 53: holiness of God (vision in temple, seraphim), Servant Songs (suffering servant — fulfilled in Christ), comfort to exiles","Hosea — themes of repentance, restoration, God's faithful love despite Israel's unfaithfulness; marriage as metaphor","Common themes in prophets: social justice, true worship, repentance, coming Messiah"], objectives:["Describe the call and message of each prophet","Relate prophetic messages to contemporary social issues","Explain themes of social justice, idolatry and repentance","Trace prophetic fulfillment in the New Testament"], prerequisites:["crs_3"], cross_subject_links:["crs_5"] },
      { id:"crs_5", topic:"Life and Teachings of Jesus Christ", section:"Section C", subtopics:["Birth and early life: Luke 1:26-38 (annunciation to Mary), Luke 2:1-52 (birth in Bethlehem, presentation, 12-year-old in Temple), Matthew 2:1-23 (Wise Men, flight to Egypt)","Baptism and temptation: Matthew 3:1-17 (John's baptism, voice from heaven), Matthew 4:1-11 (three temptations — bread, pinnacle, kingdoms — 'It is written')","Sermon on the Mount: Matthew 5-7 — Beatitudes, salt and light, law and fulfilment, Lord's Prayer, golden rule","Parables: Prodigal Son (Luke 15:11-32 — forgiveness, repentance), Good Samaritan (Luke 10:25-37 — love your neighbour), Sower (Matthew 13:1-23 — hearing and responding to Word), Ten Virgins (Matthew 25:1-13 — readiness), Talents (Matthew 25:14-30 — stewardship)","Miracles: Feeding of 5000 (John 6:1-14 — compassion), Healing blind Bartimaeus (Mark 10:46-52 — faith), Raising Lazarus (John 11:1-44 — Jesus as resurrection), Calming the storm","The Passion: Last Supper (Matthew 26:17-30), Gethsemane (prayer and betrayal), trials before Pilate and Herod, crucifixion (John 19), resurrection (Luke 24 — empty tomb, appearances), ascension (Acts 1:1-11)","Teachings on: Kingdom of God, love, forgiveness, prayer, service, wealth, judgment","Application: Christian ethics, service, discipleship"], objectives:["Describe birth, baptism and temptation narratives","Analyse teachings in the Sermon on the Mount","Interpret selected parables and their meanings","Describe miracles and explain their significance","Narrate the passion, death and resurrection","Apply teachings of Jesus to Christian living"], prerequisites:[], cross_subject_links:["crs_6","crs_2"] },
      { id:"crs_6", topic:"The Early Church — Acts of the Apostles", section:"Section C", subtopics:["Pentecost: Acts 2 — coming of Holy Spirit, tongues of fire, Peter's sermon, 3000 converts","Life of early church: Acts 2:42-47; 4:32-37 — breaking of bread, prayer, sharing, fellowship","Peter's miracles and ministry: Acts 3:1-26 (healing lame man), 5:1-16 (Ananias and Sapphira, Peter's shadow heals)","Persecution and Stephen's martyrdom: Acts 6:1-8:3 — Stephen's speech, stoning, scattering of church","Philip's ministry in Samaria: Acts 8:4-40 — Ethiopian eunuch baptism","Peter and Cornelius: Acts 10:1-48 — Gentiles receive Holy Spirit (church opens to non-Jews)","Paul's conversion: Acts 9:1-31 — Damascus road, Ananias, early ministry","Paul's first missionary journey: Acts 13-14 — Cyprus, Antioch, Iconium, Lystra, Derbe","Paul's second missionary journey: Acts 16-18 — Philippi (Lydia, Philippian jailer), Athens, Corinth","Paul's third journey: Acts 18:23-21:16","Jerusalem council: Acts 15 — Gentiles and circumcision, letter to Gentile churches","Paul's arrest and trials: Acts 21-26","Paul's journey to Rome: Acts 27-28","Lessons: Spirit empowerment, mission, persecution and faithfulness, cultural diversity of church"], objectives:["Describe Pentecost and its effects on disciples","Describe Peter's early ministry","Trace Stephen's martyrdom and significance","Narrate Paul's conversion","Trace Paul's missionary journeys on a map","Explain the Jerusalem council decision","Describe challenges faced by early church"], prerequisites:["crs_5"], cross_subject_links:["crs_7"] },
      { id:"crs_7", topic:"Selected Epistles", section:"Section D", subtopics:["Romans: justification by faith — Romans 1:1-17 (gospel, righteousness of God), 3:21-31 (faith in Christ, not works), 5:1-11 (peace with God, hope, love of God), 8:1-17 (life in the Spirit, no condemnation, led by Spirit)","1 Corinthians: spiritual gifts and Christian conduct — 1 Corinthians 12 (variety of gifts, one body), 13 (love chapter — love is the greatest gift), 14 (proper use of gifts in worship)","Galatians: freedom in Christ — Galatians 2:11-21 (Paul opposes Peter, justification by faith not law), 3:1-29 (faith vs law, promise to Abraham, all one in Christ), 5:1-26 (freedom, fruit of the Spirit vs works of flesh)","Ephesians: Christian living — Ephesians 4:1-16 (unity of Spirit, gifts for building church), 5:21-33 (wives and husbands, marriage as Christ and church), 6:1-20 (children and parents, armour of God)","James: faith and works — James 1:1-27 (trials, wisdom, hearing and doing), 2:14-26 (faith without works is dead — Abraham and Rahab as examples)","Application to contemporary Christian life: grace, unity, spiritual gifts, family relationships, social action"], objectives:["Explain key teachings of selected epistles","Relate Paul's doctrine of justification by faith","Describe the fruit of the Spirit (Galatians 5)","Explain the armour of God (Ephesians 6)","Discuss relationship between faith and works (James)","Apply epistolary teachings to contemporary issues"], prerequisites:["crs_6"], cross_subject_links:["crs_5"] }
    ]
  }
};

// ── Core helper functions ─────────────────────────────────────────────────────

/** Get syllabus for a subject — accepts display name, code or key */
export function getSubjectSyllabus(subject: string): SubjectSyllabus | null {
  const key = subject.toLowerCase()
    .replace(/\s+/g, "")
    .replace("language", "")
    .replace("christian", "")
    .replace("religious", "")
    .replace("studies", "");

  // Direct match
  if (JAMB_SYLLABUS[key]) return JAMB_SYLLABUS[key];
  // Code match
  for (const s of Object.values(JAMB_SYLLABUS)) {
    if (s.code === subject.toUpperCase()) return s;
  }
  // Display name fuzzy match
  const lc = subject.toLowerCase();
  for (const [k, s] of Object.entries(JAMB_SYLLABUS)) {
    if (s.display_name.toLowerCase().includes(lc) || lc.includes(k)) return s;
  }
  return null;
}

/** Get all topics for a subject */
export function getTopics(subject: string): SyllabusTopic[] {
  return getSubjectSyllabus(subject)?.topics ?? [];
}

/** Find a specific topic by ID */
export function getTopic(topicId: string): { subject: SubjectSyllabus; topic: SyllabusTopic } | null {
  for (const subject of Object.values(JAMB_SYLLABUS)) {
    const topic = subject.topics.find(t => t.id === topicId);
    if (topic) return { subject, topic };
  }
  return null;
}

/** Get all topics across all subjects as a flat searchable list */
export function getAllTopics(): Array<{ subjectKey: string; subject: SubjectSyllabus; topic: SyllabusTopic }> {
  const result: Array<{ subjectKey: string; subject: SubjectSyllabus; topic: SyllabusTopic }> = [];
  for (const [key, subject] of Object.entries(JAMB_SYLLABUS)) {
    for (const topic of subject.topics) {
      result.push({ subjectKey: key, subject, topic });
    }
  }
  return result;
}

/** Search topics by keyword across all subjects */
export function searchSyllabus(query: string): Array<{ subjectKey: string; subject: SubjectSyllabus; topic: SyllabusTopic; matchedIn: "topic" | "subtopic" | "objective" }> {
  const q = query.toLowerCase();
  const results: Array<{ subjectKey: string; subject: SubjectSyllabus; topic: SyllabusTopic; matchedIn: "topic" | "subtopic" | "objective" }> = [];

  for (const [key, subject] of Object.entries(JAMB_SYLLABUS)) {
    for (const topic of subject.topics) {
      if (topic.topic.toLowerCase().includes(q)) {
        results.push({ subjectKey: key, subject, topic, matchedIn: "topic" });
      } else if (topic.subtopics.some(s => s.toLowerCase().includes(q))) {
        results.push({ subjectKey: key, subject, topic, matchedIn: "subtopic" });
      } else if (topic.objectives.some(o => o.toLowerCase().includes(q))) {
        results.push({ subjectKey: key, subject, topic, matchedIn: "objective" });
      }
    }
  }
  return results;
}

/** Get prerequisite topics for a given topic */
export function getPrerequisites(topicId: string): Array<{ subject: SubjectSyllabus; topic: SyllabusTopic }> {
  const found = getTopic(topicId);
  if (!found) return [];
  return (found.topic.prerequisites ?? [])
    .map(pid => getTopic(pid))
    .filter((t): t is NonNullable<typeof t> => t !== null);
}

/** Get related topics from other subjects */
export function getCrossSubjectLinks(topicId: string): Array<{ subject: SubjectSyllabus; topic: SyllabusTopic }> {
  const found = getTopic(topicId);
  if (!found) return [];
  return (found.topic.cross_subject_links ?? [])
    .map(lid => getTopic(lid))
    .filter((t): t is NonNullable<typeof t> => t !== null);
}

/**
 * Build the AI system prompt context for given subjects.
 * Used by /api/chat to make all AI responses syllabus-aligned.
 */
export function buildSyllabusSystemPrompt(subjects: string[]): string {
  const relevantSubjects = subjects.length > 0
    ? subjects.map(s => getSubjectSyllabus(s)).filter((s): s is SubjectSyllabus => s !== null)
    : Object.values(JAMB_SYLLABUS);

  const syllabusContext = relevantSubjects.map(s => {
    const topicList = s.topics.map(t =>
      `  • ${t.topic}: ${t.subtopics.slice(0, 5).join(", ")}${t.subtopics.length > 5 ? ` (+${t.subtopics.length - 5} more)` : ""}`
    ).join("\n");
    return `${s.display_name.toUpperCase()} (${s.code}):\n${topicList}`;
  }).join("\n\n");

  return `You are Companion AI — the official JAMB UTME study assistant for Nigerian students.

TEACHING PHILOSOPHY (always apply these):
1. Discussion-based: Before giving the answer, ask "What do you think? Why?" to activate prior knowledge
2. Real-world connections: Connect EVERY concept to a Nigerian everyday example students can relate to
3. Reasoning over memorisation: Explain the WHY and HOW, not just the WHAT
4. Scaffold from simple to complex: Start with what the student knows, build upward
5. Identify gaps: If a student struggles with a concept, note the prerequisite they may be missing
6. Syllabus-strict: ONLY teach topics from the JAMB syllabus below — never go outside it without saying "This is supplementary"

WHEN SOLVING PAST QUESTIONS:
Step 1: Ask "Before I show you the solution — what approach would you try?"
Step 2: State the answer clearly with the syllabus topic it falls under
Step 3: Full step-by-step solution in clear Nigerian English
Step 4: Name the exact JAMB concept/subtopic being tested
Step 5: Give a real-world Nigerian example that illustrates this concept
Step 6: Provide a mnemonic or memory tip
Step 7: Ask "Does this make sense? Which part would you like me to explain differently?"

OFFICIAL JAMB SYLLABUS (your authoritative curriculum — every lesson and question must come from this):
${syllabusContext}

IMPORTANT RULES:
- Always reference the topic and subtopic when explaining
- If a concept has prerequisites, mention them: "You should know X before we study Y"
- If topics connect across subjects, point it out: "This is similar to what you studied in Chemistry..."
- For calculations, show every step — never skip
- Be encouraging: frame mistakes as "good question to clarify" not "wrong"
- Keep responses focused and mobile-friendly (not too long)`;
}

/**
 * Build a mock exam prompt strictly from JAMB syllabus.
 * Every question must correspond to a syllabus topic.
 */
export function buildMockExamPrompt(subjects: string[], numQuestions: number): string {
  const syllabusContext = subjects.map(s => {
    const sub = getSubjectSyllabus(s);
    if (!sub) return "";
    const topicNames = sub.topics.map(t => t.topic).join(", ");
    return `${sub.display_name}: ${topicNames}`;
  }).filter(Boolean).join("\n");

  return `You are an official JAMB question setter. Generate exactly ${numQuestions} UTME-style multiple choice questions.

STRICT RULES:
- Every question MUST come from the official JAMB syllabus below
- Use authentic JAMB question style and difficulty level
- Distribute questions evenly across subjects: ${subjects.join(", ")}
- Each question must test a specific subtopic
- Include clear, unambiguous options with only ONE correct answer
- Explanation must reference the syllabus concept

OFFICIAL JAMB SYLLABUS (questions must only test these topics):
${syllabusContext}

Return ONLY a valid JSON array, no markdown, no backticks, no explanation:
[{
  "id": 1,
  "subject": "Mathematics",
  "topic": "Quadratic Equations",
  "subtopic": "Sum and product of roots",
  "question": "If α and β are roots of 2x² - 5x + 3 = 0, find α + β.",
  "options": ["5/2", "3/2", "-5/2", "-3/2"],
  "correct": 0,
  "explanation": "For ax² + bx + c = 0, sum of roots = -b/a = -(-5)/2 = 5/2"
}]
where "correct" is the 0-indexed position of the correct option.`;
}

/**
 * Generate a week-by-week study plan aligned to the syllabus.
 * Replaces the AI-generated plan with a guaranteed syllabus-complete plan.
 */
export function generateSyllabusAlignedPlan(
  subjects: string[],
  weeksAvailable: number,
  weakSubjects: string[] = []
): Array<{
  week:     number;
  subject:  string;
  topic:    string;
  subtopic: string;
  topicId:  string;
  hours:    number;
  type:     "study" | "practice" | "rest";
}> {
  // Collect all topics, giving weak subjects 1.5× weight
  const allItems: Array<{ subject: string; topic: string; subtopic: string; topicId: string; weight: number }> = [];

  for (const subj of subjects) {
    const s = getSubjectSyllabus(subj);
    if (!s) continue;
    const isWeak = weakSubjects.some(w => w.toLowerCase().includes(subj.toLowerCase()) || subj.toLowerCase().includes(w.toLowerCase()));
    for (const t of s.topics) {
      for (let i = 0; i < t.subtopics.length; i++) {
        allItems.push({
          subject:  s.display_name,
          topic:    t.topic,
          subtopic: t.subtopics[i] ?? t.topic,
          topicId:  t.id,
          weight:   isWeak ? 1.5 : 1,
        });
      }
    }
  }

  // Distribute across weeks (5 study days + 1 practice day + 1 rest day per week)
  const studySlots  = weeksAvailable * 5;
  const step        = Math.max(1, Math.floor(allItems.length / studySlots));
  const selected    = allItems.filter((_, i) => i % step === 0).slice(0, studySlots);
  const plan: ReturnType<typeof generateSyllabusAlignedPlan> = [];

  let itemIndex = 0;
  for (let w = 1; w <= weeksAvailable; w++) {
    for (let d = 1; d <= 7; d++) {
      if (d === 7) {
        plan.push({ week: w, subject: "REST", topic: "Rest Day", subtopic: "Relax and recharge", topicId: "", hours: 0, type: "rest" });
      } else if (d === 6) {
        plan.push({ week: w, subject: "ALL", topic: "Practice & Past Questions", subtopic: "Mixed subjects", topicId: "", hours: 2, type: "practice" });
      } else {
        const item = selected[itemIndex++] ?? selected[selected.length - 1];
        plan.push({ week: w, subject: item.subject, topic: item.topic, subtopic: item.subtopic, topicId: item.topicId, hours: 2, type: "study" });
      }
    }
  }

  return plan;
}

/** Statistics about the syllabus */
export const SYLLABUS_STATS = {
  totalSubjects:  Object.keys(JAMB_SYLLABUS).length,
  totalTopics:    Object.values(JAMB_SYLLABUS).reduce((n, s) => n + s.topics.length, 0),
  totalSubtopics: Object.values(JAMB_SYLLABUS).reduce((n, s) => n + s.topics.reduce((m, t) => m + t.subtopics.length, 0), 0),
  totalObjectives:Object.values(JAMB_SYLLABUS).reduce((n, s) => n + s.topics.reduce((m, t) => m + t.objectives.length, 0), 0),
  source:         "Official JAMB UTME Syllabus 2025",
};
