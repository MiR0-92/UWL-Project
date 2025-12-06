// src/audio.js

var audio = (function() {

    // Use AudioContext for robust game audio
    var context;
    var bufferLoader;
    var bufferCache = {};
    var loopingSources = {}; // Tracks active loops (siren, fright, eyes)
    
    // --- START OF MODIFICATION ---
    var currentMusicName = null; // Tracks the soundName of the current music
    // --- END OF MODIFICATION ---


    // All the sounds we need to load
    var soundList = {
        'start': 'audio/ms_start.ogg',
        'siren': 'audio/ms_siren0.wav',
        'eat_dot': 'audio/ms_eat_dot.ogg',
        'fright': 'audio/ms_fright.wav',
        'fruit_bounce': 'audio/ms_fruit_bounce.mp3',

        'firstblood': 'audio/firstblood.wav',
        'doublekill': 'audio/doublekill.wav',
        'multikill': 'audio/multikill.wav',
        'ultrakill': 'audio/ultrakill.wav',
        'rampage': 'audio/rampage.wav',
        'unstoppable': 'audio/unstoppable.wav',
        'godlike': 'audio/godlike.wav',
        'monsterkill': 'audio/monsterkill.wav',
        'extra_life': 'audio/extra_life.wav',

        'eat_pill': 'audio/ms_eat_pill.ogg',
        'speed_power': 'audio/ms_speed_power.ogg',
        'slow_power': 'audio/ms_ghost_slow_power.wav',
        'invincibility_power': 'audio/ms_invicivility_power.wav',
        'death': 'audio/ms_death.ogg',
        'death_spinning': 'audio/ms_death1.wav',
        'level_complete': 'audio/ms_level_complete.wav',

        'ms_fright_flash': 'audio/ms_fright_flash.wav',
        'ms_cutscene_1': 'audio/ms_cutscene_1.wav',
        'ms_cutscene_2': 'audio/ms_cutscene_2.wav',
        'ms_cutscene_2_bump': 'audio/ms_cutscene_2_bump.wav',
        
        // --- START OF MODIFICATION: Added Music Tracks ---
        'music_lvl1': 'audio/level1.mp3',
        'music_lvl2': 'audio/level2.mp3',
        'music_lvl3': 'audio/level3.mp3',
        'music_lvl4': 'audio/level4.mp3',
        'music_lvl5': 'audio/level5.mp3',
        'music_random': 'audio/level_random.mp3'
        // --- END OF MODIFICATION ---
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
                
                // --- START OF FIX: Play initial music *after* loading ---
                // This was moved from the end of init() to fix a race condition
                if (typeof playLevelMusic === 'function' && typeof level === 'number') {
                    playLevelMusic(level);
                }
                // --- END OF FIX ---
            });
            bufferLoader.load();
            audioUnlocked = true;
            // --- MOVED --- The playLevelMusic call was here
        },

        // Play a sound
        // loop (boolean): True if the sound should loop (e.g., siren)
        play: function(soundName, loop = false) {
            if (!audioUnlocked || !bufferCache[soundName]) return;


            // If this is a looping sound, stop any existing instance first
            if (loop) {
                this.stop(soundName); // Stop if it's already playing
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
        
        // --- START OF MODIFICATION: Music Functions ---

        /**
         * Plays a background music track.
         * Ensures only one music track plays at a time.
         * @param {string} soundName - The name of the music track from soundList.
         */
        playMusic: function(soundName) {
            if (!audioUnlocked) return;
            
            if (!bufferCache[soundName]) {
                console.warn("Cannot play music: " + soundName + " is not loaded.");
                return;
            }

            // If this music is already playing, do nothing
            if (currentMusicName === soundName) {
                return;
            }

            // If other music is playing, stop it
            if (currentMusicName) {
                this.stop(currentMusicName);
            }

            // Play the new music (and loop it)
            this.play(soundName, true);
            currentMusicName = soundName;
        },

        /**
         * Stops the currently playing background music.
         */
        stopMusic: function() {
            if (currentMusicName) {
                this.stop(currentMusicName);
                currentMusicName = null;
            }
        },
        
        // --- END OF MODIFICATION ---
        

        // Helper to stop all loops (e.g., when Pac-Man dies)
        stopAllLoops: function() {
            if (!audioUnlocked) return;
            
            // Clone keys because this.stop modifies the loopingSources object
            var keys = Object.keys(loopingSources);
            for (var i = 0; i < keys.length; i++) {
                this.stop(keys[i]);
            }
            
            // --- START OF MODIFICATION ---
            // Also reset the music tracker
            currentMusicName = null;
            // --- END OF MODIFICATION ---
        }
    };

})();