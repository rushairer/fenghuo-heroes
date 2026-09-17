# 189 Ruler Portrait Production Notes v1

This document tracks the clean-room HD ruler portrait candidates for the 189 scenario.

## Intent

These files are **production candidates**, not active runtime assets yet.

They were cropped from the project Image 2.5 ruler-style board, normalized to a 2:3 portrait ratio, resized to `128x192`, and lightly sharpened for the current `32x48` logical portrait target at 4x HD rendering.

They intentionally remain `planned` in `asset-manifest.v1.json` until original-game UI evidence confirms where ruler portraits belong. This avoids changing original setup geometry just because art is available.

The original manual confirms a country-status -> officer-list -> officer-status interaction path, and public original-game screenshots confirm that a character-status screen exists. That is enough to keep producing compatible portrait candidates, but it is **not** enough to assert the exact portrait crop, size or placement used by the original screen. Runtime activation therefore remains gated on screen-level visual evidence.

## Complete 189 selectable-ruler candidate set

| Ruler | Runtime file | Size | SHA-256 |
| --- | --- | ---: | --- |
| Liu Bei | `public/assets/portraits/rulers/portrait-ruler-liubei-v1.webp` | 8,790 bytes | `b47ea404f3fd0001db58f3a32f7b2f1dd100aaf50f9a609700ee0854f4d61406` |
| Cao Cao | `public/assets/portraits/rulers/portrait-ruler-caocao-v1.webp` | 9,724 bytes | `c7fafb74134a001bf1df871fbdd3c84da09ac4b86e03e0710a750323dc861699` |
| Sun Jian | `public/assets/portraits/rulers/portrait-ruler-sunjian-v1.webp` | 10,316 bytes | `94e7c881b2f9753da5985d43b183f42012b11127958b20720e4ce9957302a47c` |
| Yuan Shao | `public/assets/portraits/rulers/portrait-ruler-yuanshao-v1.webp` | 6,042 bytes | `5b90f4f8d21f4a2dd0f0133c49e424b662735860663941246aa70f400f239270` |
| Dong Zhuo | `public/assets/portraits/rulers/portrait-ruler-dongzhuo-v1.webp` | 5,824 bytes | `00d5995a7074e9ef6557808be72f4dc123b91835cffdfba8254c5288f2cf1d50` |
| Liu Biao | `public/assets/portraits/rulers/portrait-ruler-liubiao-v1.webp` | 4,810 bytes | `bf81db2dc81967f648a368cbf44b820343148b409b633bcd2bd9f9796dbde7bf` |
| Ma Teng | `public/assets/portraits/rulers/portrait-ruler-mateng-v1.webp` | 5,836 bytes | `626b6413120f3038fa0e0738b51c00ab81bd668abc0c75e89e5212acf768f25d` |

All seven selectable 189 rulers now have a consistent clean-room HD portrait candidate in the repository.

## Activation rule

Do not switch these manifest entries to `ready` merely because the files exist. Activate a portrait only after the target screen has been verified against original gameplay footage/screenshots and the portrait does not change the original UI hierarchy or interaction model.

In particular:

1. Keep Setup text/selection geometry code-native unless the original screen shows portraits there.
2. Do not treat the opening faction roster as verified current per-city officer placement.
3. Do not invent unverified officer attributes (level, force, intelligence, virtue, loyalty) to fill a portrait/status screen.
4. When a verified character-status composition is available, activate only the portrait keys actually consumed by that composition and keep Canvas/text fallbacks intact.
