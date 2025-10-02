/*
 * Copyright 2025 Sean M. Dalton
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Get the base website title from environment variables
 */
export function getBaseTitle(): string {
  return import.meta.env.VITE_WEBSITE_TITLE || 'AMA App';
}

/**
 * Set the document title with team and page context
 */
export function setPageTitle(team?: string, page?: string): void {
  const baseTitle = getBaseTitle();
  let title = baseTitle;
  
  if (team && page) {
    // Format: "Engineering - Open Questions | AMA App"
    const teamName = capitalizeFirst(team);
    const pageName = capitalizeFirst(page);
    title = `${teamName} - ${pageName} | ${baseTitle}`;
  } else if (team) {
    // Format: "Engineering | AMA App"
    const teamName = capitalizeFirst(team);
    title = `${teamName} | ${baseTitle}`;
  } else if (page) {
    // Format: "Open Questions | AMA App"
    const pageName = capitalizeFirst(page);
    title = `${pageName} | ${baseTitle}`;
  }
  
  document.title = title;
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Page name mappings for better display
 */
export const PAGE_NAMES: Record<string, string> = {
  'open': 'Open Questions',
  'answered': 'Answered Questions',
  'admin': 'Admin Panel',
  'submit': 'Submit Question',
  'login': 'Admin Login'
};

/**
 * Team name mappings for better display
 */
export const TEAM_NAMES: Record<string, string> = {
  'all': 'All Teams',
  'engineering': 'Engineering',
  'product': 'Product',
  'people': 'People',
  'general': 'General'
};

/**
 * Set title with proper team and page name formatting
 */
export function setFormattedPageTitle(teamSlug?: string, pageSlug?: string): void {
  const teamName = teamSlug ? TEAM_NAMES[teamSlug] || capitalizeFirst(teamSlug) : undefined;
  const pageName = pageSlug ? PAGE_NAMES[pageSlug] || capitalizeFirst(pageSlug) : undefined;
  
  setPageTitle(teamName, pageName);
}
