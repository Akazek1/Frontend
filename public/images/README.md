# Image assets

Drop image files here and reference them as `/images/<folder>/<file>` in code
(e.g. `<Image src="/images/agency/cover-default.webp" .../>`). Everything in
`public/` is served at the site root and cached by the PWA automatically.

Prefer **SVG** for logos/illustrations (sharp at any size, tiny) and **WebP**
for photos. Keep illustrations under ~200 KB so the app stays fast.

## Folders & expected files

### brand/
| File | Size | Format | Used by |
|------|------|--------|---------|
| `logo-mark.svg` | 1:1 (any) | SVG | Akazek logo in sidebars + auth headers |
| `logo-mark-512.png` | 512×512 | PNG | Fallback / PWA |
| `icon-192.png` | 192×192 | PNG | PWA home-screen icon |
| `icon-512.png` | 512×512 | PNG | PWA splash icon |
| `icon-512-maskable.png` | 512×512 | PNG | PWA maskable (safe-zone padded) |

### auth/
| File | Size | Format | Used by |
|------|------|--------|---------|
| `welcome-illustration.svg` | 1000×1000 (square) | SVG/WebP | Account chooser left panel |
| `login-illustration.svg` | 1200×1600 (3:4) | SVG/WebP | Phone-login left panel (desktop) |
| `business-illustration.svg` | 1200×1600 (3:4) | SVG/WebP | Register-company left panel |

### agency/
| File | Size | Format | Used by |
|------|------|--------|---------|
| `cover-default.webp` | 1600×400 (4:1) | WebP/JPG | Agency profile cover fallback (a green gradient is used if absent) |
| `logo-placeholder.svg` | 256×256 (1:1) | SVG/PNG | Agency logo fallback |

### avatars/
| File | Size | Format | Used by |
|------|------|--------|---------|
| `worker-default.webp` | 256×256 (1:1) | WebP/JPG | Worker avatar fallback |
| `employer-default.webp` | 256×256 (1:1) | WebP/JPG | Employer avatar fallback |

> Real worker/employer/agency images are uploaded to Cloudinary at runtime; the
> files above are only static fallbacks. Update the fallback paths in
> `constant/app.config.ts` / `lib/service-display.ts` if you change names.
