'use client';

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import SearchBox from "./SearchBox";
import TrendingTopics from "./TrendingTopics";
import AuthModal from "./AuthModal";
import { useAuth } from "../context/auth-context";

const features = [
  {
    title: 'Fast',
    description: 'Lightning-fast search results powered by advanced algorithms',
    icon: 'fast.svg',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Private',
    description: 'Your privacy comes first - no tracking, no data collection',
    icon: 'private.svg',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Unbiased',
    description: 'Neutral search results without any hidden agenda',
    icon: 'unbiased.svg',
    gradient: 'from-amber-500 to-orange-500'
  }
];

function HomeContent() {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 font-jakarta">
      <div className="w-full max-w-5xl pt-16 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Image
              src="/nova-logo.svg"
              alt="Nova Search"
              width={32}
              height={32}
              className="text-blue-500 dark:text-blue-400"
              priority
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 
              to-purple-500 bg-clip-text text-transparent font-grotesk">
              Nova Search
            </h1>
          </div>
          <button 
            onClick={() => setAuthModalOpen(true)}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
              hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full 
              transition-colors"
          >
            {isAuthenticated ? 'My Account' : 'Sign In'}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center gap-16 mt-32 mb-16">
          {/* Main Logo */}
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <Image
                src="/nova-logo.svg"
                alt="Nova Search"
                width={80}
                height={80}
                className="text-blue-500 dark:text-blue-400"
                priority
              />
            </div>
            <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-500 
              via-purple-500 to-pink-500 bg-clip-text text-transparent 
              font-grotesk tracking-tight animate-gradient">
              Nova Search
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              Fast, private, and unbiased search for the modern web
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full max-w-2xl">
            <SearchBox onSearch={handleSearch} />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="group flex flex-col items-center p-6 rounded-xl 
                  bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} 
                  flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Image
                    src={`/icons/${feature.icon}`}
                    alt={feature.title}
                    width={24}
                    height={24}
                    className="text-white"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="w-full max-w-2xl mt-8">
        <TrendingTopics onTopicClick={handleSearch} />
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default HomeContent;
