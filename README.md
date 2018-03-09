# video-presets

This is the set of video transcoding preset specifications compatible with the [video-transcoding-api](https://github.com/NYTimes/video-transcoding-api) which are used by The New York Times when transcoding all videos we produce.

## How to Use

- Set up the [video-transcoding-api](https://github.com/NYTimes/video-transcoding-api) to run in some host.
- Point the `apply_presets.sh` script to it as such:
```bash
./apply_presets.sh [360|standard] http://your-transcoding-host/ <provider1> [provider2] [provider3] ... [providern]
```

### Result
```json
{"Results":{"encodingcom":{"PresetID":"mp4_1080p","Error":""}},"PresetMap":""}
{"Results":{"encodingcom":{"PresetID":"mp4_720p","Error":""}},"PresetMap":""}
...
```
