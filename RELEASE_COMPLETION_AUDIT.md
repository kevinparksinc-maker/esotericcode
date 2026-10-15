# Production completion plan — Esotericcode
Verified components: GitHub public/private repository intake, ZIP intake, OAuth connector, source-code metrics, symbolic Tarot/I Ching/KP interpretation, reading/history/library/share pages, Express/tRPC and security-oriented tests.

## Release blockers to verify
- Configure production GitHub OAuth application, encrypted token key, user sessions, database and object storage.
- Verify private-repository access remains strictly account-scoped; test refresh, disconnect and revoked permissions.
- Check ZIP archive bombs/path traversal, upload size caps, storage lifecycle, source-code handling and privacy.
- Test real repository -> analysis -> record -> share -> reload and ZIP input with adverse sample files.
- Confirm language in the UI distinguishes repository measurement from symbolic divination.
- Verify production build/runtime, mobile UI, request throttling, credential rotation and safe public share links.

The included workflow gates builds on TypeScript, tests and production compilation. Live integrations need separate QA.
