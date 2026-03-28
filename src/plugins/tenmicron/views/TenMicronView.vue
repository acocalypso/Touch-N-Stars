<template>
  <div class="min-h-screen bg-gray-900 pb-10">
    <div class="container py-8 max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-1">
        <h1 class="text-3xl font-bold text-white">{{ $t('plugins.tenmicron.title') }}</h1>
        <p class="text-gray-400 text-sm">{{ $t('plugins.tenmicron.subtitle') }}</p>
      </div>

      <!-- Plugin not loaded notice -->
      <div
        v-if="!tmStore.pluginLoaded && !tmStore.isLoading"
        class="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-5 text-yellow-200 text-sm"
      >
        {{ $t('plugins.tenmicron.notLoaded') }}
      </div>

      <!-- Mount not connected notice (plugin loaded but no connection) -->
      <div
        v-else-if="tmStore.pluginLoaded && !tmStore.connected && !tmStore.isLoading"
        class="rounded-xl border border-orange-500/40 bg-orange-500/10 p-4 text-orange-200 text-sm mb-4"
      >
        {{ $t('plugins.tenmicron.mountNotConnected') }}
      </div>

      <!-- Mount status bar (shown when connected) -->
      <div
        v-if="tmStore.pluginLoaded && tmStore.connected"
        class="mb-4 flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-2.5"
      >
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {{ $t('plugins.tenmicron.mountStatus') }}
        </span>
        <div class="flex items-center gap-4 ml-auto">
          <!-- Dual-Axis Tracking toggle -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">{{
              $t('plugins.tenmicron.dualAxisTracking')
            }}</span>
            <button
              @click="toggleDualAxisTracking"
              :disabled="!tmStore.connected"
              :class="[
                'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40',
                tmStore.dualAxisTrackingEnabled ? 'bg-cyan-500' : 'bg-gray-600',
              ]"
              role="switch"
              :aria-checked="tmStore.dualAxisTrackingEnabled"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                  tmStore.dualAxisTrackingEnabled ? 'translate-x-4' : 'translate-x-0',
                ]"
              />
            </button>
          </div>
          <!-- Refraction Correction toggle -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">{{
              $t('plugins.tenmicron.refractionCorrection')
            }}</span>
            <button
              @click="toggleRefractionCorrection"
              :disabled="!tmStore.connected"
              :class="[
                'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40',
                tmStore.refractionCorrectionEnabled ? 'bg-cyan-500' : 'bg-gray-600',
              ]"
              role="switch"
              :aria-checked="tmStore.refractionCorrectionEnabled"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                  tmStore.refractionCorrectionEnabled ? 'translate-x-4' : 'translate-x-0',
                ]"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Tab bar -->
      <div
        v-if="tmStore.pluginLoaded"
        class="mb-4 border border-gray-700 rounded-xl bg-gray-800 overflow-hidden"
      >
        <div class="flex border-b border-gray-700 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="tmStore.activeTab = tab.id"
            :class="[
              'px-5 py-3 text-sm font-semibold transition whitespace-nowrap flex-shrink-0',
              tmStore.activeTab === tab.id
                ? 'border-b-2 border-cyan-400 text-white'
                : 'text-gray-400 hover:text-white',
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- ============================================================ -->
        <!-- TAB: Model Builder                                            -->
        <!-- ============================================================ -->
        <div v-if="tmStore.activeTab === 'builder'" class="p-5 space-y-5">
          <!-- Build status badge -->
          <div
            v-if="tmStore.buildInProgress"
            class="flex items-center gap-3 rounded-lg bg-cyan-500/10 border border-cyan-500/40 p-3 text-cyan-200 text-sm"
          >
            <div class="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
            {{ $t('plugins.tenmicron.builder.buildRunning') }}
            <div class="ml-auto flex gap-2">
              <button
                @click="stopBuild"
                class="px-3 py-1 rounded-md bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/30 text-xs"
              >
                {{ $t('plugins.tenmicron.builder.stop') }}
              </button>
              <button
                @click="cancelBuild"
                class="px-3 py-1 rounded-md bg-red-500/20 border border-red-500/40 text-red-200 hover:bg-red-500/30 text-xs"
              >
                {{ $t('plugins.tenmicron.builder.cancel') }}
              </button>
            </div>
          </div>

          <!-- Controls row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Point generation -->
            <div class="rounded-xl border border-gray-700 bg-gray-800/60 p-4 space-y-4">
              <h3 class="text-sm font-semibold text-gray-300">
                {{ $t('plugins.tenmicron.builder.pointGeneration') }}
              </h3>

              <!-- Generator type selector -->
              <div class="flex rounded-lg overflow-hidden border border-gray-600">
                <button
                  @click="generatorType = 'goldenSpiral'"
                  :class="
                    generatorType === 'goldenSpiral'
                      ? 'bg-cyan-700/50 text-cyan-200'
                      : 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/30'
                  "
                  class="flex-1 px-3 py-2 text-sm transition-colors"
                >
                  {{ $t('plugins.tenmicron.builder.goldenSpiral') }}
                </button>
                <button
                  @click="generatorType = 'siderealPath'"
                  :class="
                    generatorType === 'siderealPath'
                      ? 'bg-cyan-700/50 text-cyan-200'
                      : 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/30'
                  "
                  class="flex-1 px-3 py-2 text-sm transition-colors"
                >
                  {{ $t('plugins.tenmicron.builder.siderealPath') }}
                </button>
              </div>

              <!-- Golden Spiral options -->
              <div v-if="generatorType === 'goldenSpiral'" class="flex items-center gap-2">
                <span class="text-xs text-gray-200 flex-1">{{
                  $t('plugins.tenmicron.builder.starCount')
                }}</span>
                <div class="w-28 shrink-0 tns-picker">
                  <NumberInputPicker
                    v-model="starCount"
                    labelKey="plugins.tenmicron.builder.starCount"
                    :min="3"
                    :max="99"
                    :step="1"
                    :decimalPlaces="0"
                    wrapperClass="w-full"
                  />
                </div>
              </div>

              <!-- Sidereal Path options -->
              <div v-else class="space-y-4">
                <!-- Target coordinates -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">{{
                      $t('plugins.tenmicron.builder.target')
                    }}</span>
                    <div class="flex gap-1.5">
                      <button
                        @click="fetchCoordsFromScope"
                        class="px-2.5 py-1 rounded-md text-xs bg-gray-700/60 border border-gray-600/80 text-gray-300 hover:bg-gray-600/60 hover:text-white transition-colors"
                      >
                        {{ $t('plugins.tenmicron.builder.fromScope') }}
                      </button>
                      <button
                        @click="fetchCoordsFromSequence"
                        class="px-2.5 py-1 rounded-md text-xs bg-gray-700/60 border border-gray-600/80 text-gray-300 hover:bg-gray-600/60 hover:text-white transition-colors"
                      >
                        {{ $t('plugins.tenmicron.builder.fromSequence') }}
                      </button>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div class="flex flex-col gap-1">
                      <label class="text-xs text-gray-400">RA (h:m:s)</label>
                      <input
                        v-model="siderealRaStr"
                        type="text"
                        placeholder="0:00:00.0"
                        class="w-full rounded-lg bg-slate-700/40 border border-slate-600/60 text-gray-200 px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500/60"
                      />
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="text-xs text-gray-400">Dec (°:′:″)</label>
                      <input
                        v-model="siderealDecStr"
                        type="text"
                        placeholder="+00:00:00.0"
                        class="w-full rounded-lg bg-slate-700/40 border border-slate-600/60 text-gray-200 px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500/60"
                      />
                    </div>
                  </div>
                </div>
                <!-- RA Interval -->
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-200 flex-1">{{
                    $t('plugins.tenmicron.builder.raDelta')
                  }}</span>
                  <div class="w-28 shrink-0 tns-picker">
                    <NumberInputPicker
                      v-model="siderealRaDelta"
                      labelKey="plugins.tenmicron.builder.raDelta"
                      :min="0.1"
                      :max="30"
                      :step="0.1"
                      :decimalPlaces="1"
                      wrapperClass="w-full"
                    />
                  </div>
                </div>
                <!-- Time Window -->
                <div class="space-y-2">
                  <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">{{
                    $t('plugins.tenmicron.builder.timeWindow')
                  }}</span>
                  <!-- Start time -->
                  <div class="rounded-lg bg-gray-700/30 border border-gray-600/40 p-2.5 space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-200 shrink-0 w-12">{{
                        $t('plugins.tenmicron.builder.startTime')
                      }}</span>
                      <select
                        v-model="siderealStartProvider"
                        class="default-select text-xs h-8 flex-1"
                      >
                        <option v-for="p in SIDEREAL_START_PROVIDERS" :key="p" :value="p">
                          {{ p }}
                        </option>
                      </select>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-200 flex-1">{{
                        $t('plugins.tenmicron.builder.offsetMin')
                      }}</span>
                      <div class="w-28 shrink-0 tns-picker">
                        <NumberInputPicker
                          v-model="siderealStartOffset"
                          labelKey="plugins.tenmicron.builder.offsetMin"
                          :min="-240"
                          :max="240"
                          :step="5"
                          :decimalPlaces="0"
                          wrapperClass="w-full"
                        />
                      </div>
                    </div>
                  </div>
                  <!-- End time -->
                  <div class="rounded-lg bg-gray-700/30 border border-gray-600/40 p-2.5 space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-200 shrink-0 w-12">{{
                        $t('plugins.tenmicron.builder.endTime')
                      }}</span>
                      <select
                        v-model="siderealEndProvider"
                        class="default-select text-xs h-8 flex-1"
                      >
                        <option v-for="p in SIDEREAL_END_PROVIDERS" :key="p" :value="p">
                          {{ p }}
                        </option>
                      </select>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-200 flex-1">{{
                        $t('plugins.tenmicron.builder.offsetMin')
                      }}</span>
                      <div class="w-28 shrink-0 tns-picker">
                        <NumberInputPicker
                          v-model="siderealEndOffset"
                          labelKey="plugins.tenmicron.builder.offsetMin"
                          :min="-240"
                          :max="240"
                          :step="5"
                          :decimalPlaces="0"
                          wrapperClass="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  @click="generatePoints"
                  :disabled="!tmStore.connected || tmStore.buildInProgress"
                  class="flex-1 px-3 py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-600/30 text-sm disabled:opacity-40"
                >
                  {{
                    generatorType === 'siderealPath'
                      ? $t('plugins.tenmicron.builder.generateSidereal')
                      : $t('plugins.tenmicron.builder.generatePoints')
                  }}
                </button>
                <button
                  @click="clearPoints"
                  :disabled="
                    !tmStore.connected ||
                    tmStore.buildInProgress ||
                    tmStore.modelPoints.length === 0
                  "
                  class="px-3 py-2 rounded-lg bg-gray-600/20 border border-gray-600/40 text-gray-300 hover:bg-gray-600/30 text-sm disabled:opacity-40"
                >
                  {{ $t('plugins.tenmicron.builder.clear') }}
                </button>
              </div>
            </div>

            <!-- Build actions -->
            <div class="rounded-xl border border-gray-700 bg-gray-800/60 p-4 space-y-3">
              <h3 class="text-sm font-semibold text-gray-300">
                {{ $t('plugins.tenmicron.builder.buildControl') }}
              </h3>
              <p class="text-xs text-gray-500">
                {{
                  $t('plugins.tenmicron.builder.pointCount', {
                    valid: tmStore.modelPoints.filter((p) => p.ModelPointState === 0).length,
                    total: tmStore.modelPoints.length,
                  })
                }}
              </p>
              <button
                @click="buildModel"
                :disabled="
                  !tmStore.connected ||
                  tmStore.buildInProgress ||
                  tmStore.modelPoints.length === 0 ||
                  !isCameraConnected
                "
                class="w-full px-3 py-2 rounded-lg bg-green-600/20 border border-green-500/40 text-green-200 hover:bg-green-600/30 text-sm font-semibold disabled:opacity-40"
              >
                {{ $t('plugins.tenmicron.builder.buildModel') }}
              </button>
              <p
                v-if="tmStore.connected && !isCameraConnected"
                class="text-xs text-orange-400 text-center"
              >
                {{ $t('plugins.tenmicron.builder.noCameraConnected') }}
              </p>
            </div>
          </div>

          <!-- Point Filters & Build Options (disabled while a build is running) -->
          <div
            :class="{ 'opacity-50 pointer-events-none': tmStore.buildInProgress }"
            class="space-y-5"
          >
            <!-- Point Filters -->
            <details class="rounded-xl border border-gray-700 bg-gray-800/60">
              <summary
                class="px-4 py-3 text-sm font-semibold text-gray-300 cursor-pointer select-none flex items-center gap-2"
              >
                {{ $t('plugins.tenmicron.builder.pointFilters') }}
                <ChevronRightIcon
                  class="summary-chevron ml-auto w-4 h-4 text-gray-400 transition-transform duration-200"
                />
              </summary>
              <div class="px-4 pb-4 pt-2 space-y-1">
                <!-- Altitude range -->
                <div class="flex items-center gap-2 py-1">
                  <span class="text-xs text-gray-200 flex-1 shrink-0">{{
                    $t('plugins.tenmicron.builder.altRange')
                  }}</span>
                  <span class="text-xs text-gray-500 shrink-0">{{
                    $t('plugins.tenmicron.builder.min')
                  }}</span>
                  <div class="w-28 shrink-0 tns-picker">
                    <NumberInputPicker
                      v-model="optMinAlt"
                      wrapperClass="w-full"
                      :min="0"
                      :max="89"
                      :step="1"
                      :decimalPlaces="0"
                      @change="setOption('MinPointAltitude', optMinAlt)"
                    />
                  </div>
                  <span class="text-xs text-gray-500 shrink-0">–</span>
                  <span class="text-xs text-gray-500 shrink-0">{{
                    $t('plugins.tenmicron.builder.max')
                  }}</span>
                  <div class="w-28 shrink-0 tns-picker">
                    <NumberInputPicker
                      v-model="optMaxAlt"
                      wrapperClass="w-full"
                      :min="1"
                      :max="90"
                      :step="1"
                      :decimalPlaces="0"
                      @change="setOption('MaxPointAltitude', optMaxAlt)"
                    />
                  </div>
                </div>
                <!-- Azimuth range -->
                <div class="flex items-center gap-2 py-1">
                  <span class="text-xs text-gray-200 flex-1 shrink-0">{{
                    $t('plugins.tenmicron.builder.azRange')
                  }}</span>
                  <span class="text-xs text-gray-500 shrink-0">{{
                    $t('plugins.tenmicron.builder.min')
                  }}</span>
                  <div class="w-28 shrink-0 tns-picker">
                    <NumberInputPicker
                      v-model="optMinAz"
                      wrapperClass="w-full"
                      :min="0"
                      :max="359"
                      :step="0.1"
                      :decimalPlaces="1"
                      @change="setOption('MinPointAzimuth', optMinAz)"
                    />
                  </div>
                  <span class="text-xs text-gray-500 shrink-0">–</span>
                  <span class="text-xs text-gray-500 shrink-0">{{
                    $t('plugins.tenmicron.builder.max')
                  }}</span>
                  <div class="w-28 shrink-0 tns-picker">
                    <NumberInputPicker
                      v-model="optMaxAz"
                      wrapperClass="w-full"
                      :min="1"
                      :max="360"
                      :step="0.1"
                      :decimalPlaces="1"
                      @change="setOption('MaxPointAzimuth', optMaxAz)"
                    />
                  </div>
                </div>
                <!-- Max RMS -->
                <div class="flex items-center gap-2 py-1">
                  <span class="text-xs text-gray-200 flex-1">{{
                    $t('plugins.tenmicron.builder.maxRMS')
                  }}</span>
                  <div class="w-28 shrink-0 tns-picker">
                    <NumberInputPicker
                      v-model="optMaxRMS"
                      wrapperClass="w-full"
                      :min="0"
                      :max="999"
                      :step="0.1"
                      :decimalPlaces="1"
                      @change="setOption('MaxPointRMS', optMaxRMS)"
                    />
                  </div>
                </div>
                <!-- Retries -->
                <div class="flex items-center gap-2 py-1">
                  <span class="text-xs text-gray-200 flex-1">{{
                    $t('plugins.tenmicron.builder.numRetries')
                  }}</span>
                  <div class="w-28 shrink-0 tns-picker">
                    <NumberInputPicker
                      v-model="optNumRetries"
                      wrapperClass="w-full"
                      :min="0"
                      :max="10"
                      :step="1"
                      :decimalPlaces="0"
                      @change="setOption('BuilderNumRetries', optNumRetries)"
                    />
                  </div>
                </div>
                <!-- Toggles -->
                <div class="pt-1 border-t border-gray-700/60 space-y-0">
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-200">{{
                      $t('plugins.tenmicron.builder.showExcluded')
                    }}</span>
                    <button
                      @click="toggleOption('ShowRemovedPoints', optShowRemoved)"
                      :class="[
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        optShowRemoved ? 'bg-cyan-500' : 'bg-gray-600',
                      ]"
                      role="switch"
                      :aria-checked="optShowRemoved"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          optShowRemoved ? 'translate-x-4' : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-200">{{
                      $t('plugins.tenmicron.builder.minimizeMeridian')
                    }}</span>
                    <button
                      @click="toggleOption('MinimizeMeridianFlips', optMinimizeMeridian)"
                      :class="[
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        optMinimizeMeridian ? 'bg-cyan-500' : 'bg-gray-600',
                      ]"
                      role="switch"
                      :aria-checked="optMinimizeMeridian"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          optMinimizeMeridian ? 'translate-x-4' : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-200">{{
                      $t('plugins.tenmicron.builder.removeHighRMS')
                    }}</span>
                    <button
                      @click="toggleOption('RemoveHighRMSAfterBuild', optRemoveHighRMS)"
                      :class="[
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        optRemoveHighRMS ? 'bg-cyan-500' : 'bg-gray-600',
                      ]"
                      role="switch"
                      :aria-checked="optRemoveHighRMS"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          optRemoveHighRMS ? 'translate-x-4' : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </details>

            <!-- Build Options -->
            <details class="rounded-xl border border-gray-700 bg-gray-800/60">
              <summary
                class="px-4 py-3 text-sm font-semibold text-gray-300 cursor-pointer select-none flex items-center gap-2"
              >
                {{ $t('plugins.tenmicron.builder.buildOptions') }}
                <ChevronRightIcon
                  class="summary-chevron ml-auto w-4 h-4 text-gray-400 transition-transform duration-200"
                />
              </summary>
              <div class="px-4 pb-4 pt-2 space-y-1">
                <!-- Max Concurrency -->
                <div class="flex items-center gap-2 py-1">
                  <span class="text-xs text-gray-200 flex-1">{{
                    $t('plugins.tenmicron.builder.maxConcurrency')
                  }}</span>
                  <div class="w-28 shrink-0 tns-picker">
                    <NumberInputPicker
                      v-model="optMaxConcurrency"
                      wrapperClass="w-full"
                      :min="1"
                      :max="10"
                      :step="1"
                      :decimalPlaces="0"
                      @change="setOption('MaxConcurrency', optMaxConcurrency)"
                    />
                  </div>
                </div>
                <!-- Plate Solve Subframe -->
                <div class="flex items-center gap-2 py-1">
                  <span class="text-xs text-gray-200 flex-1">{{
                    $t('plugins.tenmicron.builder.plateSolveSubframe')
                  }}</span>
                  <div class="w-28 shrink-0 tns-picker">
                    <NumberInputPicker
                      v-model="optPlateSolveSubframe"
                      wrapperClass="w-full"
                      :min="0.01"
                      :max="1.0"
                      :step="0.01"
                      :decimalPlaces="2"
                      @change="setOption('PlateSolveSubframe', optPlateSolveSubframe)"
                    />
                  </div>
                </div>
                <!-- Dec Jitter -->
                <div class="flex items-center gap-2 py-1">
                  <span class="text-xs text-gray-200 flex-1">{{
                    $t('plugins.tenmicron.builder.decJitter')
                  }}</span>
                  <div class="w-28 shrink-0 tns-picker">
                    <NumberInputPicker
                      v-model="optDecJitter"
                      wrapperClass="w-full"
                      :min="0"
                      :max="10"
                      :step="0.1"
                      :decimalPlaces="1"
                      @change="setOption('DecJitter', optDecJitter)"
                    />
                  </div>
                </div>
                <!-- Boolean toggles -->
                <div class="pt-1 border-t border-gray-700/60 space-y-0">
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-200">{{
                      $t('plugins.tenmicron.builder.logCommands')
                    }}</span>
                    <button
                      @click="toggleOption('LogCommands', optLogCommands)"
                      :class="[
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        optLogCommands ? 'bg-cyan-500' : 'bg-gray-600',
                      ]"
                      role="switch"
                      :aria-checked="optLogCommands"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          optLogCommands ? 'translate-x-4' : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-200">{{
                      $t('plugins.tenmicron.builder.allowBlindSolves')
                    }}</span>
                    <button
                      @click="toggleOption('AllowBlindSolves', optAllowBlindSolves)"
                      :class="[
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        optAllowBlindSolves ? 'bg-cyan-500' : 'bg-gray-600',
                      ]"
                      role="switch"
                      :aria-checked="optAllowBlindSolves"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          optAllowBlindSolves ? 'translate-x-4' : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-200">{{
                      $t('plugins.tenmicron.builder.optimizeDome')
                    }}</span>
                    <button
                      @click="toggleOption('OptimizeDome', optOptimizeDome)"
                      :class="[
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        optOptimizeDome ? 'bg-cyan-500' : 'bg-gray-600',
                      ]"
                      role="switch"
                      :aria-checked="optOptimizeDome"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          optOptimizeDome ? 'translate-x-4' : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-200">{{
                      $t('plugins.tenmicron.builder.westToEast')
                    }}</span>
                    <button
                      @click="toggleOption('WestToEast', optWestToEast)"
                      :class="[
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        optWestToEast ? 'bg-cyan-500' : 'bg-gray-600',
                      ]"
                      role="switch"
                      :aria-checked="optWestToEast"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          optWestToEast ? 'translate-x-4' : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-200">{{
                      $t('plugins.tenmicron.builder.alternateDirection')
                    }}</span>
                    <button
                      @click="toggleOption('AlternateDirection', optAlternateDirection)"
                      :class="[
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        optAlternateDirection ? 'bg-cyan-500' : 'bg-gray-600',
                      ]"
                      role="switch"
                      :aria-checked="optAlternateDirection"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          optAlternateDirection ? 'translate-x-4' : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-200">{{
                      $t('plugins.tenmicron.builder.disableRefractionCorrection')
                    }}</span>
                    <button
                      @click="
                        toggleOption('DisableRefractionCorrection', optDisableRefractionCorrection)
                      "
                      :class="[
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        optDisableRefractionCorrection ? 'bg-cyan-500' : 'bg-gray-600',
                      ]"
                      role="switch"
                      :aria-checked="optDisableRefractionCorrection"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          optDisableRefractionCorrection ? 'translate-x-4' : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-200">{{
                      $t('plugins.tenmicron.builder.disableDAT')
                    }}</span>
                    <button
                      @click="toggleOption('DisableDAT', optDisableDAT)"
                      :class="[
                        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        optDisableDAT ? 'bg-cyan-500' : 'bg-gray-600',
                      ]"
                      role="switch"
                      :aria-checked="optDisableDAT"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          optDisableDAT ? 'translate-x-4' : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </details>

            <!-- Reset options button -->
            <div class="flex justify-end">
              <button
                @click="resetBuilderOptions"
                :disabled="!tmStore.connected"
                class="px-4 py-2 rounded-lg bg-gray-600/20 border border-gray-500/40 text-gray-300 hover:bg-gray-600/30 text-xs disabled:opacity-40"
              >
                {{ $t('plugins.tenmicron.builder.resetOptions') }}
              </button>
            </div>
          </div>
          <!-- end options wrapper -->

          <!-- Scatter plot of model points: X = Azimuth, Y = Altitude -->
          <div
            v-if="tmStore.modelPoints.length > 0"
            class="rounded-xl border border-gray-700 bg-gray-800/60 p-4"
          >
            <h3 class="text-sm font-semibold text-gray-300 mb-3">
              {{ $t('plugins.tenmicron.builder.scatterChart') }}
            </h3>
            <div ref="scatterContainerRef" class="w-full">
              <svg
                :width="scatterActualW + scatterPadL + scatterPadR"
                :height="scatterH + scatterPadT + scatterPadB"
                style="display: block"
                class="overflow-visible"
              >
                <defs>
                  <clipPath id="scatter-plot-clip">
                    <rect x="0" y="0" :width="scatterActualW" :height="scatterH" />
                  </clipPath>
                </defs>
                <g :transform="`translate(${scatterPadL}, ${scatterPadT})`">
                  <!-- Grid lines -->
                  <line
                    v-for="tick in azTicks"
                    :key="'vg' + tick"
                    :x1="scatterAzX(tick)"
                    y1="0"
                    :x2="scatterAzX(tick)"
                    :y2="scatterH"
                    stroke="#374151"
                    stroke-width="0.5"
                  />
                  <line
                    v-for="tick in altTicks"
                    :key="'hg' + tick"
                    x1="0"
                    :y1="scatterAltY(tick)"
                    :x2="scatterActualW"
                    :y2="scatterAltY(tick)"
                    stroke="#374151"
                    stroke-width="0.5"
                  />
                  <!-- Axes -->
                  <line
                    x1="0"
                    :y1="scatterH"
                    :x2="scatterActualW"
                    :y2="scatterH"
                    stroke="#6B7280"
                    stroke-width="1"
                  />
                  <line x1="0" y1="0" x2="0" :y2="scatterH" stroke="#6B7280" stroke-width="1" />
                  <!-- X tick labels (Azimuth) -->
                  <text
                    v-for="tick in azTicks"
                    :key="'xl' + tick"
                    :x="scatterAzX(tick)"
                    :y="scatterH + 14"
                    fill="#9CA3AF"
                    font-size="11"
                    text-anchor="middle"
                  >
                    {{ tick }}
                  </text>
                  <!-- Y tick labels (Altitude) -->
                  <text
                    v-for="tick in altTicks"
                    :key="'yl' + tick"
                    :x="-6"
                    :y="scatterAltY(tick) + 3"
                    fill="#9CA3AF"
                    font-size="11"
                    text-anchor="end"
                  >
                    {{ tick }}
                  </text>
                  <!-- Axis labels -->
                  <text
                    :x="scatterActualW / 2"
                    :y="scatterH + 28"
                    fill="#9CA3AF"
                    font-size="12"
                    text-anchor="middle"
                  >
                    {{ $t('plugins.tenmicron.builder.axisAz') }}
                  </text>
                  <text
                    :x="-scatterH / 2"
                    y="-28"
                    fill="#9CA3AF"
                    font-size="12"
                    text-anchor="middle"
                    transform="rotate(-90)"
                  >
                    {{ $t('plugins.tenmicron.builder.axisAlt') }}
                  </text>
                  <!-- Model points -->
                  <g clip-path="url(#scatter-plot-clip)">
                    <g v-for="(pt, i) in tmStore.modelPoints" :key="'pt-' + i">
                      <circle
                        :cx="scatterAzX(pt.Azimuth)"
                        :cy="scatterAltY(pt.Altitude)"
                        r="4"
                        :fill="stateColor(pt.ModelPointState)"
                        fill-opacity="0.85"
                        stroke="#1F2937"
                        stroke-width="0.5"
                      >
                        <title>
                          {{ i + 1 }}: Az {{ pt.Azimuth }}° Alt {{ pt.Altitude }}° —
                          {{ stateLabel(pt.ModelPointState) }}
                        </title>
                      </circle>
                      <text
                        :x="scatterAzX(pt.Azimuth) + 5"
                        :y="scatterAltY(pt.Altitude) - 3"
                        fill="#D1D5DB"
                        font-size="9"
                        dominant-baseline="auto"
                        pointer-events="none"
                      >
                        {{ i + 1 }}
                      </text>
                    </g>
                  </g>
                  <!-- end clip-path group -->
                </g>
              </svg>
            </div>
            <!-- Legend -->
            <div class="flex flex-wrap gap-3 mt-3 justify-center text-xs text-gray-400">
              <span v-for="leg in stateLegend" :key="leg.label" class="flex items-center gap-1">
                <span
                  class="inline-block w-3 h-3 rounded-full"
                  :style="{ backgroundColor: leg.color }"
                />
                {{ leg.label }}
              </span>
            </div>
          </div>

          <!-- Points table (compact) -->
          <div
            v-if="usableModelPoints.length > 0"
            class="rounded-xl border border-gray-700 bg-gray-800/60 overflow-hidden"
          >
            <table class="w-full text-xs text-gray-300">
              <thead class="bg-gray-700/60 text-gray-400 uppercase">
                <tr>
                  <th class="px-3 py-2 text-left">#</th>
                  <th class="px-3 py-2 text-right">Az (°)</th>
                  <th class="px-3 py-2 text-right">Alt (°)</th>
                  <th class="px-3 py-2 text-left">State</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(pt, i) in usableModelPoints"
                  :key="i"
                  class="border-t border-gray-700/50 hover:bg-gray-700/30"
                >
                  <td class="px-3 py-1">{{ i + 1 }}</td>
                  <td class="px-3 py-1 text-right">{{ pt.Azimuth }}</td>
                  <td class="px-3 py-1 text-right">{{ pt.Altitude }}</td>
                  <td class="px-3 py-1">
                    <span
                      class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                      :style="{
                        backgroundColor: stateColor(pt.ModelPointState) + '33',
                        color: stateColor(pt.ModelPointState),
                      }"
                      >{{ stateLabel(pt.ModelPointState) }}</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-gray-500 text-sm text-center py-4">
            {{ $t('plugins.tenmicron.builder.noPoints') }}
          </p>
        </div>

        <!-- ============================================================ -->
        <!-- TAB: Alignment Model                                          -->
        <!-- ============================================================ -->
        <div v-if="tmStore.activeTab === 'model'" class="p-5 space-y-5">
          <!-- Refresh button -->
          <div class="flex justify-end">
            <button
              @click="loadAlignmentModel"
              :disabled="!tmStore.connected || tmStore.isRefreshing"
              class="px-4 py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-600/30 text-sm disabled:opacity-40 flex items-center gap-2"
            >
              <span
                v-if="tmStore.isRefreshing"
                class="inline-block w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"
              ></span>
              {{ $t('plugins.tenmicron.model.refresh') }}
            </button>
          </div>

          <div v-if="!tmStore.modelLoaded" class="text-gray-500 text-sm text-center py-6">
            {{ $t('plugins.tenmicron.model.noModel') }}
          </div>

          <template v-else>
            <!-- Info grid -->
            <div class="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
              <h3 class="text-sm font-semibold text-gray-300 mb-3">
                {{ $t('plugins.tenmicron.model.alignmentInfo') }}
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-sm">
                <div v-for="field in modelInfoFields" :key="field.label">
                  <span class="text-gray-500 text-xs block">{{ field.label }}</span>
                  <span class="text-white font-mono">{{ field.value }}</span>
                  <span v-if="field.unit" class="text-gray-500 text-xs ml-1">{{ field.unit }}</span>
                </div>
              </div>
            </div>

            <!-- Action row -->
            <div class="flex flex-wrap gap-3">
              <button
                @click="deleteWorstStar"
                :disabled="
                  !tmStore.connected ||
                  tmStore.isRefreshing ||
                  (tmStore.alignmentModel.alignmentStarCount ?? 0) === 0
                "
                class="px-4 py-2 rounded-lg bg-yellow-600/20 border border-yellow-500/40 text-yellow-200 hover:bg-yellow-600/30 text-sm disabled:opacity-40"
              >
                {{ $t('plugins.tenmicron.model.deleteWorstStar') }}
              </button>
              <button
                @click="confirmClearAlignment"
                :disabled="!tmStore.connected || tmStore.isRefreshing"
                class="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/40 text-red-200 hover:bg-red-600/30 text-sm disabled:opacity-40"
              >
                {{ $t('plugins.tenmicron.model.clearAlignment') }}
              </button>
            </div>

            <!-- Polar plot of alignment stars -->
            <div
              v-if="tmStore.alignmentModel.alignmentStars.length > 0"
              class="rounded-xl border border-gray-700 bg-gray-800/60 p-4"
            >
              <h3 class="text-sm font-semibold text-gray-300 mb-3">
                {{ $t('plugins.tenmicron.model.starsChart') }}
              </h3>
              <div class="flex justify-center">
                <svg :width="plotSize" :height="plotSize" class="overflow-visible">
                  <g :transform="`translate(${plotSize / 2}, ${plotSize / 2})`">
                    <circle
                      v-for="ring in [30, 60, 90]"
                      :key="ring"
                      :r="altToRadius(ring)"
                      fill="none"
                      stroke="#374151"
                      stroke-width="1"
                    />
                    <line
                      v-for="az in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]"
                      :key="az"
                      :x1="0"
                      :y1="0"
                      :x2="azToX(az, 90)"
                      :y2="azToY(az, 90)"
                      stroke="#374151"
                      stroke-width="0.5"
                    />
                    <text
                      :x="azToX(0, 90) * 1.08"
                      :y="azToY(0, 90) * 1.08 + 4"
                      fill="#9CA3AF"
                      font-size="10"
                      text-anchor="middle"
                    >
                      N
                    </text>
                    <text
                      :x="azToX(90, 90) * 1.08"
                      :y="azToY(90, 90) * 1.08 + 4"
                      fill="#9CA3AF"
                      font-size="10"
                      text-anchor="middle"
                    >
                      E
                    </text>
                    <text
                      :x="azToX(180, 90) * 1.08"
                      :y="azToY(180, 90) * 1.08 + 4"
                      fill="#9CA3AF"
                      font-size="10"
                      text-anchor="middle"
                    >
                      S
                    </text>
                    <text
                      :x="azToX(270, 90) * 1.08"
                      :y="azToY(270, 90) * 1.08 + 4"
                      fill="#9CA3AF"
                      font-size="10"
                      text-anchor="middle"
                    >
                      W
                    </text>
                    <!-- Stars sized by error -->
                    <circle
                      v-for="star in tmStore.alignmentModel.alignmentStars"
                      :key="`${star.Azimuth}-${star.Altitude}`"
                      :cx="azToX(star.Azimuth, star.Altitude)"
                      :cy="azToY(star.Azimuth, star.Altitude)"
                      :r="Math.max(4, Math.min(12, star.ErrorPointRadius ?? 5))"
                      fill="#60A5FA"
                      fill-opacity="0.7"
                      stroke="#1F2937"
                      stroke-width="1"
                    >
                      <title>
                        Az {{ star.Azimuth }}° Alt {{ star.Altitude }}° Error
                        {{ star.ErrorArcsec }}"
                      </title>
                    </circle>
                  </g>
                </svg>
              </div>
            </div>

            <!-- Stars table -->
            <div class="rounded-xl border border-gray-700 bg-gray-800/60 overflow-hidden">
              <table class="w-full text-xs text-gray-300">
                <thead class="bg-gray-700/60 text-gray-400 uppercase">
                  <tr>
                    <th class="px-3 py-2 text-right">#</th>
                    <th class="px-3 py-2 text-right">Az (°)</th>
                    <th class="px-3 py-2 text-right">Alt (°)</th>
                    <th class="px-3 py-2 text-right">Error (")</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(star, i) in tmStore.alignmentModel.alignmentStars"
                    :key="i"
                    class="border-t border-gray-700/50"
                  >
                    <td class="px-3 py-1 text-right">{{ i + 1 }}</td>
                    <td class="px-3 py-1 text-right">{{ star.Azimuth }}</td>
                    <td class="px-3 py-1 text-right">{{ star.Altitude }}</td>
                    <td
                      class="px-3 py-1 text-right"
                      :class="star.ErrorArcsec > 60 ? 'text-red-400' : 'text-green-400'"
                    >
                      {{ star.ErrorArcsec }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <!-- ============================================================ -->
        <!-- TAB: Model Library                                            -->
        <!-- ============================================================ -->
        <div v-if="tmStore.activeTab === 'library'" class="p-5 space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-semibold text-gray-300">
              {{ $t('plugins.tenmicron.library.savedModels') }}
            </h3>
            <button
              @click="loadModelNames"
              :disabled="!tmStore.connected || tmStore.isRefreshing"
              class="px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-600/30 text-xs disabled:opacity-40 flex items-center gap-1.5"
            >
              <svg
                v-if="tmStore.isRefreshing"
                class="animate-spin h-3 w-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {{ $t('plugins.tenmicron.library.refresh') }}
            </button>
          </div>

          <!-- Save new model -->
          <div class="flex gap-2">
            <input
              v-model="newModelName"
              type="text"
              :placeholder="$t('plugins.tenmicron.library.namePlaceholder')"
              class="flex-1 rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm"
            />
            <button
              @click="saveModel"
              :disabled="!tmStore.connected || !newModelName.trim()"
              class="px-4 py-2 rounded-lg bg-green-600/20 border border-green-500/40 text-green-200 hover:bg-green-600/30 text-sm disabled:opacity-40"
            >
              {{ $t('plugins.tenmicron.library.save') }}
            </button>
          </div>

          <div
            v-if="tmStore.modelNames.length === 0"
            class="text-gray-500 text-sm text-center py-6"
          >
            {{ $t('plugins.tenmicron.library.noModels') }}
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="name in tmStore.modelNames"
              :key="name"
              class="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-2"
            >
              <span class="flex-1 text-sm text-white font-mono">{{ name }}</span>
              <button
                @click="loadModel(name)"
                :disabled="!tmStore.connected || tmStore.isRefreshing"
                class="px-3 py-1 rounded-md bg-cyan-600/20 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-600/30 text-xs disabled:opacity-40"
              >
                {{ $t('plugins.tenmicron.library.load') }}
              </button>
              <button
                @click="deleteModel(name)"
                :disabled="!tmStore.connected || tmStore.isRefreshing"
                class="px-3 py-1 rounded-md bg-red-600/20 border border-red-500/40 text-red-200 hover:bg-red-600/30 text-xs disabled:opacity-40"
              >
                {{ $t('plugins.tenmicron.library.delete') }}
              </button>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- TAB: Mount Info                                               -->
        <!-- ============================================================ -->
        <div v-if="tmStore.activeTab === 'mount'" class="p-5 space-y-5">
          <!-- Mount Information (read-only) -->
          <div class="rounded-xl border border-gray-700 bg-gray-800/60 p-4 space-y-3">
            <h3 class="text-sm font-semibold text-gray-300">
              {{ $t('plugins.tenmicron.mount.info') }}
            </h3>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.product') }}</span>
              <span class="text-white font-mono">{{ tmStore.mountProductName || '—' }}</span>
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.firmware') }}</span>
              <span class="text-white font-mono">{{ tmStore.mountFirmwareVersion || '—' }}</span>
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.firmwareDate') }}</span>
              <span class="text-white font-mono">{{ tmStore.mountFirmwareTimestamp || '—' }}</span>
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.ip') }}</span>
              <span class="text-white font-mono">{{ tmStore.mountIPAddress || '—' }}</span>
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.mac') }}</span>
              <span class="text-white font-mono">{{ tmStore.mountMACAddress || '—' }}</span>
            </div>
          </div>

          <!-- Mount Status -->
          <div class="rounded-xl border border-gray-700 bg-gray-800/60 p-4 space-y-3">
            <h3 class="text-sm font-semibold text-gray-300">
              {{ $t('plugins.tenmicron.mount.statusTitle') }}
            </h3>
            <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm items-center">
              <!-- Mount Status badge -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.statusTitle') }}</span>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 w-fit"
              >
                {{ tmStore.mountStatus || '—' }}
              </span>

              <!-- GPS Time Sync -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.gpsSync') }}</span>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit',
                  tmStore.gpsSyncState === 'Off' || tmStore.gpsSyncState === 'Unknown'
                    ? 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                    : 'bg-green-600/20 text-green-300 border border-green-500/30',
                ]"
              >
                {{ tmStore.gpsSyncState }}
              </span>

              <!-- Tracking Rate -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.trackingRate') }}</span>
              <span class="text-white font-mono">
                {{
                  tmStore.trackingRateArcsecPerSec !== undefined
                    ? tmStore.trackingRateArcsecPerSec.toFixed(4)
                    : '—'
                }}
                <span class="text-gray-500 text-xs ml-1">{{
                  $t('plugins.tenmicron.mount.arcsecPerSec')
                }}</span>
              </span>

              <!-- Slew Settle -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.slewSettle') }}</span>
              <div class="flex items-center gap-2">
                <span class="text-white font-mono">
                  {{ tmStore.slewSettleTimeSeconds }}
                  <span class="text-gray-500 text-xs ml-0.5">{{
                    $t('plugins.tenmicron.mount.seconds')
                  }}</span>
                </span>
                <button
                  @click="resetSlewSettle"
                  :disabled="!tmStore.connected || tmStore.isRefreshing"
                  class="px-2 py-0.5 rounded-md bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 text-xs disabled:opacity-40"
                >
                  {{ $t('plugins.tenmicron.mount.reset') }}
                </button>
              </div>

              <!-- Meridian Limit -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.meridianLimit') }}</span>
              <div class="flex items-center gap-2">
                <span class="text-white font-mono">
                  {{ tmStore.meridianLimitDegrees }}
                  <span class="text-gray-500 text-xs ml-0.5">{{
                    $t('plugins.tenmicron.mount.degrees')
                  }}</span>
                </span>
                <button
                  @click="resetMeridianLimit"
                  :disabled="!tmStore.connected || tmStore.isRefreshing"
                  class="px-2 py-0.5 rounded-md bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 text-xs disabled:opacity-40"
                >
                  {{ $t('plugins.tenmicron.mount.reset') }}
                </button>
              </div>

              <!-- Unattended Flip -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.unattendedFlip') }}</span>
              <div class="flex items-center gap-2">
                <span
                  :class="tmStore.unattendedFlipEnabled ? 'text-cyan-300' : 'text-gray-400'"
                  class="text-xs font-semibold"
                >
                  {{ tmStore.unattendedFlipEnabled ? 'ON' : 'OFF' }}
                </span>
                <button
                  v-if="tmStore.unattendedFlipEnabled"
                  @click="disableUnattendedFlip"
                  :disabled="!tmStore.connected || tmStore.isRefreshing"
                  class="px-2 py-0.5 rounded-md bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 text-xs disabled:opacity-40"
                >
                  {{ $t('plugins.tenmicron.mount.disable') }}
                </button>
              </div>

              <!-- Refraction Temperature -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.refractionTemp') }}</span>
              <span class="text-white font-mono">
                {{ tmStore.refractionTemperature }}
                <span class="text-gray-500 text-xs ml-0.5">{{
                  $t('plugins.tenmicron.mount.celsius')
                }}</span>
              </span>

              <!-- Refraction Pressure -->
              <span class="text-gray-400">{{
                $t('plugins.tenmicron.mount.refractionPressure')
              }}</span>
              <span class="text-white font-mono">
                {{ tmStore.refractionPressure }}
                <span class="text-gray-500 text-xs ml-0.5">{{
                  $t('plugins.tenmicron.mount.hPa')
                }}</span>
              </span>

              <!-- DeltaT Expiration -->
              <span class="text-gray-400">{{
                $t('plugins.tenmicron.mount.deltaTExpiration')
              }}</span>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit',
                  !tmStore.deltaTExpiration
                    ? 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                    : tmStore.deltaTValid
                      ? 'bg-green-600/20 text-green-300 border border-green-500/30'
                      : 'bg-red-600/20 text-red-300 border border-red-500/30',
                ]"
              >
                {{ tmStore.deltaTExpiration || '—' }}
              </span>

              <!-- Mount Local Time -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.localTime') }}</span>
              <span class="text-white font-mono">{{ tmStore.mountLocalTime || '—' }}</span>

              <!-- Mount Local Date -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.localDate') }}</span>
              <span class="text-white font-mono">{{ tmStore.mountLocalDate || '—' }}</span>

              <!-- Sidereal Time -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.siderealTime') }}</span>
              <span class="text-white font-mono">{{ tmStore.mountSiderealTime || '—' }}</span>

              <!-- Connection Type -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.connectionType') }}</span>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit',
                  tmStore.connectionType === 'LAN' || tmStore.connectionType === 'WiFi'
                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-gray-600/20 text-gray-400 border border-gray-600/30',
                ]"
              >
                {{ tmStore.connectionType || '—' }}
              </span>

              <!-- Slew Rate -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.slewRate') }}</span>
              <div
                class="w-28 tns-picker"
                :class="{
                  'opacity-40 pointer-events-none': !tmStore.connected || tmStore.isRefreshing,
                }"
              >
                <NumberInputPicker
                  v-model="slewRateInput"
                  labelKey="plugins.tenmicron.mount.slewRate"
                  :min="tmStore.slewRateMin ?? 2"
                  :max="tmStore.slewRateMax ?? 15"
                  :step="1"
                  :decimalPlaces="0"
                  wrapperClass="w-full"
                  @change="setSlewRate"
                />
              </div>

              <!-- Horizon Limit High -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.horizonHigh') }}</span>
              <div
                class="w-28 tns-picker"
                :class="{
                  'opacity-40 pointer-events-none': !tmStore.connected || tmStore.isRefreshing,
                }"
              >
                <NumberInputPicker
                  v-model="horizonHighInput"
                  labelKey="plugins.tenmicron.mount.horizonHigh"
                  :min="0"
                  :max="90"
                  :step="1"
                  :decimalPlaces="0"
                  wrapperClass="w-full"
                  @change="setHorizonHigh"
                />
              </div>

              <!-- Horizon Limit Low -->
              <span class="text-gray-400">{{ $t('plugins.tenmicron.mount.horizonLow') }}</span>
              <div
                class="w-28 tns-picker"
                :class="{
                  'opacity-40 pointer-events-none': !tmStore.connected || tmStore.isRefreshing,
                }"
              >
                <NumberInputPicker
                  v-model="horizonLowInput"
                  labelKey="plugins.tenmicron.mount.horizonLow"
                  :min="-5"
                  :max="45"
                  :step="1"
                  :decimalPlaces="0"
                  wrapperClass="w-full"
                  @change="setHorizonLow"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- end tab container -->

      <!-- Error toast -->
      <div
        v-if="tmStore.lastError"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-800 border border-red-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm max-w-sm z-50"
        @click="tmStore.clearError()"
      >
        {{ tmStore.lastError }}
      </div>

      <!-- Clear alignment confirm modal -->
      <div
        v-if="showClearConfirm"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        @click.self="showClearConfirm = false"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full mx-4 space-y-4"
        >
          <h3 class="text-lg font-semibold text-white">
            {{ $t('plugins.tenmicron.model.clearConfirmTitle') }}
          </h3>
          <p class="text-gray-300 text-sm">{{ $t('plugins.tenmicron.model.clearConfirmMsg') }}</p>
          <div class="flex gap-3 justify-end">
            <button
              @click="showClearConfirm = false"
              class="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm"
            >
              {{ $t('plugins.tenmicron.cancel') }}
            </button>
            <button
              @click="clearAlignment"
              class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 text-sm font-semibold"
            >
              {{ $t('plugins.tenmicron.model.clearAlignment') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { hmsToDegrees, dmsToDegrees, degreesToHMS, degreesToDMS } from '@/utils/utils';
import { useI18n } from 'vue-i18n';
import { useTenMicronStore } from '../store/tenMicronStore';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';

const { t } = useI18n();
const tmStore = useTenMicronStore();
const mainStore = apiStore();
const isCameraConnected = computed(() => Boolean(mainStore.cameraInfo?.Connected));

const starCount = ref(tmStore.goldenSpiralStarCount);

// Sidereal Path generator state
const generatorType = ref('goldenSpiral'); // 'goldenSpiral' | 'siderealPath'
// RA as colon-separated string HH:MM:SS.s (mirrors slew/center input style)
const siderealRaStr = ref('0:00:00.0');
// Dec as colon-separated string +/-DD:MM:SS.s
const siderealDecStr = ref('+00:00:00.0');
const siderealRaDelta = ref(1.5);

// Convert display strings → decimal values for the API
function raToDecimal() {
  // hmsToDegrees returns degrees (h×15); divide back to hours
  return hmsToDegrees(siderealRaStr.value) / 15;
}
function decToDecimal() {
  return dmsToDegrees(siderealDecStr.value);
}
// Decompose decimal hours → HH:MM:SS.s string
function setRaFromDecimal(hours) {
  siderealRaStr.value = degreesToHMS(hours * 15);
}
// Decompose decimal degrees → +/-DD:MM:SS.s string
function setDecFromDecimal(deg) {
  siderealDecStr.value = degreesToDMS(deg);
}
const SIDEREAL_START_PROVIDERS = ['Now', 'Nautical Dusk', 'Sunset', 'Astronomical Dusk'];
const SIDEREAL_END_PROVIDERS = ['Now', 'Nautical Dawn', 'Sunrise', 'Astronomical Dawn'];
const siderealStartProvider = ref('Nautical Dusk');
const siderealEndProvider = ref('Nautical Dawn');
const siderealStartOffset = ref(0);
const siderealEndOffset = ref(0);
const newModelName = ref('');
const showClearConfirm = ref(false);
const slewRateInput = ref(tmStore.slewRate ?? 15);
const horizonHighInput = ref(tmStore.horizonLimitHigh ?? 90);
const horizonLowInput = ref(tmStore.horizonLimitLow ?? 0);

// keep picker refs in sync when status is refreshed from the mount
watch(
  () => tmStore.slewRate,
  (v) => {
    if (v !== null) slewRateInput.value = v;
  }
);
watch(
  () => tmStore.horizonLimitHigh,
  (v) => {
    if (v !== null) horizonHighInput.value = v;
  }
);
watch(
  () => tmStore.horizonLimitLow,
  (v) => {
    if (v !== null) horizonLowInput.value = v;
  }
);
const plotSize = 260;

// ── builder option local refs (kept in sync with store) ──────────────────────
const optMinAlt = ref(tmStore.builderOptions.minPointAltitude);
const optMaxAlt = ref(tmStore.builderOptions.maxPointAltitude);
const optMinAz = ref(tmStore.builderOptions.minPointAzimuth);
const optMaxAz = ref(tmStore.builderOptions.maxPointAzimuth);
const optMaxRMS = ref(tmStore.builderOptions.maxPointRMS);
const optShowRemoved = ref(tmStore.builderOptions.showRemovedPoints);
const optMinimizeMeridian = ref(tmStore.builderOptions.minimizeMeridianFlips);
const optNumRetries = ref(tmStore.builderOptions.builderNumRetries);
const optRemoveHighRMS = ref(tmStore.builderOptions.removeHighRMSAfterBuild);
const optLogCommands = ref(tmStore.builderOptions.logCommands);
const optMaxConcurrency = ref(tmStore.builderOptions.maxConcurrency);
const optAllowBlindSolves = ref(tmStore.builderOptions.allowBlindSolves);
const optOptimizeDome = ref(tmStore.builderOptions.optimizeDome);
const optWestToEast = ref(tmStore.builderOptions.westToEast);
const optPlateSolveSubframe = ref(tmStore.builderOptions.plateSolveSubframe);
const optAlternateDirection = ref(tmStore.builderOptions.alternateDirection);
const optDisableRefractionCorrection = ref(tmStore.builderOptions.disableRefractionCorrection);
const optDecJitter = ref(tmStore.builderOptions.decJitter);
const optDisableDAT = ref(tmStore.builderOptions.disableDAT);

// ── tabs ──────────────────────────────────────────────────────────────────────
const tabs = computed(() => [
  { id: 'builder', label: t('plugins.tenmicron.tabs.builder') },
  { id: 'model', label: t('plugins.tenmicron.tabs.model') },
  { id: 'library', label: t('plugins.tenmicron.tabs.library') },
  { id: 'mount', label: t('plugins.tenmicron.tabs.mount') },
]);

// ── scatter chart helpers (Az/Alt) ────────────────────────────────────────────
const scatterH = 180;
const scatterPadL = 40;
const scatterPadR = 16;
const scatterPadT = 16;
const scatterPadB = 36;

// Actual chart content width tracked by ResizeObserver
const scatterContainerRef = ref(null);
const scatterActualW = ref(300);
let scatterResizeObserver = null;

watch(scatterContainerRef, (el) => {
  scatterResizeObserver?.disconnect();
  if (el) {
    scatterResizeObserver = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 300;
      scatterActualW.value = Math.max(100, w - scatterPadL - scatterPadR);
    });
    scatterResizeObserver.observe(el);
  }
});

