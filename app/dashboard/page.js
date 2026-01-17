'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, FileText, Clock, Sparkles, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  // Use global auth state
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <>
        {/* Top Section */}
        <section className="container mx-auto px-4 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center space-y-4 max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Your personalized study hub powered by AI
            </p>
          </motion.div>
        </section>

        {/* Content Section */}
        <section className="container mx-auto px-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              /* Loading State */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12"
              >
                <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-400">Loading...</p>
              </motion.div>
            ) : !isAuthenticated ? (
              /* Not Logged In State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              >
                <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 backdrop-blur-xl shadow-2xl max-w-2xl mx-auto">
                  <CardContent className="p-12 text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                      <Brain className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold text-white">
                        Sign in to unlock your personalized dashboard
                      </h2>
                      <p className="text-gray-400">
                        Access your saved notes, recent activity, and AI-powered study materials
                      </p>
                    </div>
                    <div className="pt-4">
                      <Link href="/login">
                        <Button
                          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 hover:scale-105"
                        >
                          <LogIn className="w-5 h-5 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              /* Logged In State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                className="space-y-8"
              >
                {/* User Greeting */}
                <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Hello, {user?.name || user?.email?.split('@')[0] || 'User'}!
                        </h2>
                        <p className="text-gray-400">Ready to continue your learning journey?</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Saved Notes Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-6 h-6 text-purple-400" />
                      Saved Notes
                    </h3>
                    <Button
                      variant="outline"
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-900/30"
                    >
                      View All
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((item) => (
                      <Card
                        key={item}
                        className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                      >
                        <CardHeader>
                          <CardTitle className="text-white text-lg line-clamp-1">
                            Sample Note {item}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            Created 2 days ago
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-300 line-clamp-3">
                            This is a placeholder note. Your saved notes will appear here once you start creating them.
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Recent Activity Section */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-6 h-6 text-purple-400" />
                    Recent Activity
                  </h3>
                  <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="flex items-start gap-4 pb-4 border-b border-purple-500/20 last:border-0 last:pb-0"
                          >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/50 to-fuchsia-600/50 flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-purple-300" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">
                                Processed video: Sample Video {item}
                              </p>
                              <p className="text-sm text-gray-400">
                                {item} hour{item > 1 ? 's' : ''} ago
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </div>
        </section>
    </>
  );
}
