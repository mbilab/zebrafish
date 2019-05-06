#!/usr/bin/env sh
docker run -it \
	--rm \
	-v $1:/home/zebrafish/input \
	-v $2:/home/zebrafish/output \
	--name zebrafish \
	zebrafish:standalone \
	/bin/bash
