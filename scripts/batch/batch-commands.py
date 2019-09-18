# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1 -e 400000 >> scripts/batch/log/batch_00.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 400000 -e 420000 >> scripts/batch/log/batch_01.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 420000 -e 440000 >> scripts/batch/log/batch_02.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 440000 -e 460000 >> scripts/batch/log/batch_03.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 460000 -e 480000 >> scripts/batch/log/batch_04.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 480000 -e 500000 >> scripts/batch/log/batch_05.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 500000 -e 520000 >> scripts/batch/log/batch_06.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 520000 -e 540000 >> scripts/batch/log/batch_07.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 540000 -e 560000 >> scripts/batch/log/batch_08.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 560000 -e 580000 >> scripts/batch/log/batch_09.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 580000 -e 600000 >> scripts/batch/log/batch_10.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 600000 -e 620000 >> scripts/batch/log/batch_11.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 620000 -e 640000 >> scripts/batch/log/batch_12.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 640000 -e 660000 >> scripts/batch/log/batch_13.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 660000 -e 680000 >> scripts/batch/log/batch_14.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 680000 -e 700000 >> scripts/batch/log/batch_15.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 700000 -e 720000 >> scripts/batch/log/batch_16.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 720000 -e 740000 >> scripts/batch/log/batch_17.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 740000 -e 760000 >> scripts/batch/log/batch_18.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 760000 -e 780000 >> scripts/batch/log/batch_19.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 780000 -e 800000 >> scripts/batch/log/batch_20.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 800000 -e 820000 >> scripts/batch/log/batch_21.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 820000 -e 840000 >> scripts/batch/log/batch_22.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 840000 -e 860000 >> scripts/batch/log/batch_23.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 860000 -e 880000 >> scripts/batch/log/batch_24.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 880000 -e 900000 >> scripts/batch/log/batch_25.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 900000 -e 920000 >> scripts/batch/log/batch_26.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 920000 -e 940000 >> scripts/batch/log/batch_27.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 940000 -e 960000 >> scripts/batch/log/batch_28.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 960000 -e 980000 >> scripts/batch/log/batch_29.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 980000 -e 1000000 >> scripts/batch/log/batch_30.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1000000 -e 1020000 >> scripts/batch/log/batch_31.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1020000 -e 1040000 >> scripts/batch/log/batch_32.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1040000 -e 1060000 >> scripts/batch/log/batch_33.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1060000 -e 1080000 >> scripts/batch/log/batch_34.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1080000 -e 1100000 >> scripts/batch/log/batch_35.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1100000 -e 1120000 >> scripts/batch/log/batch_36.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1120000 -e 1140000 >> scripts/batch/log/batch_37.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1140000 -e 1160000 >> scripts/batch/log/batch_38.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1160000 -e 1180000 >> scripts/batch/log/batch_39.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1180000 -e 1200000 >> scripts/batch/log/batch_40.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1200000 -e 1220000 >> scripts/batch/log/batch_41.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1220000 -e 1240000 >> scripts/batch/log/batch_42.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1240000 -e 1260000 >> scripts/batch/log/batch_43.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1260000 -e 1280000 >> scripts/batch/log/batch_44.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1280000 -e 1300000 >> scripts/batch/log/batch_45.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1300000 -e 1320000 >> scripts/batch/log/batch_46.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1320000 -e 1340000 >> scripts/batch/log/batch_47.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1340000 -e 1360000 >> scripts/batch/log/batch_48.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1360000 -e 1380000 >> scripts/batch/log/batch_49.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1380000 -e 1400000 >> scripts/batch/log/batch_50.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1400000 -e 1420000 >> scripts/batch/log/batch_51.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1420000 -e 1440000 >> scripts/batch/log/batch_52.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1440000 -e 1460000 >> scripts/batch/log/batch_53.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1460000 -e 1480000 >> scripts/batch/log/batch_54.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1480000 -e 1500000 >> scripts/batch/log/batch_55.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1500000 -e 1520000 >> scripts/batch/log/batch_56.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1520000 -e 1540000 >> scripts/batch/log/batch_57.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1540000 -e 1560000 >> scripts/batch/log/batch_58.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1560000 -e 1580000 >> scripts/batch/log/batch_59.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1580000 -e 1600000 >> scripts/batch/log/batch_60.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1600000 -e 1620000 >> scripts/batch/log/batch_61.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1620000 -e 1640000 >> scripts/batch/log/batch_62.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1640000 -e 1660000 >> scripts/batch/log/batch_63.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1660000 -e 1680000 >> scripts/batch/log/batch_64.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1680000 -e 1700000 >> scripts/batch/log/batch_65.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1700000 -e 1720000 >> scripts/batch/log/batch_66.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1720000 -e 1740000 >> scripts/batch/log/batch_67.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1740000 -e 1760000 >> scripts/batch/log/batch_68.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1760000 -e 1780000 >> scripts/batch/log/batch_69.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1780000 -e 1800000 >> scripts/batch/log/batch_70.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1800000 -e 1820000 >> scripts/batch/log/batch_71.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1820000 -e 1840000 >> scripts/batch/log/batch_72.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1840000 -e 1860000 >> scripts/batch/log/batch_73.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1860000 -e 1880000 >> scripts/batch/log/batch_74.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1880000 -e 1900000 >> scripts/batch/log/batch_75.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1900000 -e 1920000 >> scripts/batch/log/batch_76.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1920000 -e 1940000 >> scripts/batch/log/batch_77.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1940000 -e 1960000 >> scripts/batch/log/batch_78.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1960000 -e 1980000 >> scripts/batch/log/batch_79.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1980000 -e 2000000 >> scripts/batch/log/batch_80.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2000000 -e 2020000 >> scripts/batch/log/batch_81.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2020000 -e 2040000 >> scripts/batch/log/batch_82.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2040000 -e 2060000 >> scripts/batch/log/batch_83.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2060000 -e 2080000 >> scripts/batch/log/batch_84.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2080000 -e 2100000 >> scripts/batch/log/batch_85.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2100000 -e 2120000 >> scripts/batch/log/batch_86.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2120000 -e 2140000 >> scripts/batch/log/batch_87.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2140000 -e 2160000 >> scripts/batch/log/batch_88.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2160000 -e 2180000 >> scripts/batch/log/batch_89.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2180000 -e 2200000 >> scripts/batch/log/batch_90.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2200000 -e 2220000 >> scripts/batch/log/batch_91.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2220000 -e 2240000 >> scripts/batch/log/batch_92.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2240000 -e 2260000 >> scripts/batch/log/batch_93.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2260000 -e 2280000 >> scripts/batch/log/batch_94.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2280000 -e 2300000 >> scripts/batch/log/batch_95.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2300000 -e 2320000 >> scripts/batch/log/batch_96.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2320000 -e 2340000 >> scripts/batch/log/batch_97.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2340000 -e 2360000 >> scripts/batch/log/batch_98.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2360000 -e 2380000 >> scripts/batch/log/batch_99.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2380000 -e 2400000 >> scripts/batch/log/batch_100.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2400000 -e 2420000 >> scripts/batch/log/batch_101.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2420000 -e 2440000 >> scripts/batch/log/batch_102.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2440000 -e 2460000 >> scripts/batch/log/batch_103.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2460000 -e 2480000 >> scripts/batch/log/batch_104.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2480000 -e 2500000 >> scripts/batch/log/batch_105.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2500000 -e 2520000 >> scripts/batch/log/batch_106.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2520000 -e 2540000 >> scripts/batch/log/batch_107.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2540000 -e 2560000 >> scripts/batch/log/batch_108.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2560000 -e 2580000 >> scripts/batch/log/batch_109.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2580000 -e 2600000 >> scripts/batch/log/batch_110.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2600000 -e 2620000 >> scripts/batch/log/batch_111.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2620000 -e 2640000 >> scripts/batch/log/batch_112.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2640000 -e 2660000 >> scripts/batch/log/batch_113.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2660000 -e 2680000 >> scripts/batch/log/batch_114.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2680000 -e 2700000 >> scripts/batch/log/batch_115.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2700000 -e 2720000 >> scripts/batch/log/batch_116.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2720000 -e 2740000 >> scripts/batch/log/batch_117.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2740000 -e 2760000 >> scripts/batch/log/batch_118.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2760000 -e 2780000 >> scripts/batch/log/batch_119.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2780000 -e 2800000 >> scripts/batch/log/batch_120.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2800000 -e 2820000 >> scripts/batch/log/batch_121.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2820000 -e 2840000 >> scripts/batch/log/batch_122.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2840000 -e 2860000 >> scripts/batch/log/batch_123.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2860000 -e 2880000 >> scripts/batch/log/batch_124.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2880000 -e 2900000 >> scripts/batch/log/batch_125.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2900000 -e 2920000 >> scripts/batch/log/batch_126.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2920000 -e 2940000 >> scripts/batch/log/batch_127.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2940000 -e 2960000 >> scripts/batch/log/batch_128.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2960000 -e 2980000 >> scripts/batch/log/batch_129.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2980000 -e 3000000 >> scripts/batch/log/batch_130.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3000000 -e 3020000 >> scripts/batch/log/batch_131.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3020000 -e 3040000 >> scripts/batch/log/batch_132.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3040000 -e 3060000 >> scripts/batch/log/batch_133.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3060000 -e 3080000 >> scripts/batch/log/batch_134.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3080000 -e 3100000 >> scripts/batch/log/batch_135.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3100000 -e 3120000 >> scripts/batch/log/batch_136.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3120000 -e 3140000 >> scripts/batch/log/batch_137.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3140000 -e 3160000 >> scripts/batch/log/batch_138.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3160000 -e 3180000 >> scripts/batch/log/batch_139.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3180000 -e 3200000 >> scripts/batch/log/batch_140.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3200000 -e 3220000 >> scripts/batch/log/batch_141.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3220000 -e 3240000 >> scripts/batch/log/batch_142.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3240000 -e 3260000 >> scripts/batch/log/batch_143.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3260000 -e 3280000 >> scripts/batch/log/batch_144.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3280000 -e 3300000 >> scripts/batch/log/batch_145.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3300000 -e 3320000 >> scripts/batch/log/batch_146.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3320000 -e 3340000 >> scripts/batch/log/batch_147.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3340000 -e 3360000 >> scripts/batch/log/batch_148.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3360000 -e 3380000 >> scripts/batch/log/batch_149.log 2>&1',


]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()