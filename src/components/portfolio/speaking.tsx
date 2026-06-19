"use client";

import { motion } from "framer-motion";
import { Mic, Calendar, Tag } from "lucide-react";
import { talks } from "@/lib/portfolio-data";
import { Reveal, SectionHeading } from "./reveal";

export function Speaking() {
  return (
    <section id="speaking" className="section-pad relative scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Speaking"
          title={
            <>
              Talks on rendering, testing &amp;{" "}
              <span className="text-gradient">mobile dev</span>
            </>
          }
          description="I love sharing what I learn with the developer community. Here are some sessions I've delivered."
        />

        <div className="mt-12 grid lg:grid-cols-3 gap-5">
          {talks.map((talk, i) => (
            <Reveal key={talk.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative h-full glass rounded-2xl p-6 hover:border-primary/40 transition-colors overflow-hidden"
              >
                {/* Decorative number */}
                <span className="absolute top-3 right-4 font-display text-6xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
                  0{i + 1}
                </span>

                <div className="relative">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 text-primary border border-primary/20 mb-4">
                    <Mic className="size-5" />
                  </div>

                  <h3 className="font-display text-lg font-semibold text-foreground leading-snug">
                    {talk.title}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {talk.abstract}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3.5 text-primary" />
                    {talk.venue}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {talk.topics.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        <Tag className="size-2.5" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div className="mt-10 glass rounded-2xl p-6 sm:p-8 text-center">
            <p className="text-base sm:text-lg text-foreground">
              Want me to speak at your meetup or conference?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              I talk about React Server Components, E2E testing with Playwright, Svelte/Svelte Native, and developer experience.
            </p>
            <a
              href="mailto:roywanyoike328@gmail.com?subject=Speaking%20Invitation"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Invite me to speak
              <Mic className="size-4" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
