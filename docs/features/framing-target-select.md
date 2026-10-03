# Framing: Sequenz-Target auswählen statt überschreiben

Status: implemented
Date: 2026-08-29

## Goal

In PINS überschreibt der „Set sequence target“-Button nicht mehr stillschweigend das erste
Target der geladenen Sequenz. Stattdessen öffnet er einen Dialog, der alle DSO-Targets der
Sequenz auflistet: Der Nutzer ersetzt gezielt eines davon oder legt ein neues Target an und
wählt dessen Position. Enthält die Sequenz noch kein Target, wird ohne Rückfrage eines
angelegt. Damit lässt sich eine Mehr-Target-Sequenz aus dem Framing-Assistenten heraus
pflegen, ohne versehentlich das falsche Target zu verlieren.

Es ist die Gegenrichtung zu [sequence-target-to-framing.md](sequence-target-to-framing.md),
das ein Sequenz-Target ins Framing lädt.

## Scope

- Runtime modes: PINS/headless bekommt den Dialog. NINA/WPF behält unverändert das heutige
  Verhalten (stilles `set-target` auf Index 0).
- Surface: `src/components/framing/setSequenceTarget.vue` — die Komponente wird an drei
  Stellen weiterverwendet und ändert ihr Verhalten dort mit:
  - Framing-Assistent (`src/views/FramingPage.vue`, `src/components/framing/slewAndCenter.vue`)
  - Celestia-Atlas (`src/components/celestiaAtlas/SelectedObject.vue`,
    `src/components/celestiaAtlas/AtlasFovRotation.vue`)
  - Telescopius-Plugin (`src/plugins/telescopius/components/TargetModal.vue`)
- Backends touched: Plugin server. Ersetzen läuft über den vorhandenen
  `sequence/set-target?…&index=N` (`sequenceV2Store.setDsoTarget`, das die Container-`Id`
  auf den DSO-Index abbildet). Anlegen soll über den vorhandenen `sequence/add` laufen —
  siehe „Open questions“, das ist die einzige unbestätigte Annahme.

## Non-goals

- `src/components/favTargets/FavTargets.vue` bleibt unverändert. Es hat eine eigene lokale
  `setSequenceTarget`-Funktion und benutzt die Komponente nicht.
- Die NINA/WPF-Sequenzansicht bekommt keinen Dialog.
- Die Sequenz wird nicht umsortiert, umbenannt oder aufgeräumt; es wird nur ein Target
  gesetzt oder eines hinzugefügt.
- Kein Mosaik wird in die Sequenz übernommen.
- Es wird keine Hardware bewegt — kein Slew, kein Center, kein Rotate.
- `sequenceV2Store.setDsoTarget` und der `set-target`-Endpoint werden nicht umgebaut.

## Acceptance criteria

1. Gegeben PINS mit geladener Sequenz und mindestens einem DSO-Target, wenn der Button
   getippt wird, dann öffnet sich ein Dialog mit allen DSO-Targets in Sequenzreihenfolge
   plus einer Option „neues Target“, und bis zur Bestätigung geht **kein** Request an den
   Backend-Server.
2. Gegeben der Framing-Assistent pollt die Sequenz nicht, wenn der Dialog geöffnet wird,
   dann wird die Target-Liste frisch geladen (`sequenceV2Store.loadCurrent()`) statt aus
   einem alten Store-Stand gerendert; ein zwischenzeitlich anderswo angelegtes Target ist
   in der Liste enthalten.
3. Gegeben eine Sequenz mit mehreren DSO-Targets, wenn im Dialog das zweite gewählt und
   bestätigt wird, dann trägt genau dieser Container Name, RA, Dec und Rotation aus dem
   Framing — adressiert über seine Container-`Id` via `setDsoTarget`, nicht über die
   Listenposition — und alle anderen Container bleiben unverändert.
4. Gegeben eine Sequenz mit genau einem DSO-Target, wenn der Button getippt wird, dann
   erscheint der Dialog trotzdem, mit diesem einen Eintrag und der Option „neues Target“.
5. Gegeben eine geladene Sequenz ohne jedes DSO-Target, wenn der Button getippt wird, dann
   wird ohne Dialog ein neues Target angelegt, das die Framing-Werte trägt.
6. Gegeben der Nutzer wählt „neues Target“, dann lässt der Dialog die Einfügeposition
   wählen (hinter einem vorhandenen Target oder ans Ende), und nach dem Bestätigen steht
   der neue Container genau dort und trägt die Framing-Werte.
7. Gegeben der Dialog wird abgebrochen oder weggetippt, dann wurde nichts gesendet und die
   Sequenz ist unverändert. Schlägt das Anlegen oder das Setzen fehl, dann zeigt ein
   Error-Toast die Servermeldung, und die Ansicht spiegelt nach `loadCurrent()` den echten
   Serverstand — es bleibt kein optimistisch gesetzter Wert stehen.
