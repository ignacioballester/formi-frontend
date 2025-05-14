"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Terminal } from "lucide-react";
import { useMemo } from "react";
import { format as formatDateFn } from 'date-fns'; // For timestamp formatting

interface LogEntry {
  id: string;
  type: 'json' | 'raw';
  timestamp?: string;
  level?: string;
  message: string;
}

interface RunLogsViewProps {
  logs: string | null;
  isLoading: boolean;
  error?: string | null;
  maxHeight?: string; 
}

const getLevelVariant = (level?: string): "default" | "secondary" | "destructive" | "outline" => {
  if (!level) return "outline";
  const lowerLevel = level.toLowerCase();
  if (lowerLevel.includes("error")) return "destructive";
  if (lowerLevel.includes("warn")) return "secondary"; // Or another color like orange if available
  return "default"; // For info and other levels
};

export function RunLogsView({
  logs,
  isLoading,
  error,
  maxHeight = "60vh", 
}: RunLogsViewProps) {

  const parsedLogEntries = useMemo((): LogEntry[] => {
    if (!logs) return [];
    
    const entries: LogEntry[] = [];
    const lines = logs.split('\n');
    let entryIdCounter = 0;

    for (const line of lines) {
      if (line.trim() === "") continue;
      entryIdCounter++;
      try {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("{") && trimmedLine.endsWith("}")) {
          const parsedJson = JSON.parse(trimmedLine);
          entries.push({
            id: `log-${entryIdCounter}`,
            type: 'json',
            timestamp: parsedJson['@timestamp'] 
              ? formatDateFn(new Date(parsedJson['@timestamp']), 'yyyy-MM-dd HH:mm:ss.SSSxxx') 
              : undefined,
            level: parsedJson['@level'],
            message: parsedJson['@message'] || line, // Fallback to raw line if @message is missing
          });
        } else {
          entries.push({
            id: `log-${entryIdCounter}`,
            type: 'raw',
            message: line,
          });
        }
      } catch (e) {
        // If JSON parsing fails, treat as a raw line
        entries.push({
          id: `log-${entryIdCounter}`,
          type: 'raw',
          message: line,
        });
      }
    }
    return entries;
  }, [logs]);

  if (isLoading) {
    return (
      <Card className="flex flex-col overflow-hidden" style={{ maxHeight: maxHeight, minHeight: '250px' }}> 
        <CardHeader>
          <CardTitle className="flex items-center"><Terminal className="mr-2 h-5 w-5" /> Logs</CardTitle>
          <CardDescription>Loading execution logs...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0 relative">
          <Skeleton className="absolute inset-0 w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Loading Logs</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!parsedLogEntries || parsedLogEntries.length === 0) {
    return (
      <Card style={{minHeight: '200px'}}>
        <CardHeader>
          <CardTitle className="flex items-center"><Terminal className="mr-2 h-5 w-5" /> Logs</CardTitle>
          <CardDescription>No log output available for this run.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">The run may not have produced any logs, or logs are not yet available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col overflow-hidden" style={{ maxHeight: maxHeight, minHeight: '250px' }}> 
      <CardHeader>
        <CardTitle className="flex items-center"><Terminal className="mr-2 h-5 w-5" /> Logs</CardTitle>
        <CardDescription>Execution log output. Scroll to see more.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0 relative">
        <ScrollArea 
          className="absolute inset-0 w-full h-full bg-muted/50 rounded-b-md"
        >
          <Table className="text-xs" style={{ minWidth: 'max-content' }}>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead className="w-[200px] px-3 py-2">Timestamp</TableHead>
                <TableHead className="w-[100px] px-3 py-2">Level</TableHead>
                <TableHead className="px-3 py-2">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedLogEntries.map((entry) => (
                <TableRow key={entry.id} className={entry.type === 'json' && entry.level?.toLowerCase().includes('error') ? 'bg-destructive/10 hover:bg-destructive/20' : 'hover:bg-muted/30'}>
                  <TableCell className="align-top font-mono px-3 py-1.5 whitespace-nowrap">
                    {entry.timestamp || <span className="text-muted-foreground/50">N/A</span>}
                  </TableCell>
                  <TableCell className="align-top px-3 py-1.5 whitespace-nowrap">
                    {entry.level ? (
                      <Badge variant={getLevelVariant(entry.level)} className="text-xs">{entry.level.toUpperCase()}</Badge>
                    ) : <span className="text-muted-foreground/50">N/A</span>}
                  </TableCell>
                  <TableCell className="align-top font-mono px-3 py-1.5 whitespace-pre">
                    {entry.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 