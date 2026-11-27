# Tactical battle movement observations

Current field/siege cursor input is not a tactical engine. The two published
battle stills in the evidence catalog are different battles and cannot yield
a movement rate. Chinese and Japanese printed p. 24 confirm that provisions
are consumed in battle as well as marching, but the existing engineering day
advance is not a verified original clock; it must not debit the campaign.

Use `tools/battle-movement-capture.html` with a legal local recording or two
uncropped same-resolution stills from **one** Chinese-edition battle.

1. Identify the source, battle and same named/identifiable unit. Record
   speed mode and observed battle days, leaving unknown values unknown.
2. Pause at a before frame, capture it, then choose two distinct stationary
   terrain landmarks and the center of the unit flag in that order.
3. Repeat at a later frame with the same landmarks and marker identity.
   Choose an uninterrupted movement segment with no contact, menu or
   camera-scale change; use additional pairs to check reproducibility.
4. Export the candidate. Coordinates are native source pixels, not
   320×224 logical positions; the two landmark translations must agree
   exactly or the workbench rejects the pair. The relative delta is the
   marker screen delta minus the common landmark shift.
5. Manually review the original frames, including crop, identity, commands,
   terrain, pause/fast-forward and edition. Video timestamps are not
   emulated frame counts or battle-day durations. A single pair does not
   establish speed, arrival/contact rules, or movement-grid spacing.

The JSON contains no original media and always has `verified:false`. No
runtime reads this candidate, and no new deployment coordinates or combat
effects are inferred. A future calibrated runtime needs multiple compatible
pairs, controlled terrain/unit/speed comparisons and separate positive and
negative contact observations.

Priority capture: the existing Chinese longplay BV1i4421F7cq P4 (192 defense)
and P6 (193 defense), followed by a controlled original session with the same
unit moving in open ground and a stationary comparison. These chapter labels
are leads, not measured frames.
