<template>
  <!-- Hidden while the global PINS upgrade overlay (App.vue, z-[80]) owns the screen,
       so the two never stack. The wizard state survives in settingsStore. -->
  <teleport to="body">
    <div
      v-if="!pinsStore.shouldShowUpgradeOverlay"
      class="fixed inset-0 z-70 bg-ground/95 overflow-y-auto overscroll-contain"
    >
      <div class="min-h-full flex items-start sm:items-center justify-center p-4 py-8">
        <div class="w-full max-w-xl flex flex-col gap-4">
          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div>
              <h1 class="text-2xl font-bold text-content">
                {{ t('components.pinsWizard.title') }}
              </h1>
              <p class="text-sm text-content-muted">
                {{
                  t('components.pinsWizard.stepCounter', {
                    current: currentStepIndex + 1,
                    total: steps.length,
                  })
                }}
                — {{ t(currentStep.labelKey) }}
              </p>
            </div>
            <button
              class="tns-btn-ghost shrink-0"
              :title="t('components.pinsWizard.remindLater')"
              @click="remindLater"
            >
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <!-- Progress dots -->
          <div class="flex justify-center gap-2">
            <div
              v-for="(step, index) in steps"
              :key="step.id"
              class="h-2 rounded-full transition-all duration-300"
              :class="
                index === currentStepIndex
                  ? 'w-6 bg-accent'
                  : index < currentStepIndex
                    ? 'w-2 bg-accent/50'
                    : 'w-2 bg-line-strong'
              "
            ></div>
          </div>

          <!-- Step body -->
          <transition name="wizard-fade" mode="out-in">
            <div :key="currentStep.id" class="tns-card">
              <!-- Welcome -->
              <div v-if="currentStep.id === 'welcome'" class="flex flex-col gap-4">
                <h2 class="text-xl font-semibold text-content">
                  {{ t('components.pinsWizard.welcome.title') }}
                </h2>
                <p class="text-sm text-content-muted">
                  {{ t('components.pinsWizard.welcome.description') }}
                </p>
                <ul class="flex flex-col gap-2 text-sm text-content-muted">
                  <li v-for="step in steps.slice(1, -1)" :key="step.id" class="flex gap-2">
                    <span class="text-accent">•</span>
                    <span>{{ t(step.labelKey) }}</span>
                  </li>
                </ul>
              </div>

              <WizardWifiStep
                v-else-if="currentStep.id === 'wifi'"
                @completed="handleStepCompleted"
              />

              <WizardUpdatesStep
                v-else-if="currentStep.id === 'updates'"
                @completed="handleStepCompleted"
              />

              <WizardMountStep
                v-else-if="currentStep.id === 'mount'"
                @completed="handleStepCompleted"
              />

              <WizardSlewRateStep v-else-if="currentStep.id === 'slewRate'" />

              <WizardLocationStep
                v-else-if="currentStep.id === 'location'"
                @completed="handleStepCompleted"
              />

              <WizardCameraStep
                v-else-if="currentStep.id === 'camera'"
                @completed="handleStepCompleted"
              />

              <!-- Done -->
              <div v-else class="flex flex-col gap-4">
                <h2 class="text-xl font-semibold text-content">
                  {{ t('components.pinsWizard.done.title') }}
                </h2>
                <p class="text-sm text-content-muted">
                  {{ t('components.pinsWizard.done.description') }}
                </p>
                <p class="text-sm text-content-faint">
                  {{ t('components.pinsWizard.done.moreDevicesHint') }}
                </p>
              </div>
            </div>
          </transition>

          <!-- Footer navigation -->
          <div class="flex items-center gap-2">
            <button
              v-if="currentStepIndex > 0"
              class="tns-btn-secondary flex-1"
              @click="previousStep"
            >
              {{ t('components.pinsWizard.back') }}
            </button>
            <button v-if="isLastStep" class="tns-btn-primary flex-1" @click="finish">
              {{ t('components.pinsWizard.finish') }}
            </button>
            <template v-else>
              <button v-if="canSkipCurrentStep" class="tns-btn-secondary flex-1" @click="nextStep">
                {{ t('components.pinsWizard.skip') }}
              </button>
              <button class="tns-btn-primary flex-1" @click="nextStep">
                {{ t('components.pinsWizard.next') }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useSettingsStore } from '@/store/settingsStore';
import { usePinsStore } from '@/plugins/pins/store/pinsStore';
import WizardWifiStep from './steps/WizardWifiStep.vue';
import WizardUpdatesStep from './steps/WizardUpdatesStep.vue';
import WizardMountStep from './steps/WizardMountStep.vue';
import WizardSlewRateStep from './steps/WizardSlewRateStep.vue';
import WizardLocationStep from './steps/WizardLocationStep.vue';
import WizardCameraStep from './steps/WizardCameraStep.vue';

const emit = defineEmits(['close']);

const { t } = useI18n();
const settingsStore = useSettingsStore();
const pinsStore = usePinsStore();

// Adding a device step later means inserting one entry here plus its component
// branch above - nothing else in the shell is step-count aware.
const steps = [
  { id: 'welcome', labelKey: 'components.pinsWizard.steps.welcome', skippable: false },
  { id: 'wifi', labelKey: 'components.pinsWizard.steps.wifi', skippable: true },
  { id: 'updates', labelKey: 'components.pinsWizard.steps.updates', skippable: true },
  { id: 'mount', labelKey: 'components.pinsWizard.steps.mount', skippable: true },
  { id: 'slewRate', labelKey: 'components.pinsWizard.steps.slewRate', skippable: true },
  { id: 'location', labelKey: 'components.pinsWizard.steps.location', skippable: true },
  { id: 'camera', labelKey: 'components.pinsWizard.steps.camera', skippable: true },
  { id: 'done', labelKey: 'components.pinsWizard.steps.done', skippable: false },
];

function clampStep(step) {
  const parsed = Number.parseInt(step, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), steps.length);
}

// 1-based to match the persisted value in settingsStore.
const currentStepNumber = ref(clampStep(settingsStore.pinsWizard.currentStep));
const currentStepIndex = computed(() => currentStepNumber.value - 1);
const currentStep = computed(() => steps[currentStepIndex.value]);
const isLastStep = computed(() => currentStepNumber.value === steps.length);
const canSkipCurrentStep = computed(() => currentStep.value.skippable);

watch(currentStepNumber, (step) => settingsStore.setPinsWizardStep(step));

function nextStep() {
  if (currentStepNumber.value < steps.length) {
    currentStepNumber.value += 1;
  }
}

function previousStep() {
  if (currentStepNumber.value > 1) {
    currentStepNumber.value -= 1;
  }
}

// A step reports success (WiFi connected, no updates left, mount connected).
// Advancing is deliberate but not automatic-and-instant: the user still sees the
// result before pressing Next, except when the step explicitly asks to move on.
function handleStepCompleted({ advance = false } = {}) {
  if (advance) nextStep();
}

function remindLater() {
  emit('close');
}

function finish() {
  settingsStore.completePinsWizard();
  emit('close');
}
</script>

<style scoped>
.wizard-fade-enter-active,
.wizard-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.wizard-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.wizard-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
