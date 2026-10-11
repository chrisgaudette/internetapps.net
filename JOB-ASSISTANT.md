# Internet Apps Job Assistant

Private dashboard: `/jobs`. The existing owner-only Sites boundary protects the dashboard, APIs, résumé and answer library. Do not change site audience without adding per-user authorization. Private profile and résumé are uploaded at runtime and are absent from Git.

## Daily operation

The existing `daily-consulting-job-assistant` heartbeat runs at 8 a.m. America/New_York. It calls the hosted discovery endpoint once a day, searches employer and recruiter sites to supplement public feeds, verifies original terms and every mandatory criterion, then submits all qualified jobs using connected Gmail or supported authenticated browser tools. It saves SENT evidence or an ATS receipt. It must stop a submission for missing facts, login or CAPTCHA and continue other jobs.

The target is at least 10 NEW potential contract leads daily, never fabricated qualifying jobs. Eligibility requires C2C through InternetApps.net, fully remote Connecticut, no travel, up to 40 hours/week and a confirmed USD hourly rate strictly over $100. A range whose minimum is at or below $100 remains held unless an above-$100 rate is separately confirmed. Known full-time roles and clearly foreign-only locations are retained as exclusions and do not count toward this target. Match is the documented criteria score with no mandatory gap. Interview probability remains unknown; outcomes are tracked separately.

Public GET feeds are Remotive (attribution retained, 24-hour delay, one fetch/day), Jobicy and configured Greenhouse boards. The application does not scrape arbitrary protected boards or bypass CAPTCHA. Easy Apply jobs can be imported by the assistant; discovery depends on source access. LinkedIn/Indeed defaults remain excluded pending the user's preference. There is no generic unattended form submitter: submissions run through the existing daily assistant and its connected tools, not the Worker. Local assistant scheduling requires its configured host to be available.

## Agent API

Use Sites get_site service token only with the literal returned Site origin via `OAI-Sites-Authorization: Bearer TOKEN`. Never persist the token. Never infer successful submission from a queue, click, or HTTP fetch. All mutations accept JSON POST except binary résumé PUT. State changes use database compare-and-swap revisions to prevent concurrent lost updates.

- `GET /api/jobs/state` — jobs, verified profile, settings, résumé metadata, daily stats and logs.
- `POST /api/jobs/run` `{}` — daily idempotent live feed crawl. Retry after a failed/stale run; no repeated polling of feeds.
- `POST /api/jobs/import` `{jobs:[{company,title,url,description,source,salary,location,engagement,requisitionId,route}]}` — canonical URL / company-requisition deduplication. Import broader web search findings here.
- `POST /api/jobs/profile` `{facts:{KEY:{value,verified:true,source}},evidence:[{id,text,source}]}` — private verified applicant facts and résumé excerpts only.
- `PUT /api/jobs/resume` — existing DOCX bytes; `GET` downloads it privately.
- `POST /api/jobs/review` `{id,verification,criteria,questions,route,nextStep}` — each criterion has requirement, weight (default 1), mandatory, matched, evidenceId, exact posting quote. Verification requires originalVerified, originalUrl, checkedAt, active, c2c, remoteCT, noTravel, hoursCompatible, currency USD, unit hour, minimumRate OR confirmedRate, termsEvidence, criteriaComplete and questionsReviewed. Required questions must have a factKey in the verified library. Unknown required questions remain held. Email route needs address, verified true and original company sourceUrl; ATS/Easy Apply route needs the application URL.
- `POST /api/jobs/queue` `{}` — queue all eligible jobs; not a submission.
- Before each submission, recheck Gmail/recruiter threads and legacy tracker. `POST /api/jobs/claim` `{id}` atomically reserves it and returns token. Save the claim token privately, never in public files. A claimed job is not automatically retried after an uncertain send.
- `POST /api/jobs/event` `{id,status,claimToken,evidence:{kind,reference,verifiedAt},note,nextStep}` — email_sent needs gmail_sent evidence; ats_received needs ats_receipt. Conditional outreach uses inquiry, never application status. Other statuses: blocked, rejected, interview, accepted. A reply or acceptance must be observed, not inferred.
- `POST /api/jobs/release` `{id,claimToken,reason}` — only after verifying whether a send happened. Released jobs are blocked until independently reviewed.
- `POST /api/jobs/settings` — dailyTarget (10–100), matchThreshold (90–100), autoApply, linkedin, indeed, greenhouseBoards (max 15).

Routine discovery/application updates go to persistent storage and need no deploy. Preserve the static legacy tracker and synchronize meaningful submissions there when appropriate. Never put résumés, facts, private mail or credentials in source. Build: `node scripts/build-job-assistant.mjs`; tests: `node --test tests/job-assistant.test.mjs`. The Worker embeds all retained website assets. Sites packages the generated Worker and schema migrations; schema SQL is not executed in request handlers.

- `POST /api/jobs/answer` `{id,questionIndex,value}` stores an answer entered by the user in the private job workspace. Never have the agent use this endpoint to invent an answer.
