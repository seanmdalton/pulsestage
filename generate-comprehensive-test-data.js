#!/usr/bin/env node

const API_BASE = 'http://localhost:3000';

// Comprehensive test data for each team
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
    'When will the annual performance reviews be conducted?',
    'What is our dress code policy?',
    'How do we handle company equipment when working remotely?',
    'What are the procedures for reporting workplace issues?',
    'Can we get standing desks in the office?',
    'What is our policy on personal use of company resources?',
    'How do we handle confidential information?',
    'What are the emergency procedures for the office?',
    'Can we bring pets to the office?',
    'What is our policy on social media usage?',
    'How do we handle time tracking and attendance?',
    'What are the guidelines for company events and celebrations?',
    'How do we handle vendor relationships and procurement?'
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
    'Can we implement automated testing in our CI/CD pipeline?',
    'How do we handle API versioning and backwards compatibility?',
    'What is our strategy for monitoring and observability?',
    'How do we manage secrets and environment variables?',
    'What are the guidelines for third-party library usage?',
    'How do we handle performance optimization?',
    'What is our approach to documentation and knowledge sharing?',
    'Can we implement feature flags for gradual rollouts?',
    'How do we handle cross-team technical dependencies?',
    'What are the best practices for error handling and logging?',
    'How do we ensure code quality and maintainability?'
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
    'How do we decide which features to deprecate?',
    'What is our competitive analysis process?',
    'How do we handle user research and usability testing?',
    'What are the guidelines for product documentation?',
    'How do we manage product backlogs and sprint planning?',
    'What is our approach to internationalization and localization?',
    'How do we handle product analytics and data collection?',
    'What are the criteria for launching new features?',
    'How do we manage product partnerships and integrations?',
    'What is our strategy for user retention and engagement?',
    'How do we handle product security and privacy requirements?',
    'What are the processes for product discovery and validation?',
    'How do we coordinate product releases across teams?'
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
    'How do we support career transitions within the company?',
    'What are the guidelines for conducting interviews?',
    'How do we handle employee feedback and surveys?',
    'What is our approach to onboarding new employees?',
    'How do we manage employee recognition and rewards?',
    'What are the procedures for handling grievances?',
    'How do we support work-life balance?',
    'What is our policy on continuing education and certifications?',
    'How do we handle employee referrals and recruitment?',
    'What are the guidelines for remote work and collaboration?',
    'How do we manage organizational change and communication?'
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
    'Database migrations must be backward compatible and tested in staging first. Use our migration checklist.'
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
    'PIPs are collaborative improvement plans with clear goals, timeline, and support. HR will guide the process.'
  ]
};

