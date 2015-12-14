#/bin/bash


while true ; do

	l=log-tmp.txt

	echo "---------- start " `date` >> log.txt

	if node bm.js &> $l ; then
		echo "---------- Normal exit " `date` >> log.txt
		break
	fi
	cat $l >> log.txt

	echo "---------- ABNORMAL EXIT " `date` >> log.txt

	sleep 4

done


