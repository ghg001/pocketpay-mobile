# Contributor Self-Assessment

Complete this self-assessment before requesting review and update it after any
substantial change to the pull request. Copy the form below into the pull
request description, replace the guidance comments, and check an item only
after you have verified it.

Use `Not applicable — <reason>` when an item does not apply. An unchecked item
means the pull request is not ready for review. This assessment records the
contributor's evidence; it does not replace reviewer approval or required CI
checks.

## Self-Assessment Form

### Scope

- [ ] I re-read the linked issue and kept this change within its requested
      scope.
- [ ] I removed unrelated changes, unfinished work, and misleading TODOs.

<!--
Link the issue and briefly list the behavior and files intentionally changed.
Explain any scope change agreed with a maintainer.
-->

**Scope evidence:**

### Tests

- [ ] I added or updated appropriate automated tests, or explained why runtime
      tests are not applicable.
- [ ] I covered the relevant happy path, negative path, regression, and edge
      cases.
- [ ] I manually verified affected behavior where automated coverage is not
      sufficient.

<!--
List every command run and its result, relevant test files, and manual
verification. For documentation-only work, list the files and links checked.
Do not write only "tests pass."
-->

**Test evidence:**

### CI and Local Checks

- [ ] I ran the repository checks relevant to this change and recorded their
      results.
- [ ] All required CI checks pass on the latest commit, or I have identified
      each pending or failing check below.
- [ ] I did not skip, mute, or bypass a failing check.

<!--
Report the status of tests, typecheck, lint, and api:check as applicable. Link
the latest CI run when available. A pending or failing required check means
this assessment is not yet complete.
-->

**Local check results and CI status:**

### Documentation

- [ ] I added or updated contributor, user, API, or architecture documentation
      affected by this change, or documented why no update is needed.
- [ ] Any comments, examples, screenshots, and links affected by the change
      remain accurate.

**Documentation evidence:**

### Known Limitations

- [ ] I tested realistic boundary conditions and documented all known
      limitations, assumptions, risks, skipped checks, and follow-up work.
- [ ] I confirmed the change does not claim support for behavior it does not
      implement.

<!--
Write "None known" only after checking for limitations. If something remains,
describe its user impact and link a follow-up issue when one exists.
-->

**Known limitations and follow-up work:**

### Acceptance Criteria Audit

- [ ] I checked every acceptance criterion in the linked issue against the
      implementation and evidence.
- [ ] Every criterion is satisfied, or an exception has been explicitly agreed
      with a maintainer and documented below.

#### How to Complete the Audit Template

- **Acceptance Criterion:** Copy the exact requirement from the issue.
- **Implementation Evidence:** List the files modified, attach a screenshot, or explain the change.
- **Test Evidence:** Reference the automated test file, or describe the manual verification step.
- **Documentation Impact:** List any updated documentation files, or write "None needed" if applicable.
- **Status:** Must be exactly one of: `Complete`, `Partial`, `Not Applicable`, `Not Implemented`.

#### Handling Incomplete Criteria

When a piece of work cannot be fully completed in the current pull request:
- Explain why a criterion is incomplete in the *Implementation Evidence* column.
- Link to follow-up issues if applicable.
- Clearly distinguish completed work from future work.
- Avoid marking incomplete work as complete (use `Partial` or `Not Implemented`).

<!-- Map each acceptance criterion to implementation or verification evidence using the audit template below. -->

**Acceptance criteria confirmation:**

| Acceptance Criterion | Implementation Evidence | Test Evidence | Documentation Impact | Status |
| --- | --- | --- | --- | --- |
| <!-- Criterion --> | <!-- File, screenshot, or explanation --> | <!-- Test file or manual check --> | <!-- Docs changed, or N/A --> | Complete / Partial / Not Applicable / Not Implemented |

### Final Confirmation

- [ ] I reviewed the complete diff as if I were the reviewer.
- [ ] The pull request description is accurate and contains enough evidence to
      evaluate this work without relying on private context.
- [ ] I believe this contribution is ready for review and, when applicable,
      payment evaluation.

**Contributor:** @<!-- username -->

**Assessment updated:** <!-- YYYY-MM-DD -->

## Related Guidance

- [Contributing to PocketPay Mobile](../CONTRIBUTING.md)
- [Test-First Contribution Guide](test-first-contribution-guide.md)
- [Evaluation Readiness Checklist](evaluation-readiness-checklist.md)
- [CI Troubleshooting Guide](ci-troubleshooting.md)