// Zoom-to-fit for sidereal path; full sky for golden spiral
const scatterDomain = computed(() => {
  const pts = tmStore.modelPoints;
  if (!pts.length || generatorType.value !== 'siderealPath') {
    return { azMin: 0, azMax: 360, altMin: 0, altMax: 90 };
  }

  const azVals = pts.map((p) => p.Azimuth);
  const altVals = pts.map((p) => p.Altitude);
  const azSpan = Math.max(Math.max(...azVals) - Math.min(...azVals), 20);
  const altSpan = Math.max(Math.max(...altVals) - Math.min(...altVals), 10);
  const azPad = azSpan * 0.1;
  const altPad = altSpan * 0.12;

  return {
    azMin: Math.max(0, Math.floor((Math.min(...azVals) - azPad) / 10) * 10),
    azMax: Math.min(360, Math.ceil((Math.max(...azVals) + azPad) / 10) * 10),
    altMin: Math.max(0, Math.floor((Math.min(...altVals) - altPad) / 5) * 5),
    altMax: Math.min(90, Math.ceil((Math.max(...altVals) + altPad) / 5) * 5),
  };
});

// Pick a "nice" step size that yields roughly targetCount ticks over a span
function niceStep(span, targetCount) {
  const rough = span / targetCount;
  for (const c of [1, 2, 5, 10, 15, 20, 30, 45, 60, 90]) {
    if (c >= rough) return c;
  }
  return 90;
}

