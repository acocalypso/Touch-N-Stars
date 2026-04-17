<template>
  <div>
    <!-- Report Content -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold text-white mb-4">
        {{ $t('nightsummary.settings.reportContent') }}
      </h2>
      <div class="space-y-3">
        <div class="flex items-center gap-4">
          <span class="text-gray-300 w-52 shrink-0">{{
            $t('nightsummary.settings.detailLevel')
          }}</span>
          <select
            :value="store.settings.ReportDetailLevel"
            @change="save('ReportDetailLevel', +$event.target.value)"
            class="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="0">{{ $t('nightsummary.settings.detailSnapshot') }}</option>
            <option value="1">{{ $t('nightsummary.settings.detailStandard') }}</option>
            <option value="2">{{ $t('nightsummary.settings.detailFull') }}</option>
          </select>
        </div>

        <CheckRow
          :label="$t('nightsummary.settings.showTsProgressBars')"
          :value="store.settings.ShowTSProgressBars"
          @update="save('ShowTSProgressBars', $event)"
        />
        <CheckRow
          :label="$t('nightsummary.settings.showNextNightPreview')"
          :value="store.settings.ShowNextNightPreview"
          @update="save('ShowNextNightPreview', $event)"
        />
        <CheckRow
          :label="$t('nightsummary.settings.showOverheadBreakdown')"
          :value="store.settings.ShowOverheadBreakdown"
          @update="save('ShowOverheadBreakdown', $event)"
        />
        <CheckRow
          :label="$t('nightsummary.settings.showSkyThumbnails')"
          :value="store.settings.ShowSkyThumbnails"
          @update="save('ShowSkyThumbnails', $event)"
        />
        <CheckRow
          :label="$t('nightsummary.settings.showLiveStackImages')"
          :value="store.settings.ShowLiveStackImages"
          @update="save('ShowLiveStackImages', $event)"
        />
        <CheckRow
          :label="$t('nightsummary.settings.showAltitudeChart')"
          :value="store.settings.ShowAltitudeChart"
          @update="save('ShowAltitudeChart', $event)"
          :disabled="store.settings.ReportDetailLevel === 0"
        />
        <div class="ml-6 space-y-2">
          <CheckRow
            :label="$t('nightsummary.settings.showMoonCurve')"
            :value="store.settings.ShowMoonCurve"
            @update="save('ShowMoonCurve', $event)"
            :disabled="store.settings.ReportDetailLevel === 0 || !store.settings.ShowAltitudeChart"
          />
          <CheckRow
            :label="$t('nightsummary.settings.showMinAltitude')"
            :value="store.settings.ShowMinAltitude"
            @update="save('ShowMinAltitude', $event)"
            :disabled="store.settings.ReportDetailLevel === 0 || !store.settings.ShowAltitudeChart"
          />
        </div>
        <CheckRow
          :label="$t('nightsummary.settings.showStarCountCV')"
          :value="store.settings.ShowStarCountCV"
          @update="save('ShowStarCountCV', $event)"
          :disabled="store.settings.ReportDetailLevel === 0"
        />
        <CheckRow
          :label="$t('nightsummary.settings.showPerTargetIQ')"
          :value="store.settings.ShowPerTargetIQ"
          @update="save('ShowPerTargetIQ', $event)"
          :disabled="store.settings.ReportDetailLevel === 0"
        />
        <CheckRow
          :label="$t('nightsummary.settings.showSessionHistory')"
          :value="store.settings.ShowSessionHistory"
          @update="save('ShowSessionHistory', $event)"
          :disabled="store.settings.ReportDetailLevel < 2"
        />
        <CheckRow
          :label="$t('nightsummary.settings.showMetricChart')"
          :value="store.settings.ShowHFRGraph"
          @update="save('ShowHFRGraph', $event)"
          :disabled="store.settings.ReportDetailLevel < 2"
        />

        <div
          v-if="store.settings.ShowHFRGraph && store.settings.ReportDetailLevel >= 2"
          class="ml-6 space-y-2"
        >
          <CheckRow
            :label="$t('nightsummary.settings.showChartAfMarkers')"
            :value="store.settings.ShowChartAfMarkers"
            @update="save('ShowChartAfMarkers', $event)"
          />
          <CheckRow
            :label="$t('nightsummary.settings.showChartFlipMarkers')"
            :value="store.settings.ShowChartFlipMarkers"
            @update="save('ShowChartFlipMarkers', $event)"
          />
          <CheckRow
            :label="$t('nightsummary.settings.showChartRoofMarkers')"
            :value="store.settings.ShowChartRoofMarkers"
            @update="save('ShowChartRoofMarkers', $event)"
          />
        </div>

        <template v-if="store.settings.ShowHFRGraph && store.settings.ReportDetailLevel >= 2">
          <div class="flex items-center gap-4">
            <span class="text-gray-300 w-52 shrink-0">{{
              $t('nightsummary.settings.chartXAxis')
            }}</span>
            <select
              :value="store.settings.ChartXAxisMetric"
              @change="save('ChartXAxisMetric', +$event.target.value)"
              class="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option v-for="(m, i) in xAxisMetrics" :key="i" :value="i">{{ m }}</option>
            </select>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-gray-300 w-52 shrink-0">{{
              $t('nightsummary.settings.chartPrimary')
            }}</span>
            <select
              :value="store.settings.ChartPrimaryMetric"
              @change="save('ChartPrimaryMetric', +$event.target.value)"
              class="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option v-for="(m, i) in primaryMetrics" :key="i" :value="i">{{ m }}</option>
            </select>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-gray-300 w-52 shrink-0">{{
              $t('nightsummary.settings.chartSecondary')
            }}</span>
            <select
              :value="store.settings.ChartSecondaryMetric"
              @change="save('ChartSecondaryMetric', +$event.target.value)"
              class="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option v-for="(m, i) in secondaryMetrics" :key="i" :value="i">{{ m }}</option>
            </select>
          </div>
        </template>

        <CheckRow
          :label="$t('nightsummary.settings.expandSectionsDefault')"
          :value="store.settings.ExpandSectionsDefault"
          @update="save('ExpandSectionsDefault', $event)"
        />
        <CheckRow
          :label="$t('nightsummary.settings.lightModeReport')"
          :value="store.settings.ReportLightMode"
          @update="save('ReportLightMode', $event)"
        />
      </div>
    </section>

    <!-- Filter Classifications -->
    <section v-if="store.filterNames.length > 0" class="mb-8">
      <h2 class="text-lg font-semibold text-white mb-1">
        {{ $t('nightsummary.settings.filterClassifications') }}
      </h2>
      <p class="text-gray-400 text-sm mb-4">
        {{ $t('nightsummary.settings.filterClassificationsHint') }}
      </p>
      <div class="space-y-2">
        <div
          v-for="filterName in store.filterNames"
          :key="filterName"
          class="flex items-center gap-4"
        >
          <span class="text-gray-300 w-32 shrink-0">{{ filterName }}</span>
          <select
            :value="getFilterClass(filterName)"
            @change="setFilterClass(filterName, $event.target.value)"
            class="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="auto">{{ $t('nightsummary.settings.filterAuto') }}</option>
            <option value="broadband">{{ $t('nightsummary.settings.filterBroadband') }}</option>
            <option value="narrowband">{{ $t('nightsummary.settings.filterNarrowband') }}</option>
            <option value="exclude">{{ $t('nightsummary.settings.filterExclude') }}</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Equipment Profile -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold text-white mb-2">
        {{ $t('nightsummary.settings.equipmentProfile') }}
      </h2>
      <CheckRow
        :label="$t('nightsummary.settings.showEquipmentProfile')"
        :value="store.settings.ShowEquipmentProfile"
        @update="save('ShowEquipmentProfile', $event)"
      />
      <p class="text-gray-400 text-xs mt-2 mb-4">{{ $t('nightsummary.settings.equipmentHint') }}</p>
      <div class="space-y-2">
        <div v-for="item in equipmentItems" :key="item.key" class="flex items-center gap-3">
          <ToggleButton
            :statusValue="isEquipmentVisible(item.key)"
            @click="toggleEquipmentVisible(item.key, !isEquipmentVisible(item.key))"
          />
          <span class="text-gray-300 w-36 shrink-0 text-sm">{{ item.label }}</span>
          <input
            type="text"
            :value="getEquipmentOverride(item.key)"
            @blur="setEquipmentOverride(item.key, $event.target.value)"
            :placeholder="$t('nightsummary.settings.equipmentOverridePlaceholder')"
            class="flex-1 max-w-xs bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>
    </section>

    <!-- Report File Naming -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold text-white mb-4">
        {{ $t('nightsummary.settings.fileNaming') }}
      </h2>
      <CheckRow
        :label="$t('nightsummary.settings.saveReportLocally')"
        :value="store.settings.SaveReportLocally"
        @update="save('SaveReportLocally', $event)"
      />
      <div class="flex items-center gap-4 mt-2 mb-2">
        <span class="text-gray-300 w-52 shrink-0">{{ $t('nightsummary.settings.savePath') }}</span>
        <input
          type="text"
          :value="store.settings.SaveReportPath"
          @blur="save('SaveReportPath', $event.target.value)"
          :placeholder="$t('nightsummary.settings.savePathPlaceholder')"
          class="flex-1 max-w-sm bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
        />
        <button
          @click="showPathBrowser = true"
          class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition"
        >
          {{ $t('components.fileBrowser.title') }}
        </button>
      </div>
      <FileBrowser
        v-model="showPathBrowser"
        mode="directory"
        :initial-path="store.settings.SaveReportPath"
        @select="save('SaveReportPath', $event)"
      />
      <div class="flex items-center gap-4 mt-4 mb-2">
        <span class="text-gray-300 w-52 shrink-0">{{
          $t('nightsummary.settings.filePattern')
        }}</span>
        <input
          type="text"
          :value="store.settings.SaveReportFilePattern"
          @blur="save('SaveReportFilePattern', $event.target.value)"
          class="flex-1 max-w-sm bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
        />
      </div>
      <div class="flex flex-wrap gap-2 ml-52 mt-2">
        <button
          v-for="token in patternTokens"
          :key="token"
          @click="insertToken(token)"
          class="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded transition"
        >
          {{ token }}
        </button>
      </div>
      <p class="text-gray-400 text-xs ml-52 mt-2">
        {{ $t('nightsummary.settings.filePatternHint') }}
      </p>
    </section>

    <!-- Email -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold text-white mb-4">
        {{ $t('nightsummary.settings.emailTitle') }}
      </h2>
      <CheckRow
        :label="$t('nightsummary.settings.emailEnabled')"
        :value="store.settings.EmailEnabled"
        @update="save('EmailEnabled', $event)"
      />
      <div class="mt-4 space-y-3">
        <div class="flex items-center gap-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              :checked="store.settings.UseGmailSmtp"
              @change="save('UseGmailSmtp', true)"
              class="border-gray-600 text-cyan-500 focus:ring-cyan-500"
            />
            <span class="text-gray-300 text-sm">Gmail</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              :checked="!store.settings.UseGmailSmtp"
              @change="save('UseGmailSmtp', false)"
              class="border-gray-600 text-cyan-500 focus:ring-cyan-500"
            />
            <span class="text-gray-300 text-sm">{{
              $t('nightsummary.settings.emailOtherProvider')
            }}</span>
          </label>
        </div>
        <TextRow
          :label="$t('nightsummary.settings.emailSender')"
          :value="store.settings.SenderAddress"
          @blur="save('SenderAddress', $event)"
        />
        <TextRow
          :label="$t('nightsummary.settings.emailPassword')"
          :value="store.settings.SmtpPassword"
          @blur="save('SmtpPassword', $event)"
          type="password"
        />
        <TextRow
          :label="$t('nightsummary.settings.emailRecipient')"
          :value="store.settings.RecipientAddress"
          @blur="save('RecipientAddress', $event)"
        />
        <template v-if="!store.settings.UseGmailSmtp">
          <TextRow
            :label="$t('nightsummary.settings.smtpServer')"
            :value="store.settings.SmtpHost"
            @blur="save('SmtpHost', $event)"
          />
          <div class="flex items-center gap-4">
            <span class="text-gray-300 w-52 shrink-0">{{
              $t('nightsummary.settings.smtpPort')
            }}</span>
            <input
              type="number"
              :value="store.settings.SmtpPort"
              @blur="save('SmtpPort', +$event.target.value)"
              class="w-24 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
            <label class="flex items-center gap-2 ml-4 cursor-pointer">
              <input
                type="checkbox"
                :checked="store.settings.SmtpSsl"
                @change="save('SmtpSsl', $event.target.checked)"
                class="rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
              />
              <span class="text-gray-300 text-sm">{{ $t('nightsummary.settings.smtpSsl') }}</span>
            </label>
          </div>
        </template>
        <div class="flex items-center gap-4">
          <button
            @click="store.testEmail()"
            :disabled="store.emailTesting"
            class="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm rounded transition"
          >
            {{ store.emailTesting ? $t('common.loading') : $t('nightsummary.settings.testEmail') }}
          </button>
          <StatusBadge
            v-if="store.emailTestStatus"
            :ok="store.emailTestStatus.Ok"
            :message="store.emailTestStatus.Message"
          />
        </div>
      </div>
    </section>

    <!-- Pushover -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold text-white mb-4">
        {{ $t('nightsummary.settings.pushoverTitle') }}
      </h2>
      <CheckRow
        :label="$t('nightsummary.settings.pushoverEnabled')"
        :value="store.settings.PushoverEnabled"
        @update="save('PushoverEnabled', $event)"
      />
      <div class="mt-4 space-y-3">
        <TextRow
          :label="$t('nightsummary.settings.pushoverAppToken')"
          :value="store.settings.PushoverAppToken"
          @blur="save('PushoverAppToken', $event)"
        />
        <TextRow
          :label="$t('nightsummary.settings.pushoverUserKey')"
          :value="store.settings.PushoverUserKey"
          @blur="save('PushoverUserKey', $event)"
        />
        <div class="flex items-center gap-4">
          <button
            @click="store.testPushover()"
            :disabled="store.pushoverTesting"
            class="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm rounded transition"
          >
            {{
              store.pushoverTesting
                ? $t('common.loading')
                : $t('nightsummary.settings.testPushover')
            }}
          </button>
          <StatusBadge
            v-if="store.pushoverTestStatus"
            :ok="store.pushoverTestStatus.Ok"
            :message="store.pushoverTestStatus.Message"
          />
        </div>
      </div>
    </section>

    <!-- Discord -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold text-white mb-4">
        {{ $t('nightsummary.settings.discordTitle') }}
      </h2>
      <CheckRow
        :label="$t('nightsummary.settings.discordEnabled')"
        :value="store.settings.DiscordEnabled"
        @update="save('DiscordEnabled', $event)"
      />
      <div class="mt-4 space-y-3">
        <TextRow
          :label="$t('nightsummary.settings.discordWebhook')"
          :value="store.settings.DiscordWebhookUrl"
          @blur="save('DiscordWebhookUrl', $event)"
        />
        <div class="flex items-center gap-4">
          <button
            @click="store.testDiscord()"
            :disabled="store.discordTesting"
            class="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm rounded transition"
          >
            {{
              store.discordTesting ? $t('common.loading') : $t('nightsummary.settings.testDiscord')
            }}
          </button>
          <StatusBadge
            v-if="store.discordTestStatus"
            :ok="store.discordTestStatus.Ok"
            :message="store.discordTestStatus.Message"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useNightSummaryStore } from '../store/nightsummaryStore';
