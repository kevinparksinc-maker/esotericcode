# Project TODO

- [x] Define shared repository-reading domain contracts and reference data.
- [x] Create database tables and access helpers for saved readings, sharing, and GitHub connections.
- [x] Implement public GitHub repository metric analysis and deterministic symbolic interpretation APIs.
- [x] Implement secure private GitHub OAuth connection, encrypted-token storage, repository listing, and private analysis APIs.
- [x] Enforce owner-only default access for saved readings and public read-only access only after explicit sharing.
- [x] Build the elegant public repository intake experience with authentication-aware private-repository controls.
- [x] Build authenticated reading, archive, and public shared-reading views with metrics, architecture evidence, Tarot, I Ching, KP chart, and technical action cards.
- [x] Build the in-app Tarot, I Ching, and KP correspondence library.
- [x] Add focused Vitest coverage for analysis, authorization, sharing, and data transformations.
- [x] Configure GitHub OAuth credentials and verify the private-repository authorization flow (superseded by the approved no-sign-in scope).
- [x] Run type checks, unit tests, database migration verification, and visual responsive checks.
- [x] Save a final project checkpoint and deliver the implementation notes.
- [x] Remove private GitHub OAuth routes, encrypted-token usage, private-repository controls, and account-dependent product paths; the retired database tables were deleted and the database matches the public-only schema.
- [x] Remove EsotericCode sign-in, private GitHub authorization, private archives, and sharing workflows from the product.
- [x] Make public GitHub repository analysis and reading display available immediately to anonymous visitors.
- [x] Fix mobile public repository intake failures caused by optional GitHub endpoint errors and verify the submitted URL remains legible.
- [x] Improve mobile repository URL legibility while editing and capture final narrow-viewport verification.
