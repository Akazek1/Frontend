# Marketing site images

Drop image files here with these exact names and they appear automatically on
`/welcome` (English) and `/rw` (Kinyarwanda). Until a file exists, the site
shows a labelled placeholder (nothing breaks).

| File | Where it shows | What to use | Recommended |
|------|----------------|-------------|-------------|
| `hero-cleaner.jpeg` | Hero — the large lifestyle photo | A verified worker in a real home (the attached cleaning photo) | Landscape, ≈1600×1000, JPG |
| `app-home.webp` | Hero — the phone screenshot floating over the photo (tap opens the app) | The app home screen ("Good Afternoon…") | Portrait screenshot |
| `for-workers.png` | "For workers" card | A job-posting card (what a worker browses) | Landscape |
| `for-employers.png` | "For employers" card | A worker-profile card (what an employer browses) | Landscape |

Notes:
- The hero photo is cropped responsively (4:3 on phones → 4:5 on desktop) via
  CSS `object-position`, so one wide file works everywhere — keep the subject
  roughly centred and in the upper half.
- Keep the same filename when you replace an image; no code change needed.
- Compress to < ~400 KB each so the page stays fast.
- Get permission before publishing anyone's photo.
