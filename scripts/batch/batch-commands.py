# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1530489600 -e 1530835200 >> scripts/batch/log/batch_00.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1530835200 -e 1531180800 >> scripts/batch/log/batch_01.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1531180800 -e 1531526400 >> scripts/batch/log/batch_02.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1531526400 -e 1531872000 >> scripts/batch/log/batch_03.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1531872000 -e 1532217600 >> scripts/batch/log/batch_04.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1532217600 -e 1532563200 >> scripts/batch/log/batch_05.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1532563200 -e 1532908800 >> scripts/batch/log/batch_06.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1532908800 -e 1533254400 >> scripts/batch/log/batch_07.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1533254400 -e 1533600000 >> scripts/batch/log/batch_08.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1533600000 -e 1533945600 >> scripts/batch/log/batch_09.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1533945600 -e 1534291200 >> scripts/batch/log/batch_10.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1534291200 -e 1534636800 >> scripts/batch/log/batch_11.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1534636800 -e 1534982400 >> scripts/batch/log/batch_12.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1534982400 -e 1535328000 >> scripts/batch/log/batch_13.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1535328000 -e 1535673600 >> scripts/batch/log/batch_14.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1535673600 -e 1536019200 >> scripts/batch/log/batch_15.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1536019200 -e 1536364800 >> scripts/batch/log/batch_16.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1536364800 -e 1536710400 >> scripts/batch/log/batch_17.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1536710400 -e 1537056000 >> scripts/batch/log/batch_18.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1537056000 -e 1537401600 >> scripts/batch/log/batch_19.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1537401600 -e 1537747200 >> scripts/batch/log/batch_20.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1537747200 -e 1538092800 >> scripts/batch/log/batch_21.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1538092800 -e 1538438400 >> scripts/batch/log/batch_22.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1538438400 -e 1538784000 >> scripts/batch/log/batch_23.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1538784000 -e 1539129600 >> scripts/batch/log/batch_24.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1539129600 -e 1539475200 >> scripts/batch/log/batch_25.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1539475200 -e 1539820800 >> scripts/batch/log/batch_26.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1539820800 -e 1540166400 >> scripts/batch/log/batch_27.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1540166400 -e 1540512000 >> scripts/batch/log/batch_28.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1540512000 -e 1540857600 >> scripts/batch/log/batch_29.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1540857600 -e 1541203200 >> scripts/batch/log/batch_30.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1541203200 -e 1541548800 >> scripts/batch/log/batch_31.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1541548800 -e 1541894400 >> scripts/batch/log/batch_32.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1541894400 -e 1542240000 >> scripts/batch/log/batch_33.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1542240000 -e 1542585600 >> scripts/batch/log/batch_34.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1542585600 -e 1542931200 >> scripts/batch/log/batch_35.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1542931200 -e 1543276800 >> scripts/batch/log/batch_36.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1543276800 -e 1543622400 >> scripts/batch/log/batch_37.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1543622400 -e 1543968000 >> scripts/batch/log/batch_38.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1543968000 -e 1544313600 >> scripts/batch/log/batch_39.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1544313600 -e 1544659200 >> scripts/batch/log/batch_40.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1544659200 -e 1545004800 >> scripts/batch/log/batch_41.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1545004800 -e 1545350400 >> scripts/batch/log/batch_42.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1545350400 -e 1545696000 >> scripts/batch/log/batch_43.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1545696000 -e 1546041600 >> scripts/batch/log/batch_44.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1546041600 -e 1546387200 >> scripts/batch/log/batch_45.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1546387200 -e 1546732800 >> scripts/batch/log/batch_46.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1546732800 -e 1547078400 >> scripts/batch/log/batch_47.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1547078400 -e 1547424000 >> scripts/batch/log/batch_48.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1547424000 -e 1547769600 >> scripts/batch/log/batch_49.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1547769600 -e 1548115200 >> scripts/batch/log/batch_50.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1548115200 -e 1548460800 >> scripts/batch/log/batch_51.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1548460800 -e 1548806400 >> scripts/batch/log/batch_52.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1548806400 -e 1549152000 >> scripts/batch/log/batch_53.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1549152000 -e 1549497600 >> scripts/batch/log/batch_54.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1549497600 -e 1549843200 >> scripts/batch/log/batch_55.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1549843200 -e 1550188800 >> scripts/batch/log/batch_56.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1550188800 -e 1550534400 >> scripts/batch/log/batch_57.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1550534400 -e 1550880000 >> scripts/batch/log/batch_58.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1550880000 -e 1551225600 >> scripts/batch/log/batch_59.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1551225600 -e 1551571200 >> scripts/batch/log/batch_60.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1551571200 -e 1551916800 >> scripts/batch/log/batch_61.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1551916800 -e 1552262400 >> scripts/batch/log/batch_62.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1552262400 -e 1552608000 >> scripts/batch/log/batch_63.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1552608000 -e 1552953600 >> scripts/batch/log/batch_64.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1552953600 -e 1553299200 >> scripts/batch/log/batch_65.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1553299200 -e 1553644800 >> scripts/batch/log/batch_66.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1553644800 -e 1553990400 >> scripts/batch/log/batch_67.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1553990400 -e 1554336000 >> scripts/batch/log/batch_68.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1554336000 -e 1554681600 >> scripts/batch/log/batch_69.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1554681600 -e 1555027200 >> scripts/batch/log/batch_70.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1555027200 -e 1555372800 >> scripts/batch/log/batch_71.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1555372800 -e 1555718400 >> scripts/batch/log/batch_72.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1555718400 -e 1556064000 >> scripts/batch/log/batch_73.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1556064000 -e 1556409600 >> scripts/batch/log/batch_74.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1556409600 -e 1556755200 >> scripts/batch/log/batch_75.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1556755200 -e 1557100800 >> scripts/batch/log/batch_76.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1557100800 -e 1557446400 >> scripts/batch/log/batch_77.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1557446400 -e 1557792000 >> scripts/batch/log/batch_78.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1557792000 -e 1558137600 >> scripts/batch/log/batch_79.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1558137600 -e 1558483200 >> scripts/batch/log/batch_80.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1558483200 -e 1558828800 >> scripts/batch/log/batch_81.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1558828800 -e 1559174400 >> scripts/batch/log/batch_82.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1559174400 -e 1559520000 >> scripts/batch/log/batch_83.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1559520000 -e 1559865600 >> scripts/batch/log/batch_84.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1559865600 -e 1560211200 >> scripts/batch/log/batch_85.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1560211200 -e 1560556800 >> scripts/batch/log/batch_86.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1560556800 -e 1560902400 >> scripts/batch/log/batch_87.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1560902400 -e 1561248000 >> scripts/batch/log/batch_88.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1561248000 -e 1561593600 >> scripts/batch/log/batch_89.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1561593600 -e 1561939200 >> scripts/batch/log/batch_90.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1561939200 -e 1562284800 >> scripts/batch/log/batch_91.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1562284800 -e 1562630400 >> scripts/batch/log/batch_92.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1562630400 -e 1562976000 >> scripts/batch/log/batch_93.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1562976000 -e 1563321600 >> scripts/batch/log/batch_94.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1563321600 -e 1563667200 >> scripts/batch/log/batch_95.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1563667200 -e 1564012800 >> scripts/batch/log/batch_96.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1564012800 -e 1564358400 >> scripts/batch/log/batch_97.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1564358400 -e 1564704000 >> scripts/batch/log/batch_98.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1564704000 -e 1565049600 >> scripts/batch/log/batch_99.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1565049600 -e 1565395200 >> scripts/batch/log/batch_100.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1565395200 -e 1565740800 >> scripts/batch/log/batch_101.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1565740800 -e 1566086400 >> scripts/batch/log/batch_102.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1566086400 -e 1566432000 >> scripts/batch/log/batch_103.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1566432000 -e 1566777600 >> scripts/batch/log/batch_104.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1566777600 -e 1567123200 >> scripts/batch/log/batch_105.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1567123200 -e 1567468800 >> scripts/batch/log/batch_106.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1567468800 -e 1567814400 >> scripts/batch/log/batch_107.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1567814400 -e 1568160000 >> scripts/batch/log/batch_108.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1568160000 -e 1568505600 >> scripts/batch/log/batch_109.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1568505600 -e 1568851200 >> scripts/batch/log/batch_110.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1568851200 -e 1569196800 >> scripts/batch/log/batch_111.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1569196800 -e 1569542400 >> scripts/batch/log/batch_112.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1569542400 -e 1569888000 >> scripts/batch/log/batch_113.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1569888000 -e 1570233600 >> scripts/batch/log/batch_114.log 2>&1',
'node --max-old-space-size=3500 dist/scripts/Wiki-New-Pages-Since/Wiki-New-Pages-Since.js -s 1570233600 -e 1570579200 >> scripts/batch/log/batch_115.log 2>&1',



]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()