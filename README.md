# HoloAssistViewer: A simple tool for visualizing the labels of Dataset

Original Dataset Source: https://holoassist.github.io/

Released under: [[CDLAv2](https://cdla.dev/permissive-2-0/)] license, a permissive license. 

## Dataset Structure
Download the dataset from [here](https://holoassist.github.io/). Only "Videos" folder is enough.

<pre>
.
├── data
│    ├── labels
|    |    ├── R005-7July-DSLR.json
|    |    └── ...
│    ├── videos   
│    │    ├── R007-7July-DSLR
│    │    │   └── Export_py
│    │    │       ├── Video
│    │    │       │   ├── Pose_sync.txt
│    │    │       │   └── VideoMp4Timing.txt
│    │    │       └── Video_pitchshift.mp4
│    │    ├── R012-7July-Nespresso/
│    │    ├── R013-7July-Nespresso/
│    │    ├── R014-7July-DSLR/
│    │    └── ...
</pre>

## Run

- Open index.html file in the browser after downloading the dataset in respective folder.
- Load the json file from `./data/labels/` folder. It will automatically load the corresponding video.


## Online Testing
- Visit [pyxploiter.github.io/HoloAssistViewer](https://pyxploiter.github.io/HoloAssistViewer)
