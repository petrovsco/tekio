#!/bin/sh
# Regenerates the derived artboards. Run after editing Main.dc.html,
# Alongside.dc.html, MuscleDrillIn.dc.html, Home.dc.html or Refined.dc.html — the derived files differ
# ONLY in the data-props defaults, never edit them by hand.
sed 's/"scenario":{"editor":"enum","options":\["today","trained-yesterday","bad-recovery","zero-data"\],"default":"today"/"scenario":{"editor":"enum","options":["today","trained-yesterday","bad-recovery","zero-data"],"default":"bad-recovery"/' Main.dc.html > MainHeld.dc.html
sed 's/"scenario":{"editor":"enum","options":\["today","trained-yesterday","bad-recovery","zero-data"\],"default":"today"/"scenario":{"editor":"enum","options":["today","trained-yesterday","bad-recovery","zero-data"],"default":"bad-recovery"/' Alongside.dc.html > AlongsideBad.dc.html
sed 's/"startStage":{"editor":"enum","options":\["button","picker","grid"\],"default":"button"/"startStage":{"editor":"enum","options":["button","picker","grid"],"default":"grid"/' MuscleDrillIn.dc.html > LogSets.dc.html
sed 's/"scenario":{"editor":"enum","options":\["today","trained-yesterday","bad-recovery","zero-data"\],"default":"today"/"scenario":{"editor":"enum","options":["today","trained-yesterday","bad-recovery","zero-data"],"default":"bad-recovery"/' Home.dc.html > HomeHeld.dc.html
sed 's/"scenario":{"editor":"enum","options":\["today","trained-yesterday","bad-recovery","zero-data","post-donation"\],"default":"today"/"scenario":{"editor":"enum","options":["today","trained-yesterday","bad-recovery","zero-data","post-donation"],"default":"bad-recovery"/' Refined.dc.html > RefinedHeld.dc.html
echo "derived: MainHeld, AlongsideBad, LogSets, HomeHeld, RefinedHeld"
