import Link from "next/link";
import { Home, Search, Sparkles, Box, Zap, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* 404 big number with glow */}
        <div className="relative inline-block">
          <div className="font-display text-8xl sm:text-9xl font-bold text-primary" style={{ textShadow: "0 0 40px rgba(16, 185, 129, 0.3)" }}>
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-32 sm:size-40 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>

        {/* Heading + description */}
        <div className="space-y-3">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist. RoyCSS is a
            single-page platform — everything lives on the homepage. Try
            searching or exploring below.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer h-11"
          >
            <Home className="size-4" />
            Back to RoyCSS
          </Link>
          <Link
            href="/#effects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer h-11"
          >
            <Search className="size-4" />
            Browse Effects
          </Link>
        </div>

        {/* Popular sections */}
        <div className="pt-8 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Popular Sections
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              href="/#effects"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Sparkles className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">1,629 Effects</span>
            </Link>
            <Link
              href="/#platform"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Box className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">62 Products</span>
            </Link>
            <Link
              href="/#get-started"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Zap className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">Get Started</span>
            </Link>
            <Link
              href="/#docs"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <BookOpen className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">Docs</span>
            </Link>
            <Link
              href="/#webgl-effects"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Sparkles className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">WebGL Effects</span>
            </Link>
            <Link
              href="/#faq"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Search className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">FAQ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
