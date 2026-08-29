#!/bin/sh
# Regenerates the derived artboards. Run after editing Main.dc.html,
# Alongside.dc.html, MuscleDrillIn.dc.html or Home.dc.html — the derived files differ
# ONLY in the data-props defaults, never edit them by hand.
sed 's/"scenario":{"editor":"enum","options":\["today","trained-yesterday","bad-recovery","zero-data"\],"default":"today"/"scenario":{"editor":"enum","options":["today","trained-yesterday","bad-recovery","zero-data"],"default":"bad-recovery"/' Main.dc.html > MainHeld.dc.html
sed 's/"scenario":{"editor":"enum","options":\["today","trained-yesterday","bad-recovery","zero-data"\],"default":"today"/"scenario":{"editor":"enum","options":["today","trained-yesterday","bad-recovery","zero-data"],"default":"bad-recovery"/' Alongside.dc.html > AlongsideBad.dc.html
sed 's/"startStage":{"editor":"enum","options":\["button","picker","grid"\],"default":"button"/"startStage":{"editor":"enum","options":["button","picker","grid"],"default":"grid"/' MuscleDrillIn.dc.html > LogSets.dc.html
sed 's/"scenario":{"editor":"enum","options":\["today","trained-yesterday","bad-recovery","zero-data"\],"default":"today"/"scenario":{"editor":"enum","options":["today","trained-yesterday","bad-recovery","zero-data"],"default":"bad-recovery"/' Home.dc.html > HomeHeld.dc.html
echo "derived: MainHeld, AlongsideBad, LogSets, HomeHeld"
