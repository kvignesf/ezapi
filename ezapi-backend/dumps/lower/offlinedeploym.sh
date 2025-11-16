#! /bin/bash
function SelectionFromUser()
{
        echo "[0]: Cancel"
        arr=("$@")
        for i in "${!arr[@]}";
            do
                let j=$i+1
                echo "[""$j""]:" "${arr[$i]}"
            done
        return $j
}

function readElementfrmArr ()
{
        arr=("$@")
        let k=$1
        echo "${arr[$k]}"
}

function parseOutput ()
{
	a=("$@")
	for m in "${!a[@]}";
		do
		let n=$m+1
		if [[ "${a[$m]}" == *'"name":'* ]] ; then
			let p=$p+1
			#echo "[""$j""]:" "${a[$i]}"
			valu=$(echo "${a[$m]}" | sed -e 's/"name":/ /g')
			#echo $valu
			#echo $k
			#echo "arr[$k] = $valu"
			echo $valu			
		fi
		done
	echo "${arr[$p]}" 
}

mongoTagsArr=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/registry/repositories/1454657?tags=true&tags_count=true&size=true" | sed -e 's/[{}]/''/g' | awk '{print $2}'  FS='tags":' | awk -F'[][]' '{print $2}')
msubarr=($(echo "$mongoTagsArr" | tr ',' '\n'))
mfinarr=$(parseOutput ${msubarr[*]});

echo 'Please select from the tag options for MongoDB:'
SelectionFromUser $mfinarr
count=$?
n=""
while true; do
    read -p 'Select option: ' n
    # If $n is an integer between one and $count...
    if [ "$n" -eq "$n" ] && [ "$n" -gt 0 ] && [ "$n" -le "$count" ]; then
        break
    fi
done
mongoTagVal=$(readElementfrmArr $n $mfinarr);
mongoTagVal=`sed -e 's/^"//' -e 's/"$//' <<<"$mongoTagVal"`
echo "You selected option number $n: $mongoTagVal"

nodeTagsArr=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/registry/repositories/1456307?tags=true&tags_count=true&size=true" | sed -e 's/[{}]/''/g' | awk '{print $2}'  FS='tags":' | awk -F'[][]' '{print $2}')
nsubarr=($(echo "$nodeTagsArr" | tr ',' '\n'))
nfinarr=$(parseOutput ${nsubarr[*]});
echo 'Please select from the tag options for Node Repo:'
SelectionFromUser $nfinarr
count=$?
n=""
while true; do
    read -p 'Select option: ' n
    # If $n is an integer between one and $count...
    if [ "$n" -eq "$n" ] && [ "$n" -gt 0 ] && [ "$n" -le "$count" ]; then
        break
    fi
done
nodeTagVal=$(readElementfrmArr $n $nfinarr);
nodeTagVal=`sed -e 's/^"//' -e 's/"$//' <<<"$nodeTagVal"`
echo "You selected option number $n: $nodeTagVal"

reactTagsArr=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/registry/repositories/1454591?tags=true&tags_count=true&size=true" | sed -e 's/[{}]/''/g' | awk '{print $2}'  FS='tags":' | awk -F'[][]' '{print $2}')
rsubarr=($(echo "$reactTagsArr" | tr ',' '\n'))
rfinarr=$(parseOutput ${rsubarr[*]});
echo 'Please select from the tag options for React Repo:'
SelectionFromUser $rfinarr
count=$?
n=""
while true; do
    read -p 'Select option: ' n
    # If $n is an integer between one and $count...
    if [ "$n" -eq "$n" ] && [ "$n" -gt 0 ] && [ "$n" -le "$count" ]; then
        break
    fi
done
reactTagVal=$(readElementfrmArr $n $rfinarr);
reactTagVal=`sed -e 's/^"//' -e 's/"$//' <<<"$reactTagVal"`
echo "You selected option number $n: $reactTagVal"

testRunnerTagsArr=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/registry/repositories/1596924?tags=true&tags_count=true&size=true" | sed -e 's/[{}]/''/g' | awk '{print $2}'  FS='tags":' | awk -F'[][]' '{print $2}')
tsubarr=($(echo "$testRunnerTagsArr" | tr ',' '\n'))
tfinarr=$(parseOutput ${tsubarr[*]});
echo 'Please select from the tag options for TestRunner Repo:'
SelectionFromUser $tfinarr
count=$?
n=""
while true; do
    read -p 'Select option: ' n
    # If $n is an integer between one and $count...
    if [ "$n" -eq "$n" ] && [ "$n" -gt 0 ] && [ "$n" -le "$count" ]; then
        break
    fi
