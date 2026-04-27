/**
 * Onboarding Wizard
 * First-run setup wizard for new users
 */

import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Instagram, Palette, Zap, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirebase } from '../lib/FirebaseProvider';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Nicola Hub',
    subtitle: 'Your personal content command center',
    icon: Zap,
    content: {
      title: 'Create amazing content',
      description: 'We help you create, schedule, and analyze your Instagram content with AI-powered tools.'
    }
  },
  {
    id: 'connect',
    title: 'Connect your accounts',
    subtitle: 'Link your social media accounts',
    icon: Instagram,
    content: {
      title: 'Connect Instagram',
      description: 'Link your Instagram Business account to publish directly and track analytics.'
    }
  },
  {
    id: 'create',
    title: 'Create your first post',
    subtitle: 'Start with AI assistance',
    icon: Palette,
    content: {
      title: 'Generate content with AI',
      description: 'Use our AI generator to create engaging captions and scripts tailored to your audience.'
    }
  },
  {
    id: 'schedule',
    title: 'Plan your content',
    subtitle: 'Build your content calendar',
    icon: Calendar,
    content: {
      title: 'Schedule strategically',
      description: 'Use our analytics to find the best times to post and maintain consistency.'
    }
  }
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { user } = useFirebase();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
      setTimeout(onComplete, 1500);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-paper/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
        <div className="bg-card border border-brd rounded-3xl p-12 max-w-lg text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-light rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check size={40} className="text-green-custom" />
          </div>
          <h2 className="font-display text-3xl font-bold mb-3">You're all set!</h2>
          <p className="text-ink-muted">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];
  const IconComponent = step.icon;

  return (
    <div className="fixed inset-0 bg-paper/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-card border border-brd rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-accent/5 border-b border-brd p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center">
              <IconComponent size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-accent font-bold uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</p>
              <h2 className="font-display text-xl font-bold">{step.title}</h2>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-ink-muted hover:text-ink p-2 rounded-xl hover:bg-paper transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-paper">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-12">
          <div className="text-center mb-12">
            <div className="w-32 h-32 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <IconComponent size={64} className="text-accent" />
            </div>
            <h3 className="font-display text-4xl font-bold mb-4">{step.content.title}</h3>
            <p className="text-ink-muted text-lg max-w-md mx-auto">{step.content.description}</p>
          </div>

          {/* Features list for welcome step */}
          {currentStep === 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Palette, label: 'Create' },
                { icon: Calendar, label: 'Schedule' },
                { icon: Zap, label: 'Analyze' }
              ].map((item, i) => (
                <div key={i} className="bg-paper border border-brd rounded-2xl p-4 text-center">
                  <item.icon size={24} className="mx-auto mb-2 text-accent" />
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-brd p-6 flex items-center justify-between bg-paper/50">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentStep ? "bg-accent w-6" : i < currentStep ? "bg-accent/40" : "bg-brd"
                )}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border border-brd hover:bg-paper transition-colors"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
