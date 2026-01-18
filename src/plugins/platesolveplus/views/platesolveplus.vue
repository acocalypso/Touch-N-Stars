<template>
  <div class="container py-10">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white">PlateSolvePlus</h2>
          <p class="text-gray-400 text-sm mt-1">
            {{ t('plugins.platesolveplus.subtitle') }}
          </p>
        </div>

        <div class="text-xs text-gray-400">
          <div class="flex items-center gap-2 justify-end">
            <span class="inline-flex items-center gap-2">
              <span
                class="w-2 h-2 rounded-full"
                :class="wsConnected ? 'bg-green-500' : 'bg-gray-600'"
              ></span>
              WS {{ wsConnected ? 'connected' : 'disconnected' }}
            </span>
            <span class="text-gray-600">|</span>
            <span class="font-mono">{{ baseUrl }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div
        class="border border-gray-700 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg"
      >
        <div class="flex border-b border-gray-700">
          <button
            class="px-4 py-3 text-sm font-semibold"
            :class="
              activeTab === 'control'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            "
            @click="activeTab = 'control'"
          >
            Control
          </button>

          <button
            class="px-4 py-3 text-sm font-semibold"
            :class="
              activeTab === 'config'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            "
            @click="activeTab = 'config'"
          >
            Config
          </button>
        </div>

        <!-- CONTROL TAB -->
        <div v-show="activeTab === 'control'" class="p-5 space-y-5">
          <!-- 2-column layout -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- RIGHT COLUMN: Status + Image Preview -->
            <div class="space-y-4">
              <!-- Status -->
              <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
                <div class="flex items-center justify-between">
                  <h3 class="text-white font-semibold">Status</h3>
                  <button
                    class="text-xs px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-white/10"
                    @click="refreshStatus"
                    :disabled="loadingStatus"
                  >
                    {{ loadingStatus ? 'Refreshing…' : 'Refresh' }}
                  </button>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <!-- green=true / red=false (Busy is inverted) -->
                  <StatusIcon label="Busy" :value="status.busy === false" />
                  <StatusIcon label="Service Ready" :value="!!status.importsReady" />
                  <StatusIcon label="Mount connected" :value="!!status.mountConnected" />
                  <StatusIcon label="Camera connected" :value="!!secondary.connected" />
                </div>

                <div class="mt-3 text-xs text-gray-400 space-y-1">
                  <div>
                    Last update:
                    <span class="text-gray-200">
                      {{ lastStatusTs ? new Date(lastStatusTs).toLocaleString() : '—' }}
                    </span>
                  </div>

                  <div>
                    <span class="text-gray-400">Task Status: </span>
                    <span class="text-gray-200">{{ status.statusText ?? '—' }}</span>
                  </div>

                  <div>
                    <span class="text-gray-400">used Parameters: </span>
                    <span class="text-gray-300">{{ status.detailsText ?? '—' }}</span>
                  </div>

                  <div
                    v-if="status.lastGuiderSolveText || status.correctedSolveText"
                    class="pt-2 border-t border-gray-700"
                  >
                    <div class="text-gray-400">Validation:</div>
                    <div class="mt-1 space-y-2">
                      <div v-if="status.lastGuiderSolveText">
                        <div class="text-gray-500 text-[11px]">Raw solve (guider camera)</div>
                        <pre
                          class="text-xs text-gray-200 bg-black/30 border border-gray-700 rounded-md p-2 overflow-auto max-h-28"
                          >{{ status.lastGuiderSolveText }}</pre
                        >
                      </div>
                      <div v-if="status.correctedSolveText">
                        <div class="text-gray-500 text-[11px]">
                          Corrected coordinates (with offset)
                        </div>
                        <pre
                          class="text-xs text-gray-200 bg-black/30 border border-gray-700 rounded-md p-2 overflow-auto max-h-28"
                          >{{ status.correctedSolveText }}</pre
                        >
                      </div>
                    </div>
                  </div>

                  <div v-if="status.lastSolveSummary" class="pt-2 border-t border-gray-700">
                    <div class="text-gray-400">lastSolveSummary:</div>
                    <pre
                      class="text-xs text-gray-200 bg-black/30 border border-gray-700 rounded-md p-2 overflow-auto max-h-40"
                      >{{ status.lastSolveSummary }}</pre
                    >
                  </div>
                </div>
              </div>

              <!-- Preview -->
              <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
                <div class="flex items-center justify-between">
                  <h3 class="text-white font-semibold">
                    {{ t('plugins.platesolveplus.preview.preview_title') }}
                  </h3>
                  <div class="flex items-center gap-2">
                    <label class="text-xs text-gray-300 inline-flex items-center gap-2 select-none">
                      <input type="checkbox" v-model="autoPreview" class="rounded" />
                      Auto refresh
                    </label>
                    <button
                      class="px-3 py-1.5 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
                      @click="refreshPreview(true)"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div class="mt-3">
                  <!-- Keep the error text (optional, nice for debugging) -->
                  <div
                    v-if="previewError"
                    class="text-xs text-red-300 border border-red-700/60 bg-red-900/20 rounded-md p-2 mb-2"
                  >
                    {{ previewError }}
                  </div>

                  <!-- Preview container with overlay -->
                  <div class="mt-2 border border-gray-700 rounded-md overflow-hidden bg-black/30">
                    <div class="relative w-full">
                      <!-- Image -->
                      <img
                        v-if="previewUrl && !previewError"
                        :src="previewUrl"
                        alt="Latest preview"
                        class="w-full object-contain"
                        @error="onPreviewError"
                        @load="onPreviewLoad"
                      />

                      <!-- Overlay when missing/failed -->
                      <div
                        v-if="!previewUrl || !previewLoaded || !!previewError"
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <div
                          class="px-4 py-3 rounded-lg border border-gray-600 bg-black/50 text-gray-200 text-sm"
                        >
                          <div class="font-semibold">Preview unavailable</div>
                          <div class="text-xs text-gray-400 mt-1">
                            {{
                              previewError
                                ? 'Load error — please refresh.'
                                : 'No preview loaded yet.'
                            }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-2 text-xs text-gray-500">
                    Cache-busting enabled (<code>?t=</code>). Server also sends
                    <code>Cache-Control: no-store</code>.
                  </div>
                </div>
              </div>
            </div>

            <!-- LEFT COLUMN: Actions + Camera Auswahl + Offset + Last result -->
            <div class="space-y-4">
              <!-- Actions -->
              <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
                <h3 class="text-white font-semibold">Actions</h3>

                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    :class="btnSolidClass(canCapture)"
                    @click="triggerCapture()"
                    :disabled="!canCapture"
                    title="POST /capture"
                  >
                    Capture
                  </button>

                  <button
                    :class="btnSolidClass(canSolveSync)"
                    @click="triggerSync()"
                    :disabled="!canSolveSync"
                    title="POST /sync"
                  >
                    Solve + Sync
                  </button>

                  <button
                    :class="btnSolidClass(canCenterSolve)"
                    @click="triggerCenter()"
                    :disabled="!canCenterSolve"
                    title="POST /center"
                  >
                    Center + Solve
                  </button>
                </div>

                <div class="mt-3 text-xs text-gray-400 space-y-1">
                  <div>
                    <span class="text-gray-500">Capture:</span> platesolve only (validation), no
                    sync/slew.
                  </div>
                  <div>
                    <span class="text-gray-500">Solve + Sync:</span> platesolve and sync the mount
                    (requires mount connected).
                  </div>
                  <div>
                    <span class="text-gray-500">Center + Solve:</span> platesolve and center the
                    target (requires mount connected + a calibrated offset).
                  </div>
                </div>

                <!-- Progress (synthetic) -->
                <div class="mt-4 border border-gray-700 rounded-lg p-3 bg-black/20">
                  <div class="flex items-center justify-between">
                    <div class="text-white text-sm font-semibold">Solve Progress</div>
                    <div class="text-xs text-gray-400">
                      Job: <span class="text-gray-200">{{ activeJobId ?? '—' }}</span>
                    </div>
                  </div>

                  <!-- Phase pills (more readable than raw stage text) -->
                  <div class="mt-2">
                    <div class="flex items-center gap-2 text-xs text-gray-300">
                      <span class="text-gray-400">Action:</span>
                      <span class="font-semibold text-gray-100">{{ progress.action ?? '—' }}</span>
                    </div>

                    <div v-if="progress.action" class="mt-2 flex flex-wrap gap-2">
                      <span v-for="p in progressPills" :key="p.key" :class="pillClass(p.stage)">
                        {{ p.label }}
                      </span>
                    </div>
                  </div>

                  <div class="mt-2 text-xs text-gray-300">
                    <div><span class="text-gray-400">Stage:</span> {{ progress.stage ?? '—' }}</div>
                    <div class="mt-1">
                      <span class="text-gray-400">Message:</span> {{ progress.message ?? '—' }}
                    </div>
                  </div>

                  <div class="mt-3 h-2 w-full bg-gray-700 rounded">
                    <div
                      class="h-2 bg-white rounded"
                      :style="{ width: progress.percent + '%' }"
                    ></div>
                  </div>
                  <div class="mt-1 text-xs text-gray-400">{{ progress.percent }}%</div>

                  <div class="mt-2 text-[11px] text-gray-500">Process progress.</div>
                </div>
              </div>

              <!-- Camera Auswahl (Secondary Camera) -->
              <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-white font-semibold">Secondary Camera (ASCOM)</h3>
                    <div class="mt-1 text-xs text-gray-400">
                      Status:
                      <span
                        class="font-semibold"
                        :class="secondary.connected ? 'text-green-300' : 'text-gray-300'"
                      >
                        {{ secondary.connected ? 'Connected' : 'Disconnected' }}
                      </span>
                    </div>
                  </div>

                  <!-- Buttons oben -->
                  <div class="flex flex-wrap gap-2 justify-end">
                    <button
                      class="px-3 py-1.5 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40 text-sm"
                      @click="refreshSecondaryDrivers"
                      :disabled="secondary.loading"
                      title="GET /secondary/drivers"
                    >
                      Refresh
                    </button>

                    <button
                      class="px-3 py-1.5 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40 text-sm"
                      @click="() => syncSecondaryState(true)"
                      :disabled="secondary.loading"
                      title="GET /secondary/selection"
                    >
                      Sync
                    </button>
                    <button
                      class="px-3 py-1.5 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40 text-sm"
                      @click="showSecondarySetup = true"
                      :disabled="secondary.loading"
                      title="Open Secondary Setup"
                    >
                      Setup…
                    </button>
                  </div>
                </div>

                <!-- Selection moved to Setup dialog: show current camera here -->
                <div class="mt-3">
                  <div class="text-xs text-gray-400">Current camera</div>

                  <div class="mt-2 flex items-center gap-2 flex-wrap">
                    <span
                      class="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-700 bg-black/30"
                      title="Current secondary camera selection"
                    >
                      <span
                        class="w-2 h-2 rounded-full"
                        :class="secondary.connected ? 'bg-green-500' : 'bg-gray-600'"
                      ></span>
                      <span class="text-gray-100">
                        {{
                          secondary.selection?.name ||
                          secondary.activeProgId ||
                          secondary.selectedProgId ||
                          '—'
                        }}
                      </span>
                      <span
                        v-if="
                          secondary.selection?.progId &&
                          secondary.selection?.name &&
                          secondary.selection.name !== secondary.selection.progId
                        "
                        class="text-gray-500 font-mono"
                      >
                        ({{ secondary.selection.progId }})
                      </span>
                    </span>

                    <span class="text-xs text-gray-500" v-if="!secondary.connected">
                      Not connected
                    </span>
                  </div>
                </div>

                <!-- Bottom buttons removed: moved into Setup dialog -->

                <div v-if="secondary.error" class="mt-3 text-xs text-red-300 whitespace-pre-wrap">
                  {{ secondary.error }}
                </div>
              </div>

              <!-- Offset -->
              <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
                <h3 class="text-white font-semibold">Offset</h3>

                <div class="mt-3 text-sm text-gray-300 space-y-1">
                  <div>
                    <span class="text-gray-400">offsetEnabled:</span>
                    <span class="text-gray-100 font-mono">
                      {{ status.offsetEnabled ? 'true' : 'false' }}
                    </span>
                  </div>

                  <div>
                    <span class="text-gray-400">offsetMode:</span>
                    <span class="text-gray-100 font-mono">{{ status.offsetMode ?? '—' }}</span>
                  </div>

                  <div>
                    <span class="text-gray-400">ΔRA (arcsec):</span>
                    <span class="text-gray-100 font-mono">{{ status.offsetRaArcsec ?? '—' }}</span>
                  </div>

                  <div>
                    <span class="text-gray-400">ΔDec (arcsec):</span>
                    <span class="text-gray-100 font-mono">{{ status.offsetDecArcsec ?? '—' }}</span>
                  </div>

                  <div>
                    <span class="text-gray-400">rotation (quat):</span>
                    <span class="text-gray-100 font-mono">
                      {{ status.rotation ? pretty(status.rotation) : '—' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Settings (replaces Last result / status payload) -->
              <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
                <div class="text-white font-semibold">Current Settings</div>
                <div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <!-- Camera settings -->
                  <div class="border border-gray-700 rounded-md p-3 bg-black/20">
                    <div class="text-xs text-gray-400 font-semibold">Camera</div>
                    <div class="mt-2 text-xs text-gray-300 space-y-1">
                      <div>
                        <span class="text-gray-500">Exposure:</span>
                        <span class="text-gray-200 font-mono">
                          {{
                            cameraSettings.exposureSeconds != null
                              ? `${cameraSettings.exposureSeconds}s`
                              : '—'
                          }}
                        </span>
                      </div>
                      <div>
                        <span class="text-gray-500">Gain:</span>
                        <span class="text-gray-200 font-mono">
                          {{
                            cameraSettings.gain == null
                              ? '—'
                              : Number(cameraSettings.gain) < 0
                                ? 'auto'
                                : cameraSettings.gain
                          }}
                        </span>
                      </div>
                      <div>
                        <span class="text-gray-500">Binning:</span>
                        <span class="text-gray-200 font-mono">
                          {{ cameraSettings.binning ?? '—' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Scope / mount settings -->
                  <div class="border border-gray-700 rounded-md p-3 bg-black/20">
                    <div class="text-xs text-gray-400 font-semibold">Scope</div>
                    <div class="mt-2 text-xs text-gray-300 space-y-1">
                      <div>
                        <span class="text-gray-500">Focal Length:</span>
                        <span class="text-gray-200 font-mono">
                          {{
                            scopeFocalLength != null
                              ? `${Number(scopeFocalLength).toFixed(0)} mm`
                              : '—'
                          }}
                        </span>
                      </div>
                      <div>
                        <span class="text-gray-500">Focal Scale:</span>
                        <span class="text-gray-200 font-mono">
                          {{
                            scopeFocalScale != null
                              ? `${Number(scopeFocalScale).toFixed(2)} ″/px`
                              : '—'
                          }}
                        </span>
                      </div>
                      <div>
                        <span class="text-gray-500">Pixel Size:</span>
                        <span class="text-gray-200 font-mono">
                          {{
                            scopePixelSize != null ? `${Number(scopePixelSize).toFixed(2)} µm` : '—'
                          }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Platesolve settings -->
                  <div class="border border-gray-700 rounded-md p-3 bg-black/20">
                    <div class="text-xs text-gray-400 font-semibold">Platesolve</div>
                    <div class="mt-2 text-xs text-gray-300 space-y-1">
                      <div>
                        <span class="text-gray-500">Search Radius:</span>
                        <span class="text-gray-200 font-mono">
                          {{ psSearchRadius != null ? `${psSearchRadius}` : '—' }}
                        </span>
                      </div>
                      <div>
                        <span class="text-gray-500">Downsample:</span>
                        <span class="text-gray-200 font-mono">{{ psDownsample ?? '—' }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500">Timeout (sec):</span>
                        <span class="text-gray-200 font-mono">{{ psTimeoutSec ?? '—' }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500">Threshold:</span>
                        <span class="text-gray-200 font-mono">{{ psThreshold ?? '—' }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500">Max attempts:</span>
                        <span class="text-gray-200 font-mono">{{ psMaxAttempts ?? '—' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-3 text-[11px] text-gray-500">
                  These values come from the backend settings endpoint.
                </div>
              </div>
            </div>
          </div>

          <!-- Event log (full width) -->
          <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
            <div class="flex items-center justify-between">
              <h3 class="text-white font-semibold">Event Log</h3>
              <button
                class="text-xs px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-white/10"
                @click="log = []"
              >
                Clear
              </button>
            </div>

            <div class="mt-3 text-xs font-mono text-gray-200 space-y-1 max-h-56 overflow-auto">
              <div v-if="log.length === 0" class="text-gray-500">—</div>
              <div v-for="(line, idx) in log" :key="idx" class="whitespace-pre-wrap">
                {{ line }}
              </div>
            </div>
          </div>
        </div>

        <!-- CONFIG TAB -->
        <div v-show="activeTab === 'config'" class="p-5 space-y-5">
          <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
            <h3 class="text-white font-semibold">Connection</h3>

            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-400">Host</label>
                <input
                  v-model.trim="cfg.host"
                  class="mt-1 w-full px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-gray-100"
                  placeholder="127.0.0.1"
                />
              </div>

              <div>
                <label class="text-xs text-gray-400">Port</label>
                <input
                  v-model.number="cfg.port"
                  type="number"
                  min="1"
                  max="65535"
                  class="mt-1 w-full px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-gray-100"
                  placeholder="1899"
                />
              </div>

              <div class="md:col-span-2">
                <label class="text-xs text-gray-400">Base Path</label>
                <input
                  v-model.trim="cfg.basePath"
                  class="mt-1 w-full px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-gray-100"
                  placeholder="/api/platesolveplus"
                />
                <div class="mt-1 text-xs text-gray-500">
                  Default: <code>/api/platesolveplus</code>
                </div>
              </div>
            </div>

            <div class="mt-4 border-t border-gray-700 pt-4">
              <label class="text-xs text-gray-300 inline-flex items-center gap-2 select-none">
                <input type="checkbox" v-model="cfg.useToken" class="rounded" />
                Use token (optional)
              </label>

              <div class="mt-3">
                <label class="text-xs text-gray-400">Token</label>
                <input
                  v-model="cfg.token"
                  :disabled="!cfg.useToken"
                  class="mt-1 w-full px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-gray-100 disabled:opacity-40"
                  placeholder="token…"
                />
                <div class="mt-1 text-xs text-gray-500">
                  Sent as header <code>X-PSP-Token</code> (matches the PlateSolvePlus API host).
                </div>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <button
                class="px-4 py-2 rounded-md bg-white text-black font-semibold hover:bg-gray-200"
                @click="saveConfig"
              >
                Save Config
              </button>
              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
                @click="loadConfig"
              >
                Reload from Storage
              </button>
              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
                @click="testConnection"
              >
                Test Connection
              </button>
            </div>

            <div
              v-if="testResult"
              class="mt-4 text-xs border rounded-md p-3"
              :class="
                testResult.ok
                  ? 'border-green-700/60 bg-green-900/20 text-green-200'
                  : 'border-red-700/60 bg-red-900/20 text-red-200'
              "
            >
              {{ testResult.message }}
            </div>

            <div class="mt-3 text-xs text-gray-500">
              Active URL: <span class="text-gray-200 font-mono">{{ baseUrl }}</span>
            </div>
          </div>

          <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
            <h3 class="text-white font-semibold">WebSocket</h3>
            <div class="mt-2 text-xs text-gray-400">
              Endpoint: <span class="text-gray-200 font-mono">{{ wsUrl }}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
                @click="connectWs(true)"
              >
                Reconnect WS
              </button>
              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
                @click="disconnectWs"
              >
                Disconnect WS
              </button>
            </div>
            <div class="mt-3 text-xs text-gray-500">Auto-reconnect enabled (backoff).</div>
          </div>

          <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
            <h3 class="text-white font-semibold">Offsets</h3>

            <div class="mt-2 text-xs text-gray-400">
              Calibrate creates/updates the guider-to-main offset model. Reset clears all offsets.
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                :class="btnSolidClass(canResetOffsets)"
                @click="resetOffsets()"
                :disabled="!canResetOffsets"
                title="POST /offset/reset"
              >
                Reset Offsets
              </button>

              <button
                :class="btnOutlineClass(canCalibrateOffset)"
                @click="calibrateOffset()"
                :disabled="!canCalibrateOffset"
                title="POST /offset/calibrate"
              >
                Calibrate Offsets
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 text-xs text-gray-600">
        REST:
        <span class="text-gray-300 font-mono">GET /status</span>,
        <span class="text-gray-300 font-mono">POST /capture</span>,
        <span class="text-gray-300 font-mono">POST /sync</span>,
        <span class="text-gray-300 font-mono">POST /center</span>,
        <span class="text-gray-300 font-mono">POST /offset/calibrate</span>,
        <span class="text-gray-300 font-mono">POST /offset/reset</span>,
        <span class="text-gray-300 font-mono">GET /preview/latest.jpg</span>
      </div>
    </div>
  </div>
  <SecondarySetupDialog
    v-if="showSecondarySetup"
    :secondary="secondary"
    :status="status"
    :on-refresh-drivers="() => refreshSecondaryDrivers(true)"
    :on-sync-state="() => syncSecondaryState(true)"
    :on-apply-selection="applySecondarySelection"
    :on-connect="connectSecondary"
    :on-disconnect="disconnectSecondary"
    :on-open-native-setup="openSecondarySetupDialog"
    @close="showSecondarySetup = false"
  />
</template>

<script setup>
import {
  ref,
  reactive,
  onBeforeUnmount,
  computed,
  watch,
  onMounted,
  onUnmounted,
  onActivated,
  onDeactivated,
} from 'vue';
import { useI18n } from 'vue-i18n';
import StatusIcon from '../components/StatusIcon.vue';
import SecondarySetupDialog from '../components/platesolveplus/SecondarySetupDialog.vue';
import { usePspConfig } from '../components/platesolveplus/usePspConfig';
import { usePspApi } from '../components/platesolveplus/usePspApi';
import { usePspWebSocket } from '../components/platesolveplus/usePspWebSocket';
import { useSettingsStore } from '@/store/settingsStore';

const activeTab = ref('control');
const disposed = ref(false);
const settingsStore = useSettingsStore();

// =========================
// State
// =========================
const { t } = useI18n();
const status = reactive({
  busy: false,
  importsReady: false,
  mountConnected: false,
  mountState: null,
  secondaryConnected: false,

  statusText: null,
  detailsText: null,
  lastSolveSummary: null,
  lastGuiderSolveText: null,
  correctedSolveText: null,

  offsetEnabled: false,
  offsetMode: null,
  offsetRaArcsec: null,
  offsetDecArcsec: null,
  rotation: null,
});

// Dedicated backend settings endpoint (/api/platesolveplus/settings)
const settings = reactive({
  camera: null,
  scope: null,
  platesolve: null,
});

const loadingSettings = ref(false);
const lastSettingsTs = ref(null);

const cameraSettings = computed(() => settings.camera || {});
const scopeSettings = computed(() => settings.scope || {});
const platesolveSettings = computed(() => settings.platesolve || {});

// -------------------------
// Settings helpers (robust against backend key changes)
// -------------------------
function pickFirst(obj, keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
  }
  return undefined;
}

function pickNumber(obj, keys) {
  const v = pickFirst(obj, keys);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// NOTE: In the current backend payload, focal length + pixel size live under `camera`.
// We still keep fallbacks to `scope` for forward compatibility.
const scopeFocalLength = computed(() => {
  const fromCamera = pickNumber(cameraSettings.value, ['focalLengthMm', 'focalLength']);
  if (fromCamera != null) return fromCamera;
  return pickNumber(scopeSettings.value, [
    'focalLengthMm',
    'focalLength',
    'focal_length',
    'focalLengthMM',
  ]);
});

const scopePixelSize = computed(() => {
  const fromCamera = pickNumber(cameraSettings.value, ['pixelSizeUm', 'pixelSize']);
  if (fromCamera != null) return fromCamera;
  return pickNumber(scopeSettings.value, [
    'pixelSizeUm',
    'pixelSize',
    'pixelSizeMicrons',
    'pixelSizeMicron',
    'pixelSizeUM',
  ]);
});

// Prefer backend-provided scale, otherwise compute: 206.265 * (pixelSizeUm / focalLengthMm)
const scopeFocalScale = computed(() => {
  const provided = pickNumber(scopeSettings.value, [
    'focalScale',
    'pixelScale',
    'arcsecPerPixel',
    'focalScaleArcsecPerPixel',
    'focalScaleArcsecPerPx',
  ]);
  if (provided != null) return provided;

  const fl = scopeFocalLength.value;
  const px = scopePixelSize.value;
  if (!fl || !px) return null;
  const scale = (206.265 * px) / fl;
  return Number.isFinite(scale) ? scale : null;
});

const psDownsample = computed(() =>
  pickFirst(platesolveSettings.value, ['downsample', 'downsampleFactor', 'downsamplePx'])
);

const psTimeoutSec = computed(() =>
  pickFirst(platesolveSettings.value, [
    'timeoutSec',
    'timeoutSeconds',
    'timeout',
    'solveTimeoutSec',
  ])
);

const psThreshold = computed(() => {
  const ps = platesolveSettings.value;
  const arcmin = pickNumber(ps, ['centeringThresholdArcmin', 'thresholdArcmin', 'thresholdArcMin']);
  if (arcmin != null) return `${arcmin} arcmin`;
  const raw = pickFirst(ps, ['threshold', 'starThreshold', 'solveThreshold']);
  return raw == null ? null : String(raw);
});

const psMaxAttempts = computed(() =>
  pickFirst(platesolveSettings.value, [
    'maxAttempts',
    'centeringMaxAttempts',
    'maxSolveAttempts',
    'attempts',
  ])
);

// returns formatted string with unit if we can infer one
const psSearchRadius = computed(() => {
  const ps = platesolveSettings.value;
  const arcmin = pickNumber(ps, [
    'searchRadiusArcmin',
    'searchRadiusArcMin',
    'searchRadiusMinutes',
  ]);
  if (arcmin != null) return `${arcmin} arcmin`;

  const deg = pickNumber(ps, ['searchRadiusDeg', 'searchRadiusDegrees']);
  if (deg != null) return `${deg}°`;

  const raw = pickFirst(ps, ['searchRadius', 'radius', 'solveSearchRadius']);
  if (raw == null) return null;
  // don't guess unit too hard; just show the value
  return String(raw);
});

const loadingStatus = ref(false);
const lastStatusTs = ref(null);

const activeJobId = ref(null);
const progress = reactive({ action: null, stage: null, message: null, percent: 0 });

const previewUrl = ref('');
const previewError = ref('');
const autoPreview = ref(true);
const lastSecondarySig = ref('');
const showSecondarySetup = ref(false);

let statusInterval = null;
let previewInterval = null; // nur wenn du wirklich eins hast
let ws = null; // falls du ws-variable außerhalb hast

let log = ref([]);
const testResult = ref(null);

const secondary = reactive({
  drivers: [],
  selectedProgId: '',
  activeProgId: '',
  selection: null,
  connected: false,
  loading: false,
  error: '',
});
const LS_SELECTED = 'psp.secondary.selectedProgId';
secondary.selectedProgId = localStorage.getItem(LS_SELECTED) ?? '';

// =========================
// UI Gates
// =========================
const EPS = 1e-6;

const hasOffsetSet = computed(() => {
  const ra = Number(status.offsetRaArcsec ?? 0);
  const dec = Number(status.offsetDecArcsec ?? 0);
  const hasDelta = Math.abs(ra) > EPS || Math.abs(dec) > EPS;

  const r = status.rotation;
  const qw = Number(r?.qw ?? 1);
  const qx = Number(r?.qx ?? 0);
  const qy = Number(r?.qy ?? 0);
  const qz = Number(r?.qz ?? 0);
  const hasRot =
    Math.abs(qw - 1) > EPS || Math.abs(qx) > EPS || Math.abs(qy) > EPS || Math.abs(qz) > EPS;

  return hasDelta || hasRot;
});

const canCapture = computed(
  () => !!status.importsReady && !!secondary.connected && status.busy === false
);
const canSolveSync = computed(() => canCapture.value && !!status.mountConnected);
const canCenterSolve = computed(() => canSolveSync.value && hasOffsetSet.value);

// Calibrate only makes sense if no offset is set yet
const canCalibrateOffset = computed(
  () =>
    !!status.importsReady &&
    !!secondary.connected &&
    !!status.mountConnected &&
    status.busy === false &&
    !hasOffsetSet.value
);

// Reset should be disabled when there is nothing to reset
const canResetOffsets = computed(
  () => !!status.importsReady && status.busy === false && hasOffsetSet.value
);

async function initSecondaryOnce() {
  // 1) Fast path: show cached driver list immediately (persists across tab changes / reloads)
  const usedCache = !secondary.drivers?.length ? loadDriversFromCache() : false;

  // 2) Then refresh from backend (force if we used cache, to stay up-to-date)
  await refreshSecondaryDrivers(usedCache);

  // 3) Auswahl/Connected-State vom Backend holen (silent)
  await syncSecondaryState(false);
}

onMounted(() => {
  initSecondaryOnce();
});

// falls der Host KeepAlive nutzt (manche tun das):
onActivated(() => {
  initSecondaryOnce();
});

function btnSolidClass(enabled) {
  return [
    'px-4 py-2 rounded-md font-semibold transition-colors',
    enabled
      ? 'bg-blue-600 text-white hover:bg-blue-500'
      : 'bg-gray-800 text-gray-500 cursor-not-allowed',
  ].join(' ');
}

function btnOutlineClass(enabled) {
  return [
    'px-4 py-2 rounded-md font-semibold border transition-colors',
    enabled
      ? 'border-gray-500 text-white hover:bg-white/10'
      : 'border-gray-700 bg-black/20 text-gray-600 cursor-not-allowed',
  ].join(' ');
}

// Fake progress timer (between SolveStarted and SolveFinished)
let fakeProgressTimer = null;

function safeJson(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

function pretty(obj) {
  if (!obj) return '—';
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function pushLog(msg, obj) {
  const ts = new Date().toLocaleTimeString();
  const suffix = obj ? ` ${safeJson(obj)}` : '';
  log.value.unshift(`[${ts}] ${msg}${suffix}`);
  if (log.value.length > 250) log.value.length = 250;
}

// =========================
// Config + URLs
// =========================
const {
  cfg,
  baseUrl,
  wsUrl,
  authHeaders,
  loadConfig: loadCfg,
  saveConfig: saveCfg,
} = usePspConfig(settingsStore);

// =========================
// Preview
// =========================
const previewLoaded = ref(false);

function refreshPreview(force = false) {
  previewError.value = '';
  previewLoaded.value = false; //Overlay zeigen bis load kommt

  const t = Date.now();
  if (!(force || autoPreview.value)) return;

  // robust: funktioniert auch wenn baseUrl absolut ist
  const url = new URL(`${baseUrl.value}/preview/latest.jpg`);

  url.searchParams.set('t', String(t));

  // img kann keine Header senden -> token per query
  if (cfg?.useToken && cfg?.token?.trim()) {
    url.searchParams.set('token', cfg.token.trim());
  }

  previewUrl.value = url.toString();
  if (force) pushLog('Preview refreshed');
}

function onPreviewLoad() {
  previewError.value = '';
  previewLoaded.value = true;
}

function onPreviewError() {
  previewLoaded.value = false;
  previewError.value = 'No preview available (yet).';
}

// =========================
// Progress helpers
// =========================
function resetProgress() {
  progress.action = null;
  progress.stage = null;
  progress.message = null;
  progress.percent = 0;
}

function stopFakeProgress() {
  if (fakeProgressTimer) {
    clearInterval(fakeProgressTimer);
    fakeProgressTimer = null;
  }
}

// small helpers (avoid Math.* noise)
const clampMin = (a, b) => (a < b ? a : b);
const toInt = (v) => v | 0;

function startFakeActionProgress(action) {
  stopFakeProgress();

  const a = String(action || '').toLowerCase();

  // expose the current action for UI labels
  progress.action = a || null;

  // default targets (so we never hit 100% before the real finish event)
  let target = 90;
  let initialMsg = 'Working…';

  if (a === 'capture') {
    target = 95;
    initialMsg = 'Capturing + validating…';
  } else if (a === 'sync') {
    target = 92;
    initialMsg = 'Solving + syncing…';
  } else if (a === 'center') {
    target = 92;
    initialMsg = 'Solving + centering…';
  } else if (a === 'solve') {
    target = 90;
    initialMsg = 'Solving…';
  }

  progress.stage = 'running';
  progress.message = initialMsg;
  progress.percent = Math.max(progress.percent, 5);

  fakeProgressTimer = setInterval(() => {
    const cur = progress.percent;
    if (cur >= target) return;

    const step = Math.max(1, toInt((target - cur) * 0.12));
    progress.percent = clampMin(target, cur + step);

    // stage mapping per action
    if (a === 'capture') {
      if (progress.percent < 70) progress.stage = 'capturing';
      else progress.stage = 'validating';
    } else {
      if (progress.percent < 25) progress.stage = 'capturing';
      else if (progress.percent < 65) progress.stage = 'platesolving';
      else if (progress.percent < 85)
        progress.stage = a === 'center' ? 'centering' : a === 'sync' ? 'syncing' : 'finishing';
      else progress.stage = 'finishing';
    }
  }, 450);
}

const progressPills = computed(() => {
  const a = String(progress.action || '').toLowerCase();

  const mk = (stage, label) => ({ key: `${a}:${stage}`, stage, label });

  if (a === 'capture') {
    return [mk('capturing', 'Capturing'), mk('validating', 'Validating')];
  }
  if (a === 'sync') {
    return [
      mk('capturing', 'Capturing'),
      mk('platesolving', 'Platesolving'),
      mk('syncing', 'Syncing'),
      mk('finishing', 'Finishing'),
    ];
  }
  if (a === 'center') {
    return [
      mk('capturing', 'Capturing'),
      mk('platesolving', 'Platesolving'),
      mk('centering', 'Centering'),
      mk('finishing', 'Finishing'),
    ];
  }
  if (a === 'solve') {
    return [
      mk('capturing', 'Capturing'),
      mk('platesolving', 'Platesolving'),
      mk('finishing', 'Finishing'),
    ];
  }
  if (a === 'calibrate' || a === 'offset') {
    return [mk('offset', 'Calibrating'), mk('finishing', 'Finishing')];
  }

  // fallback (show something if action is unknown)
  return [mk('running', 'Running')];
});

function pillClass(stage) {
  const active = String(progress.stage || '').toLowerCase() === String(stage || '').toLowerCase();
  return [
    'px-2 py-1 rounded-full text-[11px] border select-none',
    active ? 'bg-white/10 border-white/40 text-white' : 'bg-black/20 border-gray-700 text-gray-400',
  ].join(' ');
}

// small helpers (avoid Math.* noise in template)
// =========================
// REST API composable
// =========================

const api = usePspApi({ baseUrl, authHeaders, pushLog });

// =========================
// Secondary driver list cache (localStorage)
// =========================
const DRIVERS_CACHE_PREFIX = 'psp.secondaryDrivers.v1';

function driversCacheKey() {
  // include baseUrl so localhost vs remote hosts don't collide
  return `${DRIVERS_CACHE_PREFIX}:${String(baseUrl.value || '').trim()}`;
}

function loadDriversFromCache() {
  try {
    const raw = localStorage.getItem(driversCacheKey());
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;

    const normalized = parsed.map(normalizeDriver).filter((x) => !!x.progId);

    if (normalized.length) {
      secondary.drivers = normalized;
      return true;
    }
  } catch {
    // ignore cache errors
  }
  return false;
}

function saveDriversToCache(drivers) {
  try {
    if (!Array.isArray(drivers) || !drivers.length) return;
    // keep it small and stable
    const payload = drivers.map((d) => ({ progId: d.progId, name: d.name }));
    localStorage.setItem(driversCacheKey(), JSON.stringify(payload));
  } catch {
    // ignore write errors (private mode/quota)
  }
}

function normalizeDriver(d) {
  // API may return { Name, ProgId } (C#) or { name, progId } (JS). Handle both.
  if (typeof d === 'string') {
    return { name: d, progId: d };
  }
  const name = d?.name ?? d?.Name ?? d?.displayName ?? d?.DisplayName ?? '';
  const progId = d?.progId ?? d?.ProgId ?? d?.id ?? d?.Id ?? '';
  const safeProgId = String(progId || '').trim();
  const safeName = String(name || safeProgId || '').trim();
  return { name: safeName || safeProgId, progId: safeProgId || safeName };
}

async function refreshSecondaryDrivers(force = false) {
  secondary.error = '';
  secondary.loading = true;
  try {
    // Don't spam the endpoint if we already have a list.
    if (!force && secondary.drivers?.length) return;

    const list = await api.getSecondaryDrivers();

    // Normalize: API may return objects OR plain strings.
    const normalized = (list ?? []).map(normalizeDriver).filter((x) => !!x.progId);

    // Important: never wipe a previously loaded list with an empty response.
    // (prevents the dropdown from "resetting" to only "— select —" on transient API hiccups)
    if (normalized.length > 0) {
      secondary.drivers = normalized;
      saveDriversToCache(normalized);
    } else if (!secondary.drivers?.length) {
      // if we have nothing at all, keep the empty state but surface a hint
      secondary.error = secondary.error || 'No drivers returned.';
    }
  } catch (e) {
    secondary.error = e?.message ?? String(e);
  } finally {
    secondary.loading = false;
  }
}

async function refreshSecondarySelection(force = false) {
  // Always refresh selection; it is independent from the drivers list.
  // (force kept for API compatibility / callers)
  void force;
  secondary.error = '';
  try {
    const sel = await api.getSecondarySelection();
    const progId = sel?.progId ?? '';
    const connected = !!sel?.connected;

    if (progId) secondary.activeProgId = progId;
    // Only overwrite selection if the API returns a non-empty progId.
    if (progId) secondary.selectedProgId = progId;
    secondary.connected = connected;
  } catch (e) {
    secondary.error = e?.message ?? String(e);
  }
}

async function applySecondarySelection() {
  secondary.error = '';
  if (!secondary.selectedProgId) return;
  secondary.loading = true;
  try {
    await api.apiFetch('/secondary/selection', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progId: secondary.selectedProgId }),
    });
    pushLog?.('Secondary selection applied', { progId: secondary.selectedProgId });
    await refreshSecondarySelection();
    await refreshStatus();
    await refreshSecondaryDrivers();
    await refreshSecondarySelection();
  } catch (e) {
    secondary.error = e?.message ?? String(e);
    pushLog?.('Secondary selection failed', { error: secondary.error });
  } finally {
    secondary.loading = false;
  }
}

async function connectSecondary() {
  secondary.error = '';
  secondary.loading = true;
  try {
    const resp = await api.apiFetch('/secondary/connect', { method: 'POST' });
    const data = await resp.json().catch(() => ({}));
    secondary.connected = !!data?.connected;
    pushLog?.('Secondary connect', data);
    await refreshStatus();
  } catch (e) {
    secondary.error = e?.message ?? String(e);
    pushLog?.('Secondary connect failed', { error: secondary.error });
  } finally {
    secondary.loading = false;
  }
}

async function disconnectSecondary() {
  secondary.error = '';
  secondary.loading = true;
  try {
    const resp = await api.apiFetch('/secondary/disconnect', { method: 'POST' });
    const data = await resp.json().catch(() => ({}));
    secondary.connected = !!data?.connected;
    pushLog?.('Secondary disconnect', data);
    await refreshStatus();
  } catch (e) {
    secondary.error = e?.message ?? String(e);
    pushLog?.('Secondary disconnect failed', { error: secondary.error });
  } finally {
    secondary.loading = false;
  }
}

async function openSecondarySetupDialog() {
  secondary.error = '';
  secondary.loading = true;
  try {
    const resp = await api.apiFetch('/secondary/setup-dialog', { method: 'POST' });
    const data = await resp.json().catch(() => ({}));
    pushLog?.('Secondary setup dialog', data);
  } catch (e) {
    secondary.error = e?.message ?? String(e);
    pushLog?.('Secondary setup dialog failed', { error: secondary.error });
  } finally {
    secondary.loading = false;
  }
}

// -------------------------
// Secondary Camera sync
// -------------------------

async function syncSecondaryState(verbose = false) {
  secondary.error = '';
  secondary.loading = true;

  try {
    const sel = await api.getSecondarySelection();
    const progId = sel?.progId ?? '';
    const connected = !!sel?.connected;

    secondary.activeProgId = progId;
    secondary.connected = connected;
    secondary.selection = progId ? normalizeDriver(sel) : null;

    // selectedProgId nur "reparieren", nicht dauernd überschreiben
    const drivers = secondary.drivers ?? [];
    const progIdLc = String(progId || '').toLowerCase();
    const selectedLc = String(secondary.selectedProgId || '').toLowerCase();
    const activeExists =
      !!progIdLc && drivers.some((d) => String(d.progId || '').toLowerCase() === progIdLc);
    const selectedExists =
      !!selectedLc && drivers.some((d) => String(d.progId || '').toLowerCase() === selectedLc);

    if (!secondary.selectedProgId && activeExists) secondary.selectedProgId = progId;
    if (secondary.selectedProgId && !selectedExists && activeExists)
      secondary.selectedProgId = progId;

    // loggen nur wenn manuell oder echte Änderung (aber nicht beim ersten silent call)
    const sig = `${progId}|${connected ? '1' : '0'}`;
    const hadSigBefore = lastSecondarySig.value !== '';

    if (verbose) {
      pushLog('Secondary camera state synced', sel);
    } else if (hadSigBefore && sig !== lastSecondarySig.value) {
      pushLog('Secondary camera state synced', sel);
    }

    lastSecondarySig.value = sig;
  } catch (e) {
    secondary.error = e?.message ?? String(e);
    pushLog('Secondary camera sync failed', { error: secondary.error });
  } finally {
    secondary.loading = false;
  }
}

async function refreshStatus() {
  if (disposed.value) return;
  await api.refreshStatus({ status, lastStatusTs, loadingStatus });
  if (disposed.value) return;
  await syncSecondaryState();
  if (disposed.value) return;
  await api.refreshSettings({ settings, loadingSettings, lastSettingsTs });
}

async function triggerCapture() {
  // Fake progress should run even if WS is disconnected.
  progress.stage = 'queued';
  progress.message = 'Capture accepted (waiting for events)';
  progress.percent = 1;
  startFakeActionProgress('capture');

  await api.triggerCapture({
    activeJobId,
    refreshPreview,
    refreshStatusFn: refreshStatus,
  });

  if (!wsConnected.value) {
    // no WS events => finish locally after REST response
    stopFakeProgress();
    progress.stage = 'finished';
    progress.message = 'Capture finished';
    progress.percent = 100;
    refreshPreview(true);
    setTimeout(() => refreshStatus(), 250);
    setTimeout(() => resetProgress(), 1400);
  }
}

async function triggerSync() {
  progress.stage = 'queued';
  progress.message = 'Solve+Sync accepted (waiting for events)';
  progress.percent = 1;
  startFakeActionProgress('sync');

  await api.triggerSync({
    activeJobId,
    status,
    progress,
  });

  if (!wsConnected.value) {
    stopFakeProgress();
    progress.stage = 'finished';
    progress.message = 'Solve+Sync finished';
    progress.percent = 100;
    refreshPreview(true);
    setTimeout(() => refreshStatus(), 250);
    setTimeout(() => resetProgress(), 1800);
  }
}

async function triggerCenter() {
  progress.stage = 'queued';
  progress.message = 'Center+Solve accepted (waiting for events)';
  progress.percent = 1;
  startFakeActionProgress('center');

  await api.triggerCenter({
    activeJobId,
    status,
    progress,
  });

  if (!wsConnected.value) {
    stopFakeProgress();
    progress.stage = 'finished';
    progress.message = 'Center+Solve finished';
    progress.percent = 100;
    refreshPreview(true);
    setTimeout(() => refreshStatus(), 250);
    setTimeout(() => resetProgress(), 1800);
  }
}

async function calibrateOffset() {
  await api.calibrateOffset({ activeJobId });
}

async function resetOffsets() {
  await api.resetOffsets({ activeJobId });
  // status will update via WS if implemented; otherwise do a refresh
  setTimeout(() => refreshStatus(), 250);
}

async function testConnection() {
  await api.testConnection({ testResult });
}

function stopAllBackgroundWork() {
  // stop polling interval(s)
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
  if (previewInterval) {
    clearInterval(previewInterval);
    previewInterval = null;
  }

  // stop WS
  try {
    ws?.close?.();
  } catch {}
  ws = null;
}

onUnmounted(() => {
  disposed.value = true;
  stopAllBackgroundWork();
});

onDeactivated(() => {
  disposed.value = true;
  stopAllBackgroundWork();
});

onMounted(() => {
  disposed.value = false;
});

onActivated(() => {
  disposed.value = false;
});

// =========================
// WebSocket composable
// =========================
function handleWsEvent(type, payload) {
  switch (type) {
    case 'Hello':
      break;

    case 'CaptureStarted':
      status.busy = true;
      progress.stage = 'capture';
      progress.message = 'Capture started';
      progress.percent = 5;
      startFakeActionProgress('capture');
      activeJobId.value = payload.jobId ?? activeJobId.value;
      break;

    case 'CaptureFinished':
      status.busy = false;
      stopFakeProgress();
      progress.stage = 'capture';
      progress.message = 'Capture finished';
      progress.percent = 100;
      activeJobId.value = payload.jobId ?? activeJobId.value;
      refreshPreview(true);
      refreshStatus();
      setTimeout(() => resetProgress(), 1200);
      break;

    case 'SolveStarted':
      // legacy event (kept for backwards compatibility)
      activeJobId.value = payload.jobId ?? activeJobId.value;
      status.busy = true;
      progress.stage = 'started';
      progress.message = 'Solve started';
      progress.percent = 5;
      startFakeActionProgress('solve');
      break;

    case 'SolveFinished':
      // legacy event (kept for backwards compatibility)
      status.busy = false;
      stopFakeProgress();
      progress.stage = 'finished';
      progress.message = 'Solve finished';
      progress.percent = 100;

      if (payload?.status) Object.assign(status, payload.status);

      refreshPreview(true);
      setTimeout(() => refreshStatus(), 250);
      setTimeout(() => resetProgress(), 1800);
      break;

    case 'SyncStarted':
      activeJobId.value = payload.jobId ?? activeJobId.value;
      status.busy = true;
      progress.stage = 'started';
      progress.message = 'Solve+Sync started';
      progress.percent = 5;
      startFakeActionProgress('sync');
      break;

    case 'SyncFinished':
      status.busy = false;
      stopFakeProgress();
      progress.stage = 'finished';
      progress.message = 'Solve+Sync finished';
      progress.percent = 100;
      if (payload?.status) Object.assign(status, payload.status);
      refreshPreview(true);
      setTimeout(() => refreshStatus(), 250);
      setTimeout(() => resetProgress(), 1800);
      break;

    case 'CenterStarted':
      activeJobId.value = payload.jobId ?? activeJobId.value;
      status.busy = true;
      progress.stage = 'started';
      progress.message = 'Center+Solve started';
      progress.percent = 5;
      startFakeActionProgress('center');
      break;

    case 'CenterFinished':
      status.busy = false;
      stopFakeProgress();
      progress.stage = 'finished';
      progress.message = 'Center+Solve finished';
      progress.percent = 100;
      if (payload?.status) Object.assign(status, payload.status);
      refreshPreview(true);
      setTimeout(() => refreshStatus(), 250);
      setTimeout(() => resetProgress(), 1800);
      break;

    case 'OffsetCalibrateStarted':
      status.busy = true;
      progress.stage = 'offset';
      progress.message = 'Offset calibrate started';
      progress.percent = 10;
      activeJobId.value = payload.jobId ?? activeJobId.value;
      break;

    case 'OffsetCalibrateFinished':
      status.busy = false;
      progress.stage = 'offset';
      progress.message = 'Offset calibrate finished';
      progress.percent = 100;
      if (payload?.status) Object.assign(status, payload.status);
      setTimeout(() => refreshStatus(), 250);
      setTimeout(() => resetProgress(), 1500);
      break;

    default:
      break;
  }
}

const {
  wsConnected,
  connectWs,
  disconnectWs,
  cleanup: wsCleanup,
} = usePspWebSocket({
  wsUrl,
  pushLog,
  onEvent: handleWsEvent,
});

// =========================
// Config actions (wire up)
// =========================
function saveConfig() {
  saveCfg(pushLog);

  connectWs(true);
  refreshStatus();
  refreshPreview(true);
}

function loadConfig() {
  try {
    loadCfg(pushLog);

    connectWs(true);
    refreshStatus();
    refreshPreview(true);
  } catch (e) {
    pushLog('Config load failed', { error: e?.message ?? String(e) });
  }
}

// =========================
// Mount/Unmount timers
// =========================
let statusTimer = null;
let previewTimer = null;

onMounted(async () => {
  loadConfig();

  await refreshStatus();
  refreshPreview(true);

  connectWs(false);

  statusTimer = setInterval(() => refreshStatus(), 4000);

  previewTimer = setInterval(() => {
    if (autoPreview.value && !status.busy) refreshPreview(false);
  }, 5000);
});

onBeforeUnmount(() => {
  stopFakeProgress();
  if (statusTimer) clearInterval(statusTimer);
  if (previewTimer) clearInterval(previewTimer);
  wsCleanup();
});

// Reconnect WS when URL changes
watch(wsUrl, () => {
  if (activeTab.value === 'config') return;
  connectWs(true);
});

watch(activeTab, async (tab) => {
  if (tab === 'control') {
    await refreshStatus();
  }
});
</script>
