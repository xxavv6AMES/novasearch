'use client';

interface TrendingTopicsProps {
  onTopicClick: (topic: string) => void;
}

// These would ideally come from an API, but for now we'll use static topics
const TRENDING_TOPICS = [
  'Artificial Intelligence',
  'Sustainable Energy',
  'Space Exploration',
  'Quantum Computing',
  'Climate Action',
  'Digital Privacy',
];

export default function TrendingTopics({ onTopicClick }: TrendingTopicsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 font-grotesk">
        Trending Topics
      </h2>
      <div className="flex flex-wrap gap-2">
        {TRENDING_TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => onTopicClick(topic)}
            className="px-4 py-2 rounded-full text-sm bg-gray-100 dark:bg-gray-800 
                     text-gray-700 dark:text-gray-300 hover:bg-gray-200 
                     dark:hover:bg-gray-700 transition-colors font-jakarta"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