import CheckRow from './CheckRow.vue';
import TextRow from './TextRow.vue';
import StatusBadge from './StatusBadge.vue';
import ToggleButton from '@/components/helpers/toggleButton.vue';
import FileBrowser from '@/components/helpers/fileBrowser.vue';

const store = useNightSummaryStore();
const showPathBrowser = ref(false);

const xAxisMetrics = [
  'Time',
  'Frame Index',
  'HFR',
  'FWHM',
  'Guiding RMS',
  'Focuser Temp (°C)',
  'Ambient Temp (°C)',
  'Eccentricity',
  'Altitude (°)',
  'Airmass',
  'Humidity (%)',
  'Focuser Position (steps)',
  'Sky Quality (mag/arcsec²)',
  'Cloud Cover (%)',
  'Camera Temp (°C)',
  'Dew Point (°C)',
  'Wind Speed (m/s)',
  'Pressure (hPa)',
  'Star Count',
  'Azimuth (°)',
  'Seeing FWHM (arcsec)',
  'Median ADU',
];

const primaryMetrics = [
  'HFR',
  'FWHM',
  'Guiding RMS',
  'Focuser Temp (°C)',
  'Ambient Temp (°C)',
  'Eccentricity',
  'Altitude (°)',
  'Airmass',
  'Humidity (%)',
  'Focuser Position (steps)',
  'Sky Quality (mag/arcsec²)',
  'Cloud Cover (%)',
  'Camera Temp (°C)',
  'Dew Point (°C)',
  'Wind Speed (m/s)',
  'Pressure (hPa)',
  'Star Count',
  'Azimuth (°)',
  'Seeing FWHM (arcsec)',
  'Median ADU',
];

