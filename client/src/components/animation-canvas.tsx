import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (animation?.sceneData?.shapes) {
      setShapes(animation.sceneData.shapes as AnimationShape[]);
    }
    setCurrentStep(0);
    setIsPlaying(false);
    setHighlightedShapes(new Set());
  }, [animation, lessonId]);

  useEffect(() => {
    if (!isPlaying || !animation?.steps) return;

    const steps = animation.steps;
    if (currentStep >= steps.length) {
      setIsPlaying(false);
      return;
    }

    const step = steps[currentStep];
    const timeout = setTimeout(() => {
      if (step.type === "highlight" && step.target) {
        setHighlightedShapes(prev => {
          const next = new Set(prev);
          next.add(step.target!);
          return next;
        });
      }
      setCurrentStep(prev => prev + 1);
    }, step.duration);

    return () => clearTimeout(timeout);
  }, [isPlaying, currentStep, animation]);

  const handlePlay = () => {
    if (currentStep >= (animation?.steps?.length || 0)) {
      handleReset();
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setHighlightedShapes(new Set());
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
          {isPlaying ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePause}
              data-testid="button-pause-animation"
            >
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlay}
              data-testid="button-play-animation"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            data-testid="button-reset-animation"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
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

      {animation?.steps && animation.steps.length > 0 && (
        <div className="p-2 border-t bg-background">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(currentStep / animation.steps.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono" data-testid="text-animation-progress">
              {currentStep}/{animation.steps.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
