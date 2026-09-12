import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/roycss/legal-page-shell";

/**
 * Static privacy policy — plain-language, and honest about what the
 * product ACTUALLY stores today (verified against
 * `backend-node/prisma/schema.prisma`, `src/lib/auth-client.ts`, and
 * the site's client-side storage keys). If the data practices change,
 * update this page in the same commit — it is a legal document, not
 * marketing copy.
 *
 * Route segment config: force-static keeps this page prerendered at
 * build time (the root layout's headers() read would otherwise opt the
 * route into dynamic streaming).
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy — RoyCSS",
  description:
    "What RoyCSS collects (account email, hashed password, favorites, messages), why, where it's stored, how long we keep it, and how to exercise your data rights. No ads, no trackers, no data selling.",
};

const LAST_UPDATED = "September 12, 2026";

const PRIVACY_EMAIL = "security@roycss.dev";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      lead="We collect as little as we reasonably can, we tell you exactly what that is, and we never sell it. This page describes what roycss.com actually stores today — no legal archaeology required."
      lastUpdated={LAST_UPDATED}
    >
      <LegalSection id="short-version" title="The short version">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            We store: your account <strong>email</strong> and <strong>name</strong>, your
            password as a <strong>one-way bcrypt hash</strong> (never the password
            itself), your <strong>saved favorites and collections</strong>, messages
            you send us through the contact form, and metadata about the{" "}
            <strong>API keys</strong> you create.
          </li>
          <li>
            We run <strong>no ads, no analytics, and no third-party
            trackers</strong>. The only cookies on this site are the two that keep
            you signed in.
          </li>
          <li>
            We <strong>never sell or share your personal data</strong> with
            anyone.
          </li>
          <li>
            You can ask us to show you, export, or delete your data at any
            time: <span className="font-medium">{PRIVACY_EMAIL}</span>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="who-we-are" title="Who we are">
        <p>
          RoyCSS (roycss.com) is a CSS effects library and developer
          platform, run by Royford Wanyoike Wamaitha. For any privacy
          question, request, or complaint, email{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-primary underline underline-offset-2 hover:decoration-2"
          >
            {PRIVACY_EMAIL}
          </a>{" "}
          or use the contact form on the site.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" title="What we collect, and why">
        <p>
          We only collect data you create by using the site. Here is the
          complete list:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Account data.</strong> When you create an account we
            store your email address, the name you give us, a timestamp of
            when the account was created, and your password — hashed with
            bcrypt, which is one-way: we cannot read or recover your
            password, and neither can anyone who steals the database. We
            use this to authenticate you and to sync your favorites and
            collections across devices and browsers.
          </li>
          <li>
            <strong>Favorites and collections.</strong> The effects you
            favorite and the collections you build. Without an account,
            these are stored only in your own browser (see{" "}
            <a href="#local-storage" className="text-primary underline underline-offset-2">
              local storage
            </a>
            ). With an account, they are stored in our database and linked
            to it, so they follow you across devices.
          </li>
          <li>
            <strong>Messages you send us.</strong> If you use the contact
            form (or the pricing waitlist), we store your name, email
            address, subject, and message — so that we can read and reply
            to you.
          </li>
          <li>
            <strong>API key metadata.</strong> If you mint an API key for
            the RoyCSS API, we store its name, a bcrypt hash and a SHA-256
            lookup hash of the key (the key itself is never stored), the
            first few and last four characters for masked display, its
            permission scopes, and creation/last-used timestamps. This is
            what lets you authenticate to the API and revoke keys later.
          </li>
          <li>
            <strong>Tool results.</strong> Some site tools store the data
            you submit — for example, the site auditor stores the URL you
            audit and its results, linked to your account. This is what
            makes those tools work.
          </li>
        </ul>
        <p>
          We do not collect data for advertising, profiling, or
          resale. There is nothing to opt out of, because there is no
          tracking to begin with.
        </p>
      </LegalSection>

      <LegalSection id="where-stored" title="Where your data is stored">
        <p>
          Your data is stored in our own application database (SQLite,
          managed through Prisma) on our hosting infrastructure — the
          website is served from Vercel and the backend runs on Railway.
          No data brokers, ad networks, or analytics providers are
          involved. If you want to know more about a specific storage
          location, ask us at{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-primary underline underline-offset-2"
          >
            {PRIVACY_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies">
        <p>
          This site sets exactly two cookies, and only when you sign in —
          a short-lived access-token cookie (about 15 minutes) and a
          refresh-token cookie that keeps you signed in for up to 30 days
          unless you sign out. Both are <code>HttpOnly</code> (JavaScript
          on the page cannot read them), <code>SameSite=Lax</code>, and
          <code> Secure</code> in production. Signing out clears both.
        </p>
        <p>
          There are <strong>no analytics, advertising, or tracking
          cookies</strong> on this site as of today — which is why you
          don&apos;t see a cookie-consent banner: there is nothing to
          consent to. If we ever add one, we&apos;ll update this page
          first.
        </p>
      </LegalSection>

      <LegalSection id="local-storage" title="Local storage on your device">
        <p>
          Your theme preference (light or dark) and, when you are signed
          out, your saved favorites live in your browser&apos;s local
          storage. That data stays on your device and never leaves your
          browser. Clearing your browser data removes it; signing in
          moves favorites to your account so they can sync.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="How long we keep data">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Account data</strong> is kept until you ask us to
            delete your account (see below).
          </li>
          <li>
            <strong>Contact messages and waitlist signups</strong> are
            kept as long as needed to handle your inquiry, and deleted on
            request.
          </li>
          <li>
            <strong>Favorites, collections, and tool results</strong> are
            kept until you delete them or your account is deleted.
          </li>
        </ul>
        <p>
          Self-serve export and deletion are available through the API:
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">GET /api/v1/auth/export</code>
          downloads a JSON copy of your data, and
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">DELETE /api/v1/auth/account</code>
          deactivates your account immediately (sign-in and API keys stop
          working on the spot) and purges your personal data within 30
          days. Prefer email?{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-primary underline underline-offset-2"
          >
            {PRIVACY_EMAIL}
          </a>{" "}
          works too.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="Your rights">
        <p>
          Wherever you live, you can ask us to:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Access</strong> the personal data we hold about you;</li>
          <li><strong>Correct</strong> it if it&apos;s wrong;</li>
          <li><strong>Export</strong> it in a portable format;</li>
          <li><strong>Delete</strong> your account and its data.</li>
        </ul>
        <p>
          If you&apos;re in the EU/UK (GDPR) or California (CCPA), those
          rights are the law, and we honor them regardless of where you
          are. Email{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-primary underline underline-offset-2"
          >
            {PRIVACY_EMAIL}
          </a>{" "}
          and we&apos;ll respond — we&apos;re a small team, so please give
          us up to 30 days.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="Sharing and disclosure">
        <p>
          We do not sell, rent, or trade your personal data, and we don&apos;t
          share it with advertisers. The only entities that process your
          data are the hosting providers that run the site and database,
          strictly to keep the service online. We may disclose information
          if legally required — for example, a valid court order.
        </p>
      </LegalSection>

      <LegalSection id="security" title="Security">
        <p>
          Passwords are stored only as bcrypt hashes, session tokens live
          in HttpOnly cookies that JavaScript cannot read, authentication
          endpoints are rate-limited, and API keys are stored only as
          hashes. No system is perfect — if we ever have a breach that
          affects you, we will tell you plainly and promptly.
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>
          RoyCSS is a developer tool and is not directed at children. If
          you are under 13, please don&apos;t create an account.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>
          As the product changes, this page changes with it — always with
          an updated &ldquo;last updated&rdquo; date above, and we&apos;ll
          announce material changes on the site. The version you accept
          when you use the service is the one published at this URL at
          that time.
        </p>
        <p>
          Also see our{" "}
          <Link href="/terms" className="text-primary underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          Privacy questions and data requests:{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-primary underline underline-offset-2"
          >
            {PRIVACY_EMAIL}
          </a>
          . Anything else: the contact form on the site. We read every
          message.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
