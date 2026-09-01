# Filebrowser: binary transfers, download to device, sorting and multi-select

Status: implemented (backend untested against a running plugin server)
Date: 2026-09-01

## Goal

The file browser becomes usable on a phone: files can be saved onto the device,
large capture folders can be sorted and searched, and several entries can be
deleted or downloaded in one go. The foundation for all of that is the backend
finally handing out real bytes — until now `GET /api/filesystem/file` read every
file as UTF-8 text, which turned every byte >= 0x80 into U+FFFD and made image
previews and downloads impossible.

Based on the inventory in [../filebrowser-plugin-overview.md](../filebrowser-plugin-overview.md).

## Scope

- Runtime modes: PINS only (`plugin.json` carries `isPins: true`)
- Backend: `FilesystemController.cs` in the Touch'N'Stars NINA plugin
  (`N.I.N.A-Plugin-for-Touch-N-Stars`, branch `File-Browser-Extension`)
- Surface: `src/plugins/filebrowser/**`, `src/services/api/filesystem.js`
- State owner: component-local — the browser holds no state across sessions

## Backend contract

| Endpoint                                       | Change                                                                                                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/filesystem/file?path=…[&download=1]` | streams the raw file, with a real `Content-Type` from the extension, `Content-Length` and `Content-Disposition` (`inline`, or `attachment` with `download=1`)                 |
| `PUT /api/filesystem/rename`                   | new; body `{ sourcePath, targetPath }`, works for files and directories. 400 missing fields / target parent missing, 404 source missing, 409 target exists, 403 access denied |

`Content-Length` is what lets the client show real download progress.

## Non-goals

- No root whitelist and no auth on the filesystem controller. The controller
  still accepts any path — see §9 of the inventory. Rename is the first write
  access, so this should be the next issue on top of this branch.
- No thumbnails or grid view, no upload, no move/copy between folders (the
  rename endpoint would already support a move).
- No Range/resume support for interrupted transfers.
- The defensive logic in `useFitsPreview.js` (`inferImageGeometry` fallback,
  `truncated`, `decodablePixelCount`) is untouched. It only becomes removable
  once the binary stream is verified against a running plugin server.

## Acceptance criteria

1. Given a PNG or JPG in the browsed folder, when it is opened, the preview
   shows the real image (previously a broken/blank image).
2. Given any file, when "save to device" is used, it lands in
   `Documents/TouchNStars/Filebrowser` on Android/iOS and in the browser's
   download folder otherwise — byte-identical to the original.
3. Given a folder with many frames, when sorting by name, `M31_2` sorts before
   `M31_10`; sorting by date or size reverses fully with the direction toggle.
4. Given a search term, the list filters directories and files case-insensitively.
5. Given several selected files, when downloading, transfers run one after
   another with an `n/total` progress bar that can be cancelled; already saved
   files stay.
6. Given several selected entries, when deleting, exactly one confirmation is
   shown, naming how many of them are directories.
7. Given a rename, the entry is renamed without a 404 and stays selected.
8. Every control is at least 48 px high (`min-h-touch`) and uses the `tns-*`
   utilities.

## Interaction model

The list is selection driven, like the iOS Files app: tapping a file row toggles
its selection, tapping a directory row opens it, and a sticky action bar at the
bottom carries open / download / rename / delete for whatever is selected. Open
and rename require exactly one selected entry. This replaces the four 32 px icon
buttons that used to sit in every row.

## Verification

```bash
npm run lint && npm run format:check && npm run build && npm run test:run && npm run i18n:check
```

Backend, against a running plugin server:

```bash
curl -s -D- -o /tmp/t.png "http://<host>:<port>/api/filesystem/file?path=<file.png>" | head
file /tmp/t.png            # PNG image data, not "data"
cmp /tmp/t.png <original>   # identical
```
