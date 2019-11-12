# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 42000 -e 47000 >> scripts/batch/log/batch_00.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 47000 -e 52000 >> scripts/batch/log/batch_01.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 52000 -e 57000 >> scripts/batch/log/batch_02.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 57000 -e 62000 >> scripts/batch/log/batch_03.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 62000 -e 67000 >> scripts/batch/log/batch_04.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 67000 -e 72000 >> scripts/batch/log/batch_05.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 72000 -e 77000 >> scripts/batch/log/batch_06.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 77000 -e 82000 >> scripts/batch/log/batch_07.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 82000 -e 87000 >> scripts/batch/log/batch_08.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 87000 -e 92000 >> scripts/batch/log/batch_09.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 92000 -e 97000 >> scripts/batch/log/batch_10.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Universal.js -s 97000 -e 102000 >> scripts/batch/log/batch_11.log 2>&1',

]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()