done
testRunnerTagVal=$(readElementfrmArr $n $tfinarr);
testRunnerTagVal=`sed -e 's/^"//' -e 's/"$//' <<<"$testRunnerTagVal"`
echo "You selected option number $n: $testRunnerTagVal"

virtualServTagsArr=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/registry/repositories/1484630?tags=true&tags_count=true&size=true" | sed -e 's/[{}]/''/g' | awk '{print $2}'  FS='tags":' | awk -F'[][]' '{print $2}')
vsubarr=($(echo "$virtualServTagsArr" | tr ',' '\n'))
vfinarr=$(parseOutput ${vsubarr[*]});
echo 'Please select from the tag options for VirtualService Repo:'
SelectionFromUser $vfinarr
count=$?
n=""
while true; do
    read -p 'Select option: ' n
    # If $n is an integer between one and $count...
    if [ "$n" -eq "$n" ] && [ "$n" -gt 0 ] && [ "$n" -le "$count" ]; then
        break
    fi
done
virtualServTagVal=$(readElementfrmArr $n $vfinarr);
virtualServTagVal=`sed -e 's/^"//' -e 's/"$//' <<<"$virtualServTagVal"`
echo "You selected option number $n: $virtualServTagVal"


dataEnablerTagsArr=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/registry/repositories/2992124?tags=true&tags_count=true&size=true" | sed -e 's/[{}]/''/g' | awk '{print $2}'  FS='tags":' | awk -F'[][]' '{print $2}')
dsubarr=($(echo "$dataEnablerTagsArr" | tr ',' '\n'))
dfinarr=$(parseOutput ${dsubarr[*]});
echo 'Please select from the tag options for DataEnabler Repo:'
SelectionFromUser $dfinarr
count=$?
n=""
while true; do
    read -p 'Select option: ' n
    # If $n is an integer between one and $count...
    if [ "$n" -eq "$n" ] && [ "$n" -gt 0 ] && [ "$n" -le "$count" ]; then
        break
    fi
done
dataEnablerTagVal=$(readElementfrmArr $n $dfinarr);
dataEnablerTagVal=`sed -e 's/^"//' -e 's/"$//' <<<"$dataEnablerTagVal"`
echo "You selected option number $n: $dataEnablerTagVal"


docker network inspect ezapi >/dev/null 2>&1 || docker network create --driver bridge ezapi
docker login registry.gitlab.com -u gitlab-ci-token -p bMJKJVzze8Dzwcf2r9s3
digestFrmLab=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/projects/21565785/registry/repositories/1454657/tags/"$mongoTagVal | awk '{print $2}' FS='digest":"' | awk '{print $1}' FS='",')
echo "frmlab" $digestFrmLab
digestFrmlocal=$(docker inspect registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:$mongoTagVal --format='{{index .RepoDigests 0}}' | cut -d'@' -f2)
echo "frmloc" $digestFrmlocal
if [ $digestFrmLab != $digestFrmlocal ]; then
	echo "remove and pull"
	if [ "$(docker ps -q -f name='mongoofflinedb')" ]; then
		echo "mongoofflinedb docker already running"	
		docker stop mongoofflinedb
	fi
	if [ "$(docker ps -aq -f status=exited -f name='mongoofflinedb')" ]; then
		echo "mongoofflinedb docker in inactive state remove and reload"
        docker rm mongoofflinedb
    fi
	docker rmi --force $(docker images -q 'registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo' | uniq)
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:$mongoTagVal

else
	echo "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:$mongoTagVal
fi

if [ "$(docker ps -q -f name='mongoofflinedb')" ]; then
	echo "mongoofflinedb docker already running"
else
	if [ "$(docker ps -aq -f status=exited -f name='mongoofflinedb')" ]; then
		echo "mongoofflinedb docker in inactive state remove and reload"
        docker rm mongoofflinedb
    fi
    docker run -p 27017:27017 -it -v mongodata:/data/db --name mongoofflinedb --network ezapi -d registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui/mongo:$mongoTagVal
fi

