import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Eye } from 'lucide-react';

interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  metadata: {
    readTime: number;
    wordCount: number;
    featuredImage?: string;
  };
  viewCount: number;
  likes: string[];
  comments: string[];
  createdAt: string;
  tags: string[];
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onClick: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onClick }) => {
  const isLiked = false; // You would get this from state

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {post.metadata.featuredImage && (
        <img
          src={post.metadata.featuredImage}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={`${post.author.firstName} ${post.author.lastName}`}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <span className="text-sm font-medium">
                  {post.author.firstName[0]}{post.author.lastName[0]}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {post.author.firstName} {post.author.lastName}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt))} ago
          </span>
        </div>

        <h2 
          className="text-xl font-bold mb-3 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => onClick(post._id)}
        >
          {post.title}
        </h2>

        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {post.content.substring(0, 200)}...
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onLike(post._id)}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-500' : 'hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes.length}</span>
            </button>

            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments.length}</span>
            </div>

            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount}</span>
            </div>
          </div>

          <span className="text-xs">
            {post.metadata.readTime} min read
          </span>
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;
