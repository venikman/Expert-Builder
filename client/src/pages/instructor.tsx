import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, ArrowLeft, BookOpen, Code, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Lesson } from "@shared/schema";

const lessonFormSchema = z.object({
  id: z.string().min(1, "Lesson ID is required").regex(/^[a-z0-9-]+$/, "ID must be lowercase with hyphens only"),
  title: z.string().min(1, "Title is required"),
  order: z.coerce.number().int().min(0, "Order must be 0 or greater"),
  conceptTags: z.string().transform(val => val.split(",").map(t => t.trim()).filter(Boolean)),
  description: z.string().min(1, "Description is required"),
  skeleton: z.string().min(1, "Starter code is required"),
  referenceSolution: z.string().min(1, "Reference solution is required"),
  testCode: z.string().min(1, "Test code is required"),
  hints: z.string().transform(val => {
    try {
      return JSON.parse(val || "{}");
    } catch {
      return {};
    }
  }),
});

type LessonFormData = z.input<typeof lessonFormSchema>;

function LessonForm({ 
  lesson, 
  onSuccess,
  mode 
}: { 
  lesson?: Lesson; 
  onSuccess: () => void;
  mode: "create" | "edit";
}) {
  const { toast } = useToast();
  
  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      id: lesson?.id || "",
      title: lesson?.title || "",
      order: lesson?.order || 0,
      conceptTags: lesson?.conceptTags?.join(", ") || "",
      description: lesson?.description || "",
      skeleton: lesson?.skeleton || "",
      referenceSolution: lesson?.referenceSolution || "",
      testCode: lesson?.testCode || "",
      hints: lesson?.hints ? JSON.stringify(lesson.hints, null, 2) : "{}",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.output<typeof lessonFormSchema>) => {
      const response = await apiRequest("POST", "/api/instructor/lessons", data) as Response;
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({ title: "Lesson created successfully" });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: "Failed to create lesson", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.output<typeof lessonFormSchema>) => {
      const response = await apiRequest("PATCH", `/api/instructor/lessons/${lesson?.id}`, data) as Response;
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({ title: "Lesson updated successfully" });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: "Failed to update lesson", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: LessonFormData) => {
    const parsed = lessonFormSchema.parse(data);
    if (mode === "create") {
      createMutation.mutate(parsed);
    } else {
      updateMutation.mutate(parsed);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" data-testid="tab-basic">
              <BookOpen className="w-4 h-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="code" data-testid="tab-code">
              <Code className="w-4 h-4 mr-2" />
              Code
            </TabsTrigger>
            <TabsTrigger value="tests" data-testid="tab-tests">
              <TestTube className="w-4 h-4 mr-2" />
              Tests & Hints
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="pure-functions" 
                        {...field} 
                        disabled={mode === "edit"}
                        data-testid="input-lesson-id"
                      />
                    </FormControl>
                    <FormDescription>Unique URL-friendly identifier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field}
                        data-testid="input-lesson-order"
                      />
                    </FormControl>
                    <FormDescription>Display order in lesson list</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Pure Functions" 
                      {...field}
                      data-testid="input-lesson-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conceptTags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concept Tags</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="pure functions, no side effects, deterministic" 
                      {...field}
                      data-testid="input-concept-tags"
                    />
                  </FormControl>
                  <FormDescription>Comma-separated list of concept tags</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Markdown)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="## What are Pure Functions?&#10;&#10;A **pure function** is a function that..." 
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormDescription>Lesson content in Markdown format</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="code" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="skeleton"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starter Code</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="using System;&#10;&#10;public class Exercise&#10;{&#10;    // Your code here&#10;}" 
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                      data-testid="textarea-skeleton"
                    />
                  </FormControl>
                  <FormDescription>Initial code template for learners</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceSolution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Solution</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="using System;&#10;&#10;public class Exercise&#10;{&#10;    public static int Square(int n) => n * n;&#10;}" 
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                      data-testid="textarea-reference-solution"
                    />
                  </FormControl>
                  <FormDescription>Complete correct solution (hidden from learners)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="tests" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="testCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Cases (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='[&#10;  { "name": "Test 1", "input": 5, "expected": 25 }&#10;]' 
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                      data-testid="textarea-test-code"
                    />
                  </FormControl>
                  <FormDescription>JSON array of test cases with name, input, and expected values</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hints (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='{&#10;  "Test 1": "Remember to multiply the number by itself"&#10;}' 
                      className="min-h-[150px] font-mono text-sm"
                      {...field}
                      data-testid="textarea-hints"
                    />
                  </FormControl>
                  <FormDescription>JSON object mapping test names to hint messages</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" data-testid="button-cancel">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isPending} data-testid="button-save-lesson">
            {isPending ? "Saving..." : mode === "create" ? "Create Lesson" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function LessonCard({ lesson, onEdit }: { lesson: Lesson; onEdit: () => void }) {
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/instructor/lessons/${lesson.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({ title: "Lesson deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete lesson", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className="group" data-testid={`card-lesson-${lesson.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="shrink-0" data-testid={`badge-order-${lesson.id}`}>
              #{lesson.order}
            </Badge>
            <CardTitle className="text-lg truncate" data-testid={`text-lesson-title-${lesson.id}`}>
              {lesson.title}
            </CardTitle>
          </div>
          <CardDescription className="mt-1 font-mono text-xs" data-testid={`text-lesson-id-${lesson.id}`}>
            {lesson.id}
          </CardDescription>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onEdit}
            data-testid={`button-edit-${lesson.id}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost"
                data-testid={`button-delete-${lesson.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{lesson.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground"
                  data-testid="button-confirm-delete"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {lesson.conceptTags?.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-tag-${lesson.id}-${i}`}>
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Instructor() {
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/instructor/lessons"],
  });

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsEditOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-6 sticky top-0 bg-background z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Instructor Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-lesson">
                <Plus className="w-4 h-4 mr-2" />
                New Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Lesson</DialogTitle>
                <DialogDescription>
                  Add a new lesson to the curriculum. Fill in all required fields.
                </DialogDescription>
              </DialogHeader>
              <LessonForm 
                mode="create" 
                onSuccess={() => setIsCreateOpen(false)} 
              />
            </DialogContent>
          </Dialog>
          <ThemeToggle />
        </div>
      </header>

      <main className="container max-w-5xl mx-auto py-8 px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold" data-testid="text-lessons-heading">Lessons</h2>
          <p className="text-muted-foreground mt-1" data-testid="text-lessons-count">
            {lessons.length} lesson{lessons.length !== 1 ? "s" : ""} in curriculum
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2" data-testid="text-empty-state">No lessons yet</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first lesson</p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-lesson">
                <Plus className="w-4 h-4 mr-2" />
                Create First Lesson
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <LessonCard 
                key={lesson.id} 
                lesson={lesson} 
                onEdit={() => handleEdit(lesson)} 
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>
              Make changes to the lesson content and settings.
            </DialogDescription>
          </DialogHeader>
          {editingLesson && (
            <LessonForm 
              lesson={editingLesson} 
              mode="edit" 
              onSuccess={() => {
                setIsEditOpen(false);
                setEditingLesson(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
