# Zebrafish

The implementation of the paper : An Automatic Method to Calculate Heart Rate from Zebrafish Larval Cardiac Videos

## Setup

1. `mkdir input output`
2. Install dependencies or use our docker image:

### Install dependencies

1. install [libav](https://www.libav.org/)
2. install [cairo](https://www.cairographics.org/)
3. install [node.js](https://nodejs.org/)
4. `npm i`

### Use docker image

For building a local image:
`docker build -t zebrafish:standalone .`

For using a existing image:
`docker pull st9007a/zebrafish:standalone`

Run docker:
`docker run -it st9007a/zebrafish:standalone /bin/bash`

## Usage

For running in local:

1. Put you video into `input` folder
2. Run the software:

```
Usage: node zebrafish.js [video] [theda]

Arguments:
  video  the relative path of the video (.mov format) to analyze
  theda  the threshold to binarize a grayscale image (0.96 is suggested)

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
  video  the relative path of the video (.mov format) to analyze (ex: input/xxx.mov)
  theda  the threshold to binarize a grayscale image (`0.96` is suggested)

The result is stored in `output/[VIDEO]/[THEDA]/custom-init-kmeans-centroids/result.json`
```
