import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load the original 26 pages from git
const origFileContent = execSync("git show c120652:js/dataset.js", { encoding: "utf-8" });
// Extract JSON array or import dynamically
const tempOrigPath = path.resolve(__dirname, "./temp-orig.js");
fs.writeFileSync(tempOrigPath, origFileContent, "utf-8");
const { SAMPLE_PAGES: original26 } = await import("./temp-orig.js");
fs.unlinkSync(tempOrigPath);

console.log(`Loaded original pages: ${original26.length}`);

// 12 Domains for 454 additional legitimate pages
const DOMAINS = [
  {
    topic: "Operating Systems",
    tlds: ["kernel.org", "gnu.org", "freebsd.org", "bell-labs.com", "cs.berkeley.edu", "mit.edu", "netbsd.org", "openbsd.org"],
    subjects: [
      { name: "Plan 9 Distributed Architecture", kw: ["plan 9", "distributed", "everything is a file", "bell labs", "operating systems"] },
      { name: "Mach 3.0 Microkernel IPC", kw: ["mach", "microkernel", "cmu", "message passing", "operating systems"] },
      { name: "Minix Microkernel Design", kw: ["minix", "tanenbaum", "microkernel", "operating systems"] },
      { name: "Solaris SPARC Workstation Unix", kw: ["solaris", "sun microsystems", "sparc", "unix", "operating systems"] },
      { name: "IRIX SGI Workstation Architecture", kw: ["irix", "sgi", "mips", "unix", "workstation", "operating systems"] },
      { name: "OS/2 Warp 32-Bit System", kw: ["os2", "ibm", "warp", "workplace shell", "operating systems"] },
      { name: "QNX Real-Time Microkernel", kw: ["qnx", "posix", "real time", "microkernel", "operating systems"] },
      { name: "OpenBSD Proactive Cryptography", kw: ["openbsd", "security", "cryptography", "unix", "operating systems"] }
    ]
  },
  {
    topic: "Retro Computing",
    tlds: ["stanford.edu", "commodore.org", "vintagecomputer.net", "apple-history.com", "atariarchives.org", "old-computers.com"],
    subjects: [
      { name: "Apple Lisa Office System", kw: ["apple lisa", "gui", "motorola 68000", "retro computing"] },
      { name: "Atari ST 520 MIDI Hardware", kw: ["atari st", "motorola 68000", "midi", "retro computing"] },
      { name: "Sinclair ZX Spectrum Z80", kw: ["zx spectrum", "sinclair", "clive sinclair", "retro computing"] },
      { name: "NeXTcube NeXTSTEP DSP", kw: ["nextcube", "nextstep", "steve jobs", "dsp56001", "retro computing"] },
      { name: "Silicon Graphics Indy Workstation", kw: ["sgi indy", "mips r4000", "irix", "retro computing"] },
      { name: "Xerox Alto Bitmap Display", kw: ["xerox alto", "gui", "mouse", "ethernet", "retro computing"] },
      { name: "Commodore 128 Dual Processor", kw: ["commodore 128", "c128", "z80", "cpm", "retro computing"] },
      { name: "DEC PDP-11 Architecture", kw: ["pdp-11", "digital equipment", "minicomputer", "retro computing"] }
    ]
  },
  {
    topic: "Space & Astronomy",
    tlds: ["hubblesite.org", "stsci.edu", "caltech.edu", "nasa.gov", "esa.int", "cfa.harvard.edu"],
    subjects: [
      { name: "Pulsar Radio Timing Arrays", kw: ["pulsar", "radio astronomy", "gravitational waves", "astronomy"] },
      { name: "Cassini-Huygens Saturn Orbiter", kw: ["cassini", "saturn", "titan", "space exploration", "astronomy"] },
      { name: "COBE Cosmic Microwave Anisotropy", kw: ["cobe", "cosmic microwave background", "big bang", "astronomy"] },
      { name: "Ulysses Polar Solar Orbit", kw: ["ulysses", "solar wind", "sun", "space exploration"] },
      { name: "Kuiper Belt Orbital Dynamics", kw: ["kuiper belt", "pluto", "astronomy", "outer solar system"] },
      { name: "Keck Telescope Active Optics", kw: ["keck observatory", "telescope", "interferometry", "astronomy"] },
      { name: "Neutron Star Compact Matter", kw: ["neutron star", "astrophysics", "nuclear matter", "astronomy"] },
      { name: "Sagittarius A Galactic Center", kw: ["black hole", "sagittarius a", "astrophysics", "astronomy"] }
    ]
  },
  {
    topic: "Web Standards & History",
    tlds: ["w3.org", "cern.ch", "ietf.org", "ncsa.uiuc.edu", "internic.net", "w3c.org"],
    subjects: [
      { name: "HTTP 1.1 Persistent Connections", kw: ["http 1.1", "ietf", "web protocols", "caching", "keep-alive"] },
      { name: "NCSA Mosaic GUI Browser", kw: ["mosaic", "ncsa", "marc andreessen", "web history"] },
      { name: "CSS1 Formatting Model", kw: ["css1", "style sheets", "håkon wium lie", "web standards"] },
      { name: "URI URL URN Addressing RFC", kw: ["url", "uri", "web architecture", "standards"] },
      { name: "DOM Level 1 Core Interfaces", kw: ["dom level 1", "w3c", "javascript", "scripting", "web standards"] },
      { name: "XML 1.0 Document Syntax", kw: ["xml", "w3c", "markup", "structured data", "standards"] },
      { name: "Robots Exclusion Standard", kw: ["robots.txt", "web crawler", "spider", "indexing"] },
      { name: "Apache HTTP Server Architecture", kw: ["apache", "web server", "open source", "http"] }
    ]
  },
  {
    topic: "Cryptography & Privacy",
    tlds: ["eff.org", "privacytools.org", "crypto-museum.com", "mit.edu", "csrc.nist.gov"],
    subjects: [
      { name: "Diffie-Hellman Key Agreement", kw: ["diffie hellman", "cryptography", "key exchange", "discrete log"] },
      { name: "Data Encryption Standard DES Modes", kw: ["des", "block cipher", "feistel", "cryptography"] },
      { name: "SHA-1 Secure Hash Architecture", kw: ["sha-1", "cryptographic hash", "message digest", "security"] },
      { name: "Kerberos Authentication Protocol", kw: ["kerberos", "mit", "tickets", "authentication", "security"] },
      { name: "Cypherpunk Cryptographic Principles", kw: ["cypherpunk", "digital privacy", "eric hughes", "civil liberties"] },
      { name: "Zero Knowledge Proof Systems", kw: ["zero knowledge", "cryptography", "goldwasser", "security"] },
      { name: "Elliptic Curve Discrete Logarithms", kw: ["elliptic curve", "ecc", "public key", "cryptography"] },
      { name: "One-Time Pad Shannon Secrecy", kw: ["one-time pad", "information theory", "shannon", "cryptography"] }
    ]
  },
  {
    topic: "Coffee Brewing Science",
    tlds: ["coffeegeek.com", "baristahustle.com", "sweetmarias.com", "scaa.org", "coffeeresearch.org"],
    subjects: [
      { name: "Water Mineral Content in Brewing", kw: ["water chemistry", "magnesium", "calcium", "coffee brewing", "tds"] },
      { name: "Conical vs Flat Burr Particle Bimodality", kw: ["burr grinder", "particle distribution", "fines", "coffee brewing"] },
      { name: "French Press Mesh Filtration", kw: ["french press", "immersion", "coffee brewing", "metal filter"] },
      { name: "Cold Drip Low-Temperature Extraction", kw: ["cold drip", "cold brew", "coffee brewing", "low acidity"] },
      { name: "Coffee Arabica Genetic Lineage", kw: ["arabica", "bourbon", "typica", "specialty coffee"] },
      { name: "Vacuum Pot Thermal Stability", kw: ["siphon", "vacuum pot", "coffee brewing", "thermal dynamics"] },
      { name: "Digital Refractometry TDS Profiling", kw: ["refractometer", "extraction yield", "tds", "coffee brewing"] },
      { name: "Roast Profiling Rate of Rise", kw: ["roast profile", "rate of rise", "coffee brewing", "green coffee"] }
    ]
  },
  {
    topic: "Artificial Intelligence",
    tlds: ["mit.edu", "stanford.edu", "cmu.edu", "aaai.org", "ai.berkeley.edu"],
    subjects: [
      { name: "Hopfield Network Attractor Dynamics", kw: ["hopfield network", "associative memory", "physics", "ai"] },
      { name: "Genetic Algorithms Schema Theorem", kw: ["genetic algorithms", "evolutionary", "john holland", "ai"] },
      { name: "Expert Systems Forward Inference", kw: ["expert systems", "rule based", "inference engine", "ai"] },
      { name: "A* Graph Heuristic Search", kw: ["a star", "search algorithm", "heuristics", "ai", "graph search"] },
      { name: "Alpha-Beta Tree Pruning Heuristics", kw: ["minimax", "alpha beta", "chess", "deep blue", "ai"] },
      { name: "Markov Decision Process Value Iteration", kw: ["markov decision process", "mdp", "reinforcement learning", "ai"] },
      { name: "Support Vector Margin Classification", kw: ["support vector machines", "svm", "kernel trick", "machine learning"] },
      { name: "Hidden Markov Speech Modeling", kw: ["hidden markov model", "hmm", "speech recognition", "ai"] }
    ]
  },
  {
    topic: "Distributed Systems",
    tlds: ["berkeley.edu", "cern.ch", "cs.wisc.edu", "globus.org", "sdsc.edu"],
    subjects: [
      { name: "Condor Cycle Scavenging Pool", kw: ["condor", "high throughput computing", "cycle scavenging", "distributed"] },
      { name: "Lamport Distributed Clocks", kw: ["logical clocks", "leslie lamport", "distributed systems", "consensus"] },
      { name: "Byzantine Agreement Protocols", kw: ["byzantine fault tolerance", "distributed systems", "consensus"] },
      { name: "Distributed Shared Memory Pages", kw: ["distributed shared memory", "shared memory", "cluster computing"] },
      { name: "Message Passing Interface Buffering", kw: ["mpi", "parallel computing", "supercomputers", "distributed"] },
      { name: "NFS Remote Procedure Calls", kw: ["nfs", "sun microsystems", "network file system", "distributed"] },
      { name: "Beowulf Commodity Linux Clustering", kw: ["beowulf cluster", "commodity hardware", "supercomputer", "linux"] },
      { name: "Distributed Object Brokering CORBA", kw: ["corba", "omg", "distributed objects", "middleware"] }
    ]
  },
  {
    topic: "Mechanical Keyboards",
    tlds: ["deskthority.net", "geekhack.org", "ibm-archives.org", "vintagekeyboards.com"],
    subjects: [
      { name: "Cherry MX Mechanical Switch Patents", kw: ["cherry mx", "key switch", "tactile", "mechanical keyboards"] },
      { name: "Alps Electric Mechanical Mechanisms", kw: ["alps switches", "mechanical keyboards", "vintage", "hardware"] },
      { name: "Capacitive Beam Spring Terminal Switches", kw: ["beam spring", "ibm 3270", "capacitive", "mechanical keyboards"] },
      { name: "Space-cadet Symbolic Lisp Keyboard", kw: ["space-cadet", "mit", "lisp machine", "keyboard", "hardware"] },
      { name: "Dye-Sublimated PBT Keycap Longevity", kw: ["keycaps", "pbt", "abs", "dye-sublimation", "mechanical keyboards"] },
      { name: "Northgate OmniKey Layout Mechanics", kw: ["northgate omnikey", "mechanical keyboards", "function keys", "alps"] },
      { name: "Apple Extended Keyboard II Damped Alps", kw: ["apple extended keyboard", "aek ii", "alps switch", "vintage mac"] },
      { name: "Topre Capacitive Contactless Actuation", kw: ["topre", "electrostatic capacitive", "switches", "keyboards"] }
    ]
  },
  {
    topic: "Computer Networking",
    tlds: ["ietf.org", "cisco.com", "isi.edu", "arpa.mil", "acm.org"],
    subjects: [
      { name: "IPv4 Packet Header Structure", kw: ["tcp/ip", "ipv4", "vint cerf", "networking", "packet switching"] },
      { name: "ARPANET Interface Message Processor IMP", kw: ["arpanet", "imp", "packet switching", "bbn", "networking"] },
      { name: "Ethernet Collision Detection Metcalfe", kw: ["ethernet", "csma/cd", "robert metcalfe", "local area network"] },
      { name: "BGP-4 Inter-Domain Routing", kw: ["bgp", "routing", "autonomous system", "internet backbone"] },
      { name: "DNS Name Resolution RFC 1035", kw: ["dns", "domain name system", "mockapetris", "nameservers"] },
      { name: "Token Ring Dual Ring Topology", kw: ["token ring", "ibm", "token passing", "local area network"] },
      { name: "ATM Asynchronous Cell Relay", kw: ["atm", "cell relay", "telecommunications", "networking"] },
      { name: "OSI Reference Protocol Model", kw: ["osi model", "seven layers", "protocols", "iso", "networking"] }
    ]
  },
  {
    topic: "Programming Languages",
    tlds: ["bell-labs.com", "cs.stanford.edu", "sunsite.unc.edu", "inria.fr", "ansi.org"],
    subjects: [
      { name: "Lisp S-Expression Macro Calculus", kw: ["lisp", "john mccarthy", "s-expressions", "lambda", "compilers"] },
      { name: "Smalltalk-80 Message Passing Objects", kw: ["smalltalk", "object oriented", "alan kay", "xerox parc"] },
      { name: "Pascal Structured Type Safety", kw: ["pascal", "niklaus wirth", "structured programming", "compilers"] },
      { name: "Perl 5 Regular Expression Engine", kw: ["perl", "larry wall", "regular expressions", "scripting"] },
      { name: "Standard ML Hindley-Milner Types", kw: ["standard ml", "type inference", "hindley milner", "functional"] },
      { name: "Forth Threaded Interpretive Engine", kw: ["forth", "charles moore", "stack machine", "threaded code"] },
      { name: "Prolog Unification and Resolution", kw: ["prolog", "logic programming", "unification", "backtracking"] },
      { name: "Haskell 98 Monadic IO Architecture", kw: ["haskell", "pure functional", "monads", "lazy evaluation"] }
    ]
  },
  {
    topic: "Digital Audio Hardware",
    tlds: ["syntharchive.com", "atari.org", "commodore.org", "soundonsound.com"],
    subjects: [
      { name: "Yamaha YM3812 OPL2 Operator Registers", kw: ["opl2", "yamaha", "fm synthesis", "sound blaster", "digital audio"] },
      { name: "General MIDI Instrument Patches", kw: ["midi", "general midi", "synthesizer", "polyphony", "digital audio"] },
      { name: "Roland MT-32 LA Timbral Architecture", kw: ["roland mt-32", "linear arithmetic", "retro computing", "audio"] },
      { name: "Sound Blaster 16 DSP 16-Bit DMA", kw: ["sound blaster 16", "creative labs", "dsp", "dma", "audio"] },
      { name: "Amiga Paula 8-Bit Stereo Channels", kw: ["paula", "amiga", "pcm audio", "stereo dma", "retro computing"] },
      { name: "Gravis UltraSound GF1 Hardware Mixing", kw: ["gravis ultrasound", "gus", "wavetable", "demoscene", "audio"] },
      { name: "AdLib Sound Card Dual Operators", kw: ["adlib", "opl2", "pc audio", "retro computing"] },
      { name: "ProTracker Amiga MOD Sample Playback", kw: ["tracker", "mod format", "protracker", "demoscene", "audio"] }
    ]
  }
];

