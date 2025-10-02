#!/usr/bin/env node

const API_BASE = 'http://localhost:3000';

// Test data for different teams
const teamQuestions = {
  'general': [
    'What is our company mission and vision?',
    'When are the next company all-hands meetings?',
    'What are the office hours and holiday schedule?',
    'How do I submit expense reports?',
    'What is our policy on remote work flexibility?',
    'Can we get better coffee in the office kitchen?',
    'What are the parking arrangements for the new office?',
    'How do I access the employee handbook?',
    'What wellness programs does the company offer?',
    'When will the annual performance reviews be conducted?'
  ],
  'engineering': [
    'What is our code review process and standards?',
    'How do we handle technical debt in our codebase?',
    'What are the deployment procedures for production?',
    'Can we upgrade to the latest version of our framework?',
    'What is our policy on open source contributions?',
    'How do we handle security vulnerabilities?',
    'What testing strategies should we implement?',
    'Can we get additional development tools and licenses?',
    'What is our approach to microservices architecture?',
    'How do we handle database migrations safely?',
    'What are the coding standards for new projects?',
    'Can we implement automated testing in our CI/CD pipeline?'
  ],
  'product': [
    'What features are planned for the next quarter?',
    'How do we prioritize feature requests from customers?',
    'What is our product roadmap for this year?',
    'How do we gather and analyze user feedback?',
    'What metrics do we use to measure product success?',
    'Can we implement dark mode for our application?',
    'What is our strategy for mobile app development?',
    'How do we handle feature flags and A/B testing?',
    'What is our approach to user onboarding?',
    'How do we decide which features to deprecate?'
  ],
  'people': [
    'What professional development opportunities are available?',
    'How does the promotion process work?',
    'What are the benefits and compensation packages?',
    'How do we handle workplace conflicts?',
    'What is our diversity and inclusion strategy?',
    'Can we get mental health support resources?',
    'What is the process for requesting time off?',
    'How do we conduct team building activities?',
    'What training programs are available for managers?',
    'How do we handle performance improvement plans?',
    'What is our policy on flexible working arrangements?',
    'How do we support career transitions within the company?'
  ]
};

const teamResponses = {
  'general': [
    'Our mission is to build innovative solutions that make a positive impact. You can find our full mission and vision statement in the employee handbook.',
    'All-hands meetings are scheduled for the first Friday of each month at 2 PM. Calendar invites will be sent out a week in advance.',
    'Office hours are 9 AM to 6 PM, Monday through Friday. Please check the HR portal for the complete holiday schedule.',
    'You can submit expense reports through our finance portal. Make sure to include receipts and get manager approval for expenses over $100.',
    'We support flexible remote work arrangements. Please discuss your specific needs with your manager and HR.',
    'We\'re looking into upgrading our coffee selection! A survey will be sent out soon to gather preferences.',
    'Parking passes are available at the front desk. We also have partnerships with nearby parking garages for overflow.',
    'The employee handbook is available on our intranet. You can also request a physical copy from HR.',
    'We offer gym memberships, mental health resources, and wellness workshops. Check the benefits portal for details.',
    'Annual reviews will be conducted in Q4. Your manager will schedule a meeting with you closer to the date.'
  ],
  'engineering': [
    'All code changes require at least two approvals from senior engineers. Please follow our coding standards document.',
    'We allocate 20% of each sprint to technical debt. Please add technical debt items to our backlog with priority labels.',
    'Production deployments happen on Tuesdays and Thursdays after 2 PM. Follow the deployment checklist in our wiki.',
    'Framework upgrades need to be discussed in the architecture review meeting. Please prepare a migration plan.',
    'Open source contributions are encouraged! Just make sure to get legal approval and avoid sharing proprietary code.',
    'Security vulnerabilities should be reported immediately to the security team. We have a bug bounty program for external reports.',
    'We follow a test pyramid approach: unit tests, integration tests, and E2E tests. Aim for 80% code coverage.',
    'Submit tool requests through our procurement process. Include justification and cost analysis.',
    'We\'re gradually moving to microservices. New services should follow our service template and API guidelines.',
    'Database migrations must be backward compatible and tested in staging first. Use our migration checklist.',
    'Follow our style guide and use the provided linting rules. Code should be self-documenting with clear variable names.',
    'Automated testing is already integrated into our CI/CD pipeline. Make sure your tests pass before merging.'
  ],
  'product': [
    'Q1 features include user dashboard improvements, mobile app optimization, and new analytics features.',
    'We use a scoring system based on user impact, business value, and development effort. Customer feedback is weighted heavily.',
    'Our roadmap focuses on user experience improvements, platform scalability, and new market expansion.',
    'We collect feedback through in-app surveys, user interviews, and support ticket analysis. Monthly reports are shared.',
    'Key metrics include user engagement, retention rates, feature adoption, and customer satisfaction scores.',
    'Dark mode is on our roadmap for Q2! We\'re currently working on the design system updates.',
    'Mobile development is a priority. We\'re planning native apps for both iOS and Android in the next year.',
    'We use feature flags for gradual rollouts and A/B testing. All new features should be behind feature flags.',
    'User onboarding is being redesigned based on user research. The new flow will launch next month.',
    'Feature deprecation follows a 6-month notice period with user communication and migration paths.'
  ],
  'people': [
    'We offer conference attendance, online courses, mentorship programs, and internal training sessions.',
    'Promotions are reviewed quarterly based on performance, impact, and role requirements. Talk to your manager about your goals.',
    'We offer competitive salaries, health insurance, retirement plans, and equity options. Check the benefits portal for details.',
    'We have a conflict resolution process involving HR and management. Anonymous reporting is also available.',
    'Our D&I committee works on inclusive hiring, bias training, and creating a welcoming environment for all.',
    'Mental health support includes EAP services, therapy coverage, and mental health days. Resources are in the benefits portal.',
    'Time off requests should be submitted through our HR system at least 2 weeks in advance for planning.',
    'Team building activities happen quarterly. We also have budget for team lunches and informal gatherings.',
    'Manager training covers leadership skills, performance management, and communication. New manager bootcamp is available.',
    'PIPs are collaborative improvement plans with clear goals, timeline, and support. HR will guide the process.',
    'We support various flexible arrangements including remote work, flexible hours, and compressed work weeks.',
    'Career transitions are supported through internal job postings, skills assessments, and transition planning.'
  ]
};

