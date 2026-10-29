# @navfolio/mdx-components

Official Astro components for Navfolio MDX content. This package is intentionally separate from `@navfolio/plugin-markdown`: the plugin configures Markdown rendering, while this package supplies author-facing blocks such as friend links, a friend circle, carousels, long images, Mermaid initialization, and zoomable images.

## Install

```bash
bun add @navfolio/mdx-components@github:navfolio/mdx-components
```

Then import only the component needed by an MDX file:

```astro
import FriendLinkCard from '@navfolio/mdx-components/FriendLinkCard.astro'; import
FriendLinkApplication from '@navfolio/mdx-components/FriendLinkApplication.astro'; import
FriendCircle from '@navfolio/mdx-components/FriendCircle.astro'; import MediaShelf from
'@navfolio/mdx-components/MediaShelf.astro';
```

## Friend links

`FriendLinkCard` accepts inline data or a JSON endpoint. `src` wins by default and falls back to `items` if the remote JSON fails. Use `source="src"` or `source="items"` to force one source.

```astro
<FriendLinkCard
  columns={4}
  randomBackground={true}
  shuffle={true}
  items={[
    {
      name: 'Example',
      url: 'https://example.com',
      bio: 'A short description.',
      avatar: 'https://example.com/avatar.png',
      backgroundImage: 'https://example.com/banner.jpg',
      rss: 'https://example.com/feed.xml',
      sticky: 10,
    },
  ]}
/>
```

Desktop uses four columns by default and naturally contracts to three, two, then one column. Bios clamp to two lines and cards keep a stable minimum height. `sticky` accepts `true` or a positive number; higher numbers render first. `shuffle` affects only non-sticky links. When `randomBackground` is enabled, each card receives a server-rendered translucent color, so there is no client-side color flash and every page refresh gets a fresh combination.

## Friend link applications

`FriendLinkApplication` renders a paper-themed application form and a read-only
field preview. The form collects the same fields used by `FriendLinkCard`, keeps
`sticky` fixed at `false`, validates HTTP(S) URLs, and can copy the displayed
brace-free field block or open a prefilled GitHub issue. The full-width form and data editor are
separate sliding pages, so neither view is squeezed in a narrow MDX column. A
guide button opens the preview, and the back control returns to the form. The
preview follows the form page's compact height, while longer field content
scrolls inside the read-only editor instead of stretching the whole component.
The form uses four rows on wider containers: `name | url`,
`avatar | backgroundImage`, full-width `bio`, then `rss | apply action`; every
field keeps its semantic Chinese label to the left of a bounded value control.

```astro
import FriendLinkApplication from '@navfolio/mdx-components/FriendLinkApplication.astro';
<FriendLinkApplication
  repository="owner/repository"
  appearance="seamless"
  showLivePreview
  issueTemplate="friend-link.yml"
  issueTitle="[Friend link] {name}"
  issueFieldMap={{ backgroundImage: 'background_image' }}
/>
```

`repository` accepts either `owner/repository` or a full `github.com` repository
URL. When `issueTemplate` is set, the component passes values using GitHub Issue
Form field IDs; customize those IDs with `issueFieldMap`. Without an Issue Form,
it falls back to a normal issue whose body contains the complete JSON object. Optional
GitHub query settings include `labels`, `assignees`, `milestone`, and `projects`.
Use `initialValue` to seed the form and override `title`, `description`,
`placeholders`, or action/copy labels when localizing the component.
Set `showLivePreview` to place a live `FriendLinkCard` preview between the
introductory copy and the data-preview button. Its name and bio update
immediately, while avatar and background URLs use a short debounce and fall
back cleanly when an image cannot load. The option defaults to `false`.
The component title defaults to `申请友链`; pass `title` to replace it.
`appearance="seamless"` is the default and removes the outer border and shadow;
use `appearance="bordered"` for a contained paper panel with a subtle border.

## Friend circle

`FriendCircle` renders a compact static feed below the links. Add `rss` to friend data and it crawls RSS/Atom feeds at build time. The refresh button samples already-built data in the browser; it never creates cross-origin requests for visitors. Its `title` defaults to `Friend circle`; pass a non-empty `title` to customize it. When a remote friend-link source uses different keys, pass `fieldMap={{ avatar: 'image' }}` (and any of `name`, `url`, `bio`, `backgroundImage`, `rss`, or `sticky`) to either friend component.

For production, periodically generate a JSON file with GitHub Actions and pass it with `feedSrc="/friend-circle.json"`. This avoids deployment failures from unreachable feeds and preserves the same component API for a Vercel Function or self-hosted service later.

## Music player

`MusicPlayer` has a fully themed native player for local files or permitted direct audio URLs. Its default `theme="system"` maps its local `--music-*` tokens to the host's Navfolio tokens and follows the active Navfolio color palette and light/dark mode. `site` remains a compatible alias. `paper`, `midnight`, `vinyl`, and `neon` are muted, self-contained light/dark presets. Use `variant="inline"` for a borderless article embed. A custom theme supplies complete `light` and `dark` token sets (`surface`, `surfaceMuted`, `text`, `textMuted`, `accent`, `accentContrast`, and `line`).

```astro
import MusicPlayer from '@navfolio/mdx-components/MusicPlayer.astro';
<MusicPlayer title="Example" artist="Navfolio" src="/audio/example.mp3" theme="vinyl" />
```

Official third-party players are rendered inside their provider iframe. Set `provider` and pass a normal Spotify or SoundCloud `url`, or an official `embedUrl` for Bandcamp, Apple Music, and 网易云音乐. The outer card follows the selected local theme; iframe internals remain provider-owned.

`MusicPlayer` also accepts `size="narrow|compact|normal|wide|full"`. Pass a native `playlist` array to reveal a selectable, collapsed track list.

## Media shelf

`MediaShelf` displays books, films, series, albums, and podcasts. The default
`variant="shelf"` is a centered cover-first grid that spans the full MDX content
width. Use `variant="inline"` for a quiet, borderless reading-list layout with a
cover on the left and an optional note on the right.

For a linked long-form review, give an item `reviewHref` and the localized
`reviewLabel` to show a compact reading hint with an icon. When both `href` and
`reviewHref` are present, the review link takes priority.

```astro
import MediaShelf from '@navfolio/mdx-components/MediaShelf.astro';
<MediaShelf
  variant="inline"
  items={[
    {
      title: 'The Left Hand of Darkness',
      creator: 'Ursula K. Le Guin',
      type: 'book',
      rating: 5,
      note: 'A story about patience, trust, and the limits of inherited categories.',
    },
  ]}
/>
```

## Peer dependencies

The host Astro project supplies `astro`, `lucide-astro`, and `mermaid` (the latter is only required for `MermaidRenderer`).