digestFrmLab=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/projects/22153917/registry/repositories/1456307/tags/"$nodeTagVal | awk '{print $2}' FS='digest":"' | awk '{print $1}' FS='",')
echo "frmlab" $digestFrmLab
digestFrmlocal=$(docker inspect registry.gitlab.com/ezapi_poc/apiops_node_offline:$nodeTagVal --format='{{index .RepoDigests 0}}' | cut -d'@' -f2)
echo "frmloc" $digestFrmlocal
if [ $digestFrmLab != $digestFrmlocal ]; then
	echo "remove and pull"
	if [ "$(docker ps -q -f name='nodeoffline')" ]; then
		echo "nodeoffline docker already running"	
		docker stop nodeoffline
	fi
	if [ "$(docker ps -aq -f status=exited -f name='nodeoffline')" ]; then
		echo "nodeoffline docker in inactive state remove and reload"
        docker rm nodeoffline
    fi
	docker rmi --force $(docker images -q 'registry.gitlab.com/ezapi_poc/apiops_node_offline' | uniq)
	docker pull registry.gitlab.com/ezapi_poc/apiops_node_offline:$nodeTagVal

else
	echo "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_node_offline:$nodeTagVal
fi

if [ "$(docker ps -q -f name='nodeoffline')" ]; then
	echo "nodeoffline docker already running"
else
	if [ "$(docker ps -aq -f status=exited -f name='nodeoffline')" ]; then
		echo "nodeoffline docker in inactive state remove and reload"
        docker rm nodeoffline
    fi
    docker run -p 7744:7744 -it --name nodeoffline --network ezapi -d registry.gitlab.com/ezapi_poc/apiops_node_offline:$nodeTagVal
fi

digestFrmLab=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/projects/21565785/registry/repositories/1454591/tags/"$reactTagVal | awk '{print $2}' FS='digest":"' | awk '{print $1}' FS='",')
echo "frmlab" $digestFrmLab
digestFrmlocal=$(docker inspect registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:$reactTagVal --format='{{index .RepoDigests 0}}' | cut -d'@' -f2)
echo "frmloc" $digestFrmlocal
if [ $digestFrmLab != $digestFrmlocal ]; then
	echo "remove and pull"
	if [ "$(docker ps -q -f name='reactui')" ]; then
		echo "reactui docker already running"	
		docker stop reactui
	fi
	if [ "$(docker ps -aq -f status=exited -f name='reactui')" ]; then
		echo "reactui docker in inactive state remove and reload"
        docker rm reactui
    fi
	docker rmi --force $(docker images -q 'registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui' | uniq)
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:$reactTagVal

else
	echo "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:$reactTagVal
fi

if [ "$(docker ps -q -f name='reactui')" ]; then
	echo "reactui docker already running"
else
	if [ "$(docker ps -aq -f status=exited -f name='reactui')" ]; then
		echo "reactui docker in inactive state remove and reload"
        docker rm reactui
    fi
    docker run -p 3002:3000 -it --name reactui --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_dwnload_reactui:$reactTagVal
fi


digestFrmLab=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/projects/23365402/registry/repositories/1596924/tags/"$testRunnerTagVal | awk '{print $2}' FS='digest":"' | awk '{print $1}' FS='",')
echo "frmlab" $digestFrmLab
digestFrmlocal=$(docker inspect registry.gitlab.com/ezapi_poc/apiops_apitestrunner:$testRunnerTagVal --format='{{index .RepoDigests 0}}' | cut -d'@' -f2)
echo "frmloc" $digestFrmlocal
if [ $digestFrmLab != $digestFrmlocal ]; then
	echo "remove and pull"
	if [ "$(docker ps -q -f name='testrunnerapi')" ]; then
		echo "testrunnerapi docker already running"	
		docker stop testrunnerapi
	fi
	if [ "$(docker ps -aq -f status=exited -f name='testrunnerapi')" ]; then
		echo "testrunnerapi docker in inactive state remove and reload"
        docker rm testrunnerapi
    fi
	docker rmi --force $(docker images -q 'registry.gitlab.com/ezapi_poc/apiops_apitestrunner' | uniq)
	docker pull registry.gitlab.com/ezapi_poc/apiops_apitestrunner:$testRunnerTagVal

else
	echo "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_apitestrunner:$testRunnerTagVal
fi

if [ "$(docker ps -q -f name='testrunnerapi')" ]; then
	echo "testrunnerapi docker already running"
