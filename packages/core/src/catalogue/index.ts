// @tekio/core/catalogue — the movement patterns and the lift catalogue (RFC
// 0074), apart from the package's main entry on purpose: 270 lifts and their
// links are only needed when a lift is named or written, so the web app loads
// this lazily and keeps it off the first paint (RFC 0094 step 2d).
export * from './movementPatterns'
export * from './exerciseCatalogue'
