import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CustomVideoPlayerProps {
  onPlayStateChange?: (playing: boolean) => void;
  onEnded?: () => void;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  onPlayStateChange,
  onEnded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset controls visibility timer
  const resetControlsTimeout = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 2500);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
      setControlsVisible(true); // Always show controls when paused
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        onPlayStateChange?.(true);
        resetControlsTimeout();
      }).catch((err) => {
        console.error("Playback failed:", err?.message || err);
      });
    }
  };

  // Handle container clicks/taps
  const handleContainerClick = () => {
    if (isPlaying) {
      if (controlsVisible) {
        // If playing and controls are visible, tap to pause
        togglePlay();
      } else {
        // If playing and controls are hidden, tap to show controls
        resetControlsTimeout();
      }
    } else {
      // If paused, tap to play
      togglePlay();
    }
  };

  // Handle video element play/pause events directly
  const handlePlayEvent = () => {
    setIsPlaying(true);
    onPlayStateChange?.(true);
  };

  const handlePauseEvent = () => {
    setIsPlaying(false);
    onPlayStateChange?.(false);
  };

  // Format time (e.g. 124 -> 02:04)
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Progress update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Seek video
  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      resetControlsTimeout();
    }
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    resetControlsTimeout();
  };

  // Toggle Mute
  const toggleMute = () => {
    const targetMute = !isMuted;
    setIsMuted(targetMute);
    if (videoRef.current) {
      videoRef.current.muted = targetMute;
      videoRef.current.volume = targetMute ? 0 : volume || 1;
    }
    resetControlsTimeout();
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error entering fullscreen:", err?.message || err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Track fullscreen state change (e.g., via Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Sync isPlaying state changes on trigger
  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Auto-play on mount since the user already clicked "Lancer la vidéo"
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        onPlayStateChange?.(true);
      }).catch((err) => {
        console.warn("Autoplay on mount failed, waiting for user click:", err);
      });
    }
  }, []);

  // Video error handling - fallback to native controls
  const handleVideoError = () => {
    console.warn("Custom video controls error, falling back to standard player");
    setHasError(true);
  };

  // If there's an error playing natively with custom controls, render a standard native controls video player as a backup
  if (hasError) {
    return (
      <div className="w-full h-full relative bg-black flex items-center justify-center">
        <video
          src="/presentation.mp4"
          className="w-full h-full object-contain block"
          controls
          playsInline
          autoPlay
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="custom_video_container"
      className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* HTML5 Native Video Tag - Set src directly on video element and force w-full h-full to avoid mobile collapsing */}
      <video
        ref={videoRef}
        id="native_video_element"
        src="/presentation.mp4"
        className="w-full h-full object-contain z-0 block relative"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlayEvent}
        onPause={handlePauseEvent}
        onEnded={onEnded}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onError={handleVideoError}
        playsInline
        webkit-playsinline="true"
        controls={false}
        preload="auto"
      />

      {/* Transparent Clickable Overlay to capture play/pause / show controls on tap */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleContainerClick}
      />

      {/* Buffering spinner overlay */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none"
          >
            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Central Play Big Button Overlay (Shows ONLY when paused/not started) */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 pointer-events-none"
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-16 h-16 rounded-full border border-white/20 bg-black/55 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-300 group"
            >
              <Play className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37] ml-1 group-hover:text-amber-400 transition-colors" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Bar Overlay */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-0 left-0 right-0 z-25 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-5 px-4 flex flex-col gap-3 pointer-events-auto"
          >
            {/* Elegant Scrubbable Progress Bar */}
            <div className="flex items-center gap-3 w-full group/progress">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleProgressBarChange}
                className="w-full h-1 bg-white/25 rounded-lg appearance-none cursor-pointer accent-[#D4AF37] hover:h-1.5 transition-all duration-150 outline-none"
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.25) ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.25) 100%)`,
                }}
              />
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between">
              {/* Play / Time info */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-[#D4AF37] transition-colors p-1 rounded-md"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>

                <div className="text-[10px] sm:text-xs font-mono text-gray-300 tracking-wider">
                  {formatTime(currentTime)} <span className="text-gray-500">/</span> {formatTime(duration)}
                </div>
              </div>

              {/* Volume & Fullscreen */}
              <div className="flex items-center gap-3">
                {/* Volume selector */}
                <div className="flex items-center gap-1.5 group/volume">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-[#D4AF37] transition-colors p-1"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 overflow-hidden group-hover/volume:w-16 accent-[#D4AF37] bg-white/20 h-1 rounded-lg appearance-none cursor-pointer transition-all duration-300 ease-in-out"
                  />
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-[#D4AF37] transition-colors p-1"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
