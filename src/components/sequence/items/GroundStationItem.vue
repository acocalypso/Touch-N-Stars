<template>
  <ItemShell :item="item">
    <template v-if="summary" #summary>
      <span class="text-xs text-slate-400 truncate">{{ summary }}</span>
    </template>

    <template v-if="fields.length" #editor="{ save }">
      <template v-for="f in visibleFields" :key="f.key">
        <!-- Select -->
        <div v-if="f.type === 'select'" class="flex items-center gap-3">
          <label class="text-xs text-slate-400 flex-shrink-0">{{ fieldLabel(f) }}</label>
          <select
            class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
            :value="item[f.key]"
            @change="save(f.key, f.numeric ? Number($event.target.value) : $event.target.value)"
          >
            <option v-for="opt in f.options" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Number -->
        <NumberInputPicker
          v-else-if="f.type === 'number'"
          :modelValue="item[f.key] ?? 0"
          :label="fieldLabel(f)"
          :labelKey="`gs-${item.Id}-${f.key}`"
          :min="f.min ?? 0"
          :max="f.max ?? 99999"
          :step="1"
          @change="save(f.key, $event)"
        />

        <!-- Boolean -->
        <div v-else-if="f.type === 'bool'" class="flex items-center gap-3">
          <label class="text-xs text-slate-400">{{ fieldLabel(f) }}</label>
          <button
            class="ml-auto px-3 py-1 rounded text-xs font-medium border transition-colors"
            :class="
              item[f.key]
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                : 'bg-slate-700/60 text-slate-400 border-slate-600 hover:bg-slate-700'
            "
            @click="save(f.key, !item[f.key])"
          >
            {{
              item[f.key] ? $t('components.sequence.items.on') : $t('components.sequence.items.off')
            }}
          </button>
        </div>

        <!-- Textarea -->
        <div v-else-if="f.type === 'textarea'" class="flex items-start gap-3">
          <label class="text-xs text-slate-400 flex-shrink-0 mt-1">{{ fieldLabel(f) }}</label>
          <TextAreaInput
            :modelValue="item[f.key] ?? ''"
            inputClass="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 resize-none"
            :rows="3"
            @change="save(f.key, $event)"
          />
        </div>

        <!-- Password -->
        <div v-else-if="f.type === 'password'" class="flex items-center gap-3">
          <label class="text-xs text-slate-400 flex-shrink-0">{{ fieldLabel(f) }}</label>
          <input
            type="password"
            class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
            :value="item[f.key] ?? ''"
            @change="save(f.key, $event.target.value)"
          />
        </div>

        <!-- Text -->
        <div v-else class="flex items-center gap-3">
          <label class="text-xs text-slate-400 flex-shrink-0">{{ fieldLabel(f) }}</label>
          <TextInput
            :modelValue="item[f.key] ?? ''"
            inputClass="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
            @change="save(f.key, $event)"
          />
        </div>
      </template>
    </template>
  </ItemShell>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import TextInput from '@/components/helpers/TextInput.vue';
import TextAreaInput from '@/components/helpers/TextAreaInput.vue';

const { t } = useI18n();

const props = defineProps({
  item: { type: Object, required: true },
});

const rawOptions = (values) => values.map((v) => ({ value: v, label: String(v) }));

const QOS_OPTIONS = rawOptions([0, 1, 2]);
const PUSHOVER_PRIORITIES = rawOptions(['Lowest', 'Low', 'Normal', 'High', 'Emergency']);
const PUSHOVER_SOUNDS = rawOptions([
  'Pushover',
  'Bike',
  'Bugle',
  'CashRegister',
  'Classical',
  'Cosmic',
  'Falling',
  'Gamelan',
  'Incoming',
  'Intermission',
  'Magic',
  'Mechanical',
  'Pianobar',
  'Siren',
  'SpaceAlarm',
  'Tugboat',
  'Alien',
  'Climb',
  'Persistent',
  'Echo',
  'Updown',
  'None',
]);
const NTFY_PRIORITIES = rawOptions(['Default', 'High', 'Low', 'Max', 'Min']);

