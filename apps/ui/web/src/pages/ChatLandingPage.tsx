import { useState } from 'react';
import {
  Menu,
  Send,
  Mic,
  GraduationCap,
  FileText,
  Trophy,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Sidebar from '../components/Sidebar';

export default function ChatLandingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const { isAuthenticated } = useAuth();

  const suggestions = [
    { text: 'Enroll in a Course', icon: GraduationCap },
    { text: 'Submit Assignment', icon: FileText },
    { text: 'Check your results', icon: Trophy },
    { text: 'View unit progress', icon: BarChart3 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      // TODO: Handle chat submission
      setChatInput('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      {/* Sidebar */}
      {isAuthenticated && (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      {/* Top Left Menu Button */}
      {isAuthenticated && (
        <div className='absolute top-6 left-6 z-30'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsSidebarOpen(true)}
            className='hover:bg-white/20 backdrop-blur-sm border border-white/20'
          >
            <Menu className='h-5 w-5' />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className='flex flex-col items-center justify-center min-h-screen px-4 py-8'>
        <div className='w-full max-w-6xl mx-auto text-center space-y-10'>
          {/* Main Heading */}
          <div className='space-y-4'>
            <h1 className='text-6xl md:text-7xl font-bold bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent leading-normal pb-2'>
              Introducing Sample Web App Joel
            </h1>
            <p className='text-2xl md:text-3xl text-gray-600 font-light'>
              Where AI Meets Human Ingenuity
            </p>
          </div>

          {/* Chat Input */}
          <div className='w-full max-w-5xl mx-auto'>
            <form onSubmit={handleSubmit} className='relative'>
              <div className='relative'>
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder='Ask me anything...'
                  className='w-full h-20 pl-10 pr-40 text-2xl bg-white/95 backdrop-blur-md border-3 border-gray-200/70 rounded-[2rem] shadow-2xl hover:shadow-3xl focus:shadow-3xl focus:border-blue-400 transition-all duration-300 placeholder:text-gray-400 font-medium ring-0 focus:ring-4 focus:ring-blue-100/50'
                  style={{
                    fontSize: '1.25rem',
                    lineHeight: '1.75rem',
                  }}
                />
                {/* Voice Button */}
                <button
                  type='button'
                  onClick={() => {
                    // TODO: Handle voice input
                    console.log('Voice input clicked');
                  }}
                  className='absolute right-20 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl hover:bg-gray-100/80 transition-all duration-200 backdrop-blur-sm flex items-center justify-center z-20 border-0 bg-transparent'
                >
                  <Mic className='h-6 w-6 text-gray-500 hover:text-gray-700' />
                </button>
                {/* Send Button */}
                <button
                  type='submit'
                  disabled={!chatInput.trim()}
                  className='absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center z-20 border-0 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Send className='h-6 w-6 text-white' />
                </button>
              </div>
            </form>
          </div>

          {/* Suggestion Buttons */}
          <div className='flex flex-wrap justify-center gap-3 max-w-4xl mx-auto'>
            {suggestions.map((suggestion, index) => {
              const IconComponent = suggestion.icon;
              return (
                <Button
                  key={index}
                  variant='outline'
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className='flex items-center gap-3 px-6 py-4 text-base font-medium bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 rounded-2xl hover:bg-white/90 hover:border-blue-200 hover:shadow-lg transition-all duration-300 text-gray-700 hover:text-blue-700 shadow-md hover:shadow-xl group min-w-[200px] justify-start'
                >
                  <IconComponent className='h-5 w-5 text-blue-500 group-hover:text-blue-600 transition-colors duration-200' />
                  <span className='whitespace-nowrap'>{suggestion.text}</span>
                </Button>
              );
            })}
            <Button
              variant='outline'
              className='flex items-center gap-3 px-6 py-4 text-base font-medium bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 rounded-2xl hover:bg-white/90 hover:border-purple-200 hover:shadow-lg transition-all duration-300 text-gray-700 hover:text-purple-700 shadow-md hover:shadow-xl group min-w-[120px] justify-start'
              onClick={() => {
                // TODO: Handle showing more suggestions
                console.log('Show more suggestions');
              }}
            >
              <MoreHorizontal className='h-5 w-5 text-purple-500 group-hover:text-purple-600 transition-colors duration-200' />
              <span>More</span>
            </Button>
          </div>

          {/* Subtle hint text */}
          <div className='text-sm text-gray-400 space-y-2'>
            <p>Try asking about our features, capabilities, or anything you&apos;d like to know</p>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className='fixed inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl'></div>
          <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl'></div>
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-slate-200/20 to-gray-200/20 rounded-full blur-3xl'></div>
        </div>
      </div>
    </div>
  );
}
