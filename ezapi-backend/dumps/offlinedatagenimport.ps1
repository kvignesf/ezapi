[Net.ServicePointManager]::SecurityProtocol = "Tls12 , Ssl3"
$jsonfile=Get-ChildItem *.json | Select-Object -expandproperty Name
docker cp $jsonfile mongoofflinedb:mnt
docker exec -it mongoofflinedb sh -c "mongoimport --db ezapi --drop --port 27017 --collection master_dup --file /mnt/$jsonfile"
docker exec -it mongoofflinedb rm -rf mnt/$jsonfile

$archfile=Get-ChildItem -Recurse -exclude @("*.json", "*.ps1" , "*.sh" , "*.js") | Select-Object -expandproperty Name
Write-Output "copying dmp files" $archfile
$projId=$archfile.replace('proj_dbgen_','')
Write-Output "proj id" $projId
#docker cp $archfile mongoofflinedb:mnt
#docker exec -it mongoofflinedb archfile="ls -I *.json"
docker cp $archfile mongoofflinedb:mnt
docker exec -it mongoofflinedb sh -c "mongorestore --archive=/mnt/$archfile"
docker exec -it mongoofflinedb rm -rf mnt/$archfile

$dbprojName = -join("proj_db_", $projId.substring(6))
$JSON = @{projectid = $projId}
$JSON1 = @{
		projectid = $projId
		tempprojname = $archfile
		projectdbname = $dbprojName
		}
$jsonBody = $JSON1 | ConvertTo-Json
Write-Output "projectdbname" $dbprojName
$genTypeUpdt=Invoke-RestMethod -Method 'POST' -Uri http://localhost:5002/updateLastGenType -Body $jsonBody -ContentType "application/json" | Select-Object -expandproperty message
Write-Output "genTypeUpdt" $genTypeUpdt
#$decMkr=Invoke-RestMethod -Method 'POST' -Uri http://localhost:5002/checkCount -Body $jsonBody -ContentType "application/json" | Select-Object -expandproperty message
#Write-Output "decMkr" $decMkr
$UpdateMsg=Invoke-RestMethod -Method 'POST' -Uri http://localhost:5002/localupsert -Body $jsonBody -ContentType "application/json" | Select-Object -expandproperty message
Write-Output "Final Message" $UpdateMsg