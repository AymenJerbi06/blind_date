# Repository workflow

The user wants completed changes pushed and merged by default. After implementing and validating a requested change, commit it on a focused branch, merge it into `main`, and push both branches to `origin`. Do not wait for another push/merge request. A later explicit instruction to keep a change local takes precedence.

Keep credentials, local environment files, and temporary QA artifacts out of commits. Preserve unrelated work and never force-push to overwrite remote changes.
