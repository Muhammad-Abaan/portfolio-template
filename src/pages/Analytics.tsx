import { SEO } from "@/components/site/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { Loader2, TrendingUp, Users, Download, Mail, Activity, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Colors for charts
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const Analytics = () => {
  // Fetch all necessary analytics data in parallel
  const { data, isLoading } = useQuery({
    queryKey: ['analytics_dashboard'],
    queryFn: async () => {
      // Execute all queries in parallel for speed
      const [
        { data: pageViews },
        { data: downloads },
        { data: artifacts },
        { data: messages },
        { data: posts }
      ] = await Promise.all([
        supabase.from('page_views').select('*').order('created_at', { ascending: true }),
        supabase.from('artifact_downloads').select('*, artifacts(title, file_size)'),
        supabase.from('artifacts').select('*'),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: true }),
        supabase.from('posts').select('*')
      ]);

      return {
        pageViews: pageViews || [],
        downloads: downloads || [],
        artifacts: artifacts || [],
        messages: messages || [],
        posts: posts || []
      };
    },
    // Refresh every 30 seconds
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return (
      <main className="container py-24 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  // --- 1. GLOBAL TRAFFIC METRICS ---
  
  // Aggregate page views by date (for Traffic Heatmap)
  const viewsByDate = data.pageViews.reduce((acc: any, view: any) => {
    const date = new Date(view.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const trafficChartData = Object.keys(viewsByDate).map(date => ({ date, views: viewsByDate[date] })).slice(-14); // Last 14 active days

  // Top Pages
  const pagePopularity = data.pageViews.reduce((acc: any, view: any) => {
    // Group all specific blog posts under /blog/... and projects under /projects/... if needed, 
    // but tracking exact paths is better.
    let path = view.path === '/' ? 'Home' : view.path;
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {});
  const topPagesData = Object.entries(pagePopularity)
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, 5)
    .map(([name, views]) => ({ name: name.replace('/','').substring(0, 20) || 'Home', views }));

  // Referral Sources
  const referrers = data.pageViews.reduce((acc: any, view: any) => {
    let ref = view.referrer || 'Direct';
    if (ref.includes('linkedin')) ref = 'LinkedIn';
    else if (ref.includes('github')) ref = 'GitHub';
    else if (ref.includes('google')) ref = 'Google';
    else if (ref.includes('twitter') || ref.includes('t.co')) ref = 'Twitter';
    else if (ref !== 'Direct') ref = 'Other Web';
    
    acc[ref] = (acc[ref] || 0) + 1;
    return acc;
  }, {});
  const referrerData = Object.entries(referrers).map(([name, value]) => ({ name, value }));

  // --- 2. CONTENT & BLOG ENGAGEMENT ---
  
  // Interaction Ratio & Total Likes
  const totalLikes = data.posts.reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0);
  const blogViews = data.pageViews.filter((v: any) => v.path.startsWith('/blog/')).length;
  const interactionRatio = blogViews > 0 ? ((totalLikes / blogViews) * 100).toFixed(1) : 0;

  // Scroll Depth (Average max scroll depth on blog posts)
  const blogVisits = data.pageViews.filter((v: any) => v.path.startsWith('/blog/'));
  const scrollDistribution = { '25%': 0, '50%': 0, '75%': 0, '100%': 0 };
  blogVisits.forEach((v: any) => {
    if (v.max_scroll_depth >= 90) scrollDistribution['100%']++;
    else if (v.max_scroll_depth >= 70) scrollDistribution['75%']++;
    else if (v.max_scroll_depth >= 40) scrollDistribution['50%']++;
    else scrollDistribution['25%']++;
  });
  const scrollData = Object.entries(scrollDistribution).map(([depth, count]) => ({ depth, count }));

  // Read-Velocity (Time spent on blogs)
  const avgTimeOnBlog = blogVisits.length > 0 
    ? (blogVisits.reduce((sum: number, v: any) => sum + (v.time_spent_seconds || 0), 0) / blogVisits.length) 
    : 0;

  // --- 3. ARTIFACT & DOWNLOAD ANALYTICS ---
  
  // Conversion Rate (Total Unique Downloads / Artifacts Page Views)
  const artifactsPageViews = data.pageViews.filter((v: any) => v.path === '/artifacts').length;
  const uniqueDownloads = new Set(data.downloads.map((d: any) => d.session_id)).size;
  const artifactConversionRate = artifactsPageViews > 0 ? ((uniqueDownloads / artifactsPageViews) * 100).toFixed(1) : 0;

  // Asset Popularity Index
  const downloadCounts = data.downloads.reduce((acc: any, d: any) => {
    const title = d.artifacts?.title || 'Unknown';
    acc[title] = (acc[title] || 0) + 1;
    return acc;
  }, {});
  const popularityData = Object.entries(downloadCounts)
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, 5)
    .map(([name, downloads]) => ({ name: name.substring(0, 15) + '...', downloads }));

  // Bandwidth Outflow Calculation
  let totalBandwidthMB = 0;
  data.downloads.forEach((d: any) => {
    const sizeStr = d.artifacts?.file_size || "0 MB";
    const val = parseFloat(sizeStr);
    if (sizeStr.includes('MB')) totalBandwidthMB += val;
    else if (sizeStr.includes('GB')) totalBandwidthMB += (val * 1024);
    else if (sizeStr.includes('KB')) totalBandwidthMB += (val / 1024);
  });

  // --- 4. DIRECT INQUIRIES ---
  
  // Message Velocity
  const messagesByDate = data.messages.reduce((acc: any, msg: any) => {
    const date = new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const messageData = Object.keys(messagesByDate).map(date => ({ date, messages: messagesByDate[date] }));


  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container pt-28 pb-12 md:pt-32 md:pb-24"
    >
      <SEO title="Analytics Command Center | Your Portfolio" description="Private tracking dashboard." />
      
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent pb-2">Analytics Command Center</h1>
        <p className="text-lg text-muted-foreground">Deep tracking metrics for portfolio's traffic, engagement, and conversions.</p>
      </header>

      {/* TOP-LEVEL METRICS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Page Views</p>
                <p className="text-3xl font-bold">{data.pageViews.length}</p>
              </div>
              <div className="p-2 bg-primary/20 rounded-lg"><Activity className="w-5 h-5 text-primary" /></div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-400">
              <TrendingUp className="w-3 h-3 mr-1" /> Active Tracking
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Artifact Downloads</p>
                <p className="text-3xl font-bold">{data.downloads.length}</p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg"><Download className="w-5 h-5 text-purple-400" /></div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {artifactConversionRate}% conversion rate
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Inquiries</p>
                <p className="text-3xl font-bold">{data.messages.length}</p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg"><Mail className="w-5 h-5 text-green-400" /></div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              Via Contact Form
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Bandwidth Outflow</p>
                <p className="text-3xl font-bold">{(totalBandwidthMB / 1024).toFixed(2)} GB</p>
              </div>
              <div className="p-2 bg-orange-500/20 rounded-lg"><ArrowUpRight className="w-5 h-5 text-orange-400" /></div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              Transferred via artifacts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Traffic Heatmap */}
        <Card className="bg-background/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Traffic Heatmap</CardTitle>
            <CardDescription>Page views over the last active days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#333333' }}
                  itemStyle={{ color: '#333333' }}
                  labelStyle={{ color: '#666666' }}
                />
                <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel & Top Pages */}
        <Card className="bg-background/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Funnel & Discoverability</CardTitle>
            <CardDescription>Most visited pages driving traffic</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPagesData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={80} stroke="#666666" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#333333' }}
                  itemStyle={{ color: '#333333' }}
                  labelStyle={{ color: '#666666' }}
                />
                <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Popularity Index */}
        <Card className="bg-background/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Asset Popularity Index</CardTitle>
            <CardDescription>Most downloaded artifacts</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularityData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#666666" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#333333' }}
                  itemStyle={{ color: '#333333' }}
                  labelStyle={{ color: '#666666' }}
                />
                <Bar dataKey="downloads" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Attribution (Pie Chart) & Engagement */}
        <Card className="bg-background/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Referral Attribution & Engagement</CardTitle>
            <CardDescription>Where traffic comes from</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={referrerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {referrerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#333333' }}
                    itemStyle={{ color: '#333333' }}
                    labelStyle={{ color: '#666666' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-1/2 h-full flex flex-col justify-center space-y-6 px-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Blog Read Time</p>
                <p className="text-2xl font-bold">{(avgTimeOnBlog / 60).toFixed(1)} mins</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Blog Interaction Ratio</p>
                <p className="text-2xl font-bold text-pink-400">{interactionRatio}%</p>
                <p className="text-xs text-muted-foreground">Likes per View</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scroll Depth Heatmaps */}
        <Card className="bg-background/40 border-white/10 backdrop-blur-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Blog Scroll Depth Heatmap</CardTitle>
            <CardDescription>Tracking deep reading vs skimming on blog articles</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scrollData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="depth" stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#333333' }}
                  itemStyle={{ color: '#333333' }}
                  labelStyle={{ color: '#666666' }}
                />
                <Bar dataKey="count" name="Sessions reached depth" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </motion.main>
  );
};

export default Analytics;
