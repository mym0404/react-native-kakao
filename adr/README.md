# Architecture Decision Records

ADRs record architectural decisions and the reasons behind them. Follow the [ADR creation rules in AGENTS.md](../AGENTS.md#architecture-decision-records) before writing a record.

## Rules

- Use `NNNN-short-title.md`, starting with `0001` and taking the next unused sequential ID. Write in English and use a `YYYY-MM-DD` decision date.
- Complete the template before saving a numbered file. Keep unfinished drafts in the conversation. Status at creation is `Accepted` or `Rejected` and records the decision's status when written.
- Never edit, rename, renumber, or delete a saved ADR, including for corrections or status changes. Record changes in a new, explicitly requested ADR.
- Append rows to the catalog and supersession log below; never change, remove, or reorder existing rows. You may update the rules and template.
- `Supersedes` links to earlier ADRs replaced by the new decision, or is `None`. `Superseded by` always links to the log below. When another ADR replaces a decision, append that relationship to the log instead of editing the earlier ADR. State which parts of the earlier decision are replaced and which still apply.
- Current code and contributor rules define current behavior; ADRs explain decision history.

## Template

Replace all placeholders before saving. Use `None` or `Not recorded` where applicable.

```markdown
# ADR NNNN: Decision title

- Date: YYYY-MM-DD
- Status at creation: Accepted or Rejected
- Decision makers: Names or Not recorded
- Scope: Affected packages, platforms, or workflows
- Supersedes: None or relative links to earlier ADRs
- Superseded by: See the [supersession log](README.md#supersession-log)

## Context

Describe the problem, constraints, and decision criteria.

## Alternatives

Describe the options considered and why they were accepted or rejected.

## Decision

State the chosen approach and rationale, including the scope of any correction or replacement.

## Consequences

Describe benefits, costs, risks, and follow-up work.

## Verification

Describe observable criteria and evidence; distinguish completed checks from pending work.

## References

Link to supporting code, documentation, issues, pull requests, or related ADRs.
```

## Catalog

Append one row per new ADR, using relative links. Keep `Supersedes` consistent with that ADR.

| ADR                                                                                                         | Supersedes |
| ----------------------------------------------------------------------------------------------------------- | ---------- |
| [0001: Support Expo 58 through the existing AppDelegate integration](0001-expo-58-config-plugin-support.md) | None       |

## Supersession log

Append one row per replaced ADR. Follow successor links for the relevant scope to find the latest decision; no matching row means no recorded successor.

| Supersedes | Superseded by | Replacement scope |
| ---------- | ------------- | ----------------- |
