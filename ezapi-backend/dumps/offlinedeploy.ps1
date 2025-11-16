[Net.ServicePointManager]::SecurityProtocol = "Tls12 , Ssl3"
docker network inspect ezapi | out-null | docker network create --driver bridge ezapi
docker login registry.gitlab.com -u gitlab-ci-token -p bMJKJVzze8Dzwcf2r9s3
$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/21565785/registry/repositories/1454657/tags/latest -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:latest --format 'Repo Digest: {{index .RepoDigests 0}}'
Write-Output $digestFrmlocal
#$comparerepo = $digestFrmlocal.Substring($digestFrmlocal.Length-64)
Write-Output $digestFrmlocal.split("@")[1]
if ( $digestFrmLab -ne $digestFrmlocal.split("@")[1] ){
	Write-Output "remove and pull"
	if (docker ps --format '{{.Names}}' | select-string mongoofflinedb -Quiet)
	{
		Write-Host "mongoofflinedb docker already running"
		docker stop mongoofflinedb
	} 
	if (docker ps -a --filter "status=exited" --format '{{.Names}}' | select-string mongoofflinedb -Quiet)
	{
		Write-Host "mongoofflinedb docker in inactive state remove and reload"
		docker rm -f mongoofflinedb
	}
	docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}"|findstr "registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo")
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:latest
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:latest
}
if (docker ps --format '{{.Names}}' | select-string mongoofflinedb -Quiet)
{
	Write-Host "mongoofflinedb docker already running"
} else {
	if (docker ps -a --format '{{.Names}}' | select-string mongoofflinedb -Quiet)
	{
		Write-Host "mongoofflinedb docker in inactive state remove and reload"
		docker rm -f mongoofflinedb
	}
	docker run -p 27017:27017 -it -v mongodata:/data/db --name mongoofflinedb --network ezapi -d registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:latest
}

$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/22153917/registry/repositories/1456307/tags/latest -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi_poc/apiops_node_offline --format 'Repo Digest: {{index .RepoDigests 0}}'
#$comparerepo = $digestFrmlocal.Substring($digestFrmlocal.Length-64)
Write-Output $digestFrmlocal.split("@")[1]
if ( $digestFrmLab -ne $digestFrmlocal.split("@")[1] ){
	Write-Output "remove and pull"
	if (docker ps --format '{{.Names}}' | select-string nodeoffline -Quiet)
	{
		Write-Host "nodeoffline docker already running"
		docker stop nodeoffline
	} 
	if (docker ps -a --filter "status=exited" --format '{{.Names}}' | select-string nodeoffline -Quiet)
	{
		Write-Host "nodeoffline docker in inactive state remove and reload"
		docker rm -f nodeoffline
	}
	docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}"|findstr "registry.gitlab.com/ezapi_poc/apiops_node_offline")
	docker pull registry.gitlab.com/ezapi_poc/apiops_node_offline:latest
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_node_offline:latest
}
if (docker ps --format '{{.Names}}' | select-string nodeoffline -Quiet)
{
	Write-Host "nodeoffline docker already running"
} else {
	if (docker ps -a --format '{{.Names}}' | select-string nodeoffline -Quiet)
	{
		Write-Host "nodeoffline docker in inactive state remove and reload"
		docker rm -f nodeoffline
	}
	docker run -p 7744:7744 -it --name nodeoffline --network ezapi -d registry.gitlab.com/ezapi_poc/apiops_node_offline:latest
}

$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/21565785/registry/repositories/1454591/tags/latest -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:latest --format 'Repo Digest: {{index .RepoDigests 0}}'
#$comparerepo = $digestFrmlocal.Substring($digestFrmlocal.Length-64)
Write-Output $digestFrmlocal.split("@")[1]
if ( $digestFrmLab -ne $digestFrmlocal.split("@")[1] ){
	Write-Output "remove and pull"
	if (docker ps --format '{{.Names}}' | select-string reactui -Quiet)
	{
		Write-Host "reactui docker already running"
		docker stop reactui
	} 
	if (docker ps -a --filter "status=exited" --format '{{.Names}}' | select-string reactui -Quiet)
	{
		Write-Host "reactui docker in inactive state remove and reload"
		docker rm -f reactui
	}
	docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}"|findstr "registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui")
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:latest
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:latest
}
if (docker ps --format '{{.Names}}' | select-string reactui -Quiet)
{
	Write-Host "reactui docker already running"
} else {
	if (docker ps -a --format '{{.Names}}' | select-string reactui -Quiet)
	{
		Write-Host "reactui docker in inactive state remove and reload"
		docker rm -f reactui
	}
	docker run -p 3002:3000 -it  --name reactui --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:latest
}


