#!/bin/bash
jsonfile='ls *.json'
docker cp `$jsonfile` mongoofflinedb:mnt
docker exec -it mongoofflinedb sh -c "mongoimport --db ezapi --drop --port 27017 --collection master_dup --file /mnt/`$jsonfile`"
docker exec -it mongoofflinedb rm -rf mnt/`$jsonfile`

archfile=`ls | grep -v '\.json$' | grep -v '\.sh1$'| grep -v '\.js$' | grep -v '\.jse$'| grep -v '\.sh$'`

echo $archfile | docker cp $archfile  mongoofflinedb:mnt
echo $archfile | docker exec -i mongoofflinedb sh -c "mongorestore --archive=/mnt/$archfile"
echo $archfile | docker exec -i mongoofflinedb rm -rf mnt/$archfile
echo $archfile

projId=$(echo "$archfile" | sed "s/"proj_dbgen_"/""/")
echo "proj id" $projId
dbprojName="proj_db_${projId:6}"
echo $dbprojName
genTypeUpdt=$(curl -X POST -H "Content-Type: application/json" -d '{"projectid": "'$projId'", "tempprojname": "'$archfile'", "projectdbname": "'$dbprojName'"}' http://localhost:5002/updateLastGenType | awk '{print $2}' FS='message":"' | awk '{print $1}' FS='",')
echo "genTypeUpdt is " $genTypeUpdt
decMkr=$(curl -X POST -H "Content-Type: application/json" -d '{"projectid": "'$projId'", "tempprojname": "'$archfile'", "projectdbname": "'$dbprojName'"}' http://localhost:5002/checkCount | awk '{print $2}' FS='message":"' | awk '{print $1}' FS='",')
echo "decision is to" $decMkr
UpdateMsg=$(curl -X POST -H "Content-Type: application/json" -d '{"projectid": "'$projId'", "tempprojname": "'$archfile'", "projectdbname": "'$dbprojName'"}' http://localhost:5002/localupsert | awk '{print $2}' FS='message":"' | awk '{print $1}' FS='",')
echo "Final Status-at end of execution" $UpdateMsg
