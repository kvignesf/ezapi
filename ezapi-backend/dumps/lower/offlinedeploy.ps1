#$tagName=$args[0]
#function Invoke-AmazingPowerShellFunction {
#  Param(
#    [Parameter(Mandatory=$true)]
#    [ValidateSet('Prod','latest','Stage','Test')]
#    [string]$tagName
#  )
#} 

# Function To prompt user to select a list of values : These list of values for Prod will be different and for all Non-Prod will be different
function Get-SelectionFromUser {
    param (
        [Parameter(Mandatory=$true)]
        [string[]]$Options,
		[Parameter(Mandatory=$true)]
        [string]$Prompt
           
    )
    
    [int]$Response = 0;
    [bool]$ValidResponse = $false    

    while (!($ValidResponse)) {            
        [int]$OptionNo = 0

        Write-Host $Prompt -ForegroundColor DarkYellow
        Write-Host "[0]: Cancel"

        foreach ($Option in $Options) {
            $OptionNo += 1
            Write-Host ("[$OptionNo]: {0}" -f $Option)
        }

        if ([Int]::TryParse((Read-Host), [ref]$Response)) {
            if ($Response -eq 0) {
                return ''
            }
            elseif($Response -le $OptionNo) {
                $ValidResponse = $true
            }
        }
    }

    return $Options.Get($Response - 1)
} 
#Write-Host ("You selected {0}" -f (Get-SelectionFromUser -Options ('latest','master') -Prompt 'Select a tag'))

# get Branches from each repo as list of values and then ask for users to select the TAG
$listofMongoBranches=Invoke-RestMethod -Uri "https://gitlab.com/api/v4/registry/repositories/1454657?tags=true&tags_count=true&size=true" -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} -ContentType 'application/json'
$listofNodeBranches=Invoke-RestMethod -Uri "https://gitlab.com/api/v4/registry/repositories/1456307?tags=true&tags_count=true&size=true" -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} -ContentType 'application/json'
$listofReactBranches=Invoke-RestMethod -Uri "https://gitlab.com/api/v4/registry/repositories/1454591?tags=true&tags_count=true&size=true" -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} -ContentType 'application/json'
$listofTestRunnerBranches=Invoke-RestMethod -Uri "https://gitlab.com/api/v4/registry/repositories/1596924?tags=true&tags_count=true&size=true" -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} -ContentType 'application/json'
$listofVirtualServBranches=Invoke-RestMethod -Uri "https://gitlab.com/api/v4/registry/repositories/1484630?tags=true&tags_count=true&size=true" -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} -ContentType 'application/json'
$listofDataEnablerBranches=Invoke-RestMethod -Uri "https://gitlab.com/api/v4/registry/repositories/2992124?tags=true&tags_count=true&size=true" -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} -ContentType 'application/json'

#Write-Output $listofMongoBranches
#Write-Output $listofNodeBranches
#Write-Output $listofReactBranches
#Write-Output $listofTestRunnerBranches
#Write-Output $listofVirtualServBranches

# list of Branches 
$mongotagsObj = $listofMongoBranches.tags | where-object { $_.name -ne "" }
$nodetagsObj = $listofNodeBranches.tags | where-object { $_.name -ne "" }
$reacttagsObj = $listofReactBranches.tags | where-object { $_.name -ne "" }
$testRunnertagsObj = $listofTestRunnerBranches.tags | where-object { $_.name -ne "" }
$virtualServtagsObj = $listofVirtualServBranches.tags | where-object { $_.name -ne "" }
$DataEnablertagsObj = $listofDataEnablerBranches.tags | where-object { $_.name -ne "" }

#Write-Output $tagsObj.name

# user Prompt
$mongoTag = Get-SelectionFromUser -Options $mongotagsObj.name -Prompt 'Select a tag for MONGODB'
Write-Host ("You selected {0}" -f $mongoTag)
#rite-Output $tagsObj.name
$nodeTag = Get-SelectionFromUser -Options $nodetagsObj.name -Prompt 'Select a tag for Node Repo'
Write-Host ("You selected {0}" -f $nodeTag)

$reactTag = Get-SelectionFromUser -Options $reacttagsObj.name -Prompt 'Select a tag for ReactUI Repo'
Write-Host ("You selected {0}" -f $reactTag)

