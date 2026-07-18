# Custom Landscape Creation Guide (Touch-N-Stars)

This guide explains how to create a custom terrestrial landscape dataset for Celestia Atlas in Touch-N-Stars, which tools to use, and how to validate the result.

## 1. What Touch-N-Stars expects

Touch-N-Stars passes your custom landscape URL to Celestia Atlas as a HiPS data source.

At minimum, your custom dataset folder must contain:

- `properties` at the dataset root
- twelve order-0 tiles under `Norder0/Dir0/Npix0...Npix11`
- usually an all-sky preview tile `Norder0/Allsky.<ext>` (recommended)

Reference examples in this repository:

- `public/celestia-atlas-data/landscapes/gray`
- `public/celestia-atlas-data/landscapes/guereins`

## 2. Required files and metadata

The most important metadata lives in the `properties` file.

Minimum recommended fields:

```ini
hips_order = 0
hips_order_min = 0
hips_tile_width = 512
hips_tile_format = webp
dataproduct_type = image
obs_title = My Observatory
type = landscape
```

Notes:

- `type = landscape` marks the HiPS as a landscape dataset.
- `hips_tile_format` can be `webp`, `png`, `jpg`, or `jpeg` in Celestia Atlas.
- The current Atlas integration renders order 0. Higher-order tiles may be included for compatibility, but the twelve order-0 tiles are required.
- If you use `png` or `jpeg`, keep `hips_tile_format` in sync with actual file extensions.

## 3. Recommended toolchain (researched)

Use this stack for the best balance of quality and reliability.

1. Panorama stitching and alignment: Hugin
2. HiPS generation: Hipsgen (batch CLI) or Aladin Desktop (GUI)
3. Optional tile compression to WebP: cwebp (libwebp)
4. Compatibility validation: Hipsgen LINT action

Why these tools:

- Hugin is a stable, cross-platform panorama stitcher designed for overlapping photos.
- CDS HiPS tooling (Hipsgen/Aladin) is the official ecosystem for generating and validating HiPS datasets.
- cwebp provides controlled WebP compression for smaller tile payloads.

## 4. End-to-end workflow

### Step A: Capture and stitch panorama

1. Capture a full 360-degree panorama with enough overlap between frames.
2. Stitch in Hugin.
3. Export a high-quality master image (TIFF/PNG) for downstream processing.

Tip: Level the horizon and clean seams before HiPS generation.

### Step B: Generate HiPS tiles

You have two good options.

Option 1 (GUI, easier for first run): Aladin Desktop

1. Open Aladin Desktop.
2. Use Tools -> Create a HiPS.
3. Generate a local HiPS output directory.

Option 2 (CLI, reproducible): Hipsgen

Example command pattern:

```bash
java -jar Hipsgen.jar in=/path/to/input out=/path/to/output INDEX TILES PNG CHECKCODE
```

Useful follow-up validation:

```bash
java -jar Hipsgen.jar out=/path/to/output LINT
```

### Step C: Convert tiles to WebP (optional but recommended)

If your HiPS output is PNG/JPG and you want smaller files, convert tiles to WebP.

PowerShell example:

```powershell
Get-ChildItem "C:\path\to\my-landscape" -Recurse -File -Include *.png,*.jpg,*.jpeg |
  ForEach-Object {
    $out = [System.IO.Path]::ChangeExtension($_.FullName, 'webp')
    cwebp -q 90 "$_" -o "$out"
  }
```

After conversion:

1. Remove old tile files if you do not need them.
2. Update `hips_tile_format = webp` in `properties`.

### Step D: Place the dataset in Touch-N-Stars

1. Copy dataset folder to:
   `public/celestia-atlas-data/landscapes/<your-landscape-id>`
2. Example final URL root:
   `/celestia-atlas-data/landscapes/<your-landscape-id>`

### Step E: Configure in app

In Celestia Atlas settings:

1. Enable Landscapes
2. Landscape source -> Custom data source
3. Custom source URL -> `landscapes/<your-landscape-id>`
4. Custom source key -> a unique key, for example `my-observatory`

After entering or changing custom source settings, click **Save** in the Celestia Atlas settings panel to trigger refresh.

## 5. Quality and troubleshooting checklist

Before final use, verify:

1. `properties` exists at dataset root.
2. `hips_tile_format` matches real tile extension.
3. At least one `Norder.../Dir.../Npix...` hierarchy exists.
4. `Norder0/Allsky.<ext>` exists (recommended for faster first paint).
5. `type = landscape` is present.
6. URL opens from the same host as Touch-N-Stars (or CORS is allowed for remote hosting).

If the landscape does not appear:

1. Try local hosting first under `public/celestia-atlas-data/landscapes/...`.
2. Re-check `properties` spelling and values.
3. Use Hipsgen `LINT` to detect metadata problems.
4. Confirm the custom URL points to the dataset root, not to an individual tile.

## 6. Online research references

The recommendations above are based on these sources:

1. CDS HiPS portal (official HiPS docs and tools):
   https://aladin.cds.unistra.fr/hips/
2. Hipsgen reference manual (actions like TILES, ALLSKY, LINT):
   https://aladin.cds.unistra.fr/hips/HipsgenReferenceManual.html
3. IVOA HiPS recommendation (standard background):
   https://www.ivoa.net/documents/HiPS/
4. Hugin (panorama stitching):
   https://hugin.sourceforge.io/
5. cwebp encoder reference (WebP conversion options):
   https://developers.google.com/speed/webp/docs/cwebp
6. Stellarium Web Engine source confirms HiPS landscape loading from `properties`, tile format handling, and allsky loading logic:
   https://github.com/Stellarium/stellarium-web-engine
