<template>
  <div class="min-h-screen bg-gray-900">
    <div class="container py-6 px-4 max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-6">{{ $t('nightsummary.title') }}</h1>

      <!-- Plugin not installed -->
      <div
        v-if="store.pluginInstalled === false"
        class="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center"
      >
        <p class="text-gray-400 text-lg">{{ $t('nightsummary.notAvailable') }}</p>
      </div>

      <template v-else-if="store.pluginInstalled === true">
        <!-- Tabs -->
        <div class="flex gap-1 mb-6 border-b border-gray-700">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-t transition',
              activeTab === tab.id
                ? 'bg-gray-800 text-white border border-b-0 border-gray-700'
                : 'text-gray-400 hover:text-white',
            ]"
          >
            {{ $t('nightsummary.' + tab.i18n) }}
          </button>
        </div>

        <!-- Loading state -->
        <div v-if="store.settingsLoading" class="text-gray-400 py-4">
          {{ $t('common.loading') }}
        </div>

        <!-- ─── SETTINGS TAB ─── -->
        <div v-else-if="activeTab === 'settings' && store.settings">
          <!-- Report Content -->
          <section class="mb-8">
            <h2 class="text-lg font-semibold text-white mb-4">
              {{ $t('nightsummary.settings.reportContent') }}
            </h2>
            <div class="space-y-3">
              <!-- Detail Level -->
              <div class="flex items-center gap-4">
                <span class="text-gray-300 w-52 shrink-0">{{
                  $t('nightsummary.settings.detailLevel')
                }}</span>
                <select
                  :value="store.settings.ReportDetailLevel"
                  @change="save('ReportDetailLevel', +$event.target.value)"
                  class="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="0">
                    {{ $t('nightsummary.settings.detailSnapshot') }}
                  </option>
                  <option value="1">
                    {{ $t('nightsummary.settings.detailStandard') }}
                  </option>
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
                  :disabled="
                    store.settings.ReportDetailLevel === 0 || !store.settings.ShowAltitudeChart
                  "
                />
                <CheckRow
                  :label="$t('nightsummary.settings.showMinAltitude')"
                  :value="store.settings.ShowMinAltitude"
                  @update="save('ShowMinAltitude', $event)"
                  :disabled="
                    store.settings.ReportDetailLevel === 0 || !store.settings.ShowAltitudeChart
                  "
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

              <!-- Chart markers (indented, only if metric chart on) -->
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

              <!-- Chart axis (only if metric chart on + Full) -->
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
                  <option value="broadband">
                    {{ $t('nightsummary.settings.filterBroadband') }}
                  </option>
                  <option value="narrowband">
                    {{ $t('nightsummary.settings.filterNarrowband') }}
                  </option>
                  <option value="exclude">
                    {{ $t('nightsummary.settings.filterExclude') }}
                  </option>
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
            <p class="text-gray-400 text-xs mt-2 mb-4">
              {{ $t('nightsummary.settings.equipmentHint') }}
            </p>
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
              <span class="text-gray-300 w-52 shrink-0">{{
                $t('nightsummary.settings.savePath')
              }}</span>
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
                    <span class="text-gray-300 text-sm">{{
                      $t('nightsummary.settings.smtpSsl')
                    }}</span>
                  </label>
                </div>
              </template>

              <div class="flex items-center gap-4">
                <button
                  @click="store.testEmail()"
                  :disabled="store.emailTesting"
                  class="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm rounded transition"
                >
                  {{
                    store.emailTesting
                      ? $t('common.loading')
                      : $t('nightsummary.settings.testEmail')
                  }}
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
                    store.discordTesting
                      ? $t('common.loading')
                      : $t('nightsummary.settings.testDiscord')
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
        <!-- /settings tab -->

        <!-- ─── SESSIONS TAB ─── -->
        <div v-else-if="activeTab === 'sessions'">
          <!-- Session selector -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <select
              v-model="selectedSessionId"
              @change="onSelectSession"
              class="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              :disabled="store.loadingSessions"
            >
              <option value="" disabled>
                {{
                  store.loadingSessions
                    ? $t('common.loading')
                    : $t('nightsummary.sessions.placeholder')
                }}
              </option>
              <option v-for="s in store.sessions" :key="s.SessionId" :value="s.SessionId">
                {{ formatSessionLabel(s) }}
              </option>
            </select>
            <button
              @click="store.fetchSessions()"
              :disabled="store.loadingSessions"
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-lg transition"
            >
              {{ $t('common.refresh') }}
            </button>
          </div>

          <!-- Session actions -->
          <div v-if="selectedSessionId" class="flex gap-3 mb-4">
            <button
              @click="store.fetchSessionDetail(selectedSessionId)"
              :disabled="store.loadingDetail"
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-lg transition"
            >
              {{ store.loadingDetail ? $t('common.loading') : $t('common.refresh') }}
            </button>
            <button
              @click="store.resendSession(selectedSessionId)"
              :disabled="store.resendingSession"
              class="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm rounded-lg transition"
            >
              {{
                store.resendingSession ? $t('common.loading') : $t('nightsummary.sessions.resend')
              }}
            </button>
            <button
              @click="confirmDelete = true"
              class="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition"
            >
              {{ $t('nightsummary.sessions.delete') }}
            </button>
            <StatusBadge
              v-if="store.resendStatus"
              :ok="store.resendStatus.ok"
              :message="store.resendStatus.message"
            />
          </div>

          <!-- Delete confirmation -->
          <div
            v-if="confirmDelete"
            class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          >
            <div class="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
              <h3 class="text-lg font-semibold text-white mb-3">
                {{ $t('nightsummary.sessions.deleteTitle') }}
              </h3>
              <p class="text-gray-300 mb-5 text-sm">
                {{ $t('nightsummary.sessions.deleteConfirm') }}
              </p>
              <div class="flex gap-3">
                <button
                  @click="doDelete"
                  class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition"
                >
                  {{ $t('general.delete') }}
                </button>
                <button
                  @click="confirmDelete = false"
                  class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition"
                >
                  {{ $t('general.cancel') }}
                </button>
              </div>
            </div>
          </div>

          <!-- No session -->
          <div
            v-if="!selectedSessionId"
            class="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center"
          >
            <p class="text-gray-500">{{ $t('nightsummary.sessions.noSessions') }}</p>
          </div>
          <div v-else-if="store.loadingDetail" class="text-gray-400 py-8 text-center">
            {{ $t('common.loading') }}
          </div>

          <!-- Session detail -->
          <div v-else-if="store.sessionDetail" class="space-y-4">
            <!-- ── Header ── -->
            <div class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                <div>
                  <p class="text-gray-400 text-xs mb-0.5">Session Date</p>
                  <p class="text-white font-medium">
                    {{ formatDate(store.sessionDetail.Session.SessionStart) }}
                  </p>
                </div>
                <div>
                  <p class="text-gray-400 text-xs mb-0.5">Start / End</p>
                  <p class="text-white font-medium">
                    {{ formatTime(store.sessionDetail.Session.SessionStart) }} →
                    {{ formatTime(store.sessionDetail.Session.SessionEnd) }}
                  </p>
                </div>
                <div>
                  <p class="text-gray-400 text-xs mb-0.5">Duration</p>
                  <p class="text-white font-medium">{{ sessionDuration }}</p>
                </div>
                <div>
                  <p class="text-gray-400 text-xs mb-0.5">Profile</p>
                  <p class="text-white font-medium truncate">
                    {{ store.sessionDetail.Session.ProfileName || '—' }}
                  </p>
                </div>
              </div>
              <!-- Equipment inline (only if ShowEquipmentProfile enabled) -->
              <div
                v-if="sessionEquipment.length && store.settings?.ShowEquipmentProfile"
                class="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1"
              >
                <div
                  v-for="eq in sessionEquipment"
                  :key="eq.role"
                  class="flex items-baseline gap-2 min-w-0"
                >
                  <span class="text-gray-500 text-xs shrink-0">{{ eq.role }}</span>
                  <span class="text-gray-200 truncate text-xs">{{ eq.name }}</span>
                </div>
              </div>
            </div>

            <!-- ── Event Timeline (detailLevel >= 1, matches report's BuildEventTimelineSection) ── -->
            <div
              v-if="store.sessionDetail.Events?.length && store.settings?.ReportDetailLevel >= 1"
              class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-gray-700">
                <h3 class="text-white font-medium">
                  Events ({{ store.sessionDetail.Events.length }})
                </h3>
              </div>
              <div class="divide-y divide-gray-700/40 max-h-80 overflow-y-auto">
                <div
                  v-for="ev in store.sessionDetail.Events"
                  :key="ev.Id"
                  class="px-4 py-2 flex items-start gap-3 text-sm"
                >
                  <span class="text-gray-500 text-xs shrink-0 mt-0.5 w-11 tabular-nums">{{
                    formatTime(ev.Timestamp)
                  }}</span>
                  <span
                    :class="eventTypeColor(ev.EventType)"
                    class="shrink-0 text-xs font-semibold uppercase tracking-wide w-24"
                    >{{ ev.EventType }}</span
                  >
                  <span class="text-gray-300 flex-1 min-w-0">{{ ev.Description }}</span>
                  <span
                    v-if="ev.AfSucceeded !== null && ev.AfSucceeded !== undefined"
                    :class="ev.AfSucceeded ? 'text-green-400' : 'text-red-400'"
                    class="ml-2 text-xs shrink-0 font-medium"
                  >
                    {{ ev.AfSucceeded ? '✓' : '✗'
                    }}{{ ev.AfHfr ? ' HFR ' + ev.AfHfr.toFixed(2) : '' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- ── Session Overview stats (matches report's BuildOverviewStatsSection) ── -->
            <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-700">
                <h3 class="text-white font-medium">Session Overview</h3>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
                <!-- Total Images — collapsible per-filter breakdown (matches report's stat-breakdown) -->
                <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
                  <details v-if="sessionFilterBreakdown.length" class="group">
                    <summary class="list-none cursor-pointer">
                      <div class="text-2xl font-bold text-cyan-400">
                        {{ store.sessionDetail.Stats.TotalImages }}
                        <span class="text-base text-cyan-600 group-open:hidden">▼</span>
                        <span class="text-base text-cyan-600 hidden group-open:inline">▲</span>
                        <span
                          v-if="store.sessionDetail.Stats.SkippedExposures > 0"
                          class="text-sm text-red-400 font-normal"
                          >(+{{ store.sessionDetail.Stats.SkippedExposures }} aborted)</span
                        >
                      </div>
                      <div class="text-xs text-gray-400 mt-1">Total Images</div>
                    </summary>
                    <div class="mt-2 text-left space-y-0.5 border-t border-gray-700 pt-2">
                      <div
                        v-for="fb in sessionFilterBreakdown"
                        :key="fb.filter"
                        class="flex justify-between text-xs text-gray-400"
                      >
                        <span class="truncate mr-2">{{ fb.filter }}</span>
                        <span class="shrink-0 tabular-nums">{{ fb.count }}</span>
                      </div>
                    </div>
                  </details>
                  <template v-else>
                    <div class="text-2xl font-bold text-cyan-400">
                      {{ store.sessionDetail.Stats.TotalImages }}
                      <span
                        v-if="store.sessionDetail.Stats.SkippedExposures > 0"
                        class="text-sm text-red-400 font-normal"
                        >(+{{ store.sessionDetail.Stats.SkippedExposures }} aborted)</span
                      >
                    </div>
                    <div class="text-xs text-gray-400 mt-1">Total Images</div>
                  </template>
                </div>
                <!-- Total Exposure — collapsible per-filter breakdown (matches report's stat-breakdown) -->
                <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
                  <details v-if="sessionFilterBreakdown.length" class="group">
                    <summary class="list-none cursor-pointer">
                      <div class="text-2xl font-bold text-white">
                        {{ formatDurationH(store.sessionDetail.Stats.TotalExposureSeconds) }}
                        <span class="text-base text-gray-500 group-open:hidden">▼</span>
                        <span class="text-base text-gray-500 hidden group-open:inline">▲</span>
                      </div>
                      <div class="text-xs text-gray-400 mt-1">Total Exposure</div>
                    </summary>
                    <div class="mt-2 text-left space-y-0.5 border-t border-gray-700 pt-2">
                      <div
                        v-for="fb in sessionFilterBreakdown"
                        :key="fb.filter"
                        class="flex justify-between text-xs text-gray-400"
                      >
                        <span class="truncate mr-2">{{ fb.filter }}</span>
                        <span class="shrink-0 tabular-nums">{{ formatDuration(fb.expSec) }}</span>
                      </div>
                    </div>
                  </details>
                  <template v-else>
                    <div class="text-2xl font-bold text-white">
                      {{ formatDurationH(store.sessionDetail.Stats.TotalExposureSeconds) }}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">Total Exposure</div>
                  </template>
                </div>
                <!-- Targets -->
                <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-white">
                    {{ store.sessionDetail.Stats.Targets.length }}
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Targets</div>
                </div>
                <!-- Avg HFR -->
                <div
                  v-if="store.sessionDetail.Stats.AvgHfr > 0"
                  class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                >
                  <div class="text-2xl font-bold text-white">
                    {{ store.sessionDetail.Stats.AvgHfr.toFixed(2) }}px
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Avg HFR</div>
                </div>
                <!-- Avg Guiding -->
                <div
                  v-if="store.sessionDetail.Stats.AvgGuidingRms > 0"
                  class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                >
                  <div class="text-2xl font-bold text-white">
                    {{ store.sessionDetail.Stats.AvgGuidingRms.toFixed(2) }}&quot;
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Avg Guiding RMS</div>
                </div>
                <!-- Avg FWHM -->
                <div
                  v-if="store.sessionDetail.Stats.AvgFwhm > 0"
                  class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                >
                  <div class="text-2xl font-bold text-white">
                    {{ store.sessionDetail.Stats.AvgFwhm.toFixed(2) }}&quot;
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Avg FWHM</div>
                </div>
                <!-- Yield % (detailLevel >= 2) -->
                <div
                  v-if="sessionYield !== null && store.settings?.ReportDetailLevel >= 2"
                  class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                  title="Total exposure ÷ session window (first to last image)."
                >
                  <div class="text-2xl font-bold text-white">{{ sessionYield }}%</div>
                  <div class="text-xs text-gray-400 mt-1">Yield</div>
                </div>
                <!-- Moon illumination (detailLevel >= 2) -->
                <div
                  v-if="sessionMoon && store.settings?.ReportDetailLevel >= 2"
                  class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                >
                  <div class="text-2xl font-bold text-white">
                    {{ sessionMoon.pct }}% {{ sessionMoon.waxing ? '↑' : '↓' }}
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Moon</div>
                </div>
              </div>
            </div>

            <!-- ── Overhead Analysis (detailLevel >= 2 && ShowOverheadBreakdown, matches report's BuildOverheadBreakdownSection) ── -->
            <div
              v-if="
                overheadCategories.length &&
                store.settings?.ReportDetailLevel >= 2 &&
                store.settings?.ShowOverheadBreakdown
              "
              class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-gray-700">
                <h3 class="text-white font-medium">Yield and Imaging Overhead Analysis</h3>
              </div>
              <div class="p-4 space-y-4">
                <!-- Overhead stat boxes (matches report: Total Overhead, Overhead Accounted, Categories/Unaccounted) -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-3">
                    <p class="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Overhead</p>
                    <p class="text-white text-lg font-semibold">
                      {{ formatDuration(overheadStats.mergedOverheadSec) }}
                    </p>
                  </div>
                  <div class="bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-3">
                    <p class="text-gray-400 text-xs uppercase tracking-wide mb-1">
                      Overhead Accounted
                    </p>
                    <p class="text-white text-lg font-semibold">
                      {{
                        overheadStats.impliedOverheadSec > 0
                          ? overheadStats.coveragePct.toFixed(1) + '%'
                          : '—'
                      }}
                    </p>
                  </div>
                  <div class="bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-3">
                    <template v-if="overheadStats.unaccountedSec > 10">
                      <p class="text-gray-400 text-xs uppercase tracking-wide mb-1">Unaccounted</p>
                      <p class="text-white text-lg font-semibold">
                        {{ formatDuration(overheadStats.unaccountedSec) }}
                      </p>
                    </template>
                    <template v-else>
                      <p class="text-gray-400 text-xs uppercase tracking-wide mb-1">Categories</p>
                      <p class="text-white text-lg font-semibold">
                        {{ overheadCategories.length }}
                      </p>
                    </template>
                  </div>
                </div>
                <!-- Stacked color bar per event type -->
                <div class="flex h-4 rounded overflow-hidden" v-if="overheadCategories.length">
                  <div
                    v-for="row in overheadCategories"
                    :key="row.type"
                    :style="{
                      width: row.pct + '%',
                      backgroundColor: OVERHEAD_COLORS[row.type] ?? '#6b7280',
                    }"
                    :title="row.label + ': ' + formatDuration(row.totalSec)"
                  ></div>
                </div>
              </div>
              <div class="overflow-x-auto px-4 pb-4">
                <table class="w-full text-sm border border-gray-700 rounded">
                  <thead>
                    <tr class="text-gray-400 bg-gray-900/50 text-xs uppercase tracking-wide">
                      <th class="text-left px-3 py-2">Category</th>
                      <th class="text-right px-3 py-2">Count</th>
                      <th class="text-right px-3 py-2">Total</th>
                      <th class="text-right px-3 py-2">Avg</th>
                      <th class="text-right px-3 py-2">% of Overhead</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, ri) in overheadCategories"
                      :key="row.type"
                      :class="ri % 2 === 1 ? 'bg-gray-900/30' : ''"
                      class="border-t border-gray-700/50 text-gray-300"
                    >
                      <td class="px-3 py-2 text-gray-200">{{ row.label }}</td>
                      <td class="px-3 py-2 text-right">{{ row.count }}</td>
                      <td class="px-3 py-2 text-right">{{ formatDuration(row.totalSec) }}</td>
                      <td class="px-3 py-2 text-right">{{ row.avgSec.toFixed(1) }}s</td>
                      <td class="px-3 py-2 text-right">{{ row.pct.toFixed(1) }}%</td>
                    </tr>
                  </tbody>
                </table>
                <p class="text-gray-500 text-xs mt-2">
                  Category totals may exceed overall overhead because some operations run
                  concurrently.
                </p>
              </div>
            </div>

            <!-- ── Targets Imaged (matches report's BuildTargetSection) ── -->
            <div
              v-if="targetDetails.length"
              class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-gray-700">
                <h3 class="text-white font-medium">Targets Imaged</h3>
              </div>
              <div class="divide-y divide-gray-700">
                <div v-for="t in targetDetails" :key="t.target" class="px-4 py-4">
                  <!-- Target heading: name + time window + coords (like report's h3) -->
                  <div class="mb-3">
                    <h4 class="text-white font-semibold text-base">{{ t.target || '—' }}</h4>
                    <p class="text-gray-400 text-xs mt-0.5">
                      Start: {{ formatTime(t.firstImage) }} → End: {{ formatTime(t.lastImage) }}
                      <template v-if="t.raStr">
                        &nbsp;·&nbsp; R.A. {{ t.raStr }} &nbsp;·&nbsp; Dec. {{ t.decStr }}</template
                      >
                    </p>
                  </div>

                  <!-- Filter × ExposureDuration table (matches the report exactly) -->
                  <div class="overflow-x-auto mb-3">
                    <table class="w-full text-sm border border-gray-700 rounded">
                      <thead>
                        <tr class="text-gray-400 bg-gray-900/50 text-xs uppercase tracking-wide">
                          <th class="text-left px-3 py-2">Filter</th>
                          <th class="text-right px-3 py-2">Images</th>
                          <th class="text-right px-3 py-2">Exposure</th>
                          <th class="text-right px-3 py-2">Total Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, ri) in t.filterRows"
                          :key="ri"
                          :class="ri % 2 === 1 ? 'bg-gray-900/30' : ''"
                          class="border-t border-gray-700/50 text-gray-300"
                        >
                          <td class="px-3 py-1.5">{{ row.filter || '—' }}</td>
                          <td class="px-3 py-1.5 text-right">{{ row.count }}</td>
                          <td class="px-3 py-1.5 text-right">{{ row.expDur.toFixed(0) }}s</td>
                          <td class="px-3 py-1.5 text-right">{{ formatDuration(row.totalSec) }}</td>
                        </tr>
                        <tr
                          class="border-t border-gray-600 bg-gray-900/50 text-white font-semibold"
                        >
                          <td class="px-3 py-1.5">Total</td>
                          <td class="px-3 py-1.5 text-right">{{ t.totalCount }}</td>
                          <td class="px-3 py-1.5 text-right"></td>
                          <td class="px-3 py-1.5 text-right">{{ formatDuration(t.totalExp) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Star Count CV — requires detailLevel >= 1 && ShowStarCountCV -->
                  <div
                    v-if="
                      (t.starCvBB !== null || t.starCvNB !== null) &&
                      store.settings?.ReportDetailLevel >= 1 &&
                      store.settings?.ShowStarCountCV
                    "
                    class="mb-3 text-sm"
                  >
                    <p class="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">
                      Star Count Consistency (CV)
                    </p>
                    <div class="flex gap-4 text-sm">
                      <span class="text-gray-300"
                        >Broadband:
                        <span class="text-white font-medium">{{
                          t.starCvBB !== null ? t.starCvBB.toFixed(0) + '%' : '—'
                        }}</span></span
                      >
                      <span class="text-gray-300"
                        >Narrowband:
                        <span class="text-white font-medium">{{
                          t.starCvNB !== null ? t.starCvNB.toFixed(0) + '%' : '—'
                        }}</span></span
                      >
                    </div>
                  </div>

                  <!-- Per-target IQ — requires detailLevel >= 1 && ShowPerTargetIQ && multi-target session -->
                  <div
                    v-if="
                      t.iq.rows.length &&
                      store.settings?.ReportDetailLevel >= 1 &&
                      targetDetails.length > 1 &&
                      store.settings?.ShowPerTargetIQ
                    "
                  >
                    <p class="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">
                      Image Quality
                    </p>
                    <div class="border border-gray-700 rounded overflow-hidden text-xs">
                      <div
                        class="grid grid-cols-5 bg-gray-900/50 text-gray-500 uppercase tracking-wide"
                      >
                        <div class="px-3 py-1.5">Metric</div>
                        <div class="px-3 py-1.5 text-right">Min</div>
                        <div class="px-3 py-1.5 text-right">Max</div>
                        <div class="px-3 py-1.5 text-right">Mean</div>
                        <div class="px-3 py-1.5 text-right">CV</div>
                      </div>
                      <template v-for="(row, ri) in t.iq.rows" :key="row.label">
                        <details v-if="row.filterRows?.length" class="border-t border-gray-700/50">
                          <summary
                            :class="ri % 2 === 1 ? 'bg-gray-900/30' : ''"
                            class="grid grid-cols-5 list-none cursor-pointer text-gray-300 hover:bg-gray-700/20"
                          >
                            <div
                              class="px-3 py-1.5 font-medium text-cyan-400 flex items-center gap-1"
                            >
                              {{ row.label }} <span class="opacity-50 text-[10px]">▾</span>
                            </div>
                            <div class="px-3 py-1.5 text-right">{{ row.min }}</div>
                            <div class="px-3 py-1.5 text-right">{{ row.max }}</div>
                            <div class="px-3 py-1.5 text-right">{{ row.mean }}</div>
                            <div class="px-3 py-1.5 text-right">{{ row.cv }}</div>
                          </summary>
                          <div class="bg-gray-900/60 px-4 py-2 border-t border-gray-700/30">
                            <table class="w-full text-xs">
                              <thead>
                                <tr class="text-gray-500 uppercase">
                                  <th class="text-left py-1">Filter</th>
                                  <th class="text-right py-1">Min</th>
                                  <th class="text-right py-1">Max</th>
                                  <th class="text-right py-1">Mean</th>
                                  <th class="text-right py-1">CV</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr
                                  v-for="fr in row.filterRows"
                                  :key="fr.filter"
                                  class="text-gray-400 border-t border-gray-700/20"
                                >
                                  <td class="py-1">
                                    {{ fr.filter }}
                                    <span class="text-gray-600">({{ fr.count }})</span>
                                  </td>
                                  <td class="text-right py-1">{{ fr.min }}</td>
                                  <td class="text-right py-1">{{ fr.max }}</td>
                                  <td class="text-right py-1">{{ fr.mean }}</td>
                                  <td class="text-right py-1">{{ fr.cv }}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </details>
                        <div
                          v-else
                          :class="ri % 2 === 1 ? 'bg-gray-900/30' : ''"
                          class="grid grid-cols-5 border-t border-gray-700/50 text-gray-300"
                        >
                          <div class="px-3 py-1.5 font-medium text-gray-200">{{ row.label }}</div>
                          <div class="px-3 py-1.5 text-right">{{ row.min }}</div>
                          <div class="px-3 py-1.5 text-right">{{ row.max }}</div>
                          <div class="px-3 py-1.5 text-right">{{ row.mean }}</div>
                          <div class="px-3 py-1.5 text-right">{{ row.cv }}</div>
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- Session History (detailLevel >= 2 && ShowSessionHistory) -->
                  <div
                    v-if="
                      store.settings?.ReportDetailLevel >= 2 &&
                      store.settings?.ShowSessionHistory &&
                      (store.sessionDetail?.SessionHistory?.[t.target]?.length ?? 0) > 0
                    "
                    class="mt-3"
                  >
                    <details class="border border-gray-700 rounded overflow-hidden">
                      <summary
                        class="px-3 py-2 bg-gray-900/50 text-gray-400 text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-gray-700/30 list-none flex items-center justify-between"
                      >
                        <span>Session History</span>
                        <span class="text-gray-600"
                          >{{ store.sessionDetail.SessionHistory[t.target].length }} previous
                          session{{
                            store.sessionDetail.SessionHistory[t.target].length === 1 ? '' : 's'
                          }}
                          ▾</span
                        >
                      </summary>
                      <div class="overflow-x-auto">
                        <table class="w-full text-xs">
                          <thead>
                            <tr class="text-gray-500 bg-gray-900/70 uppercase tracking-wide">
                              <th class="text-left px-3 py-2">Date</th>
                              <th class="text-right px-3 py-2">Integration</th>
                              <th class="text-right px-3 py-2">Avg HFR</th>
                              <th class="text-right px-3 py-2">Avg FWHM</th>
                              <th class="text-right px-3 py-2">Avg Guiding RMS</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(h, hi) in store.sessionDetail.SessionHistory[t.target]"
                              :key="hi"
                              :class="hi % 2 === 1 ? 'bg-gray-900/30' : ''"
                              class="border-t border-gray-700/40 text-gray-400"
                            >
                              <td class="px-3 py-1.5 text-gray-300">
                                {{ formatHistoryDate(h.SessionStart) }}
                              </td>
                              <td class="px-3 py-1.5 text-right">
                                {{ formatDurationH(h.IntegrationSeconds) }}
                              </td>
                              <td class="px-3 py-1.5 text-right">
                                {{ h.AvgHFR > 0 ? h.AvgHFR.toFixed(2) + 'px' : '—' }}
                              </td>
                              <td class="px-3 py-1.5 text-right">
                                {{ h.AvgFWHM > 0 ? h.AvgFWHM.toFixed(2) + '"' : '—' }}
                              </td>
                              <td class="px-3 py-1.5 text-right">
                                {{ h.AvgGuidingRMS > 0 ? h.AvgGuidingRMS.toFixed(2) + '"' : '—' }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── Session Image Quality (detailLevel >= 1, matches report's BuildImageQualitySection) ── -->
            <div
              v-if="sessionIQ.length && store.settings?.ReportDetailLevel >= 1"
              class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-gray-700">
                <h3 class="text-white font-medium">Session Image Quality</h3>
              </div>
              <div class="p-4">
                <div class="border border-gray-700 rounded overflow-hidden text-sm">
                  <div
                    class="grid grid-cols-5 bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wide"
                  >
                    <div class="px-3 py-2">Metric</div>
                    <div class="px-3 py-2 text-right">Min</div>
                    <div class="px-3 py-2 text-right">Max</div>
                    <div class="px-3 py-2 text-right">Mean</div>
                    <div class="px-3 py-2 text-right">CV</div>
                  </div>
                  <template v-for="(row, ri) in sessionIQ" :key="row.label">
                    <details v-if="row.filterRows?.length" class="border-t border-gray-700/50">
                      <summary
                        :class="ri % 2 === 1 ? 'bg-gray-900/30' : ''"
                        class="grid grid-cols-5 list-none cursor-pointer text-gray-300 hover:bg-gray-700/20"
                      >
                        <div class="px-3 py-2 font-medium text-cyan-400 flex items-center gap-1">
                          {{ row.label }} <span class="opacity-50 text-xs">▾</span>
                        </div>
                        <div class="px-3 py-2 text-right">{{ row.min }}</div>
                        <div class="px-3 py-2 text-right">{{ row.max }}</div>
                        <div class="px-3 py-2 text-right">{{ row.mean }}</div>
                        <div class="px-3 py-2 text-right">{{ row.cv }}</div>
                      </summary>
                      <div class="bg-gray-900/60 px-4 py-2 border-t border-gray-700/30">
                        <table class="w-full text-xs">
                          <thead>
                            <tr class="text-gray-500 uppercase">
                              <th class="text-left py-1 pr-3">Filter</th>
                              <th class="text-right py-1 px-2">Min</th>
                              <th class="text-right py-1 px-2">Max</th>
                              <th class="text-right py-1 px-2">Mean</th>
                              <th class="text-right py-1 px-2">CV</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="fr in row.filterRows"
                              :key="fr.filter"
                              class="text-gray-400 border-t border-gray-700/20"
                            >
                              <td class="py-1 pr-3">
                                {{ fr.filter }} <span class="text-gray-600">({{ fr.count }})</span>
                              </td>
                              <td class="text-right py-1 px-2">{{ fr.min }}</td>
                              <td class="text-right py-1 px-2">{{ fr.max }}</td>
                              <td class="text-right py-1 px-2">{{ fr.mean }}</td>
                              <td class="text-right py-1 px-2">{{ fr.cv }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </details>
                    <div
                      v-else
                      :class="ri % 2 === 1 ? 'bg-gray-900/30' : ''"
                      class="grid grid-cols-5 border-t border-gray-700/50 text-gray-300"
                    >
                      <div class="px-3 py-2 font-medium text-gray-200">{{ row.label }}</div>
                      <div class="px-3 py-2 text-right">{{ row.min }}</div>
                      <div class="px-3 py-2 text-right">{{ row.max }}</div>
                      <div class="px-3 py-2 text-right">{{ row.mean }}</div>
                      <div class="px-3 py-2 text-right">{{ row.cv }}</div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- ── Metric Chart (detailLevel >= 2 && ShowHFRGraph) ── -->
            <div
              v-if="metricChartSvg"
              class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-gray-700">
                <h3 class="text-white font-medium">{{ chartTitle }}</h3>
              </div>
              <div class="p-4" v-html="metricChartSvg"></div>
            </div>
          </div>
        </div>
        <!-- /sessions tab -->
      </template>
      <div v-else class="text-gray-400 py-8 text-center">{{ $t('common.loading') }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useNightSummaryStore } from '../store/nightsummaryStore';
import CheckRow from '../components/CheckRow.vue';
import TextRow from '../components/TextRow.vue';
import StatusBadge from '../components/StatusBadge.vue';
import ToggleButton from '@/components/helpers/toggleButton.vue';
import FileBrowser from '@/components/helpers/fileBrowser.vue';

const store = useNightSummaryStore();
const activeTab = ref('sessions');
const selectedSessionId = ref('');
const confirmDelete = ref(false);
const showPathBrowser = ref(false);

const tabs = [
  { id: 'sessions', i18n: 'tabSessions' },
  { id: 'settings', i18n: 'tabSettings' },
];

onMounted(async () => {
  await store.initialize();
  // Restore selected session after tab-out/remount and immediately refresh detail
  if (store.selectedSessionId) {
    selectedSessionId.value = store.selectedSessionId;
    if (activeTab.value === 'sessions') {
      store.fetchSessionDetail(selectedSessionId.value);
    }
  }
});

// Auto-refresh session detail whenever the sessions tab is entered
watch(activeTab, (tab) => {
  if (tab === 'sessions' && selectedSessionId.value) {
    store.fetchSessionDetail(selectedSessionId.value);
  }
});

// ── Metrics lists ────────────────────────────────────────────────────────────

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

// ── Equipment ────────────────────────────────────────────────────────────────

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

// ── Filter classifications ───────────────────────────────────────────────────

function getFilterClass(name) {
  if (!store.settings?.FilterClassifications) return 'auto';
  for (const pair of store.settings.FilterClassifications.split(',')) {
    const parts = pair.split('=');
    if (parts.length === 2 && parts[0].trim().toLowerCase() === name.toLowerCase()) {
      const cls = parts[1].trim();
      if (cls === 'B') return 'broadband';
      if (cls === 'N') return 'narrowband';
      if (cls === 'X') return 'exclude';
      // Legacy full-word values stored by old UI
      return cls; // 'broadband', 'narrowband', 'exclude' pass through unchanged
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
    // Always store B/N/X as expected by FilterHelper.cs
    const code = cls === 'broadband' ? 'B' : cls === 'narrowband' ? 'N' : 'X';
    map[name] = code;
  }
  const encoded = Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  store.saveSetting('FilterClassifications', encoded);
}

// ── File pattern tokens ──────────────────────────────────────────────────────

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

function insertToken(token) {
  const current = store.settings?.SaveReportFilePattern ?? '';
  store.saveSetting('SaveReportFilePattern', current + token);
}

// ── Settings helper ──────────────────────────────────────────────────────────

function save(key, value) {
  store.saveSetting(key, value);
}

// ── Sessions helpers ─────────────────────────────────────────────────────────

function onSelectSession() {
  if (selectedSessionId.value) store.selectSession(selectedSessionId.value);
}

async function doDelete() {
  confirmDelete.value = false;
  await store.deleteSession(selectedSessionId.value);
  selectedSessionId.value = '';
}

function formatDuration(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Report-style "X.Xh" format (Total Exposure in stat box)
function formatDurationH(seconds) {
  if (!seconds) return '0m';
  const h = seconds / 3600;
  if (h >= 1) return `${h.toFixed(1)}h`;
  return `${Math.round(seconds / 60)}m`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatSessionLabel(s) {
  if (!s) return '';
  const date = s.SessionDate ? new Date(s.SessionDate).toLocaleDateString() : s.SessionId;
  const label = s.DisplayLabel || s.Title || date;
  return label.length > 80 ? label.substring(0, 80) + '…' : label;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function eventTypeColor(type) {
  switch (type) {
    case 'AutoFocus':
      return 'text-cyan-400';
    case 'MeridianFlip':
      return 'text-purple-400';
    case 'RoofOpen':
      return 'text-green-400';
    case 'RoofClosed':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
}

function avgArr(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function cv(arr) {
  if (arr.length < 2) return null;
  const mean = avgArr(arr);
  if (mean === 0) return null;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return (Math.sqrt(variance) / mean) * 100;
}

function iqStat(arr, unit = '') {
  if (!arr.length) return null;
  const mean = avgArr(arr);
  const cvVal = cv(arr);
  return {
    min: Math.min(...arr).toFixed(2) + unit,
    max: Math.max(...arr).toFixed(2) + unit,
    mean: mean.toFixed(2) + unit,
    cv: cvVal !== null ? cvVal.toFixed(0) + '%' : '—',
  };
}

function buildIqRows(images) {
  const rows = [];
  // Per-filter stats helper (only when > 1 filter)
  const byFilter = (imgs, fieldFn, unit) => {
    const groups = {};
    for (const img of imgs) {
      const f = img.Filter || '(no filter)';
      if (!groups[f]) groups[f] = [];
      const v = fieldFn(img);
      if (v > 0) groups[f].push(v);
    }
    return Object.entries(groups)
      .filter(([, vs]) => vs.length > 0)
      .sort(([a], [b]) => cmpFilters(a, b))
      .map(([filter, vs]) => ({ filter, count: vs.length, ...iqStat(vs, unit) }));
  };
  const hfrImgs = images.filter((i) => i.HFR > 0);
  const fwhmImgs = images.filter((i) => i.FWHM > 0);
  const eccs = images.filter((i) => i.Eccentricity > 0).map((i) => i.Eccentricity);
  const rmss = images.filter((i) => i.GuidingRMSTotal > 0).map((i) => i.GuidingRMSTotal);
  if (hfrImgs.length) {
    const fr = byFilter(hfrImgs, (i) => i.HFR, 'px');
    rows.push({
      label: 'HFR',
      ...iqStat(
        hfrImgs.map((i) => i.HFR),
        'px'
      ),
      filterRows: fr.length > 1 ? fr : [],
    });
  }
  if (fwhmImgs.length) {
    const fr = byFilter(fwhmImgs, (i) => i.FWHM, '"');
    rows.push({
      label: 'FWHM',
      ...iqStat(
        fwhmImgs.map((i) => i.FWHM),
        '"'
      ),
      filterRows: fr.length > 1 ? fr : [],
    });
  }
  if (eccs.length) rows.push({ label: 'Eccentricity', ...iqStat(eccs), filterRows: [] });
  if (rmss.length) rows.push({ label: 'Guiding RMS', ...iqStat(rmss, '"'), filterRows: [] });
  return rows;
}

// Broadband: starts with L/R/G/B (case-insensitive), Narrowband: starts with H/S/O/N
function isBroadband(f) {
  return /^[LRGB]/i.test(f || '');
}
function isNarrowband(f) {
  return /^[HSON]/i.test(f || '');
}

function formatRA(hours) {
  const h = Math.floor(hours);
  const mFrac = (hours - h) * 60;
  const m = Math.floor(mFrac);
  const s = Math.round((mFrac - m) * 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

function formatDec(deg) {
  const sign = deg >= 0 ? '+' : '-';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFrac = (abs - d) * 60;
  const m = Math.floor(mFrac);
  const s = Math.round((mFrac - m) * 60);
  return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}′ ${String(s).padStart(2, '0')}″`;
}

// Sort by filter wheel profile ID (position in store.filterNames), then alphabetical fallback
function cmpFilters(a, b) {
  const ia = store.filterNames.indexOf(a);
  const ib = store.filterNames.indexOf(b);
  if (ia >= 0 && ib >= 0) return ia - ib;
  if (ia >= 0) return -1;
  if (ib >= 0) return 1;
  return (a ?? '').localeCompare(b ?? '');
}

function timingEventLabel(type) {
  const map = {
    CameraDownload: 'Camera Download',
    FilterChange: 'Filter Change',
    TempCompFocus: 'Temp Comp Focus',
    PlateSolve: 'Plate Solve',
    ImageSave: 'Image Save',
    MeridianFlip: 'Meridian Flip',
    DomeSync: 'Dome Sync',
    DomeOps: 'Dome',
    FlatPanel: 'Flat Panel',
    CameraTemp: 'Camera Temp',
    MountOps: 'Mount',
    SafetyWait: 'Safety Wait',
    FocuserMove: 'Focuser Move',
    AbortedExposure: 'Skipped Exposure',
    Guiding: 'Guiding',
    Dither: 'Dither',
    Autofocus: 'Autofocus',
    Centering: 'Centering',
    Slew: 'Slew',
    Rotator: 'Rotator',
  };
  return map[type] ?? type;
}

const sessionDuration = computed(() => {
  const s = store.sessionDetail?.Session;
  if (!s?.SessionStart || !s?.SessionEnd) return '—';
  const sec = (new Date(s.SessionEnd) - new Date(s.SessionStart)) / 1000;
  if (sec <= 0) return '—';
  const h = sec / 3600;
  if (h >= 1) return `${h.toFixed(1)}h`;
  return `${Math.round(sec / 60)}m`;
});

const sessionFilterBreakdown = computed(() => {
  if (!store.sessionDetail?.Images?.length) return [];
  const light = store.sessionDetail.Images.filter((i) => !i.ImageType || i.ImageType === 'LIGHT');
  const map = {};
  for (const img of light) {
    const f = img.Filter || '(no filter)';
    if (!map[f]) map[f] = { filter: f, count: 0, expSec: 0 };
    map[f].count++;
    map[f].expSec += img.ExposureDuration || 0;
  }
  return Object.values(map).sort((a, b) => cmpFilters(a.filter, b.filter));
});

const targetDetails = computed(() => {
  if (!store.sessionDetail?.Images?.length) return [];
  const light = store.sessionDetail.Images.filter((i) => !i.ImageType || i.ImageType === 'LIGHT');
  // Group by target, preserving insertion order (first-image time order)
  const targetMap = new Map();
  for (const img of light) {
    const key = img.TargetName || '';
    if (!targetMap.has(key)) targetMap.set(key, []);
    targetMap.get(key).push(img);
  }
  return [...targetMap.entries()].map(([target, imgs]) => {
    // Sort images by timestamp
    const sorted = [...imgs].sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
    const firstImage = sorted[0]?.Timestamp;
    const lastImage = sorted[sorted.length - 1]?.Timestamp;

    // RA/Dec from first image that has coords
    const coordImg = sorted.find((i) => i.RaHours || i.DecDegrees);
    const raStr = coordImg ? formatRA(coordImg.RaHours) : null;
    const decStr = coordImg ? formatDec(coordImg.DecDegrees) : null;

    // Filter × ExposureDuration grouping (matching report's GroupBy(i => (i.Filter, i.ExposureDuration)))
    const fMap = new Map();
    for (const img of sorted) {
      const key = `${img.Filter ?? ''}|${img.ExposureDuration ?? 0}`;
      if (!fMap.has(key))
        fMap.set(key, { filter: img.Filter ?? '', expDur: img.ExposureDuration ?? 0, count: 0 });
      fMap.get(key).count++;
    }
    const filterRows = [...fMap.values()]
      .sort((a, b) => cmpFilters(a.filter, b.filter) || a.expDur - b.expDur)
      .map((r) => ({ ...r, totalSec: r.count * r.expDur }));

    const totalCount = sorted.length;
    const totalExp = sorted.reduce((s, i) => s + (i.ExposureDuration || 0), 0);

    // IQ rows
    const iq = { rows: buildIqRows(sorted) };

    // Star Count CV broadband / narrowband
    const bbStars = sorted
      .filter((i) => isBroadband(i.Filter) && i.StarCount > 0)
      .map((i) => i.StarCount);
    const nbStars = sorted
      .filter((i) => isNarrowband(i.Filter) && i.StarCount > 0)
      .map((i) => i.StarCount);
    const starCvBB = bbStars.length >= 2 ? cv(bbStars) : null;
    const starCvNB = nbStars.length >= 2 ? cv(nbStars) : null;

    return {
      target,
      firstImage,
      lastImage,
      raStr,
      decStr,
      filterRows,
      totalCount,
      totalExp,
      iq,
      starCvBB,
      starCvNB,
    };
  });
});

const sessionIQ = computed(() => {
  if (!store.sessionDetail?.Images?.length) return [];
  return buildIqRows(
    store.sessionDetail.Images.filter((i) => !i.ImageType || i.ImageType === 'LIGHT')
  );
});

const overheadCategories = computed(() => {
  const te = store.sessionDetail?.TimingEvents;
  if (!te?.length) return [];
  const overhead = te.filter((e) => e.EventType !== 'Exposure' && e.DurationSeconds > 0);
  if (!overhead.length) return [];
  const map = {};
  for (const e of overhead) {
    if (!map[e.EventType]) map[e.EventType] = { type: e.EventType, count: 0, totalSec: 0 };
    map[e.EventType].count++;
    map[e.EventType].totalSec += e.DurationSeconds;
  }
  const rows = Object.values(map)
    .filter((r) => r.totalSec >= 1)
    .sort((a, b) => b.totalSec - a.totalSec);
  const grandTotal = rows.reduce((s, r) => s + r.totalSec, 0);
  return rows.map((r) => ({
    ...r,
    label: timingEventLabel(r.type),
    avgSec: r.totalSec / r.count,
    pct: grandTotal > 0 ? (r.totalSec / grandTotal) * 100 : 0,
  }));
});

const OVERHEAD_COLORS = {
  CameraDownload: '#4a9eff',
  FilterChange: '#f59e0b',
  Dither: '#10b981',
  TempCompFocus: '#8b5cf6',
  Autofocus: '#ef4444',
  PlateSolve: '#06b6d4',
  ImageSave: '#f97316',
  Centering: '#6366f1',
  MeridianFlip: '#14b8a6',
  Slew: '#a855f7',
  DomeSync: '#2dd4bf',
  DomeOps: '#0d9488',
  FlatPanel: '#fbbf24',
  CameraTemp: '#60a5fa',
  MountOps: '#c084fc',
  Guiding: '#34d399',
  SafetyWait: '#f472b6',
  FocuserMove: '#a78bfa',
  Rotator: '#818cf8',
  Switch: '#94a3b8',
  AbortedExposure: '#fb7185',
};

const overheadStats = computed(() => {
  const te = store.sessionDetail?.TimingEvents;
  const images =
    store.sessionDetail?.Images?.filter((i) => !i.ImageType || i.ImageType === 'LIGHT') ?? [];
  const empty = { mergedOverheadSec: 0, impliedOverheadSec: 0, coveragePct: 0, unaccountedSec: 0 };
  if (!te?.length) return empty;
  // Merge overlapping overhead intervals (wall-clock dedup)
  const overhead = te.filter(
    (e) => e.EventType !== 'Exposure' && e.DurationSeconds > 0 && e.StartTime && e.EndTime
  );
  const intervals = overhead
    .map((e) => [new Date(e.StartTime).getTime(), new Date(e.EndTime).getTime()])
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of intervals) {
    if (!merged.length || s > merged[merged.length - 1][1]) merged.push([s, e]);
    else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
  }
  const mergedOverheadSec = merged.reduce((sum, [s, e]) => sum + (e - s) / 1000, 0);
  // Implied overhead: session window minus integration time
  const allEvents = te.filter(
    (e) => e.StartTime && e.EndTime && e.DurationSeconds > 0 && e.EventType !== 'AbortedExposure'
  );
  if (!allEvents.length) return { ...empty, mergedOverheadSec };
  const windowStart = Math.min(...allEvents.map((e) => new Date(e.StartTime).getTime()));
  const windowEnd = Math.max(...allEvents.map((e) => new Date(e.EndTime).getTime()));
  const windowSec = (windowEnd - windowStart) / 1000;
  const totalIntegrationSec = images.reduce((s, i) => s + (i.ExposureDuration || 0), 0);
  const impliedOverheadSec = Math.max(0, windowSec - totalIntegrationSec);
  const coveragePct =
    impliedOverheadSec > 0 ? Math.min((mergedOverheadSec / impliedOverheadSec) * 100, 100) : 0;
  const unaccountedSec = Math.max(0, impliedOverheadSec - mergedOverheadSec);
  return { mergedOverheadSec, impliedOverheadSec, coveragePct, unaccountedSec };
});

function formatHistoryDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const sessionEquipment = computed(() => {
  const s = store.sessionDetail?.Session;
  if (!s) return [];
  // Parse visible fields and overrides from settings (mirrors report's Equipment dict logic)
  const visibleRaw = store.settings?.EquipmentVisibleFields ?? '';
  const visibleFields = visibleRaw
    ? visibleRaw
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)
    : [];
  const overrides = {};
  for (const pair of (store.settings?.EquipmentOverrides || '').split(',')) {
    const idx = pair.indexOf(':');
    if (idx > 0) overrides[pair.substring(0, idx).trim()] = pair.substring(idx + 1).trim();
  }
  return [
    { role: 'Camera', name: overrides['Camera'] || s.CameraName },
    { role: 'Telescope', name: overrides['Telescope'] || s.TelescopeName },
    { role: 'Mount', name: overrides['Mount'] || s.MountName },
    { role: 'Filter Wheel', name: overrides['Filter Wheel'] || s.FilterWheelName },
    { role: 'Focuser', name: overrides['Focuser'] || s.FocuserName },
    { role: 'Rotator', name: overrides['Rotator'] || s.RotatorName },
    { role: 'Guider', name: overrides['Guider'] || s.GuiderName },
    { role: 'Dome', name: overrides['Dome'] || s.DomeName },
    { role: 'Flat Panel', name: overrides['Flat Panel'] || s.FlatDeviceName },
    { role: 'Safety Monitor', name: overrides['Safety Monitor'] || s.SafetyMonitorName },
    { role: 'Weather', name: overrides['Weather'] || s.WeatherName },
    { role: 'Switch', name: overrides['Switch'] || s.SwitchName },
  ]
    .filter((i) => visibleFields.length === 0 || visibleFields.includes(i.role))
    .filter((i) => i.name);
});

// ── Metric chart constants (indices match ChartGenerator.cs) ─────────────────────────────────
const METRIC_FIELDS = [
  'HFR',
  'FWHM',
  'GuidingRMSTotal',
  'FocuserTemp',
  'AmbientTemp',
  'Eccentricity',
  'Altitude',
  'Airmass',
  'Humidity',
  'FocuserPosition',
  'SkyQuality',
  'CloudCover',
  'CameraTemp',
  'DewPoint',
  'WindSpeed',
  'Pressure',
  'StarCount',
  'Azimuth',
  'SeeingFWHM',
  'StatMedian',
];
const METRIC_Y_LABELS = [
  'HFR (px)',
  'FWHM (")',
  'Guiding RMS (")',
  'Focuser Temp (°C)',
  'Ambient Temp (°C)',
  'Eccentricity',
  'Altitude (°)',
  'Airmass',
  'Humidity (%)',
  'Focuser Pos (steps)',
  'Sky Quality',
  'Cloud Cover (%)',
  'Camera Temp (°C)',
  'Dew Point (°C)',
  'Wind Speed (m/s)',
  'Pressure (hPa)',
  'Star Count',
  'Azimuth (°)',
  'Seeing FWHM (")',
  'Median ADU',
];

function niceScale(values) {
  if (!values.length) return { min: 0, max: 1, step: 0.5 };
  const lo = Math.min(...values),
    hi = Math.max(...values);
  const range = hi - lo || 1;
  const rawStep = range / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = Math.ceil(rawStep / mag) * mag || mag;
  return { min: Math.floor(lo / step) * step, max: Math.ceil(hi / step) * step, step };
}

function extractMetricPts(images, idx) {
  const field = METRIC_FIELDS[idx];
  if (!field) return [];
  return images
    .map((i) => ({ t: new Date(i.Timestamp).getTime(), v: i[field] }))
    .filter((p) => p.v != null && !isNaN(p.v) && +p.v > 0)
    .sort((a, b) => a.t - b.t);
}

// ── Moon illumination — same synodic cosine model as ReportGenerator.MoonIllumination ────
function moonIlluminationPct(dateStr) {
  const synodicPeriod = 29.53058868;
  const referenceNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0); // 2000-01-06 18:14 UTC
  let daysSinceNew = (new Date(dateStr).getTime() - referenceNewMoon) / 86400000;
  daysSinceNew = ((daysSinceNew % synodicPeriod) + synodicPeriod) % synodicPeriod;
  const waxing = daysSinceNew < synodicPeriod / 2;
  const phaseAngle = (daysSinceNew / synodicPeriod) * 2 * Math.PI;
  return {
    pct: Math.round(((1 - Math.cos(phaseAngle)) / 2) * 100),
    waxing,
  };
}

const sessionYield = computed(() => {
  // Mirrors YieldCalculator.Calculate: window = firstImage→lastImage (or →now if running)
  const s = store.sessionDetail?.Session;
  const images = store.sessionDetail?.Images?.filter(
    (i) => !i.ImageType || i.ImageType === 'LIGHT'
  );
  const events = store.sessionDetail?.Events ?? [];
  if (!images?.length) return null;
  const timestamps = images.map((i) => new Date(i.Timestamp).getTime()).filter((t) => !isNaN(t));
  if (!timestamps.length) return null;
  const firstMs = Math.min(...timestamps);
  const sessionEndStr = s?.SessionEnd;
  const isRunning = !sessionEndStr || new Date(sessionEndStr).getFullYear() < 2000;
  // Completed: use lastImage timestamp (matches YieldCalculator exactly)
  // Running: extend window to now so yield reflects live progress
  const lastMs = isRunning ? Date.now() : Math.max(...timestamps);
  const windowSec = (lastMs - firstMs) / 1000;
  if (windowSec <= 0) return null;
  // Subtract roof-closed intervals clamped to [firstMs, lastMs]
  const roofEvents = events
    .filter((e) => e.EventType === 'RoofClosed' || e.EventType === 'RoofOpen')
    .sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
  let roofClosedSec = 0;
  let closedAt = null;
  for (const ev of roofEvents) {
    if (ev.EventType === 'RoofClosed') {
      closedAt = new Date(ev.Timestamp).getTime();
    } else if (ev.EventType === 'RoofOpen' && closedAt !== null) {
      const s2 = Math.max(closedAt, firstMs);
      const e = Math.min(new Date(ev.Timestamp).getTime(), lastMs);
      if (e > s2) roofClosedSec += (e - s2) / 1000;
      closedAt = null;
    }
  }
  if (closedAt !== null) {
    const s2 = Math.max(closedAt, firstMs);
    if (lastMs > s2) roofClosedSec += (lastMs - s2) / 1000;
  }
  const effectiveWindowSec = windowSec - roofClosedSec;
  if (effectiveWindowSec <= 0) return null;
  const totalExpSec = images.reduce((sum, i) => sum + (i.ExposureDuration || 0), 0);
  return Math.round(Math.min((totalExpSec / effectiveWindowSec) * 100, 100));
});

const sessionMoon = computed(() => {
  const s = store.sessionDetail?.Session;
  if (!s?.SessionStart) return null;
  return moonIlluminationPct(s.SessionStart);
});

const chartTitle = computed(() => {
  const pri = store.settings?.ChartPrimaryMetric ?? 0;
  const sec = store.settings?.ChartSecondaryMetric ?? 0;
  const priName = (METRIC_Y_LABELS[pri] || 'HFR').split(' ')[0];
  if (sec === 0) return `${priName} vs. Time`;
  const secName = (METRIC_Y_LABELS[sec - 1] || '').split(' ')[0];
  return `${priName} and ${secName} vs. Time`;
});

const metricChartSvg = computed(() => {
  if (!store.settings?.ShowHFRGraph || (store.settings?.ReportDetailLevel ?? 0) < 2) return null;
  const images = store.sessionDetail?.Images?.filter(
    (i) => !i.ImageType || i.ImageType === 'LIGHT'
  );
  if (!images?.length) return null;

  const primaryIdx = store.settings?.ChartPrimaryMetric ?? 0;
  const secIdx = store.settings?.ChartSecondaryMetric ?? 0; // 0 = None
  const secPriIdx = secIdx > 0 ? secIdx - 1 : -1;

  const primaryPts = extractMetricPts(images, primaryIdx);
  const secondaryPts = secPriIdx >= 0 ? extractMetricPts(images, secPriIdx) : [];
  if (primaryPts.length < 2) return null;

  const hasSec = secondaryPts.length >= 2;
  const W = 760,
    H = 260,
    padL = 52,
    padT = 20,
    padB = 40;
  const padR = hasSec ? 60 : 16;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;

  const allT = [...primaryPts, ...secondaryPts].map((p) => p.t);
  const minT = Math.min(...allT),
    maxT = Math.max(...allT);
  const tRange = Math.max(maxT - minT, 1);
  const toXPx = (t) => padL + ((t - minT) / tRange) * plotW;

  const { min: yMin, max: yMax, step: yStep } = niceScale(primaryPts.map((p) => p.v));
  const yRange = yMax - yMin || 1;
  const toYL = (v) => padT + plotH - ((v - yMin) / yRange) * plotH;

  let toYR = null,
    yMinR = 0,
    yMaxR = 1,
    yStepR = 0.5;
  if (hasSec) {
    ({ min: yMinR, max: yMaxR, step: yStepR } = niceScale(secondaryPts.map((p) => p.v)));
    const yRangeR = yMaxR - yMinR || 1;
    toYR = (v) => padT + plotH - ((v - yMinR) / yRangeR) * plotH;
  }

  const fmtV = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
  const fmtTime = (ms) =>
    new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;display:block;">`;
  s += `<rect width="${W}" height="${H}" fill="#111827" rx="6"/>`;

  // Grid + left Y labels
  for (let v = yMin; v <= yMax + yStep * 0.001; v = +(v + yStep).toFixed(10)) {
    const y = toYL(v).toFixed(1);
    s += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#374151" stroke-width="1"/>`;
    s += `<text x="${padL - 4}" y="${(+y + 4).toFixed(1)}" fill="#9ca3af" font-size="10" text-anchor="end">${fmtV(v)}</text>`;
  }
  // Right Y labels
  if (toYR) {
    for (let v = yMinR; v <= yMaxR + yStepR * 0.001; v = +(v + yStepR).toFixed(10)) {
      const y = toYR(v).toFixed(1);
      s += `<text x="${W - padR + 4}" y="${(+y + 4).toFixed(1)}" fill="#f59e0b" font-size="10" text-anchor="start">${fmtV(v)}</text>`;
    }
    s += `<line x1="${W - padR}" y1="${padT}" x2="${W - padR}" y2="${padT + plotH}" stroke="#4b5563" stroke-width="1"/>`;
    const rx = W - 10,
      ry = H / 2;
    s += `<text x="${rx}" y="${ry}" fill="#f59e0b" font-size="10" text-anchor="middle" transform="rotate(90,${rx},${ry})">${METRIC_Y_LABELS[secPriIdx] || ''}</text>`;
  }
  // X axis labels
  for (let i = 0; i <= 5; i++) {
    const xPx = (padL + (i / 5) * plotW).toFixed(1);
    const t = minT + (i / 5) * tRange;
    s += `<line x1="${xPx}" y1="${padT}" x2="${xPx}" y2="${padT + plotH}" stroke="#374151" stroke-width="1"/>`;
    s += `<text x="${xPx}" y="${H - 8}" fill="#9ca3af" font-size="10" text-anchor="middle">${fmtTime(t)}</text>`;
  }
  // Axes
  s += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#4b5563" stroke-width="1"/>`;
  s += `<line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="#4b5563" stroke-width="1"/>`;
  s += `<text x="11" y="${H / 2}" fill="#9ca3af" font-size="10" text-anchor="middle" transform="rotate(-90,11,${H / 2})">${METRIC_Y_LABELS[primaryIdx] || ''}</text>`;

  // Event markers
  const events = store.sessionDetail?.Events || [];
  const addMkr = (color, lbl, ts) => {
    const xPx = toXPx(ts);
    if (xPx < padL || xPx > W - padR) return;
    s += `<line x1="${xPx.toFixed(1)}" y1="${padT}" x2="${xPx.toFixed(1)}" y2="${padT + plotH}" stroke="${color}" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>`;
    s += `<text x="${xPx.toFixed(1)}" y="${padT - 3}" fill="${color}" font-size="8" text-anchor="middle">${lbl}</text>`;
  };
  if (store.settings?.ShowChartAfMarkers)
    events
      .filter((e) => e.EventType === 'AutoFocus')
      .forEach((e) => addMkr('#a78bfa', 'AF', new Date(e.Timestamp).getTime()));
  if (store.settings?.ShowChartFlipMarkers)
    events
      .filter((e) => e.EventType === 'MeridianFlip')
      .forEach((e) => addMkr('#fbbf24', 'MF', new Date(e.Timestamp).getTime()));
  if (store.settings?.ShowChartRoofMarkers)
    events
      .filter((e) => e.EventType === 'RoofOpen' || e.EventType === 'RoofClosed')
      .forEach((e) =>
        addMkr(
          e.EventType === 'RoofOpen' ? '#34d399' : '#f87171',
          'R',
          new Date(e.Timestamp).getTime()
        )
      );

  // Secondary line (dashed, drawn first)
  if (toYR && secondaryPts.length >= 2) {
    const pts2 = secondaryPts
      .map((p) => `${toXPx(p.t).toFixed(1)},${toYR(p.v).toFixed(1)}`)
      .join(' ');
    s += `<polyline points="${pts2}" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3"/>`;
    secondaryPts.forEach((p) => {
      s += `<circle cx="${toXPx(p.t).toFixed(1)}" cy="${toYR(p.v).toFixed(1)}" r="2.5" fill="#fcd34d"><title>${fmtTime(p.t)} — ${p.v.toFixed(2)}</title></circle>`;
    });
  }
  // Primary line
  const pts1 = primaryPts.map((p) => `${toXPx(p.t).toFixed(1)},${toYL(p.v).toFixed(1)}`).join(' ');
  s += `<polyline points="${pts1}" fill="none" stroke="#7eb8f7" stroke-width="1.5"/>`;
  primaryPts.forEach((p) => {
    s += `<circle cx="${toXPx(p.t).toFixed(1)}" cy="${toYL(p.v).toFixed(1)}" r="3" fill="#a8d4ff"><title>${fmtTime(p.t)} — ${p.v.toFixed(2)}</title></circle>`;
  });

  s += `</svg>`;
  return s;
});
</script>
