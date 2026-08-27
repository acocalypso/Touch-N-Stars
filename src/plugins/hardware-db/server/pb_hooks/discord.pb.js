/// <reference path="../pb_data/types.d.ts" /> // resolves only inside pb_hooks/ on the server

/**
 * Discord notifications for the hardware knowledge base.
 *
 * Deploy to /opt/pocketbase/pb_hooks/. PocketBase watches the directory and
 * reloads on change - no restart needed.
 *
 * The webhook URLs are read from the environment, never from this file: it
 * lives in a git repository, and anyone holding a webhook URL can post into the
 * channel. Set them in the systemd unit:
 *
 *   Environment=DISCORD_WEBHOOK_REVIEW=https://discord.com/api/webhooks/...
 *   Environment=DISCORD_WEBHOOK_PUBLIC=https://discord.com/api/webhooks/...
 *
 * Each hook is independent: leave a variable unset and that notification stays
 * off. Both are optional.
 */

const SITE_URL = 'https://hardware.touch-n-stars.eu';

/**
 * Fire-and-forget. A webhook must never take the record down with it - Discord
 * being slow or the URL being wrong is not a reason to reject a user's report.
 */
function notify(webhookUrl, payload) {
  if (!webhookUrl) return;

  try {
    $http.send({
      url: webhookUrl,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 10,
    });
  } catch (err) {
    console.log('[hardware-db] Discord webhook failed: ' + err);
  }
}

/* ---------------------------------------------------------------- *
 * A new report arrived and is waiting for review.
 * Goes to a private channel - it references unreviewed content.
 * ---------------------------------------------------------------- */
onRecordAfterCreateSuccess((e) => {
  const webhook = $os.getenv('DISCORD_WEBHOOK_REVIEW');
  if (!webhook) {
    e.next();
    return;
  }

  try {
    const payload = e.record.get('payload') || {};
    const devices = Array.isArray(payload.devices) ? payload.devices : [];

    // Device names only, no free text: the notes are unreviewed user input and
    // have no business being auto-posted anywhere.
    const lines = devices.map((d) => {
      const name = d.displayName || d.name || 'unnamed';
      const driver = d.driverInfo ? ' — `' + d.driverInfo + '`' : '';
      return '• ' + name + driver + ' → **' + (d.userStatus || '?') + '**';
    });

    notify(webhook, {
      username: 'Hardware DB',
      embeds: [
        {
          title: 'New report awaiting review',
          url: SITE_URL + '/review.html',
          color: 0x1f5fa9,
          description: lines.join('\n').slice(0, 3800) || '_no devices_',
          fields: [
            {
              name: 'Setup',
              value:
                (payload.client && payload.client.mode ? payload.client.mode : '?') +
                ' · ' +
                (payload.backend && payload.backend.pinsVersion
                  ? 'PINS ' + payload.backend.pinsVersion
                  : 'NINA'),
              inline: true,
            },
            { name: 'Devices', value: String(devices.length), inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    });
  } catch (err) {
    console.log('[hardware-db] Review notification failed: ' + err);
  }

  e.next();
}, 'hw_submissions');

/* ---------------------------------------------------------------- *
 * An entry was published. Safe for a public channel: it only fires
 * after a review, and it carries no raw user input.
 * ---------------------------------------------------------------- */
onRecordAfterCreateSuccess((e) => {
  const webhook = $os.getenv('DISCORD_WEBHOOK_PUBLIC');
  if (!webhook) {
    e.next();
    return;
  }

  try {
    const status = e.record.getString('status');
    const driver = e.record.getString('driver');

    let deviceName = 'Unknown device';
    let category = '';
    try {
      const device = $app.findRecordById('hw_devices', e.record.getString('device'));
      deviceName = [device.getString('vendor'), device.getString('model')]
        .filter(Boolean)
        .join(' ');
      category = device.getString('category');
    } catch (err) {
      console.log('[hardware-db] Device lookup failed: ' + err);
    }

    const colors = { works: 0x34d399, caveat: 0xfbbf24, broken: 0xf87171 };
    const labels = {
      works: 'works',
      caveat: 'works with caveats',
      broken: 'does not work',
    };

    notify(webhook, {
      username: 'Hardware DB',
      embeds: [
        {
          title: deviceName,
          url: SITE_URL,
          color: colors[status] || 0x64748b,
          description: 'Reported to **' + (labels[status] || status) + '** with `' + driver + '`',
          fields: category ? [{ name: 'Type', value: category, inline: true }] : [],
          footer: { text: 'Touch’N’Stars Hardware Compatibility' },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  } catch (err) {
    console.log('[hardware-db] Publish notification failed: ' + err);
  }

  e.next();
}, 'hw_entries');
