"""Summarise a garmin-activities.json dump: structure, per-type stats, and what
the app's current cardio classifier (src/lib/adaptations.ts) would make of it.

usage: python3 analyze_dump.py <dump.json> [csv-out]
"""
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from statistics import median

path = sys.argv[1]
csv_out = sys.argv[2] if len(sys.argv) > 2 else None
acts = json.load(open(path, encoding="utf-8"))
print(f"{len(acts)} activities in {path}")


def tk(a):
    return ((a.get("activityType") or {}).get("typeKey") or "").lower()


def num(v):
    try:
        return None if v is None else float(v)
    except (TypeError, ValueError):
        return None


def zones(a):
    z = [num(a.get(f"hrTimeInZone_{i}")) for i in range(1, 6)]
    if all(v is None for v in z):
        return None
    z = [v or 0.0 for v in z]
    tot = sum(z)
    return [v / tot for v in z] if tot > 0 else None


# --- classifier mirror (adaptations.ts) -------------------------------------
TE_T = 2.0


def by_duration(minutes):
    if minutes >= 25:
        return "endurance"
    if minutes >= 8:
        return "vo2max"
    return "anaerobic"


def aerobic_hi(label, z):
    label = (label or "").upper()
    if re.search(r"RECOVERY|BASE", label):
        return False
    if re.search(r"TEMPO|THRESHOLD|VO2|VO₂|ANAEROBIC|SPRINT|SPEED", label):
        return True
    if z and len(z) >= 5:
        return (z[3] + z[4]) > (z[0] + z[1])
    return False


def classify(a):
    aero, anaero = num(a.get("aerobicTrainingEffect")), num(a.get("anaerobicTrainingEffect"))
    minutes = (num(a.get("duration")) or 0) / 60
    if aero is None and anaero is None:
        return [by_duration(minutes)], "duration"
    aero, anaero = aero or 0, anaero or 0
    bucket = "vo2max" if aerobic_hi(a.get("trainingEffectLabel"), zones(a)) else "endurance"
    out = []
    out.append("anaerobic" if anaero > aero else bucket)
    if aero >= TE_T and bucket not in out:
        out.append(bucket)
    if anaero >= TE_T and "anaerobic" not in out:
        out.append("anaerobic")
    return out, "te"


# --- structure ---------------------------------------------------------------
keys = Counter()
for a in acts:
    for k, v in a.items():
        if v is not None and v != "" and v != []:
            keys[k] += 1
print("\n== Fields present (fill rate) — the ones that matter for classification ==")
watch = ["activityType", "startTimeLocal", "duration", "distance", "averageHR", "maxHR",
         "aerobicTrainingEffect", "anaerobicTrainingEffect", "trainingEffectLabel",
         "activityTrainingLoad", "hrTimeInZone_1", "hrTimeInZone_5", "vO2MaxValue",
         "avgPower", "calories", "activityName", "steps", "lapCount", "minTemperature",
         "averageRunningCadenceInStepsPerMinute", "averageBikingCadenceInRevPerMinute"]
for k in watch:
    print(f"  {k:42s} {keys.get(k, 0):4d}/{len(acts)}")
print(f"  ({len(keys)} distinct non-empty fields in total)")

# --- per type ------------------------------------------------------------------
groups = defaultdict(list)
for a in acts:
    groups[tk(a)].append(a)

print("\n== Per activity type ==")
hdr = f"{'typeKey':18s} {'n':>4s} {'first':10s} {'last':10s} {'med min':>7s} {'TE%':>4s} {'Z%':>4s} {'med aero':>8s} {'med anae':>8s} {'med HR':>6s} {'med Z4+5':>8s}  labels"
print(hdr)
for key, g in sorted(groups.items(), key=lambda kv: -len(kv[1])):
    dates = sorted(a.get("startTimeLocal", "")[:10] for a in g)
    mins = [(num(a.get("duration")) or 0) / 60 for a in g]
    aero = [num(a.get("aerobicTrainingEffect")) for a in g]
    anae = [num(a.get("anaerobicTrainingEffect")) for a in g]
    hr = [num(a.get("averageHR")) for a in g if num(a.get("averageHR"))]
    zs = [zones(a) for a in g]
    zs_ok = [z for z in zs if z]
    te_ok = [x for x in aero if x is not None]
    labels = Counter((a.get("trainingEffectLabel") or "—") for a in g).most_common(4)
    print(f"{key:18s} {len(g):4d} {dates[0]:10s} {dates[-1]:10s} {median(mins):7.0f} "
          f"{100*len(te_ok)//len(g):3d}% {100*len(zs_ok)//len(g):3d}% "
          f"{(median(te_ok) if te_ok else float('nan')):8.1f} "
          f"{(median([x for x in anae if x is not None]) if any(x is not None for x in anae) else float('nan')):8.1f} "
          f"{(median(hr) if hr else float('nan')):6.0f} "
          f"{(100*median(z[3]+z[4] for z in zs_ok) if zs_ok else float('nan')):7.0f}%  "
          + ", ".join(f"{l} ×{n}" for l, n in labels))