function makeTicks(min, max) {
  const step = niceStep(max - min, 6);
  const ticks = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) {
    ticks.push(Math.round(t));
  }
  return ticks;
}

const azTicks = computed(() => makeTicks(scatterDomain.value.azMin, scatterDomain.value.azMax));
const altTicks = computed(() => makeTicks(scatterDomain.value.altMin, scatterDomain.value.altMax));

function scatterAzX(az) {
  const { azMin, azMax } = scatterDomain.value;
  return ((az - azMin) / (azMax - azMin)) * scatterActualW.value;
}

function scatterAltY(alt) {
  const { altMin, altMax } = scatterDomain.value;
  return scatterH - ((alt - altMin) / (altMax - altMin)) * scatterH;
}

// ── polar chart helpers (used by alignment stars chart) ──────────────────────
const maxRadius = plotSize / 2 - 20;

function altToRadius(alt) {
  return maxRadius * (1 - alt / 90);
}

function azToX(az, alt) {
  const r = altToRadius(alt);
  const rad = ((az - 90) * Math.PI) / 180;
  return r * Math.cos(rad);
}

function azToY(az, alt) {
  const r = altToRadius(alt);
  const rad = ((az - 90) * Math.PI) / 180;
  return r * Math.sin(rad);
}

// States that make a point unusable (excluded or failed)
const UNUSABLE_STATES = new Set([97, 98, 99, 100, 101]);
const usableModelPoints = computed(() =>
  tmStore.modelPoints.filter((p) => !UNUSABLE_STATES.has(p.ModelPointState))
);

