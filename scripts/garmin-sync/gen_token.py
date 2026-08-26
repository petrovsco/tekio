#!/usr/bin/env python3
"""One-time helper: log in to Garmin (answering MFA if prompted) and print the
token JSON to paste into the GARMIN_TOKENSTORE GitHub Actions secret.

Run locally:  GARMIN_EMAIL=you@x.com GARMIN_PASSWORD=... python gen_token.py

The secret is only the *bootstrap*. From then on the sync jobs keep the token
alive themselves: Garmin rotates the refresh token on every use, so each run
saves the rotated one to Supabase (see garmin_auth.py). Re-run this only if a
run reports that every token was rejected.
"""
import os
import sys

from garminconnect import Garmin

email, password = os.getenv("GARMIN_EMAIL"), os.getenv("GARMIN_PASSWORD")
if not (email and password):
    sys.exit("Set GARMIN_EMAIL and GARMIN_PASSWORD, then re-run.")

client = Garmin(email, password, prompt_mfa=lambda: input("MFA code: "))
client.login()

# The 0.3.x client serializes to JSON: {"di_token", "di_refresh_token", "di_client_id"}.
# (0.2.x used garth and emitted a base64 blob — not interchangeable.)
blob = client.client.dumps()
print("\n=== GARMIN_TOKENSTORE (copy everything between the lines) ===\n")
print(blob)
print("\n=== end — paste into the GitHub Actions secret ===")
