# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 1100000 -e 4000000 >> scripts/batch/log/batch_00.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 4000000 -e 8000000 >> scripts/batch/log/batch_01.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 8000000 -e 12000000 >> scripts/batch/log/batch_02.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 12000000 -e 16000000 >> scripts/batch/log/batch_03.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 16000000 -e 20000000 >> scripts/batch/log/batch_04.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 20000000 -e 24000000 >> scripts/batch/log/batch_05.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 24000000 -e 28000000 >> scripts/batch/log/batch_06.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 28000000 -e 32000000 >> scripts/batch/log/batch_07.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 32000000 -e 36000000 >> scripts/batch/log/batch_08.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 36000000 -e 40000000 >> scripts/batch/log/batch_09.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 40000000 -e 44000000 >> scripts/batch/log/batch_10.log 2>&1',
]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()