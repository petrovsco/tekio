package fyi.tekio.api

import java.time.LocalDate
import java.time.LocalDateTime

/** The person's own days, which every read is asked for: the server's clock
 *  sits in another time zone and cannot know them. */
object Days {
    /** "Last night" turns over at 04:00, not midnight, for whoever is still
     *  up (`lastNightDate` in @tekio/core). */
    const val NIGHT_ENDS_HOUR = 4

    fun today(now: LocalDateTime = LocalDateTime.now()): String = now.toLocalDate().toString()

    /** The wake date of the night just gone. */
    fun lastNight(now: LocalDateTime = LocalDateTime.now()): String =
        (if (now.hour < NIGHT_ENDS_HOUR) now.toLocalDate().minusDays(1) else now.toLocalDate()).toString()

    fun parse(day: String): LocalDate = LocalDate.parse(day)
}
