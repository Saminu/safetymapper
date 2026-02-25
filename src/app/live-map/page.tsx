"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Camera,
  Video,
  Upload,
  X,
  MapPin,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  Film,
  Crosshair,
  Loader2,
  ChevronLeft,
  Plus,
  Trash2,
  Info,
  Send,
} from "lucide-react";
import { MapEventType } from "@/types/mapper";

type MediaSourceType = "CAPTURED" | "UPLOADED";

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
  sourceType: MediaSourceType;
}

type LocationMode = "current" | "pick";
type Step = "media" | "details" | "location" | "review";

const EVENT_CATEGORIES: { value: MapEventType; label: string; icon: string }[] = [
  { value: "ACCIDENT", label: "Accident", icon: "💥" },
  { value: "FLOOD", label: "Flood", icon: "🌊" },
  { value: "RAIN", label: "Heavy Rain", icon: "🌧️" },
  { value: "TRAFFIC", label: "Traffic / Gridlock", icon: "🚦" },
  { value: "POLICE", label: "Police Checkpoint", icon: "👮" },
  { value: "HAZARD", label: "Road Hazard", icon: "⚠️" },
  { value: "ROAD_WORK", label: "Road Work", icon: "🚧" },
  { value: "FIRE", label: "Fire", icon: "🔥" },
  { value: "PROTEST", label: "Protest", icon: "📢" },
  { value: "SOS", label: "Emergency SOS", icon: "🆘" },
  { value: "OTHER", label: "Other", icon: "📋" },
];

