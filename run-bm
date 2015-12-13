#/bin/bash


while true ; do

	l=log-tmp.txt

	echo "---------- start " `date` >> log.txt

	if node bm.js &> $l ; then
		break
	fi
	cat $l >> log.txt

	echo "---------- end " `date` >> log.txt

	sleep 4

done


