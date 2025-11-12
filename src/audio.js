// src/audio.js

var audio = (function() {

    // Use AudioContext for robust game audio
    var context;
    var bufferLoader;
    var bufferCache = {};
    var loopingSources = {}; // Tracks active loops (siren, fright, eyes)

    // All the sounds we need to load
    var soundList = {
        'start': 'audio/ms_start.ogg',
        'siren': 'audio/ms_siren0.wav',
        'eat_dot': 'audio/ms_eat_dot.ogg',
        'fright': 'audio/ms_fright.wav',
        'eat_ghost': 'audio/ms_eat_ghost.wav',
        'eyes': 'audio/ms_eyes.wav',
        'fruit_bounce': 'audio/ms_fruit_bounce.mp3'
    };

    // --- Audio Loading ---

    function BufferLoader(context, urlList, callback) {
        this.context = context;
        this.urlList = urlList;
        this.onload = callback;
        this.bufferList = {};
        this.loadCount = 0;
    }

    BufferLoader.prototype.loadBuffer = function(url, key) {
        var loader = this;
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        request.onload = function() {
            loader.context.decodeAudioData(
                request.response,
                function(buffer) {
                    if (!buffer) {
                        console.error('Error decoding file data: ' + url);
                        return;
                    }
                    loader.bufferList[key] = buffer;
                    if (++loader.loadCount == Object.keys(loader.urlList).length)
                        loader.onload(loader.bufferList);
                },
                function(error) {
                    console.error('decodeAudioData error', error);
                }
            );
        }
        request.onerror = function() {
            console.error('BufferLoader: XHR error');
        }
        request.send();
    }

    BufferLoader.prototype.load = function() {
        for (var key in this.urlList) {
            this.loadBuffer(this.urlList[key], key);
        }
    }

    // --- Public API ---

    var audioUnlocked = false;

    return {
        // We must call this on the first user click to unlock audio in browsers
        init: function() {
            if (audioUnlocked || !window.AudioContext) return;
            
            context = new AudioContext();
            
            // Workaround for iOS Safari
            if (context.state === 'suspended') {
                context.resume();
            }

            bufferLoader = new BufferLoader(context, soundList, function(finishedList) {
                bufferCache = finishedList;
                console.log("Audio loaded.");
            });
            bufferLoader.load();
            audioUnlocked = true;
        },

        // Play a sound
        // loop (boolean): True if the sound should loop (e.g., siren)
        play: function(soundName, loop = false) {
            if (!audioUnlocked || !bufferCache[soundName]) return;

            // If this is a looping sound, stop any existing instance first
            if (loop) {
                this.stop(soundName);
            }

            var source = context.createBufferSource();
            source.buffer = bufferCache[soundName];
            source.connect(context.destination);
            source.loop = loop;
            source.start(0);

            // Store the source node if it's looping so we can stop it later
            if (loop) {
                loopingSources[soundName] = source;
            }
        },

        // Stop a sound (primarily for loops)
        stop: function(soundName) {
            if (!audioUnlocked || !loopingSources[soundName]) return;

            loopingSources[soundName].stop();
            delete loopingSources[soundName];
        },
        
        // Helper to stop all loops (e.g., when Pac-Man dies)
        stopAllLoops: function() {
            if (!audioUnlocked) return;
            for (var soundName in loopingSources) {
                this.stop(soundName);
            }
        }
    };

})();