export default function LiveMapPage() {
  const router = useRouter();

  // Core state
  const [step, setStep] = useState<Step>("media");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Media state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo");
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Event details state
  const [eventCategory, setEventCategory] = useState<MapEventType>("ACCIDENT");
  const [customCategory, setCustomCategory] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  // Location state
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [eventLocation, setEventLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>("current");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Initialize geolocation
  useEffect(() => {
    const mapperId = localStorage.getItem("mapperId");
    if (!mapperId) {
      router.push("/onboarding");
      return;
    }

    if ("geolocation" in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setCurrentLocation(loc);
          setEventLocation(loc);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Location error:", error);
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setCurrentLocation(loc);
          if (locationMode === "current") {
            setEventLocation(loc);
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [router, locationMode]);

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: cameraMode === "video",
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera. Please grant camera permissions.");
    }
  }, [cameraMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setShowCamera(false);
    setIsRecording(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      const preview = URL.createObjectURL(blob);
      setMediaFiles((prev) => [...prev, { file, preview, type: "image", sourceType: "CAPTURED" }]);
      stopCamera();
    }, "image/jpeg", 0.9);
  }, [stopCamera]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp8,opus" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: "video/webm" });
      const preview = URL.createObjectURL(blob);
      setMediaFiles((prev) => [...prev, { file, preview, type: "video", sourceType: "CAPTURED" }]);
      stopCamera();
    };
    mr.start(1000);
    mediaRecorderRef.current = mr;
    setIsRecording(true);
  }, [stopCamera]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - mediaFiles.length;
    const toAdd = Array.from(files).slice(0, remaining);
    const newMedia: MediaFile[] = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
      sourceType: "UPLOADED" as MediaSourceType,
    }));
    setMediaFiles((prev) => [...prev, ...newMedia]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [mediaFiles.length]);

  const removeMedia = useCallback((index: number) => {
    setMediaFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  // Cleanup previews
  useEffect(() => {
    return () => {
      mediaFiles.forEach((m) => URL.revokeObjectURL(m.preview));
      stopCamera();
    };
  }, []);

  // Validation
  const canProceedToDetails = mediaFiles.length > 0;
  const canProceedToLocation = eventCategory !== "OTHER" || customCategory.trim() !== "";
  const canSubmit = canProceedToDetails && canProceedToLocation && eventLocation !== null;

  // Submit
  const submitEvent = async () => {
    if (!canSubmit || !eventLocation) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const formData = new FormData();
      mediaFiles.forEach((m) => formData.append("media", m.file));
      formData.append("category", eventCategory);
      formData.append("title", eventCategory === "OTHER" ? customCategory : EVENT_CATEGORIES.find((c) => c.value === eventCategory)?.label || eventCategory);
      if (eventCategory === "OTHER") formData.append("customCategory", customCategory);
      formData.append("description", eventDescription);
      formData.append("lat", eventLocation.lat.toString());
      formData.append("lon", eventLocation.lon.toString());
      formData.append("severity", severity);
      // Set sourceType based on the predominant type of media
      const hasCaptures = mediaFiles.some((m) => m.sourceType === "CAPTURED");
      formData.append("sourceType", hasCaptures ? "CAPTURED" : "UPLOADED");

      const response = await fetch("/api/events", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit event");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Submit error:", error);
      alert(error instanceof Error ? error.message : "Failed to submit event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full space-y-4">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Event Reported!</h2>
          <p className="text-muted-foreground">
            Your safety event has been submitted and is now live on the map. Thank you for keeping the community safe!
          </p>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => { setSubmitSuccess(false); setStep("media"); setMediaFiles([]); setEventDescription(""); setEventCategory("ACCIDENT"); setCustomCategory(""); }}>
              Report Another
            </Button>
            <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={() => router.push("/dashboard")}>
              View Map
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Record Event
          </h1>
          <div className="w-14" />
        </div>
      </div>

      {/* Step Indicator */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          {(["media", "details", "location", "review"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (s === "media") setStep(s);
                  else if (s === "details" && canProceedToDetails) setStep(s);
                  else if (s === "location" && canProceedToDetails && canProceedToLocation) setStep(s);
                  else if (s === "review" && canSubmit) setStep(s);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s
                    ? "bg-orange-500 text-white scale-110"
                    : (["media", "details", "location", "review"].indexOf(step) > i)
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {(["media", "details", "location", "review"].indexOf(step) > i) ? "✓" : i + 1}
              </button>
              {i < 3 && (
                <div className={`flex-1 h-0.5 mx-1 transition-all ${
                  (["media", "details", "location", "review"].indexOf(step) > i)
                    ? "bg-green-500" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mb-6">
          <span className={step === "media" ? "text-orange-500 font-medium" : ""}>Media</span>
          <span className={step === "details" ? "text-orange-500 font-medium" : ""}>Details</span>
          <span className={step === "location" ? "text-orange-500 font-medium" : ""}>Location</span>
          <span className={step === "review" ? "text-orange-500 font-medium" : ""}>Review</span>
        </div>

        {/* ─── Step 1: Media ─── */}
        {step === "media" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Add Photos & Videos</h2>
              <p className="text-sm text-muted-foreground">
                Capture or upload up to 5 photos/videos of the event. You can mix captured and uploaded media.
              </p>
            </div>

            {/* Media Grid */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {mediaFiles.map((media, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border group">
                    {media.type === "image" ? (
                      <img src={media.preview} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <video src={media.preview} className="w-full h-full object-cover" muted playsInline />
                    )}
                    {/* Media type indicator */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${
                        media.type === "video" ? "bg-purple-500/80 text-white" : "bg-blue-500/80 text-white"
                      }`}>
                        {media.type === "video" ? <Film className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
                        {media.type === "video" ? "VID" : "IMG"}
                      </span>
                    </div>
                    {/* Source badge */}
                    <div className="absolute bottom-1.5 left-1.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${
                        media.sourceType === "CAPTURED" ? "bg-green-500/80 text-white" : "bg-amber-500/80 text-white"
                      }`}>
                        {media.sourceType === "CAPTURED" ? <Camera className="w-2.5 h-2.5" /> : <Upload className="w-2.5 h-2.5" />}
                        {media.sourceType === "CAPTURED" ? "Live" : "Upload"}
                      </span>
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {/* Add more button */}
                {mediaFiles.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-orange-500 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-orange-500 transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs">Add More</span>
                  </button>
                )}
              </div>
            )}

            {/* Empty state - action buttons */}
            {mediaFiles.length === 0 && (
              <Card className="p-8 text-center border-dashed border-2">
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">No media added yet</p>
                    <p className="text-sm text-muted-foreground">
                      Take a photo, record a video, or upload from your camera roll.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => { setCameraMode("photo"); startCamera(); }}
                variant="outline"
                className="h-16 flex flex-col items-center gap-1"
                disabled={mediaFiles.length >= 5}
              >
                <Camera className="w-5 h-5 text-blue-500" />
                <span className="text-xs">Take Photo</span>
              </Button>
              <Button
                onClick={() => { setCameraMode("video"); startCamera(); }}
                variant="outline"
                className="h-16 flex flex-col items-center gap-1"
                disabled={mediaFiles.length >= 5}
              >
                <Video className="w-5 h-5 text-purple-500" />
                <span className="text-xs">Record Video</span>
              </Button>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-14 flex items-center justify-center gap-2"
              disabled={mediaFiles.length >= 5}
            >
              <Upload className="w-5 h-5 text-amber-500" />
              <span>Upload from Camera Roll</span>
              <span className="text-xs text-muted-foreground">({mediaFiles.length}/5)</span>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Next Button */}
            <Button
              onClick={() => setStep("details")}
              disabled={!canProceedToDetails}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-lg"
            >
              Continue to Details
            </Button>
          </div>
        )}

        {/* ─── Step 2: Event Details ─── */}
        {step === "details" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Event Details</h2>
              <p className="text-sm text-muted-foreground">
                Choose the type of event and add a description.
              </p>
            </div>

            {/* Category Grid */}
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setEventCategory(cat.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      eventCategory === cat.value
                        ? "border-orange-500 bg-orange-500/10 shadow-md scale-[1.02]"
                        : "border-border hover:border-orange-500/50"
                    }`}
                  >
                    <span className="text-xl block mb-1">{cat.icon}</span>
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Category (if OTHER) */}
            {eventCategory === "OTHER" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Describe the event type *
                </label>
                <input
                  type="text"
                  className="w-full bg-background border-2 rounded-xl p-3 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="e.g., Gas leak, Building collapse..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">This field is required for "Other" events</p>
              </div>
            )}

            {/* Description  */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Event Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full bg-background border-2 rounded-xl p-3 h-28 resize-none focus:border-orange-500 focus:outline-none transition-colors"
                placeholder="Describe what happened in more detail..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{eventDescription.length}/500</p>
            </div>

            {/* Severity */}
            <div>
              <label className="text-sm font-medium mb-2 block">Severity Level</label>
              <div className="grid grid-cols-4 gap-2">
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((level) => {
                  const colors = {
                    LOW: "border-blue-500 bg-blue-500/10 text-blue-600",
                    MEDIUM: "border-yellow-500 bg-yellow-500/10 text-yellow-600",
                    HIGH: "border-orange-500 bg-orange-500/10 text-orange-600",
                    CRITICAL: "border-red-500 bg-red-500/10 text-red-600",
                  };
                  return (
                    <button
                      key={level}
                      onClick={() => setSeverity(level)}
                      className={`p-2 rounded-xl border-2 text-center text-xs font-bold transition-all ${
                        severity === level ? colors[level] + " scale-[1.02] shadow-md" : "border-border"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep("media")}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                className="flex-1 h-12 bg-orange-500 hover:bg-orange-600"
                disabled={!canProceedToLocation}
                onClick={() => setStep("location")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Location ─── */}
        {step === "location" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Event Location</h2>
              <p className="text-sm text-muted-foreground">
                Choose where this event is happening.
              </p>
            </div>

            {/* Location mode selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setLocationMode("current");
                  if (currentLocation) setEventLocation(currentLocation);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  locationMode === "current"
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-border hover:border-orange-500/50"
                }`}
              >
                <Crosshair className={`w-6 h-6 mx-auto mb-2 ${locationMode === "current" ? "text-orange-500" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium block">My Current Location</span>
                <span className="text-xs text-muted-foreground block mt-1">Use GPS pin</span>
              </button>
              <button
                onClick={() => setLocationMode("pick")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  locationMode === "pick"
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-border hover:border-orange-500/50"
                }`}
              >
                <MapPin className={`w-6 h-6 mx-auto mb-2 ${locationMode === "pick" ? "text-orange-500" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium block">Pick on Map</span>
                <span className="text-xs text-muted-foreground block mt-1">Choose a location</span>
              </button>
            </div>

            {/* Current location display */}
            {locationMode === "current" && (
              <Card className="p-4">
                {isLoadingLocation ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Acquiring GPS location...</span>
                  </div>
                ) : currentLocation ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600">GPS Location Locked</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm">Unable to get GPS. Please enable location services.</span>
                  </div>
                )}
              </Card>
            )}

            {/* Map location picker */}
            {locationMode === "pick" && (
              <div className="space-y-3">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter coordinates or adjust pin on map. You can also tap the map to set the location.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="w-full bg-background border rounded-lg p-2 text-sm font-mono focus:border-orange-500 focus:outline-none"
                        value={eventLocation?.lat ?? ""}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value);
                          if (!isNaN(lat)) {
                            setEventLocation((prev) => ({ lat, lon: prev?.lon ?? 0 }));
                          }
                        }}
                        placeholder="6.5244"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="w-full bg-background border rounded-lg p-2 text-sm font-mono focus:border-orange-500 focus:outline-none"
                        value={eventLocation?.lon ?? ""}
                        onChange={(e) => {
                          const lon = parseFloat(e.target.value);
                          if (!isNaN(lon)) {
                            setEventLocation((prev) => ({ lat: prev?.lat ?? 0, lon }));
                          }
                        }}
                        placeholder="3.3792"
                      />
                    </div>
                  </div>
                  {currentLocation && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs text-orange-500"
                      onClick={() => setEventLocation(currentLocation)}
                    >
                      <Crosshair className="w-3 h-3 mr-1" /> Use my current location
                    </Button>
                  )}
                </Card>
                {eventLocation && (
                  <Card className="p-3 bg-green-500/10 border-green-500/20">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Location set: {eventLocation.lat.toFixed(6)}, {eventLocation.lon.toFixed(6)}</span>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep("details")}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                className="flex-1 h-12 bg-orange-500 hover:bg-orange-600"
                disabled={!eventLocation}
                onClick={() => setStep("review")}
              >
                Review Event
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Review & Submit ─── */}
        {step === "review" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Review & Submit</h2>
              <p className="text-sm text-muted-foreground">
                Confirm the details below before submitting your event report.
              </p>
            </div>

            {/* Media Preview */}
            <Card className="p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                Media ({mediaFiles.length})
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaFiles.map((media, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border">
                    {media.type === "image" ? (
                      <img src={media.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={media.preview} className="w-full h-full object-cover" muted playsInline />
                    )}
                    <div className="absolute bottom-0.5 left-0.5">
                      <span className={`inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold backdrop-blur-sm ${
                        media.sourceType === "CAPTURED" ? "bg-green-500/80 text-white" : "bg-amber-500/80 text-white"
                      }`}>
                        {media.sourceType === "CAPTURED" ? "📸" : "📤"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Event Info */}
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Event Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">
                    {EVENT_CATEGORIES.find((c) => c.value === eventCategory)?.icon}{" "}
                    {eventCategory === "OTHER" ? customCategory : EVENT_CATEGORIES.find((c) => c.value === eventCategory)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Severity</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                    severity === "CRITICAL" ? "bg-red-500 text-white" :
                    severity === "HIGH" ? "bg-orange-500 text-white" :
                    severity === "MEDIUM" ? "bg-yellow-500 text-white" :
                    "bg-blue-500 text-white"
                  }`}>
                    {severity}
                  </span>
                </div>
                {eventDescription && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Description</span>
                    <p className="bg-muted p-2 rounded-lg text-xs">{eventDescription}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Location */}
            <Card className="p-4">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                Location
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  locationMode === "current" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"
                }`}>
                  {locationMode === "current" ? "📍 GPS Pin" : "🗺️ Manual"}
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  {eventLocation?.lat.toFixed(6)}, {eventLocation?.lon.toFixed(6)}
                </span>
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep("location")}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                className="flex-1 h-14 bg-orange-500 hover:bg-orange-600 text-lg gap-2"
                disabled={isSubmitting || !canSubmit}
                onClick={submitEvent}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Event
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="flex-1 object-cover"
          />
          {/* Camera controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={stopCamera}
                className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {cameraMode === "photo" ? (
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full border-4 border-orange-500 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Camera className="w-8 h-8 text-orange-500" />
                </button>
              ) : isRecording ? (
                <button
                  onClick={stopRecording}
                  className="w-20 h-20 bg-red-500 rounded-full border-4 border-white flex items-center justify-center animate-pulse active:scale-90 transition-transform"
                >
                  <div className="w-8 h-8 bg-white rounded-md" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 bg-red-500 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Video className="w-8 h-8 text-white" />
                </button>
              )}

              <div className="w-12 h-12" /> {/* spacer */}
            </div>
            {/* Mode label */}
            <div className="text-center mt-4">
              <span className="text-white text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                {cameraMode === "photo" ? "📸 Photo Mode" : isRecording ? "🔴 Recording..." : "🎬 Video Mode"}
              </span>
            </div>
          </div>

          {/* Status indicator */}
          {isRecording && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-bold">REC</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
