import type { Question } from '../lib/api';

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday as start of week
  d.setDate(diff);
  // Reset time to start of day for consistent comparison
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekLabel(date: Date): string {
  const now = new Date();
  const weekStart = getWeekStart(date);
  const currentWeekStart = getWeekStart(now);
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  // Check if it's this week
  if (weekStart.getTime() === currentWeekStart.getTime()) {
    return 'This Week';
  }
  
  // Check if it's last week
  if (weekStart.getTime() === lastWeekStart.getTime()) {
    return 'Last Week';
  }
  
  // Check if it's this year
  if (weekStart.getFullYear() === now.getFullYear()) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}`;
    } else {
      return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}`;
    }
  }
  
  // Different year
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function groupQuestionsByWeek(questions: Question[]): Array<{ weekLabel: string; weekStart: Date; questions: Question[] }> {
  // Group questions by week
  const groups = new Map<string, { weekStart: Date; questions: Question[] }>();
  
  questions.forEach(question => {
    const answeredDate = question.respondedAt ? new Date(question.respondedAt) : new Date(question.createdAt);
    const weekStart = getWeekStart(answeredDate);
    const weekKey = weekStart.toISOString();
    
    if (!groups.has(weekKey)) {
      groups.set(weekKey, { weekStart, questions: [] });
    }
    
    groups.get(weekKey)!.questions.push(question);
  });
  
  // Convert to array and sort by week (newest first)
  return Array.from(groups.entries())
    .map(([_, group]) => ({
      weekLabel: getWeekLabel(group.weekStart),
      weekStart: group.weekStart,
      questions: group.questions.sort((a, b) => b.upvotes - a.upvotes) // Sort by upvotes within week
    }))
    .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()); // Sort weeks newest first
}