const secondaryMetrics = ['None', ...primaryMetrics];

const equipmentItems = [
  { key: 'Camera', label: 'Camera' },
  { key: 'Telescope', label: 'Telescope' },
  { key: 'Mount', label: 'Mount' },
  { key: 'Filter Wheel', label: 'Filter Wheel' },
  { key: 'Focuser', label: 'Focuser' },
  { key: 'Rotator', label: 'Rotator' },
  { key: 'Guider', label: 'Guider' },
  { key: 'Dome', label: 'Dome' },
  { key: 'Flat Panel', label: 'Flat Panel' },
  { key: 'Safety Monitor', label: 'Safety Monitor' },
  { key: 'Weather', label: 'Weather' },
  { key: 'Switch', label: 'Switch' },
];

const patternTokens = [
  '$$DATEMINUS12$$',
  '$$DATE$$',
  '$$DATETIME$$',
  '$$TIME$$',
  '$$DATEUTC$$',
  '$$TIMEUTC$$',
  '$$CAMERA$$',
  '$$TELESCOPE$$',
  '$$SEQUENCETITLE$$',
];

function save(key, value) {
  store.saveSetting(key, value);
}

function getFilterClass(name) {
  if (!store.settings?.FilterClassifications) return 'auto';
  for (const pair of store.settings.FilterClassifications.split(',')) {
    const parts = pair.split('=');
    if (parts.length === 2 && parts[0].trim().toLowerCase() === name.toLowerCase()) {
      const cls = parts[1].trim();
      if (cls === 'B') return 'broadband';
      if (cls === 'N') return 'narrowband';
      if (cls === 'X') return 'exclude';
      return cls;
    }
  }
  return 'auto';
}

