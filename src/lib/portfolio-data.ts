import {
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Globe,
  MessageCircle,
  Send,
  BarChart3,
  Brain,
  Users,
  Rocket,
  ShieldCheck,
  Code2,
  Server,
  Boxes,
  Wrench,
  Headphones,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

export const profile = {
  name: "Royford Wanyoike",
  alias: "Youngshark3",
  firstName: "Royford",
  lastName: "Wanyoike",
  title: "Software Engineer & Developer Advocate",
  tagline: "trying to be a code connoisseur",
  location: "Nairobi, Kenya",
  email: "roywanyoike328@gmail.com",
  phone: "+254706103000",
  phoneHref: "+254706103000",
  available: true,
  yearsExperience: "3+",
  // Recruiter-focused: scannable elevator pitch (USP) — leads with value, not adjectives
  usp: "I build full-stack apps and low-code solutions, keep them running smoothly, and help the people who use them — then I teach others how I did it.",
  // What roles I'm targeting — recruiters want clear intent
  openTo: [
    "Full-Stack Engineer",
    "Frontend Engineer (React/Next/Angular)",
    "Technical Support Engineer",
    "Low-Code / Quickbase Developer",
    "Developer Advocate",
  ],
  // Quick-scan tech badges for hero
  coreStack: ["React", "Next.js", "Node.js", "TypeScript", "Angular", "Quickbase"],
  summary:
    "Nairobi-based Software Engineer with 3+ years shipping scalable full-stack apps, low-code solutions, and the support layer that keeps them healthy. Quickbase Professional Builder certified. I build with Node.js, Angular, and React/Next.js — and I'm equally comfortable triaging bugs, writing runbooks, and walking non-technical users through fixes.",
  longSummary:
    "I'm a Nairobi-based software engineer who lives at the intersection of full-stack engineering, low-code platforms, and developer support. Currently building at Imminent Transcendent Solutions, I specialize in Quickbase (Professional Builder certified) and the modern JavaScript ecosystem — Node.js, Angular, React, Next.js, Vue, and Svelte.\n\nI also wear the support hat: triaging production issues, writing runbooks, reproducing bugs end-to-end with Playwright, and translating technical findings into plain-language fixes for non-technical users. Beyond the keyboard, I'm an active conference speaker, an open-source contributor with 100+ public repositories, and a proud member of the Quickbase Qrew community.",
  roles: [
    "Software Engineer",
    "Technical Support Engineer",
    "Developer Advocate",
    "Quickbase Builder",
    "Full-Stack Developer",
    "Open-Source Contributor",
  ],
  // Real LinkedIn profile — serves as living resume for recruiters
  resumeUrl: "https://www.linkedin.com/in/roywanyoike/",
};

// Engineering philosophy — recruiters explicitly want to see "how you think"
export const philosophy: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Brain,
    title: "Understand before I build",
    body: "I spend more time reading the problem than typing the solution. A 30-minute spec conversation saves a 3-day rewrite. I ask 'what changes if this succeeds 10x?' before choosing an architecture.",
  },
  {
    icon: LifeBuoy,
    title: "Support is a feature, not a chore",
    body: "Every bug report is a free user-research session. I reproduce it with Playwright, write the runbook while it's fresh, and reply in plain language — so the next person with the same issue finds the answer waiting.",
  },
  {
    icon: Rocket,
    title: "Ship small, ship often",
    body: "I'd rather merge 5 small PRs than 1 big one. Small ships mean fast feedback, easy rollbacks, and reviewers who actually read the code. CI is a teammate, not a gatekeeper.",
  },
  {
    icon: Users,
    title: "Code is for humans, then machines",
    body: "I optimize for the next dev reading my code — or the next user reading the error message. Clear names, small functions, and a PR description that explains the 'why' beat clever one-liners every time.",
  },
];

// Real, verifiable impact metrics — recruiters want quantifiable outcomes
export const impactMetrics = [
  { value: "100+", label: "Public repositories", sublabel: "shipped & maintained" },
  { value: "33★", label: "Top repo (TechnicalWritingProgram)", sublabel: "curated dev resource" },
  { value: "37", label: "Forks on cars-plates-checker", sublabel: "used by other devs" },
  { value: "3+", label: "Conference talks delivered", sublabel: "React, testing, Svelte" },
  { value: "Pro", label: "Quickbase Builder certified", sublabel: "2024 credential" },
  { value: "93", label: "GitHub followers", sublabel: "organic reach" },
];