$testRunnerTag = Get-SelectionFromUser -Options $testRunnertagsObj.name -Prompt 'Select a tag for API TestRunner Repo'
Write-Host ("You selected {0}" -f $testRunnerTag)

$virtualServTag = Get-SelectionFromUser -Options $virtualServtagsObj.name -Prompt 'Select a tag for VirtualService Repo'
Write-Host ("You selected {0}" -f $virtualServTag)

$DataEnablerTag = Get-SelectionFromUser -Options $DataEnablertagsObj.name -Prompt 'Select a tag for DataEnabler Repo'
Write-Host ("You selected {0}" -f $DataEnablerTag)

#Write-Host ("You selected {0}" -f (Get-SelectionFromUser -Options $nodetagsObj.name -Prompt 'Select a tag for Node'))

#Write-Host ("You selected {0}" -f (Get-SelectionFromUser -Options $reacttagsObj.name -Prompt 'Select a tag for ReactUI'))


[Net.ServicePointManager]::SecurityProtocol = "Tls12 , Ssl3"
docker network inspect ezapi | out-null | docker network create --driver bridge ezapi
docker login registry.gitlab.com -u gitlab-ci-token -p bMJKJVzze8Dzwcf2r9s3
$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/21565785/registry/repositories/1454657/tags/$mongoTag -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:$mongoTag --format 'Repo Digest: {{index .RepoDigests 0}}'
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
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:$mongoTag
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:$mongoTag
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
	docker run -p 27017:27017 -it -v mongodata:/data/db --name mongoofflinedb --network ezapi -d registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:$mongoTag
}

$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/22153917/registry/repositories/1456307/tags/$nodeTag -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi_poc/apiops_node_offline:$nodeTag  --format 'Repo Digest: {{index .RepoDigests 0}}'
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
	docker pull registry.gitlab.com/ezapi_poc/apiops_node_offline:$nodeTag
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_node_offline:$nodeTag
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
	docker run -p 7744:7744 -it --name nodeoffline --network ezapi -d registry.gitlab.com/ezapi_poc/apiops_node_offline:$nodeTag
}

$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/21565785/registry/repositories/1454591/tags/$reactTag -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:$reactTag --format 'Repo Digest: {{index .RepoDigests 0}}'
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
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:$reactTag
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:$reactTag
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
	docker run -p 3002:3000 -it  --name reactui --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:$reactTag
}


$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/23365402/registry/repositories/1596924/tags/$testRunnerTag -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi_poc/apiops_apitestrunner:$testRunnerTag --format 'Repo Digest: {{index .RepoDigests 0}}'
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
	docker pull registry.gitlab.com/ezapi_poc/apiops_apitestrunner:$testRunnerTag
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_apitestrunner:$testRunnerTag
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
	docker run -p 8080:8080 -it  --name testrunnerapi --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_apitestrunner:$testRunnerTag
}

$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/22389576/registry/repositories/1484630/tags/$virtualServTag -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:$virtualServTag --format 'Repo Digest: {{index .RepoDigests 0}}'
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
	docker pull registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:$virtualServTag
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:$virtualServTag
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
	docker run -p 8008:8008 -it  --name virtualserviceeng --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:$virtualServTag
}

$digestFrmLab=Invoke-RestMethod -Uri https://gitlab.com/api/v4/projects/35698847/registry/repositories/2992124/tags/$DataEnablerTag -Headers @{'PRIVATE-TOKEN'="bMJKJVzze8Dzwcf2r9s3"} | Select-Object -expandproperty digest
Write-Output $digestFrmLab
$digestFrmlocal=docker inspect registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:$DataEnablerTag --format 'Repo Digest: {{index .RepoDigests 0}}'
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
	docker pull registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:$DataEnablerTag
} else {
	Write-Output "direct pull"
	docker pull registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:$DataEnablerTag
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
	docker run -p 5002:5002 -it  --name dataflaskapi --network ezapi -d  registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:$DataEnablerTag
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

#docker run -p 27017:27017 -it -v mongodata:/data/db --name mongoofflinedb --network ezapi -d registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:$tagName
#docker run -p 7744:7744 -it --name nodeoffline --network ezapi -d registry.gitlab.com/ezapi_poc/apiops_node_offline:$tagName
#docker run -p 3002:3000 -it  --name reactui --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:$tagName
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
