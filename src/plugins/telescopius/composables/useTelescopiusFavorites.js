import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePluginStore } from '@/store/pluginStore';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';
import { useTelescopisStore } from '../store/telescopiusStore';

const PLUGIN_ID = 'telescopius';

/**
 * Exposes the Telescopius targets in the shape the favorites list expects.
 *
 * Telescopius targets are never stored as real favorites: the backend model
 * (Server/Models/FavoriteTarget.cs) has a fixed set of seven properties and silently drops
 * anything else, so an origin marker could not survive a round-trip. They are merged into the
 * list at runtime instead - the plugin already persists them under its own settings keys.
 */
export function useTelescopiusFavorites() {
  const pluginStore = usePluginStore();
  const telescopiusStore = useTelescopisStore();
  const { t } = useI18n();

  const isEnabled = computed(
    () => pluginStore.plugins.find((plugin) => plugin.id === PLUGIN_ID)?.enabled === true
  );

  /** Map one Telescopius target onto the favorite shape. RA is stored in hours. */
  const toFavorite = (target, list, index) => {
    const raDegrees = target.coordinates.ra * 15;

    return {
      Id: `${PLUGIN_ID}:${list.id}:${index}`,
      Name: target.name,
      Ra: raDegrees,
      Dec: target.coordinates.dec,
      RaString: degreesToHMS(raDegrees),
      DecString: degreesToDMS(target.coordinates.dec),
      Rotation: null,
      source: PLUGIN_ID,
      listName: list.name,
    };
  };

  const telescopiusFavorites = computed(() => {
    if (!isEnabled.value) return [];

    const lists = [...telescopiusStore.targetLists, ...telescopiusStore.importedLists];

    return lists.flatMap((list) =>
      (list.objects || [])
        .filter((target) => target?.coordinates)
        .map((target, index) => toFavorite(target, list, index))
    );
  });

  /**
   * (Re-)load the targets from the backend. Both keys live in the NINA settings store, so this
   * needs no Telescopius API call and works offline and without an API key.
   *
   * Called every time a favorites list is opened rather than once on mount, so a list that was
   * imported or refreshed in the meantime shows up immediately.
   */
  const loadTelescopiusFavorites = async () => {
    if (!isEnabled.value) return;

    await Promise.all([
      telescopiusStore.loadTargetListsFromCache(),
      telescopiusStore.loadImportedLists(),
    ]);
  };

  /**
   * Split the rows of a favorites list into labelled groups. Every UI that lists favorites
   * renders the same two sections, so the grouping lives here rather than in each component.
   *
   * @param {object[]} favorites the real favorites from favTargetsStore
   * @returns {{key: string, label: string, targets: object[]}[]}
   */
  const buildTargetGroups = (favorites) => [
    {
      key: 'favorites',
      label: t('components.fav_target.groups.favorites'),
      targets: favorites || [],
    },
    {
      key: PLUGIN_ID,
      label: t('components.fav_target.groups.telescopius'),
      targets: telescopiusFavorites.value,
    },
  ];

  return { isEnabled, telescopiusFavorites, loadTelescopiusFavorites, buildTargetGroups };
}