export type SocialLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  handle: string;
};

export const socials: SocialLink[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/roywanyoike/",
    icon: Linkedin,
    handle: "in/roywanyoike",
  },
  {
    label: "GitHub",
    href: "https://github.com/Roy-Wanyoike",
    icon: Github,
    handle: "Roy-Wanyoike",
  },
  {
    label: "X / Twitter",
    href: "https://x.com/WanyoikeRoyford",
    icon: Twitter,
    handle: "@WanyoikeRoyford",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/roy_wanyoike/",
    icon: Instagram,
    handle: "@roy_wanyoike",
  },
  {
    label: "Tableau",
    href: "https://public.tableau.com/app/profile/royford.wanyoike",
    icon: BarChart3,
    handle: "royford.wanyoike",
  },
  {
    label: "Linktree",
    href: "https://linktr.ee/roywanyoike",
    icon: Globe,
    handle: "roywanyoike",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/254706103000",
    icon: MessageCircle,
    handle: "+254 706 103 000",
  },
  {
    label: "Telegram",
    href: "https://t.me/roywanyoike",
    icon: Send,
    handle: "@roywanyoike",
  },
];

export const contactMethods = [
  { label: "Email", value: "roywanyoike328@gmail.com", href: "mailto:roywanyoike328@gmail.com", icon: Mail },
  { label: "Phone", value: "+254 706 103 000", href: "tel:+254706103000", icon: Phone },
  { label: "Location", value: "Nairobi, Kenya", href: "https://maps.google.com/?q=Nairobi,Kenya", icon: MapPin },
];

export type SkillCategory = {
  title: string;
  icon: LucideIcon;
  skills: { name: string; level: number }[];
};

export const skillCategories: SkillCategory[] = [
  {
    title: "Frontend",
    icon: Code2,
    skills: [
      { name: "React", level: 90 },
      { name: "Next.js", level: 88 },
      { name: "Angular", level: 82 },
      { name: "Vue.js", level: 78 },
      { name: "Svelte / Svelte Native", level: 80 },
      { name: "TypeScript", level: 85 },
    ],
  },
  {
    title: "Backend",
    icon: Server,
    skills: [
      { name: "Node.js", level: 88 },
      { name: "REST API Design", level: 85 },
      { name: "NextAuth", level: 80 },
      { name: "Python", level: 75 },
      { name: "Data Engineering", level: 72 },
    ],
  },
  {
    title: "Low-Code & Platforms",
    icon: Boxes,
    skills: [
      { name: "Quickbase (Pro Builder)", level: 90 },
      { name: "Quickbase API", level: 85 },
      { name: "Qrew Community", level: 88 },
      { name: "Tableau", level: 70 },
    ],
  },
  {
    title: "Support & Reliability",
    icon: Headphones,
    skills: [
      { name: "Bug Triage & Reproduction", level: 88 },
      { name: "Playwright E2E / Debugging", level: 82 },
      { name: "Runbooks & Incident Response", level: 80 },
      { name: "Customer / Developer Support", level: 85 },
      { name: "Technical Writing (user-facing)", level: 85 },
    ],
  },
  {
    title: "Tooling & DevOps",
    icon: Wrench,
    skills: [
      { name: "Git / GitHub", level: 90 },
      { name: "CI/CD", level: 75 },
      { name: "DevOps Practices", level: 72 },
      { name: "Observability Basics", level: 70 },
    ],
  },
];

export type Experience = {
  role: string;
  company: string;
  period: string;
  location: string;
  current?: boolean;
  description: string;
  highlights: string[];
  stack: string[];
};