else
	if [ "$(docker ps -aq -f status=exited -f name='testrunnerapi')" ]; then
		echo "testrunnerapi docker in inactive state remove and reload"
        docker rm testrunnerapi
    fi
    docker run -p 8080:8080 -it --name testrunnerapi --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_apitestrunner:$testRunnerTagVal
fi

digestFrmLab=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/projects/22389576/registry/repositories/1484630/tags/"$virtualServTagVal | awk '{print $2}' FS='digest":"' | awk '{print $1}' FS='",')
echo "frmlab" $digestFrmLab
digestFrmlocal=$(docker inspect registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:$virtualServTagVal --format='{{index .RepoDigests 0}}' | cut -d'@' -f2)
echo "frmloc" $digestFrmlocal
if [ $digestFrmLab != $digestFrmlocal ]; then
	echo "remove and pull"
	if [ "$(docker ps -q -f name='virtualserviceeng')" ]; then
		echo "virtualserviceeng docker already running"	
		docker stop virtualserviceeng
	fi
	if [ "$(docker ps -aq -f status=exited -f name='virtualserviceeng')" ]; then
		echo "virtualserviceeng docker in inactive state remove and reload"
        docker rm virtualserviceeng
    fi
	docker rmi --force $(docker images -q 'registry.gitlab.com/ezapi_poc/apiops_virtualservice_off' | uniq)
	docker pull registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:$virtualServTagVal

else
	echo "direct pull"
	docker pull registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:$virtualServTagVal
fi

if [ "$(docker ps -q -f name='virtualserviceeng')" ]; then
	echo "virtualserviceeng docker already running"
else
	if [ "$(docker ps -aq -f status=exited -f name='virtualserviceeng')" ]; then
		echo "virtualserviceeng docker in inactive state remove and reload"
        docker rm virtualserviceeng
    fi
    docker run -p 8008:8008 -it  --name virtualserviceeng --network ezapi -d  registry.gitlab.com/ezapi_poc/apiops_virtualservice_off:$virtualServTagVal
fi

digestFrmLab=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/projects/35698847/registry/repositories/2992124/tags/"$dataEnablerTagVal | awk '{print $2}' FS='digest":"' | awk '{print $1}' FS='",')
echo "frmlab" $digestFrmLab
digestFrmlocal=$(docker inspect registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:$dataEnablerTagVal --format='{{index .RepoDigests 0}}' | cut -d'@' -f2)
echo "frmloc" $digestFrmlocal
if [ $digestFrmLab != $digestFrmlocal ]; then
	echo "remove and pull"
	if [ "$(docker ps -q -f name='dataflaskapi')" ]; then
		echo "dataenablerflask docker already running"	
		docker stop dataflaskapi
	fi
	if [ "$(docker ps -aq -f status=exited -f name='dataflaskapi')" ]; then
		echo "dataenablerflask docker in inactive state remove and reload"
        docker rm dataflaskapi
    fi
	docker rmi --force $(docker images -q 'registry.gitlab.com/ezapi-designer/dataenabler_offline_flask' | uniq)
	docker pull registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:$dataEnablerTagVal

else
	echo "direct pull"
	docker pull registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:$dataEnablerTagVal
fi

if [ "$(docker ps -q -f name='dataflaskapi')" ]; then
	echo "dataenablerflask docker already running"
else
	if [ "$(docker ps -aq -f status=exited -f name='dataflaskapi')" ]; then
		echo "dataenablerflask docker in inactive state remove and reload"
        docker rm dataflaskapi
    fi
    docker run -p 5002:5002 -it  --name dataflaskapi --network ezapi -d  registry.gitlab.com/ezapi-designer/dataenabler_offline_flask:$dataEnablerTagVal
fi

digestFrmLab=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/projects/35918953/registry/repositories/3018563/tags/latest" | awk '{print $2}' FS='digest":"' | awk '{print $1}' FS='",')
echo "frmlab" $digestFrmLab
digestFrmlocal=$(docker inspect registry.gitlab.com/ezapi-designer/ezapi_perf_offline/grafana:latest --format='{{index .RepoDigests 0}}' | cut -d'@' -f2)
echo "frmloc" $digestFrmlocal
if [ $digestFrmLab != $digestFrmlocal ]; then
	echo "remove and pull"
	if [ "$(docker ps -q -f name='grafana_ezapi')" ]; then
		echo "grafana_ezapi docker already running"	
		docker stop grafana_ezapi
	fi
	if [ "$(docker ps -aq -f status=exited -f name='grafana_ezapi')" ]; then
		echo "grafana_ezapi docker in inactive state remove and reload"
        docker rm grafana_ezapi
    fi
	docker rmi --force $(docker images -q 'registry.gitlab.com/ezapi-designer/ezapi_perf_offline/grafana' | uniq)
	docker pull registry.gitlab.com/ezapi-designer/ezapi_perf_offline/grafana:latest

