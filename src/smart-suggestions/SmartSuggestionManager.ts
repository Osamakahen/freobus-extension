import { EventEmitter } from 'events';

interface UsagePattern {
  origin: string;
  frequency: number;
  successRate: number;
  averageResponseTime: number;
  lastUsed: number;
}

interface Suggestion {
  origin: string;
  confidence: number;
  reason: string;
}

interface SuggestionEvent {
  type: string;
  suggestions: Suggestion[];
  timestamp: number;
}

export class SmartSuggestionManager extends EventEmitter {
  private static readonly MAX_SUGGESTIONS = 3;
  private static readonly PATTERN_WEIGHTS = {
    frequency: 0.4,
    successRate: 0.3,
    responseTime: 0.2,
    recency: 0.1
  };

  private usagePatterns: Map<string, UsagePattern> = new Map();
  private suggestions: Map<string, Suggestion[]> = new Map();

  constructor() {
    super();
  }

  public async getNetworkSuggestions(origin: string): Promise<string[]> {
    const patterns = await this.analyzeUsagePatterns(origin);
    const suggestions = await this.calculateNetworkSuggestions(patterns);
    return suggestions.slice(0, SmartSuggestionManager.MAX_SUGGESTIONS);
  }

  public async getDAppSuggestions(): Promise<string[]> {
    const patterns = Array.from(this.usagePatterns.entries());
    const suggestions = await this.calculateDAppSuggestions(patterns);
    return suggestions.slice(0, SmartSuggestionManager.MAX_SUGGESTIONS);
  }

  public async updateUsagePattern(origin: string, success: boolean, responseTime: number): Promise<void> {
    const currentPattern = this.usagePatterns.get(origin) || {
      origin,
      frequency: 0,
      successRate: 0,
      averageResponseTime: 0,
      lastUsed: 0
    };

    const newPattern: UsagePattern = {
      origin,
      frequency: currentPattern.frequency + 1,
      successRate: this.calculateNewSuccessRate(currentPattern, success),
      averageResponseTime: this.calculateNewAverageResponseTime(currentPattern, responseTime),
      lastUsed: Date.now()
    };

    this.usagePatterns.set(origin, newPattern);
    await this.updateSuggestions(origin);
  }

  private async analyzeUsagePatterns(origin: string): Promise<UsagePattern[]> {
    const patterns: UsagePattern[] = [];
    for (const [key, pattern] of this.usagePatterns.entries()) {
      if (key !== origin) {
        patterns.push(pattern);
      }
    }
    return patterns;
  }

  private async calculateNetworkSuggestions(patterns: UsagePattern[]): Promise<string[]> {
    const scoredPatterns = patterns.map(pattern => ({
      pattern,
      score: this.calculatePatternScore(pattern)
    }));

    return scoredPatterns
      .sort((a, b) => b.score - a.score)
      .map(sp => sp.pattern.origin);
  }

  private async calculateDAppSuggestions(patterns: [string, UsagePattern][]): Promise<string[]> {
    const scoredPatterns = patterns.map(([origin, pattern]) => ({
      origin,
      score: this.calculatePatternScore(pattern)
    }));

    return scoredPatterns
      .sort((a, b) => b.score - a.score)
      .map(sp => sp.origin);
  }

  private calculatePatternScore(pattern: UsagePattern): number {
    const normalizedFrequency = pattern.frequency / Math.max(1, Math.max(...Array.from(this.usagePatterns.values()).map(p => p.frequency)));
    const normalizedResponseTime = 1 - (pattern.averageResponseTime / 1000); // Assuming max response time of 1 second
    const normalizedRecency = 1 - ((Date.now() - pattern.lastUsed) / (24 * 60 * 60 * 1000)); // Normalize to 24 hours

    return (
      normalizedFrequency * SmartSuggestionManager.PATTERN_WEIGHTS.frequency +
      pattern.successRate * SmartSuggestionManager.PATTERN_WEIGHTS.successRate +
      normalizedResponseTime * SmartSuggestionManager.PATTERN_WEIGHTS.responseTime +
      normalizedRecency * SmartSuggestionManager.PATTERN_WEIGHTS.recency
    );
  }

  private calculateNewSuccessRate(currentPattern: UsagePattern, success: boolean): number {
    const totalAttempts = currentPattern.frequency;
    const currentSuccesses = currentPattern.successRate * totalAttempts;
    return (currentSuccesses + (success ? 1 : 0)) / (totalAttempts + 1);
  }

  private calculateNewAverageResponseTime(currentPattern: UsagePattern, newResponseTime: number): number {
    const totalAttempts = currentPattern.frequency;
    const currentTotalTime = currentPattern.averageResponseTime * totalAttempts;
    return (currentTotalTime + newResponseTime) / (totalAttempts + 1);
  }

  private async updateSuggestions(origin: string): Promise<void> {
    const networkSuggestions = await this.getNetworkSuggestions(origin);
    const dAppSuggestions = await this.getDAppSuggestions();

    const suggestions = [
      ...networkSuggestions.map(ns => ({
        origin: ns,
        confidence: this.calculateSuggestionConfidence(ns),
        reason: 'Based on network usage patterns'
      })),
      ...dAppSuggestions.map(ds => ({
        origin: ds,
        confidence: this.calculateSuggestionConfidence(ds),
        reason: 'Based on dApp usage patterns'
      }))
    ];

    this.suggestions.set(origin, suggestions);
    this.emit('suggestionUpdate', {
      type: 'suggestionUpdate',
      suggestions,
      timestamp: Date.now()
    } as SuggestionEvent);
  }

  private calculateSuggestionConfidence(origin: string): number {
    const pattern = this.usagePatterns.get(origin);
    if (!pattern) return 0;
    return this.calculatePatternScore(pattern);
  }
} 