// ── point state labels & colours (mirrors ModelPointStateEnum from C# plugin) ──
const STATE_LABELS = {
  0: 'Generated',
  1: 'Up Next',
  2: 'Exposing',
  3: 'Processing',
  4: 'Added to Model',
  97: 'Failed',
  98: 'High RMS',
  99: 'Outside Alt Bounds',
  100: 'Outside Az Bounds',
  101: 'Below Horizon',
  102: 'Near Meridian',
};

function stateLabel(state) {
  return STATE_LABELS[state] ?? 'Unknown';
}

const STATE_COLORS = {
  0: '#90EE90', // Generated      → LightGreen
  1: '#9ACD32', // UpNext         → YellowGreen
  2: '#ADD8E6', // Exposing       → LightBlue
  3: '#0000FF', // Processing     → Blue
  4: '#00FF00', // AddedToModel   → Green
  97: '#FF0000', // Failed         → Red
  98: '#FF4500', // FailedRMS      → OrangeRed
  99: '#808080', // OutsideAltBounds → Gray
  100: '#808080', // OutsideAzBounds  → Gray
  101: '#808080', // BelowHorizon     → Gray
  102: '#FFD700', // CloseToMeridian  → Gold
};

function stateColor(state) {
  return STATE_COLORS[state] ?? '#6B7280';
}

