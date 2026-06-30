import { createRouter, createWebHistory } from 'vue-router';
import { useSettingsStore } from '@/store/settingsStore';

const EquipmentPage = () => import('@/views/EquipmentPage.vue');
const CameraPage = () => import('@/views/CameraPage.vue');
const MountPage = () => import('@/views/MountPage.vue');
const GuidingPage = () => import('@/views/GuidingPage.vue');
const DomePage = () => import('@/views/DomePage.vue');
const SettingsPage = () => import('@/views/SettingsPage.vue');
const FlatdevicePage = () => import('@/views/FlatdevicePage.vue');
const SequenceMonitoring = () => import('@/views/SequenceMonitoring.vue');
const SetupPage = () => import('@/views/SetupPage.vue');
const SwitchPage = () => import('@/views/SwitchPage.vue');
const FilterwheelPage = () => import('@/views/FilterwheelPage.vue');
const RotatorPage = () => import('@/views/RotatorPage.vue');
const Flatassistant = () => import('@/views/FlatassistantPage.vue');
const FocusPage = () => import('@/views/FocusPage.vue');
const SequencePage = () => import('@/views/SequencePage.vue');
const FramingPage = () => import('@/views/FramingPage.vue');

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
  { path: '/framing', component: FramingPage, meta: { requiresSetup: true } },
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
  framing: '/framing',
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
