# Sequenz-Target in den Framing-Assistenten laden

Status: implemented
Date: 2026-08-29

## Goal

Im PINS-Sequenz-Editor bekommt jeder Deep-Sky-Object-Container einen Button, der sein
Target — Name, RA, Dec und Position Angle — in den Framing-Assistenten lädt und direkt
dorthin wechselt. Damit lässt sich ein Target, das bereits in der Sequenz steht,
nachträglich neu framen, ohne die Koordinaten von Hand abzutippen. Es ist die
Gegenrichtung zu dem, was `setSequenceTarget.vue` heute schon von Framing nach Sequenz
kann.

## Scope

- Runtime modes: PINS/headless (`SequenceV2Page` wird ohnehin nur bei `store.isPINS`
  gerendert, `src/views/SequencePage.vue:2`)
- Surface: Sequenz-Editor V2 — `src/components/sequence/items/DeepSkyObjectContainerItem.vue`
- Backends touched: keine. Rein clientseitig: Werte aus dem `sequenceV2Store`-Item in den
  `framingStore`, dann `router.push('/framing')`. Kein neuer Endpoint nötig.

## Non-goals

- Die klassische NINA-Sequenzansicht (`SequencePage` / `RecursiveItemState.vue`) bekommt
  keinen Button.
- Es wird kein Mosaik aus der Sequenz übernommen — die Sequenz kennt keine Mosaikdaten.
- Die Rückrichtung Framing → Sequenz (`setSequenceTarget.vue`, `sequnceTargetSet`) bleibt
  unverändert.
- Die Sequenz wird nicht verändert; das Laden ist eine reine Leserichtung.
- Es wird keine Hardware bewegt.

## Acceptance criteria

1. Gegeben eine PINS-Sequenz mit einem DSO-Container mit gültigen Koordinaten, wenn der
   Button an diesem Container angetippt wird, dann ist die App auf `/framing` und der
   Framing-Assistent zeigt RA, Dec, Namen und Rotation genau dieses Targets.
2. Gegeben eine Sequenz mit mehreren DSO-Containern, wenn der Button am zweiten Container
   benutzt wird, dann wird das zweite Target geladen — jeder Button wirkt ausschließlich
   auf seinen eigenen Container.
3. Gegeben ein frisch angelegter DSO-Container, dessen `Target` keine parsebaren
   Koordinaten liefert (`parsedTarget === null`), dann ist der Button deaktiviert und es
   findet kein Seitenwechsel statt.
4. Gegeben der Framing-Assistent stand durch einen zuvor geladenen Favoriten im
   Mosaik-Modus, wenn ein Sequenz-Target geladen wird, dann ist `isMosaicMode` aus und nur
   das Einzel-Frame ist sichtbar.
5. Gegeben ein Target wurde geladen, dann lädt das Framing-Bild für die neuen Koordinaten
   von selbst nach (`framingStore.framingReloadKey`), ohne manuelles Neuladen.
6. Gegeben ein Target wurde ins Framing geladen, wenn der Nutzer in den Sequenz-Editor
   zurückkehrt, dann stehen dort unveränderte Werte: kein `sequence/set-target`, kein
   `setProperty`, kein `setDsoTarget`.
7. Gegeben eine verbundene Montierung, wenn der Button benutzt wird, dann wird weder
   Slew noch Center noch Rotate gesendet; die Montierung bleibt stehen.
8. Der Button-Text stammt aus einem Key in `src/locales/en.json`, und der Button ist auf
   einem schmalen Handy-Viewport mindestens 48 px hoch (`min-h-touch`).

## Dimensions considered

| Dimension | Applies | Note |
| --- | --- | --- |
| Runtime modes | teilweise | Bewusst PINS-only: Die Oberfläche existiert nur dort. Keine `store.isPINS`-Verzweigung im neuen Code nötig, da der Container selbst schon PINS-exklusiv ist. |
| Polling | nein | Kein neuer Serverzustand, kein neuer Poller. |
| Mobile | ja | Kriterium 8: `min-h-touch`, Button reiht sich in die bestehenden `seq-field-row`-Zeilen ein. |
| i18n | ja | Ein neuer `en.json`-Key; die 13 weiteren Locales kommen in einem Batch vor dem Commit. |
| Equipment safety | ja | Kriterium 7 — bewusst kein Slew. Der Nutzer löst Bewegung weiterhin selbst im Framing aus. |
| Error paths | ja | Kriterium 3 deckt das fehlende/unparsebare `Target` ab. Weitere Fehlerpfade gibt es nicht, da kein Netzwerkaufruf stattfindet. |
| Native | nein | Kein Filesystem, keine Permission, kein Resume-Verhalten betroffen. Reine Router-Navigation. |
| Persistence | nein | Der `framingStore` ist ohnehin flüchtig; ein Instanzwechsel setzt ihn zurück, was hier korrekt ist. |
| Tests | teilweise | Die Grad-Umrechnung liegt bereits als `currentRaDeg` / `currentDecDeg` im Container. Wird sie für den Button extrahiert, gehört sie in ein Util mit Unit-Test; ein neuer Test nur für die Store-Zuweisung lohnt nicht. |

## Open questions

- ~~Button-Platzierung innerhalb der DSO-Karte~~ — entschieden: eigene `seq-field-row`
  direkt unter dem Favoriten-Button, gleiches Label/Button-Muster wie dort.
- ~~Zoom/FOV nach dem Laden~~ — entschieden: FOV bleibt stehen, wie bei `FavTargets.vue`.
