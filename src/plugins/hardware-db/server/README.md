# Server side of the hardware knowledge base

These files do **not** ship with the app. They configure and operate the PocketBase instance the
plugin talks to (`config.pocketbaseUrl` in `../plugin.json`). They live here so the client and its
backend stay in one place — the collection schema and the payload the plugin sends have to match.

| File                          | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `pocketbase-collections.json` | Collection schema. Import via _Settings → Import collections_.           |
| `review.html`                 | Review UI for approving submissions. Deploy to `pb_public/`.             |
| `index.html`                  | Public browsable database. Deploy to `pb_public/`.                       |
| `logo.png`                    | Used by `index.html`; copy of `src/assets/Logo_TouchNStars_300x300.png`. |
| `pb_hooks/discord.pb.js`      | Optional Discord notifications. Deploy to `pb_hooks/`.                   |

## Importing the schema

Paste the contents of `pocketbase-collections.json` into _Settings → Import collections_ and keep
**"Merge with the existing collections" enabled**. Without it PocketBase treats the file as the
complete desired state and deletes everything missing from it — including `_superusers`, which
locks you out.

The diff must show four added collections and no deletions.

The view collection `hw_submission_status` is not part of the import; create it by hand as a
**View** collection with the query `SELECT id, reportToken, status FROM hw_submissions` and open
its List and View rules.

## The `stack` field

`hw_entries.stack` records which software drove the device — `nina` or `phd2`. PHD2 keeps its own
driver list, so a camera working under INDI says nothing about whether PHD2 can talk to it. The
two are separate entries on the same device rather than separate devices, because "guide camera"
describes a usage, not the hardware: the same model is a guider on one rig and an imaging camera
on the next.

Entries written before the field existed have it empty; both pages read empty as `nina`.

If the schema was imported before this field was added, either re-import in merge mode or add it
by hand to `hw_entries`: a **select** field named `stack`, values `nina` and `phd2`, not required.

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

## Deploying the pages

```bash
scp index.html review.html logo.png root@<server>:/opt/pocketbase/pb_public/
ssh root@<server> chown -R pocketbase:pocketbase /opt/pocketbase/pb_public
```

PocketBase serves `pb_public/` itself, so the public database lands on `https://<domain>/` and the
review UI on `https://<domain>/review.html`. No restart, no second service, no reverse proxy. It contains no credentials — it asks
for the superuser login and keeps the token in `sessionStorage`. The API rules remain the security
boundary; the page is only a more convenient remote control for the same API.

## Discord notifications (optional)

```bash
scp -r pb_hooks root@<server>:/opt/pocketbase/
ssh root@<server> chown -R pocketbase:pocketbase /opt/pocketbase/pb_hooks
```

Then add the webhook URLs to the service and restart it:

```ini
# /etc/systemd/system/pocketbase.service, under [Service]
Environment=DISCORD_WEBHOOK_REVIEW=https://discord.com/api/webhooks/...
Environment=DISCORD_WEBHOOK_PUBLIC=https://discord.com/api/webhooks/...
```

```bash
systemctl daemon-reload && systemctl restart pocketbase
journalctl -u pocketbase -f
```

`DISCORD_WEBHOOK_REVIEW` fires when a report arrives and belongs in a **private** channel — it
references unreviewed content. `DISCORD_WEBHOOK_PUBLIC` fires when an entry is published and is
safe for a public channel: it only runs after a review and carries no raw user input. Each is
independent; leave a variable unset and that notification stays off.

The URLs live in the unit file, never in the hook: anyone holding a webhook URL can post into the
channel, and this repository is not the place for one. PocketBase watches `pb_hooks/` and reloads
on change, so only the environment change needs the restart.

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
