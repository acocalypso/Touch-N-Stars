import { createRouter, createWebHistory } from 'vue-router';
import EquipmentPage from '@/views/EquipmentPage.vue';
import CameraPage from '@/views/CameraPage.vue';
import MountPage from '@/views/MountPage.vue';
import GuidingPage from '@/views/GuidingPage.vue';
import DomePage from '@/views/DomePage.vue';
import SettingsPage from '@/views/SettingsPage.vue';
import FlatdevicePage from '@/views/FlatdevicePage.vue';
import SequenceMonitoring from '@/views/SequenceMonitoring.vue';
import SetupPage from '@/views/SetupPage.vue';
import SwitchPage from '@/views/SwitchPage.vue';
import FilterwheelPage from '@/views/FilterwheelPage.vue';
import RotatorPage from '@/views/RotatorPage.vue';
import Flatassistant from '@/views/FlatassistantPage.vue';
import FocusPage from '@/views/FocusPage.vue';
import SequencePage from '@/views/SequencePage.vue';
import { useSettingsStore } from '@/store/settingsStore';

const routes = [
  {
    path: '/',
    component: EquipmentPage,
    meta: { requiresSetup: true },
  },
  {
    path: '/setup',
    component: SetupPage,
    meta: { requiresSetup: false },
  },
  { path: '/equipment', component: EquipmentPage, meta: { requiresSetup: true } },
  { path: '/camera', component: CameraPage, meta: { requiresSetup: true } },
  { path: '/mount', component: MountPage, meta: { requiresSetup: true } },
  { path: '/autofocus', component: FocusPage, meta: { requiresSetup: true } },
  { path: '/guider', component: GuidingPage, meta: { requiresSetup: true } },
  { path: '/dome', component: DomePage, meta: { requiresSetup: true } },
  { path: '/settings', component: SettingsPage, meta: { requiresSetup: true } },
  { path: '/flat', component: FlatdevicePage, meta: { requiresSetup: true } },
  { path: '/seq-mon', component: SequenceMonitoring, meta: { requiresSetup: true } },
  { path: '/switch', component: SwitchPage, meta: { requiresSetup: true } },
  { path: '/filterwheel', component: FilterwheelPage, meta: { requiresSetup: true } },
  { path: '/rotator', component: RotatorPage, meta: { requiresSetup: true } },
  { path: '/flats', component: Flatassistant, meta: { requiresSetup: true } },
  { path: '/sequence', component: SequencePage, meta: { requiresSetup: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const NAV_ITEM_ROUTES = {
  equipment: '/equipment',
  camera: '/camera',
  autofocus: '/autofocus',
  mount: '/mount',
  dome: '/dome',
  flat: '/flat',
  switch: '/switch',
  filter: '/filterwheel',
  rotator: '/rotator',
  guider: '/guider',
  sequence: '/sequence',
  monitoring: '/seq-mon',
  flats: '/flats',
  settings: '/settings',
};

function getFirstVisibleRoute(settingsStore) {
  const order = settingsStore.navbar?.itemOrder ?? Object.keys(NAV_ITEM_ROUTES);
  const hidden = settingsStore.navbar?.hiddenItems ?? [];
  for (const id of order) {
    if (!hidden.includes(id) && NAV_ITEM_ROUTES[id]) {
      return NAV_ITEM_ROUTES[id];
    }
  }
  return '/settings';
}

router.beforeEach((to, from, next) => {
  const settingsStore = useSettingsStore();

  if (to.meta.requiresSetup && !settingsStore.isSetupComplete()) {
    next('/setup');
  } else if (to.path === '/setup' && settingsStore.isSetupComplete()) {
    next('/');
  } else if (
    (to.path === '/' || to.path === '/equipment') &&
    settingsStore.navbar?.hiddenItems?.includes('equipment')
  ) {
    next(getFirstVisibleRoute(settingsStore));
  } else {
    next();
  }
});

export default router;
