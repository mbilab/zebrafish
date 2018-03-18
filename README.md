# Setup

1. install [libav](https://www.libav.org/)
2. install [cairo](https://www.cairographics.org/)
3. install [node.js](https://nodejs.org/)
4. `mkdir output`

# Execute

command: `node zebrafish.js [VIDEO] [THEDA] [GRAYSCALE]`

\[VIDEO\]: the video (`.mov` format) to calculate

\[THEDA\]: the threshold to binarize a grayscale image (`0.96` is suggested)

\[GRAYSCALE\]: the grayscale formula (`0` is suggested):

0. luma without gamma correction
1. intensity
2. gleam
3. luminance
4. luma
5. value
6. luster
7. lightness
8. luminace with gamma correction
9. lightness with gamma correction
10. value with gamma correction
11. luster with gamma correction