function setFilterClass(name, cls) {
  const map = {};
  for (const pair of (store.settings.FilterClassifications || '').split(',')) {
    const parts = pair.split('=');
    if (parts.length === 2 && parts[0].trim()) map[parts[0].trim()] = parts[1].trim();
  }
  if (cls === 'auto') {
    delete map[name];
  } else {
    const code = cls === 'broadband' ? 'B' : cls === 'narrowband' ? 'N' : 'X';
    map[name] = code;
  }
  const encoded = Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  store.saveSetting('FilterClassifications', encoded);
}

function getEquipmentOverride(key) {
  if (!store.settings?.EquipmentOverrides) return '';
  for (const pair of store.settings.EquipmentOverrides.split(',')) {
    const idx = pair.indexOf(':');
    if (idx > 0 && pair.substring(0, idx).trim() === key) return pair.substring(idx + 1).trim();
  }
  return '';
}

function setEquipmentOverride(key, value) {
  const overrides = {};
  for (const pair of (store.settings.EquipmentOverrides || '').split(',')) {
    const idx = pair.indexOf(':');
    if (idx > 0) overrides[pair.substring(0, idx).trim()] = pair.substring(idx + 1).trim();
  }
  if (value) overrides[key] = value;
  else delete overrides[key];
  const encoded = Object.entries(overrides)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  store.saveSetting('EquipmentOverrides', encoded);
}

function isEquipmentVisible(key) {
  return (store.settings?.EquipmentVisibleFields || '')
    .split(',')
    .map((s) => s.trim())
    .includes(key);
}

function toggleEquipmentVisible(key, visible) {
  const current = (store.settings?.EquipmentVisibleFields || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const newFields = visible ? [...new Set([...current, key])] : current.filter((f) => f !== key);
  store.saveSetting('EquipmentVisibleFields', newFields.join(','));
}

function insertToken(token) {
  const current = store.settings?.SaveReportFilePattern ?? '';
  store.saveSetting('SaveReportFilePattern', current + token);
}
</script>
