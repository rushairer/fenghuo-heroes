# 189 Ruler Portrait Production Notes v1

This document tracks the first clean-room HD ruler portrait candidates for the 189 scenario.

## Intent

These files are **production candidates**, not active runtime assets yet.

They were cropped from the project Image 2.5 ruler-style board, normalized to a 2:3 portrait ratio, resized to `128x192`, and lightly sharpened for the current `32x48` logical portrait target at 4x HD rendering.

They intentionally remain `planned` in `asset-manifest.v1.json` until original-game UI evidence confirms where ruler portraits belong. This avoids changing original setup geometry just because art is available.

## First batch

| Ruler | Runtime file | Size | SHA-256 |
| --- | --- | ---: | --- |
| Liu Bei | `public/assets/portraits/rulers/portrait-ruler-liubei-v1.webp` | 8,790 bytes | `b47ea404f3fd0001db58f3a32f7b2f1dd100aaf50f9a609700ee0854f4d61406` |
| Cao Cao | `public/assets/portraits/rulers/portrait-ruler-caocao-v1.webp` | 9,724 bytes | `c7fafb74134a001bf1df871fbdd3c84da09ac4b86e03e0710a750323dc861699` |
| Sun Jian | `public/assets/portraits/rulers/portrait-ruler-sunjian-v1.webp` | 10,316 bytes | `94e7c881b2f9753da5985d43b183f42012b11127958b20720e4ce9957302a47c` |

## Activation rule

Do not switch these manifest entries to `ready` merely because the files exist. Activate a portrait only after the target screen has been verified against original gameplay footage/screenshots and the portrait does not change the original UI hierarchy or interaction model.

Remaining 189 rulers to produce in the same crop/style pass:

- Yuan Shao
- Dong Zhuo
- Liu Biao
- Ma Teng
