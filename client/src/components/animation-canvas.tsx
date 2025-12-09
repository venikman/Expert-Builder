import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LessonAnimation, AnimationStep } from "@shared/schema";

interface AnimationCanvasProps {
  lessonId: string;
  animation: LessonAnimation | null;
  isLoading: boolean;
}

interface AnimationShape {
  id: string;
  type: "box" | "arrow" | "text" | "function";
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  highlighted?: boolean;
}

export function AnimationCanvas({ lessonId, animation, isLoading }: AnimationCanvasProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [shapes, setShapes] = useState<AnimationShape[]>([]);
  const [highlightedShapes, setHighlightedShapes] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalSteps = animation?.steps?.length || 0;

  useEffect(() => {
    if (animation?.sceneData?.shapes) {
      setShapes(animation.sceneData.shapes as AnimationShape[]);
    }
    setCurrentStep(0);
    setIsPlaying(false);
    setHighlightedShapes(new Set());
  }, [animation, lessonId]);

  const applyStepEffects = useCallback((stepIndex: number) => {
    if (!animation?.steps || stepIndex < 0 || stepIndex >= animation.steps.length) return;
    
    const newHighlights = new Set<string>();
    for (let i = 0; i <= stepIndex; i++) {
      const step = animation.steps[i];
      if (step.type === "highlight" && step.target) {
        newHighlights.add(step.target);
      }
    }
    setHighlightedShapes(newHighlights);
  }, [animation]);

  useEffect(() => {
    if (!isPlaying || !animation?.steps) return;

    if (currentStep >= totalSteps) {
      setIsPlaying(false);
      return;
    }

    const step = animation.steps[currentStep];
    timeoutRef.current = setTimeout(() => {
      applyStepEffects(currentStep);
      setCurrentStep(prev => prev + 1);
    }, step.duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentStep, animation, totalSteps, applyStepEffects]);

  const handlePlay = () => {
    if (currentStep >= totalSteps) {
      handleReset();
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setHighlightedShapes(new Set());
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleStepForward = () => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      applyStepEffects(newStep - 1);
      setIsPlaying(false);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      if (newStep === 0) {
        setHighlightedShapes(new Set());
      } else {
        applyStepEffects(newStep - 1);
      }
      setIsPlaying(false);
    }
  };

  const handleSkipToStart = () => {
    setCurrentStep(0);
    setHighlightedShapes(new Set());
    setIsPlaying(false);
  };

  const handleSkipToEnd = () => {
    if (totalSteps > 0) {
      setCurrentStep(totalSteps);
      applyStepEffects(totalSteps - 1);
      setIsPlaying(false);
    }
  };

  const handleSeek = (value: number[]) => {
    const newStep = value[0];
    setCurrentStep(newStep);
    if (newStep > 0) {
      applyStepEffects(newStep - 1);
    } else {
      setHighlightedShapes(new Set());
    }
    setIsPlaying(false);
  };

  const getCurrentStepDescription = () => {
    if (!animation?.steps || currentStep === 0) return "Ready to start";
    if (currentStep > totalSteps) return "Animation complete";
    
    const step = animation.steps[currentStep - 1];
    if (!step) return "";
    
    switch (step.type) {
      case "highlight":
        return `Highlighting: ${step.target || "element"}`;
      case "camera":
        return "Camera movement";
      case "annotate":
        return step.data?.text || "Annotation";
      case "pause":
        return "Paused";
      default:
        return `Step ${currentStep}`;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-medium text-muted-foreground">Concept Animation</span>
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <Skeleton className="w-3/4 h-3/4 rounded-lg" />
        </div>
      </div>
    );
  }

  const getShapeColor = (shape: AnimationShape, isHighlighted: boolean) => {
    if (isHighlighted) {
      return "rgba(59, 130, 246, 0.3)";
    }
    return shape.color || "rgba(100, 100, 100, 0.1)";
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-background">
        <span className="text-sm font-medium text-muted-foreground">Concept Animation</span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipToStart}
                disabled={currentStep === 0}
                data-testid="button-skip-start"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Skip to start</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStepBack}
                disabled={currentStep === 0}
                data-testid="button-step-back"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous step</TooltipContent>
          </Tooltip>

          {isPlaying ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePause}
                  data-testid="button-pause-animation"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pause</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlay}
                  disabled={totalSteps === 0}
                  data-testid="button-play-animation"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Play</TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStepForward}
                disabled={currentStep >= totalSteps}
                data-testid="button-step-forward"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next step</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipToEnd}
                disabled={currentStep >= totalSteps || totalSteps === 0}
                data-testid="button-skip-end"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Skip to end</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                data-testid="button-reset-animation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div 
        ref={canvasRef}
        className="flex-1 bg-muted/20 relative overflow-hidden"
        data-testid="canvas-animation"
      >
        <svg className="w-full h-full" viewBox="0 0 400 300">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="currentColor"
                className="text-muted-foreground"
              />
            </marker>
          </defs>

          {shapes.map((shape) => {
            const isHighlighted = highlightedShapes.has(shape.id);
            
            if (shape.type === "arrow") {
              return (
                <g key={shape.id}>
                  <line
                    x1={shape.x}
                    y1={shape.y}
                    x2={shape.x + shape.width}
                    y2={shape.y + shape.height}
                    stroke={isHighlighted ? "#3b82f6" : "currentColor"}
                    strokeWidth={isHighlighted ? 3 : 2}
                    markerEnd="url(#arrowhead)"
                    className={`text-muted-foreground transition-all duration-300 ${isHighlighted ? "opacity-100" : "opacity-50"}`}
                  />
                </g>
              );
            }

            if (shape.type === "function") {
              return (
                <g key={shape.id} className="transition-all duration-300">
                  <rect
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    rx={8}
                    fill={getShapeColor(shape, isHighlighted)}
                    stroke={isHighlighted ? "#3b82f6" : "currentColor"}
                    strokeWidth={isHighlighted ? 2 : 1}
                    className={`text-border transition-all duration-300 ${isHighlighted ? "opacity-100" : "opacity-70"}`}
                  />
                  <text
                    x={shape.x + shape.width / 2}
                    y={shape.y + shape.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-mono fill-foreground"
                  >
                    {shape.label}
                  </text>
                </g>
              );
            }

            if (shape.type === "text") {
              return (
                <text
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  className={`text-sm font-medium transition-all duration-300 ${isHighlighted ? "fill-primary" : "fill-muted-foreground"}`}
                >
                  {shape.label}
                </text>
              );
            }

            return (
              <g key={shape.id} className="transition-all duration-300">
                <rect
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  rx={4}
                  fill={getShapeColor(shape, isHighlighted)}
                  stroke={isHighlighted ? "#3b82f6" : "currentColor"}
                  strokeWidth={isHighlighted ? 2 : 1}
                  className={`text-border transition-all duration-300 ${isHighlighted ? "opacity-100" : "opacity-70"}`}
                />
                {shape.label && (
                  <text
                    x={shape.x + shape.width / 2}
                    y={shape.y + shape.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-mono fill-foreground"
                  >
                    {shape.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {shapes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Play className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click play to watch the concept animation
              </p>
            </div>
          </div>
        )}
      </div>

      {totalSteps > 0 && (
        <div className="p-3 border-t bg-background space-y-2">
          <div className="flex items-center gap-3">
            <Slider
              value={[currentStep]}
              min={0}
              max={totalSteps}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
              data-testid="slider-animation-progress"
            />
            <span className="text-xs text-muted-foreground font-mono min-w-[3rem] text-right" data-testid="text-animation-progress">
              {currentStep}/{totalSteps}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate" data-testid="text-step-description">
            {getCurrentStepDescription()}
          </div>
        </div>
      )}
    </div>
  );
}