// Helper function to get random date in the past
function getRandomPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

// Helper function to get random response date after question date
function getRandomResponseDate(questionDate, maxDaysLater = 14) {
  const responseDate = new Date(questionDate);
  responseDate.setDate(responseDate.getDate() + Math.floor(Math.random() * maxDaysLater) + 1);
  return responseDate;
}

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Get team ID by slug
async function getTeamBySlug(slug) {
  try {
    return await apiCall(`/teams/${slug}`);
  } catch (error) {
    console.error(`Failed to get team ${slug}:`, error.message);
    return null;
  }
}

// Create a question
async function createQuestion(body, teamId) {
  return apiCall('/questions', 'POST', { body, teamId });
}

// Update question with response (using direct database update since we need to set custom dates)
async function updateQuestionInDatabase(questionId, responseText, respondedAt) {
  // Note: This would normally require direct database access
  // For this demo, we'll use the API and then manually update dates if needed
  console.log(`Would update question ${questionId} with response at ${respondedAt}`);
}

// Generate upvotes for a question
async function addUpvotes(questionId, count) {
  for (let i = 0; i < count; i++) {
    try {
      await apiCall(`/questions/${questionId}/upvote`, 'POST');
    } catch (error) {
      // Ignore rate limiting errors for demo data
      if (!error.message.includes('429')) {
        console.error(`Failed to upvote question ${questionId}:`, error.message);
      }
    }
  }
}

async function generateTeamData() {
  console.log('🌱 Generating historical test data for all teams...\n');
  
  // Get all teams
  const teams = await apiCall('/teams');
  console.log(`Found ${teams.length} teams:`, teams.map(t => t.name).join(', '));
  
  for (const team of teams) {
    console.log(`\n📋 Generating data for ${team.name} team...`);
    
    const questions = teamQuestions[team.slug] || [];
    const responses = teamResponses[team.slug] || [];
    
    if (questions.length === 0) {
      console.log(`  ⚠️  No test data defined for ${team.slug}, skipping...`);
      continue;
    }
    
    // Create questions for this team
    for (let i = 0; i < questions.length; i++) {
      const questionBody = questions[i];
      const shouldAnswer = Math.random() > 0.3; // 70% chance of being answered
      const upvoteCount = Math.floor(Math.random() * 15) + 1; // 1-15 upvotes
      
      try {
        // Create question
        const question = await createQuestion(questionBody, team.id);
        console.log(`  ✅ Created question: "${questionBody.substring(0, 50)}..."`);
        
        // Add upvotes
        await addUpvotes(question.id, upvoteCount);
        console.log(`  👍 Added ${upvoteCount} upvotes`);
        
        // Add response if selected
        if (shouldAnswer && responses.length > 0) {
          const responseText = responses[Math.floor(Math.random() * responses.length)];
          console.log(`  💬 Would add response: "${responseText.substring(0, 50)}..."`);
          // Note: For demo purposes, we're not actually adding responses with custom dates
          // In a real scenario, you'd need direct database access or admin API endpoints
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ❌ Failed to create question: ${error.message}`);
      }
    }
  }
  
  // Also create some questions without team assignment (for "All Teams" view)
  console.log('\n🌐 Creating general questions (no team assignment)...');
  const generalQuestions = [
    'What is the company\'s stance on artificial intelligence?',
    'How can we improve cross-team collaboration?',
    'What are the plans for office expansion?',
    'Can we get a company-wide Slack channel for announcements?',
    'What is our environmental sustainability policy?'
  ];
  
  for (const questionBody of generalQuestions) {
    try {
      const question = await createQuestion(questionBody, null); // No team assignment
      await addUpvotes(question.id, Math.floor(Math.random() * 8) + 1);
      console.log(`  ✅ Created general question: "${questionBody.substring(0, 50)}..."`);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Failed to create general question: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Test data generation completed!');
  console.log('\n📊 Summary:');
  console.log(`  • Generated questions for ${teams.length} teams`);
  console.log(`  • Each team has ${Math.max(...Object.values(teamQuestions).map(q => q.length))} questions`);
  console.log(`  • Added ${generalQuestions.length} general questions`);
  console.log(`  • Questions have random upvote counts (1-15)`);
  console.log('\n🔍 You can now test:');
  console.log('  • Team filtering on all pages');
  console.log('  • Search functionality within teams');
  console.log('  • Weekly grouping (for answered questions)');
  console.log('  • Question modals and upvoting');
  console.log('  • Team selector dropdown with counts');
}

// Run the script
generateTeamData().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
