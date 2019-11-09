# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 1 -e 373334 >> scripts/batch/log/batch_00.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 373334 -e 746667 >> scripts/batch/log/batch_01.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 746667 -e 1120000 >> scripts/batch/log/batch_02.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 1120000 -e 1493333 >> scripts/batch/log/batch_03.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 1493333 -e 1866666 >> scripts/batch/log/batch_04.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 1866666 -e 2239999 >> scripts/batch/log/batch_05.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 2239999 -e 2613332 >> scripts/batch/log/batch_06.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 2613332 -e 2986665 >> scripts/batch/log/batch_07.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 2986665 -e 3359998 >> scripts/batch/log/batch_08.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 3359998 -e 3733331 >> scripts/batch/log/batch_09.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 3733331 -e 4106664 >> scripts/batch/log/batch_10.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 4106664 -e 4479997 >> scripts/batch/log/batch_11.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 4479997 -e 4853330 >> scripts/batch/log/batch_12.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 4853330 -e 5226663 >> scripts/batch/log/batch_13.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 5226663 -e 5599996 >> scripts/batch/log/batch_14.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 5599996 -e 5973329 >> scripts/batch/log/batch_15.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 5973329 -e 6346662 >> scripts/batch/log/batch_16.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 6346662 -e 6719995 >> scripts/batch/log/batch_17.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 6719995 -e 7093328 >> scripts/batch/log/batch_18.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 7093328 -e 7466661 >> scripts/batch/log/batch_19.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 7466661 -e 7839994 >> scripts/batch/log/batch_20.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 7839994 -e 8213327 >> scripts/batch/log/batch_21.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 8213327 -e 8586660 >> scripts/batch/log/batch_22.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 8586660 -e 8959993 >> scripts/batch/log/batch_23.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 8959993 -e 9333326 >> scripts/batch/log/batch_24.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 9333326 -e 9706659 >> scripts/batch/log/batch_25.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 9706659 -e 10079992 >> scripts/batch/log/batch_26.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 10079992 -e 10453325 >> scripts/batch/log/batch_27.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 10453325 -e 10826658 >> scripts/batch/log/batch_28.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 10826658 -e 11199991 >> scripts/batch/log/batch_29.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 11199991 -e 11573324 >> scripts/batch/log/batch_30.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 11573324 -e 11946657 >> scripts/batch/log/batch_31.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 11946657 -e 12319990 >> scripts/batch/log/batch_32.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 12319990 -e 12693323 >> scripts/batch/log/batch_33.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 12693323 -e 13066656 >> scripts/batch/log/batch_34.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 13066656 -e 13439989 >> scripts/batch/log/batch_35.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 13439989 -e 13813322 >> scripts/batch/log/batch_36.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 13813322 -e 14186655 >> scripts/batch/log/batch_37.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 14186655 -e 14559988 >> scripts/batch/log/batch_38.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 14559988 -e 14933321 >> scripts/batch/log/batch_39.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 14933321 -e 15306654 >> scripts/batch/log/batch_40.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 15306654 -e 15679987 >> scripts/batch/log/batch_41.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 15679987 -e 16053320 >> scripts/batch/log/batch_42.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 16053320 -e 16426653 >> scripts/batch/log/batch_43.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 16426653 -e 16799986 >> scripts/batch/log/batch_44.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 16799986 -e 17173319 >> scripts/batch/log/batch_45.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 17173319 -e 17546652 >> scripts/batch/log/batch_46.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 17546652 -e 17919985 >> scripts/batch/log/batch_47.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 17919985 -e 18293318 >> scripts/batch/log/batch_48.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 18293318 -e 18666651 >> scripts/batch/log/batch_49.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 18666651 -e 19039984 >> scripts/batch/log/batch_50.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 19039984 -e 19413317 >> scripts/batch/log/batch_51.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 19413317 -e 19786650 >> scripts/batch/log/batch_52.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 19786650 -e 20159983 >> scripts/batch/log/batch_53.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 20159983 -e 20533316 >> scripts/batch/log/batch_54.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 20533316 -e 20906649 >> scripts/batch/log/batch_55.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 20906649 -e 21279982 >> scripts/batch/log/batch_56.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 21279982 -e 21653315 >> scripts/batch/log/batch_57.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 21653315 -e 22026648 >> scripts/batch/log/batch_58.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 22026648 -e 22399981 >> scripts/batch/log/batch_59.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 22399981 -e 22773314 >> scripts/batch/log/batch_60.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 22773314 -e 23146647 >> scripts/batch/log/batch_61.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 23146647 -e 23519980 >> scripts/batch/log/batch_62.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 23519980 -e 23893313 >> scripts/batch/log/batch_63.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 23893313 -e 24266646 >> scripts/batch/log/batch_64.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 24266646 -e 24639979 >> scripts/batch/log/batch_65.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 24639979 -e 25013312 >> scripts/batch/log/batch_66.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 25013312 -e 25386645 >> scripts/batch/log/batch_67.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 25386645 -e 25759978 >> scripts/batch/log/batch_68.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 25759978 -e 26133311 >> scripts/batch/log/batch_69.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 26133311 -e 26506644 >> scripts/batch/log/batch_70.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 26506644 -e 26879977 >> scripts/batch/log/batch_71.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 26879977 -e 27253310 >> scripts/batch/log/batch_72.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 27253310 -e 27626643 >> scripts/batch/log/batch_73.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 27626643 -e 27999976 >> scripts/batch/log/batch_74.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 27999976 -e 28373309 >> scripts/batch/log/batch_75.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 28373309 -e 28746642 >> scripts/batch/log/batch_76.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 28746642 -e 29119975 >> scripts/batch/log/batch_77.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 29119975 -e 29493308 >> scripts/batch/log/batch_78.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 29493308 -e 29866641 >> scripts/batch/log/batch_79.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 29866641 -e 30239974 >> scripts/batch/log/batch_80.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 30239974 -e 30613307 >> scripts/batch/log/batch_81.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 30613307 -e 30986640 >> scripts/batch/log/batch_82.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 30986640 -e 31359973 >> scripts/batch/log/batch_83.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 31359973 -e 31733306 >> scripts/batch/log/batch_84.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 31733306 -e 32106639 >> scripts/batch/log/batch_85.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 32106639 -e 32479972 >> scripts/batch/log/batch_86.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 32479972 -e 32853305 >> scripts/batch/log/batch_87.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 32853305 -e 33226638 >> scripts/batch/log/batch_88.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 33226638 -e 33599971 >> scripts/batch/log/batch_89.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 33599971 -e 33973304 >> scripts/batch/log/batch_90.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 33973304 -e 34346637 >> scripts/batch/log/batch_91.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 34346637 -e 34719970 >> scripts/batch/log/batch_92.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 34719970 -e 35093303 >> scripts/batch/log/batch_93.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 35093303 -e 35466636 >> scripts/batch/log/batch_94.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 35466636 -e 35839969 >> scripts/batch/log/batch_95.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 35839969 -e 36213302 >> scripts/batch/log/batch_96.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 36213302 -e 36586635 >> scripts/batch/log/batch_97.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 36586635 -e 36959968 >> scripts/batch/log/batch_98.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 36959968 -e 37333301 >> scripts/batch/log/batch_99.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 37333301 -e 37706634 >> scripts/batch/log/batch_100.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 37706634 -e 38079967 >> scripts/batch/log/batch_101.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 38079967 -e 38453300 >> scripts/batch/log/batch_102.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 38453300 -e 38826633 >> scripts/batch/log/batch_103.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 38826633 -e 39199966 >> scripts/batch/log/batch_104.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 39199966 -e 39573299 >> scripts/batch/log/batch_105.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 39573299 -e 39946632 >> scripts/batch/log/batch_106.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 39946632 -e 40319965 >> scripts/batch/log/batch_107.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 40319965 -e 40693298 >> scripts/batch/log/batch_108.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 40693298 -e 41066631 >> scripts/batch/log/batch_109.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 41066631 -e 41439964 >> scripts/batch/log/batch_110.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 41439964 -e 41813297 >> scripts/batch/log/batch_111.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 41813297 -e 42186630 >> scripts/batch/log/batch_112.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 42186630 -e 42559963 >> scripts/batch/log/batch_113.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 42559963 -e 42933296 >> scripts/batch/log/batch_114.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 42933296 -e 43306629 >> scripts/batch/log/batch_115.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 43306629 -e 43679962 >> scripts/batch/log/batch_116.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 43679962 -e 44053295 >> scripts/batch/log/batch_117.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 44053295 -e 44426628 >> scripts/batch/log/batch_118.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 44426628 -e 44799961 >> scripts/batch/log/batch_119.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 44799961 -e 45173294 >> scripts/batch/log/batch_120.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 45173294 -e 45546627 >> scripts/batch/log/batch_121.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 45546627 -e 45919960 >> scripts/batch/log/batch_122.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 45919960 -e 46293293 >> scripts/batch/log/batch_123.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 46293293 -e 46666626 >> scripts/batch/log/batch_124.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 46666626 -e 47039959 >> scripts/batch/log/batch_125.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 47039959 -e 47413292 >> scripts/batch/log/batch_126.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 47413292 -e 47786625 >> scripts/batch/log/batch_127.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 47786625 -e 48159958 >> scripts/batch/log/batch_128.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 48159958 -e 48533291 >> scripts/batch/log/batch_129.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 48533291 -e 48906624 >> scripts/batch/log/batch_130.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 48906624 -e 49279957 >> scripts/batch/log/batch_131.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 49279957 -e 49653290 >> scripts/batch/log/batch_132.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 49653290 -e 50026623 >> scripts/batch/log/batch_133.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 50026623 -e 50399956 >> scripts/batch/log/batch_134.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 50399956 -e 50773289 >> scripts/batch/log/batch_135.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 50773289 -e 51146622 >> scripts/batch/log/batch_136.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 51146622 -e 51519955 >> scripts/batch/log/batch_137.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 51519955 -e 51893288 >> scripts/batch/log/batch_138.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 51893288 -e 52266621 >> scripts/batch/log/batch_139.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 52266621 -e 52639954 >> scripts/batch/log/batch_140.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 52639954 -e 53013287 >> scripts/batch/log/batch_141.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 53013287 -e 53386620 >> scripts/batch/log/batch_142.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 53386620 -e 53759953 >> scripts/batch/log/batch_143.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 53759953 -e 54133286 >> scripts/batch/log/batch_144.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 54133286 -e 54506619 >> scripts/batch/log/batch_145.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 54506619 -e 54879952 >> scripts/batch/log/batch_146.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 54879952 -e 55253285 >> scripts/batch/log/batch_147.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 55253285 -e 55626618 >> scripts/batch/log/batch_148.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 55626618 -e 55999951 >> scripts/batch/log/batch_149.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 55999951 -e 58473284 >> scripts/batch/log/batch_150.log 2>&1',

]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()