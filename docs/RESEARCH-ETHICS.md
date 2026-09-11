# Research ethics and data policy — Jacobrakai Foundation

**Status:** draft for adoption by the board. Version 0.1, 11 September 2026. Takes effect on adoption; the adoption
record is at the end of this document.

## 1. Purpose and scope

The Foundation publishes security research derived from decoy servers it operates, a public blocklist, and research
on access to New Jersey courts, including evaluations of language models. It has no institutional review board. This
policy is what stands in its place: the framework the Foundation has adopted, the rules that follow from it, and the
review every study passes before it starts.

It applies to every research activity conducted, funded or published by the Foundation, by anyone — directors,
staff, volunteers, contractors, and automated systems acting on the Foundation's behalf.

## 2. Framework adopted

The Foundation adopts the **Menlo Report** (U.S. Department of Homeland Security, Science and Technology Directorate,
*Ethical Principles Guiding Information and Communication Technology Research*, 3 August 2012) and its Companion
(October 2013) as the ethical framework for all of its research. The Report's four principles, and what each means
here:

**Respect for Persons.** Identify everyone a study touches — not only its intended subjects but the people whose
traffic, records or filings pass through the data — and treat them as people, not as data. Where consent is
possible, obtain it. Where it is not, as with attackers observed on decoy infrastructure, the absence of consent
raises the bar for every other principle rather than lowering it.

**Beneficence.** Before a study starts, write down who could be harmed, how, and what is done about it. Weigh the
harm against a benefit that is concrete and public, not merely interesting. Have a plan for the foreseeable harms
and a stop rule for the unforeseen ones.

**Justice.** Do not let the burdens of research fall on people who receive none of its benefits. In this
Foundation's work that risk is specific: people navigating a court without a lawyer are the intended
beneficiaries of one program and must never become the unwitting subjects of another.

**Respect for Law and Public Interest.** Do the legal due diligence before acting, not after. Be transparent about
methods, data, limits and errors, so that the work can be checked and the Foundation held to account for it.

## 3. Standing rules

These apply to every study without exception. A study that cannot satisfy them is not conducted.

1. **People who use Forma Pauperis are never research subjects.** Nothing a person enters into a court-forms
   interview is research data — not anonymized, not aggregated later, not "just to look." The only permitted
   analytic use of that service is a count of page views and search terms with no user identifier, on a retention
   limit set in writing before the first query is run, with the aggregation pre-registered.
2. **No active probing of systems the Foundation does not own or have written authorization to test.** Passive
   observation of public data — DNS records, published files, traffic that arrives at Foundation infrastructure — is
   research. Sending traffic to someone else's system to see what answers is unauthorized testing, whatever the
   intent.
3. **Publish methods, never weapons.** No credential lists, no working exploit code, no attacker tooling, no
   payloads that can be replayed. Publish rates, classes, timings and evidence sufficient to check the claim.
4. **Coordinated disclosure.** Where a finding exposes a weakness in a named third party's system, that party is
   told first and given the opportunity to fix it, on the timeline in the Foundation's security policy (ninety days
   by default, or on release of a fix).
5. **State the limits first.** Every publication states its sample size, sensor count, observation window, what
   was and was not verified by a person, and what the study cannot support. Where the Foundation's own sources
   disagree, the disagreement is reported, not resolved silently.
6. **Model output is never evidence.** A language model's answer is a thing the Foundation measures, not a source
   it cites. See section 5.
7. **The related-party firewall in section 7 applies to every study.**

## 4. Data

**What the decoy infrastructure collects.** Connection metadata (source address, port, timing), protocol
interactions, credentials attempted, commands issued and payloads delivered to servers the Foundation deliberately
exposes. No system that real people rely on is instrumented for research.

**Personal data.** Network addresses are treated as personal data. Inside the Foundation they are stored and
processed under access control. In publications they appear only in aggregate or hashed form — with one exception:
the public blocklist, which by design publishes addresses the Foundation has assessed as hostile, under a documented
selection method and with a published route for correction.

**Classification.**

| class | examples | handling |
|---|---|---|
| public | the blocklist; published research; benchmark items and model outputs | freely shared |
| internal | raw captures; labeled datasets; unpublished analysis | access-controlled; not shared outside the Foundation without a data agreement |
| restricted | anything that could identify a court-forms user; any court record obtained under Rule 1:38 that names a person | kept only when a study's review requires it; aggregate-only in every output; deleted at study close |

