import React from 'react';
import { FileText, Lock, CloudUpload, Key, Sparkles, ArrowRight } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Hero Section with animated background */}
      <section className="relative pt-24 pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800/30 dark:to-gray-900 -z-10"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-24 right-[10%] w-64 h-64 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-12 left-[15%] w-72 h-72 bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-block px-4 py-1.5 mb-6 bg-blue-50 dark:bg-blue-900/30 rounded-full shadow-sm transform hover:scale-105 transition-transform duration-300">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center">
              <Sparkles className="w-4 h-4 mr-1" />
              LUKSO Mini-App
            </span>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Notes <span className="text-blue-600 dark:text-blue-400">On-Chain</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Blockchain-integrated note-taking powered by LUKSO Universal Profiles. <br /> Your notes go where you go.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a
              href="#features"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-300"
            >
              <FileText className="w-5 h-5 mr-2" />
              Start Taking Notes
            </a>
            <a
              href="https://docs.lukso.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-md hover:shadow-lg"
            >
              Learn About LUKSO
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid with hover effects */}
      <section id="features" className="py-24 bg-gray-50 dark:bg-gray-800 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 -z-10"></div>
        
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Your notes, on the blockchain
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
            Everything you write is stored on Pinata's IPFS network with blockchain references, accessible via your Universal Profile.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mb-6">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Controlled Access
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Notes stored on Pinata's IPFS network. Access is limited to you and the application service.
              </p>
            </div>
            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 mb-6">
                <CloudUpload className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                On-Chain Storage
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                IPFS hashes stored on your Universal Profile using LSP2 metadata. Your notes move with your profile.
              </p>
            </div>
            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 mb-6">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Rich Editor
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Powerful rich text editing with version history and formatting options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section with better visual styling */}
      <section className="py-24 bg-white dark:bg-gray-900 relative">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gray-50 dark:bg-gray-800/30 -z-10 rounded-l-3xl"></div>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
            A seamless experience from start to finish
          </p>
          <div className="space-y-8">
            <div className="flex items-start p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold mr-6 text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Connect Your Profile
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Sign in with your Universal Profile to access your notes.
                </p>
              </div>
            </div>
            <div className="flex items-start p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold mr-6 text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Create & Edit Notes
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Write notes with our feature-rich editor, supporting formatting and organization.
                </p>
              </div>
            </div>
            <div className="flex items-start p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold mr-6 text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  IPFS Storage
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Notes are uploaded to Pinata's IPFS network. They're accessible to you through your Universal Profile and to the application service.
                </p>
              </div>
            </div>
            <div className="flex items-start p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold mr-6 text-lg">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Blockchain Integration
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  IPFS hashes are stored in your Universal Profile's LSP2 metadata as verifiableURIs, linking you to your content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with gradient background */}
      <section className="py-24 relative overflow-hidden bg-blue-500">
        
        {/* Decorative elements with better visibility */}
        <div className="absolute top-20 right-[10%] w-96 h-96 bg-blue-400/30 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-20 left-[10%] w-96 h-96 bg-purple-400/30 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="p-10 rounded-3xl border border-white/30">
            <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
              Ready to start your blockchain notes journey?
            </h2>
            <p className="text-xl text-white mb-10 max-w-2xl mx-auto drop-shadow-lg">
              Keep your notes connected to your Universal Profile with blockchain references.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a
                href="https://universaleverything.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white text-blue-800 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-bold"
              >
                Visit Universal Everything
              </a>
              <a
                href="https://docs.lukso.tech/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white/30 transition-all inline-flex items-center justify-center font-bold shadow-lg"
              >
                Learn About Universal Profiles
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};