// Target: 480 legitimate pages total: 26 original + 454 generated
const additionalTarget = 480 - original26.length; // 454
const generatedOrganicPages = [];

for (let i = 0; i < additionalTarget; i++) {
  const domain = DOMAINS[i % DOMAINS.length];
  const subject = domain.subjects[i % domain.subjects.length];
  const tld = domain.tlds[i % domain.tlds.length];
  const pageIndex = 27 + i;
  const padNum = String(pageIndex).padStart(3, "0");
  const id = `doc-${padNum}`;

  const views = Math.floor(18000 + (Math.sin(pageIndex * 1.5) + 1) * 120000);
  const avgTimeOnPage = Math.floor(115 + (Math.cos(pageIndex * 2.1) + 1) * 85); // 115s - 285s
  const inboundLinks = Math.floor(12 + (Math.sin(pageIndex * 2.7) + 1) * 28); // 12 - 68 links
  const inboundQuality = parseFloat((0.80 + ((pageIndex % 8) * 0.02)).toFixed(2));
  const outboundLinks = Math.floor(6 + ((pageIndex * 2) % 15));
  const outboundTrust = parseFloat((0.85 + ((pageIndex % 7) * 0.018)).toFixed(2));
  const qualityScore = parseFloat((0.88 + ((pageIndex % 10) * 0.01)).toFixed(2));
  const freshnessScore = parseFloat((0.78 + ((pageIndex % 12) * 0.012)).toFixed(2));
  const impressions = Math.floor(views * (0.65 + ((pageIndex % 4) * 0.08)));
  const ctr = 0.09 + ((pageIndex % 6) * 0.016);
  const aggregateClicks = Math.floor(impressions * ctr);
  const satisfactionRate = parseFloat((0.88 + ((pageIndex % 7) * 0.014)).toFixed(2));

  generatedOrganicPages.push({
    id,
    title: `${subject.name}: Technical Retrospective and Analysis`,
    url: `https://www.${tld}/${domain.topic.toLowerCase().replace(/[^a-z0-9]/g, "-")}/${subject.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`,
    description: `Comprehensive documentation and architectural survey of ${subject.name}, analyzing historical significance in ${domain.topic} and system design.`,
    content: `The emergence of ${subject.name} represents a foundational contribution to ${domain.topic}. By unifying rigorous engineering principles with robust protocols, this architecture influenced generations of engineers, researchers, and systems designers worldwide. Key aspects include modular specifications, performance guarantees, and formal validation.`,
    keywords: subject.kw,
    topics: [domain.topic],
    views,
    avgTimeOnPage,
    inboundLinks,
    inboundQuality,
    outboundLinks,
    outboundTrust,
    qualityScore,
    publishDate: `1998-${String((pageIndex % 5) + 1).padStart(2, "0")}-${String((pageIndex % 28) + 1).padStart(2, "0")}`,
    freshnessScore,
    aggregateClicks,
    impressions,
    satisfactionRate
  });
}