export const experiences: Experience[] = [
  {
    role: "Software Engineer (Build + Support)",
    company: "Imminent Transcendent Solutions",
    period: "2023 — Present",
    location: "Nairobi, Kenya",
    current: true,
    description:
      "Building scalable full-stack applications and low-code solutions for enterprise clients — owning both feature delivery and the support layer that keeps them healthy.",
    highlights: [
      "Shipped low-code enterprise apps on Quickbase for paying clients — earned Professional Builder certification (2024).",
      "Triage production issues end-to-end: reproduce bugs with Playwright, write runbooks, and ship fixes across Node.js + Angular/React services.",
      "Active Qrew community contributor — answered builder questions, shared Quickbase API patterns adopted by other developers.",
      "Mentored junior developers and ran internal sessions on Next.js Server Components and E2E testing.",
    ],
    stack: ["Quickbase", "Node.js", "Angular", "React", "Next.js", "TypeScript", "Playwright"],
  },
  {
    role: "Software Engineer & Developer Advocate",
    company: "Youngshark Technologies / Opteamio / Gigsasa",
    period: "2021 — 2023",
    location: "Nairobi, Kenya",
    description:
      "Delivered full-stack web and mobile features across multiple products, supported users in production, and advocated for the broader developer community through talks, demos, and open-source.",
    highlights: [
      "Shipped production features across Opteamio and Gigsasa platforms in Vue, Svelte, and Node.js.",
      "Supported users in production — reproduced reported bugs, wrote fix patches, and communicated plain-language root causes to non-technical stakeholders.",
      "Represented the company at community events — talks on React Server Components and Playwright E2E testing.",
      "Maintained 100+ public GitHub repos — TechnicalWritingProgram reached 33★ and counting.",
    ],
    stack: ["Vue.js", "Svelte", "Svelte Native", "Node.js", "JavaScript", "Python"],
  },
  {
    role: "Computer Science Student & Academic Nominee",
    company: "Kibabii University",
    period: "2019 — 2023",
    location: "Bungoma, Kenya",
    description:
      "Studied Computer Science and served as SCAI Academic Nominee Aspirant — organizing academic initiatives and leading peer developer communities.",
    highlights: [
      "Served as SCAI Academic Nominee Aspirant for the 2021/2022 academic year.",
      "Founded and contributed to student-led developer communities and hackathons.",
      "Self-taught modern web frameworks alongside coursework — React, Angular, Svelte, Vue.",
    ],
    stack: ["JavaScript", "Python", "Java", "Data Structures", "Algorithms"],
  },
];

export type Project = {
  name: string;
  tagline: string;
  description: string;
  impact?: string; // scannable outcome line — recruiters want metrics up top
  tags: string[];
  href: string;
  stars?: number;
  forks?: number;
  featured?: boolean;
  category: "Open Source" | "App" | "Learning" | "Tool";
};

export const projects: Project[] = [
  {
    name: "TechnicalWritingProgram",
    tagline: "Curated index of orgs & blogs that pay for technical writing",
    description:
      "A living repository cataloging companies, publications, and blogs that pay developers for technical articles — covering Python, JavaScript, Java, and Machine Learning topics. Includes submission guidelines, pay ranges (e.g. StackOverflow at $500/piece), and editor contacts.",
    impact: "33★ · indexed 50+ paying publications · referenced by freelance tech writers",
    tags: ["Open Source", "Technical Writing", "Curated List"],
    href: "https://github.com/Roy-Wanyoike/TechnicalWritingProgram",
    stars: 33,
    featured: true,
    category: "Open Source",
  },
  {
    name: "cars-plates-checker",
    tagline: "Algorithm that counts car plates between two registrations",
    description:
      "An efficient algorithm that takes two car plate numbers as input and outputs the total number of cars registered between them. Handles edge cases and plate format validation. Forked 37+ times by other developers.",
    impact: "37 forks · reused by 30+ developers · handles Kenyan plate formats",
    tags: ["Algorithm", "JavaScript", "Open Source"],
    href: "https://github.com/Roy-Wanyoike/cars-plates-checker",
    forks: 37,
    featured: true,
    category: "Tool",
  },
  {
    name: "svelte-chat-app",
    tagline: "Realtime chat application built with Svelte",
    description:
      "A lightweight, realtime chat application showcasing Svelte's reactivity model and clean component architecture. Demonstrates WebSocket integration, optimistic UI updates, and message persistence patterns.",
    impact: "0-JS-overhead UI · WebSocket realtime · optimistic message rendering",
    tags: ["Svelte", "Realtime", "WebSocket", "JavaScript"],
    href: "https://github.com/Roy-Wanyoike/svelte-chat-app",
    featured: true,
    category: "App",
  },
  {
    name: "weather-app-in-Vuejs3",
    tagline: "Vue 3 weather app with Composition API",
    description:
      "A clean weather forecasting app built with Vue 3's Composition API, demonstrating reactive state management, API integration, and component composition patterns.",
    impact: "Vue 3 Composition API · live weather API · reactive state management",
    tags: ["Vue.js 3", "Composition API", "Weather API"],
    href: "https://github.com/Roy-Wanyoike/weather-app-in-Vuejs3",
    category: "App",
  },
  {
    name: "90DaysOfDevOps",
    tagline: "A 90-day structured DevOps learning journey",
    description:
      "Documented a complete 90-day DevOps learning journey (Jan–Mar 2022) covering Linux, networking, cloud, CI/CD, containers, Kubernetes, IaC, and observability. Forked from Michael Cade's roadmap with personal notes.",
    impact: "90-day curriculum · Linux → K8s → CI/CD → observability · documented notes",
    tags: ["DevOps", "Learning", "Shell", "Kubernetes", "CI/CD"],
    href: "https://github.com/Roy-Wanyoike/90DaysOfDevOps",
    category: "Learning",
  },
  {
    name: "Data-Engineering-with-Python",
    tagline: "Hands-on data engineering notes and notebooks",
    description:
      "Personal notes and worked examples from the Packt 'Data Engineering with Python' course — covering ETL pipelines, data lakes, and stream processing patterns in Python.",
    impact: "ETL pipelines · data lakes · stream processing patterns",
    tags: ["Python", "Data Engineering", "ETL", "Learning"],
    href: "https://github.com/Roy-Wanyoike/Data-Engineering-with-Python",
    category: "Learning",
  },
];

