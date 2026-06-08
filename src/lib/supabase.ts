import { projects } from '../data/projects';
import { posts } from '../data/posts';
import { aboutSkills } from '../data/about';

const mockData = {
  projects: projects,
  hero_specializations: aboutSkills.map((s, i) => ({ id: i, title: s.name, description: s.description, icon: 'Code2', order_index: i })),
  stack_skills: aboutSkills.map((s, i) => ({ id: i, name: s.name, category: 'Frontend', level: 90, order_index: i })),
  posts: posts,
  local_blog_tags: [],
  research_projects: [],
  page_views: [],
  artifact_downloads: [],
  artifacts: [],
  contact_messages: []
};

class ChainableMock {
  tableName: string;
  isMutation: boolean = false;
  
  constructor(tableName: string) {
    this.tableName = tableName;
  }
  select() { return this; }
  order() { return this; }
  eq() { return this; }
  limit() { return this; }
  
  maybeSingle() {
    const data = mockData[this.tableName as keyof typeof mockData] || [];
    return Promise.resolve({ data: data[0] || null, error: null });
  }
  single() {
    const data = mockData[this.tableName as keyof typeof mockData] || [];
    return Promise.resolve({ data: data[0] || null, error: null });
  }
  
  insert() { 
    if (typeof window !== 'undefined') alert("This is a template. Database mutations are disabled.");
    this.isMutation = true;
    return this; 
  }
  update() { 
    if (typeof window !== 'undefined') alert("This is a template. Database mutations are disabled.");
    this.isMutation = true;
    return this; 
  }
  delete() { 
    if (typeof window !== 'undefined') alert("This is a template. Database mutations are disabled.");
    this.isMutation = true;
    return this; 
  }

  // Make it a "thenable" so `await` works
  then(resolve: any) {
    if (this.isMutation) {
      resolve({ data: null, error: null });
      return;
    }
    const data = mockData[this.tableName as keyof typeof mockData] || [];
    resolve({ data, error: null });
  }
}

export const supabase = {
  from: (tableName: string) => new ChainableMock(tableName),
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  }
} as any;
