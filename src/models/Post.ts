import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  metadata: {
    readTime: number;
    wordCount: number;
    featuredImage?: string;
  };
  slug: string;
}

const postSchema = new Schema<IPost>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  metadata: {
    readTime: {
      type: Number,
      default: 0
    },
    wordCount: {
      type: Number,
      default: 0
    },
    featuredImage: String
  },
  slug: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ slug: 1 });

// Middleware to calculate read time and word count
postSchema.pre('save', function(next) {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  this.metadata.wordCount = wordCount;
  this.metadata.readTime = Math.ceil(wordCount / wordsPerMinute);
  
  // Generate slug if not present
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

export default mongoose.model<IPost>('Post', postSchema);
