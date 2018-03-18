var gauss, async, extend, colors, canvas, fs, mkdirp, path, rimraf, sh, mathjs, movingAverage, densityClustering, nodeKmeans, simpleKmeans, grayscaleLib, grayscaleMethods, grayscale, app, mov, dir, replace$ = ''.replace;
gauss = require('gauss');
async = require('async');
extend = require('extend');
colors = require('colors');
canvas = require('canvas');
fs = require('fs');
mkdirp = require('mkdirp');
path = require('path');
rimraf = require('rimraf');
sh = require('sh');
mathjs = require('mathjs');
movingAverage = require('moving-average');
densityClustering = require('density-clustering');
nodeKmeans = require('node-kmeans');
simpleKmeans = require('simple-kmeans');
grayscaleLib = require('./grayscale');
grayscaleMethods = process.argv[4];
grayscale = null;

// Select the algorithm of grayscale
switch (parseInt(grayscaleMethods)) {
case 0:
  grayscale = grayscaleLib.linearLuminance;
  break;
case 1:
  grayscale = grayscaleLib.intensity;
  break;
case 2:
  grayscale = grayscaleLib.gleam;
  break;
case 3:
  grayscale = grayscaleLib.luminance;
  break;
case 4:
  grayscale = grayscaleLib.luma;
  break;
case 5:
  grayscale = grayscaleLib.value;
  break;
case 6:
  grayscale = grayscaleLib.luster;
  break;
case 7:
  grayscale = grayscaleLib.lightness;
  break;
case 8:
  grayscale = grayscaleLib.luminaceGC;
  break;
case 9:
  grayscale = grayscaleLib.lightnessGC;
  break;
case 10:
  grayscale = grayscaleLib.valueGC;
  break;
case 11:
  grayscale = grayscaleLib.lusterGC;
}
app = {
  timeStamp: 0,
  events: [],
  filenames: {}
};
mov = process.argv[2];

