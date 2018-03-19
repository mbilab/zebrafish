# Setup

1. install [libav](https://www.libav.org/)
2. install [cairo](https://www.cairographics.org/)
3. install [node.js](https://nodejs.org/)
4. `npm i`
5. `mkdir output`

# Execute

command: `node zebrafish.js [VIDEO] [THEDA]`

\[VIDEO\]: the video (`.mov` format) to calculate

\[THEDA\]: the threshold to binarize a grayscale image (`0.96` is suggested)

the result will be in output/[VIDEO]/[THEDA]/custom-init-kmeans-centroids/result.json