// Helper function to get random date in the past (for questions)
function getRandomPastDate(maxDaysAgo) {
  const date = new Date();
  const daysAgo = Math.floor(Math.random() * maxDaysAgo);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

// Helper function to get random response date after question date
function getRandomResponseDate(questionDate, maxDaysLater = 7) {
  const responseDate = new Date(questionDate);
  const daysLater = Math.floor(Math.random() * maxDaysLater) + 1;
  responseDate.setDate(responseDate.getDate() + daysLater);
  return responseDate;
}

// Helper function to make API calls with retry logic
async function apiCall(endpoint, method = 'GET', body = null, retries = 3) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, options);
      
      if (response.status === 429) {
        console.log(`    ⏳ Rate limited (attempt ${attempt}/${retries}), waiting 65 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 65000)); // Wait 65 seconds for rate limit reset
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`    ⚠️  Attempt ${attempt} failed, retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Create a question
async function createQuestion(body, teamId) {
  return apiCall('/questions', 'POST', { body, teamId });
}

// Generate upvotes for a question (with proper rate limiting)
async function addUpvotes(questionId, count) {
  console.log(`    👍 Adding ${count} upvotes...`);
  for (let i = 0; i < count; i++) {
    try {
      await apiCall(`/questions/${questionId}/upvote`, 'POST');
      // Wait 7 seconds between upvotes (10 per minute = 6 seconds, adding buffer)
      if (i < count - 1) { // Don't wait after the last upvote
        await new Promise(resolve => setTimeout(resolve, 7000));
      }
    } catch (error) {
      console.error(`    ❌ Failed to add upvote ${i + 1}: ${error.message}`);
    }
  }
}

// Login as admin to respond to questions
async function adminLogin() {
  try {
    const adminKey = process.env.ADMIN_KEY || 'dev-admin-key-change-me';
    return await apiCall('/admin/login', 'POST', { adminKey });
  } catch (error) {
    console.error('❌ Failed to login as admin:', error.message);
    throw error;
  }
}

// Respond to a question as admin
async function respondToQuestion(questionId, response) {
  return apiCall(`/questions/${questionId}/respond`, 'POST', { response });
}

async function generateComprehensiveTestData() {
  console.log('🌱 Generating comprehensive test data for all teams...');
  console.log('📅 This will create questions spread over several weeks with answered questions');
  console.log('⏰ This process will take a while due to rate limiting (approximately 30-45 minutes)');
  console.log('');
  
  // Login as admin first
  console.log('🔐 Logging in as admin...');
  await adminLogin();
  console.log('✅ Admin login successful');
  
  // Get all teams
  const teams = await apiCall('/teams');
  console.log(`Found ${teams.length} teams:`, teams.map(t => t.name).join(', '));
  
  for (const team of teams) {
    console.log(`\n📋 Generating comprehensive data for ${team.name} team...`);
    
    const questions = teamQuestions[team.slug] || [];
    const responses = teamResponses[team.slug] || [];
    
    if (questions.length === 0) {
      console.log(`  ⚠️  No test data defined for ${team.slug}, skipping...`);
      continue;
    }
    
    const createdQuestions = [];
    
    // Create all questions for this team
    for (let i = 0; i < questions.length; i++) {
      const questionBody = questions[i];
      const upvoteCount = Math.floor(Math.random() * 12) + 1; // 1-12 upvotes
      
      try {
        console.log(`  📝 Creating question ${i + 1}/${questions.length}: "${questionBody.substring(0, 50)}..."`);
        
        // Create question
        const question = await apiCall('/questions', 'POST', { body: questionBody, teamId: team.id });
        createdQuestions.push(question);
        
        // Wait 7 seconds to respect rate limiting
        await new Promise(resolve => setTimeout(resolve, 7000));
        
        // Add upvotes
        await addUpvotes(question.id, upvoteCount);
        
        // Additional wait between questions
        console.log(`    ⏳ Waiting 5 seconds before next question...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error(`  ❌ Failed to create question: ${error.message}`);
      }
    }
    
    // Answer 8-10 random questions from this team
    const questionsToAnswer = Math.min(10, Math.max(8, Math.floor(createdQuestions.length * 0.5)));
    const shuffledQuestions = [...createdQuestions].sort(() => Math.random() - 0.5);
    const questionsForAnswering = shuffledQuestions.slice(0, questionsToAnswer);
    
    console.log(`  💬 Answering ${questionsForAnswering.length} questions...`);
    
    for (let i = 0; i < questionsForAnswering.length; i++) {
      const question = questionsForAnswering[i];
      const responseText = responses[Math.floor(Math.random() * responses.length)];
      
      try {
        console.log(`    📝 Answering question ${i + 1}/${questionsForAnswering.length}: "${question.body.substring(0, 50)}..."`);
        
        await respondToQuestion(question.id, responseText);
        
        // Wait between responses
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error(`    ❌ Failed to answer question: ${error.message}`);
      }
    }
  }
  
  // Create some general questions (no team assignment)
  console.log('\n🌐 Creating general questions (no team assignment)...');
  const generalQuestions = [
    'What is the company\'s stance on artificial intelligence and automation?',
    'How can we improve cross-team collaboration and communication?',
    'What are the plans for office expansion or relocation?',
    'Can we get a company-wide communication platform for announcements?',
    'What is our environmental sustainability and corporate responsibility policy?',
    'How do we handle customer feedback and feature requests?',
    'What are the guidelines for external partnerships and vendor relationships?'
  ];
  
  const generalResponses = [
    'We\'re actively exploring AI tools to enhance productivity while ensuring ethical use and job security for our team.',
    'We\'re implementing new cross-team sync meetings and shared project boards to improve collaboration.',
    'Office expansion plans will be shared in Q2. We\'re evaluating several locations based on team feedback.',
    'A company-wide Slack workspace is being set up with dedicated channels for announcements and updates.',
    'Our sustainability policy includes carbon offset programs, recycling initiatives, and green energy usage.',
    'Customer feedback is collected through multiple channels and reviewed weekly by the product team.',
    'Partnership guidelines are available in the business development handbook. All partnerships require legal review.'
  ];
  
  for (let i = 0; i < generalQuestions.length; i++) {
    const questionBody = generalQuestions[i];
    const shouldAnswer = Math.random() > 0.4; // 60% chance of being answered
    
    try {
      console.log(`  📝 Creating general question ${i + 1}/${generalQuestions.length}: "${questionBody.substring(0, 50)}..."`);
      
      const question = await createQuestion(questionBody, null); // No team assignment
      
      // Wait and add upvotes
      await new Promise(resolve => setTimeout(resolve, 7000));
      const upvoteCount = Math.floor(Math.random() * 8) + 1;
      await addUpvotes(question.id, upvoteCount);
      
      // Answer some general questions
      if (shouldAnswer) {
        const responseText = generalResponses[Math.floor(Math.random() * generalResponses.length)];
        console.log(`    💬 Answering general question...`);
        await respondToQuestion(question.id, responseText);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`  ❌ Failed to create general question: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Comprehensive test data generation completed!');
  console.log('\n📊 Final Summary:');
  
  // Get final counts
  const finalTeams = await apiCall('/teams');
  for (const team of finalTeams) {
    console.log(`  • ${team.name}: ${team._count?.questions || 0} questions`);
  }
  
  console.log('\n🔍 You can now test:');
  console.log('  • Team filtering on all pages');
  console.log('  • Search functionality within teams');
  console.log('  • Weekly grouping for answered questions');
  console.log('  • Question modals and upvoting');
  console.log('  • Team selector dropdown with accurate counts');
  console.log('  • Admin panel with team management');
}

// Run the script
generateComprehensiveTestData().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
