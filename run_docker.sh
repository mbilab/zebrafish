#!/usr/bin/env sh
docker run -it \
	-v $1:/home/zebrafish/input \
	-v $2:/home/zebrafish/output \
	zebrafish:standalone \
	/bin/bash