else
	echo "direct pull"
	docker pull registry.gitlab.com/ezapi-designer/ezapi_perf_offline/grafana:latest
fi

if [ "$(docker ps -q -f name='grafana_ezapi')" ]; then
	echo "grafana_ezapi docker already running"
else
	if [ "$(docker ps -aq -f status=exited -f name='grafana_ezapi')" ]; then
		echo "grafana_ezapi docker in inactive state remove and reload"
        docker rm grafana_ezapi
    fi
    docker run -d --user root -p 3004:3000 --name grafana_ezapi --network ezapi -d  registry.gitlab.com/ezapi-designer/ezapi_perf_offline/grafana:latest
fi

digestFrmLab=$(curl -H "PRIVATE-TOKEN: bMJKJVzze8Dzwcf2r9s3" "https://gitlab.com/api/v4/projects/35918953/registry/repositories/3018554/tags/latest" | awk '{print $2}' FS='digest":"' | awk '{print $1}' FS='",')
echo "frmlab" $digestFrmLab
digestFrmlocal=$(docker inspect registry.gitlab.com/ezapi-designer/ezapi_perf_offline/influxdb:latest --format='{{index .RepoDigests 0}}' | cut -d'@' -f2)
echo "frmloc" $digestFrmlocal
if [ $digestFrmLab != $digestFrmlocal ]; then
	echo "remove and pull"
	if [ "$(docker ps -q -f name='influxdb_ezapi')" ]; then
		echo "influxdb_ezapi docker already running"	
		docker stop influxdb_ezapi
	fi
	if [ "$(docker ps -aq -f status=exited -f name='influxdb_ezapi')" ]; then
		echo "influxdb_ezapi docker in inactive state remove and reload"
        docker rm influxdb_ezapi
    fi
	docker rmi --force $(docker images -q 'registry.gitlab.com/ezapi-designer/ezapi_perf_offline/influxdb' | uniq)
	docker pull registry.gitlab.com/ezapi-designer/ezapi_perf_offline/influxdb:latest

else
	echo "direct pull"
	docker pull registry.gitlab.com/ezapi-designer/ezapi_perf_offline/influxdb:latest
fi

if [ "$(docker ps -q -f name='influxdb_ezapi')" ]; then
	echo "influxdb_ezapi docker already running"
else
	if [ "$(docker ps -aq -f status=exited -f name='influxdb_ezapi')" ]; then
		echo "influxdb_ezapi docker in inactive state remove and reload"
        docker rm influxdb_ezapi
    fi
    docker run -d -p 8087:8086 --name influxdb_ezapi --network ezapi -d registry.gitlab.com/ezapi-designer/ezapi_perf_offline/influxdb:latest
fi

#docker cp Constants.js reactui:/app/src
jsonfile='ls *.json'
docker cp `$jsonfile` mongoofflinedb:mnt
docker exec -it mongoofflinedb sh -c "mongoimport --db ezapi --mode=upsert --upsertFields=dbname --port 27017 --collection master --file /mnt/`$jsonfile`"
docker exec -it mongoofflinedb rm -rf mnt/`$jsonfile`
archfile=`ls | grep -v '\.json$' | grep -v '\.sh1$'| grep -v '\.js$' | grep -v '\.jse$'| grep -v '\.sh$'| grep -v '\.db$'`
#archfile="ls -I *.json -I *.sh -I *.js"
echo $archfile | docker cp $archfile  mongoofflinedb:mnt
echo $archfile | docker exec -i mongoofflinedb sh -c "mongorestore --drop --archive=/mnt/$archfile"
echo $archfile | docker exec -i mongoofflinedb rm -rf mnt/$archfile

docker exec -it influxdb_ezapi influx -execute 'create database ezapi_perf_test_metrics'
grafdbfile='ls *.db'
echo "grafdbfile " `$grafdbfile`
docker cp `$grafdbfile` grafana_ezapi:/var/lib/grafana/grafana.db
docker exec -it grafana_ezapi grafana-cli admin reset-admin-password admin@123
docker restart grafana_ezapi