**Retention defaults.** Raw decoy captures: eighteen months, then deleted or reduced to aggregates. Website access
logs: thirty days. Derived aggregates and labeled research datasets containing no personal data: indefinitely.
Restricted data: the study's duration. The board may set different limits for a named study; the limits are
recorded in that study's risk assessment.

**Deletion and incidents.** Data past retention is deleted on a schedule, not on request. Loss, exposure or misuse
of internal or restricted data is reported to the board within three business days and to affected parties where
they can be identified.

## 5. Language models in research

The Foundation uses language models to classify, extract and audit at scale. It does not use them to establish
facts.

- **Gold sets first.** Before a model labels a corpus, a person labels a sample of it — no fewer than two hundred
  items or ten percent, whichever is smaller — without seeing model output. Model–human agreement is measured and
  published with the results.
- **Prompts, model identifiers, dates and raw outputs are published** alongside any finding that depends on them.
- **Ambiguous cases go to a person.** A pipeline that automatically resolves its hard cases is measuring its own
  heuristics.
- **Model output is never presented as authoritative legal or factual content.** In the court-forms program in
  particular, no model-generated text is published as a form, an instruction, or an answer to a procedural question.
- **No model is run over data in the restricted class**, and never over anything a court-forms user has entered.

## 6. Publication

Publications carry the date of the data, the date of publication, the methods, the limits in section 3.5, and a
route for correction. Errors are corrected in place with a dated note, not silently. Where a publication concerns a
public body or named organization, that body is given notice before publication.

## 7. Related-party firewall

Sic Semper Errata develops public-records software for municipal clerks and has a principal in common with the
Foundation. Research whose primary beneficiary is that company would be private benefit, which is inconsistent with
the Foundation's exempt purpose. Therefore:

- Any study whose subjects are municipal clerks, municipal records systems, or their vendors is approved by the
  board with the conflict disclosed in the minutes, or is not conducted.
- Every publication from such a study discloses the relationship.
- The company receives no access to internal or restricted Foundation data, and no early access to findings.
- No Foundation research is designed to, or marketed as, supporting the company's products.

## 8. Review before a study begins

Every study completes the risk assessment in Appendix A before any data is collected or any model is run. The
assessment is reviewed and signed by a director who is not the study's lead. Where the board cannot supply an
independent reviewer, an external reviewer — counsel, or a peer organization working in the same field — is asked.
Completed assessments are kept for the life of the study plus three years and are provided to funders and partners
on request.

A study changes materially — new data source, new subject population, new publication scope — only after its
assessment is revised and re-signed.

## 9. Concerns and corrections

Anyone — a subject, a partner, a reader, a contributor — can raise a concern about Foundation research at
legal@jacobrakai.org, or about a blocklist entry at feed@jacobrakai.org. Concerns are acknowledged within three
business days. The Foundation's public corrections record is at https://jacobrakai.org/authorities/.

## 10. Adoption and review

This policy is reviewed annually by the board and whenever the Foundation begins a category of research it does not
cover. Amendments are dated and versioned in this document's history.

| | |
|---|---|
| Adopted by resolution of the board on | ____________ |
| Version | 0.1 |
| Policy owner | ____________ (director) |
| Next review | ____________ |

---

## Appendix A — Research risk assessment

One per study, completed before any data is collected. Plain answers; a page is usually enough.

**Study**
- Title and lead:
- Question the study answers, in one sentence:
- Public benefit, concretely — who is better off, and how:

**People**
- Who the intended subjects are:
- Who else is touched by the data (people whose traffic, records or filings appear in it):
- Whether consent is possible; if not, why the study proceeds without it and what compensates:
- Whether any subject population overlaps a Sic Semper Errata market (section 7):

**Data**
- Sources, and for each: class (public / internal / restricted), volume, retention limit:
- Personal data present, and how it is handled inside the Foundation and in outputs:
- Pre-registered aggregations, if any:

**Harms**
- Reasonably foreseeable harms, who bears each, and the mitigation for each:
- Low-probability, high-impact harms, and the contingency plan:
- Stop rule — the observation that ends the study early:

**Method**
- Where language models are used, the gold-set plan and the agreement threshold below which results are not published:
- What will be published, and what will be withheld under section 3.3:
- Third parties who must be notified before publication (section 3.4, section 6):

**Law**
- Legal due diligence performed (authorization for any testing, records-access rules, jurisdiction of subjects):

**Sign-off**
- Study lead — name, date:
- Independent reviewer — name, date:
