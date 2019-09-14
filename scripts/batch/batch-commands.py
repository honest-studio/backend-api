# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1 -e 200000 >> scripts/batch/log/batch_00.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 200000 -e 400000 >> scripts/batch/log/batch_01.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 400000 -e 600000 >> scripts/batch/log/batch_02.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 600000 -e 800000 >> scripts/batch/log/batch_03.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 800000 -e 1000000 >> scripts/batch/log/batch_04.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1000000 -e 1200000 >> scripts/batch/log/batch_05.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1200000 -e 1400000 >> scripts/batch/log/batch_06.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1400000 -e 1600000 >> scripts/batch/log/batch_07.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1600000 -e 1800000 >> scripts/batch/log/batch_08.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1800000 -e 2000000 >> scripts/batch/log/batch_09.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2000000 -e 2200000 >> scripts/batch/log/batch_10.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2200000 -e 2400000 >> scripts/batch/log/batch_11.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2400000 -e 2600000 >> scripts/batch/log/batch_12.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2600000 -e 2800000 >> scripts/batch/log/batch_13.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2800000 -e 3000000 >> scripts/batch/log/batch_14.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3000000 -e 3200000 >> scripts/batch/log/batch_15.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3200000 -e 3400000 >> scripts/batch/log/batch_16.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3400000 -e 3600000 >> scripts/batch/log/batch_17.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3600000 -e 3800000 >> scripts/batch/log/batch_18.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3800000 -e 4000000 >> scripts/batch/log/batch_19.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4000000 -e 4200000 >> scripts/batch/log/batch_20.log 2>&1',






]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()