const stateLegend = [
  { label: 'Generated', color: STATE_COLORS[0] },
  { label: 'Up Next', color: STATE_COLORS[1] },
  { label: 'Exposing', color: STATE_COLORS[2] },
  { label: 'Processing', color: STATE_COLORS[3] },
  { label: 'Added', color: STATE_COLORS[4] },
  { label: 'Failed', color: STATE_COLORS[97] },
  { label: 'High RMS', color: STATE_COLORS[98] },
  { label: 'Excluded', color: STATE_COLORS[99] },
  { label: 'Near Meridian', color: STATE_COLORS[102] },
];

// ── model info fields ─────────────────────────────────────────────────────────
const DEG_TO_ARCSEC = 3600;

const modelInfoFields = computed(() => {
  const m = tmStore.alignmentModel;
  return [
    { label: t('plugins.tenmicron.model.stars'), value: m.alignmentStarCount, unit: '' },
    { label: t('plugins.tenmicron.model.rmsError'), value: m.rmsError?.toFixed(2), unit: '"' },
    { label: t('plugins.tenmicron.model.modelTerms'), value: m.modelTerms, unit: '' },
    {
      label: t('plugins.tenmicron.model.polarAlt'),
      value: m.rightAscensionAltitude?.toFixed(3),
      unit: '°',
    },
    {
      label: t('plugins.tenmicron.model.polarAz'),
      value: m.rightAscensionAzimuth?.toFixed(3),
      unit: '°',
    },
    {
      label: t('plugins.tenmicron.model.polarError'),
      value: (m.polarAlignErrorDegrees * DEG_TO_ARCSEC).toFixed(1),
      unit: '"',
    },
    {
      label: t('plugins.tenmicron.model.paAltError'),
      value: (m.paErrorAltitudeDegrees * DEG_TO_ARCSEC).toFixed(1),
      unit: '"',
    },
    {
      label: t('plugins.tenmicron.model.paAzError'),
      value: (m.paErrorAzimuthDegrees * DEG_TO_ARCSEC).toFixed(1),
      unit: '"',
    },
    {
      label: t('plugins.tenmicron.model.paAngle'),
      value: m.rightAscensionPolarPositionAngleDegrees?.toFixed(3),
      unit: '°',
    },
    {
      label: t('plugins.tenmicron.model.coneError'),
      value: (m.orthogonalityErrorDegrees * DEG_TO_ARCSEC).toFixed(1),
      unit: '"',
    },
    {
      label: t('plugins.tenmicron.model.azTurns'),
      value: m.azimuthAdjustmentTurns?.toFixed(2),
      unit: 'turns',
    },
    {
      label: t('plugins.tenmicron.model.altTurns'),
      value: m.altitudeAdjustmentTurns?.toFixed(2),
      unit: 'turns',
    },
  ];
});