$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/23365402/registry/repositories/1596924/tags/latest -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi_poc/apiops_apitestrunner:latest --format 'Repo Digest: {{index .RepoDigests 0}}'
#$comparerepo = $digestFrmlocal.Substring($digestFrmlocal.Length-64)
Write-Output $digestFrmlocal.split("@")[1]
if ( $digestFrmLab -ne $digestFrmlocal.split("@")[1] ){
	Write-Output "remove and pull"
	if (docker ps --format '{{.Names}}' | select-string testrunnerapi -Quiet)
	{
		Write-Host "testrunnerapi docker already running"
		docker stop testrunnerapi
	} 
	if (docker ps -a --filter "status=exited" --format '{{.Names}}' | select-string testrunnerapi -Quiet)
	{
		Write-Host "testrunnerapi docker in inactive state remove and reload"
		docker rm -f testrunnerapi
	}
	docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}"|findstr "registry.gitlab.com/ezapi_poc/apiops_apitestrunner")
	docker pull registry.gitlab.com/ezapi_poc/apiops_apitestrunner:latest
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_apitestrunner:latest
}
if (docker ps --format '{{.Names}}' | select-string testrunnerapi -Quiet)
{
	Write-Host "testrunnerapi docker already running"
} else {
	if (docker ps -a --format '{{.Names}}' | select-string testrunnerapi -Quiet)
	{
		Write-Host "testrunnerapi docker in inactive state remove and reload"
		docker rm -f testrunnerapi
	}
	docker run -p 8080:8080 -it  --name testrunnerapi --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_apitestrunner:latest
}

$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/22389576/registry/repositories/1484630/tags/latest -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:latest --format 'Repo Digest: {{index .RepoDigests 0}}'
#$comparerepo = $digestFrmlocal.Substring($digestFrmlocal.Length-64)
Write-Output $digestFrmlocal.split("@")[1]
if ( $digestFrmLab -ne $digestFrmlocal.split("@")[1] ){
	Write-Output "remove and pull"
	if (docker ps --format '{{.Names}}' | select-string virtualserviceeng -Quiet)
	{
		Write-Host "virtualserviceeng docker already running"
		docker stop virtualserviceeng
	} 
	if (docker ps -a --filter "status=exited" --format '{{.Names}}' | select-string virtualserviceeng -Quiet)
	{
		Write-Host "virtualserviceeng docker in inactive state remove and reload"
		docker rm -f virtualserviceeng
	}
	docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}"|findstr "registry.gitlab.com/ezapi_poc/apiops_virtualservice_off")
	docker pull registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:latest
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:latest
}
if (docker ps --format '{{.Names}}' | select-string virtualserviceeng -Quiet)
{
	Write-Host "virtualserviceeng docker already running"
} else {
	if (docker ps -a --format '{{.Names}}' | select-string virtualserviceeng -Quiet)
	{
		Write-Host "virtualserviceeng docker in inactive state remove and reload"
		docker rm -f virtualserviceeng
	}
	docker run -p 8008:8008 -it  --name virtualserviceeng --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:latest
}

$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/35698847/registry/repositories/2992124/tags/latest -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:latest --format 'Repo Digest: {{index .RepoDigests 0}}'
#$comparerepo = $digestFrmlocal.Substring($digestFrmlocal.Length-64)
Write-Output $digestFrmlocal.split("@")[1]
if ( $digestFrmLab -ne $digestFrmlocal.split("@")[1] ){
	Write-Output "remove and pull"
	if (docker ps --format '{{.Names}}' | select-string dataflaskapi -Quiet)
	{
		Write-Host "dataenablerflask docker already running"
		docker stop dataflaskapi
	} 
	if (docker ps -a --format '{{.Names}}' | select-string dataflaskapi -Quiet)
	{
		Write-Host "dataenablerflask docker in inactive state remove and reload"
		docker rm -f dataflaskapi
	}
	docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}"|findstr "registry.gitlab.com/ezapi-designer/dataenabler_offline_flask")
	docker pull registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:latest
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:latest
}
if (docker ps --format '{{.Names}}' | select-string dataflaskapi -Quiet)
{
	Write-Host "dataenablerflask docker already running"
} else {
	if (docker ps -a --format '{{.Names}}' | select-string dataflaskapi -Quiet)
	{
		Write-Host "dataenablerflask docker in inactive state remove and reload"
		docker rm -f dataflaskapi
	}
	docker run -p 5002:5002 -it  --name dataflaskapi --network ezapi -d  registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:latest
}


