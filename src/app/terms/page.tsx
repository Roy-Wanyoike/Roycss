import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/roycss/legal-page-shell";

/**
 * Static terms of service — plain-language and honest about what the
 * product is today: the `roycss` library is MIT-licensed open source
 * (see the LICENSE file at the repo root), and paid tiers are NOT yet
 * purchasable. If that ever changes, this page must change with it.
 *
 * Route segment config: force-static keeps this page prerendered at
 * build time (the root layout's headers() read would otherwise opt the
 * route into dynamic streaming).
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service — RoyCSS",
  description:
    "The terms for using roycss.com and your RoyCSS account: what the service is, acceptable use, accounts and API keys, licensing (MIT for the library), paid-plan status, disclaimers, and how changes work.",
};

const LAST_UPDATED = "September 12, 2026";

const CONTACT_EMAIL = "security@roycss.dev";

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms of Service"
      lead="The deal in plain English: the effects library is MIT-licensed and free to use — including commercially — and everything the website offers today is free. These terms cover the site, your account, and the API."
      lastUpdated={LAST_UPDATED}
    >
      <LegalSection id="what-roycss-is" title="What RoyCSS is">
        <p>
          RoyCSS is two things:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>An open-source CSS effects library</strong> — the{" "}
            <code>roycss</code> npm package and its source code, which
            you can use in any project.
          </li>
          <li>
            <strong>A website</strong> at roycss.com — the effects
            gallery, documentation, developer tools, your account, and
            the RoyCSS API.
          </li>
        </ul>
        <p>
          These terms cover the website and API. The library itself has
          its own license (see{" "}
          <a href="#licensing" className="text-primary underline underline-offset-2">
            Licensing
          </a>
          ).
        </p>
      </LegalSection>

      <LegalSection id="accepting" title="Accepting these terms">
        <p>
          By using roycss.com or creating an account, you agree to these
          terms. You don&apos;t need an account to browse the site, copy
          effect CSS, or use the library — the account is only for
          syncing favorites and collections, and for the API.
        </p>
        <p>
          If you don&apos;t agree with them, don&apos;t create an account;
          the library remains yours to use under its open-source license.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="Accounts and API keys">
        <p>
          Accounts use your <strong>email address and a password</strong>{" "}
          you choose. You agree to provide accurate information and to
          keep your password private — you&apos;re responsible for
          activity that happens under your account.
        </p>
        <p>
          For programmatic access you can create <strong>API keys</strong>{" "}
          instead of (or alongside) a password session. Treat API keys
          like passwords: don&apos;t commit them to repositories or share
          them. You can revoke a key at any time, and you&apos;re
          responsible for what&apos;s done with your keys until you do.
        </p>
        <p>
          One person, one account for personal use — don&apos;t create
          accounts you don&apos;t need or share one account between
          people.
        </p>
      </LegalSection>

      <LegalSection id="paid-plans" title="Paid plans — an honest note">
        <p>
          The pricing section on the site shows our <strong>planned</strong>{" "}
          paid tiers (Pro, Team, Enterprise).{" "}
          <strong>They are not yet available for purchase — there is no
          billing today.</strong> Every effect in the library and every
          feature currently on the site is free to use.
        </p>
        <p>
          When paid plans launch, the exact terms of each plan — price,
          what&apos;s included, how to cancel, refunds — will be shown
          clearly <em>before</em> you pay anything. Joining a waitlist or
          pricing list only stores your email so we can notify you; it
          doesn&apos;t obligate you to buy anything.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable use">
        <p>When using the website or the API, please don&apos;t:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>use RoyCSS to break the law or harm anyone;</li>
          <li>
            attack the service — attempt to breach security, overload, or
            disrupt it — or help anyone else do so;
          </li>
          <li>
            bypass, hammer, or otherwise abuse rate limits on the API;
            build tooling whose purpose is to strain the service;
          </li>
          <li>
            use the service to distribute malware or content you
            don&apos;t have the rights to.
          </li>
        </ul>
        <p>
          We may rate-limit, suspend, or terminate accounts that put the
          service or other users at risk.
        </p>
      </LegalSection>

      <LegalSection id="licensing" title="Licensing and intellectual property">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>The RoyCSS effects library</strong> (the CSS, source
            code, and documentation in the public repository) is
            open-source under the <strong>MIT License</strong> — free to
            use, copy, modify, and even sell as part of your own products,
            with attribution as the license requires.
          </li>
          <li>
            <strong>The website</strong> — the RoyCSS name, logo, and site
            design — belongs to RoyCSS. Using the library doesn&apos;t
            grant you rights to those.
          </li>
          <li>
            <strong>Your content</strong> — your favorites, collections,
            and the code you build with RoyCSS — stays yours.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="disclaimers" title="Disclaimers">
        <p>
          The service is provided <strong>&ldquo;as is&rdquo;</strong>{" "}
          and <strong>&ldquo;as available.&rdquo;</strong> We work hard to
          keep it fast and online, but we don&apos;t promise it will be
          uninterrupted, error-free, or perfectly suited to your purpose.
          Effects are CSS — verify them in your own project and browser
          targets before shipping to production.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, RoyCSS and its
          operator are not liable for indirect or consequential damages
          arising from your use of the site or library. The library is
          MIT-licensed software provided without warranty of any kind.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="Termination">
        <p>
          You can stop using the service at any time and ask us to delete
          your account (see the{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-2">
            Privacy Policy
          </Link>
          ). We can suspend accounts that violate these terms or threaten
          the service.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="Governing law">
        <p>
          <em>
            [Placeholder — to be finalized with counsel before any paid
            plan launches.]
          </em>{" "}
          The governing law and venue for disputes under these terms have
          not been set yet. Until they are, if you have a problem, contact
          us directly and we&apos;ll work it out in good faith.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to these terms">
        <p>
          These terms will evolve as the product does. When they change
          we&apos;ll update the &ldquo;last updated&rdquo; date above and
          announce material changes on the site where practical. If you
          keep using the service after a change, you accept the updated
          terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          Questions about these terms:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          or the contact form on the site.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