// 20 Adversarial / Loophole Attempt Pages (loophole-01 to loophole-20)
const loopholePages = [
  {
    id: "loophole-01",
    strategy: "Extreme Keyword Stuffing (AltaVista 1995 vector)",
    targetSignal: "relevance",
    intendedLoophole: "Injecting target keywords 40+ times in title, description, and content to achieve maximum theoretical keyword frequency.",
    title: "Linux Operating Systems Linux Kernel Open Source Operating Systems Linux",
    url: "https://www.keyword-stuffing-factory.biz/free-linux-download.html",
    description: "Linux linux operating systems open source linux kernel linux operating systems linux open source kernel download linux operating systems.",
    content: "Linux linux linux operating systems operating systems open source open source kernel kernel linux linux operating systems operating systems linux open source linux kernel operating systems.",
    keywords: ["linux", "operating systems", "open source", "kernel", "linux kernel", "operating system"],
    topics: ["Operating Systems", "Keyword Spam"],
    views: 12000,
    avgTimeOnPage: 12, // 12 seconds bounce
    inboundLinks: 4,
    inboundQuality: 0.20,
    outboundLinks: 45,
    outboundTrust: 0.15,
    qualityScore: 0.15,
    publishDate: "1998-05-20",
    freshnessScore: 0.95,
    aggregateClicks: 1200,
    impressions: 45000,
    satisfactionRate: 0.12
  },
  {
    id: "loophole-02",
    strategy: "Viral Viewcounter Bot / Hit Inflator",
    targetSignal: "popularity",
    intendedLoophole: "Artificially inflating raw views to 5,000,000 to see if high traffic can overwhelm relevance and link authority.",
    title: "10 Mind-Blowing Facts About Astronomy and Space Telescopes",
    url: "https://viral-hits-galaxy.com/astronomy-shocking-facts.html",
    description: "You will not believe these shocking telescope discoveries! Read our viral astronomy list right now!",
    content: "Space telescopes are so cool! Everyone loves astronomy and space telescopes. Click our sponsors to support astronomy facts!",
    keywords: ["astronomy", "space telescope", "space", "galaxies"],
    topics: ["Space & Astronomy", "Viral Clickbait"],
    views: 5000000,
    avgTimeOnPage: 16,
    inboundLinks: 6,
    inboundQuality: 0.35,
    outboundLinks: 50,
    outboundTrust: 0.20,
    qualityScore: 0.20,
    publishDate: "1998-05-19",
    freshnessScore: 0.98,
    aggregateClicks: 850000,
    impressions: 3200000,
    satisfactionRate: 0.22
  },
  {
    id: "loophole-03",
    strategy: "Abandoned Tab / Dwell Time Inflation",
    targetSignal: "engagement",
    intendedLoophole: "Simulating a 7,200 second (2-hour) average session to trick dwell-time scoring into awarding infinite engagement points.",
    title: "Live Automated Server Hardware Monitor Log Stream",
    url: "https://idle-server-stream.net/workstation-benchmarks.html",
    description: "Real-time automated logging stream for Unix operating systems and workstation hardware benchmarks.",
    content: "Automated hardware counter log. Unix operating systems benchmarks context switch latencies and socket stream outputs across multi-socket workstations.",
    keywords: ["operating systems", "unix", "workstation", "benchmarks"],
    topics: ["Operating Systems", "Diagnostics"],
    views: 8500,
    avgTimeOnPage: 7200,
    inboundLinks: 8,
    inboundQuality: 0.60,
    outboundLinks: 5,
    outboundTrust: 0.70,
    qualityScore: 0.65,
    publishDate: "1998-01-10",
    freshnessScore: 0.75,
    aggregateClicks: 950,
    impressions: 12000,
    satisfactionRate: 0.60
  },
  {
    id: "loophole-04",
    strategy: "Synthetic Link Farm Ring",
    targetSignal: "links",
    intendedLoophole: "Flooding the graph with 500 inbound links from dummy low-reputation web directories.",
    title: "Directory of Computer History and Retro Computing Links",
    url: "https://www.global-link-directory-ring-98.com/retro-computing.html",
    description: "The ultimate directory of retro computing links, microcomputers, hardware archives, and computer history sites.",
    content: "Index of retro computing resources: microcomputers, apple ii, commodore, amiga, and computer history archives. Link back to our link farm to join.",
    keywords: ["retro computing", "microcomputers", "computer history", "hardware"],
    topics: ["Retro Computing", "Link Farm"],
    views: 22000,
    avgTimeOnPage: 28,
    inboundLinks: 500,
    inboundQuality: 0.15,
    outboundLinks: 120,
    outboundTrust: 0.12,
    qualityScore: 0.25,
    publishDate: "1998-04-01",
    freshnessScore: 0.85,
    aggregateClicks: 1800,
    impressions: 25000,
    satisfactionRate: 0.25
  },
  {
    id: "loophole-05",
    strategy: "Click-Hijack / CTR Spoofing Bot",
    targetSignal: "behavior",
    intendedLoophole: "Generating a 95% click-through rate (CTR) to artificially inflate user behavior metrics despite terrible satisfaction.",
    title: "FREE Retro Computing Games and Emulators Download Now",
    url: "https://click-trap-emulators.org/retro-computing-downloads.html",
    description: "Download 1,000 free retro computing games and emulators! Click here to download instantly without waiting!",
    content: "Free retro computing emulators and games! Click the flashing banner to begin your retro computing software download.",
    keywords: ["retro computing", "emulators", "games", "computer history"],
    topics: ["Retro Computing", "Click Fraud"],
    views: 48000,
    avgTimeOnPage: 10,
    inboundLinks: 5,
    inboundQuality: 0.30,
    outboundLinks: 35,
    outboundTrust: 0.18,
    qualityScore: 0.18,
    publishDate: "1998-05-15",
    freshnessScore: 0.94,
    aggregateClicks: 95000,
    impressions: 100000,
    satisfactionRate: 0.08
  },
  {
    id: "loophole-06",
    strategy: "Anchor Text Spoofing / Deceptive Title Bait",
    targetSignal: "relevance",
    intendedLoophole: "Title promises official academic documentation, but body is commercial marketing.",
    title: "Anatomy of Large-Scale Hypertextual Web Search Engines: Official Stanford Research",
    url: "https://www.stanford-paper-mirror-scam.biz/search-engine-rank.html",
    description: "Official publication on web search engine algorithms, web crawler architecture, and hyperlink graph analysis.",
    content: "Looking to rank #1 on search engines? We provide guaranteed search engine optimization submission services to 500 web crawlers!",
    keywords: ["search engine", "web crawler", "stanford", "hyperlink graph", "pagerank"],
    topics: ["Search Engines", "SEO Spam"],
    views: 35000,
    avgTimeOnPage: 19,
    inboundLinks: 8,
    inboundQuality: 0.40,
    outboundLinks: 60,
    outboundTrust: 0.25,
    qualityScore: 0.30,
    publishDate: "1998-05-01",
    freshnessScore: 0.90,
    aggregateClicks: 6500,
    impressions: 38000,
    satisfactionRate: 0.20
  },
  {
    id: "loophole-07",
    strategy: "Omni-Topic Keyword Splattering",
    targetSignal: "relevance",
    intendedLoophole: "Splattering unrelated keywords across all popular categories to rank across every search.",
    title: "The Ultimate Guide: Linux Operating Systems, Hubble Space Telescope, Coffee Brewing & Cryptography",
    url: "https://omni-splatter-topics.net/ultimate-all-in-one-guide.html",
    description: "Explore Linux open source operating systems, Hubble space telescope astronomy, pour-over coffee brewing, and RSA cryptography privacy in one place.",
    content: "Welcome! Here is Linux operating systems. Also Hubble space telescope astronomy. Don't forget espresso coffee brewing extraction. And public key cryptography digital privacy encryption.",
    keywords: ["linux", "operating systems", "space telescope", "astronomy", "coffee brewing", "espresso", "cryptography", "digital privacy"],
    topics: ["Operating Systems", "Space & Astronomy", "Coffee Culture", "Digital Privacy"],
    views: 18000,
    avgTimeOnPage: 22,
    inboundLinks: 7,
    inboundQuality: 0.35,
    outboundLinks: 28,
    outboundTrust: 0.30,
    qualityScore: 0.25,
    publishDate: "1998-04-10",
    freshnessScore: 0.86,
    aggregateClicks: 2100,
    impressions: 24000,
    satisfactionRate: 0.21
  },
  {
    id: "loophole-08",
    strategy: "Outbound Citation Parasitism",
    targetSignal: "links",
    intendedLoophole: "Linking out to 30 authoritative institutions (W3C, CERN, MIT, NASA) to artificially inflate outbound trust score.",
    title: "Directory of Trusted Web Standards and Science Resources",
    url: "https://citation-parasite-network.org/trusted-science-links.html",
    description: "A curated gateway linking out to W3C web standards, CERN hypertext archives, NASA space missions, and MIT research papers.",
    content: "We link to the most trusted organizations in the world: w3.org, cern.ch, nasa.gov, mit.edu, gnu.org. Click our affiliate banners while browsing trusted links.",
    keywords: ["web standards", "w3c", "cern", "space exploration", "science"],
    topics: ["Web Standards", "Directory"],
    views: 14000,
    avgTimeOnPage: 32,
    inboundLinks: 10,
    inboundQuality: 0.50,
    outboundLinks: 30,
    outboundTrust: 0.99,
    qualityScore: 0.40,
    publishDate: "1998-04-15",
    freshnessScore: 0.88,
    aggregateClicks: 1600,
    impressions: 19000,
    satisfactionRate: 0.45
  },
  {
    id: "loophole-09",
    strategy: "Precision Dwell-Time Sweet Spot Bot",
    targetSignal: "engagement",
    intendedLoophole: "Bots keeping browser connection open for exactly 195 seconds to hit the theoretical peak mathematical engagement score.",
    title: "Espresso Extraction Variables: Automated Barista Cheat Sheet",
    url: "https://bot-dwell-barista.com/espresso-extraction-sheet.html",
    description: "A single-page cheat sheet for espresso extraction, coffee brewing pressure, and water temperature variables.",
    content: "Espresso coffee brewing extraction requires 9 bars of pump pressure and 93 degrees Celsius water temperature for specialty coffee barista extraction.",
    keywords: ["espresso", "coffee brewing", "extraction", "barista"],
    topics: ["Coffee Culture"],
    views: 15000,
    avgTimeOnPage: 195,
    inboundLinks: 12,
    inboundQuality: 0.70,
    outboundLinks: 6,
    outboundTrust: 0.75,
    qualityScore: 0.70,
    publishDate: "1998-04-20",
    freshnessScore: 0.89,
    aggregateClicks: 1800,
    impressions: 14000,
    satisfactionRate: 0.72
  },
  {
    id: "loophole-10",
    strategy: "Near-Duplicate Scraper / Mirror",
    targetSignal: "quality",
    intendedLoophole: "Scraping the authentic GNU philosophy article verbatim with tiny affiliate links injected at bottom.",
    title: "The Free Software Definition and Unix Philosophy (Mirror Archive)",
    url: "https://scraped-mirrors-unlimited.net/gnu/free-software-philosophy.html",
    description: "Mirrored text of the Free Software definition, user freedoms, and the Unix modular tool philosophy for open operating systems.",
    content: "Free software means that the users have the freedom to run, copy, distribute, study, change and improve the software. The Unix philosophy encourages building small programs that do one thing well and compose through standard text streams. Sponsored by Discount Modem Warehouses.",
    keywords: ["free software", "open source", "unix philosophy", "operating systems", "gnu"],
    topics: ["Open Source", "Operating Systems"],
    views: 28000,
    avgTimeOnPage: 85,
    inboundLinks: 11,
    inboundQuality: 0.55,
    outboundLinks: 14,
    outboundTrust: 0.60,
    qualityScore: 0.60,
    publishDate: "1998-05-10",
    freshnessScore: 0.92,
    aggregateClicks: 2400,
    impressions: 22000,
    satisfactionRate: 0.65
  },
  {
    id: "loophole-11",
    strategy: "Regex Meta-Character & Sanitization Injection",
    targetSignal: "relevance",
    intendedLoophole: "Injecting regex syntax (.*+?^${}()|[]) into title and content attempting to crash tokenization or escape regex bounds.",
    title: "Operating Systems .*+?^${}()|[] [A-Z0-9] Linux Kernel Exploit Test",
    url: "https://security-fuzz-testing.org/regex-injection-payload.html",
    description: "Testing tokenization robustness against regex meta-characters .*+?^${}()|[] in open source operating systems indices.",
    content: "Fuzz testing query engines with raw unescaped regex strings: (.*?) | (\\w+) | [^a-z] | $1 $2 $3 operating systems linux kernel.",
    keywords: ["operating systems", "linux kernel", "fuzzing", "regex"],
    topics: ["Operating Systems", "Security Testing"],
    views: 9500,
    avgTimeOnPage: 120,
    inboundLinks: 14,
    inboundQuality: 0.85,
    outboundLinks: 8,
    outboundTrust: 0.80,
    qualityScore: 0.80,
    publishDate: "1998-04-05",
    freshnessScore: 0.87,
    aggregateClicks: 900,
    impressions: 8000,
    satisfactionRate: 0.82
  },
  {
    id: "loophole-12",
    strategy: "Micropage Exact Keyword Density (100% density)",
    targetSignal: "relevance",
    intendedLoophole: "Having only 3 words on the entire page so the query terms represent 100% of document word count.",
    title: "Linux Operating Systems",
    url: "https://minimal-three-words-page.com/linux.html",
    description: "Linux operating systems.",
    content: "Linux operating systems.",
    keywords: ["linux", "operating systems"],
    topics: ["Operating Systems"],
    views: 4500,
    avgTimeOnPage: 8,
    inboundLinks: 2,
    inboundQuality: 0.30,
    outboundLinks: 1,
    outboundTrust: 0.50,
    qualityScore: 0.20,
    publishDate: "1998-03-01",
    freshnessScore: 0.82,
    aggregateClicks: 350,
    impressions: 9000,
    satisfactionRate: 0.15
  },
  {
    id: "loophole-13",
    strategy: "Zero-Click / High-Bounce Clickbait Trap",
    targetSignal: "behavior",
    intendedLoophole: "Sensationalized title triggering clicks, but immediate bounce due to misleading content.",
    title: "LEAKED: NASA Hubble Space Telescope Found Alien Structures Near Ursa Major!",
    url: "https://tabloid-space-news-98.com/alien-hubble-leaked-photo.html",
    description: "Shocking leaked deep field images from the Hubble space telescope show clear artificial structures in distant galaxy clusters!",
    content: "Astronomers at NASA cannot explain this mysterious Hubble space telescope photograph! Buy our alien documentary video tape for $19.95.",
    keywords: ["hubble space telescope", "astronomy", "nasa", "galaxies", "space telescope"],
    topics: ["Space & Astronomy", "Hoax"],
    views: 310000,
    avgTimeOnPage: 14,
    inboundLinks: 8,
    inboundQuality: 0.25,
    outboundLinks: 40,
    outboundTrust: 0.20,
    qualityScore: 0.15,
    publishDate: "1998-05-16",
    freshnessScore: 0.96,
    aggregateClicks: 62000,
    impressions: 210000,
    satisfactionRate: 0.11
  },
  {
    id: "loophole-14",
    strategy: "Reciprocal Web Ring Inbound Link Stuffing",
    targetSignal: "links",
    intendedLoophole: "Joining a circular reciprocal web ring of 80 coffee sites where every member links to every other member.",
    title: "The Great WebRing of Specialty Coffee Brewing and Espresso Enthusiasts",
    url: "https://coffee-ring-hub-member42.org/webring-index.html",
    description: "Member of the International Coffee Brewing WebRing. Previous Site | Next Site | Random Coffee Site.",
    content: "Welcome to our coffee brewing webring page. Explore espresso extraction, coffee brewing techniques, and visit other coffee webring members.",
    keywords: ["coffee brewing", "espresso", "webring", "specialty coffee"],
    topics: ["Coffee Culture", "Web Ring"],
    views: 19000,
    avgTimeOnPage: 45,
    inboundLinks: 82,
    inboundQuality: 0.45,
    outboundLinks: 82,
    outboundTrust: 0.45,
    qualityScore: 0.40,
    publishDate: "1998-03-25",
    freshnessScore: 0.85,
    aggregateClicks: 1700,
    impressions: 16000,
    satisfactionRate: 0.40
  },
  {
    id: "loophole-15",
    strategy: "Freshness Manipulation / Hyper-Recent Timestamp",
    targetSignal: "quality",
    intendedLoophole: "Constantly setting timestamp to current date (May 20, 1998) hoping freshness weight will catapult result to #1.",
    title: "TODAY'S LATEST UPDATES: Retro Computing History News Bulletin",
    url: "https://daily-bulletin-today.net/retro-computing-breaking-news.html",
    description: "Updated 5 minutes ago! The latest breaking news bulletin on retro computing, home microcomputers, and vintage hardware.",
    content: "Breaking retro computing news: updates on vintage hardware restorations, Apple II disk drives, and Commodore 64 hobbyist clubs.",
    keywords: ["retro computing", "microcomputers", "news", "computer history"],
    topics: ["Retro Computing", "News"],
    views: 24000,
    avgTimeOnPage: 60,
    inboundLinks: 12,
    inboundQuality: 0.65,
    outboundLinks: 10,
    outboundTrust: 0.60,
    qualityScore: 0.55,
    publishDate: "1998-05-20",
    freshnessScore: 1.00,
    aggregateClicks: 2800,
    impressions: 21000,
    satisfactionRate: 0.55
  },
  {
    id: "loophole-16",
    strategy: "Single-Letter Acronym Overlap Exploitation",
    targetSignal: "relevance",
    intendedLoophole: "Stuffing single letter acronyms ('C', 'OS', 'IP') hoping to match short queries erroneously.",
    title: "C OS IP IT PC AI: Comprehensive Acronym Glossary for Tech",
    url: "https://acronym-cheat-dictionary.org/all-tech-letters.html",
    description: "Definitions for C, OS, IP, IT, PC, AI, DB, UI, WWW and hundreds of two-letter technology abbreviations.",
    content: "C is a programming language. OS means operating systems. IP means internet protocol. PC means personal computer. AI means artificial intelligence.",
    keywords: ["c", "os", "ip", "ai", "pc", "operating systems"],
    topics: ["Reference", "Glossary"],
    views: 16000,
    avgTimeOnPage: 40,
    inboundLinks: 15,
    inboundQuality: 0.60,
    outboundLinks: 12,
    outboundTrust: 0.65,
    qualityScore: 0.50,
    publishDate: "1998-02-14",
    freshnessScore: 0.82,
    aggregateClicks: 1400,
    impressions: 15000,
    satisfactionRate: 0.50
  },
  {
    id: "loophole-17",
    strategy: "Low-Traffic Isolated Masterpiece (Zero Popularity / Zero Links)",
    targetSignal: "popularity & links",
    intendedLoophole: "Testing if an extraordinary, deeply researched paper with 0 views and 0 inbound links gets buried completely.",
    title: "Mathematical Foundations of Asymmetric Elliptic Curve Cryptography",
    url: "https://isolated-researcher-homepage.org/ecc-foundations-1998.html",
    description: "An unpublished academic preprint detailing Weierstrass equations, discrete logarithm intractability, and digital privacy implementations.",
    content: "We present a comprehensive mathematical framework for elliptic curve cryptography over finite fields GF(p). Analyzing Pohlig-Hellman reductions and Pollard rho algorithms confirms superior cryptographic bit-strength compared to equivalent RSA modulus sizes, establishing key foundations for next-generation digital privacy protocols.",
    keywords: ["cryptography", "elliptic curve", "digital privacy", "rsa", "encryption"],
    topics: ["Cryptography", "Digital Privacy", "Mathematics"],
    views: 120,
    avgTimeOnPage: 380,
    inboundLinks: 1,
    inboundQuality: 0.85,
    outboundLinks: 24,
    outboundTrust: 0.98,
    qualityScore: 0.99,
    publishDate: "1998-05-01",
    freshnessScore: 0.91,
    aggregateClicks: 85,
    impressions: 420,
    satisfactionRate: 0.98
  },
  {
    id: "loophole-18",
    strategy: "Massive Outbound Link Farm (Outbound Hygiene Exploitation)",
    targetSignal: "links",
    intendedLoophole: "Testing whether 250 outbound links to untrusted low-quality ad sites triggers the link farm penalty.",
    title: "10,000 Links to Everything: Operating Systems, Games, and Software",
    url: "https://mega-link-farm-hub-98.com/all-software-links.html",
    description: "Directory with 10,000 links to operating systems, shareware, open source downloads, and utilities.",
    content: "Click below for open source operating systems links, linux kernel mirrors, shareware archives, banner exchanges, and web counters.",
    keywords: ["operating systems", "open source", "linux kernel", "software"],
    topics: ["Operating Systems", "Link Farm"],
    views: 42000,
    avgTimeOnPage: 25,
    inboundLinks: 25,
    inboundQuality: 0.40,
    outboundLinks: 250,
    outboundTrust: 0.15,
    qualityScore: 0.20,
    publishDate: "1998-04-12",
    freshnessScore: 0.87,
    aggregateClicks: 3200,
    impressions: 38000,
    satisfactionRate: 0.22
  },
  {
    id: "loophole-19",
    strategy: "Zero-Division / Underflow Edge Case Test",
    targetSignal: "behavior & popularity",
    intendedLoophole: "Passing 0 views, 0 impressions, 0 clicks, and 0 seconds dwell time to test for NaN, Infinity, or crash vulnerabilities.",
    title: "Brand New Unindexed Document on Unix Operating Systems",
    url: "https://new-ghost-page-zero.net/unix-operating-systems-test.html",
    description: "A newly created page on Unix operating systems with zero recorded visits or traffic metrics.",
    content: "Unix operating systems architectures, shell scripts, and system call interfaces for multi-user time-sharing computers.",
    keywords: ["unix", "operating systems", "time sharing"],
    topics: ["Operating Systems"],
    views: 0,
    avgTimeOnPage: 0,
    inboundLinks: 0,
    inboundQuality: 0,
    outboundLinks: 0,
    outboundTrust: 0,
    qualityScore: 0.50,
    publishDate: "1998-05-20",
    freshnessScore: 0.95,
    aggregateClicks: 0,
    impressions: 0,
    satisfactionRate: 0
  },
  {
    id: "loophole-20",
    strategy: "Keyword Cannibalization across Plural & Suffixes",
    targetSignal: "relevance",
    intendedLoophole: "Generating variations: 'operating system', 'operating systems', 'operating-system', 'os' to test tokenization deduplication.",
    title: "Operating System Operating Systems Operating-Systems OS Operating Systems",
    url: "https://plural-suffix-cannibal.com/operating-systems.html",
    description: "Every variation of operating system, operating systems, operating-system, and OS explained for computer science students.",
    content: "Whether you say operating system or operating systems or operating-system or OS, operating systems are systems that operate computing hardware.",
    keywords: ["operating system", "operating systems", "operating-systems", "os"],
    topics: ["Operating Systems"],
    views: 14000,
    avgTimeOnPage: 35,
    inboundLinks: 8,
    inboundQuality: 0.50,
    outboundLinks: 6,
    outboundTrust: 0.55,
    qualityScore: 0.45,
    publishDate: "1998-04-22",
    freshnessScore: 0.88,
    aggregateClicks: 1200,
    impressions: 16000,
    satisfactionRate: 0.38
  }
];

