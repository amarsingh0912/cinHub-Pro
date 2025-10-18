import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Upload, X, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ProfileAvatarProps {
  currentImageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  userName?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      }
    }, "image/jpeg");
  });
}

export function ProfileAvatar({
  currentImageUrl,
  onUpload,
  onDelete,
  userName,
  isUploading = false,
  uploadProgress = 0,
}: ProfileAvatarProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return "Please select a JPEG, PNG, or WebP image.";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "Please select an image smaller than 5MB.";
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid File",
        description: error,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      setSelectedFile(file);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!previewUrl || !croppedAreaPixels || !selectedFile) return;

    try {
      const croppedImageBlob = await getCroppedImg(previewUrl, croppedAreaPixels);

      // Ensure minimum size of 200x200
      const img = await createImage(previewUrl);
      if (croppedAreaPixels.width < 200 || croppedAreaPixels.height < 200) {
        toast({
          title: "Image Too Small",
          description: "Please crop an area of at least 200×200 pixels.",
          variant: "destructive",
        });
        return;
      }

      // Create a new File from the cropped blob
      const croppedFile = new File(
        [croppedImageBlob],
        selectedFile.name,
        { type: "image/jpeg" }
      );

      setShowCropDialog(false);
      setPreviewUrl(null);
      setSelectedFile(null);

      await onUpload(croppedFile);
    } catch (error) {
      console.error("Crop error:", error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
    }
  };

  const getInitials = () => {
    if (!userName) return "U";
    const parts = userName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center space-y-4" data-testid="profile-avatar-container">
      {/* Avatar Display */}
      <div className="relative" data-testid="avatar-display">
        <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
          <AvatarImage
            src={currentImageUrl || undefined}
            alt={userName || "Profile picture"}
            data-testid="avatar-image"
          />
          <AvatarFallback className="text-2xl font-semibold" data-testid="avatar-fallback">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
            <div className="text-white text-sm font-medium" data-testid="upload-progress-text">
              {uploadProgress}%
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <Progress value={uploadProgress} className="w-full" data-testid="upload-progress-bar" />
      )}

      {/* Drag and Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          w-full max-w-sm border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}
          ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
        `}
        onClick={() => fileInputRef.current?.click()}
        data-testid="drag-drop-zone"
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          {isDragging ? "Drop image here" : "Drag & drop or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, or WebP • Max 5MB • Min 200×200px
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelect(file);
            }
          }}
          className="hidden"
          disabled={isUploading}
          data-testid="input-file-upload"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-testid="button-change-picture"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Uploading..." : "Change Picture"}
        </Button>
        {currentImageUrl && onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isUploading}
            data-testid="button-remove-picture"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-2xl" data-testid="crop-dialog">
          <DialogHeader>
            <DialogTitle>Crop Your Photo</DialogTitle>
            <DialogDescription>
              Adjust the crop area to select the part of the image you want to use.
              Minimum size: 200×200 pixels.
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-96 bg-black rounded-md overflow-hidden" data-testid="crop-area">
            {previewUrl && (
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>

          <div className="space-y-2" data-testid="zoom-control">
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
              data-testid="input-zoom-slider"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCropCancel}
              data-testid="button-crop-cancel"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCropConfirm}
              data-testid="button-crop-confirm"
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
