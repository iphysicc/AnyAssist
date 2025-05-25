"use client";
import { Sidebar } from '@/components/Sidebar';
import { ChatContainer } from '@/components/ChatContainer';

export default function Home() {
  return (
    <div className="h-full flex">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <div className="flex-1 h-full">
        <ChatContainer />
      </div>
    </div>
  );
}
