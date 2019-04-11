# Setup

1. `mkdir input output`
2. Install dependencies or use our docker image:

## Install dependencies

1. install [libav](https://www.libav.org/)
2. install [cairo](https://www.cairographics.org/)
3. install [node.js](https://nodejs.org/)
4. `npm i`

## Use docker image

For building a local image:
`docker build -t zebrafish:standalone .`

For using a existing image:
`docker pull st9007a/zebrafish:standalone`

# Usage

For running in local:

1. Put you video into `input` folder
2. Run the software:

```
Usage: node zebrafish.js [video] [theda]

Arguments:
  video  the video (.mov format) to analyze
  theda  the threshold to binarize a grayscale image (`0.96` is suggested)

The result is stored in `output/[VIDEO]/[THEDA]/custom-init-kmeans-centroids/result.json`
```

For running in the docker container:

1. Put you video into `input` folder
2. Start the container:

```
Usage: ./run_docker.sh [input directory] [output directory]

Arguments:
  input directory   the absolute path of your `input` folder
  output directory  the absolute path of your `output` folder
```

3. Run the software:
```
Usage: node zebrafish.js [video] [theda]

Arguments:
  video  the video (.mov format) to analyze
  theda  the threshold to binarize a grayscale image (`0.96` is suggested)

The result is stored in `output/[VIDEO]/[THEDA]/custom-init-kmeans-centroids/result.json`
```
