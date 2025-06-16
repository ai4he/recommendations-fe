"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/hooks/useAppStore";
import { useRouter } from "next/navigation";
import { Clock, FileText, Lock, CheckCircle } from "lucide-react";


const getTaskTypeIcon = (type: string) => {
  switch (type) {
    case 'transcription':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'image_labeling':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>;
    case 'text_analysis':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'voice_recording':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>;
    case 'video_recording':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>;
    case 'survey':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="9" x2="15" y1="15" y2="15" /><line x1="12" x2="12" y1="12" y2="18" /></svg>;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

export default function TasksPage() {
  const tasks = useAppStore((state) => state.tasks);
  const router = useRouter();

  // Sort tasks by price descending
  const sortedTasks = [...tasks].sort((a, b) => b.price - a.price);

  // Helper function to render button content based on task state
  const getButtonContent = (isLocked: boolean, isCompleted?: boolean) => {
    if (isLocked) {
      return (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Locked
        </>
      );
    }
    if (isCompleted) {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Completed
        </>
      );
    }
    return 'Start Task';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Available Tasks</h1>
          <p className="text-muted-foreground">
            Select a task to start earning money
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {sortedTasks.map((task) => {
          return (
            <Card 
              key={task.id} 
              className="flex flex-col h-full transition-all hover:shadow-md"
              onClick={() => !task.locked && router.push(`/task-detail/${task.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{task.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    {getTaskTypeIcon(task.type)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {task.duration ?? 'N/A'} min
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    {task.numQuestions ?? '?'} questions
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  {task.description}
                </p>
                
                <div className="mt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment:</span>
                    <span className="font-medium">${task.price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="mt-auto pt-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/sites/task-detail?id=${task.id}`);
                  }}
                  disabled={task.locked}
                  className="w-full"
                >
                  {getButtonContent(task.locked, task.completed)}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
