'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { tools } from '@/lib/tools';

interface RelatedToolsProps {
  toolIds: string[];
}

export function RelatedTools({ toolIds }: RelatedToolsProps) {
  const relatedTools = toolIds
    .map((id) => tools.find((tool) => tool.id === id))
    .filter((tool): tool is NonNullable<typeof tool> =>
      Boolean(tool && tool.route)
    )
    .slice(0, 4);

  if (relatedTools.length === 0) return null;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Related Tools</CardTitle>
        <CardDescription>
          Try these tools to enhance your workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {relatedTools.map((tool) => (
            <Link key={tool.id} href={tool.route} className="group">
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 transition-all group-hover:border-blue-500 group-hover:bg-gray-50 dark:border-gray-800 dark:group-hover:border-blue-400 dark:group-hover:bg-gray-900">
                <ToolIcon id={tool.id} className="h-6 w-6 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                    {tool.name}
                  </h4>
                  <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/tools">
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center"
            >
              View All Tools
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
