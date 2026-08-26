# PocketPay Mobile — CI Pass Requirements & Troubleshooting Guidance

All Pull Requests (PRs) submitted to `pocketpay-mobile` are evaluated against automated continuous integration (CI) checks. Passing CI is a mandatory prerequisite for code review, approval, and reward allocation.

---

## 1. CI Pass Requirement Policy

* **Evaluation Impact:** Failing CI checks directly affect PR evaluation and scoring. A PR with red/failing checks will **not** be considered complete, regardless of whether code has been merged.
* **Contributor Expectation:** Contributors are required to actively monitor CI status after pushing changes and resolve all failures prior to requesting final review.
* **Reviewer Responsibility:** Maintainers and reviewers will defer PR approval until all required workflow jobs report a green (`passing`) status.

---

## 2. Common CI Failure Types

|Failure Category | Common Causes | Prevention / Fix |
| :--- | :--- | :--- |
|`Linting & Formatting m | Missing semi-colons, unused variables, unformatted code, or ESLint rule violations. | Run code formatters and static linters prior to committing. |
| `TypeScript / Type Checks` | Type mismatches, implicit `any`, unhandled null/undefined fields, or broken interfaces. | Perform strict local compilation checks. |
|`Unit & Integration Tests` | Regression in existing business logic, missing mock data, or failing component specs. | Run the complete local Jest/RTL Test suite across affected files. |
|`Build & Bundle Verification` | Unresolved imports, invalid environment variable references, or native dependency conflicts. | Trigger local build scripts prior to opening/pushing PRs. |

---

## 3. Local Reproduction Commands

Run these standard commands locally in `pocketpay-mobile` to reproduce and fix failures before pushing to GitHub:

### Execute Linting & Formatting Checks
``bash
# Check code style and linting issues
npm run lint

# Auto-fix linting issues where possible
npm run lint:fix
```

### Run Type Checking
``bash
# Verify TypeScript compile targets without emitting output
npm run type-check
 ```

### Run Test Suite
``bash
# Run unit & integration tests locally
npm test

# Run tests with coverage output
npm test -- --coverage
```\

### Run Production Build Test
```bash
# Verify production compilation locally
npm run build
```

---

## 4. Contributor Workflow for Fixing Broken CI

If your PR exhibits a failing CI check:

1. **Inspect Logs:** Click **Details** next to the failing GitHub Action job or run `gh run view --log-failed`.
2. **Reproduce Locally:** Execute the corresponding command listed in Section 3 in your terminal.
3. **Apply & Verify Fix:** Fix the root cause locally and re-run the commands to confirm exit code `0`.
4. **Push Update:** Commit and push the fix to your feature branch; GitHub Actions will re-evaluate automatically.