// Combine to exactly 500 documents: 26 original + 454 generated organic + 20 loophole
const all500Pages = [...original26, ...generatedOrganicPages, ...loopholePages];

console.log(`Generated total documents: ${all500Pages.length}`);
console.log(`- Original canonical pages preserved: ${original26.length}`);
console.log(`- Additional generated organic pages: ${generatedOrganicPages.length}`);
console.log(`- Adversarial loophole pages: ${loopholePages.length}`);

// Write to js/dataset.js
const outputCode = `/**
 * ARCHON SEARCH '98 - 500 Document Benchmark Corpus
 * 
 * Contains exactly 500 web documents:
 * - 480 legitimate pages across 12 diverse academic, technical & cultural domains
 *   (preserving the 26 canonical foundation pages)
 * - 20 adversarial loophole-seeking pages testing ranking algorithm boundaries:
 *   keyword stuffing, viral bot traffic, dwell-time inflation, synthetic link farms,
 *   CTR click-hijacking, anchor spoofing, and numeric underflow edge cases.
 */

export const SAMPLE_PAGES = ${JSON.stringify(all500Pages, null, 2)};
`;

const outputPath = path.resolve(__dirname, "../js/dataset.js");
fs.writeFileSync(outputPath, outputCode, "utf-8");
console.log(`Successfully written 500 documents to: ${outputPath}`);