export type Talk = {
  title: string;
  abstract: string;
  topics: string[];
  venue: string;
};

export const talks: Talk[] = [
  {
    title: "Server Components: The Epic Tale of Rendering UX",
    abstract:
      "A fun, story-driven talk tracing how we moved from client-side rendering to SSR and finally to React Server Components. Covers the 0-JS-bundle benefit, a live demo comparing CSR/SSR/RSC, performance analysis, and my take on the future of UI rendering.",
    topics: ["React", "Server Components", "SSR", "Performance"],
    venue: "Community / Conference Talk",
  },
  {
    title: "Everyone Can Easily Write Tests",
    abstract:
      "A practical session showing how Playwright's Codegen generates end-to-end tests from user interactions. Covers UI Mode for better DX, tips to avoid flaky tests, and how to scale tests on CI using shards and debugging strategies.",
    topics: ["Playwright", "E2E Testing", "CI/CD", "DX"],
    venue: "Community / Workshop",
  },
  {
    title: "Showcasing Real-World Mobile Apps Built with Svelte Native",
    abstract:
      "An inspiring tour through real-world mobile apps built with Svelte Native — highlighting the framework's elegance, efficiency, and cross-platform capabilities across diverse app scenarios.",
    topics: ["Svelte Native", "Mobile", "Cross-Platform"],
    venue: "Concept Paper / Talk",
  },
];

export type Certification = {
  title: string;
  issuer: string;
  description: string;
  date: string;
  credentialUrl?: string;
};

export const certifications: Certification[] = [
  {
    title: "Quickbase Professional Builder",
    issuer: "Quickbase University",
    description:
      "Certified as a Professional Builder on the Quickbase ESP platform — demonstrating proficiency in building scalable low-code business applications, workflows, and integrations.",
    date: "2024",
    credentialUrl: "https://www.linkedin.com/posts/roywanyoike_quickbase-quickbaseuniversity-activity-7378721729277308928-Yrnb",
  },
  {
    title: "GitHub Developer Program Member",
    issuer: "GitHub",
    description:
      "Active member of the GitHub Developer Program — building integrations, contributing to open source, and engaging with the broader GitHub developer community.",
    date: "Ongoing",
    credentialUrl: "https://github.com/Roy-Wanyoike",
  },
  {
    title: "Data Engineering with Python",
    issuer: "Packt",
    description:
      "Completed the comprehensive Data Engineering with Python course covering ETL pipelines, data lakes, and stream processing patterns.",
    date: "2022",
    credentialUrl: "https://github.com/Roy-Wanyoike/Data-Engineering-with-Python",
  },
  {
    title: "90 Days of DevOps",
    issuer: "MichaelCade / Community",
    description:
      "Completed a structured 90-day DevOps learning journey covering Linux, cloud, CI/CD, containers, Kubernetes, IaC, and observability.",
    date: "2022",
    credentialUrl: "https://github.com/Roy-Wanyoike/90DaysOfDevOps",
  },
];

export const stats = [
  { label: "Years Experience", value: "3+" },
  { label: "GitHub Repos", value: "108" },
  { label: "GitHub Followers", value: "93" },
  { label: "Conference Talks", value: "3+" },
];

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Philosophy", href: "#philosophy" },
  { label: "Speaking", href: "#speaking" },
  { label: "Certifications", href: "#certifications" },
  { label: "Contact", href: "#contact" },
];
