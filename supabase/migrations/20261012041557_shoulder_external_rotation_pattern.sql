-- tekio.rfcs/rfcs/0105-shoulder-external-rotation.md: the 32nd movement pattern,
-- keyed as src/constants/movementPatterns.ts keys it, so a new external-rotation
-- lift is tagged with its pattern when it is first logged. Additive only.
insert into public.movement_patterns (key, name)
values ('shoulderExternalRotation', 'Shoulder External Rotation')
on conflict (key) do nothing;
