# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 1 -e 50000 >> scripts/batch/log/batch_00.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 50000 -e 100000 >> scripts/batch/log/batch_01.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 100000 -e 150000 >> scripts/batch/log/batch_02.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 150000 -e 200000 >> scripts/batch/log/batch_03.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 200000 -e 250000 >> scripts/batch/log/batch_04.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 250000 -e 1000000 >> scripts/batch/log/batch_05.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 1000000 -e 4000000 >> scripts/batch/log/batch_06.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 4000000 -e 7000000 >> scripts/batch/log/batch_07.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 7000000 -e 10000000 >> scripts/batch/log/batch_08.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 10000000 -e 13000000 >> scripts/batch/log/batch_09.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 13000000 -e 16000000 >> scripts/batch/log/batch_10.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 16000000 -e 19000000 >> scripts/batch/log/batch_11.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 19000000 -e 22000000 >> scripts/batch/log/batch_12.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 22000000 -e 25000000 >> scripts/batch/log/batch_13.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 25000000 -e 28000000 >> scripts/batch/log/batch_14.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 28000000 -e 31000000 >> scripts/batch/log/batch_15.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 31000000 -e 34000000 >> scripts/batch/log/batch_16.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 34000000 -e 37000000 >> scripts/batch/log/batch_17.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 37000000 -e 40000000 >> scripts/batch/log/batch_18.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 40000000 -e 43000000 >> scripts/batch/log/batch_19.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 43000000 -e 46000000 >> scripts/batch/log/batch_20.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 46000000 -e 49000000 >> scripts/batch/log/batch_21.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 49000000 -e 52000000 >> scripts/batch/log/batch_22.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 52000000 -e 53000000 >> scripts/batch/log/batch_23.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 53000000 -e 54000000 >> scripts/batch/log/batch_24.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 54000000 -e 55000000 >> scripts/batch/log/batch_25.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 55000000 -e 56000000 >> scripts/batch/log/batch_26.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 56000000 -e 56250000 >> scripts/batch/log/batch_27.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 56250000 -e 56500000 >> scripts/batch/log/batch_28.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 56500000 -e 56750000 >> scripts/batch/log/batch_29.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 56750000 -e 57000000 >> scripts/batch/log/batch_30.log 2>&1',
'node --max-old-space-size=1000 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 57000000 -e 57250000 >> scripts/batch/log/batch_31.log 2>&1',

]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()