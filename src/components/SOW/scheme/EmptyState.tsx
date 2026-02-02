// components/scheme/EmptyState.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload, Camera, CheckCircle, PenSquare, Edit
} from "lucide-react";

interface EmptyStateProps {
  onUploadClick: () => void;
  onCameraClick: () => void;
  onManualAddClick: () => void;
}

export function EmptyState({
  onUploadClick,
  onCameraClick,
  onManualAddClick,
}: EmptyStateProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
      <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer"
            onClick={onUploadClick}>
        <CardContent className="pt-6 sm:pt-8 pb-8 sm:pb-10 px-4 sm:px-6 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Upload Document</h3>
          <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6 px-2">
            Upload your Scheme of Work. We'll extract all weeks automatically.
          </p>

          <div className="space-y-2 sm:space-y-3">
            <Button className="w-full h-10 sm:h-12 gap-2 text-sm sm:text-base font-semibold shadow-md" size="lg">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Choose File</span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-10 sm:h-12 gap-2 text-sm sm:text-base"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onCameraClick();
              }}
            >
              <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Use Camera</span>
            </Button>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              <span>Smart extraction • 30s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer"
            onClick={onManualAddClick}>
        <CardContent className="pt-6 sm:pt-8 pb-8 sm:pb-10 px-4 sm:px-6 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <PenSquare className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Create Manually</h3>
          <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6 px-2">
            Add your scheme week by week. Perfect for custom planning.
          </p>

          <div className="space-y-2 sm:space-y-3">
            <Button className="w-full h-10 sm:h-12 gap-2 text-sm sm:text-base font-semibold shadow-md" size="lg">
              <PenSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Start Creating</span>
            </Button>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span>Full control</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}