# EsotericCode Design Direction

EsotericCode is a dark editorial oracle for software architecture: occult divination aesthetics fused with precise repository-system cues, never generic SaaS. The signature palette is near-black violet, warm ivory, and ritual gold. Gold is reserved for primary action, selected state, and symbolic marks; bright blue and unrelated primary accents are excluded.

Every page state—including authentication, empty archives, unavailable readings, private GitHub connection, and sharing confirmation—must retain the same concise, ceremonial, technically grounded voice. Use small uppercase mono labels, large warm-serif headings, restrained cards, source-tree labels, module counts, and subtle constellation or system-map geometry to make the engineering evidence as visible as the symbolic interpretation.

The reading surfaces should always place measurable repository evidence before or beside the Tarot, I Ching, and KP-inspired material. Symbolic cards vary through internal hierarchy and evidence cues, rather than through loud color changes, so the application feels authored and calm across long pages.

## Verification Note

The live preview was checked with `https://github.com/octocat/Hello-World`. The public intake accepted the repository URL and opened its reading directly, with no EsotericCode sign-in, GitHub authorization, email link, or verification prompt.

## Mobile intake bug

A mobile screenshot showed a valid public URL ending in `kevinparksinc-maker/esotericcode` returning a generic GitHub read error. The URL field is horizontally scrolled to the end on narrow screens, which makes the value appear clipped but does not alter the submitted value. Public analysis now treats contributor and recent-commit enrichment as optional so rate limits or delayed GitHub responses do not block a valid repository reading; repository identity and the file tree remain required.

## Production verification

On the public domain, `https://github.com/kevinparksinc-maker/esotericcode` now opens a complete reading for 158 measured files. The valid URL is accepted without sign-in. Optional contributor and recent-commit endpoint failures no longer prevent the core repository and tree analysis from completing.

## Final mobile input verification

At the narrow viewport, the complete entered repository URL is now rendered below the horizontally scrollable input in a wrapping line. This lets a visitor verify the exact URL before submitting, even when the input itself cannot display the entire long value at once.
