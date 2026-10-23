// Generated from packages/client/openapi.json by `npm run api:client`. Do not edit.

export interface paths {
    "/api/read/home": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Home: what is missing, and whether today can push. */
        get: operations["getHomeRead"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/view/home": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Home as it is printed: the verdict, the readiness card, the map’s callouts and the tiles. */
        get: operations["getHomeView"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/read/adaptations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Adaptations: one muscle-linked quality, explained. */
        get: operations["getAdaptationsRead"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/read/readiness": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Readiness: today's reading and the days behind it. */
        get: operations["getReadinessRead"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Every row the web app opens with, in one answer; a first call writes the profile and the default sections. */
        get: operations["getStart"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weights": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Log a lift: one exercise and its sets on a day. */
        post: operations["logWeights"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weights/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Take a logged lift out, with its sets. */
        delete: operations["deleteWeights"];
        options?: never;
        head?: never;
        /** Replace a logged lift's sets, and move it to another day if `date` is given. */
        patch: operations["editWeights"];
        trace?: never;
    };
    "/api/cardio": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Log a cardio session. */
        post: operations["logCardio"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cardio/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace a logged cardio session with the one sent. */
        put: operations["replaceCardio"];
        post?: never;
        /** Take a logged cardio session out. */
        delete: operations["deleteCardio"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sleep": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Log a night. */
        post: operations["logSleep"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sleep/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace a logged night with the one sent. */
        put: operations["replaceSleep"];
        post?: never;
        /** Take a logged night out. */
        delete: operations["deleteSleep"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/bodyweight": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Log a weigh-in. */
        post: operations["logBodyweight"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/bodyweight/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace a logged weigh-in with the one sent. */
        put: operations["replaceBodyweight"];
        post?: never;
        /** Take a logged weigh-in out. */
        delete: operations["deleteBodyweight"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/donations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Log a donation. */
        post: operations["logDonation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/donations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace a logged donation with the one sent. */
        put: operations["replaceDonation"];
        post?: never;
        /** Take a logged donation out. */
        delete: operations["deleteDonation"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sauna": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Log a sauna bout. */
        post: operations["logSauna"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sauna/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace a logged sauna bout with the one sent. */
        put: operations["replaceSauna"];
        post?: never;
        /** Take a logged sauna bout out. */
        delete: operations["deleteSauna"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cold": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Log a cold bout. */
        post: operations["logCold"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cold/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace a logged cold bout with the one sent. */
        put: operations["replaceCold"];
        post?: never;
        /** Take a logged cold bout out. */
        delete: operations["deleteCold"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sport": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Log a sport session. */
        post: operations["logSport"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sport/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace a logged sport session with the one sent. */
        put: operations["replaceSport"];
        post?: never;
        /** Take a logged sport session out. */
        delete: operations["deleteSport"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/mobility": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Log a mobility session. */
        post: operations["logMobility"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/mobility/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace a logged mobility session with the one sent. */
        put: operations["replaceMobility"];
        post?: never;
        /** Take a logged mobility session out. */
        delete: operations["deleteMobility"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/readiness/{date}/morning-hrv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Type the morning's HRV; a second one that day replaces it. The day's check-in is kept. */
        put: operations["putMorningHrv"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/readiness/{date}/check-in": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Answer the day's check-in; a second one that day replaces it. The morning HRV is kept. */
        put: operations["putCheckIn"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/lifts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Plan a lift. */
        post: operations["planLift"];
        delete?: never;
        options?: never;
        head?: never;
        /** Put planned lifts into one superset, or move them to another day. */
        patch: operations["groupPlannedLifts"];
        trace?: never;
    };
    "/api/plans/lifts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace a planned lift with the one sent. */
        put: operations["replacePlannedLift"];
        post?: never;
        /** Take a planned lift out. */
        delete: operations["deletePlannedLift"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Plan a session. */
        post: operations["planSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/sessions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace a planned session with the one sent. */
        put: operations["replacePlannedSession"];
        post?: never;
        /** Take a planned session out. */
        delete: operations["deletePlannedSession"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/lifts/{id}/logged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Point a planned lift at the logged lift it became. */
        put: operations["markLiftPlanLogged"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/sessions/{id}/logged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Point a planned session at the logged session it became. */
        put: operations["markSessionPlanLogged"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/missed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete the plans dated before `before` that were never logged: missed, and kept a while to be moved or removed. */
        delete: operations["deleteMissedPlans"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Change any of the profile’s settings; the ones not sent stay as they are. */
        patch: operations["updateProfile"];
        trace?: never;
    };
    "/api/sections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Save the menu’s sections in their new order. */
        put: operations["saveSections"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sections/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Show a section in the menu, or hide it. */
        patch: operations["showSection"];
        trace?: never;
    };
    "/api/sync/garmin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The newest Garmin sync that brought data in; null when there has been none. */
        get: operations["getLastGarminSync"];
        put?: never;
        /** Ask for a Garmin sync now. A run already open is returned rather than a second one started. */
        post: operations["requestGarminSync"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/runs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** One of the caller’s sync runs, to follow it to its end. */
        get: operations["getSyncRun"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sign-in/link": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Email a sign-in link; the account is made the first time an address asks. */
        post: operations["sendSignInLink"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sign-in/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Turn the code a sign-in link came back with into a session. */
        post: operations["exchangeSignInCode"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sign-in/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** A fresh access token for a refresh token; each refresh token works once. */
        post: operations["refreshSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/error-reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Report an error the app did not expect. Needs no sign-in: it can happen before one. */
        post: operations["sendErrorReport"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        HomeRead: {
            date: string;
            muscles: components["schemas"]["MuscleState"][];
            /** @description The muscles short of the map’s top band, largest gap first. */
            gaps: components["schemas"]["MuscleState"][];
            qualities: components["schemas"]["QualityState"][];
            coverage: {
                power?: components["schemas"]["AdaptationSummary"];
                strength?: components["schemas"]["AdaptationSummary"];
                hypertrophy?: components["schemas"]["AdaptationSummary"];
                muscular_endurance?: components["schemas"]["AdaptationSummary"];
                anaerobic_capacity?: components["schemas"]["AdaptationSummary"];
                vo2max?: components["schemas"]["AdaptationSummary"];
                endurance?: components["schemas"]["AdaptationSummary"];
            };
            readiness: components["schemas"]["SystemicReadiness"];
            donation: components["schemas"]["DonationStatus"];
            verdict: components["schemas"]["Verdict"];
        };
        MuscleState: {
            id: string;
            name: string;
            parentId: string | null;
            /** @description No other group names this one as its parent. */
            leaf: boolean;
            /** @description Level-weighted hard sets in the window. */
            sets: number;
            /** @description Days since the last stimulus; null = never. */
            daysSince: number | null;
            /** @description Inside the recovery window after a real dose. */
            recovering: boolean;
            /** @description Sets over the window target, uncapped: what the map colours by. */
            fillFraction: number;
        };
        QualityState: {
            /** @enum {string} */
            key: "vo2max" | "endurance" | "anaerobic_capacity";
            /** @description Days since the last qualifying session; null = never. */
            daysSince: number | null;
            windowDays: number;
            /** @description Past its detraining window, or never trained: reads as missing. */
            stale: boolean;
        };
        AdaptationSummary: {
            /** @enum {string} */
            key: "power" | "strength" | "hypertrophy" | "muscular_endurance" | "anaerobic_capacity" | "vo2max" | "endurance";
            /** @description Volume over the window, in `unit`. */
            volume: number;
            /** @enum {string} */
            unit: "sets" | "sessions" | "minutes";
            muscles: components["schemas"]["MuscleStatusRow"][];
            onTrack: number;
            worked: number;
            totalMuscles: number;
            /** @description Whole-body target over the window; 0 for a per-muscle quality. */
            target: number;
            met: boolean;
        };
        MuscleStatusRow: {
            id: string;
            name: string;
            parentId: string | null;
            sets: number;
            /** @description The same, with the immediate children. */
            aggSets: number;
            target: number;
            /** @enum {string} */
            status: "on_track" | "needs_work" | "untouched";
            fillFraction: number;
            children: components["schemas"]["MuscleStatusRow"][];
        };
        SystemicReadiness: {
            /** @description 0 to 100, 50 being the person’s own normal. */
            readiness: number | null;
            /** @enum {string|null} */
            band: "low" | "moderate" | "ok" | null;
            /**
             * @description The method the verdict came from.
             * @enum {string|null}
             */
            method: "overnight_hrv" | "morning_hrv" | "check_in" | null;
            /**
             * @description The method the person reads from.
             * @enum {string|null}
             */
            chosen: "overnight_hrv" | "morning_hrv" | "check_in" | null;
            /** @description Chosen in Profile, rather than picked automatically. */
            picked: boolean;
            /** @description A watch or ring delivered HRV in the last 3 days. */
            connected: boolean;
            awaitingInput: boolean;
            /** @description Readings toward the first verdict, while there is none. */
            progress: {
                have: number;
                need: number;
            } | null;
            z: number | null;
            recent: number | null;
            normal: {
                low: number;
                high: number;
            } | null;
            gauge: components["schemas"]["Gauge"];
            notes: {
                restingHrAbove: number | null;
                shortNight: number | null;
            };
            sleepScore: number | null;
            sleepScoreDate: string | null;
            hrv: number | null;
            hrvDate: string | null;
        };
        Gauge: {
            /** @enum {string} */
            side: "below" | "inside" | "above";
            /** @description The dot's place along the track, 0 to 1. */
            at: number;
        } | null;
        DonationStatus: {
            /** @description Days since the last full-blood donation; null = never. */
            daysSince: number | null;
            acuteHold: boolean;
            aerobicSuppressed: boolean;
            eligibleInDays: number;
        };
        Verdict: {
            /** @enum {string} */
            mode: "push" | "steady" | "hold";
            /** @enum {string|null} */
            cause: "readiness" | "donation" | null;
        };
        Error: {
            error: string;
        };
        HomeView: {
            date: string;
            zeroData: boolean;
            readinessLabel: string;
            verdict: {
                text: string;
                sub: string;
            };
            readiness: {
                /** @description A held day: the card inverts to ink. */
                gated: boolean;
                method: string | null;
                band: string;
                columns: components["schemas"]["GateColumn"][];
                note: string | null;
                hint: string | null;
            };
            banner: string | null;
            map: {
                muscles: components["schemas"]["MuscleState"][];
                callouts: components["schemas"]["MapCallout"][];
            };
            qualities: {
                /** @description The untouched names, printed in the accent. */
                untouched: string | null;
                short: string | null;
                /** @description The whole line, when neither half applies. */
                line: string | null;
            };
            wholeBody: components["schemas"]["QualityTile"][];
            folds: components["schemas"]["FoldTile"][];
        };
        GateColumn: {
            label: string;
            value: string;
            /** @description An amount out of 100, drawn as a fill. */
            pct?: number;
            /** @description A reading on the person’s own normal: a dot on its range; null draws the empty track; absent draws the fill. */
            gauge?: {
                /** @enum {string} */
                side: "below" | "inside" | "above";
                /** @description The dot's place along the track, 0 to 1. */
                at: number;
            } | null;
            /** @enum {string} */
            tone: "ink" | "mid" | "accent" | "off";
            /** @description A typed reading still to give today: the value reads as a prompt. */
            ask?: boolean;
            note?: string;
        };
        MapCallout: {
            muscle: string;
            /** @description 1 to 4, or null for the lighter unnumbered fifth. */
            rank: number | null;
            label: string;
            sub: string;
        };
        QualityTile: {
            /** @enum {string} */
            key: "vo2max" | "anaerobic_capacity" | "endurance";
            name: string;
            note: string;
            /** @description 0 to 3 on the stimulus ramp; null is white. */
            step: 0 | 1 | 2 | 3 | null;
            /** @enum {string} */
            edge: "blank" | "accent" | "ramp" | "ink";
        };
        FoldTile: {
            /** @enum {string} */
            kind: "weight" | "blood";
            label: string;
            value: string;
            note: string;
            accent: boolean;
        };
        AdaptationsRead: {
            date: string;
            coverage: {
                power?: components["schemas"]["AdaptationSummary"];
                strength?: components["schemas"]["AdaptationSummary"];
                hypertrophy?: components["schemas"]["AdaptationSummary"];
                muscular_endurance?: components["schemas"]["AdaptationSummary"];
                anaerobic_capacity?: components["schemas"]["AdaptationSummary"];
                vo2max?: components["schemas"]["AdaptationSummary"];
                endurance?: components["schemas"]["AdaptationSummary"];
            };
            /** @enum {string} */
            quality: "strength" | "hypertrophy" | "muscular_endurance" | "power";
            shape: {
                /** @enum {string} */
                unit: "sets" | "sessions" | "minutes";
                weekly: number;
            };
            muscles: components["schemas"]["MuscleState"][];
            gaps: components["schemas"]["MuscleState"][];
            qualities: components["schemas"]["QualityState"][];
            liftingSets: number;
            cardioSessions: number;
            atThreshold: number;
        };
        ReadinessRead: {
            date: string;
            readiness: components["schemas"]["SystemicReadiness"];
            donation: components["schemas"]["DonationStatus"];
            verdict: components["schemas"]["Verdict"];
            trend: components["schemas"]["ReadinessTrend"];
        };
        ReadinessTrend: {
            days: {
                date: string;
                single: number | null;
                read: number | null;
                printed: number | null;
            }[];
            normal: {
                low: number;
                high: number;
            } | null;
            full: boolean;
        } | null;
        StartRows: {
            weights: components["schemas"]["WeightEntry"][];
            bodyweight: components["schemas"]["BodyweightEntry"][];
            cardio: components["schemas"]["CardioEntry"][];
            mobility: components["schemas"]["MobilityEntry"][];
            muscleGroups: components["schemas"]["MuscleGroup"][];
            exerciseMuscles: components["schemas"]["ExerciseMuscleLink"][];
            /** @description Lower-cased exercise name to the adaptation the catalogue tags it with. */
            exerciseAdaptations: {
                [key: string]: "power" | "strength" | "hypertrophy" | "muscular_endurance" | "anaerobic_capacity" | "vo2max" | "endurance";
            };
            sports: components["schemas"]["SportEntry"][];
            sportTypes: components["schemas"]["SportType"][];
            donations: components["schemas"]["DonationEntry"][];
            sleep: components["schemas"]["SleepEntry"][];
            sauna: components["schemas"]["ExposureBout"][];
            cold: components["schemas"]["ExposureBout"][];
            /** @description Weekly targets the person set, overriding the built-in ones. */
            adaptationTargets: {
                power?: {
                    weeklyMuscleTarget: number;
                    weeklySessionTarget: number;
                    weeklyMinutesTarget: number;
                };
                strength?: {
                    weeklyMuscleTarget: number;
                    weeklySessionTarget: number;
                    weeklyMinutesTarget: number;
                };
                hypertrophy?: {
                    weeklyMuscleTarget: number;
                    weeklySessionTarget: number;
                    weeklyMinutesTarget: number;
                };
                muscular_endurance?: {
                    weeklyMuscleTarget: number;
                    weeklySessionTarget: number;
                    weeklyMinutesTarget: number;
                };
                anaerobic_capacity?: {
                    weeklyMuscleTarget: number;
                    weeklySessionTarget: number;
                    weeklyMinutesTarget: number;
                };
                vo2max?: {
                    weeklyMuscleTarget: number;
                    weeklySessionTarget: number;
                    weeklyMinutesTarget: number;
                };
                endurance?: {
                    weeklyMuscleTarget: number;
                    weeklySessionTarget: number;
                    weeklyMinutesTarget: number;
                };
            };
            exerciseAliases: components["schemas"]["ExerciseAlias"][];
            readinessInputs: components["schemas"]["ReadinessInput"][];
            plans: components["schemas"]["PlannedExercise"][];
            sessionPlans: components["schemas"]["PlannedSession"][];
            profile: components["schemas"]["UserProfile"];
            sections: components["schemas"]["Section"][];
        };
        WeightEntry: {
            id: string;
            date: string;
            /** @description The name the lift is filed under, which may differ from the one typed. */
            exercise: string;
            sets: components["schemas"]["LiftSet"][];
            supersetId?: string;
        };
        LiftSet: {
            /** @description Load in kg; 0 for bodyweight. */
            weight: number;
            /** @description Whole reps; 1 for a hold. */
            reps: number;
            /** @description How long a hold lasted, in whole seconds (RFC 0107). */
            seconds?: number;
        };
        BodyweightEntry: {
            date: string;
            /** @description Kilograms. One reading a day: a second one replaces the first. */
            weight: number;
            id: string;
        };
        CardioEntry: {
            date: string;
            /** @enum {string} */
            type: "Running" | "Cycling" | "Swimming" | "Indoor Rowing" | "Custom";
            /** @description Minutes. */
            duration: number;
            /** @description Kilometres. */
            distance?: number;
            /** @description Beats per minute. */
            avgHr?: number;
            notes?: string;
            /** @enum {string} */
            format?: "steady" | "intervals";
            /** @description Work-bout length of an intervals session. */
            boutSeconds?: number;
            id: string;
            /**
             * @description Typed, or pulled from the watch.
             * @enum {string}
             */
            source?: "manual" | "garmin";
            garminActivityId?: number;
            maxHr?: number;
            aerobicTe?: number;
            anaerobicTe?: number;
            trainingEffectLabel?: string;
            trainingLoad?: number;
            /** @description Seconds in heart-rate zones 1 to 5. */
            zoneDistribution?: number[];
            elevationGain?: number;
        };
        MobilityEntry: {
            date: string;
            exercises: {
                name: string;
                /** @description Minutes. */
                duration: number;
                /** @default  */
                notes: string;
                /** @description Muscle-group names the stretch targets. */
                muscleGroups?: string[];
            }[];
            id: string;
            /** @description Minutes, the sum of the stretches. */
            duration: number;
        };
        MuscleGroup: {
            id: string;
            name: string;
            /** @enum {string} */
            bodyRegion: "upper" | "lower" | "core" | "full_body";
            /** @description The group this one sits under; absent at the top. */
            parentId?: string | null;
        };
        ExerciseMuscleLink: {
            exercise: string;
            group: string;
            /** @enum {string} */
            region: "upper" | "lower" | "core" | "full_body";
            /** @description 1 is the most direct. */
            level: 1 | 2 | 3;
            /** @enum {string} */
            contribution: "stimulus" | "recovery";
        };
        SportEntry: {
            date: string;
            /** @description A new name creates the sport. */
            sport: string;
            /** @default false */
            withTrainer: boolean;
            /** @description 1 to 5; 0 while unrated. */
            quality: number;
            /** @default  */
            notes: string;
            /** @description Minutes. */
            duration?: number;
            /** @description Beats per minute. */
            avgHr?: number;
            competitorNames?: string[];
            /** @enum {string} */
            result?: "win" | "loss" | "tie";
            teammateNames?: string[];
            id: string;
            /**
             * @description Typed, or pulled from the watch.
             * @enum {string}
             */
            source?: "manual" | "garmin";
            garminActivityId?: number;
            maxHr?: number;
            aerobicTe?: number;
            anaerobicTe?: number;
            trainingEffectLabel?: string;
            trainingLoad?: number;
            /** @description Seconds in heart-rate zones 1 to 5. */
            zoneDistribution?: number[];
        };
        SportType: {
            name: string;
            hasCompetitor: boolean;
            hasTeammate: boolean;
        };
        DonationEntry: {
            date: string;
            /** @enum {string} */
            type: "Full Blood" | "Plasma";
            /** @default  */
            notes: string;
            id: string;
        };
        SleepEntry: {
            date: string;
            hours: number;
            /** @description 1 (poor) to 5 (great). */
            quality?: number;
            notes?: string;
            id: string;
            score?: number;
            scoreQualifier?: string;
            hrv?: number;
            restingHr?: number;
            /**
             * @description Typed, or pulled from the watch.
             * @enum {string}
             */
            source?: "manual" | "garmin";
        };
        ExposureBout: {
            date: string;
            /** @description Minutes. */
            duration: number;
            /** @description °C, if tracked. */
            tempC?: number;
            notes?: string;
            id: string;
        };
        ExerciseAlias: {
            alias: string;
            canonicalName: string;
            /** @description The person's own, rather than shipped with the app. */
            isOwn: boolean;
        };
        ReadinessInput: {
            id: string;
            date: string;
            morningHrv?: number;
            checkIn?: components["schemas"]["CheckInAnswers"];
        };
        /** @description Five answers, 1 to 5. */
        CheckInAnswers: {
            energy: number;
            soreness: number;
            sleepQuality: number;
            stress: number;
            mood: number;
        };
        PlannedExercise: {
            date: string;
            exercise: string;
            /** @description What to aim at, not results. */
            targets: components["schemas"]["LiftSet"][];
            /**
             * @description Who wrote the plan: the person, or an agent on their behalf.
             * @default user
             * @enum {string}
             */
            plannedBy: "user" | "agent";
            id: string;
            supersetId?: string;
            /** @description The entry this plan became, once logged. */
            loggedAs?: string;
        };
        PlannedSession: {
            date: string;
            /** @enum {string} */
            kind: "cardio" | "sport" | "mobility";
            /** @description The cardio type (Running, Cycling, Swimming, Indoor Rowing, Custom) or the sport; empty for mobility. */
            name: string;
            /** @description Minutes. */
            duration?: number;
            /** @description Kilometres. */
            distance?: number;
            /** @enum {string} */
            format?: "steady" | "intervals";
            boutSeconds?: number;
            /** @description The stretches of a mobility plan, minutes each. */
            stretches?: {
                name: string;
                duration: number;
            }[];
            notes?: string;
            /**
             * @description Who wrote the plan: the person, or an agent on their behalf.
             * @default user
             * @enum {string}
             */
            plannedBy: "user" | "agent";
            id: string;
            /** @description The entry this plan became, once logged. */
            loggedAs?: string;
        };
        UserProfile: {
            /** @enum {string} */
            weekStartDay: "monday" | "sunday";
            /** @description The HRmax the person set, in bpm; null when there is none. */
            hrMaxStored: number | null;
            /** @enum {string|null} */
            hrMaxSource: "typed" | "tracker" | null;
            birthDate: string | null;
            /**
             * @description Null picks the best one with data.
             * @enum {string|null}
             */
            readinessMethod: "overnight_hrv" | "morning_hrv" | "check_in" | null;
        };
        Section: {
            sectionKey: string;
            showInMenu: boolean;
            sortOrder: number;
        };
        ProfilePatch: {
            /** @enum {string} */
            weekStartDay?: "monday" | "sunday";
            /** @description The HRmax the person set, and where it came from. */
            hrMax?: {
                /** @description Beats per minute; null goes back to the age estimate. */
                value: number | null;
                /** @enum {string} */
                source: "typed" | "tracker";
            };
            /**
             * @description For the age estimate of HRmax.
             * @example 2026-10-20
             */
            birthDate?: string | null;
            /**
             * @description How readiness is read; null picks the best one with data.
             * @enum {string|null}
             */
            readinessMethod?: "overnight_hrv" | "morning_hrv" | "check_in" | null;
        };
        SyncRun: {
            id: number;
            /** @enum {string} */
            status: "requested" | "ok" | "failed";
            requestedAt: string;
            finishedAt?: string;
        };
        Session: {
            /** @description The bearer token every other route takes. */
            accessToken: string;
            refreshToken: string;
            /** @description When the access token runs out, in seconds since 1970. */
            expiresAt: number;
            email: string | null;
        };
        ErrorReport: {
            signature: string;
            payload: {
                version: string;
                build: string;
                screen: string;
                /** @enum {string} */
                source: "render" | "window" | "promise" | "write";
                name: string;
                message: string;
                code?: string;
                stack?: string;
                componentStack?: string;
                userAgent: string;
                trail: string[];
                at: string;
            };
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getHomeRead: {
        parameters: {
            query: {
                /** @description The person's own calendar day, YYYY-MM-DD. */
                date: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The Home read. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HomeRead"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getHomeView: {
        parameters: {
            query: {
                /** @description The person's own calendar day, YYYY-MM-DD. */
                date: string;
                /** @description The wake date the person’s clock calls last night: `date`, or the day before until 04:00. */
                lastNight: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The Home view. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HomeView"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getAdaptationsRead: {
        parameters: {
            query: {
                /** @description The person's own calendar day, YYYY-MM-DD. */
                date: string;
                /** @description The muscle-linked quality to map. */
                quality: "strength" | "hypertrophy" | "muscular_endurance" | "power";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The Adaptations read. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdaptationsRead"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getReadinessRead: {
        parameters: {
            query: {
                /** @description The person's own calendar day, YYYY-MM-DD. */
                date: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The readiness read. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadinessRead"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getStart: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The person's rows. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StartRows"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    logWeights: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @description As typed: an alias or a catalogue spelling resolves to its lift. */
                    exercise: string;
                    sets: components["schemas"]["LiftSet"][];
                    /**
                     * Format: uuid
                     * @description Shared by the lifts done as one superset.
                     */
                    supersetId?: string;
                    /**
                     * @description The movement, for a lift the catalogue doesn't know.
                     * @enum {string}
                     */
                    pattern?: "squat" | "lunge" | "hingeStraightKnee" | "hingeKneeBent" | "hipExtensionBentKnee" | "kneeFlexion" | "kneeExtension" | "hipAbduction" | "hipAdduction" | "plantarFlexion" | "horizontalPush" | "verticalPush" | "elbowExtension" | "shoulderAbduction" | "uprightRow" | "horizontalAdduction" | "shoulderFlexion" | "scapularElevation" | "verticalPull" | "horizontalPull" | "elbowFlexion" | "horizontalAbduction" | "straightArmExtension" | "wristAndGrip" | "shoulderExternalRotation" | "spinalFlexion" | "hipFlexionTrunk" | "antiExtension" | "rotation" | "lateralFlexion" | "carry" | "olympic";
                };
            };
        };
        responses: {
            /** @description The lift as logged. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        entry: components["schemas"]["WeightEntry"];
                        /** @description True when this created the exercise and its muscle links. */
                        linked: boolean;
                    };
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deleteWeights: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The logged lift. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such lift of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    editWeights: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The logged lift. */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    sets: components["schemas"]["LiftSet"][];
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date?: string;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such lift of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    logCardio: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @enum {string} */
                    type: "Running" | "Cycling" | "Swimming" | "Indoor Rowing" | "Custom";
                    /** @description Minutes. */
                    duration: number;
                    /** @description Kilometres. */
                    distance?: number;
                    /** @description Beats per minute. */
                    avgHr?: number;
                    notes?: string;
                    /** @enum {string} */
                    format?: "steady" | "intervals";
                    /** @description Work-bout length of an intervals session. */
                    boutSeconds?: number;
                };
            };
        };
        responses: {
            /** @description The cardio session as logged. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CardioEntry"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    replaceCardio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @enum {string} */
                    type: "Running" | "Cycling" | "Swimming" | "Indoor Rowing" | "Custom";
                    /** @description Minutes. */
                    duration: number;
                    /** @description Kilometres. */
                    distance?: number;
                    /** @description Beats per minute. */
                    avgHr?: number;
                    notes?: string;
                    /** @enum {string} */
                    format?: "steady" | "intervals";
                    /** @description Work-bout length of an intervals session. */
                    boutSeconds?: number;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged cardio session of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deleteCardio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged cardio session of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    logSleep: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The day the night ended on.
                     * @example 2026-10-20
                     */
                    date: string;
                    hours: number;
                    /** @description 1 (poor) to 5 (great). */
                    quality?: number;
                    notes?: string;
                };
            };
        };
        responses: {
            /** @description The night as logged. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SleepEntry"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    replaceSleep: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The day the night ended on.
                     * @example 2026-10-20
                     */
                    date: string;
                    hours: number;
                    /** @description 1 (poor) to 5 (great). */
                    quality?: number;
                    notes?: string;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged night of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deleteSleep: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged night of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    logBodyweight: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @description Kilograms. One reading a day: a second one replaces the first. */
                    weight: number;
                };
            };
        };
        responses: {
            /** @description The weigh-in as logged. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BodyweightEntry"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    replaceBodyweight: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @description Kilograms. One reading a day: a second one replaces the first. */
                    weight: number;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged weigh-in of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deleteBodyweight: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged weigh-in of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    logDonation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @enum {string} */
                    type: "Full Blood" | "Plasma";
                    /** @default  */
                    notes?: string;
                };
            };
        };
        responses: {
            /** @description The donation as logged. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DonationEntry"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    replaceDonation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @enum {string} */
                    type: "Full Blood" | "Plasma";
                    /** @default  */
                    notes?: string;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged donation of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deleteDonation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged donation of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    logSauna: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @description Minutes. */
                    duration: number;
                    /** @description °C, if tracked. */
                    tempC?: number;
                    notes?: string;
                };
            };
        };
        responses: {
            /** @description The sauna bout as logged. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExposureBout"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    replaceSauna: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @description Minutes. */
                    duration: number;
                    /** @description °C, if tracked. */
                    tempC?: number;
                    notes?: string;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged sauna bout of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deleteSauna: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged sauna bout of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    logCold: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @description Minutes. */
                    duration: number;
                    /** @description °C, if tracked. */
                    tempC?: number;
                    notes?: string;
                };
            };
        };
        responses: {
            /** @description The cold bout as logged. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExposureBout"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    replaceCold: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @description Minutes. */
                    duration: number;
                    /** @description °C, if tracked. */
                    tempC?: number;
                    notes?: string;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged cold bout of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deleteCold: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged cold bout of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    logSport: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @description A new name creates the sport. */
                    sport: string;
                    /** @default false */
                    withTrainer?: boolean;
                    /** @description 1 (poor) to 5 (great). */
                    quality?: number;
                    /** @default  */
                    notes?: string;
                    /** @description Minutes. */
                    duration?: number;
                    /** @description Beats per minute. */
                    avgHr?: number;
                    competitorNames?: string[];
                    /** @enum {string} */
                    result?: "win" | "loss" | "tie";
                    teammateNames?: string[];
                    /** @description What a sport typed for the first time records; ignored for a known one. */
                    newSport?: {
                        hasCompetitor: boolean;
                        hasTeammate: boolean;
                    };
                };
            };
        };
        responses: {
            /** @description The sport session as logged. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SportEntry"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    replaceSport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @description A new name creates the sport. */
                    sport: string;
                    /** @default false */
                    withTrainer?: boolean;
                    /** @description 1 (poor) to 5 (great). */
                    quality?: number;
                    /** @default  */
                    notes?: string;
                    /** @description Minutes. */
                    duration?: number;
                    /** @description Beats per minute. */
                    avgHr?: number;
                    competitorNames?: string[];
                    /** @enum {string} */
                    result?: "win" | "loss" | "tie";
                    teammateNames?: string[];
                    /** @description What a sport typed for the first time records; ignored for a known one. */
                    newSport?: {
                        hasCompetitor: boolean;
                        hasTeammate: boolean;
                    };
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged sport session of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deleteSport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged sport session of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    logMobility: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    exercises: {
                        name: string;
                        /** @description Minutes. */
                        duration: number;
                        /** @default  */
                        notes?: string;
                        /** @description Muscle-group names the stretch targets. */
                        muscleGroups?: string[];
                    }[];
                };
            };
        };
        responses: {
            /** @description The mobility session as logged. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MobilityEntry"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    replaceMobility: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    exercises: {
                        name: string;
                        /** @description Minutes. */
                        duration: number;
                        /** @default  */
                        notes?: string;
                        /** @description Muscle-group names the stretch targets. */
                        muscleGroups?: string[];
                    }[];
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged mobility session of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deleteMobility: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such logged mobility session of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    putMorningHrv: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The person's own calendar day, YYYY-MM-DD. */
                date: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description rMSSD in ms, on waking. */
                    ms: number;
                };
            };
        };
        responses: {
            /** @description The day's inputs as saved. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadinessInput"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    putCheckIn: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The person's own calendar day, YYYY-MM-DD. */
                date: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CheckInAnswers"];
            };
        };
        responses: {
            /** @description The day's inputs as saved. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadinessInput"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    planLift: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    exercise: string;
                    /** @description What to aim at, not results. */
                    targets: components["schemas"]["LiftSet"][];
                    /**
                     * Format: uuid
                     * @description Shared by the lifts of one superset; null takes a plan out of one.
                     */
                    supersetId?: string | null;
                    /**
                     * @description Who wrote the plan: the person, or an agent on their behalf.
                     * @default user
                     * @enum {string}
                     */
                    plannedBy?: "user" | "agent";
                };
            };
        };
        responses: {
            /** @description The lift as planned. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlannedExercise"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    groupPlannedLifts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    ids: string[];
                    /** Format: uuid */
                    supersetId?: string;
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date?: string;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such planned item of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    replacePlannedLift: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    exercise: string;
                    /** @description What to aim at, not results. */
                    targets: components["schemas"]["LiftSet"][];
                    /**
                     * Format: uuid
                     * @description Shared by the lifts of one superset; null takes a plan out of one.
                     */
                    supersetId?: string | null;
                    /**
                     * @description Who wrote the plan: the person, or an agent on their behalf.
                     * @default user
                     * @enum {string}
                     */
                    plannedBy?: "user" | "agent";
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such planned lift of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deletePlannedLift: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such planned lift of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    planSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @enum {string} */
                    kind: "cardio" | "sport" | "mobility";
                    /** @description The cardio type (Running, Cycling, Swimming, Indoor Rowing, Custom) or the sport; empty for mobility. */
                    name: string;
                    /** @description Minutes. */
                    duration?: number;
                    /** @description Kilometres. */
                    distance?: number;
                    /** @enum {string} */
                    format?: "steady" | "intervals";
                    boutSeconds?: number;
                    /** @description The stretches of a mobility plan, minutes each. */
                    stretches?: {
                        name: string;
                        duration: number;
                    }[];
                    notes?: string;
                    /**
                     * @description Who wrote the plan: the person, or an agent on their behalf.
                     * @default user
                     * @enum {string}
                     */
                    plannedBy?: "user" | "agent";
                };
            };
        };
        responses: {
            /** @description The session as planned. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlannedSession"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    replacePlannedSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description The person's own calendar day, YYYY-MM-DD.
                     * @example 2026-10-20
                     */
                    date: string;
                    /** @enum {string} */
                    kind: "cardio" | "sport" | "mobility";
                    /** @description The cardio type (Running, Cycling, Swimming, Indoor Rowing, Custom) or the sport; empty for mobility. */
                    name: string;
                    /** @description Minutes. */
                    duration?: number;
                    /** @description Kilometres. */
                    distance?: number;
                    /** @enum {string} */
                    format?: "steady" | "intervals";
                    boutSeconds?: number;
                    /** @description The stretches of a mobility plan, minutes each. */
                    stretches?: {
                        name: string;
                        duration: number;
                    }[];
                    notes?: string;
                    /**
                     * @description Who wrote the plan: the person, or an agent on their behalf.
                     * @default user
                     * @enum {string}
                     */
                    plannedBy?: "user" | "agent";
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such planned session of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deletePlannedSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such planned session of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    markLiftPlanLogged: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description The logged entry the plan became. */
                    entryId: string;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such planned item of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    markSessionPlanLogged: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description The logged entry the plan became. */
                    entryId: string;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such planned item of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deleteMissedPlans: {
        parameters: {
            query: {
                /** @description The person's own calendar day, YYYY-MM-DD. */
                before: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    updateProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProfilePatch"];
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    saveSections: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Section"][];
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    showSection: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    showInMenu: boolean;
                };
            };
        };
        responses: {
            /** @description Saved. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getLastGarminSync: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The run, or null. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SyncRun"] | null;
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    requestGarminSync: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The run asked for. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SyncRun"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getSyncRun: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The run. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SyncRun"];
                };
            };
            /** @description A parameter is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No valid access token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No such run of yours. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    sendSignInLink: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: email */
                    email: string;
                    /**
                     * Format: uri
                     * @description Where the link comes back to: the app’s own address, on the project’s allow list.
                     */
                    redirectTo: string;
                    /** @description The base64url SHA-256 of the verifier the app keeps (PKCE, S256). */
                    codeChallenge: string;
                };
            };
        };
        responses: {
            /** @description Sent. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not sent, for instance too many links in a row. The reason is in `error`. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    exchangeSignInCode: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    code: string;
                    codeVerifier: string;
                };
            };
        };
        responses: {
            /** @description The session. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Session"];
                };
            };
            /** @description A used, expired or foreign code. The reason is in `error`. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    refreshSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    refreshToken: string;
                };
            };
        };
        responses: {
            /** @description The session, with its new refresh token. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Session"];
                };
            };
            /** @description The session has ended: sign in again. The reason is in `error`. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    sendErrorReport: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ErrorReport"];
            };
        };
        responses: {
            /** @description Received. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description A field is missing or malformed. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
}