# --- what the current classifier would do ---------------------------------------
print("\n== Current classifier applied to every type (counts of sessions per adaptation; a session can count twice) ==")
for key, g in sorted(groups.items(), key=lambda kv: -len(kv[1])):
    c = Counter()
    how = Counter()
    for a in g:
        out, h = classify(a)
        how[h] += 1
        for o in out:
            c[o] += 1
    print(f"  {key:18s} n={len(g):3d}  endurance {c['endurance']:3d}  vo2max {c['vo2max']:3d}  anaerobic {c['anaerobic']:3d}   (via TE {how['te']}, via duration {how['duration']})")

# --- HIIT deep-dive --------------------------------------------------------------
h = groups.get("hiit", [])
if h:
    print(f"\n== HIIT ({len(h)}) ==")
    years = Counter(a.get("startTimeLocal", "")[:4] for a in h)
    print("  per year: " + ", ".join(f"{y} ×{n}" for y, n in sorted(years.items())))
    names = Counter((a.get("activityName") or "—") for a in h).most_common(8)
    print("  names: " + ", ".join(f"{n} ×{c}" for n, c in names))
    pairs = Counter()
    for a in h:
        ae, an = num(a.get("aerobicTrainingEffect")), num(a.get("anaerobicTrainingEffect"))
        pairs["anaero > aero" if (an or 0) > (ae or 0) else "aero ≥ anaero"] += 1
    print("  dominant system: " + ", ".join(f"{k} ×{v}" for k, v in pairs.items()))
    print("  aerobic TE   : " + ", ".join(f"{b} ×{n}" for b, n in sorted(Counter(
        f"{int(x)}.x" if x is not None else "—" for x in (num(a.get('aerobicTrainingEffect')) for a in h)).items())))
    print("  anaerobic TE : " + ", ".join(f"{b} ×{n}" for b, n in sorted(Counter(
        f"{int(x)}.x" if x is not None else "—" for x in (num(a.get('anaerobicTrainingEffect')) for a in h)).items())))
    mins = sorted((num(a.get("duration")) or 0) / 60 for a in h)
    print(f"  duration min/med/max: {mins[0]:.0f} / {median(mins):.0f} / {mins[-1]:.0f}")
    zs = [zones(a) for a in h]
    zs = [z for z in zs if z]
    if zs:
        print("  median zone shares Z1..Z5: " + " ".join(f"{100*median(z[i] for z in zs):.0f}%" for i in range(5)))
    print("  sample rows (newest 8):")
    for a in sorted(h, key=lambda a: a.get("startTimeLocal", ""), reverse=True)[:8]:
        z = zones(a)
        print(f"    {a.get('startTimeLocal','')[:16]} {((num(a.get('duration')) or 0)/60):4.0f}min "
              f"HR {a.get('averageHR')}/{a.get('maxHR')} TE {a.get('aerobicTrainingEffect')}/{a.get('anaerobicTrainingEffect')} "
              f"{a.get('trainingEffectLabel')} load {a.get('activityTrainingLoad')} "
              f"Z4+5 {(100*(z[3]+z[4])) if z else float('nan'):.0f}%  '{a.get('activityName')}'")

# --- CSV --------------------------------------------------------------------------
if csv_out:
    cols = ["activityId", "startTimeLocal", "typeKey", "activityName", "minutes", "distance_km", "averageHR", "maxHR",
            "aerobicTrainingEffect", "anaerobicTrainingEffect", "trainingEffectLabel", "activityTrainingLoad",
            "z1", "z2", "z3", "z4", "z5", "vO2MaxValue", "calories", "classifier"]
    with open(csv_out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for a in sorted(acts, key=lambda a: a.get("startTimeLocal", "")):
            z = zones(a) or [None] * 5
            out, _ = classify(a)
            w.writerow([a.get("activityId"), a.get("startTimeLocal"), tk(a), a.get("activityName"),
                        round((num(a.get("duration")) or 0) / 60, 1),
                        round((num(a.get("distance")) or 0) / 1000, 2), a.get("averageHR"), a.get("maxHR"),
                        a.get("aerobicTrainingEffect"), a.get("anaerobicTrainingEffect"), a.get("trainingEffectLabel"),
                        a.get("activityTrainingLoad"), *[None if v is None else round(v, 3) for v in z],
                        a.get("vO2MaxValue"), a.get("calories"), "+".join(out)])
    print(f"\nCSV written to {csv_out}")
