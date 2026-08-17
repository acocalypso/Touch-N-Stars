# Server side of the hardware knowledge base

These files do **not** ship with the app. They configure and operate the PocketBase instance the
plugin talks to (`config.pocketbaseUrl` in `../plugin.json`). They live here so the client and its
backend stay in one place — the collection schema and the payload the plugin sends have to match.

| File                          | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `pocketbase-collections.json` | Collection schema. Import via _Settings → Import collections_. |
| `review.html`                 | Review UI for approving submissions. Deploy to `pb_public/`.   |

## Importing the schema

Paste the contents of `pocketbase-collections.json` into _Settings → Import collections_ and keep
**"Merge with the existing collections" enabled**. Without it PocketBase treats the file as the
complete desired state and deletes everything missing from it — including `_superusers`, which
locks you out.

The diff must show four added collections and no deletions.

The view collection `hw_submission_status` is not part of the import; create it by hand as a
**View** collection with the query `SELECT id, reportToken, status FROM hw_submissions` and open
its List and View rules.

## Access rules

Exactly one rule in the whole system allows public writes:

| Collection                             | List / View     | Create          | Update / Delete |
| -------------------------------------- | --------------- | --------------- | --------------- |
| `hw_submissions`                       | superusers only | **public**      | superusers only |
| `hw_submission_status`                 | public          | —               | —               |
| `hw_devices`, `hw_entries`, `hw_notes` | public          | superusers only | superusers only |

`hw_submissions` must stay unreadable: it holds raw submissions including unedited free-text notes
from other users.

Its create rule is `@request.body.status = 'pending' && @request.body.reviewNote:isset = false`.
Without it anyone could post a record that is already approved and walk straight past the review
queue, so the client sends `status: 'pending'` explicitly (see `../utils/hardwareDbApi.js`).

## Deploying the review page

```bash
scp review.html root@<server>:/opt/pocketbase/pb_public/
ssh root@<server> chown pocketbase:pocketbase /opt/pocketbase/pb_public/review.html
```

Served at `https://<domain>/review.html`, no restart needed. It contains no credentials — it asks
for the superuser login and keeps the token in `sessionStorage`. The API rules remain the security
boundary; the page is only a more convenient remote control for the same API.

## Verifying the rules

```bash
PB="https://<domain>"
curl -s -o /dev/null -w '%{http_code}\n' "$PB/api/collections/hw_submissions/records"        # 403
curl -s -o /dev/null -w '%{http_code}\n' "$PB/api/collections/hw_entries/records?perPage=1"  # 200
curl -s -o /dev/null -w '%{http_code}\n' "$PB/api/collections/hw_submission_status/records"  # 200

# self-approval must be rejected (400)
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$PB/api/collections/hw_submissions/records" \
  -H 'Content-Type: application/json' \
  -d '{"schemaVersion":1,"reportToken":"hw_test_evil","status":"approved","payload":{}}'
```
