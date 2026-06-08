import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { SEO } from "@/components/site/SEO";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { BlogList } from "@/components/admin/BlogList";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { ProjectList } from "@/components/admin/ProjectList";
import { StackForm } from "@/components/admin/StackForm";
import { StackList } from "@/components/admin/StackList";
import { SpecializationForm } from "@/components/admin/SpecializationForm";
import { SpecializationList } from "@/components/admin/SpecializationList";
import { FeaturedInsightsForm } from "@/components/admin/FeaturedInsightsForm";
import { FeaturedInsightsList } from "@/components/admin/FeaturedInsightsList";
import { ResearchProjectForm } from "@/components/admin/ResearchProjectForm";
import { ResearchProjectList } from "@/components/admin/ResearchProjectList";
import { ArtifactForm } from "@/components/admin/ArtifactForm";
import { ArtifactList } from "@/components/admin/ArtifactList";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingStack, setEditingStack] = useState<any>(null);
  const [editingSpec, setEditingSpec] = useState<any>(null);
  const [editingInsight, setEditingInsight] = useState<any>(null);
  const [editingResearch, setEditingResearch] = useState<any>(null);
  const [editingArtifact, setEditingArtifact] = useState<any>(null);

  const tabsListRef = useRef<HTMLDivElement>(null);
  
  const scrollTabs = (dir: 'left' | 'right') => {
    if (tabsListRef.current) {
      const scrollAmount = 200;
      tabsListRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container pt-28 pb-12 md:pt-32 md:pb-24"
    >
      <SEO title="Admin Dashboard | Your Portfolio" description="CMS Dashboard." />
      <header className="relative flex flex-col items-center justify-center mb-12 gap-6 text-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Dashboard</h1>
          <p className="text-lg text-muted-foreground">Welcome back, {user?.email}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="outline" asChild>
            <a href="/analytics">View Analytics</a>
          </Button>
          <Button variant="outline" onClick={signOut}>Sign Out</Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="blog" className="w-full group">
          <div className="relative w-full flex items-center mb-8">
            {/* Desktop Scroll Left Button */}
            <button 
              onClick={() => scrollTabs('left')}
              className="absolute left-0 z-10 hidden md:flex items-center justify-center w-8 h-full bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-primary" />
            </button>

            <TabsList 
              ref={tabsListRef}
              className="p-1 glass bg-background/50 flex flex-nowrap overflow-x-auto justify-start w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            >
              <TabsTrigger value="blog" className="data-[state=active]:bg-primary/20 whitespace-nowrap">Manage Blogs</TabsTrigger>
              <TabsTrigger value="featured_insights" className="data-[state=active]:bg-primary/20 whitespace-nowrap">Featured Insights</TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-primary/20 whitespace-nowrap">Manage Projects</TabsTrigger>
              <TabsTrigger value="research" className="data-[state=active]:bg-primary/20 whitespace-nowrap">Manage Research</TabsTrigger>
              <TabsTrigger value="artifacts" className="data-[state=active]:bg-primary/20 whitespace-nowrap">Manage Artifacts</TabsTrigger>
              <TabsTrigger value="stack" className="data-[state=active]:bg-primary/20 whitespace-nowrap">Manage Stack</TabsTrigger>
              <TabsTrigger value="hero_specializations" className="data-[state=active]:bg-primary/20 whitespace-nowrap">Manage Hero</TabsTrigger>
            </TabsList>

            {/* Desktop Scroll Right Button */}
            <button 
              onClick={() => scrollTabs('right')}
              className="absolute right-0 z-10 hidden md:flex items-center justify-center w-8 h-full bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          </div>
          
          <TabsContent value="blog">
            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">{editingBlog ? 'Edit Post' : 'Create New Post'}</h2>
              <ErrorBoundary>
                <BlogEditor 
                  key={editingBlog ? editingBlog.id : 'new'} 
                  initialData={editingBlog} 
                  onSuccess={() => setEditingBlog(null)} 
                  onCancelEdit={() => setEditingBlog(null)} 
                />
                {!editingBlog && <BlogList onEdit={setEditingBlog} />}
              </ErrorBoundary>
            </div>
          </TabsContent>
          
          <TabsContent value="projects">
            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
              <ErrorBoundary>
                <ProjectForm 
                  key={editingProject ? editingProject.id : 'new'}
                  initialData={editingProject}
                  onSuccess={() => setEditingProject(null)}
                  onCancelEdit={() => setEditingProject(null)}
                />
                {!editingProject && <ProjectList onEdit={setEditingProject} />}
              </ErrorBoundary>
            </div>
          </TabsContent>
          
          <TabsContent value="stack">
            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">{editingStack ? 'Edit Skill' : 'Add New Skill'}</h2>
              <ErrorBoundary>
                <StackForm 
                  key={editingStack ? editingStack.id : 'new'}
                  initialData={editingStack}
                  onSuccess={() => setEditingStack(null)}
                  onCancelEdit={() => setEditingStack(null)}
                />
                {!editingStack && <StackList onEdit={setEditingStack} />}
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="hero_specializations" className="space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">{editingSpec ? 'Edit Specialization' : 'Add New Specialization'}</h2>
              <ErrorBoundary>
                <SpecializationForm 
                  key={editingSpec ? editingSpec.id : 'new'}
                  initialData={editingSpec}
                  onSuccess={() => setEditingSpec(null)}
                  onCancelEdit={() => setEditingSpec(null)}
                />
                {!editingSpec && <SpecializationList onEdit={setEditingSpec} />}
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="research" className="space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">{editingResearch ? 'Edit Research Project' : 'Add New Research Project'}</h2>
              <ErrorBoundary>
                <ResearchProjectForm 
                  key={editingResearch ? editingResearch.id : 'new'}
                  initialData={editingResearch}
                  onSuccess={() => setEditingResearch(null)}
                  onCancelEdit={() => setEditingResearch(null)}
                />
                {!editingResearch && <ResearchProjectList onEdit={setEditingResearch} />}
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="artifacts" className="space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">{editingArtifact ? 'Edit Artifact' : 'Upload New Artifact'}</h2>
              <ErrorBoundary>
                <ArtifactForm 
                  key={editingArtifact ? editingArtifact.id : 'new'}
                  initialData={editingArtifact}
                  onSuccess={() => setEditingArtifact(null)}
                  onCancelEdit={() => setEditingArtifact(null)}
                />
                {!editingArtifact && <ArtifactList onEdit={setEditingArtifact} />}
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="featured_insights" className="space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">{editingInsight ? 'Edit Featured Insight' : 'Feature a Blog Post'}</h2>
              <ErrorBoundary>
                <FeaturedInsightsForm 
                  key={editingInsight ? editingInsight.id : 'new'}
                  initialData={editingInsight}
                  onSuccess={() => setEditingInsight(null)}
                  onCancelEdit={() => setEditingInsight(null)}
                />
                {!editingInsight && <FeaturedInsightsList onEdit={setEditingInsight} />}
              </ErrorBoundary>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.main>
  );
};
export default Dashboard;
