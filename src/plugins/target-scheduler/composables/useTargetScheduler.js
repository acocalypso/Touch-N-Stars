import { computed, ref, watch } from 'vue';
import i18n from '@/i18n';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceV2Store } from '@/store/sequenceV2Store';
import { useFavTargetStore } from '@/store/favTargetsStore';
import { useToastStore } from '@/store/toastStore';
import {
  DEFAULT_MAX_CHUNK_MINUTES,
  DEFAULT_STEP_MINUTES,
  computeSchedulePlan,
  createDefaultTarget,
  createExposure,
  favoriteToTarget,
} from '../services/TargetSchedulerService';

const STORAGE_KEY = 'tns.targetScheduler.state.v1';
const DSO_CONTAINER_TYPE = 'NINA.Sequencer.Container.DeepSkyObjectContainer';
const SMART_EXPOSURE_TYPE = 'NINA.Sequencer.SequenceItem.Imaging.SmartExposure';
const ALTITUDE_CONDITION_TYPE = 'NINA.Sequencer.Conditions.AltitudeCondition';

function pad(value) {
  return String(value).padStart(2, '0');
}

function toInputDateTime(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultSessionStart() {
  const now = new Date();
  const d = new Date(now);
  d.setHours(18, 0, 0, 0);
  return d;
}

function defaultSessionEnd() {
  const d = defaultSessionStart();
  d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);
  return d;
}

function getTimeValueOrDefault(value, fallback) {
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? fallback : dt;
}

function collectByType(nodes, fullTypeName, acc = []) {
  if (!Array.isArray(nodes)) return acc;

  for (const node of nodes) {
    if (!node) continue;
    if (node.FullTypeName === fullTypeName) acc.push(node);
    if (Array.isArray(node.Items)) {
      collectByType(node.Items, fullTypeName, acc);
    }
  }

  return acc;
}

function findById(nodes, id) {
  if (!Array.isArray(nodes) || !id) return null;

  for (const node of nodes) {
    if (!node) continue;
    if (node.Id === id) return node;
    if (Array.isArray(node.Items)) {
      const nested = findById(node.Items, id);
      if (nested) return nested;
    }
  }

  return null;
}