// output directory
dir = mov.replace(/^[^\/]+\//, 'output/').replace(/\.(mov|MOV)$/i, "-" + grayscaleMethods + "/");
sh("avconv -i " + mov).err.result(function(it){
  var opt, that, pbOpt, cache, act, flow, i$, len$, step, lastPost;
  log('---------------New Video---------------');
  log("'" + 'Video name'.cyan + "': " + mov.replace(/^input\//, ''));
  app.lab = function(){
    return {
      name: replace$.call(mov, /.mov/, '').replace(/input\//, ''),
      state: {
        dbscan: opt.dbscan,
        initIndex: opt.initIndex,
        size: opt.size,
        frames: fs.readdirSync(dir + ("heart_" + opt.resizeRatio + "-frame")).length,
        fps: opt.fps,
        interval: {
          min: 0.4,
          max: 0.6
        },
        peakRange: 8,
        resizeRatio: opt.resizeRatio
      },
      result: {
        sampleSlidingTest: {
          tiltRate: {}
        },
        frequency: {
          meanOfFrequency: {},
          reciprocalOfMeanPeriod: {},
          totalPeak: {},
          middlePeak: {}
        },
        regionTest: {
          heartRegionRatio: {}
        }
      }
    };
  };
  opt = {
    labName: 'custom-init-kmeans-centroids/',
    force: {
      mask: true,
      kmeans: true,
      mark: true,
      combine: true,
      center: true
    },
    skip: {},
    list: ['raw', 'diffMean', 'fullHeart', 'halfHeart'],
    fps: (that = /, (\S+) fps,/.exec(it)) ? parseInt(that[1]) : void 8,
    size: (that = /, (\d+)x(\d+),/.exec(it)) ? {
      height: parseInt(that[2]),
      width: parseInt(that[1])
    } : void 8,
    duration: (that = /Duration: (\S+), /.exec(it)) ? that[1] : void 8,
    filterStage: ['raw', 'ma', 'hht'],
    frameLimit: 0,
    frameNameFormat: '%05d',
    markStyle: {
      fillStyle: '#e7534f'
    },
    quiet: true,
    stat: ['diff-mean'],
    dbscan: {
      eps: 30,
      minPoints: 200,
      threshold: process.argv[3] || 0.95
    },
    maskStage: 1,
    extrema: [],
    resizeRatio: 1
  };
  opt.resize = {
    width: opt.size.width / opt.resizeRatio,
    height: opt.size.height / opt.resizeRatio
  };
  app.filenames = {
    diffMean: "_diff-mean_threshold.png",
    fullHeart: "_mask_threshold_" + opt.dbscan.eps + "_" + opt.dbscan.minPoints + ".png",
    halfHeart: 'new-mask.png',
    diffMeanPosition: "diff-mean-position_" + opt.dbscan.threshold * 100,
    fullHeartPosition: "full-heart-position_" + opt.dbscan.eps + "_" + opt.dbscan.minPoints,
    halfHeartPosition: 'portion'
  };
  pbOpt = {
    length: 20,
    cur: 0,
    total: 0
  };
  cache = {};

/***** act *****/
  act = {};

  // convert .mov to .mp4
  act.mov2mp4 = function(step){
    var opt_;
    opt_ = opt.quiet ? '-v quiet' : '';
    return sh("avconv -i " + step.pre + " -an -c:v libx264 " + opt_ + " -y " + step.post).result(function(){
      return step.cb();
    });
  };

  // slice video to frame by frame
  act.frame = function(step){
    var _;
    mkdir(framePath('raw'));
    _ = opt.quiet ? '-v quiet' : '';

    // %05d up to ~30m
    return sh("avconv -i " + step.pre + " -f image2 " + _ + " -y " + framePath('raw') + opt.frameNameFormat + ".png").result(function(){
      return step.cb();
    });
  };

  // statistics
  act.stat = function(step){
    return loadFrame(framePath('raw'), opt.size, function(frames){
      var stat, i$, ref$, len$, i, j$, to$, j, ref1$, height, width, diff, k, frame, data, brightness, v;
      opt.frames = frames.length;
      stat = {};
      for (i$ = 0, len$ = (ref$ = opt.stat).length; i$ < len$; ++i$) {
        i = ref$[i$];
        stat[i] = [];
        for (j$ = 0, to$ = opt.size.height * opt.size.width; j$ < to$; ++j$) {
          j = j$;
          stat[i][j] = 0;
        }
      }
      ref1$ = [(ref$ = frames[0].canvas)['height'], ref$['width']], height = ref1$[0], width = ref1$[1];
      diff = [];
      for (i$ = 0, to$ = opt.size.height * opt.size.width; i$ < to$; ++i$) {
        i = i$;
        diff[i] = 0;
      }
      for (i$ = 0, len$ = frames.length; i$ < len$; ++i$) {
        k = i$;
        frame = frames[i$];
        data = frame.getImageData(0, 0, width, height).data;
        for (j$ = 0, to$ = data.length; j$ < to$; j$ += 4) {
          i = j$;
          brightness = grayscale(data[i], data[i + 1], data[i + 2]);
          j = i / 4;
          if (diff[j]) {
            diff[j] = Math.abs(brightness - diff[j]);
          }
          stat['diff-mean'][j] += diff[j];
          diff[j] = brightness;
        }
      }
      for (i$ = 0, to$ = frames.length; i$ < to$; ++i$) {
        j = i$;
        stat['diff-mean'][j] /= frames.length - 1;
      }
      for (k in stat) {
        v = stat[k];
        fs.writeFileSync(dir + opt.labName + k, JSON.stringify(v, null, 2));
      }
      step.cb();
    });
  };

  // statistics image
  act.statImage = function(step){
    var ctx, data, i$, ref$, len$, i, stat, ref1$, m, M, d, j$, to$, j;
    ctx = new canvas(opt.size.width, opt.size.height).getContext('2d');
    data = ctx.createImageData(opt.size.width, opt.size.height);
    for (i$ = 0, len$ = (ref$ = opt.stat).length; i$ < len$; ++i$) {
      i = ref$[i$];
      stat = JSON.parse(fs.readFileSync(dir + opt.labName + i));
      ref1$ = minmax(stat), m = ref1$[0], M = ref1$[1];
      d = M - m;
      for (j$ = 0, to$ = data.data.length; j$ < to$; j$ += 4) {
        j = j$;
        data.data[j] = data.data[j + 1] = data.data[j + 2] = (stat[j / 4] - m) / d * 255;
        data.data[j + 3] = 255;
      }
      saveImage(dir + i + '.png', data, opt.size);
    }
    return step.cb();
  };
  act.cluster = function(step){
    var dbscan, ref$, width, height, outputData, diffMean, ctx, inputData, data, cum, res$, i$, i, to$, brightness, e, len$, m, threshold, sum, b, points, clusters, len, x, min, max, maxCluster, index;
    dbscan = new densityClustering.DBSCAN();
    ref$ = [opt.resize.width, opt.resize.height], width = ref$[0], height = ref$[1];
    outputData = new canvas(width, height).getContext('2d').createImageData(width, height);
    diffMean = new canvas(width, height).getContext('2d').createImageData(width, height);
    ctx = imageOf(dir + "/diff-mean.png", opt.resize);
    inputData = ctx.getImageData(0, 0, width, height);
    data = inputData.data;
    res$ = [];
    for (i$ = 0; i$ <= 255; ++i$) {
      i = i$;
      res$.push(0);
    }
    cum = res$;
    for (i$ = 0, to$ = data.length; i$ < to$; i$ += 4) {
      i = i$;
      brightness = grayscale(data[i], data[i + 1], data[i + 2]);
      cum[Math.round(brightness)]++;
    }
    e = 0;
    for (i$ = 0, len$ = cum.length; i$ < len$; ++i$) {
      m = cum[i$];
      if (m) {
        e += m;
      }
    }
    threshold = sum = 0;
    for (i$ = 0, len$ = cum.length; i$ < len$; ++i$) {
      i = i$;
      b = cum[i$];
      if (sum > e * opt.dbscan.threshold) {
        threshold = i;
        break;
      }
      sum += b;
    }
    console.log('threshold:', threshold);
    points = data2xy(inputData, [width, height], threshold);
    clusters = dbscan.run(points, opt.dbscan.eps, opt.dbscan.minPoints); // eps, min-points test 50, 200 good 150, 300
    if (!clusters.length) {
      saveImage(dir + app.filenames.fullHeart, outputData, opt.resize);
      saveImage(dir + app.filenames.diffMean, diffMean, opt.resize);
      step.cb();
    }
    res$ = [];
    for (i$ = 0, len$ = clusters.length; i$ < len$; ++i$) {
      x = clusters[i$];
      res$.push(x.length);
    }
    len = res$;
    ref$ = minmax(len), min = ref$[0], max = ref$[1];
    maxCluster = clusters[len.indexOf(max)];
    for (i$ = 0, len$ = maxCluster.length; i$ < len$; ++i$) {
      i = maxCluster[i$];
      index = (points[i][1] * width + points[i][0]) * 4;
      outputData.data[index] = outputData.data[index + 1] = outputData.data[index + 2] = 100;
      outputData.data[index + 3] = 255;
    }
    for (i$ = 0, to$ = points.length; i$ < to$; ++i$) {
      i = i$;
      index = (points[i][1] * width + points[i][0]) * 4;
      diffMean.data[index] = diffMean.data[index + 1] = diffMean.data[index + 2] = 100;
      diffMean.data[index + 3] = 255;
    }
    saveImage(dir + app.filenames.fullHeart, outputData, opt.resize);
    saveImage(dir + app.filenames.diffMean, diffMean, opt.resize);
    return step.cb();
  };
  act.digitize = function(step){
    var ctx, inputData;
    ctx = imageOf(dir + "/" + app.filenames.fullHeart, opt.resize);
    inputData = ctx.getImageData(0, 0, opt.resize.width, opt.resize.height);
    saveJson(dir + opt.labName + app.filenames.fullHeartPosition, data2xy(inputData, [opt.resize.width, opt.resize.height], 0));
    ctx = imageOf(dir + "/" + app.filenames.diffMean, opt.resize);
    inputData = ctx.getImageData(0, 0, opt.resize.width, opt.resize.height);
    saveJson(dir + opt.labName + (app.filenames.diffMeanPosition + ""), data2xy(inputData, [opt.resize.width, opt.resize.height], 0));
    return step.cb();
  };
  act.mask = function(step){
    var ref$, width, height;
    mkdir(framePath("heart_" + opt.resizeRatio));
    ref$ = [opt.resize.width, opt.resize.height], width = ref$[0], height = ref$[1];
    return loadFrame(framePath('raw'), opt.resize, function(it){
      var heartPosition, i$, to$, i, outputData, grayscaleData, data, brightness, j$, to1$, index, len$, heartIndex, serial;
      heartPosition = (function(){
        switch (opt.maskStage) {
        case 1:
          return JSON.parse(fs.readFileSync(dir + (opt.labName + "" + app.filenames.fullHeartPosition)));
        case 2:
          return JSON.parse(fs.readFileSync(dir + (opt.labName + "" + app.filenames.halfHeartPosition)));
        }
      }());
      pbOpt.total = it.length;
      log('masking...');
      progress('start');

      // if i is 20 then break
      for (i$ = 0, to$ = it.length; i$ < to$; ++i$) {
        i = i$;
        progress('tick');
        outputData = new canvas(width, height).getContext('2d').createImageData(width, height);
        grayscaleData = new canvas(width, height).getContext('2d').createImageData(width, height);
        data = it[i].getImageData(0, 0, it[i].canvas.width, it[i].canvas.height).data;
        brightness = 0;
        for (j$ = 0, to1$ = data.length; j$ < to1$; j$ += 4) {
          index = j$;
          brightness = grayscale(data[index], data[index + 1], data[index + 2]);
          grayscaleData.data[index] = brightness;
          grayscaleData.data[index + 1] = brightness;
          grayscaleData.data[index + 2] = brightness;
          grayscaleData.data[index + 3] = 255;
        }
        for (j$ = 0, len$ = heartPosition.length; j$ < len$; ++j$) {
          heartIndex = heartPosition[j$];
          index = parseInt(heartIndex[1] * width + parseInt(heartIndex[0])) * 4;
          brightness = grayscale(data[index], data[index + 1], data[index + 2]);
          outputData.data[index] = outputData.data[index + 1] = outputData.data[index + 2] = brightness;
          outputData.data[index + 3] = 255;
        }
        serial = ('0000' + i).substr(-5);
        saveImage(framePath("heart_" + opt.resizeRatio) + "" + serial + ".png", outputData, opt.resize);
        mkdir(framePath('grayscale'));
        saveImage(framePath('grayscale') + "" + serial + ".png", grayscaleData, opt.size);
      }
      sh("avconv -r " + opt.fps + " -i " + framePath('grayscale') + opt.frameNameFormat + ".png -c:v libx264 -y " + dir + "grayscale.mp4").result(function(){
        return sh("avconv -r " + opt.fps + " -i " + framePath("heart_" + opt.resizeRatio) + opt.frameNameFormat + ".png -c:v libx264 -y " + dir + "bin_" + opt.maskStage + ".mp4").result(function(){
          opt.maskStage = 2;
          progress('end');
          return step.cb();
        });
      });
    });
  };
  act.center = function(step){
    var ref$, width, height, center, limit;
    ref$ = [opt.size.width, opt.size.height], width = ref$[0], height = ref$[1];
    center = [];
    limit = 60; // maximum frame
    return loadFrame(framePath("heart_" + opt.resizeRatio), opt.size, function(it){
      var i$, to$, i, data, xIndex, yIndex, total, j$, to1$, j;
      pbOpt.total = it.length - 1;
      progress('start');
      for (i$ = 0, to$ = it.length; i$ < to$; ++i$) {
        i = i$;
        progress('tick');
        if (i === it.length - 1) {
          progress('end');
          fs.writeFileSync(dir + (opt.labName + "center"), JSON.stringify(center, null, 2));
          break;
        }
        data = it[i].getImageData(0, 0, width, height).data;
        xIndex = yIndex = total = 0;
        for (j$ = 0, to1$ = data.length; j$ < to1$; j$ += 4) {
          j = j$;
          xIndex += data[j] * ((j / 4) % width);
          yIndex += data[j] * Math.floor((j / 4) / width);
          total += data[j];
        }
        xIndex /= total;
        yIndex /= total;
        center.push([xIndex, yIndex]);
      }
      step.cb();
    });
  };
  act.kmeans = function(step){
    var center, res$, i$, len$, x, ctx, initIndex;
    if (!fs.existsSync(dir + opt.labName + 'center')) {
      return step.cb();
    } else {
      center = readJson(dir + opt.labName + 'center');
      res$ = [];
      for (i$ = 0, len$ = center.length; i$ < len$; ++i$) {
        x = center[i$];
        if (x[0] !== null) {
          res$.push(x);
        }
      }
      center = res$;
      ctx = imageOf(dir + "/diff-mean.png", opt.size);
      initIndex = getInitIndex(center);
      opt.initIndex = initIndex;
      return nodeKmeans.clusterize(center, {
        k: 2,
        initIndexes: initIndex
      }, function(err, res){
        var i$, ref$, len$, c, centroid, res$;
        console.log(res[0].centroid, res[1].centroid);

        // visualization
        for (i$ = 0, len$ = (ref$ = res[0].cluster).length; i$ < len$; ++i$) {
          c = ref$[i$];
          ctx.beginPath();
          ctx.arc(parseFloat(c[0]), parseFloat(c[1]), 1, 0, 2 * Math.PI, false);
          ctx.fillStyle = 'green';
          ctx.closePath();
          ctx.fill();
        }
        for (i$ = 0, len$ = (ref$ = res[1].cluster).length; i$ < len$; ++i$) {
          c = ref$[i$];
          ctx.beginPath();
          ctx.arc(parseFloat(c[0]), parseFloat(c[1]), 1, 0, 2 * Math.PI, false);
          ctx.fillStyle = 'red';
          ctx.closePath();
          ctx.fill();
        }
        res$ = [];
        for (i$ = 0, len$ = res.length; i$ < len$; ++i$) {
          c = res[i$];
          res$.push(c.centroid);
        }
        centroid = res$;
        saveJson(dir + opt.labName + 'centroid', centroid);
        saveImage(dir + opt.labName + 'centroid.png', ctx.getImageData(0, 0, opt.size.width, opt.size.height), opt.size);
        return step.cb();
      });
    }
  };
  act.divide = function(step){
    var heartPosition, centroid, res$, i$, len$, p, segment, point, ref$, width, height, outputData, heartIndex, index;
    if (!fs.existsSync(dir + opt.labName + 'centroid')) {
      return step.cb();
    } else {
      heartPosition = readJson(dir + opt.labName + (app.filenames.fullHeartPosition + ""));
      centroid = readJson(dir + opt.labName + 'centroid');
      res$ = [];
      for (i$ = 0, len$ = centroid.length; i$ < len$; ++i$) {
        p = centroid[i$];
        res$.push([p[0] / opt.resizeRatio, p[1] / opt.resizeRatio]);
      }
      centroid = res$;
      res$ = [];
      for (i$ = 0, len$ = heartPosition.length; i$ < len$; ++i$) {
        point = heartPosition[i$];
        if (distance(point, centroid[0]) > distance(point, centroid[1])) {
          res$.push(point);
        }
      }
      segment = res$;
      saveJson(dir + opt.labName + app.filenames.halfHeartPosition, segment);
      ref$ = [opt.size.width, opt.size.height], width = ref$[0], height = ref$[1];
      outputData = new canvas(width, height).getContext('2d').createImageData(width, height);
      for (i$ = 0, len$ = segment.length; i$ < len$; ++i$) {
        heartIndex = segment[i$];
        index = parseInt(heartIndex[1] * width + parseInt(heartIndex[0])) * 4;
        outputData.data[index] = outputData.data[index + 1] = outputData.data[index + 2] = 100;
        outputData.data[index + 3] = 255;
      }
      saveImage(dir + (opt.labName + "" + app.filenames.halfHeart), outputData, opt.size);
      return step.cb();
    }
  };

  // calculate brightness frame by frame
  act.profile = function(step){
    var ref$, width, height, profile, diffMeanPosition, fullHeartPosition, halfHeartPosition;
    ref$ = [opt.resize.width, opt.resize.height], width = ref$[0], height = ref$[1];
    profile = {};
    diffMeanPosition = JSON.parse(fs.readFileSync(dir + (opt.labName + "" + app.filenames.diffMeanPosition)));
    fullHeartPosition = JSON.parse(fs.readFileSync(dir + (opt.labName + "" + app.filenames.fullHeartPosition)));
    halfHeartPosition = JSON.parse(fs.readFileSync(dir + (opt.labName + "" + app.filenames.halfHeartPosition)));
    return loadFrame(framePath('raw'), opt.resize, function(it){
      var i$, ref$, len$, l, frame, data, rSum, gSum, bSum, j$, len1$, heartIndex, index, to$;
      pbOpt.total = it.length;
      progress('start');
      for (i$ = 0, len$ = (ref$ = opt.list).length; i$ < len$; ++i$) {
        l = ref$[i$];
        profile[l] = [];
      }
      for (i$ = 0, len$ = it.length; i$ < len$; ++i$) {
        frame = it[i$];
        progress('tick');
        data = frame.getImageData(0, 0, frame.canvas.width, frame.canvas.height).data;
        ref$ = [0, 0, 0], rSum = ref$[0], gSum = ref$[1], bSum = ref$[2];
        for (j$ = 0, len1$ = (ref$ = diffMeanPosition).length; j$ < len1$; ++j$) {
          heartIndex = ref$[j$];
          index = parseInt(heartIndex[1] * width + parseInt(heartIndex[0])) * 4;
          rSum += data[index];
          gSum += data[index + 1];
          bSum += data[index + 2];
        }
        profile['diffMean'].push(grayscale(rSum, gSum, bSum));
        ref$ = [0, 0, 0], rSum = ref$[0], gSum = ref$[1], bSum = ref$[2];
        for (j$ = 0, len1$ = (ref$ = fullHeartPosition).length; j$ < len1$; ++j$) {
          heartIndex = ref$[j$];
          index = parseInt(heartIndex[1] * width + parseInt(heartIndex[0])) * 4;
          rSum += data[index];
          gSum += data[index + 1];
          bSum += data[index + 2];
        }
        profile['fullHeart'].push(grayscale(rSum, gSum, bSum));
        ref$ = [0, 0, 0], rSum = ref$[0], gSum = ref$[1], bSum = ref$[2];
        for (j$ = 0, to$ = data.length; j$ < to$; j$ += 4) {
          index = j$;
          rSum += data[index];
          gSum += data[index + 1];
          bSum += data[index + 2];
        }
        profile['raw'].push(grayscale(rSum, gSum, bSum));
        ref$ = [0, 0, 0], rSum = ref$[0], gSum = ref$[1], bSum = ref$[2];
        for (j$ = 0, len1$ = (ref$ = halfHeartPosition).length; j$ < len1$; ++j$) {
          heartIndex = ref$[j$];
          index = parseInt(heartIndex[1] * width + parseInt(heartIndex[0])) * 4;
          rSum += data[index];
          gSum += data[index + 1];
          bSum += data[index + 2];
        }
        profile['halfHeart'].push(grayscale(rSum, gSum, bSum));
      }
      for (i$ = 0, len$ = (ref$ = opt.list).length; i$ < len$; ++i$) {
        l = ref$[i$];
        fs.writeFileSync(dir + opt.labName + l + 'Profile', JSON.stringify(profile[l], null, 2));
        fs.writeFileSync(dir + opt.labName + l + 'Average', JSON.stringify(movAv(profile[l]), null, 2));
      }
      progress('end');
      step.cb();
    });
  };

  // calculate envelope curve
  act.envelope = function(step){
    var o, i$, ref$, len$, l;
    o = {};
    for (i$ = 0, len$ = (ref$ = opt.list).length; i$ < len$; ++i$) {
      l = ref$[i$];
      hht(JSON.parse(fs.readFileSync(dir + opt.labName + l + 'Average')), l);
    }
    return step.cb();
  };

/***** labs *****/

  act.lab = function(step){
    app.lab = app.lab();
    frequencyCalculation();
    heartRegionTest();
    saveJson(dir + opt.labName + 'result.json', app.lab);
    return step.cb();
  };

/***** for demo only *****/

  // combine marked images to mp4 file
  act.combine = function(step){
    if (!fs.existsSync(dir + opt.labName + 'center')) {
      step.cb();
    }
    return saveVideo('marked', step.post, step.cb);
  };

  // mark images
  act.mark = function(step){
    var center;
    if (!fs.existsSync(dir + opt.labName + 'center')) {
      step.cb();
    }
    center = JSON.parse(fs.readFileSync(dir + opt.labName + 'center'));
    return loadFrame(framePath('raw'), opt.resize, function(it){
      var factor;
      factor = opt.resize.width / opt.size.width;
      mkdir(framePath('marked'));
      async.eachSeries((function(){
        var i$, to$, results$ = [];
        for (i$ = 0, to$ = it.length - 1; i$ < to$; ++i$) {
          results$.push(i$);
        }
        return results$;
      }()), function(i, cb){
        console.log(i + "/" + (it.length - 1));
        if (!center[i]) {
          cb();
        }
        it[i].beginPath();
        it[i].arc(parseFloat(center[i][0]) * factor, parseFloat(center[i][1]) * factor, 3, 0, 2 * Math.PI, false);
        it[i].fillStyle = 'black';
        it[i].fill();
        fs.writeFileSync(framePath('marked', i), new Buffer(replace$.call(it[i].canvas.toDataURL(), /^data:image\/\w+;base64,/, ''), 'base64'));
        return cb();
      }, function(it){
        if (it) {
          throw it;
        }
        return step.cb();
      });
    });
  };


/***** flows *****/
  flow = [

    // preparing
    {
      act: 'mov2mp4',
      pre: mov,
      post: (replace$.call(dir, /\/\d\d\//, '')) + '/raw.mp4'
    }, {
      act: 'frame',
      pre: mov,
      post: framePath('raw', 1)
    }, {
      act: 'stat',
      pre: framePath('raw', 1),
      post: dir + opt.labName + 'diff-mean'
    }, {
      act: 'statImage',
      post: dir + 'diff-mean.png'
      },

      // get mask
      {
      act: 'cluster',
      pre: dir + 'diff-mean.png',
      post: dir + app.filenames.fullHeart
    }, {
      act: 'digitize',
      pre: dir + app.filenames.fullHeart,
      post: dir + opt.labName + app.filenames.fullHeartPosition
    }, {
      act: 'mask',
      pre: dir + opt.labName + app.filenames.fullHeartPosition,
      post: framePath("heart_" + opt.resizeRatio, 1)
    }, {
      act: 'center',
      pre: framePath("heart_" + opt.resizeRatio, 1),
      post: dir + opt.labName + 'center'
    }, {
      act: 'kmeans',
      pre: dir + opt.labName + 'center',
      post: dir + opt.labName + 'centroid.png'
    }, {
      act: 'divide',
      pre: dir + opt.labName + 'centroid'
    }, {
      act: 'mask',
      pre: dir + opt.labName + app.filenames.halfHeartPosition,
      post: framePath("heart_" + opt.resizeRatio, 1)
    },

      // get peak
    {
      act: 'profile',
      post: dir + opt.labName + 'halfHeartProfile'
    }, {
      act: 'envelope',
      pre: dir + 'profile',
      post: dir + 'envelope'
    },

      // lab
    {
      act: 'lab'
    },

    // optional steps
    {
      act: 'mark',
      post: framePath('marked', 1)
    }, {
      act: 'combine',
      post: dir + 'marked.mp4'
    }
  ];
  for (i$ = 0, len$ = flow.length; i$ < len$; ++i$) {
    step = flow[i$];
    app.events.push({
      name: step.act,
      status: ''
    });
  }
  mkdir(dir);
  dir += opt.dbscan.threshold * 100 + "/";
  mkdir(dir);
  mkdir(dir + opt.labName);
  opt.maskStage = 1;
  lastPost = null;
  async.eachSeries(flow, function(step, cb){
    step.pre == null && (step.pre = lastPost);
    lastPost = step.post;
    if (skippable(step)) {
      log("'" + step.act + "' skipped");
      return cb();
    }
    step.cb = function(){
      log("'" + step.act + "' finished", 1);
      return cb();
    };
    log("'" + step.act + "' starts processing...");
    return act[step.act](step);
  }, function(it){
    if (it) {
      throw it;
    }
    opt.maskStage = 1;
    fs.writeFileSync(dir + "/info", JSON.stringify(opt, null, 2));
    log('Finished'.bgMagenta + ' ' + dir.underline.yellow);
    return process.exit(0);
  });

/***** utility *****/

  function envelope(it){
    var dist, c, e, i$, to$, i, ref$, ref1$, iB, iT, b, t;
    dist = [1, 2, 3, 4, 5, 6];
    c = it.m;
    e = {
      _b: [],
      _t: [],
      b: [],
      d: [],
      done: false,
      m: [],
      t: []
    };
    for (i$ = 1, to$ = c.length - 1; i$ < to$; ++i$) {
      i = i$;
      if (isTrough(c, i, dist)) {
        e.b.push([i + 1, c[i]]);
      }
      if (isPeak(c, i, dist)) {
        e.t.push([i + 1, c[i]]);
      }
    }
    if (c[0] < c[1]) {
      [(ref$ = e.b.push)[0], ref$[c[0]]];
      e.t.unshift([0, e.t[0][1]]);
    } else {
      e.b.unshift([0, e.b[0][1]]);
      e.t.push([0, c[0]]);
    }
    if (c[c.length - 1] < c[c.length - 2]) {
      e.b.push([c.length - 1, c[c.length - 1]]);
      e.t.push([c.length - 1, (ref1$ = e.t)[ref1$.length - 1][1]]);
    } else {
      e.b.push([c.length - 1, (ref1$ = e.b)[ref1$.length - 1][1]]);
      e.t.push([c.length - 1, c[c.length - 1]]);
    }
    ref1$ = [0, 0], iB = ref1$[0], iT = ref1$[1];

    // calculate the value of y of each e.t and e.b linearly
    for (i$ = 0, to$ = c.length; i$ < to$; ++i$) {
      i = i$;
      b = (fn$());
      t = (fn1$());
      e._b.push(b);
      e._t.push(t);
      e.m.push((b + t) / 2);
      e.d[i] = c[i] - e.m[i];
    }
    return e;
    function fn$(){
      switch (false) {
      case i !== e.b[iB][0]:
        return e.b[iB][1];
      case i !== e.b[iB + 1][0]:
        return e.b[++iB][1];
      default:
        return (i - e.b[iB][0]) / (e.b[iB + 1][0] - e.b[iB][0]) * (e.b[iB + 1][1] - e.b[iB][1]) + e.b[iB][1];
      }
    }
    function fn1$(){
      switch (false) {
      case i !== e.t[iT][0]:
        return e.t[iT][1];
      case i !== e.t[iT + 1][0]:
        return e.t[++iT][1];
      default:
        return (i - e.t[iT][0]) / (e.t[iT + 1][0] - e.t[iT][0]) * (e.t[iT + 1][1] - e.t[iT][1]) + e.t[iT][1];
      }
    }
  }
  function framePath(name, i){
    var _dir;
    _dir = dir;
    if (name === 'raw') {
      _dir = replace$.call(_dir, /\/(80|90|95|96|97|98|99)\//, '');
    }
    if (i > -1) {
      return _dir + "/" + name + "-frame/" + ('0000' + i).substr(-5) + ".png";
    }
    return _dir + "/" + name + "-frame/";
  }

/***** lab *****/

  function heartRegionTest(){
    var name, ref$, heart, total, avg, tmp, met, halfRatio, manualRatio, i$, len$, t, img, ctx, data, j$, to$, i, newManual, newHalf, heartIndexInManual, halfIndexInManual, hit;
    name = app.lab.name;
    ref$ = [0, 0, 0], heart = ref$[0], total = ref$[1], avg = ref$[2];
    tmp = {
      diffMean: new canvas.Image,
      manual: new canvas.Image,
      full: new canvas.Image,
      half: new canvas.Image
    };
    ref$ = [0, 0], heart = ref$[0], met = ref$[1];
    if (!fs.existsSync("manual_heart/" + name + ".png")) {
      return;
    }
    tmp.diffMean.src = fs.readFileSync(dir + "/" + app.filenames.diffMean);
    tmp.full.src = fs.readFileSync(dir + "/" + app.filenames.fullHeart);
    tmp.half.src = fs.readFileSync(dir + "/" + opt.labName + app.filenames.halfHeart);
    tmp.manual.src = fs.readFileSync("manual_heart/" + name + ".png");
    halfRatio = (tmp.full.width / tmp.full.height) / (tmp.half.width / tmp.half.height);
    manualRatio = (tmp.full.width / tmp.full.height) / (tmp.manual.width / tmp.manual.height);
    for (i$ = 0, len$ = (ref$ = ['diffMean', 'manual', 'full', 'half']).length; i$ < len$; ++i$) {
      t = ref$[i$];
      heart = 0;
      img = tmp[t];
      ctx = new canvas(img.width, img.height).getContext('2d');
      ctx.drawImage(img, 0, 0);
      data = tmp[t + "-data"] = ctx.getImageData(0, 0, img.width, img.height).data;
      for (j$ = 3, to$ = data.length; j$ < to$; j$ += 4) {
        i = j$;
        if (data[i] > 0) {
          heart++;
        }
      }
      tmp[t + "-heart-size"] = heart;
      if (t === 'half') {
        heart *= halfRatio;
      }
      if (t === 'manual') {
        heart *= manualRatio;
      }
      app.lab.result.regionTest.heartRegionRatio[t] = round(heart / (data.length / 4), 3);
    }

    // convert test
    // resize manual size to full size
    newManual = new canvas(tmp.full.width, tmp.full.height).getContext('2d');
    newManual.drawImage(tmp.manual, 0, 0, tmp.manual.width, tmp.manual.height, 0, 0, tmp.full.width, tmp.full.height);
    tmp['manual-data'] = newManual.getImageData(0, 0, tmp.full.width, tmp.full.height).data;
    newHalf = new canvas(tmp.half.width, tmp.half.height).getContext('2d');
    newHalf.drawImage(tmp.half, 0, 0, tmp.half.width, tmp.half.height, 0, 0, tmp.full.width, tmp.full.height);
    tmp['half-data'] = newHalf.getImageData(0, 0, tmp.full.width, tmp.full.height).data;
    ref$ = [[], [], 0], heartIndexInManual = ref$[0], halfIndexInManual = ref$[1], hit = ref$[2];
    for (i$ = 3, to$ = tmp['manual-data'].length; i$ < to$; ++i$) {
      i = i$;
      if (tmp['manual-data'][i]) {
        heartIndexInManual.push(i);
      }
    }
    for (i$ = 0, len$ = heartIndexInManual.length; i$ < len$; ++i$) {
      i = heartIndexInManual[i$];
      if (tmp['full-data'][i]) {
        hit++;
      }
    }
    app.lab.result.regionTest.fullInManualRate = round(hit / tmp['full-heart-size'], 3);
    hit = 0;
    for (i$ = 3, to$ = tmp['manual-data'].length; i$ < to$; ++i$) {
      i = i$;
      if (tmp['manual-data'][i]) {
        halfIndexInManual.push(i);
      }
    }
    for (i$ = 0, len$ = halfIndexInManual.length; i$ < len$; ++i$) {
      i = halfIndexInManual[i$];
      if (tmp['half-data'][i]) {
        hit++;
      }
    }
    app.lab.result.regionTest.halfInManual = hit;
    app.lab.result.regionTest.halfHeartSize = tmp['half-heart-size'];
    app.lab.result.regionTest.fullHeartSize = tmp['full-heart-size'];
    app.lab.result.regionTest.manualSize = tmp['manual-heart-size'];
    return app.lab.result.regionTest.diffMeanSize = tmp['diffMean-heart-size'];
  }
  function frequencyCalculation(){

    // state
    var shortVideo, halfFrames, range, res$, i$, to$, ridx$, ref$, start, end, ref1$, len$, s, j$, len1$, l, fn, data, peak, trough, middlePeak, k$, len2$, peakIndex;
    shortVideo = app.lab.state.frames / app.lab.state.fps < 15;
    halfFrames = app.lab.state.frames / 2;
    res$ = [];
    for (i$ = 1, to$ = app.lab.state.peakRange; i$ <= to$; ++i$) {
      ridx$ = i$;
      res$.push(ridx$);
    }
    range = res$;
    ref$ = shortVideo
      ? [Math.round(halfFrames - app.lab.state.fps * 1.5), Math.round(halfFrames + app.lab.state.fps * 1.5)]
      : [Math.round(app.lab.state.frames * app.lab.state.interval.min), Math.round(app.lab.state.frames * app.lab.state.interval.max)], start = ref$[0], end = ref$[1];
    ref1$ = {
      start: start,
      end: end
    }, (ref$ = app.lab.state.interval).start = ref1$.start, ref$.end = ref1$.end;

    // result
    for (i$ = 0, len$ = (ref$ = opt.filterStage).length; i$ < len$; ++i$) {
      s = ref$[i$];
      app.lab.result.frequency.meanOfFrequency[s] = {};
      app.lab.result.frequency.reciprocalOfMeanPeriod[s] = {};
      app.lab.result.frequency.totalPeak[s] = {};
      app.lab.result.frequency.middlePeak[s] = {};
      app.lab.result.sampleSlidingTest.tiltRate[s] = {};
      for (j$ = 0, len1$ = (ref1$ = opt.list).length; j$ < len1$; ++j$) {
        l = ref1$[j$];
        fn = (fn$());
        data = normalize(readJson(fn).toVector().ema(10));
        peak = detect('peak', range, data);
        trough = detect('trough', range, data);
        res$ = [];
        for (k$ = 0, len2$ = peak.length; k$ < len2$; ++k$) {
          peakIndex = peak[k$];
          if (start < peakIndex && peakIndex < end) {
            res$.push(peakIndex);
          }
        }
        middlePeak = res$;
        if (middlePeak.length < 2) {
          middlePeak = peak;
        }
        app.lab.result.sampleSlidingTest.tiltRate[s][l] = tiltRate(data, peak, trough);
        app.lab.result.frequency.meanOfFrequency[s][l] = round(getFreq(middlePeak), 3);
        app.lab.result.frequency.reciprocalOfMeanPeriod[s][l] = round(getFreq(middlePeak, true), 3);
        app.lab.result.frequency.middlePeak[s][l] = {
          method: middlePeak.length
        };
        app.lab.result.frequency.totalPeak[s][l] = {
          method: peak.length
        };
      }
    }
    return app.lab;
    function fn$(){
      switch (s) {
      case 'raw':
        return dir + opt.labName + l + 'Profile';
      case 'ma':
        return dir + opt.labName + l + 'Average';
      case 'hht':
        return dir + opt.labName + 'translated' + l + 'Average';
      }
    }
  }
  function getFreq(peak, reciprocalOfMeanPeriod){
    var fps, avg, i$, to$, i;
    fps = parseFloat(opt.fps);
    if (reciprocalOfMeanPeriod) {
      return (peak.length - 1) * fps / (peak[peak.length - 1] - peak[0]);
    } else {
      avg = 0;
      for (i$ = 1, to$ = peak.length; i$ < to$; ++i$) {
        i = i$;
        avg += fps / (peak[i] - peak[i - 1]);
      }
      return avg /= peak.length - 1;
    }
  }
  function detect(target, dist, average){
    var peaks, i$, to$, i, intervalMean;
    peaks = [];
    for (i$ = 0, to$ = average.length; i$ < to$; ++i$) {
      i = i$;
      if (target === 'peak' && isPeak(average, i, dist)) {
        peaks.push(i);
      }
      if (target === 'trough' && isTrough(average, i, dist)) {
        peaks.push(i);
      }
    }
    intervalMean = 0;
    for (i$ = 1, to$ = peaks.length; i$ < to$; ++i$) {
      i = i$;
      intervalMean += peaks[i] - peaks[i - 1];
    }
    intervalMean /= peaks.length - 1;
    peaks.shift();
    return peaks;
  }
  function normalize(it){
    var average, i$, len$, x, results$ = [];
    average = 0;
    for (i$ = 0, len$ = it.length; i$ < len$; ++i$) {
      x = it[i$];
      average += x;
    }
    average /= it.length;
    for (i$ = 0, len$ = it.length; i$ < len$; ++i$) {
      x = it[i$];
      results$.push(x - average);
    }
    return results$;
  }
  function tiltRate(data, peak, trough){
    var offset, avg, i$, to$, i, ref$, p, t1, t2, d1, d2, h1, h2;
    offset = -1;
    avg = [];
    for (i$ = 1, to$ = trough.length; i$ < to$; ++i$) {

      // if wrong sequence
      i = i$;
      if (!(trough[i - 1] < (ref$ = peak[i + offset]) && ref$ < trough[i])) {

        // if peak appear first
        if (peak[i + offset] < trough[i - 1]) {
          offset++;

          // if trough appear first
        } else if (peak[i + offset] > trough[i]) {
          offset--;
          continue;
        }
      } else if (trough[i - 1] < (ref$ = peak[i + offset]) && ref$ < (ref$ = peak[i + offset + 1]) && ref$ < trough[i]) {
        continue;
      }
      p = data[peak[i + offset]];
      t1 = data[trough[i - 1]];
      t2 = data[trough[i]];
      d1 = Math.abs(p - t1);
      d2 = Math.abs(p - t2);
      h1 = d1 > d2 ? d1 : d2;
      h2 = (ref$ = d1 < d2 ? d1 : d2) > 0 ? ref$ : 0;
      avg.push(h2 / h1);
    }
    round(mathjs.median(avg), 3);
    return round(mathjs.mean(avg), 3);
  }
  function loadFrame(dir, size, cb){
    var name, that;
    name = (that = /\w*\/\w*\/(\w*)-frame\//.exec(dir)) ? that[1] : void 8;
    name += size.width;
    if (!cache[name + ""]) {
      cache[name + ""] = [];
    }
    if (cache[name + ""].length) {
      return cb(cache[name + ""]);
    }
    fs.readdir(dir, function(err, filenames){
      var n, i$, len$, fn;
      if (err) {
        throw err;
      }
      n = 0;
      log('Loading frame...');
      pbOpt.total = filenames.length;
      progress('start');
      for (i$ = 0, len$ = filenames.length; i$ < len$; ++i$) {
        fn = filenames[i$];
        progress('tick');
        if (opt.frameLimit && ++n > opt.frameLimit) {
          break;
        }
        cache[name + ""].push(imageOf(dir + "/" + fn, size));
      }
      progress('end');
      cb(cache[name + ""]);
    });
  }

/***** process bar (pb) *****/
  function log(text, mode, progress){
    var time, timeInterval;
    time = new Date().toString().split(' ')[4];
    timeInterval = new Date() - app.timeStamp;
    if (mode) {
      switch (mode) {
      case 1:
        console.log("[" + time + "] " + text + " after " + timeInterval / 1000 + " sec");
        break;
      case 2:
        console.log("[" + time + "]   =>" + text);
      }
    } else {
      console.log("[" + time + "] " + text);
    }
    app.timeStamp = new Date();
  }
  function progress(it){
    var time, bar;
    time = new Date().toString().split(' ')[4].gray;
    bar = render(pbOpt.length, pbOpt.length * (pbOpt.cur / pbOpt.total));
    if (it) {
      switch (it) {
      case 'start':
        return process.stdout.write("[" + time + "] |" + bar + "| " + Math.round(100 * (pbOpt.cur / pbOpt.total)) + "%\r");
      case 'tick':
        process.stdout.write("[" + time + "] |" + bar + "| " + Math.round(100 * (pbOpt.cur / pbOpt.total)) + "%\r");
        return pbOpt.cur++;
      case 'end':
        console.log();
        return pbOpt.cur = 0;
      }
    }
  }
  function render(len, fin){
    var _, i$, i;
    _ = [];
    for (i$ = 0; i$ < len; ++i$) {
      i = i$;
      if (i < fin) {
        _.push('>'.green);
      } else {
        _.push('_'.red);
      }
    }
    return _.join('');
  }
  // pd end

  function minmax(it){
    var m, M, i$, len$, v;
    m = M = it[0];
    for (i$ = 0, len$ = it.length; i$ < len$; ++i$) {
      v = it[i$];
      m <= v || (m = v);
    }
    for (i$ = 0, len$ = it.length; i$ < len$; ++i$) {
      v = it[i$];
      M >= v || (M = v);
    }
    return [m, M];
  }
  function mkdir(it){
    if (!fs.existsSync(it)) {
      console.log(it);
      fs.mkdirSync(it);
    } else if (!fs.statSync(it).isDirectory) {
      console.log(it);
      rimraf.sync(it); // maybe no need to use rimraf
      fs.mkdirSync(it);
    }
  }
  function saveJson(fn, obj){
    fs.writeFileSync(fn, JSON.stringify(obj, null, 2));
  }
  function readJson(fn){
    return JSON.parse(fs.readFileSync(fn));
  }
  function data2xy(data, size, threshold){
    var i$, to$, i, results$ = [];
    for (i$ = 0, to$ = data.data.length; i$ < to$; i$ += 4) {
      i = i$;
      if (data.data[i] && data.data[i] > threshold) {

        // index mapping
        results$.push([(i / 4) % size[0], Math.floor((i / 4) / size[0])]);
      }
    }
    return results$;
  }
  function getImgData(imgPath, size){
    var ctx;
    ctx = imageOf(imgPath, size);
    return ctx.getImageData(0, 0, size.width, size.height);
  }
  function isPeak(arr, i, dist){
    var result, i$, len$, d, ref$;
    result = true;
    for (i$ = 0, len$ = dist.length; i$ < len$; ++i$) {
      d = dist[i$];
      if (arr[i - d] && arr[i + d]) {
        if (!(arr[i - d] < (ref$ = arr[i]) && ref$ > arr[i + d])) {
          result = false;
        }
      }
    }
    return result;
  }
  function isTrough(arr, i, dist){
    var result, i$, len$, d, ref$;
    result = true;
    for (i$ = 0, len$ = dist.length; i$ < len$; ++i$) {
      d = dist[i$];
      if (arr[i - d] && arr[i + d]) {
        if (!(arr[i - d] > (ref$ = arr[i]) && ref$ < arr[i + d])) {
          result = false;
        }
      }
    }
    return result;
  }
  function saveImage(fn, data, size){
    var ctx;
    ctx = new canvas(size.width, size.height).getContext('2d');
    ctx.putImageData(data, 0, 0);
    fs.writeFileSync(fn, new Buffer(replace$.call(ctx.canvas.toDataURL(), /^data:image\/\w+;base64,/, ''), 'base64'));
  }
  function imageOf(fn, size){
    var img, ctx;
    img = new canvas.Image;
    img.src = fs.readFileSync(fn);
    ctx = new canvas(size.width, size.height).getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size.width, size.height);
    return ctx;
  }
  function distance(a, b){
    var ref$, x1, x2, y1, y2;
    ref$ = [parseFloat(a[0]), parseFloat(b[0]), parseFloat(a[1]), parseFloat(b[1])], x1 = ref$[0], x2 = ref$[1], y1 = ref$[2], y2 = ref$[3];
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }
  function movAv(it){
    var ma, i$, to$, i, results$ = [];
    ma = movingAverage(it.length);
    for (i$ = 0, to$ = it.length; i$ < to$; ++i$) {
      i = i$;
      ma.push(i, it[i]);
      results$.push(ma.movingAverage());
    }
    return results$;
  }
  function hht(profile, mask){
    var e, i$, to$, i;
    e = envelope({
      m: profile
    });
    for (i$ = 0, to$ = profile.length; i$ < to$; ++i$) {
      i = i$;
      profile[i] = e.m[i];
    }
    saveJson(dir + "" + opt.labName + "translated" + mask + "Average", e.d);
    saveJson(dir + "" + opt.labName + mask + "-lower", e.b);
    saveJson(dir + "" + opt.labName + mask + "-upper", e.t);
    saveJson(dir + "" + opt.labName + mask + "-lower-continuous", e._b);
    saveJson(dir + "" + opt.labName + mask + "-upper-continuous", e._t);
    saveJson(dir + "" + opt.labName + mask + "-mean", e.m);
    return e.m.unshift(null);
  }
  function skippable(it){
    if (opt.force[it.act]) {
      return 0;
    }
    if (opt.skip[it.act]) {
      return 1;
    }
    if (!it.post) {
      return 0;
    }
    if (!fs.existsSync(it.post)) {
      return 0;
    }
    return 1;
  }
  function round(value, length){
    return Math.round(value * Math.pow(10, length)) / Math.pow(10, length);
  }
  function getInitIndex(it){
    var left, right, x, res$, i$, len$, i, ref$, m, M, v;
    left = right = 0;
    res$ = [];
    for (i$ = 0, len$ = it.length; i$ < len$; ++i$) {
      i = it[i$];
      res$.push(i[0]);
    }
    x = res$;
    ref$ = minmax(x), m = ref$[0], M = ref$[1];
    for (i$ = 0, len$ = it.length; i$ < len$; ++i$) {
      i = i$;
      v = it[i$];
      if (v[0] === m) {
        left = i;
      }
      if (v[0] === M) {
        right = i;
      }
    }
    if (left === right) {
      right = it[right + 1]
        ? right + 1
        : right - 1;
    }
    return [left, right];
  }
  function saveVideo(name, dst, cb){
    var opt_;
    opt_ = opt.quiet ? '-v quiet' : '';
    sh("avconv -r " + opt.fps + " -i " + framePath(name) + opt.frameNameFormat + ".png -c:v libx264 " + opt_ + " -y " + dst).result(function(it){
      console.log(it);
      return cb();
    });
  }
  return saveVideo;
});
