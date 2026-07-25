"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, BookStack, ArrowRight } from "iconoir-react";
import { Badge } from "@/components/ui/badge";

interface Topic {
  id: string;
  name: string;
  count: number;
}

interface TopicGridProps {
  topics: Topic[];
}

export default function TopicGrid({ topics }: TopicGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = topics.filter((topic) =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (topics.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 px-4 text-center border shadow-sm">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <BookStack className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold">Belum Ada Topik</h3>
          <p className="text-muted-foreground max-w-xs mx-auto text-sm">
            Yuk, mulai bangun Bank Soal Anda dengan membuat topik pertama.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari topik soal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredTopics.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium text-muted-foreground">
            Topik "{searchQuery}" tidak ditemukan
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <Link key={topic.id} href={`/dashboard/guru/questions/${topic.id}`}>
              <Card className="h-full border shadow-sm hover:bg-muted/50 transition-colors group overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="font-semibold uppercase tracking-wider text-[10px]">
                      {topic.count} Soal
                    </Badge>
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <BookStack className="w-4 h-4" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight mt-4">
                    {topic.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs font-medium text-primary">
                    Lihat detail
                    <ArrowRight className="w-3 h-3 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
