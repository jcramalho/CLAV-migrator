#!/bin/bash
rm ../dados/ontologia/c*0.ttl
rm ../dados/ontologia/c*0-pca.ttl
rm ../dados/ontologia/c*0-df.ttl
rm ../dados/ontologia/ent.ttl
rm ../dados/ontologia/leg.ttl
rm ../dados/ontologia/ti.ttl
rm ../dados/ontologia/tip.ttl
node migra-ent.js
node migra-ti.js
node migra-tip.js
node migra-leg-2.js
./mclasses.sh 100 150 200 250 300 350 400 450 500 550 600 650 700 710 750 800 850 900 950
./mpcas.sh 100 150 200 250 300 350 400 450 500 550 600 650 700 710 750 800 850 900 950
./mdfs.sh 100 150 200 250 300 350 400 450 500 550 600 650 700 710 750 800 850 900 950
cd ../dados/ontologia
rm clav.ttl
cat m51-base-v3.ttl ti.ttl tip.ttl ent.ttl leg.ttl c*0.ttl c*0-pca.ttl c*0-df.ttl > clav.ttl