// Field definitions per Ground Station type, based on the properties exposed by
// the NINA Advanced API and the enums in the Ground Station plugin sources.
const GS_FIELDS = {
  'DaleGhent.NINA.GroundStation.SendToMqtt.SendToMqtt': [
    { key: 'Topic', label: 'topic', type: 'text' },
    { key: 'Payload', label: 'payload', type: 'textarea' },
    { key: 'QoS', label: 'qos', type: 'select', options: QOS_OPTIONS, numeric: true },
    { key: 'Retain', label: 'retain', type: 'bool' },
  ],
  'DaleGhent.NINA.GroundStation.SendToEmail.SendToEmail': [
    { key: 'Recipient', label: 'recipient', type: 'text' },
    { key: 'Subject', label: 'subject', type: 'text' },
    { key: 'Body', label: 'body', type: 'textarea' },
  ],
  'DaleGhent.NINA.GroundStation.HTTP.HttpClient': [
    { key: 'HttpClientDescription', label: 'description', type: 'text' },
    {
      key: 'HttpMethod',
      label: 'method',
      type: 'select',
      options: rawOptions(['GET', 'POST']),
    },
    { key: 'HttpUri', label: 'url', type: 'text' },
    {
      key: 'HttpPostContentType',
      label: 'contentType',
      type: 'text',
      showIf: (item) => item.HttpMethod === 'POST',
    },
    {
      key: 'HttpPostBody',
      label: 'body',
      type: 'textarea',
      showIf: (item) => item.HttpMethod === 'POST',
    },
    { key: 'HttpAuthUsername', label: 'username', type: 'text' },
    { key: 'HttpAuthPassword', label: 'password', type: 'password' },
  ],
  'DaleGhent.NINA.GroundStation.DiscordWebhook.SendToDiscordWebhook': [
    { key: 'Message', label: 'message', type: 'textarea' },
    { key: 'ShowEmbed', label: 'showEmbed', type: 'bool' },
    { key: 'EmbedTitle', label: 'embedTitle', type: 'text', showIf: (item) => item.ShowEmbed },
    { key: 'EmbedText', label: 'embedText', type: 'textarea', showIf: (item) => item.ShowEmbed },
  ],
  'DaleGhent.NINA.GroundStation.SendToIftttWebhook.SendToIftttWebhook': [
    { key: 'EventName', label: 'eventName', type: 'text' },
    { key: 'Value1', label: 'value1', type: 'text' },
    { key: 'Value2', label: 'value2', type: 'text' },
    { key: 'Value3', label: 'value3', type: 'text' },
    { key: 'InstructionDescription', label: 'description', type: 'text' },
  ],
  'DaleGhent.NINA.GroundStation.NtfySh.SendToNtfySh': [
    { key: 'Title', label: 'title', type: 'text' },
    { key: 'Message', label: 'message', type: 'textarea' },
    { key: 'Priority', label: 'priority', type: 'select', options: NTFY_PRIORITIES },
    { key: 'Tags', label: 'tags', type: 'text' },
  ],
  'DaleGhent.NINA.GroundStation.SendToPushover.SendToPushover': [
    { key: 'Title', label: 'title', type: 'text' },
    { key: 'Message', label: 'message', type: 'textarea' },
    { key: 'Priority', label: 'priority', type: 'select', options: PUSHOVER_PRIORITIES },
    {
      key: 'NotificationSound',
      label: 'notificationSound',
      type: 'select',
      options: PUSHOVER_SOUNDS,
    },
  ],
  'DaleGhent.NINA.GroundStation.Slack.SendToSlack': [
    { key: 'Channel', label: 'channel', type: 'text' },
    { key: 'Message', label: 'message', type: 'textarea' },
  ],
  'DaleGhent.NINA.GroundStation.SendToTelegram.SendToTelegram': [
    { key: 'Message', label: 'message', type: 'textarea' },
    { key: 'DoNotNotify', label: 'doNotNotify', type: 'bool' },
  ],
  'DaleGhent.NINA.GroundStation.IpProtocols.SendUdp': [
    { key: 'Address', label: 'address', type: 'text' },
    { key: 'Port', label: 'port', type: 'number', min: 0, max: 65535 },
    {
      key: 'PayloadType',
      label: 'payloadType',
      type: 'select',
      numeric: true,
      options: [
        { value: 0, label: 'ASCII' },
        { value: 1, label: 'Binary' },
      ],
    },
    {
      key: 'LineTermination',
      label: 'lineTermination',
      type: 'select',
      numeric: true,
      options: [
        { value: 0, label: 'None' },
        { value: 1, label: 'CR' },
        { value: 2, label: 'LF' },
        { value: 3, label: 'CRLF' },
      ],
    },
    { key: 'Payload', label: 'payload', type: 'textarea' },
  ],
  // Triggers
  'DaleGhent.NINA.GroundStation.FailuresToDiscordWebhookTrigger.FailuresToDiscordWebhookTrigger':
    [],
  'DaleGhent.NINA.GroundStation.FailuresToEmailTrigger.FailuresToEmailTrigger': [
    { key: 'Recipient', label: 'recipient', type: 'text' },
  ],
  'DaleGhent.NINA.GroundStation.FailuresToIftttTrigger.FailuresToIftttTrigger': [
    { key: 'EventName', label: 'eventName', type: 'text' },
  ],
  'DaleGhent.NINA.GroundStation.FailuresToMqttTrigger.FailuresToMqttTrigger': [
    { key: 'Topic', label: 'topic', type: 'text' },
    { key: 'QoS', label: 'qos', type: 'select', options: QOS_OPTIONS, numeric: true },
    { key: 'Retain', label: 'retain', type: 'bool' },
  ],
  'DaleGhent.NINA.GroundStation.NtfySh.FailuresToNtfySh': [],
  'DaleGhent.NINA.GroundStation.FailuresToPushoverTrigger.FailuresToPushoverTrigger': [
    { key: 'Priority', label: 'priority', type: 'select', options: PUSHOVER_PRIORITIES },
    {
      key: 'NotificationSound',
      label: 'notificationSound',
      type: 'select',
      options: PUSHOVER_SOUNDS,
    },
  ],
  'DaleGhent.NINA.GroundStation.Slack.FailuresToSlackTrigger': [
    { key: 'Channel', label: 'channel', type: 'text' },
  ],
  'DaleGhent.NINA.GroundStation.FailuresToTelegramTrigger.FailuresToTelegramTrigger': [],
};

const SUMMARY_KEYS = [
  'Message',
  'Subject',
  'Topic',
  'HttpUri',
  'Recipient',
  'EventName',
  'Address',
];

const fields = computed(() => GS_FIELDS[props.item.FullTypeName] ?? []);

const visibleFields = computed(() => fields.value.filter((f) => !f.showIf || f.showIf(props.item)));

const summary = computed(() => {
  for (const key of SUMMARY_KEYS) {
    const val = props.item[key];
    if (typeof val === 'string' && val.trim()) return val;
  }
  return '';
});

function fieldLabel(f) {
  return t(`components.sequence.items.groundstation.${f.label}`);
}
</script>
