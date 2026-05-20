import { computed } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';

export function getNightKey(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (date.getHours() < 12) date.setDate(date.getDate() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function applyImageFilter(
  images,
  { selectedTarget, selectedFilter, selectedNight, selectedImageType }
) {
  if (!images) return [];
  return images.filter((img) => {
    if (selectedTarget !== null && img.TargetName !== selectedTarget) return false;
    if (selectedFilter !== null && img.Filter !== selectedFilter) return false;
    if (selectedNight !== null && getNightKey(img.Date) !== selectedNight) return false;
    if (selectedImageType !== null && img.ImageType !== selectedImageType) return false;
    return true;
  });
}

export function useImageFilter() {
  const store = apiStore();
  const settingsStore = useSettingsStore();
  const filter = computed(() => settingsStore.monitorViewSetting.imageFilter);

  const allImages = computed(() => store.imageHistoryInfo || []);

  const availableTargets = computed(() => {
    const names = new Set(allImages.value.map((img) => img.TargetName).filter(Boolean));
    return [...names].sort();
  });

  const availableFilters = computed(() => {
    let base = allImages.value;
    if (filter.value.selectedTarget !== null)
      base = base.filter((img) => img.TargetName === filter.value.selectedTarget);
    if (filter.value.selectedNight !== null)
      base = base.filter((img) => getNightKey(img.Date) === filter.value.selectedNight);
    if (filter.value.selectedImageType !== null)
      base = base.filter((img) => img.ImageType === filter.value.selectedImageType);
    const filters = new Set(base.map((img) => img.Filter).filter(Boolean));
    return [...filters].sort();
  });

  const availableNights = computed(() => {
    let base = allImages.value;
    if (filter.value.selectedTarget !== null)
      base = base.filter((img) => img.TargetName === filter.value.selectedTarget);
    if (filter.value.selectedFilter !== null)
      base = base.filter((img) => img.Filter === filter.value.selectedFilter);
    if (filter.value.selectedImageType !== null)
      base = base.filter((img) => img.ImageType === filter.value.selectedImageType);
    const nights = new Set(base.map((img) => getNightKey(img.Date)).filter(Boolean));
    return [...nights].sort().reverse();
  });

  const availableImageTypes = computed(() => {
    const types = new Set(allImages.value.map((img) => img.ImageType).filter(Boolean));
    return [...types].sort();
  });

  const filteredImages = computed(() =>
    applyImageFilter(store.imageHistoryInfo || [], filter.value)
  );

  return {
    filter,
    availableTargets,
    availableFilters,
    availableNights,
    availableImageTypes,
    filteredImages,
    getNightKey,
  };
}
