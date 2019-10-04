# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1 -e 500000 >> scripts/batch/log/batch_00.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 500000 -e 1000000 >> scripts/batch/log/batch_01.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1000000 -e 1500000 >> scripts/batch/log/batch_02.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1500000 -e 2000000 >> scripts/batch/log/batch_03.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2000000 -e 2500000 >> scripts/batch/log/batch_04.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2500000 -e 3000000 >> scripts/batch/log/batch_05.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3000000 -e 3500000 >> scripts/batch/log/batch_06.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3500000 -e 4000000 >> scripts/batch/log/batch_07.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4000000 -e 4500000 >> scripts/batch/log/batch_08.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4500000 -e 5000000 >> scripts/batch/log/batch_09.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5000000 -e 5500000 >> scripts/batch/log/batch_10.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5500000 -e 6000000 >> scripts/batch/log/batch_11.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 6000000 -e 6500000 >> scripts/batch/log/batch_12.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 6500000 -e 7000000 >> scripts/batch/log/batch_13.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 7000000 -e 7500000 >> scripts/batch/log/batch_14.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 7500000 -e 8000000 >> scripts/batch/log/batch_15.log 2>&1',



]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()