function uniqueOrdered(values) {
  const seen = new Set();
  const out = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function normalizePersistedTarget(target) {
  const normalized = createDefaultTarget(target);
  normalized.exposures = (
    Array.isArray(target?.exposures) ? target.exposures : [createExposure()]
  ).map((exp) => createExposure(exp));
  return normalized;
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedState(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore persistence errors
  }
}

export function useTargetScheduler() {
  const t = i18n.global.t;

  const mainStore = apiStore();
  const settingsStore = useSettingsStore();
  const sequenceStore = useSequenceV2Store();
  const favoritesStore = useFavTargetStore();
  const toastStore = useToastStore();

  const persisted = loadPersistedState();

  const targets = ref(
    Array.isArray(persisted?.targets) && persisted.targets.length
      ? persisted.targets.map(normalizePersistedTarget)
      : []
  );

  const sessionStartInput = ref(
    persisted?.sessionStartInput || toInputDateTime(defaultSessionStart())
  );
  const sessionEndInput = ref(persisted?.sessionEndInput || toInputDateTime(defaultSessionEnd()));

  const stepMinutes = ref(
    Number.isFinite(Number(persisted?.stepMinutes))
      ? Number(persisted.stepMinutes)
      : DEFAULT_STEP_MINUTES
  );
  const maxChunkMinutes = ref(
    Number.isFinite(Number(persisted?.maxChunkMinutes))
      ? Number(persisted.maxChunkMinutes)
      : DEFAULT_MAX_CHUNK_MINUTES
  );

  const selectedTargetId = ref(targets.value[0]?.id || null);
  const isEditorOpen = ref(false);
  const editingTarget = ref(null);
  const showFavoritesPicker = ref(false);

  const isComputing = ref(false);
  const computeError = ref('');
  const scheduleResult = ref({
    generatedAt: null,
    session: null,
    segments: [],
    idleSegments: [],
    targets: [],
    unscheduled: [],
    errors: [],
  });

  const isApplyingToSequence = ref(false);

  const location = computed(() => {
    const profileCoords = mainStore.profileInfo?.AstrometrySettings || {};
    const coord = settingsStore.coordinates || {};

    const latitude = Number(
      coord.latitude ?? profileCoords.Latitude ?? profileCoords.latitude ?? null
    );

    const longitude = Number(
      coord.longitude ?? profileCoords.Longitude ?? profileCoords.longitude ?? null
    );

    const altitude = Number(
      coord.altitude ?? profileCoords.Elevation ?? profileCoords.elevation ?? 0
    );

    return {
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      altitude: Number.isFinite(altitude) ? altitude : 0,
    };
  });

  const selectedTarget = computed(
    () => targets.value.find((target) => target.id === selectedTargetId.value) || null
  );

  const favorites = computed(() =>
    Array.isArray(favoritesStore.favoriteTargets) ? favoritesStore.favoriteTargets : []
  );

  const canApplyToSequence = computed(
    () =>
      mainStore.isPINS ||
      mainStore.checkVersionNewerOrEqual(mainStore.currentTnsPluginVersion, '1.2.8.0')
  );

  const totalScheduledMinutes = computed(() =>
    scheduleResult.value.segments.reduce((sum, segment) => sum + (segment.durationMinutes || 0), 0)
  );

  const orderedScheduledTargetIds = computed(() =>
    uniqueOrdered(scheduleResult.value.segments.map((segment) => segment.targetId))
  );

  const targetSummaryById = computed(() => {
    const map = new Map();
    for (const summary of scheduleResult.value.targets || []) {
      map.set(summary.id, summary);
    }
    return map;
  });

  function persistState() {
    savePersistedState({
      targets: targets.value,
      sessionStartInput: sessionStartInput.value,
      sessionEndInput: sessionEndInput.value,
      stepMinutes: stepMinutes.value,
      maxChunkMinutes: maxChunkMinutes.value,
    });
  }

  function addTarget(partial) {
    const target = createDefaultTarget(partial || {});
    targets.value.push(target);
    selectedTargetId.value = target.id;
    isEditorOpen.value = false;
    editingTarget.value = null;
  }

  function updateTarget(updatedTarget) {
    const idx = targets.value.findIndex((target) => target.id === updatedTarget.id);
    if (idx < 0) return;
    const merged = createDefaultTarget({ ...targets.value[idx], ...updatedTarget });
    merged.id = targets.value[idx].id;
    merged.exposures = (Array.isArray(updatedTarget.exposures) ? updatedTarget.exposures : []).map(
      (exp) => createExposure(exp)
    );
    if (!merged.exposures.length) merged.exposures = [createExposure()];
    targets.value.splice(idx, 1, merged);
  }

  function removeTarget(targetId) {
    const idx = targets.value.findIndex((target) => target.id === targetId);
    if (idx < 0) return;
    targets.value.splice(idx, 1);
    if (selectedTargetId.value === targetId) {
      selectedTargetId.value = targets.value[0]?.id || null;
    }
  }

  function duplicateTarget(targetId) {
    const target = targets.value.find((item) => item.id === targetId);
    if (!target) return;
    const copy = createDefaultTarget({
      ...target,
      name: `${target.name} ${t('plugins.targetScheduler.common.copySuffix')}`,
      isFavoriteLinked: false,
      favoriteId: null,
    });
    copy.exposures = target.exposures.map((exp) => createExposure({ ...exp }));
    targets.value.push(copy);
    selectedTargetId.value = copy.id;
  }

  function reorderTargets(reordered) {
    targets.value = Array.isArray(reordered)
      ? reordered.map(normalizePersistedTarget)
      : targets.value;
  }

  function openCreateEditor(prefill = null) {
    editingTarget.value = prefill ? normalizePersistedTarget(prefill) : createDefaultTarget();
    isEditorOpen.value = true;
  }

  function openEditEditor(targetId) {
    const target = targets.value.find((item) => item.id === targetId);
    if (!target) return;
    editingTarget.value = normalizePersistedTarget(target);
    isEditorOpen.value = true;
  }

  function closeEditor() {
    isEditorOpen.value = false;
    editingTarget.value = null;
  }

  async function loadFavorites() {
    await favoritesStore.loadFavorites();
  }

  function addTargetFromFavorite(favorite) {
    const target = favoriteToTarget(favorite);
    targets.value.push(target);
    selectedTargetId.value = target.id;
  }

  function addAllFavorites() {
    for (const fav of favorites.value) {
      addTargetFromFavorite(fav);
    }
  }

  function removeAllTargets() {
    targets.value = [];
    selectedTargetId.value = null;
  }

  function recomputeSchedule() {
    isComputing.value = true;
    computeError.value = '';

    try {
      const sessionStart = getTimeValueOrDefault(sessionStartInput.value, defaultSessionStart());
      const sessionEnd = getTimeValueOrDefault(sessionEndInput.value, defaultSessionEnd());

      const result = computeSchedulePlan({
        targets: targets.value,
        sessionStart,
        sessionEnd,
        location: location.value,
        stepMinutes: stepMinutes.value,
        maxChunkMinutes: maxChunkMinutes.value,
      });

      scheduleResult.value = result;

      if (Array.isArray(result.errors) && result.errors.length) {
        computeError.value = result.errors.join(', ');
      }
    } catch (error) {
      console.error('[TargetScheduler] Failed to compute schedule', error);
      computeError.value = error?.message || t('plugins.targetScheduler.errors.computeFailed');
    } finally {
      isComputing.value = false;
    }
  }

  function getImagingContainer() {
    const containers = Array.isArray(sequenceStore.containers) ? sequenceStore.containers : [];
    if (!containers.length) return null;

    const byName = containers.find((container) => /imaging/i.test(container?.Name || ''));
    if (byName) return byName;

    return containers[1] || containers[0] || null;
  }

  function findTargetById(id) {
    return targets.value.find((target) => target.id === id) || null;
  }

  function getTargetOrderForExport() {
    const orderedFromSchedule = orderedScheduledTargetIds.value
      .map((id) => findTargetById(id))
      .filter(Boolean);

    const remaining = targets.value
      .filter((target) => !orderedFromSchedule.some((item) => item.id === target.id))
      .sort((a, b) => b.priority - a.priority);

    return [...orderedFromSchedule, ...remaining];
  }

  function getFilterIndexByName(filterName) {
    if (!filterName) return null;
    const filters = mainStore.filterInfo?.AvailableFilters || [];
    const index = filters.findIndex((filter) => filter.Name === filterName);
    return index >= 0 ? index + 1 : null;
  }

  async function addItemAndResolveNewNode(
    containerId,
    fullTypeName,
    propertyNameForList = 'Items'
  ) {
    const containerBefore = findById(sequenceStore.data, containerId);
    const listBefore = Array.isArray(containerBefore?.[propertyNameForList])
      ? containerBefore[propertyNameForList]
      : [];

    const beforeIds = new Set(listBefore.map((node) => node.Id));

    const insertTargetId = listBefore.length ? listBefore[listBefore.length - 1].Id : containerId;
    const insertAfter = listBefore.length ? true : null;

    const response = await (propertyNameForList === 'Conditions'
      ? apiService.sequenceAddCondition(insertTargetId, fullTypeName, insertAfter)
      : apiService.sequenceAddItem(insertTargetId, fullTypeName, insertAfter));

    if (response?.Success === false) {
      throw new Error(
        response?.Error || t('plugins.targetScheduler.errors.couldNotAddSequenceItem')
      );
    }

    await sequenceStore.loadCurrent();

    const containerAfter = findById(sequenceStore.data, containerId);
    const listAfter = Array.isArray(containerAfter?.[propertyNameForList])
      ? containerAfter[propertyNameForList]
      : [];

    return (
      listAfter.find((node) => !beforeIds.has(node.Id)) || listAfter[listAfter.length - 1] || null
    );
  }

  async function setAltitudeComparator(conditionId, comparatorValue) {
    const expected = Number(comparatorValue);
    await apiService.sequenceSetProperty(conditionId, 'Data.Comparator', expected);

    // Some backends persist comparator through different property paths.
    // Verify and fallback so min/max are exported deterministically.
    await sequenceStore.loadCurrent();
    const conditionAfterDataPath = findById(sequenceStore.data, conditionId);
    if (Number(conditionAfterDataPath?.Data?.Comparator) === expected) {
      return;
    }

    await apiService.sequenceSetProperty(conditionId, 'Comparator', expected);
    await sequenceStore.loadCurrent();
  }

  async function addAltitudeConditions(dsoContainerId, constraints) {
    if (!constraints) return;

    if (Number.isFinite(Number(constraints.minAltitude)) && Number(constraints.minAltitude) > 0) {
      const minCond = await addItemAndResolveNewNode(
        dsoContainerId,
        ALTITUDE_CONDITION_TYPE,
        'Conditions'
      );
      if (minCond?.Id) {
        await setAltitudeComparator(minCond.Id, 3); // min altitude => Above
        await apiService.sequenceSetProperty(minCond.Id, 'Offset', Number(constraints.minAltitude));
      }
    }

    if (Number.isFinite(Number(constraints.maxAltitude)) && Number(constraints.maxAltitude) < 90) {
      const maxCond = await addItemAndResolveNewNode(
        dsoContainerId,
        ALTITUDE_CONDITION_TYPE,
        'Conditions'
      );
      if (maxCond?.Id) {
        await setAltitudeComparator(maxCond.Id, 1); // max altitude => Below
        await apiService.sequenceSetProperty(maxCond.Id, 'Offset', Number(constraints.maxAltitude));
      }
    }
  }

  async function configureSmartExposure(smartExposureId, exposure) {
    const smart = findById(sequenceStore.data, smartExposureId);
    if (!smart) return;

    const switchFilter = (smart.Items || []).find((item) =>
      item.FullTypeName?.includes('SwitchFilter')
    );
    const takeExposure = (smart.Items || []).find((item) =>
      item.FullTypeName?.includes('TakeExposure')
    );
    const loopCondition = (smart.Conditions || []).find((item) =>
      item.FullTypeName?.includes('LoopCondition')
    );

    if (switchFilter?.Id) {
      const filterIndex = getFilterIndexByName(exposure.filterName);
      if (filterIndex) {
        await apiService.sequenceSetProperty(switchFilter.Id, 'SelectedFilter', filterIndex);
      }
    }

    if (takeExposure?.Id) {
      await apiService.sequenceSetProperty(
        takeExposure.Id,
        'ExposureTime',
        Number(exposure.durationSeconds)
      );
      await apiService.sequenceSetProperty(takeExposure.Id, 'Gain', Number(exposure.gain));
      await apiService.sequenceSetProperty(takeExposure.Id, 'Offset', Number(exposure.offset));
      await apiService.sequenceSetProperty(
        takeExposure.Id,
        'Binning',
        JSON.stringify({ X: Number(exposure.binning), Y: Number(exposure.binning) })
      );
      await apiService.sequenceSetProperty(
        takeExposure.Id,
        'ImageType',
        exposure.imageType || 'LIGHT'
      );
    }

    if (loopCondition?.Id) {
      await apiService.sequenceSetProperty(loopCondition.Id, 'Iterations', Number(exposure.count));
    }
  }

  async function addTargetToSequence(target, imagingContainerId) {
    const beforeDsoIds = new Set(
      collectByType(sequenceStore.data, DSO_CONTAINER_TYPE).map((node) => node.Id)
    );

    const dsoNode = await addItemAndResolveNewNode(imagingContainerId, DSO_CONTAINER_TYPE, 'Items');
    if (!dsoNode?.Id) {
      throw new Error(
        t('plugins.targetScheduler.errors.failedToAddSequenceTarget', { name: target.name })
      );
    }

    await sequenceStore.loadCurrent();

    const allDso = collectByType(sequenceStore.data, DSO_CONTAINER_TYPE);
    const dso = allDso.find((node) => !beforeDsoIds.has(node.Id)) || allDso[allDso.length - 1];

    if (!dso?.Id) {
      throw new Error(
        t('plugins.targetScheduler.errors.failedToResolveTargetContainer', {
          name: target.name,
        })
      );
    }

    const dsoIndex = Math.max(
      0,
      allDso.findIndex((node) => node.Id === dso.Id)
    );

    await apiService.sequnceTargetSet(
      target.name,
      target.ra,
      target.dec,
      target.rotation || 0,
      dsoIndex
    );
    await apiService.sequenceSetProperty(dso.Id, 'Name', target.name);

    await sequenceStore.loadCurrent();

    await addAltitudeConditions(dso.Id, target.constraints);
    await sequenceStore.loadCurrent();

    const exposures =
      Array.isArray(target.exposures) && target.exposures.length
        ? target.exposures
        : [createExposure()];

    for (const exposure of exposures) {
      const smartNode = await addItemAndResolveNewNode(dso.Id, SMART_EXPOSURE_TYPE, 'Items');
      if (!smartNode?.Id) continue;
      await sequenceStore.loadCurrent();
      await configureSmartExposure(smartNode.Id, exposure);
      await sequenceStore.loadCurrent();
    }
  }

  async function applyScheduleToSequence() {
    if (!canApplyToSequence.value) {
      toastStore.showToast({
        type: 'error',
        title: t('plugins.targetScheduler.toast.title'),
        message: t('plugins.targetScheduler.warnings.sequenceVersionRequired'),
      });
      return;
    }

    if (!targets.value.length) {
      toastStore.showToast({
        type: 'warning',
        title: t('plugins.targetScheduler.toast.title'),
        message: t('plugins.targetScheduler.toast.noTargetsToApply'),
      });
      return;
    }

    isApplyingToSequence.value = true;

    try {
      await sequenceStore.loadCurrent();

      if (
        !sequenceStore.loaded ||
        !Array.isArray(sequenceStore.data) ||
        !sequenceStore.data.length
      ) {
        throw new Error(t('plugins.targetScheduler.errors.noActiveSequenceLoaded'));
      }

      const imagingContainer = getImagingContainer();
      if (!imagingContainer?.Id) {
        throw new Error(t('plugins.targetScheduler.errors.noImagingContainerFound'));
      }

      const orderedTargets = getTargetOrderForExport();
      if (!orderedTargets.length) {
        throw new Error(t('plugins.targetScheduler.errors.noValidTargetsForExport'));
      }

      for (const target of orderedTargets) {
        await addTargetToSequence(target, imagingContainer.Id);
      }

      await sequenceStore.loadCurrent();
      await sequenceStore.fetchStatusUpdate();

      toastStore.showToast({
        type: 'success',
        title: t('plugins.targetScheduler.toast.title'),
        message: t('plugins.targetScheduler.toast.addedTargetsToSequence', {
          count: orderedTargets.length,
        }),
      });
    } catch (error) {
      console.error('[TargetScheduler] Failed to apply schedule to sequence', error);
      toastStore.showToast({
        type: 'error',
        title: t('plugins.targetScheduler.toast.title'),
        message: error?.message || t('plugins.targetScheduler.errors.failedToApplySchedule'),
        autoClose: false,
      });
    } finally {
      isApplyingToSequence.value = false;
    }
  }

  let recomputeTimer = null;
  watch(
    [targets, sessionStartInput, sessionEndInput, stepMinutes, maxChunkMinutes, location],
    () => {
      if (recomputeTimer) clearTimeout(recomputeTimer);
      recomputeTimer = setTimeout(() => {
        recomputeSchedule();
      }, 120);
    },
    { deep: true }
  );

  watch(
    [targets, sessionStartInput, sessionEndInput, stepMinutes, maxChunkMinutes],
    () => {
      persistState();
    },
    { deep: true }
  );

  recomputeSchedule();

  return {
    targets,
    favorites,
    selectedTargetId,
    selectedTarget,
    isEditorOpen,
    editingTarget,
    showFavoritesPicker,
    sessionStartInput,
    sessionEndInput,
    stepMinutes,
    maxChunkMinutes,
    location,
    scheduleResult,
    targetSummaryById,
    totalScheduledMinutes,
    orderedScheduledTargetIds,
    isComputing,
    computeError,
    isApplyingToSequence,
    canApplyToSequence,

    addTarget,
    updateTarget,
    removeTarget,
    duplicateTarget,
    reorderTargets,
    openCreateEditor,
    openEditEditor,
    closeEditor,
    loadFavorites,
    addTargetFromFavorite,
    addAllFavorites,
    removeAllTargets,
    recomputeSchedule,
    applyScheduleToSequence,
  };
}