// ── API calls ─────────────────────────────────────────────────────────────────
async function fetchStatus() {
  try {
    const data = await apiService.tenMicronGetStatus();
    if (data?.Success) tmStore.setStatus(data);
  } catch {
    /* ignore polling errors silently */
  }
}

async function fetchMountTime() {
  try {
    const data = await apiService.tenMicronGetMountTime();
    if (data?.Success) tmStore.setMountTime(data);
  } catch {
    /* ignore polling errors silently */
  }
}

async function loadBuilderStatus() {
  try {
    const data = await apiService.tenMicronGetBuilderStatus();
    if (data?.Success) tmStore.setBuilderStatus(data);
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function loadBuilderOptions() {
  try {
    const data = await apiService.tenMicronGetBuilderOptions();
    if (data?.Success) {
      tmStore.setBuilderOptions(data);
      optMinAlt.value = tmStore.builderOptions.minPointAltitude;
      optMaxAlt.value = tmStore.builderOptions.maxPointAltitude;
      optMinAz.value = tmStore.builderOptions.minPointAzimuth;
      optMaxAz.value = tmStore.builderOptions.maxPointAzimuth;
      optMaxRMS.value = tmStore.builderOptions.maxPointRMS;
      optShowRemoved.value = tmStore.builderOptions.showRemovedPoints;
      optMinimizeMeridian.value = tmStore.builderOptions.minimizeMeridianFlips;
      optNumRetries.value = tmStore.builderOptions.builderNumRetries;
      optRemoveHighRMS.value = tmStore.builderOptions.removeHighRMSAfterBuild;
      optLogCommands.value = tmStore.builderOptions.logCommands;
      optMaxConcurrency.value = tmStore.builderOptions.maxConcurrency;
      optAllowBlindSolves.value = tmStore.builderOptions.allowBlindSolves;
      optOptimizeDome.value = tmStore.builderOptions.optimizeDome;
      optWestToEast.value = tmStore.builderOptions.westToEast;
      optPlateSolveSubframe.value = tmStore.builderOptions.plateSolveSubframe;
      optAlternateDirection.value = tmStore.builderOptions.alternateDirection;
      optDisableRefractionCorrection.value = tmStore.builderOptions.disableRefractionCorrection;
      optDecJitter.value = tmStore.builderOptions.decJitter;
      optDisableDAT.value = tmStore.builderOptions.disableDAT;
    }
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function setOption(key, value) {
  try {
    await apiService.tenMicronSetBuilderOption(key, value);
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function resetBuilderOptions() {
  try {
    const data = await apiService.tenMicronResetBuilderOptions();
    if (data?.Success) {
      tmStore.setBuilderOptions(data);
      optMinAlt.value = tmStore.builderOptions.minPointAltitude;
      optMaxAlt.value = tmStore.builderOptions.maxPointAltitude;
      optMinAz.value = tmStore.builderOptions.minPointAzimuth;
      optMaxAz.value = tmStore.builderOptions.maxPointAzimuth;
      optMaxRMS.value = tmStore.builderOptions.maxPointRMS;
      optShowRemoved.value = tmStore.builderOptions.showRemovedPoints;
      optMinimizeMeridian.value = tmStore.builderOptions.minimizeMeridianFlips;
      optNumRetries.value = tmStore.builderOptions.builderNumRetries;
      optRemoveHighRMS.value = tmStore.builderOptions.removeHighRMSAfterBuild;
      optLogCommands.value = tmStore.builderOptions.logCommands;
      optMaxConcurrency.value = tmStore.builderOptions.maxConcurrency;
      optAllowBlindSolves.value = tmStore.builderOptions.allowBlindSolves;
      optOptimizeDome.value = tmStore.builderOptions.optimizeDome;
      optWestToEast.value = tmStore.builderOptions.westToEast;
      optPlateSolveSubframe.value = tmStore.builderOptions.plateSolveSubframe;
      optAlternateDirection.value = tmStore.builderOptions.alternateDirection;
      optDisableRefractionCorrection.value = tmStore.builderOptions.disableRefractionCorrection;
      optDecJitter.value = tmStore.builderOptions.decJitter;
      optDisableDAT.value = tmStore.builderOptions.disableDAT;
    }
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function toggleOption(key, currentValue) {
  const newVal = !currentValue;
  await setOption(key, newVal);
  // Update the corresponding ref
  if (key === 'ShowRemovedPoints') optShowRemoved.value = newVal;
  else if (key === 'MinimizeMeridianFlips') optMinimizeMeridian.value = newVal;
  else if (key === 'RemoveHighRMSAfterBuild') optRemoveHighRMS.value = newVal;
  else if (key === 'LogCommands') optLogCommands.value = newVal;
  else if (key === 'AllowBlindSolves') optAllowBlindSolves.value = newVal;
  else if (key === 'OptimizeDome') optOptimizeDome.value = newVal;
  else if (key === 'WestToEast') optWestToEast.value = newVal;
  else if (key === 'AlternateDirection') optAlternateDirection.value = newVal;
  else if (key === 'DisableRefractionCorrection') optDisableRefractionCorrection.value = newVal;
  else if (key === 'DisableDAT') optDisableDAT.value = newVal;
}

async function loadAlignmentModel() {
  tmStore.isRefreshing = true;
  try {
    const data = await apiService.tenMicronGetAlignmentModel();
    if (data?.Success !== false) tmStore.setAlignmentModel(data ?? {});
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

async function loadModelNames() {
  tmStore.isRefreshing = true;
  try {
    const data = await apiService.tenMicronGetModelNames();
    if (data?.Success) tmStore.setModelNames(data.ModelNames);
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

async function generatePoints() {
  try {
    tmStore.isLoading = true;
    if (generatorType.value === 'goldenSpiral') {
      await apiService.tenMicronGenerateGoldenSpiral(starCount.value);
    } else {
      await apiService.tenMicronGenerateSiderealPath({
        ra: raToDecimal(),
        dec: decToDecimal(),
        raDelta: siderealRaDelta.value,
        startProvider: siderealStartProvider.value,
        endProvider: siderealEndProvider.value,
        startOffset: siderealStartOffset.value,
        endOffset: siderealEndOffset.value,
      });
    }
    await loadBuilderStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isLoading = false;
  }
}

async function fetchCoordsFromScope() {
  try {
    const res = await apiService.tenMicronSiderealCoordsFromScope();
    if (res?.Success) {
      setRaFromDecimal(res.RA);
      setDecFromDecimal(res.Dec);
    }
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function fetchCoordsFromSequence() {
  try {
    const res = await apiService.tenMicronSiderealCoordsFromSequence();
    if (res?.Success) {
      setRaFromDecimal(res.RA);
      setDecFromDecimal(res.Dec);
    }
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function clearPoints() {
  try {
    await apiService.tenMicronClearPoints();
    await loadBuilderStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function buildModel() {
  try {
    await apiService.tenMicronBuildModel();
    await fetchStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function cancelBuild() {
  try {
    await apiService.tenMicronCancelBuild();
    await fetchStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function stopBuild() {
  try {
    await apiService.tenMicronStopBuild();
    await fetchStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function loadModel(name) {
  try {
    await apiService.tenMicronLoadModel(name);
    await loadAlignmentModel();
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function saveModel() {
  if (!newModelName.value.trim()) return;
  tmStore.isRefreshing = true;
  try {
    await apiService.tenMicronSaveModel(newModelName.value.trim());
    newModelName.value = '';
    await loadModelNames();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

async function deleteModel(name) {
  tmStore.isRefreshing = true;
  try {
    await apiService.tenMicronDeleteModel(name);
    await loadModelNames();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

async function deleteWorstStar() {
  tmStore.isRefreshing = true;
  try {
    await apiService.tenMicronDeleteWorstStar();
    await loadAlignmentModel();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

function confirmClearAlignment() {
  showClearConfirm.value = true;
}

async function clearAlignment() {
  showClearConfirm.value = false;
  tmStore.isRefreshing = true;
  try {
    await apiService.tenMicronClearAlignment();
    await loadAlignmentModel();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

// ── mount tab actions ─────────────────────────────────────────────────────────
async function toggleDualAxisTracking() {
  try {
    await apiService.tenMicronSetDualAxisTracking(!tmStore.dualAxisTrackingEnabled);
    tmStore.dualAxisTrackingEnabled = !tmStore.dualAxisTrackingEnabled;
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function toggleRefractionCorrection() {
  try {
    await apiService.tenMicronSetRefractionCorrection(!tmStore.refractionCorrectionEnabled);
    tmStore.refractionCorrectionEnabled = !tmStore.refractionCorrectionEnabled;
  } catch (e) {
    tmStore.lastError = e?.message;
  }
}

async function disableUnattendedFlip() {
  tmStore.isRefreshing = true;
  try {
    await apiService.tenMicronDisableUnattendedFlip();
    await fetchStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

async function resetMeridianLimit() {
  tmStore.isRefreshing = true;
  try {
    await apiService.tenMicronResetMeridianLimit();
    await fetchStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

async function resetSlewSettle() {
  tmStore.isRefreshing = true;
  try {
    await apiService.tenMicronResetSlewSettle();
    await fetchStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

async function setSlewRate() {
  tmStore.isRefreshing = true;
  try {
    await apiService.tenMicronSetSlewRate(Math.round(slewRateInput.value));
    await fetchStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

async function setHorizonHigh() {
  tmStore.isRefreshing = true;
  try {
    await apiService.tenMicronSetHorizonHigh(Math.round(horizonHighInput.value));
    await fetchStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

async function setHorizonLow() {
  tmStore.isRefreshing = true;
  try {
    await apiService.tenMicronSetHorizonLow(Math.round(horizonLowInput.value));
    await fetchStatus();
  } catch (e) {
    tmStore.lastError = e?.message;
  } finally {
    tmStore.isRefreshing = false;
  }
}

// ── lifecycle ─────────────────────────────────────────────────────────────────
let pollTimer = null;

async function initialLoad() {
  await fetchStatus();
  await loadBuilderStatus();
  await loadBuilderOptions();
  await loadAlignmentModel();
  await loadModelNames();
}

onMounted(() => {
  initialLoad();
  // Poll builder status while build is in progress, otherwise lighter polling
  pollTimer = setInterval(async () => {
    await fetchStatus();
    if (tmStore.buildInProgress) {
      await loadBuilderStatus();
    }
    if (tmStore.activeTab === 'mount' && tmStore.connected) {
      await fetchMountTime();
    }
  }, 3000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  scatterResizeObserver?.disconnect();
});
</script>

<style scoped>
/* Rotate chevron when a details element is open */
details[open] > summary .summary-chevron {
  transform: rotate(90deg);
}

/* Scale NumberInputPicker controls down to h-8 / text-xs to match surrounding text */
:deep(.tns-picker button) {
  height: 2rem;
  font-size: 0.75rem;
  line-height: 1rem;
}
:deep(.tns-picker input[type='number']) {
  height: 2rem;
  font-size: 0.75rem;
  line-height: 1rem;
}
</style>
