// TypeScript interfaces for the extension

export interface KeystrokeEvent {
  key: string;
  timestamp: number;
  duration: number;
  fieldType?: 'card' | 'cvv' | 'zip';
}

export interface BehavioralBaseline {
  typingSpeed: number;
  rhythm: number;
  keystrokeCount: number;
  pattern: KeystrokeEvent[];
}

export interface Stats {
  transactionsProtected: number;
  threatsBlocked: number;
  protectionActive: boolean;
}

export interface StorageData {
  behavioralBaseline?: BehavioralBaseline;
  onboardingComplete?: boolean;
  userId?: string;
  stats?: Stats;
}