8. Gegeben keine geladene Sequenz, wenn der Button getippt wird, dann erscheint wie heute
   der Fehler-Toast und kein Dialog.
9. Gegeben NINA/WPF-Modus, wenn der Button getippt wird, dann verhält er sich exakt wie
   heute: `set-target` mit Index 0, kein Dialog, keine neue Abfrage.
10. Gegeben eine verbundene Montierung, wenn ein Target gesetzt oder angelegt wird, dann
    wird weder Slew noch Center noch Rotate gesendet.
11. Der Dialog benutzt die `tns-*`-Utilities, jede Schaltfläche ist auf einem schmalen
    Handy-Viewport mindestens 48 px hoch (`min-h-touch`), und jeder sichtbare String hat
    einen Key in `src/locales/en.json`.

## Dimensions considered

| Dimension        | Applies | Note                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime modes    | ja      | Kriterium 9: NINA behält den heutigen Pfad. Die Verzweigung hängt am Modus, nicht an einem Payload-Feld — das ist hier korrekt, weil der Unterschied die Oberfläche ist (V2-Sequenz-Editor existiert nur in PINS), nicht ein optional gemeldetes Feld.                                                                                                                                                   |
| Polling          | nein    | Kein neuer Dauerzustand und kein neuer Poller. Die Target-Liste wird einmalig beim Öffnen des Dialogs geladen (Kriterium 2), nicht gepollt.                                                                                                                                                                                                                                                              |
| Mobile           | ja      | Kriterium 11. Die Liste kann bei vielen Targets scrollen müssen.                                                                                                                                                                                                                                                                                                                                         |
| i18n             | ja      | Neue Keys für Dialogtitel, „ersetzen“, „neues Target“, Positionsauswahl, Abbrechen. Nur `en.json` während der Umsetzung; die 13 weiteren Locales in einem Batch vor dem Commit.                                                                                                                                                                                                                          |
| Equipment safety | ja      | Kriterium 10 — kein Bewegungsbefehl. Kriterium 1 stellt sicher, dass erst die bestätigte Nutzerabsicht etwas verändert; das Überschreiben eines Targets ist destruktiv und darf nicht als Nebeneffekt des Antippens passieren.                                                                                                                                                                           |
| Error paths      | ja      | Kriterien 7 und 8: keine Sequenz geladen, Backend lehnt `add` oder `set-target` ab, Zwei-Schritt-Fehler (angelegt, aber nicht gesetzt). Kein optimistischer Zustand.                                                                                                                                                                                                                                     |
| Native           | nein    | Reine In-App-Modaldarstellung, kein Filesystem, keine Permission, kein Resume-Verhalten.                                                                                                                                                                                                                                                                                                                 |
| Persistence      | nein    | Der Dialogzustand ist flüchtig und soll einen Instanzwechsel bzw. `clearAllStates()` nicht überleben.                                                                                                                                                                                                                                                                                                    |
| Tests            | ja      | Die Auswahl der DSO-Container aus `sequenceV2Store.data` (rekursives Sammeln, Reihenfolge, Namensermittlung) gehört als Util mit Unit-Test extrahiert statt in die Komponente — `setDsoTarget` sammelt heute dieselbe Liste inline (`src/store/sequenceV2Store.js:359`), beide sollten dieselbe Funktion benutzen. Ändert sich die `apiService`-Oberfläche, muss der Surface-Snapshot mitgezogen werden. |

## Resolved before implementation

- **Kann ein DSO-Container über den vorhandenen `sequence/add` angelegt werden?** Ja.
  `GET /api/sequence/items` listet `NINA.Sequencer.Container.DeepSkyObjectContainer`
  („Deep Sky Object Instruction Set“), `sequence/add` akzeptiert den Typ also — kein neuer
  Endpoint nötig. `GET /api/sequence/current` liefert
  `[{GlobalTriggers}, StartAreaContainer, TargetAreaContainer, EndAreaContainer]`; die
  DSO-Container hängen im `TargetAreaContainer`, der damit der Einfüge-Parent für den Fall
  „noch kein Target“ ist. Die `Id`s sind stabil und werden in Erzeugungsreihenfolge
  vergeben (nicht nach Baumposition), deshalb findet `addDsoTarget` den neuen Container
  über die Id-Differenz vor/nach dem Anlegen.
- **Name eines Targets ohne Namen in der Liste:** dasselbe `RA … Dec …`-Muster wie
  `buildCoordinateName`; erst wenn auch Koordinaten fehlen, greift `Target {index}`.
- **Nach dem Bestätigen** bleibt die Ansicht im Framing (bzw. im Atlas/Telescopius-Modal),
  nur der Erfolgs-Toast erscheint — keine Navigation zur Sequenzseite.
