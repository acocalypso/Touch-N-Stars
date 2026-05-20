<template>
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
    <div
      v-if="sessionEquipment.length && store.settings?.ShowEquipmentProfile"
      class="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1"
    >
      <div v-for="eq in sessionEquipment" :key="eq.role" class="flex items-baseline gap-2 min-w-0">
        <span class="text-gray-500 text-xs shrink-0">{{ eq.role }}</span>
        <span class="text-gray-200 truncate text-xs">{{ eq.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNightSummaryStore } from '../store/nightsummaryStore';
import { formatDate, formatTime } from '../utils/sessionFormatters';

const store = useNightSummaryStore();

const sessionDuration = computed(() => {
  const s = store.sessionDetail?.Session;
  if (!s?.SessionStart || !s?.SessionEnd) return '—';
  const sec = (new Date(s.SessionEnd) - new Date(s.SessionStart)) / 1000;
  if (sec <= 0) return '—';
  const h = sec / 3600;
  if (h >= 1) return `${h.toFixed(1)}h`;
  return `${Math.round(sec / 60)}m`;
});

const sessionEquipment = computed(() => {
  const s = store.sessionDetail?.Session;
  if (!s) return [];
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
</script>
