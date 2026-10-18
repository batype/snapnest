---
name: snapnest
description: Beautify existing screenshots locally with SnapNest, add backgrounds and window frames, prepare shareable PNG/JPEG images, and apply requested solid privacy redactions. Use for screenshot styling, project showcase images, and screenshot redaction; not for capturing the desktop or generating new illustrations.
license: MIT
---

# SnapNest

Turn an existing PNG, JPEG, or WebP screenshot into a shareable image using the published `@batype/snapnest@1.2.0` CLI. Processing is local; no image upload or API key is required. The first npm invocation may download the package and its native sharp dependency.

## Choose the input and style

Use the image the user supplied. Obtain its local path through the environment's attachment tools; if no usable file is available, ask for the image or its path. Keep the original file and write a separate output to the user's requested location, or the workspace's deliverables directory. Inspect the input when an image viewer is available.

Translate the user's request into CLI options; use these defaults when details are unspecified:

| Request | Option |
| --- | --- |
| Everyday sharing | `--ratio 4:3` |
| Square social image | `--ratio 1:1` |
| Portrait note or post | `--ratio 3:4` |
| Presentation or video cover | `--ratio 16:9` |
| Adapt to the original image | `--ratio auto` |
| Warm / cream | `--theme sunset` |
| Calm / green / matcha | `--theme matcha` |
| Clean / blue | `--theme sky` |
| Soft / berry | `--theme berry` |
| Dark image background | `--theme midnight` |
| Neutral / paper | `--theme paper` |

Leave the whole screenshot visible. Default to PNG, 2× export, 64 px padding, 16 px corners, and shadow 40. Add a caption only if requested. A browser frame suits product UI screenshots; `--no-frame` omits it when requested or inappropriate for the content. The website's interface light/dark preference does not change the exported image; use `--theme midnight` for an actual dark image background.

## Run the CLI

Requires Node.js 20.9.0 or later. Prefer the project's known installed SnapNest CLI when available; otherwise use this pinned npm invocation without changing the project's dependencies or global installation:

```sh
npm exec --yes --registry=https://registry.npmjs.org --package=@batype/snapnest@1.2.0 -- snapnest \
  "/absolute/path/screenshot.png" \
  --out "/absolute/path/share.png" \
  --theme matcha --ratio 4:3 --scale 2
```

Use argument arrays when the execution tool supports them; otherwise quote file paths and captions safely. The `--out` extension selects PNG or JPEG (`.png`, `.jpg`, `.jpeg`). Create the parent output directory if necessary. Existing outputs are protected; choose a new filename unless the user asked to replace that output. Never use the input as the output, including through a link.

Other supported options:

- `--padding 16..140`, `--radius 0..40`, `--shadow 0..80`, `--scale 1|2` (integer values).
- `--caption "text"` (at most 40 characters).
- `--color-a '#RRGGBB' --color-b '#RRGGBB'` for custom gradients.
- `--masks "/absolute/path/masks.json"` for solid redactions.
- `--help`, `--list-themes`, `--version` for discovery and diagnostics.

Input limits: 25 MB and 24 million pixels. The longest exported edge is capped at 4096 px. This command processes a static image, including a static frame from animated input. If execution fails, address the reported cause; do not claim an export succeeded or silently substitute a different image.

## Redact requested information

SnapNest does not detect sensitive text automatically. Inspect the source and identify the regions the user wants hidden before rendering. If regions cannot be located reliably, ask for the target areas or normalized rectangles rather than inventing coordinates.

Write a temporary JSON array of rectangles:

```json
[{ "x": 0.10, "y": 0.20, "w": 0.35, "h": 0.08 }]
```

Coordinates are fractions of the **EXIF-corrected source image content**, not of the final canvas, background padding, or window frame. For a pixel rectangle `(left, top, width, height)` on an oriented source of size `(W, H)`, use `{x:left/W, y:top/H, w:width/W, h:height/H}`. Each value must be within 0–1, with `x+w <= 1` and `y+h <= 1`. Account for JPEG orientation when inspecting and measuring; if the viewer's orientation is unclear, create and inspect a locally auto-oriented copy or ask for coordinates.

Include a small margin around the sensitive content. Pass the JSON path with `--masks`, then inspect the exported image to confirm every requested region is fully covered and that unrelated content remains readable. If no image inspection is available, state that visual coverage could not be verified; do not call the result fully anonymized. Delete only temporary coordinate files created for this task when they are no longer needed.

## Deliver

Check that the output exists and the CLI reports the expected dimensions and format. Open the exported image when the environment supports it to check the overall layout, caption, and any redactions. Return the actual image or a clickable output-file link, with the chosen theme and dimensions when useful. Do not upload or publish the image unless the user requests that separately.
