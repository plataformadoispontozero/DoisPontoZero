# Team invitation email correction

Status: Ready for Review

The invitation button generated a token but did not send an email. New accounts now use Supabase inviteUserByEmail and accept the verified session on the invitation page. Existing accounts continue receiving a manual link from the administrator.

- [x] Email dispatch attempted for new accounts; delivery errors surfaced.
- [x] Inviter never receives target authentication tokens.
- [x] Email redirect preserves invitation ID and password setup flow.
- [x] Existing-account manual link clearly identified.
- [x] Isolated lint: no errors; existing warnings.
- [x] Typecheck, 156 tests in 38 files, production build passed.
- [ ] End-to-end email delivery: custom SMTP unavailable; no real email sent.

CodeRabbit unavailable in this environment; no CodeRabbit pass claimed. Auth body validates getUser and permission-checked RPC before admin API; gateway JWT check intentionally disabled. No database migration.

Files: supabase/functions/team-invite/index.ts; src/features/team/AcceptInvitationPage.tsx; src/features/team/AcceptInvitationPage.test.tsx; src/features/settings/TeamManagementPage.tsx; src/features/settings/hooks/useAgencySettings.ts; docs/stories/team-invitation-email.md.