$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/35918953/registry/repositories/3018563/tags/latest -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi-designer/ezapi_perf_offline/grafana:latest --format 'Repo Digest: {{index .RepoDigests 0}}'
#$comparerepo = $digestFrmlocal.Substring($digestFrmlocal.Length-64)
Write-Output $digestFrmlocal.split("@")[1]
if ( $digestFrmLab -ne $digestFrmlocal.split("@")[1] ){
	Write-Output "remove and pull"
	if (docker ps --format '{{.Names}}' | select-string grafana_ezapi -Quiet)
	{
		Write-Host "grafana_ezapi docker already running"
		docker stop grafana_ezapi
	} 
	if (docker ps -a --format '{{.Names}}' | select-string grafana_ezapi -Quiet)
	{
		Write-Host "grafana_ezapi docker in inactive state remove and reload"
		docker rm -f grafana_ezapi
	}
	docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}"|findstr "registry.gitlab.com/ezapi-designer/ezapi_perf_offline/grafana")
	docker pull registry.gitlab.com/ezapi-designer/ezapi_perf_offline/grafana:latest
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi-designer/ezapi_perf_offline/grafana:latest
}
if (docker ps --format '{{.Names}}' | select-string grafana_ezapi -Quiet)
{
	Write-Host "grafana_ezapi docker already running"
} else {
	if (docker ps -a --format '{{.Names}}' | select-string grafana_ezapi -Quiet)
	{
		Write-Host "grafana_ezapi docker in inactive state remove and reload"
		docker rm -f grafana_ezapi
	}
	docker run -d --user root -p 3004:3000 --name grafana_ezapi --network ezapi -d  registry.gitlab.com/ezapi-designer/ezapi_perf_offline/grafana:latest
}

$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/35918953/registry/repositories/3018554/tags/latest -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi-designer/ezapi_perf_offline/influxdb:latest --format 'Repo Digest: {{index .RepoDigests 0}}'
#$comparerepo = $digestFrmlocal.Substring($digestFrmlocal.Length-64)
Write-Output $digestFrmlocal.split("@")[1]
if ( $digestFrmLab -ne $digestFrmlocal.split("@")[1] ){
	Write-Output "remove and pull"
	if (docker ps --format '{{.Names}}' | select-string influxdb_ezapi -Quiet)
	{
		Write-Host "influxdb_ezapi docker already running"
		docker stop influxdb_ezapi
	} 
	if (docker ps -a --format '{{.Names}}' | select-string influxdb_ezapi -Quiet)
	{
		Write-Host "influxdb_ezapi docker in inactive state remove and reload"
		docker rm -f influxdb_ezapi
	}
	docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}"|findstr "registry.gitlab.com/ezapi-designer/ezapi_perf_offline/influxdb")
	docker pull registry.gitlab.com/ezapi-designer/ezapi_perf_offline/influxdb:latest
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi-designer/ezapi_perf_offline/influxdb:latest
}
if (docker ps --format '{{.Names}}' | select-string influxdb_ezapi -Quiet)
{
	Write-Host "influxdb_ezapi docker already running"
} else {
	if (docker ps -a --format '{{.Names}}' | select-string influxdb_ezapi -Quiet)
	{
		Write-Host "influxdb_ezapi docker in inactive state remove and reload"
		docker rm -f influxdb_ezapi
	}
	 docker run -d -p 8087:8086 --name influxdb_ezapi --network ezapi -d  registry.gitlab.com/ezapi-designer/ezapi_perf_offline/influxdb:latest
}

#docker run -p 27017:27017 -it -v mongodata:/data/db --name mongoofflinedb --network ezapi -d registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:latest
#docker run -p 7744:7744 -it --name nodeoffline --network ezapi -d registry.gitlab.com/ezapi_poc/apiops_node_offline:latest
#docker run -p 3002:3000 -it  --name reactui --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:latest
$jsonfile=Get-ChildItem *.json | Select-Object -expandproperty Name
docker cp $jsonfile mongoofflinedb:mnt
docker exec -it mongoofflinedb sh -c "mongoimport --db ezapi --mode=upsert --upsertFields=dbname --port 27017 --collection master --file /mnt/$jsonfile"
#rm -Recurse -Force *.json
docker exec -it mongoofflinedb rm -rf mnt/$jsonfile
$archfile=Get-ChildItem -Recurse -exclude @("*.json", "*.ps1" , "*.sh" , "*.js" , "*.db") | Select-Object -expandproperty Name
Write-Output "copying files"
docker cp $archfile mongoofflinedb:mnt
#docker exec -it mongoofflinedb archfile="ls -I *.json"
docker exec -it mongoofflinedb sh -c "mongorestore --drop --archive=/mnt/$archfile"
docker exec -it mongoofflinedb rm -rf mnt/$archfile

docker exec -it influxdb_ezapi influx -execute 'create database ezapi_perf_test_metrics'
$grafdbfile=Get-ChildItem *.db | Select-Object -expandproperty Name
Write-Output "grafdbfile " $grafdbfile
docker cp $grafdbfile grafana_ezapi:/var/lib/grafana/grafana.db
docker exec -it grafana_ezapi grafana-cli admin reset-admin-password admin@123
docker restart grafana_ezapi

#docker cp c:\users\jvenkatakrishnan\desktop\sample.bson mongodb:tmp
#docker exec -it mongodb mongorestore --db Named-pipe tmp/sample.bson
