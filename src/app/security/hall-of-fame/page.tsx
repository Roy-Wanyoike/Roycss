import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell, LegalSection } from "@/components/roycss/legal-page-shell";
import { pageMeta } from "@/lib/seo";

/**
 * Security Hall of Fame (/security/hall-of-fame) — fulfils the §7
 * "Hall of fame" promise in `security/SECURITY-POLICY.md` (issue #218).
 *
 * An honest placeholder: a static server component (zero client JS,
 * `force-static`) using the shared LegalPageShell conventions from
 * /privacy and /terms. The page is indexable (no `robots` noindex) and
 * stays an empty-but-truthful list until the first responsibly
 * disclosed vulnerability is accepted and fixed — it must never
 * overclaim. Reports go through `security@roycss.dev` per the policy
 * (GitHub Security Advisories until that mailbox is provisioned).
 */
export const dynamic = "force-static";

export const metadata: Metadata = pageMeta({
  title: "Security Hall of Fame — RoyCSS",
  description:
    "The researchers who have responsibly disclosed vulnerabilities in Roycss, and how to get credited. Currently no public disclosures — reports go to security@roycss.dev per our security policy.",
  path: "/security/hall-of-fame",
});

const LAST_UPDATED = "September 23, 2026";

const SECURITY_EMAIL = "security@roycss.dev";
const SECURITY_POLICY_URL =
  "https://github.com/Roy-Wanyoike/Roycss/blob/main/security/SECURITY-POLICY.md";

export default function SecurityHallOfFamePage() {
  return (
    <LegalPageShell
      eyebrow="Security"
      title="Security Hall of Fame"
      lead="Security researchers who have responsibly disclosed vulnerabilities in Roycss. Currently no public disclosures."
      lastUpdated={LAST_UPDATED}
    >
      <LegalSection id="about" title="What this page is">
        <p>
          When someone reports a security vulnerability in Roycss through
          the channels in our{" "}
          <a
            href={SECURITY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:decoration-2"
          >
            security policy
          </a>
          , and that report leads to a fix, we credit the researcher in the
          CVE and the release notes — and list them here, by name, with
          their consent. Researchers who prefer to remain anonymous are
          credited as &ldquo;Anonymous&rdquo; or not listed, as they choose.
        </p>
      </LegalSection>

      <LegalSection id="inductees" title="Hall of fame">
        <p>
          <strong>No public disclosures yet.</strong> This list is empty
          today, and that is the honest state of things: Roycss has not
          received a responsibly disclosed security vulnerability so far.
          Rather than invent placeholder names, we&rsquo;re publishing the
          page the policy promises and letting it grow when real credit is
          due.
        </p>
      </LegalSection>

      <LegalSection id="get-listed" title="Want to be listed?">
        <p>
          Found something? Please report it responsibly — do not open a
          public issue. Email{" "}
          <a
            href={`mailto:${SECURITY_EMAIL}`}
            className="text-primary underline underline-offset-2 hover:decoration-2"
          >
            {SECURITY_EMAIL}
          </a>{" "}
          with a description, reproduction steps, and the affected
          component and version, or open a private{" "}
          <a
            href="https://github.com/Roy-Wanyoike/Roycss/security/advisories/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:decoration-2"
          >
            GitHub Security Advisory
          </a>
          . We acknowledge reports within 24 hours, follow coordinated
          disclosure, and credit accepted reports in the CVE, the release
          notes, and this page.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
