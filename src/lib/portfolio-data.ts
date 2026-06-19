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
  email: "roywamaitha2001@gmail.com",
  phone: "+254706103000",
  phoneHref: "+254706103000",
  available: true,
  yearsExperience: "3+",
  summary:
    "Passionate Software Engineer based in Nairobi with 3+ years building scalable full-stack applications and low-code solutions. I specialize in Quickbase (Professional Builder certified), Node.js, Angular, and React/Next.js — and I love sharing what I learn with the developer community through talks, open-source, and technical writing.",
  longSummary:
    "I'm a Nairobi-based software engineer who lives at the intersection of full-stack engineering, low-code platforms, and developer advocacy. Currently building at Imminent Transcendent Solutions, I specialize in Quickbase (Professional Builder certified) and the modern JavaScript ecosystem — Node.js, Angular, React, Next.js, Vue, and Svelte.\n\nBeyond the keyboard, I'm an active conference speaker, an open-source contributor with 100+ public repositories, and a proud member of the Quickbase Qrew community. I believe great software is equal parts craft, empathy, and curiosity — and I'm always trying to be a better code connoisseur than I was yesterday.",
  roles: [
    "Software Engineer",
    "Developer Advocate",
    "Quickbase Builder",
    "Full-Stack Developer",
    "Open-Source Contributor",
    "Technical Speaker",
  ],
};

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
  { label: "Email", value: "roywamaitha2001@gmail.com", href: "mailto:roywamaitha2001@gmail.com", icon: Mail },
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
    icon: Globe,
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
    icon: Globe,
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
    icon: Globe,
    skills: [
      { name: "Quickbase (Pro Builder)", level: 90 },
      { name: "Quickbase API", level: 85 },
      { name: "Qrew Community", level: 88 },
      { name: "Tableau", level: 70 },
    ],
  },
  {
    title: "Tooling & DevOps",
    icon: Globe,
    skills: [
      { name: "Git / GitHub", level: 90 },
      { name: "Playwright (E2E)", level: 80 },
      { name: "CI/CD", level: 75 },
      { name: "DevOps Practices", level: 72 },
      { name: "Technical Writing", level: 85 },
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
    role: "Software Engineer",
    company: "Imminent Transcendent Solutions",
    period: "2023 — Present",
    location: "Nairobi, Kenya",
    current: true,
    description:
      "Building scalable full-stack applications and low-code solutions for enterprise clients, with a focus on Quickbase platform delivery and modern JavaScript ecosystems.",
    highlights: [
      "Architected and shipped low-code enterprise apps on Quickbase, earning Professional Builder certification.",
      "Built Node.js + Angular/React services handling core business workflows end-to-end.",
      "Active Qrew community contributor — sharing patterns, pipelines, and Quickbase API integrations.",
      "Mentored junior developers and ran internal sessions on Next.js server components and testing.",
    ],
    stack: ["Quickbase", "Node.js", "Angular", "React", "Next.js", "TypeScript"],
  },
  {
    role: "Software Engineer & Developer Advocate",
    company: "Youngshark Technologies / Opteamio / Gigsasa",
    period: "2021 — 2023",
    location: "Nairobi, Kenya",
    description:
      "Delivered full-stack web and mobile features across multiple products while advocating for the broader developer community through talks, demos, and open-source.",
    highlights: [
      "Shipped production features across Opteamio and Gigsasa platforms using Vue, Svelte, and Node.js.",
      "Represented the company at community events with talks on React Server Components and Playwright.",
      "Maintained 100+ public repositories — including TechnicalWritingProgram (30+ stars).",
      "Completed the 90DaysOfDevOps challenge, expanding into SRE/DevOps practices.",
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
    tags: ["Vue.js 3", "Composition API", "Weather API"],
    href: "https://github.com/Roy-Wanyoike/weather-app-in-Vuejs3",
    category: "App",
  },
  {
    name: "90DaysOfDevOps",
    tagline: "A 90-day structured DevOps learning journey",
    description:
      "Documented a complete 90-day DevOps learning journey (Jan–Mar 2022) covering Linux, networking, cloud, CI/CD, containers, Kubernetes, IaC, and observability. Forked from Michael Cade's roadmap with personal notes.",
    tags: ["DevOps", "Learning", "Shell", "Kubernetes", "CI/CD"],
    href: "https://github.com/Roy-Wanyoike/90DaysOfDevOps",
    category: "Learning",
  },
  {
    name: "Data-Engineering-with-Python",
    tagline: "Hands-on data engineering notes and notebooks",
    description:
      "Personal notes and worked examples from the Packt 'Data Engineering with Python' course — covering ETL pipelines, data lakes, and stream processing patterns in Python.",
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
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Speaking", href: "#speaking" },
  { label: "Certifications", href: "#certifications" },
  { label: "Contact", href: "#contact" },
];
